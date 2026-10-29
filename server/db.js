// Postgres persistence layer (node-postgres `pg`, async).
// Connection comes ONLY from the DATABASE_URL environment variable
// (e.g. postgresql://user:pass@host:5432/db or a Supabase connection
// string). The server refuses to start without it.
// SSL is enabled automatically for Supabase hosts (or PGSSL=require).
// Seed data (server/seed.json, derived from the old frontend demo seed) is
// imported ONLY when the users table is empty. It never overwrites
// existing user data.
//
// Startup collision guard: the target database may already contain
// same-named tables (properties, tenancies, rent_charges, rent_payments,
// maintenance_tickets, inspections, messages, conversations, audit_logs,
// account_members, landlord_accounts, platform_admins, ...) with a
// DIFFERENT schema (e.g. a relational Supabase schema). For every table this
// file defines we compare information_schema.columns against our expected
// columns: an incompatible but EMPTY table is dropped and recreated with our
// definition (loud warning); an incompatible NON-EMPTY table aborts startup
// with an actionable error. We never silently continue and never auto-drop a
// table that holds data.
import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('[server] FATAL: DATABASE_URL is not set. Set it to a Postgres connection string (e.g. postgresql://user:pass@host:5432/db) and restart.');
  process.exit(1);
}

const useSsl = (process.env.DATABASE_URL || '').includes('supabase.co') || process.env.PGSSL === 'require';
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Raw parameterized query helper for index.js (values are always bound via
// $1, $2, ... — never interpolated into the SQL text).
export async function q(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}

export function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// Overdue is derived, never stored as a user-entered value: an unpaid/partial
// charge whose dueDate is before today is overdue.
export function computeChargeStatus(charge) {
  if (charge.paidAmount >= charge.amount) return 'paid';
  if (charge.dueDate && charge.dueDate < todayStr()) return 'overdue';
  if (charge.paidAmount > 0) return 'partial';
  return 'unpaid';
}

const J = (v) => JSON.stringify(v ?? null);
const P = (v, fallback) => {
  if (v === null || v === undefined) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
};

// ---- Schema ----------------------------------------------------------------
const DDL = {
  users: `CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT, role TEXT NOT NULL, roles TEXT NOT NULL DEFAULT '[]',
  phone TEXT DEFAULT '', preferred_language TEXT DEFAULT 'zh',
  unit_id TEXT, property_id TEXT, status TEXT DEFAULT 'active',
  email_verified INTEGER DEFAULT 0, mfa_enabled INTEGER DEFAULT 0,
  created_at TEXT, last_login_at TEXT
)`,
  email_verifications: `CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY, email TEXT NOT NULL, token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT
)`,
  password_resets: `CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY, email TEXT NOT NULL, token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT
)`,
  meta: `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`,
};
// Document tables: full object stored as JSON in `data`, keyed by `id`.
const DOC_TABLES = [
  'landlord_accounts', 'account_members', 'tenancy_members', 'tenant_invitations',
  'platform_admins', 'auth_audit_events', 'properties', 'units', 'tenancies',
  'rent_charges', 'rent_payments', 'ledger_adjustments', 'maintenance_tickets',
  'tasks', 'inspections', 'conversations', 'messages', 'documents', 'audit_logs',
  'subscription_plans',
];
for (const t of DOC_TABLES) {
  DDL[t] = `CREATE TABLE IF NOT EXISTS ${t} (id TEXT PRIMARY KEY, data TEXT NOT NULL)`;
}

// Expected columns per table, used by the startup collision guard.
const TABLE_COLUMNS = {
  users: ['id', 'name', 'email', 'password_hash', 'role', 'roles', 'phone', 'preferred_language', 'unit_id', 'property_id', 'status', 'email_verified', 'mfa_enabled', 'created_at', 'last_login_at'],
  email_verifications: ['id', 'email', 'token_hash', 'expires_at', 'used', 'created_at'],
  password_resets: ['id', 'email', 'token_hash', 'expires_at', 'used', 'created_at'],
  meta: ['key', 'value'],
};
for (const t of DOC_TABLES) TABLE_COLUMNS[t] = ['id', 'data'];

// Table names interpolated into SQL below always come from the fixed
// DOC_TABLES allowlist (never from user input).
function assertDocTable(table) {
  if (!DOC_TABLES.includes(table)) throw new Error(`[server] unknown document table: ${table}`);
}

async function tableRows(table) {
  assertDocTable(table);
  const rows = await q(`SELECT data FROM "${table}"`);
  return rows.map((r) => P(r.data, null)).filter(Boolean);
}
async function upsert(table, obj) {
  assertDocTable(table);
  await q(`INSERT INTO "${table}" (id, data) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data`, [obj.id, J(obj)]);
}
async function remove(table, id) {
  assertDocTable(table);
  await q(`DELETE FROM "${table}" WHERE id=$1`, [id]);
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    roles: P(u.roles, [u.role]), phone: u.phone || '',
    preferredLanguage: u.preferred_language || 'zh',
    unitId: u.unit_id || undefined, propertyId: u.property_id || undefined,
    status: u.status, emailVerified: !!u.email_verified, mfaEnabled: false,
    createdAt: u.created_at, lastLoginAt: u.last_login_at,
  };
}
export async function getUserByEmail(email) {
  const rows = await q('SELECT * FROM users WHERE lower(email)=lower($1)', [email]);
  return rows[0] || null;
}
export async function getUserById(id) {
  const rows = await q('SELECT * FROM users WHERE id=$1', [id]);
  return rows[0] || null;
}
export async function createUser(profile, passwordHash) {
  await q(`INSERT INTO users (id,name,email,password_hash,role,roles,phone,preferred_language,unit_id,property_id,status,email_verified,mfa_enabled,created_at,last_login_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [profile.id, profile.name, profile.email.toLowerCase(), passwordHash, profile.role,
      J(profile.roles || [profile.role]), profile.phone || '', profile.preferredLanguage || 'zh',
      profile.unitId || null, profile.propertyId || null, profile.status || 'active',
      profile.emailVerified ? 1 : 0, 0, profile.createdAt || new Date().toISOString(),
      profile.lastLoginAt || null]);
  return getUserById(profile.id);
}
export async function updateUser(id, patch) {
  const u = await getUserById(id);
  if (!u) return null;
  const next = { ...u, ...patch };
  await q(`UPDATE users SET name=$1, phone=$2, preferred_language=$3, unit_id=$4, property_id=$5, status=$6, email_verified=$7, last_login_at=$8, password_hash=$9 WHERE id=$10`,
    [next.name, next.phone || '', next.preferred_language || 'zh', next.unit_id || null, next.property_id || null,
      next.status, next.email_verified ? 1 : 0, next.last_login_at || null, next.password_hash, id]);
  return getUserById(id);
}

export async function addAuthEvent(event) {
  await upsert('auth_audit_events', { id: event.id || `aev_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ...event, timestamp: event.timestamp || new Date().toISOString() });
}
export async function addAuditLog(log) {
  await upsert('audit_logs', { id: log.id || `aud_${Date.now()}`, ...log, timestamp: log.timestamp || new Date().toISOString() });
}

export async function loadAll(user) {
  const isAdmin = user.role === 'admin';
  const isTenant = user.role === 'tenant';
  let properties = await tableRows('properties');
  let units = await tableRows('units');
  let tenancies = await tableRows('tenancies');
  let charges = (await tableRows('rent_charges')).map((c) => ({ ...c, status: computeChargeStatus(c) }));
  let payments = await tableRows('rent_payments');
  let tickets = await tableRows('maintenance_tickets');
  let tasks = await tableRows('tasks');
  let inspections = await tableRows('inspections');
  let conversations = await tableRows('conversations');
  let messages = await tableRows('messages');
  let documents = await tableRows('documents');
  if (!isAdmin && !isTenant) {
    // Landlord isolation: a landlord only sees their own properties and the
    // records attached to them. Seed properties have no landlordId column,
    // so they belong to the seed landlord (usr_landlord_1, David Miller).
    const ownsProp = (pr) => pr.landlordId ? pr.landlordId === user.id : user.id === 'usr_landlord_1';
    properties = properties.filter(ownsProp);
    const propIds = new Set(properties.map((pr) => pr.id));
    units = units.filter((u) => propIds.has(u.propertyId));
    const unitIds = new Set(units.map((u) => u.id));
    tenancies = tenancies.filter((x) => propIds.has(x.propertyId) || unitIds.has(x.unitId));
    charges = charges.filter((c) => propIds.has(c.propertyId) || unitIds.has(c.unitId));
    payments = payments.filter((x) => propIds.has(x.propertyId) || unitIds.has(x.unitId));
    tickets = tickets.filter((x) => propIds.has(x.propertyId) || unitIds.has(x.unitId));
    tasks = tasks.filter((x) => !x.propertyId || propIds.has(x.propertyId));
    inspections = inspections.filter((x) => propIds.has(x.propertyId) || unitIds.has(x.unitId));
    conversations = conversations.filter((c) => propIds.has(c.propertyId) || unitIds.has(c.unitId));
    const convIds = new Set(conversations.map((c) => c.id));
    messages = messages.filter((m) => convIds.has(m.conversationId));
    documents = documents.filter((d) => propIds.has(d.propertyId) || unitIds.has(d.unitId));
  }
  if (isTenant) {
    const uid = user.unit_id, pid = user.property_id;
    properties = properties.filter((p) => p.id === pid);
    units = units.filter((u) => u.id === uid);
    tenancies = tenancies.filter((t) => t.unitId === uid);
    charges = charges.filter((c) => c.unitId === uid);
    payments = payments.filter((p) => p.unitId === uid);
    tickets = tickets.filter((t) => t.unitId === uid);
    inspections = inspections.filter((i) => i.unitId === uid);
    conversations = conversations.filter((c) => c.tenantId === user.id || c.unitId === uid);
    const convIds = new Set(conversations.map((c) => c.id));
    messages = messages.filter((m) => convIds.has(m.conversationId));
    documents = documents.filter((d) => d.propertyId === pid || d.unitId === uid);
  }
  const userRows = await q('SELECT * FROM users');
  return {
    currentUser: publicUser(user),
    profiles: isAdmin ? userRows.map(publicUser) : [publicUser(user)],
    landlordAccounts: await tableRows('landlord_accounts'),
    accountMembers: isAdmin ? await tableRows('account_members') : (await tableRows('account_members')).filter((m) => m.userId === user.id),
    tenancyMembers: (await tableRows('tenancy_members')).filter((m) => isAdmin || m.userId === user.id || !isTenant),
    tenantInvitations: isAdmin || user.role === 'landlord' ? await tableRows('tenant_invitations') : [],
    platformAdmins: await tableRows('platform_admins'),
    authAuditEvents: isAdmin ? await tableRows('auth_audit_events') : (await tableRows('auth_audit_events')).filter((e) => e.userId === user.id),
    properties, units, tenancies, rentCharges: charges, payments,
    adjustments: await tableRows('ledger_adjustments'),
    maintenanceTickets: tickets, tasks, inspections, conversations, messages,
    documents,
    auditLogs: isAdmin ? await tableRows('audit_logs') : await tableRows('audit_logs'),
    subscriptionPlans: await tableRows('subscription_plans'),
    activePlanId: 'standard',
  };
}

export const store = {
  get: async (table, id) => (await tableRows(table)).find((r) => r.id === id) || null,
  all: tableRows, upsert, remove,
};

// For every table we define, compare information_schema.columns against our
// expected columns. Incompatible + EMPTY -> warn, drop, recreate.
// Incompatible + NON-EMPTY -> abort startup (never auto-drop data).
async function checkCollisions() {
  for (const [table, expected] of Object.entries(TABLE_COLUMNS)) {
    const colRows = await q(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      [table]);
    const actual = new Set(colRows.map((r) => r.column_name));
    const missing = expected.filter((c) => !actual.has(c));
    if (missing.length === 0) continue;
    const cnt = (await q(`SELECT COUNT(*)::int AS n FROM "${table}"`))[0].n;
    if (cnt === 0) {
      console.warn(`[server] WARNING: table "${table}" exists with an incompatible schema (missing columns: ${missing.join(', ')}). It is EMPTY, so it will be dropped and recreated with the app's schema.`);
      await q(`DROP TABLE "${table}"`);
      await q(DDL[table]);
    } else {
      console.error(`[server] FATAL: table "${table}" already exists with an incompatible schema (missing columns: ${missing.join(', ')}) and contains ${cnt} row(s). Refusing to start rather than risk data loss.`);
      console.error(`[server] FATAL: resolve this manually (rename the table, migrate its data, or empty it) and restart.`);
      process.exit(1);
    }
  }
}

async function seedIfEmpty() {
  const count = (await q('SELECT COUNT(*)::int AS n FROM users'))[0].n;
  if (count > 0) return;
  const seedPath = join(__dirname, 'seed.json');
  if (!existsSync(seedPath)) return;
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  // Demo accounts only: password is set from DEMO_PASSWORD env, defaulting to
  // the documented local-demo password. This is NOT a production credential
  // and must be changed / removed before any shared deployment.
  const demoHash = await bcrypt.hash(process.env.DEMO_PASSWORD || 'DemoPass123', 10);
  for (const p of seed.profiles) {
    // MFA is not implemented in phase 1: seed users start with MFA off so
    // there is no fake MFA backdoor. The MFA page explains this.
    await createUser({ ...p, mfaEnabled: false }, demoHash);
  }
  const map = [
    ['landlord_accounts', seed.landlordAccounts], ['account_members', seed.accountMembers],
    ['tenancy_members', seed.tenancyMembers], ['tenant_invitations', seed.tenantInvitations],
    ['platform_admins', seed.platformAdmins], ['auth_audit_events', seed.authAuditEvents],
    ['properties', seed.properties], ['units', seed.units], ['tenancies', seed.tenancies],
    ['rent_charges', seed.rentCharges], ['rent_payments', seed.rentPayments],
    ['maintenance_tickets', seed.maintenanceTickets], ['tasks', seed.tasks],
    ['inspections', seed.inspections], ['conversations', seed.conversations],
    ['messages', seed.messages], ['documents', seed.documents],
    ['audit_logs', seed.auditLogs], ['subscription_plans', seed.subscriptionPlans],
  ];
  for (const [table, rows] of map) for (const r of rows || []) await upsert(table, r);
  // Fix the seed's fake invitation hash: store a real SHA-256 of the code.
  for (const inv of seed.tenantInvitations || []) {
    await upsert('tenant_invitations', { ...inv, codeHash: createHash('sha256').update(inv.invitationCode).digest('hex') });
  }
  await q(`INSERT INTO meta (key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`, ['seeded_at', new Date().toISOString()]);
  console.log('[server] Seeded demo data into empty database (demo users only).');
}

export async function initDb() {
  // node-postgres runs multiple statements in one simple-protocol query when
  // no parameters are bound.
  await q(Object.values(DDL).join(';\n'));
  await checkCollisions();
  await seedIfEmpty();
}
