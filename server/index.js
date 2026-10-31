// Small Landlord Assistant — real backend, phase 1.
// Express + PostgreSQL (pg) + bcryptjs + JWT.
// Secrets come only from environment variables; see .env.example.
// The database connection comes ONLY from DATABASE_URL (see server/db.js).
// Email sending: production uses Resend (RESEND_API_KEY + EMAIL_FROM). In
// non-production without those vars, verification / reset tokens are printed
// to the backend terminal so a local tester can complete the flow. They are
// NEVER returned in an API response and NEVER rendered on any page.
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { store, getUserByEmail, getUserById, createUser, updateUser, publicUser, loadAll, addAuthEvent, addAuditLog, computeChargeStatus, q, initDb } from './db.js';

dotenv.config();

const PORT = Number(process.env.PORT || process.env.API_PORT || 3011);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[server] FATAL: JWT_SECRET must be set in production. Refusing to start.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) console.warn('[server] WARNING: JWT_SECRET is not set; using a dev-only fallback. Never use this in production.');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Production email is mandatory: without it, new users can never verify
// their accounts or reset passwords. Fail fast rather than run broken.
if (process.env.NODE_ENV === 'production' && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
  console.error('[server] FATAL: RESEND_API_KEY and EMAIL_FROM must be set in production (verification/reset emails). Refusing to start.');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const uid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const hashToken = (t) => createHash('sha256').update(t).digest('hex');
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
const strongPassword = (p) => typeof p === 'string' && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
const signToken = (user, role) => jwt.sign({ sub: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// ---------- Email (Resend) ----------
// Production: set RESEND_API_KEY and EMAIL_FROM (e.g. noreply@landlordassistant.us).
// Returns true if the email was accepted, false if email is not configured
// (local dev) or the send failed.
async function sendEmail(to, subject, text) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!r.ok) {
      console.error('[server] email send failed:', r.status, (await r.text().catch(() => '')).slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[server] email send error:', e && e.message);
    return false;
  }
}

async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'accountSuspendedNotice' });
    req.user = user;
    req.activeRole = payload.role && (JSON.parse(user.roles || '[]').includes(payload.role) || payload.role === user.role) ? payload.role : user.role;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.activeRole) && !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
async function auditAuth(req, type, details, userId, role) {
  await addAuthEvent({ userId, actorEmail: req.user?.email || '', actorRole: role || req.activeRole, eventType: type, ipAddress: req.ip || '', userAgent: (req.headers['user-agent'] || '').slice(0, 80), details });
}

app.get('/api/health', (req, res) => res.json({ ok: true, db: 'postgres' }));

// ---------- Auth ----------
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !isEmail(email) || !strongPassword(password)) return res.status(400).json({ error: 'invalidInput' });
  const clean = email.trim().toLowerCase();
  if (await getUserByEmail(clean)) return res.status(400).json({ error: 'emailAlreadyRegistered' });
  const id = uid('usr_landlord');
  const user = await createUser({ id, name: name.trim(), email: clean, role: 'landlord', roles: ['landlord'], phone: '', preferredLanguage: 'zh', status: 'pending_verification', emailVerified: false, createdAt: new Date().toISOString() }, bcrypt.hashSync(password, 10));
  await store.upsert('landlord_accounts', { id: uid('acct'), name: `${name.trim()}'s Rental Portfolio`, ownerId: id, planId: 'free_trial', maxUnits: 2, createdAt: new Date().toISOString().slice(0, 10) });
  await store.upsert('account_members', { id: uid('mem'), accountId: (await store.all('landlord_accounts')).find((a) => a.ownerId === id)?.id, userId: id, role: 'owner', joinedAt: new Date().toISOString() });
  const token = randomBytes(32).toString('hex');
  const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  await q('INSERT INTO email_verifications (id,email,token_hash,expires_at,created_at) VALUES ($1,$2,$3,$4,$5)', [uid('ev'), clean, hashToken(token), exp, new Date().toISOString()]);
  const emailed = await sendEmail(clean,
    'Verify your email — 小房东助手 Small Landlord Assistant',
    `Hi ${name.trim()},\n\nYour verification code is:\n\n    ${token}\n\nIt expires in 24 hours. Enter it on the verify-email page in the app.\n\n验证码：${token}（24 小时内有效），请在 App 的邮箱验证页输入。\n\n— Small Landlord Assistant 小房东助手`);
  if (!emailed && process.env.NODE_ENV !== 'production') console.log(`[dev-only] email verification token for ${clean}: ${token} (expires ${exp}; enter it on the verify-email page)`);
  if (!emailed) console.error(`[server] WARNING: verification email NOT sent to ${clean} (email not configured or send failed).`);
  await addAuthEvent({ userId: id, actorEmail: clean, actorRole: 'landlord', eventType: 'SIGNUP_LANDLORD', ipAddress: req.ip || '', userAgent: '', details: `New landlord account registered: ${name.trim()}` });
  res.json({ success: true, user: publicUser(user), pendingVerificationEmail: clean });
});

app.post('/api/auth/resend-verification', async (req, res) => {
  const clean = ((req.body || {}).email || '').trim().toLowerCase();
  const user = await getUserByEmail(clean);
  if (user && !user.email_verified) {
    const token = randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    await q('INSERT INTO email_verifications (id,email,token_hash,expires_at,created_at) VALUES ($1,$2,$3,$4,$5)', [uid('ev'), clean, hashToken(token), exp, new Date().toISOString()]);
    const emailed = await sendEmail(clean,
      'Verify your email — 小房东助手 Small Landlord Assistant',
      `Hi,\n\nYour verification code is:\n\n    ${token}\n\nIt expires in 24 hours. Enter it on the verify-email page in the app.\n\n验证码：${token}（24 小时内有效），请在 App 的邮箱验证页输入。\n\n— Small Landlord Assistant 小房东助手`);
    if (!emailed && process.env.NODE_ENV !== 'production') console.log(`[dev-only] email verification token for ${clean}: ${token} (expires ${exp})`);
    if (!emailed) console.error(`[server] WARNING: verification email NOT sent to ${clean} (email not configured or send failed).`);
  }
  res.json({ success: true });
});

app.post('/api/auth/verify-email', async (req, res) => {
  const { email, token } = req.body || {};
  if (!email || !token) return res.status(400).json({ error: 'invalidInput' });
  const clean = email.trim().toLowerCase();
  const row = (await q('SELECT * FROM email_verifications WHERE email=$1 AND used=0 ORDER BY created_at DESC', [clean]))[0];
  if (!row || row.token_hash !== hashToken(token) || new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'invalidVerificationToken' });
  await q('UPDATE email_verifications SET used=1 WHERE id=$1', [row.id]);
  const user = await getUserByEmail(clean);
  if (!user) return res.status(400).json({ error: 'invalidVerificationToken' });
  const updated = await updateUser(user.id, { email_verified: 1, status: 'active' });
  await addAuthEvent({ userId: user.id, actorEmail: clean, actorRole: user.role, eventType: 'EMAIL_VERIFIED', ipAddress: req.ip || '', userAgent: '', details: 'Email verified with a one-time token' });
  res.json({ success: true, user: publicUser(updated), token: signToken(updated, updated.role) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, portalRole } = req.body || {};
  const user = await getUserByEmail((email || '').trim());
  if (!user || !user.password_hash || !bcrypt.compareSync(password || '', user.password_hash)) {
    await addAuthEvent({ actorEmail: email || '', eventType: 'LOGIN_FAILED', ipAddress: req.ip || '', userAgent: '', details: 'Failed login attempt' });
    return res.status(401).json({ error: 'invalidCredentials' });
  }
  if (user.status === 'suspended') return res.status(403).json({ error: 'accountSuspendedNotice' });
  if (!user.email_verified) return res.status(403).json({ error: 'emailUnverifiedNotice', pendingVerificationEmail: user.email });
  const roles = JSON.parse(user.roles || '[]');
  if (portalRole && !roles.includes(portalRole)) return res.status(403).json({ error: 'roleNotAssigned' });
  // MFA is NOT implemented in phase 1 and must not be faked: there is no
  // code that grants access, and no demo code. Users with MFA on are told
  // explicitly; seed users are created with MFA off.
  if (user.mfa_enabled) return res.status(403).json({ error: 'mfaNotImplemented' });
  const role = portalRole || user.role;
  await updateUser(user.id, { last_login_at: new Date().toISOString() });
  await addAuthEvent({ userId: user.id, actorEmail: user.email, actorRole: role, eventType: 'LOGIN_SUCCESS', ipAddress: req.ip || '', userAgent: (req.headers['user-agent'] || '').slice(0, 80), details: `Authenticated into ${role} portal` });
  res.json({ success: true, user: publicUser(await getUserById(user.id)), role, token: signToken(user, role), requiresRoleSelect: roles.length > 1 && !portalRole });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user), role: req.activeRole }));
app.post('/api/auth/logout', auth, async (req, res) => { await auditAuth(req, 'LOGOUT', 'User logged out', req.user.id, req.activeRole); res.json({ success: true }); });
app.post('/api/auth/switch-role', auth, async (req, res) => {
  const { role } = req.body || {};
  const roles = JSON.parse(req.user.roles || '[]');
  if (!roles.includes(role)) return res.status(403).json({ error: 'roleNotAssigned' });
  await auditAuth(req, 'ROLE_SWITCHED', `Switched view to ${role}`, req.user.id, role);
  res.json({ success: true, role, token: signToken(req.user, role), user: publicUser(req.user) });
});
app.post('/api/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!bcrypt.compareSync(currentPassword || '', req.user.password_hash || '')) return res.status(400).json({ error: 'currentPasswordIncorrect' });
  if (!strongPassword(newPassword)) return res.status(400).json({ error: 'passwordRequirement' });
  await updateUser(req.user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
  res.json({ success: true });
});
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const clean = (email || '').trim().toLowerCase();
  const user = await getUserByEmail(clean);
  // Generic response regardless of existence, to avoid account enumeration.
  if (user) {
    const token = randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    await q('INSERT INTO password_resets (id,email,token_hash,expires_at,created_at) VALUES ($1,$2,$3,$4,$5)', [uid('rst'), clean, hashToken(token), exp, new Date().toISOString()]);
    const emailed = await sendEmail(clean,
      'Reset your password — 小房东助手 Small Landlord Assistant',
      `You requested a password reset. Your reset code is:\n\n    ${token}\n\nIt expires in 2 hours. Enter it on the reset-password page in the app. If you did not request this, you can safely ignore this email.\n\n重置验证码：${token}（2 小时内有效），请在 App 的重置密码页输入。如非本人操作请忽略。\n\n— Small Landlord Assistant 小房东助手`);
    if (!emailed && process.env.NODE_ENV !== 'production') console.log(`[dev-only] password reset token for ${clean}: ${token} (expires ${exp}; enter it on the reset-password page)`);
    if (!emailed) console.error(`[server] WARNING: password-reset email NOT sent to ${clean} (email not configured or send failed).`);
    await addAuthEvent({ userId: user.id, actorEmail: clean, actorRole: user.role, eventType: 'PASSWORD_RESET_REQUESTED', ipAddress: req.ip || '', userAgent: '', details: 'Password reset requested (token hashed, single-use, 2h expiry)' });
  }
  res.json({ success: true });
});
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!strongPassword(newPassword)) return res.status(400).json({ error: 'passwordRequirement' });
  const row = (await q('SELECT * FROM password_resets WHERE used=0 ORDER BY created_at DESC')).find((r) => r.token_hash === hashToken(token || ''));
  if (!row || new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'invalidOrExpiredToken' });
  const user = await getUserByEmail(row.email);
  if (!user) return res.status(400).json({ error: 'invalidOrExpiredToken' });
  await q('UPDATE password_resets SET used=1 WHERE id=$1', [row.id]);
  await updateUser(user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
  await addAuthEvent({ userId: user.id, actorEmail: user.email, actorRole: user.role, eventType: 'PASSWORD_RESET_COMPLETED', ipAddress: req.ip || '', userAgent: '', details: 'Password updated via one-time reset token' });
  res.json({ success: true });
});
app.post('/api/auth/activate-invitation', async (req, res) => {
  const { code, name, email, password } = req.body || {};
  if (!code || !name || !isEmail(email) || !strongPassword(password)) return res.status(400).json({ error: 'invalidInput' });
  const inv = (await store.all('tenant_invitations')).find((i) => i.invitationCode.toUpperCase() === code.trim().toUpperCase() && i.status === 'pending');
  if (!inv || new Date(inv.expiresAt) < new Date()) return res.status(400).json({ error: 'invalidInvitationCode' });
  const clean = email.trim().toLowerCase();
  if (await getUserByEmail(clean)) return res.status(400).json({ error: 'emailAlreadyRegistered' });
  const id = uid('usr_tenant');
  const user = await createUser({ id, name: name.trim(), email: clean, role: 'tenant', roles: ['tenant'], unitId: inv.unitId, propertyId: inv.propertyId, status: 'active', emailVerified: true, createdAt: new Date().toISOString() }, bcrypt.hashSync(password, 10));
  await store.upsert('tenant_invitations', { ...inv, status: 'accepted', usedAt: new Date().toISOString() });
  await store.upsert('tenancy_members', { id: uid('tmem'), tenancyId: inv.tenancyId, userId: id, unitId: inv.unitId, propertyId: inv.propertyId, status: 'active', joinedAt: new Date().toISOString() });
  await addAuthEvent({ userId: id, actorEmail: clean, actorRole: 'tenant', eventType: 'TENANT_INVITE_ACTIVATED', ipAddress: req.ip || '', userAgent: '', details: `Tenant activated invitation for ${inv.propertyName} (${inv.unitNumber})` });
  res.json({ success: true, user: publicUser(user), role: 'tenant', token: signToken(user, 'tenant'), unitInfo: `${inv.propertyName} (${inv.unitNumber})` });
});

// ---------- Bootstrap / profile / admin ----------
app.get('/api/bootstrap', auth, async (req, res) => res.json(await loadAll(req.user)));
app.patch('/api/users/:id', auth, async (req, res) => {
  if (req.params.id !== req.user.id && req.activeRole !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const target = await getUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'notFound' });
  const { name, phone, preferredLanguage } = req.body || {};
  const updated = await updateUser(target.id, { name: name || target.name, phone: phone ?? target.phone, preferred_language: preferredLanguage || target.preferred_language });
  res.json({ user: publicUser(updated) });
});
app.patch('/api/users/:id/suspension', auth, requireRole('admin'), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'cannotSuspendSelf' });
  const target = await getUserById(req.params.id);
  if (!target || target.role === 'admin') return res.status(400).json({ error: 'cannotSuspendAdmin' });
  const next = target.status === 'suspended' ? 'active' : 'suspended';
  await updateUser(target.id, { status: next });
  await addAuthEvent({ userId: target.id, actorEmail: req.user.email, actorRole: 'admin', eventType: next === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED', ipAddress: req.ip || '', userAgent: '', details: `Admin changed status of ${target.email} to ${next}` });
  res.json({ success: true, status: next });
});

// ---------- Properties ----------
app.post('/api/properties', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const { property, unitDetails, units: unitSpecs } = req.body || {};
  if (!property?.name || !property?.address || !property?.city) return res.status(400).json({ error: 'invalidInput' });
  const unitsCount = Math.min(10, Math.max(1, Number(property.unitsCount) || 1));
  const id = uid('prop');
  const prop = { ...property, id, landlordId: req.user.id, unitsCount, createdAt: new Date().toISOString().slice(0, 10) };
  await store.upsert('properties', prop);
  const num = (v, fallback) => Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : fallback;
  const d = unitDetails || {};
  for (let i = 1; i <= unitsCount; i++) {
    const s = Array.isArray(unitSpecs) && unitSpecs.length > 0 ? unitSpecs[Math.min(i - 1, unitSpecs.length - 1)] : null;
    await store.upsert('units', {
      id: `${id}_${i}`,
      propertyId: id,
      unitNumber: (s?.unitNumber && String(s.unitNumber).trim()) || (unitsCount === 1 ? 'Main' : `Unit ${i}`),
      bedrooms: num(s?.bedrooms ?? s?.bed, num(d.bed, 0)),
      bathrooms: num(s?.bathrooms ?? s?.bath, num(d.bath, 0)),
      sqft: num(s?.sqft, num(d.sqft, 0)),
      monthlyRent: num(s?.monthlyRent ?? s?.rent, num(d.rent, 0)),
      securityDeposit: num(s?.securityDeposit ?? s?.deposit, num(d.deposit, 0)),
      status: 'vacant',
      appliances: ['Refrigerator', 'Range Oven', 'Smoke Detector'],
    });
  }
  await addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'CREATE_PROPERTY', entityType: 'Property', entityId: id, details: `Added property: ${prop.name} (${prop.state}) with ${unitsCount} unit(s)` });
  res.json({ success: true, property: prop });
});
app.patch('/api/units/:id', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const unit = await store.get('units', req.params.id);
  if (!unit) return res.status(404).json({ error: 'notFound' });
  const prop = await store.get('properties', unit.propertyId);
  if (req.activeRole === 'landlord') {
    const owns = prop && (prop.landlordId ? prop.landlordId === req.user.id : req.user.id === 'usr_landlord_1');
    if (!owns) return res.status(403).json({ error: 'notYourProperty' });
  }
  const { unitNumber, bedrooms, bathrooms, sqft, monthlyRent, securityDeposit, status } = req.body || {};
  const num = (v, fallback) => v === undefined || v === '' ? fallback : (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null);
  const next = {
    ...unit,
    unitNumber: (typeof unitNumber === 'string' && unitNumber.trim()) || unit.unitNumber,
    bedrooms: num(bedrooms, unit.bedrooms),
    bathrooms: num(bathrooms, unit.bathrooms),
    sqft: num(sqft, unit.sqft),
    monthlyRent: num(monthlyRent, unit.monthlyRent),
    securityDeposit: num(securityDeposit, unit.securityDeposit),
  };
  if (Object.values(next).some((v) => v === null)) return res.status(400).json({ error: 'invalidInput' });
  // Occupancy is managed by leases: never flip it by hand while a lease is active.
  const hasActiveLease = (await store.all('tenancies')).some((t) => t.unitId === unit.id && t.status === 'active');
  if (!hasActiveLease && (status === 'vacant' || status === 'maintenance')) next.status = status;
  await store.upsert('units', next);
  await addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'UPDATE_UNIT', entityType: 'Unit', entityId: unit.id, details: `Updated ${next.unitNumber}: rent $${next.monthlyRent}, ${next.bedrooms}bd/${next.bathrooms}ba, ${next.sqft}sqft` });
  res.json({ success: true, unit: next });
});

// ---------- Ledger ----------
app.post('/api/payments', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const { unitId, tenancyId, chargeId, amount, method, reference, notes } = req.body || {};
  const charge = await store.get('rent_charges', chargeId);
  if (!charge || amount === undefined || Number(amount) <= 0) return res.status(400).json({ error: 'invalidInput' });
  if (req.activeRole === 'landlord' && charge.propertyId) {
    const prop = await store.get('properties', charge.propertyId);
    const owns = prop ? (prop.landlordId ? prop.landlordId === req.user.id : req.user.id === 'usr_landlord_1') : false;
    if (!owns) return res.status(403).json({ error: 'notYourProperty' });
  }
  const remaining = charge.amount - charge.paidAmount;
  if (Number(amount) > remaining) return res.status(400).json({ error: 'overpaymentRejected', remaining });
  const id = uid('pay');
  const payment = { id, tenancyId, unitId, chargeId, amount: Number(amount), paymentDate: new Date().toISOString().slice(0, 10), method, source: 'landlord_reported', referenceNumber: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`, notes, reportedBy: req.user.name, createdAt: new Date().toISOString() };
  await store.upsert('rent_payments', payment);
  const paid = charge.paidAmount + Number(amount);
  await store.upsert('rent_charges', { ...charge, paidAmount: paid, status: computeChargeStatus({ ...charge, paidAmount: paid }) });
  await addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'RECORD_RENT_PAYMENT', entityType: 'RentPayment', entityId: id, details: `Recorded $${amount} via ${method} (Landlord-Reported)` });
  res.json({ success: true, payment });
});
app.post('/api/adjustments', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const { chargeId, tenancyId, amount, reason } = req.body || {};
  const charge = await store.get('rent_charges', chargeId);
  if (!charge || amount === undefined || !reason) return res.status(400).json({ error: 'invalidInput' });
  const id = uid('adj');
  const adj = { id, chargeId, tenancyId, amount: Number(amount), reason, recordedBy: req.user.name, date: new Date().toISOString().slice(0, 10) };
  await store.upsert('ledger_adjustments', adj);
  const newAmount = Math.max(0, charge.amount + Number(amount));
  await store.upsert('rent_charges', { ...charge, amount: newAmount, status: computeChargeStatus({ ...charge, amount: newAmount }) });
  await addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'LEDGER_ADJUSTMENT', entityType: 'RentCharge', entityId: chargeId, details: `Adjusted by $${amount}: ${reason}` });
  res.json({ success: true, adjustment: adj });
});

// ---------- Maintenance / tasks / inspections ----------
const TICKET_TRANSITIONS = { submitted: ['reviewed'], reviewed: ['in_progress'], in_progress: ['completed'], completed: ['closed'] };
app.post('/api/tickets', auth, async (req, res) => {
  const t = req.body || {};
  if (!t.propertyId || !t.unitId || !t.title) return res.status(400).json({ error: 'invalidInput' });
  const id = uid('tkt');
  const ticket = { ...t, id, ticketNumber: `WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), photos: t.photos || [], completionPhotos: t.completionPhotos || [] };
  await store.upsert('maintenance_tickets', ticket);
  if (ticket.priority === 'emergency' || ticket.priority === 'high') {
    await store.upsert('tasks', { id: uid('tsk'), title: `Dispatch vendor for ${ticket.priority.toUpperCase()}: ${ticket.title}`, description: `Ticket ${ticket.ticketNumber} submitted by ${ticket.requesterName}`, propertyId: ticket.propertyId, unitId: ticket.unitId, relatedType: 'maintenance', relatedId: id, assigneeName: req.user.name, dueDate: new Date().toISOString().slice(0, 10), priority: 'high', status: 'todo', createdAt: new Date().toISOString().slice(0, 10) });
  }
  res.json({ success: true, ticket });
});
app.patch('/api/tickets/:id', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const t = await store.get('maintenance_tickets', req.params.id);
  if (!t) return res.status(404).json({ error: 'notFound' });
  const { status, resolutionNotes, actualCost } = req.body || {};
  if (status && status !== t.status && !(TICKET_TRANSITIONS[t.status] || []).includes(status)) return res.status(400).json({ error: 'invalidTicketTransition', from: t.status, to: status });
  // Do NOT fall back to estimatedCost: an omitted actual cost stays omitted.
  const next = { ...t, status: status || t.status, resolutionNotes: resolutionNotes ?? t.resolutionNotes, actualCost: actualCost !== undefined && actualCost !== '' ? Number(actualCost) : t.actualCost, updatedAt: new Date().toISOString(), closedAt: (status === 'closed' || status === 'completed') ? new Date().toISOString() : t.closedAt };
  await store.upsert('maintenance_tickets', next);
  res.json({ success: true, ticket: next });
});
app.post('/api/tasks', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const t = req.body || {};
  if (!t.title || !t.dueDate) return res.status(400).json({ error: 'invalidInput' });
  const task = { ...t, id: uid('tsk'), createdAt: new Date().toISOString().slice(0, 10) };
  await store.upsert('tasks', task);
  res.json({ success: true, task });
});
app.patch('/api/tasks/:id/toggle', auth, async (req, res) => {
  const t = await store.get('tasks', req.params.id);
  if (!t) return res.status(404).json({ error: 'notFound' });
  // todo -> in_progress -> completed -> todo (in_progress is never lost)
  const next = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'todo';
  await store.upsert('tasks', { ...t, status: next });
  res.json({ success: true, task: { ...t, status: next } });
});
app.patch('/api/inspections/:id/items/:itemId', auth, async (req, res) => {
  const insp = await store.get('inspections', req.params.id);
  if (!insp) return res.status(404).json({ error: 'notFound' });
  if (insp.landlordSigned && insp.tenantSigned) return res.status(403).json({ error: 'inspectionLocked' });
  if (req.activeRole === 'tenant' && insp.unitId !== req.user.unit_id) return res.status(403).json({ error: 'forbidden' });
  const { condition, notes, wearTearCategory } = req.body || {};
  const items = insp.items.map((it) => it.id === req.params.itemId ? { ...it, condition: condition ?? it.condition, notes: notes ?? it.notes, wearTearCategory: wearTearCategory ?? it.wearTearCategory } : it);
  await store.upsert('inspections', { ...insp, items });
  res.json({ success: true });
});
app.post('/api/inspections/:id/sign', auth, async (req, res) => {
  const insp = await store.get('inspections', req.params.id);
  if (!insp) return res.status(404).json({ error: 'notFound' });
  const { signerRole } = req.body || {};
  // A user may only sign their own side, and only if it matches their role.
  if (signerRole !== req.activeRole) return res.status(403).json({ error: 'cannotSignForOtherRole' });
  if (signerRole === 'tenant' && insp.unitId !== req.user.unit_id) return res.status(403).json({ error: 'forbidden' });
  if (signerRole === 'landlord' && insp.landlordSigned) return res.status(400).json({ error: 'alreadySigned' });
  if (signerRole === 'tenant' && insp.tenantSigned) return res.status(400).json({ error: 'alreadySigned' });
  const next = signerRole === 'landlord'
    ? { ...insp, landlordSigned: true, landlordSignedAt: new Date().toISOString(), landlordSignatureName: req.user.name, version: (insp.version || 1) + 1 }
    : { ...insp, tenantSigned: true, tenantSignedAt: new Date().toISOString(), tenantSignatureName: req.user.name, version: (insp.version || 1) + 1 };
  await store.upsert('inspections', next);
  res.json({ success: true, inspection: next });
});

// ---------- Messages / invitations ----------
app.post('/api/messages', auth, async (req, res) => {
  const { conversationId, body, attachmentName, attachmentType } = req.body || {};
  const conv = await store.get('conversations', conversationId);
  if (!conv || !body) return res.status(400).json({ error: 'invalidInput' });
  if (req.activeRole === 'tenant' && conv.tenantId !== req.user.id && conv.unitId !== req.user.unit_id) return res.status(403).json({ error: 'forbidden' });
  if (attachmentName) return res.status(400).json({ error: 'attachmentUploadNotImplemented' });
  const msg = { id: uid('msg'), conversationId, senderId: req.user.id, senderRole: req.activeRole, senderName: req.user.name, body, attachmentName, attachmentType, sentAt: new Date().toISOString(), read: true };
  await store.upsert('messages', msg);
  await store.upsert('conversations', { ...conv, lastMessageSnippet: body, lastMessageAt: msg.sentAt, unreadCount: req.activeRole === 'tenant' ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0 });
  // No simulated auto-reply: a reply only exists when the other user sends it.
  res.json({ success: true, message: msg });
});
app.post('/api/invitations', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const { propertyId, unitId, tenancyId, email } = req.body || {};
  const prop = await store.get('properties', propertyId);
  const unit = await store.get('units', unitId);
  if (!prop || !unit || !isEmail(email)) return res.status(400).json({ error: 'invalidInput' });
  const code = `SLA-${Math.floor(1000 + Math.random() * 9000)}-${unit.unitNumber.replace(/\s+/g, '').slice(0, 3).toUpperCase()}`;
  const exp = new Date(); exp.setDate(exp.getDate() + 14);
  const inv = { id: uid('inv'), propertyId, unitId, tenancyId, propertyName: prop.name, unitNumber: unit.unitNumber, email: email.trim().toLowerCase(), invitationCode: code, codeHash: createHash('sha256').update(code).digest('hex'), expiresAt: exp.toISOString(), status: 'pending', createdBy: req.user.name, createdAt: new Date().toISOString() };
  await store.upsert('tenant_invitations', inv);
  await addAuthEvent({ userId: req.user.id, actorEmail: req.user.email, actorRole: req.activeRole, eventType: 'TENANT_INVITE_CREATED', ipAddress: req.ip || '', userAgent: '', details: `Created tenant invite ${code} for ${prop.name}` });
  res.json({ success: true, invitation: inv });
});

// ---------- Tenancies (leases) ----------
const isValidDateStr = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + 'T00:00:00Z').getTime());

app.post('/api/tenancies', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const { propertyId, unitId, tenantName, tenantEmail, tenantPhone, startDate, endDate, rentAmount, dueDay, securityDeposit } = req.body || {};
  const prop = await store.get('properties', propertyId);
  const unit = await store.get('units', unitId);
  if (!prop || !unit || unit.propertyId !== propertyId) return res.status(400).json({ error: 'invalidInput' });
  if (req.activeRole === 'landlord') {
    const owns = prop.landlordId ? prop.landlordId === req.user.id : req.user.id === 'usr_landlord_1';
    if (!owns) return res.status(403).json({ error: 'notYourProperty' });
  }
  if (!tenantName || !tenantName.trim()) return res.status(400).json({ error: 'invalidInput' });
  if (tenantEmail && !isEmail(tenantEmail)) return res.status(400).json({ error: 'invalidInput' });
  if (!isValidDateStr(startDate) || !isValidDateStr(endDate) || startDate >= endDate) return res.status(400).json({ error: 'invalidDateRange' });
  const rent = Number(rentAmount);
  if (!Number.isFinite(rent) || rent <= 0) return res.status(400).json({ error: 'invalidInput' });
  const due = Math.min(28, Math.max(1, parseInt(dueDay, 10) || 1));
  // A unit cannot have two overlapping active leases.
  const clash = (await store.all('tenancies')).some((t) => t.unitId === unitId && t.status === 'active' && !(t.endDate < startDate || t.startDate > endDate));
  if (clash) return res.status(409).json({ error: 'tenancyOverlap' });

  const tenancyId = uid('ten');
  const tenancy = {
    id: tenancyId, unitId, propertyId,
    tenantName: tenantName.trim(),
    tenantEmail: (tenantEmail || '').trim().toLowerCase(),
    tenantPhone: (tenantPhone || '').trim(),
    startDate, endDate, rentAmount: rent, dueDay: due,
    securityDeposit: securityDeposit !== undefined && securityDeposit !== '' ? Number(securityDeposit) : rent,
    depositHeldStatus: 'held', status: 'active', version: 1,
  };
  await store.upsert('tenancies', tenancy);

  // Generate one rent charge per rent-due day falling inside the lease term.
  // A 12-month lease therefore yields 12 full-month bills; a partial first
  // or last month is simply not auto-billed (use a ledger adjustment for it).
  const charges = [];
  let [y, m] = startDate.split('-').map(Number);
  const startDay = Number(startDate.split('-')[2]);
  if (startDay > due) { m += 1; if (m > 12) { m = 1; y += 1; } }
  const [ey, em] = endDate.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    const billingMonth = `${y}-${String(m).padStart(2, '0')}`;
    const daysInMonth = new Date(y, m, 0).getDate();
    const dueDate = `${billingMonth}-${String(Math.min(due, daysInMonth)).padStart(2, '0')}`;
    if (dueDate > endDate) break;
    const charge = {
      id: uid('chg'), tenancyId, unitId, propertyId,
      billingMonth, dueDate, amount: rent, paidAmount: 0,
      status: computeChargeStatus({ amount: rent, paidAmount: 0, dueDate }),
      type: 'rent',
    };
    await store.upsert('rent_charges', charge);
    charges.push(charge);
    m += 1; if (m > 12) { m = 1; y += 1; }
  }

  await store.upsert('units', { ...unit, status: 'occupied' });
  await addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'CREATE_TENANCY', entityType: 'Tenancy', entityId: tenancyId, details: `Lease for ${tenancy.tenantName} @ ${unit.unitNumber}: ${startDate} → ${endDate}, $${rent}/mo, ${charges.length} rent charges generated` });
  res.json({ success: true, tenancy, chargesGenerated: charges.length });
});

// ---------- Inspections ----------
const DEFAULT_INSPECTION_TEMPLATE = [
  { roomName: 'Living Room / 客厅', itemKey: 'Walls, Flooring & Windows' },
  { roomName: 'Kitchen / 厨房', itemKey: 'Appliances, Counters & Sink' },
  { roomName: 'Bedroom / 卧室', itemKey: 'Walls, Flooring & Closet' },
  { roomName: 'Bathroom / 卫生间', itemKey: 'Fixtures, Tile & Ventilation' },
  { roomName: 'General / 通用', itemKey: 'Smoke/CO Detectors & Locks' },
  { roomName: 'Exterior / 外部', itemKey: 'Entry, Balcony & Common Areas' },
];

app.post('/api/inspections', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const { propertyId, unitId, tenancyId, type, scheduledDate } = req.body || {};
  const prop = await store.get('properties', propertyId);
  const unit = await store.get('units', unitId);
  if (!prop || !unit || unit.propertyId !== propertyId) return res.status(400).json({ error: 'invalidInput' });
  if (req.activeRole === 'landlord') {
    const owns = prop.landlordId ? prop.landlordId === req.user.id : req.user.id === 'usr_landlord_1';
    if (!owns) return res.status(403).json({ error: 'notYourProperty' });
  }
  if (!['move_in', 'move_out', 'routine'].includes(type)) return res.status(400).json({ error: 'invalidInput' });
  const ten = tenancyId ? await store.get('tenancies', tenancyId) : null;
  if (tenancyId && !ten) return res.status(400).json({ error: 'invalidInput' });
  const id = uid('insp');
  const inspection = {
    id, unitId, propertyId, tenancyId: ten ? ten.id : '',
    type, status: 'in_progress',
    scheduledDate: isValidDateStr(scheduledDate) ? scheduledDate : new Date().toISOString().slice(0, 10),
    items: DEFAULT_INSPECTION_TEMPLATE.map((tpl, i) => ({
      id: `item_${id}_${i}`, roomName: tpl.roomName, itemKey: tpl.itemKey,
      condition: 'fair', notes: '', wearTearCategory: 'undetermined', evidenceFiles: [],
    })),
    landlordSigned: false, tenantSigned: false, version: 1,
  };
  await store.upsert('inspections', inspection);
  await addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'SCHEDULE_INSPECTION', entityType: 'Inspection', entityId: id, details: `${type} inspection scheduled for ${unit.unitNumber} (${inspection.scheduledDate})` });
  res.json({ success: true, inspection });
});

// Simulated live events are kept only as explicit landlord actions that
// create real records (no fake payments beyond a remaining balance).
app.post('/api/simulate/rent', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const charge = (await store.all('rent_charges')).find((c) => c.status === 'partial' || (c.paidAmount > 0 && c.paidAmount < c.amount));
  if (!charge) return res.status(400).json({ error: 'noPartialCharge' });
  const amount = charge.amount - charge.paidAmount;
  const id = uid('pay');
  await store.upsert('rent_payments', { id, tenancyId: charge.tenancyId, unitId: charge.unitId, chargeId: charge.id, amount, paymentDate: new Date().toISOString().slice(0, 10), method: 'zelle', source: 'landlord_reported', referenceNumber: `SIM-${Date.now().toString().slice(-4)}`, notes: 'Simulated live payment (remaining balance only)', reportedBy: req.user.name, createdAt: new Date().toISOString() });
  await store.upsert('rent_charges', { ...charge, paidAmount: charge.amount, status: 'paid' });
  res.json({ success: true });
});
app.post('/api/simulate/maintenance', auth, requireRole('landlord', 'admin'), async (req, res) => {
  const id = uid('tkt');
  await store.upsert('maintenance_tickets', { id, ticketNumber: `WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`, propertyId: 'prop_elmwood', unitId: 'unit_1a', requesterName: 'Marcus Johnson', requesterEmail: 'marcus.j@gmail.com', title: 'Water pipe leak under bathroom vanity', category: 'plumbing', description: 'Simulated emergency ticket created from the analytics page.', priority: 'emergency', status: 'submitted', isEmergency: true, photos: [], submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  res.json({ success: true });
});

app.use((req, res) => res.status(404).json({ error: 'notFound' }));

// Initialize the database (schema + collision guard + seed) before serving.
await initDb();
app.listen(PORT, () => console.log(`[server] Small Landlord Assistant API listening on http://localhost:${PORT} (DB: postgres)`));
