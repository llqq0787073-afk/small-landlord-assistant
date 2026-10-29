# Backend Phase 1 — Local Only

## What this is

A real, local backend for the previously front-end-only demo:

- **Server:** Node + Express (`server/index.js`)
- **Database:** SQLite file via Node's built-in `node:sqlite` (`data/app.db`, git-ignored)
- **Auth:** bcryptjs password hashes + JWT (`jsonwebtoken`)
- **Frontend:** Vite + React, proxied to the backend (`/api` → `http://localhost:3011`)

Nothing in this phase deploys to any cloud, and no real secret is committed.
`.env.example` contains placeholders only.

## Local start (two terminals)

```bash
# 1) Backend (port 3011 by default)
cp .env.example .env   # then set JWT_SECRET to a long random value
npm run server

# 2) Frontend (port 3000, proxies /api to 3011)
npm run dev
```

Open http://localhost:3000/ — you start **logged out** on the landing page.
The old behaviour (opening as David Miller, logged in) is removed.

Environment variables (names only, no values here):

- `JWT_SECRET` — required in production; a dev fallback is used only if unset, with a warning
- `JWT_EXPIRES_IN` — default `24h`
- `PORT` — backend port, default `3011`
- `DATABASE_PATH` — default `data/app.db`
- `DEMO_PASSWORD` — demo seed accounts only, on first DB creation

## Demo accounts (seeded once, only when the DB is empty)

Seed data is derived from the old frontend demo (`server/seed.json`, generated
by `npx tsx scripts/extract-seed.ts`). Demo users:

- Landlord: `david.miller@rentals.com`
- Tenant: `emily.zhang@gmail.com`
- Admin: `admin.sarah@smalllandlord.app`
- Multi-role: `alex.wong@metroproperties.com`

Demo password: `DemoPass123` by default (or `DEMO_PASSWORD` if set).
Change or remove demo accounts before any shared deployment. Demo users are
created with MFA **off** because MFA is not implemented in phase 1 — there is
no demo code and no code path that grants access without a password.

## Email verification / password reset (local development only)

There is **no email sender** in phase 1, and tokens are **never** returned by
an API response and **never** rendered on a page:

- Register → a one-time verification token is printed to the **backend
  terminal** (non-production only), valid 24h, hashed in the DB, single-use.
  Enter it on the verify-email page together with your email.
- Forgot password → a generic success response (no account enumeration).
  If the email exists, a one-time reset token is printed to the backend
  terminal, valid 2h, hashed, single-use. Enter it on the reset-password page.
  The reset actually changes the stored password hash.

In production these tokens must be sent by email, not logged.

## Key rules now enforced by the server

- Login compares the bcrypt password hash; wrong password → `invalidCredentials`
- Role switches are validated against the user's actual `roles`; a tenant
  cannot switch to landlord/admin
- Admin-only endpoints check the JWT role; suspending yourself or an admin
  is rejected; a suspended user is rejected on the next authenticated request
- Logout clears the JWT and all client session state
- Payments cannot exceed the remaining balance (overpayment → `400
  overpaymentRejected` with the remaining amount, nothing is recorded)
- Charge status is derived: paid / partial / unpaid / **overdue** (dueDate
  before today and not fully paid)
- Ticket status transitions are linear: submitted → reviewed → in_progress
  → completed → closed; illegal jumps are rejected
- Completion cost left blank stays blank — it is **not** replaced by the estimate
- Task toggle cycles todo → in_progress → completed → todo
- Inspections lock once both sides have signed; a user can only sign their
  own side, and the server records the account name, not a typed name
- Messages have no simulated auto-reply and no fake attachment; sending an
  attachment name is rejected until real upload exists
- Tenant data in `/api/bootstrap` is filtered to that tenant's unit/property;
  tenants cannot read other tenants' conversations
- Landlord data in `/api/bootstrap` is filtered to properties owned by that
  landlord (new properties record `landlordId`; seed properties belong to
  the seed landlord). Cross-landlord payment attempts are rejected with
  `notYourProperty`. Note: other write endpoints (ticket/inspection/task
  PATCH by id) do not yet re-check ownership — see gaps below.
- Ledger adjustments are stored, listed in the ledger, and written to the audit log

## API list (all under /api, Bearer JWT except auth endpoints)

Auth: `POST /auth/register`, `POST /auth/verify-email`,
`POST /auth/resend-verification`, `POST /auth/login`, `GET /auth/me`,
`POST /auth/logout`, `POST /auth/switch-role`, `POST /auth/change-password`,
`POST /auth/forgot-password`, `POST /auth/reset-password`,
`POST /auth/activate-invitation`, `GET /bootstrap`

Data: `PATCH /users/:id`, `PATCH /users/:id/suspension`,
`POST /properties`, `POST /payments`, `POST /adjustments`,
`POST /tickets`, `PATCH /tickets/:id`, `POST /tasks`,
`PATCH /tasks/:id/toggle`, `PATCH /inspections/:id/items/:itemId`,
`POST /inspections/:id/sign`, `POST /messages`, `POST /invitations`,
`POST /simulate/rent`, `POST /simulate/maintenance`, `GET /health`

## Database tables

`users`, `landlord_accounts`, `account_members`, `tenancy_members`,
`tenant_invitations`, `platform_admins`, `auth_audit_events`, `properties`,
`units`, `tenancies`, `rent_charges`, `rent_payments`, `ledger_adjustments`,
`maintenance_tickets`, `tasks`, `inspections`, `conversations`, `messages`,
`documents`, `audit_logs`, `subscription_plans`, `email_verifications`
(hashed, expiring, single-use), `password_resets` (hashed, expiring,
single-use), `meta`.

Most entity rows store the full object as JSON in a `data` column plus a
primary-key `id`; `users` and the token tables use proper columns because
they are security-relevant.

## Not done in phase 1 (honest gaps)

- No email sender (see above); no real TOTP/MFA; no file upload for photos
  or attachments (seed photos are sample URLs, not evidence)
- No real-time push / multi-device sync beyond the shared SQLite file;
  the SQLite file is single-server, local only
- Legal-resource bookmarks are a local UI preference, not persisted
- Real-time analytics trend (months before the current data) is still
  based on the old static trend; only the current month is computed from
  live charges
- No rate limiting, no HTTPS termination, no backup/restore for the DB file
- Landlord ownership is not yet enforced on every write endpoint by id
  (tickets, inspections, tasks, messages, invitations); only bootstrap
  filtering and payment ownership are enforced
- Multi-role demo user Alex Wong, as landlord, now sees 0 properties
  (seed properties belong to David Miller); as tenant he still sees his unit
- UI click-through in a real browser was not performed by this phase's
  agent (no live browser); API-level integration and Vite dev serving were
  verified instead — a manual UI pass is still recommended before release
- The old `@google/genai` / `express` dependencies in package.json are
  unused by the UI; Gemini is not implemented and is no longer claimed in
  `metadata.json`

## Before pushing to GitHub

- [ ] Review the diff on branch `backend-phase1` (do **not** push yet)
- [ ] Confirm `data/` and `.env` are not in the diff (they are git-ignored)
- [ ] Decide whether demo accounts / `DemoPass123` should stay in a public
  repo, or be removed / gated behind a local-only flag
- [ ] Set a real `JWT_SECRET` for any non-local run and remove the dev fallback
- [ ] Add an email sender and real TOTP before exposing admin or tenant
  accounts to real users
