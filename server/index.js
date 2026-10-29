// Small Landlord Assistant — real backend, phase 1 (local only).
// Express + SQLite (node:sqlite) + bcryptjs + JWT.
// Secrets come only from environment variables; see .env.example.
// Email sending is NOT implemented: verification / reset tokens are printed
// to the backend terminal in non-production mode only, so a local tester can
// complete the flow. They are NEVER returned in an API response and NEVER
// rendered on any page. In production this must be replaced by an email sender.
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { db, store, getUserByEmail, getUserById, createUser, updateUser, publicUser, loadAll, addAuthEvent, addAuditLog, computeChargeStatus } from './db.js';

dotenv.config();

const PORT = Number(process.env.PORT || process.env.API_PORT || 3011);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[server] FATAL: JWT_SECRET must be set in production. Refusing to start.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) console.warn('[server] WARNING: JWT_SECRET is not set; using a dev-only fallback. Never use this in production.');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

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

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getUserById(payload.sub);
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
function auditAuth(req, type, details, userId, role) {
  addAuthEvent({ userId, actorEmail: req.user?.email || '', actorRole: role || req.activeRole, eventType: type, ipAddress: req.ip || '', userAgent: (req.headers['user-agent'] || '').slice(0, 80), details });
}

app.get('/api/health', (req, res) => res.json({ ok: true, db: 'sqlite' }));

// ---------- Auth ----------
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !isEmail(email) || !strongPassword(password)) return res.status(400).json({ error: 'invalidInput' });
  const clean = email.trim().toLowerCase();
  if (getUserByEmail(clean)) return res.status(400).json({ error: 'emailAlreadyRegistered' });
  const id = uid('usr_landlord');
  const user = createUser({ id, name: name.trim(), email: clean, role: 'landlord', roles: ['landlord'], phone: '', preferredLanguage: 'zh', status: 'pending_verification', emailVerified: false, createdAt: new Date().toISOString() }, bcrypt.hashSync(password, 10));
  store.upsert('landlord_accounts', { id: uid('acct'), name: `${name.trim()}'s Rental Portfolio`, ownerId: id, planId: 'free_trial', maxUnits: 2, createdAt: new Date().toISOString().slice(0, 10) });
  store.upsert('account_members', { id: uid('mem'), accountId: store.all('landlord_accounts').find((a) => a.ownerId === id)?.id, userId: id, role: 'owner', joinedAt: new Date().toISOString() });
  const token = randomBytes(32).toString('hex');
  const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO email_verifications (id,email,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').run(uid('ev'), clean, hashToken(token), exp, new Date().toISOString());
  if (process.env.NODE_ENV !== 'production') console.log(`[dev-only] email verification token for ${clean}: ${token} (expires ${exp}; enter it on the verify-email page)`);
  addAuthEvent({ userId: id, actorEmail: clean, actorRole: 'landlord', eventType: 'SIGNUP_LANDLORD', ipAddress: req.ip || '', userAgent: '', details: `New landlord account registered: ${name.trim()}` });
  res.json({ success: true, user: publicUser(user), pendingVerificationEmail: clean });
});

app.post('/api/auth/resend-verification', (req, res) => {
  const clean = ((req.body || {}).email || '').trim().toLowerCase();
  const user = getUserByEmail(clean);
  if (user && !user.email_verified) {
    const token = randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    db.prepare('INSERT INTO email_verifications (id,email,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').run(uid('ev'), clean, hashToken(token), exp, new Date().toISOString());
    if (process.env.NODE_ENV !== 'production') console.log(`[dev-only] email verification token for ${clean}: ${token} (expires ${exp})`);
  }
  res.json({ success: true });
});

app.post('/api/auth/verify-email', (req, res) => {
  const { email, token } = req.body || {};
  if (!email || !token) return res.status(400).json({ error: 'invalidInput' });
  const clean = email.trim().toLowerCase();
  const row = db.prepare('SELECT * FROM email_verifications WHERE email=? AND used=0 ORDER BY created_at DESC').get(clean);
  if (!row || row.token_hash !== hashToken(token) || new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'invalidVerificationToken' });
  db.prepare('UPDATE email_verifications SET used=1 WHERE id=?').run(row.id);
  const user = getUserByEmail(clean);
  if (!user) return res.status(400).json({ error: 'invalidVerificationToken' });
  const updated = updateUser(user.id, { email_verified: 1, status: 'active' });
  addAuthEvent({ userId: user.id, actorEmail: clean, actorRole: user.role, eventType: 'EMAIL_VERIFIED', ipAddress: req.ip || '', userAgent: '', details: 'Email verified with a one-time token' });
  res.json({ success: true, user: publicUser(updated), token: signToken(updated, updated.role) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, portalRole } = req.body || {};
  const user = getUserByEmail((email || '').trim());
  if (!user || !user.password_hash || !bcrypt.compareSync(password || '', user.password_hash)) {
    addAuthEvent({ actorEmail: email || '', eventType: 'LOGIN_FAILED', ipAddress: req.ip || '', userAgent: '', details: 'Failed login attempt' });
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
  updateUser(user.id, { last_login_at: new Date().toISOString() });
  addAuthEvent({ userId: user.id, actorEmail: user.email, actorRole: role, eventType: 'LOGIN_SUCCESS', ipAddress: req.ip || '', userAgent: (req.headers['user-agent'] || '').slice(0, 80), details: `Authenticated into ${role} portal` });
  res.json({ success: true, user: publicUser(getUserById(user.id)), role, token: signToken(user, role), requiresRoleSelect: roles.length > 1 && !portalRole });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user), role: req.activeRole }));
app.post('/api/auth/logout', auth, (req, res) => { auditAuth(req, 'LOGOUT', 'User logged out', req.user.id, req.activeRole); res.json({ success: true }); });
app.post('/api/auth/switch-role', auth, (req, res) => {
  const { role } = req.body || {};
  const roles = JSON.parse(req.user.roles || '[]');
  if (!roles.includes(role)) return res.status(403).json({ error: 'roleNotAssigned' });
  auditAuth(req, 'ROLE_SWITCHED', `Switched view to ${role}`, req.user.id, role);
  res.json({ success: true, role, token: signToken(req.user, role), user: publicUser(req.user) });
});
app.post('/api/auth/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!bcrypt.compareSync(currentPassword || '', req.user.password_hash || '')) return res.status(400).json({ error: 'currentPasswordIncorrect' });
  if (!strongPassword(newPassword)) return res.status(400).json({ error: 'passwordRequirement' });
  updateUser(req.user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
  res.json({ success: true });
});
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};
  const clean = (email || '').trim().toLowerCase();
  const user = getUserByEmail(clean);
  // Generic response regardless of existence, to avoid account enumeration.
  if (user) {
    const token = randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    db.prepare('INSERT INTO password_resets (id,email,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').run(uid('rst'), clean, hashToken(token), exp, new Date().toISOString());
    if (process.env.NODE_ENV !== 'production') console.log(`[dev-only] password reset token for ${clean}: ${token} (expires ${exp}; enter it on the reset-password page)`);
    addAuthEvent({ userId: user.id, actorEmail: clean, actorRole: user.role, eventType: 'PASSWORD_RESET_REQUESTED', ipAddress: req.ip || '', userAgent: '', details: 'Password reset requested (token hashed, single-use, 2h expiry)' });
  }
  res.json({ success: true });
});
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!strongPassword(newPassword)) return res.status(400).json({ error: 'passwordRequirement' });
  const row = db.prepare('SELECT * FROM password_resets WHERE used=0 ORDER BY created_at DESC').all().find((r) => r.token_hash === hashToken(token || ''));
  if (!row || new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'invalidOrExpiredToken' });
  const user = getUserByEmail(row.email);
  if (!user) return res.status(400).json({ error: 'invalidOrExpiredToken' });
  db.prepare('UPDATE password_resets SET used=1 WHERE id=?').run(row.id);
  updateUser(user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
  addAuthEvent({ userId: user.id, actorEmail: user.email, actorRole: user.role, eventType: 'PASSWORD_RESET_COMPLETED', ipAddress: req.ip || '', userAgent: '', details: 'Password updated via one-time reset token' });
  res.json({ success: true });
});
app.post('/api/auth/activate-invitation', (req, res) => {
  const { code, name, email, password } = req.body || {};
  if (!code || !name || !isEmail(email) || !strongPassword(password)) return res.status(400).json({ error: 'invalidInput' });
  const inv = store.all('tenant_invitations').find((i) => i.invitationCode.toUpperCase() === code.trim().toUpperCase() && i.status === 'pending');
  if (!inv || new Date(inv.expiresAt) < new Date()) return res.status(400).json({ error: 'invalidInvitationCode' });
  const clean = email.trim().toLowerCase();
  if (getUserByEmail(clean)) return res.status(400).json({ error: 'emailAlreadyRegistered' });
  const id = uid('usr_tenant');
  const user = createUser({ id, name: name.trim(), email: clean, role: 'tenant', roles: ['tenant'], unitId: inv.unitId, propertyId: inv.propertyId, status: 'active', emailVerified: true, createdAt: new Date().toISOString() }, bcrypt.hashSync(password, 10));
  store.upsert('tenant_invitations', { ...inv, status: 'accepted', usedAt: new Date().toISOString() });
  store.upsert('tenancy_members', { id: uid('tmem'), tenancyId: inv.tenancyId, userId: id, unitId: inv.unitId, propertyId: inv.propertyId, status: 'active', joinedAt: new Date().toISOString() });
  addAuthEvent({ userId: id, actorEmail: clean, actorRole: 'tenant', eventType: 'TENANT_INVITE_ACTIVATED', ipAddress: req.ip || '', userAgent: '', details: `Tenant activated invitation for ${inv.propertyName} (${inv.unitNumber})` });
  res.json({ success: true, user: publicUser(user), role: 'tenant', token: signToken(user, 'tenant'), unitInfo: `${inv.propertyName} (${inv.unitNumber})` });
});

// ---------- Bootstrap / profile / admin ----------
app.get('/api/bootstrap', auth, (req, res) => res.json(loadAll(req.user)));
app.patch('/api/users/:id', auth, (req, res) => {
  if (req.params.id !== req.user.id && req.activeRole !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const target = getUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'notFound' });
  const { name, phone, preferredLanguage } = req.body || {};
  const updated = updateUser(target.id, { name: name || target.name, phone: phone ?? target.phone, preferred_language: preferredLanguage || target.preferred_language });
  res.json({ user: publicUser(updated) });
});
app.patch('/api/users/:id/suspension', auth, requireRole('admin'), (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'cannotSuspendSelf' });
  const target = getUserById(req.params.id);
  if (!target || target.role === 'admin') return res.status(400).json({ error: 'cannotSuspendAdmin' });
  const next = target.status === 'suspended' ? 'active' : 'suspended';
  updateUser(target.id, { status: next });
  addAuthEvent({ userId: target.id, actorEmail: req.user.email, actorRole: 'admin', eventType: next === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED', ipAddress: req.ip || '', userAgent: '', details: `Admin changed status of ${target.email} to ${next}` });
  res.json({ success: true, status: next });
});

// ---------- Properties ----------
app.post('/api/properties', auth, requireRole('landlord', 'admin'), (req, res) => {
  const { property, unitDetails } = req.body || {};
  if (!property?.name || !property?.address || !property?.city) return res.status(400).json({ error: 'invalidInput' });
  const unitsCount = Math.min(10, Math.max(1, Number(property.unitsCount) || 1));
  const id = uid('prop');
  const prop = { ...property, id, landlordId: req.user.id, unitsCount, createdAt: new Date().toISOString().slice(0, 10) };
  store.upsert('properties', prop);
  for (let i = 1; i <= unitsCount; i++) {
    store.upsert('units', { id: `${id}_${i}`, propertyId: id, unitNumber: unitsCount === 1 ? 'Main' : `Unit ${i}`, bedrooms: unitDetails?.bed || 0, bathrooms: unitDetails?.bath || 0, sqft: unitDetails?.sqft || 0, monthlyRent: unitDetails?.rent || 0, securityDeposit: unitDetails?.deposit || 0, status: 'vacant', appliances: ['Refrigerator', 'Range Oven', 'Smoke Detector'] });
  }
  addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'CREATE_PROPERTY', entityType: 'Property', entityId: id, details: `Added property: ${prop.name} (${prop.state}) with ${unitsCount} unit(s)` });
  res.json({ success: true, property: prop });
});

// ---------- Ledger ----------
app.post('/api/payments', auth, requireRole('landlord', 'admin'), (req, res) => {
  const { unitId, tenancyId, chargeId, amount, method, reference, notes } = req.body || {};
  const charge = store.get('rent_charges', chargeId);
  if (!charge || amount === undefined || Number(amount) <= 0) return res.status(400).json({ error: 'invalidInput' });
  if (req.activeRole === 'landlord' && charge.propertyId) {
    const prop = store.get('properties', charge.propertyId);
    const owns = prop ? (prop.landlordId ? prop.landlordId === req.user.id : req.user.id === 'usr_landlord_1') : false;
    if (!owns) return res.status(403).json({ error: 'notYourProperty' });
  }
  const remaining = charge.amount - charge.paidAmount;
  if (Number(amount) > remaining) return res.status(400).json({ error: 'overpaymentRejected', remaining });
  const id = uid('pay');
  const payment = { id, tenancyId, unitId, chargeId, amount: Number(amount), paymentDate: new Date().toISOString().slice(0, 10), method, source: 'landlord_reported', referenceNumber: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`, notes, reportedBy: req.user.name, createdAt: new Date().toISOString() };
  store.upsert('rent_payments', payment);
  const paid = charge.paidAmount + Number(amount);
  store.upsert('rent_charges', { ...charge, paidAmount: paid, status: computeChargeStatus({ ...charge, paidAmount: paid }) });
  addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'RECORD_RENT_PAYMENT', entityType: 'RentPayment', entityId: id, details: `Recorded $${amount} via ${method} (Landlord-Reported)` });
  res.json({ success: true, payment });
});
app.post('/api/adjustments', auth, requireRole('landlord', 'admin'), (req, res) => {
  const { chargeId, tenancyId, amount, reason } = req.body || {};
  const charge = store.get('rent_charges', chargeId);
  if (!charge || amount === undefined || !reason) return res.status(400).json({ error: 'invalidInput' });
  const id = uid('adj');
  const adj = { id, chargeId, tenancyId, amount: Number(amount), reason, recordedBy: req.user.name, date: new Date().toISOString().slice(0, 10) };
  store.upsert('ledger_adjustments', adj);
  const newAmount = Math.max(0, charge.amount + Number(amount));
  store.upsert('rent_charges', { ...charge, amount: newAmount, status: computeChargeStatus({ ...charge, amount: newAmount }) });
  addAuditLog({ actorName: req.user.name, actorRole: req.activeRole, action: 'LEDGER_ADJUSTMENT', entityType: 'RentCharge', entityId: chargeId, details: `Adjusted by $${amount}: ${reason}` });
  res.json({ success: true, adjustment: adj });
});

// ---------- Maintenance / tasks / inspections ----------
const TICKET_TRANSITIONS = { submitted: ['reviewed'], reviewed: ['in_progress'], in_progress: ['completed'], completed: ['closed'] };
app.post('/api/tickets', auth, (req, res) => {
  const t = req.body || {};
  if (!t.propertyId || !t.unitId || !t.title) return res.status(400).json({ error: 'invalidInput' });
  const id = uid('tkt');
  const ticket = { ...t, id, ticketNumber: `WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), photos: t.photos || [], completionPhotos: t.completionPhotos || [] };
  store.upsert('maintenance_tickets', ticket);
  if (ticket.priority === 'emergency' || ticket.priority === 'high') {
    store.upsert('tasks', { id: uid('tsk'), title: `Dispatch vendor for ${ticket.priority.toUpperCase()}: ${ticket.title}`, description: `Ticket ${ticket.ticketNumber} submitted by ${ticket.requesterName}`, propertyId: ticket.propertyId, unitId: ticket.unitId, relatedType: 'maintenance', relatedId: id, assigneeName: req.user.name, dueDate: new Date().toISOString().slice(0, 10), priority: 'high', status: 'todo', createdAt: new Date().toISOString().slice(0, 10) });
  }
  res.json({ success: true, ticket });
});
app.patch('/api/tickets/:id', auth, requireRole('landlord', 'admin'), (req, res) => {
  const t = store.get('maintenance_tickets', req.params.id);
  if (!t) return res.status(404).json({ error: 'notFound' });
  const { status, resolutionNotes, actualCost } = req.body || {};
  if (status && status !== t.status && !(TICKET_TRANSITIONS[t.status] || []).includes(status)) return res.status(400).json({ error: 'invalidTicketTransition', from: t.status, to: status });
  // Do NOT fall back to estimatedCost: an omitted actual cost stays omitted.
  const next = { ...t, status: status || t.status, resolutionNotes: resolutionNotes ?? t.resolutionNotes, actualCost: actualCost !== undefined && actualCost !== '' ? Number(actualCost) : t.actualCost, updatedAt: new Date().toISOString(), closedAt: (status === 'closed' || status === 'completed') ? new Date().toISOString() : t.closedAt };
  store.upsert('maintenance_tickets', next);
  res.json({ success: true, ticket: next });
});
app.post('/api/tasks', auth, requireRole('landlord', 'admin'), (req, res) => {
  const t = req.body || {};
  if (!t.title || !t.dueDate) return res.status(400).json({ error: 'invalidInput' });
  const task = { ...t, id: uid('tsk'), createdAt: new Date().toISOString().slice(0, 10) };
  store.upsert('tasks', task);
  res.json({ success: true, task });
});
app.patch('/api/tasks/:id/toggle', auth, (req, res) => {
  const t = store.get('tasks', req.params.id);
  if (!t) return res.status(404).json({ error: 'notFound' });
  // todo -> in_progress -> completed -> todo (in_progress is never lost)
  const next = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'todo';
  store.upsert('tasks', { ...t, status: next });
  res.json({ success: true, task: { ...t, status: next } });
});
app.patch('/api/inspections/:id/items/:itemId', auth, (req, res) => {
  const insp = store.get('inspections', req.params.id);
  if (!insp) return res.status(404).json({ error: 'notFound' });
  if (insp.landlordSigned && insp.tenantSigned) return res.status(403).json({ error: 'inspectionLocked' });
  if (req.activeRole === 'tenant' && insp.unitId !== req.user.unit_id) return res.status(403).json({ error: 'forbidden' });
  const { condition, notes, wearTearCategory } = req.body || {};
  const items = insp.items.map((it) => it.id === req.params.itemId ? { ...it, condition: condition ?? it.condition, notes: notes ?? it.notes, wearTearCategory: wearTearCategory ?? it.wearTearCategory } : it);
  store.upsert('inspections', { ...insp, items });
  res.json({ success: true });
});
app.post('/api/inspections/:id/sign', auth, (req, res) => {
  const insp = store.get('inspections', req.params.id);
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
  store.upsert('inspections', next);
  res.json({ success: true, inspection: next });
});

// ---------- Messages / invitations ----------
app.post('/api/messages', auth, (req, res) => {
  const { conversationId, body, attachmentName, attachmentType } = req.body || {};
  const conv = store.get('conversations', conversationId);
  if (!conv || !body) return res.status(400).json({ error: 'invalidInput' });
  if (req.activeRole === 'tenant' && conv.tenantId !== req.user.id && conv.unitId !== req.user.unit_id) return res.status(403).json({ error: 'forbidden' });
  if (attachmentName) return res.status(400).json({ error: 'attachmentUploadNotImplemented' });
  const msg = { id: uid('msg'), conversationId, senderId: req.user.id, senderRole: req.activeRole, senderName: req.user.name, body, attachmentName, attachmentType, sentAt: new Date().toISOString(), read: true };
  store.upsert('messages', msg);
  store.upsert('conversations', { ...conv, lastMessageSnippet: body, lastMessageAt: msg.sentAt, unreadCount: req.activeRole === 'tenant' ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0 });
  // No simulated auto-reply: a reply only exists when the other user sends it.
  res.json({ success: true, message: msg });
});
app.post('/api/invitations', auth, requireRole('landlord', 'admin'), (req, res) => {
  const { propertyId, unitId, tenancyId, email } = req.body || {};
  const prop = store.get('properties', propertyId);
  const unit = store.get('units', unitId);
  if (!prop || !unit || !isEmail(email)) return res.status(400).json({ error: 'invalidInput' });
  const code = `SLA-${Math.floor(1000 + Math.random() * 9000)}-${unit.unitNumber.replace(/\s+/g, '').slice(0, 3).toUpperCase()}`;
  const exp = new Date(); exp.setDate(exp.getDate() + 14);
  const inv = { id: uid('inv'), propertyId, unitId, tenancyId, propertyName: prop.name, unitNumber: unit.unitNumber, email: email.trim().toLowerCase(), invitationCode: code, codeHash: createHash('sha256').update(code).digest('hex'), expiresAt: exp.toISOString(), status: 'pending', createdBy: req.user.name, createdAt: new Date().toISOString() };
  store.upsert('tenant_invitations', inv);
  addAuthEvent({ userId: req.user.id, actorEmail: req.user.email, actorRole: req.activeRole, eventType: 'TENANT_INVITE_CREATED', ipAddress: req.ip || '', userAgent: '', details: `Created tenant invite ${code} for ${prop.name}` });
  res.json({ success: true, invitation: inv });
});

// Simulated live events are kept only as explicit landlord actions that
// create real records (no fake payments beyond a remaining balance).
app.post('/api/simulate/rent', auth, requireRole('landlord', 'admin'), (req, res) => {
  const charge = store.all('rent_charges').find((c) => c.status === 'partial' || (c.paidAmount > 0 && c.paidAmount < c.amount));
  if (!charge) return res.status(400).json({ error: 'noPartialCharge' });
  const amount = charge.amount - charge.paidAmount;
  const id = uid('pay');
  store.upsert('rent_payments', { id, tenancyId: charge.tenancyId, unitId: charge.unitId, chargeId: charge.id, amount, paymentDate: new Date().toISOString().slice(0, 10), method: 'zelle', source: 'landlord_reported', referenceNumber: `SIM-${Date.now().toString().slice(-4)}`, notes: 'Simulated live payment (remaining balance only)', reportedBy: req.user.name, createdAt: new Date().toISOString() });
  store.upsert('rent_charges', { ...charge, paidAmount: charge.amount, status: 'paid' });
  res.json({ success: true });
});
app.post('/api/simulate/maintenance', auth, requireRole('landlord', 'admin'), (req, res) => {
  const id = uid('tkt');
  store.upsert('maintenance_tickets', { id, ticketNumber: `WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`, propertyId: 'prop_elmwood', unitId: 'unit_1a', requesterName: 'Marcus Johnson', requesterEmail: 'marcus.j@gmail.com', title: 'Water pipe leak under bathroom vanity', category: 'plumbing', description: 'Simulated emergency ticket created from the analytics page.', priority: 'emergency', status: 'submitted', isEmergency: true, photos: [], submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  res.json({ success: true });
});

app.use((req, res) => res.status(404).json({ error: 'notFound' }));
app.listen(PORT, () => console.log(`[server] Small Landlord Assistant API listening on http://localhost:${PORT} (DB: ${process.env.DATABASE_PATH || 'data/app.db'})`));
