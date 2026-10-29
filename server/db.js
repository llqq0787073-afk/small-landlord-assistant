// SQLite persistence layer (Node built-in node:sqlite, no native add-on).
// Database file: DATABASE_PATH env or ./data/app.db
// Seed data (server/seed.json, derived from the old frontend demo seed) is
// imported ONLY when the users table is empty. Deleting data/app.db therefore
// restores the demo portfolio once; it never overwrites existing user data.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || join(__dirname, '..', 'data', 'app.db');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

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

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT, role TEXT NOT NULL, roles TEXT NOT NULL DEFAULT '[]',
  phone TEXT DEFAULT '', preferred_language TEXT DEFAULT 'zh',
  unit_id TEXT, property_id TEXT, status TEXT DEFAULT 'active',
  email_verified INTEGER DEFAULT 0, mfa_enabled INTEGER DEFAULT 0,
  created_at TEXT, last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS landlord_accounts (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS account_members (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tenancy_members (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tenant_invitations (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS platform_admins (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_audit_events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS properties (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tenancies (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rent_charges (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rent_payments (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ledger_adjustments (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS maintenance_tickets (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS inspections (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS subscription_plans (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY, email TEXT NOT NULL, token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT
);
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY, email TEXT NOT NULL, token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`);

function tableRows(table) {
  return db.prepare(`SELECT data FROM ${table}`).all().map((r) => P(r.data, null)).filter(Boolean);
}
function upsert(table, obj) {
  db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`).run(obj.id, J(obj));
}
function remove(table, id) {
  db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
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
export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE lower(email)=lower(?)').get(email) || null;
}
export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id=?').get(id) || null;
}
export function createUser(profile, passwordHash) {
  db.prepare(`INSERT INTO users (id,name,email,password_hash,role,roles,phone,preferred_language,unit_id,property_id,status,email_verified,mfa_enabled,created_at,last_login_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    profile.id, profile.name, profile.email.toLowerCase(), passwordHash, profile.role,
    J(profile.roles || [profile.role]), profile.phone || '', profile.preferredLanguage || 'zh',
    profile.unitId || null, profile.propertyId || null, profile.status || 'active',
    profile.emailVerified ? 1 : 0, 0, profile.createdAt || new Date().toISOString(),
    profile.lastLoginAt || null);
  return getUserById(profile.id);
}
export function updateUser(id, patch) {
  const u = getUserById(id);
  if (!u) return null;
  const next = { ...u, ...patch };
  db.prepare(`UPDATE users SET name=?, phone=?, preferred_language=?, unit_id=?, property_id=?, status=?, email_verified=?, last_login_at=?, password_hash=? WHERE id=?`).run(
    next.name, next.phone || '', next.preferred_language || 'zh', next.unit_id || null, next.property_id || null,
    next.status, next.email_verified ? 1 : 0, next.last_login_at || null, next.password_hash, id);
  return getUserById(id);
}

export function addAuthEvent(event) {
  upsert('auth_audit_events', { id: event.id || `aev_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ...event, timestamp: event.timestamp || new Date().toISOString() });
}
export function addAuditLog(log) {
  upsert('audit_logs', { id: log.id || `aud_${Date.now()}`, ...log, timestamp: log.timestamp || new Date().toISOString() });
}

export function loadAll(user) {
  const isAdmin = user.role === 'admin';
  const isTenant = user.role === 'tenant';
  let properties = tableRows('properties');
  let units = tableRows('units');
  let tenancies = tableRows('tenancies');
  let charges = tableRows('rent_charges').map((c) => ({ ...c, status: computeChargeStatus(c) }));
  let payments = tableRows('rent_payments');
  let tickets = tableRows('maintenance_tickets');
  let tasks = tableRows('tasks');
  let inspections = tableRows('inspections');
  let conversations = tableRows('conversations');
  let messages = tableRows('messages');
  let documents = tableRows('documents');
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
  return {
    currentUser: publicUser(user),
    profiles: isAdmin ? db.prepare('SELECT * FROM users').all().map(publicUser) : [publicUser(user)],
    landlordAccounts: tableRows('landlord_accounts'),
    accountMembers: isAdmin ? tableRows('account_members') : tableRows('account_members').filter((m) => m.userId === user.id),
    tenancyMembers: tableRows('tenancy_members').filter((m) => isAdmin || m.userId === user.id || !isTenant),
    tenantInvitations: isAdmin || user.role === 'landlord' ? tableRows('tenant_invitations') : [],
    platformAdmins: tableRows('platform_admins'),
    authAuditEvents: isAdmin ? tableRows('auth_audit_events') : tableRows('auth_audit_events').filter((e) => e.userId === user.id),
    properties, units, tenancies, rentCharges: charges, payments,
    adjustments: tableRows('ledger_adjustments'),
    maintenanceTickets: tickets, tasks, inspections, conversations, messages,
    documents,
    auditLogs: isAdmin ? tableRows('audit_logs') : tableRows('audit_logs'),
    subscriptionPlans: tableRows('subscription_plans'),
    activePlanId: 'standard',
  };
}

export const store = {
  get: (table, id) => tableRows(table).find((r) => r.id === id) || null,
  all: tableRows, upsert, remove,
};

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return;
  const seedPath = join(__dirname, 'seed.json');
  if (!existsSync(seedPath)) return;
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  // Demo accounts only: password is set from DEMO_PASSWORD env, defaulting to
  // the documented local-demo password. This is NOT a production credential
  // and must be changed / removed before any shared deployment.
  const demoHash = bcrypt.hashSync(process.env.DEMO_PASSWORD || 'DemoPass123', 10);
  for (const p of seed.profiles) {
    // MFA is not implemented in phase 1: seed users start with MFA off so
    // there is no fake MFA backdoor. The MFA page explains this.
    createUser({ ...p, mfaEnabled: false }, demoHash);
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
  for (const [table, rows] of map) for (const r of rows || []) upsert(table, r);
  // Fix the seed's fake invitation hash: store a real SHA-256 of the code.
  for (const inv of seed.tenantInvitations || []) {
    upsert('tenant_invitations', { ...inv, codeHash: createHash('sha256').update(inv.invitationCode).digest('hex') });
  }
  db.prepare("INSERT OR REPLACE INTO meta (key,value) VALUES ('seeded_at',?)").run(new Date().toISOString());
  console.log('[server] Seeded demo data into empty database (demo users only).');
}
seedIfEmpty();
