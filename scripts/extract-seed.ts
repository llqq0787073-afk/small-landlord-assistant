// One-off generator: extracts the frontend demo seed into server/seed.json.
// Run: npx tsx scripts/extract-seed.ts
// The output contains no passwords. The backend assigns a demo password hash
// (see server/db.js / README) to seed users at first import only.
import { writeFileSync } from 'node:fs';
import {
  SEED_PROFILES,
  SEED_LANDLORD_ACCOUNTS,
  SEED_ACCOUNT_MEMBERS,
  SEED_TENANCY_MEMBERS,
  SEED_TENANT_INVITATIONS,
  SEED_PLATFORM_ADMINS,
  SEED_AUTH_AUDIT_EVENTS,
  SEED_PROPERTIES,
  SEED_UNITS,
  SEED_TENANCIES,
  SEED_CHARGES,
  SEED_PAYMENTS,
  SEED_MAINTENANCE,
  SEED_TASKS,
  SEED_INSPECTION,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_DOCUMENTS,
  SEED_AUDIT_LOGS,
  SUBSCRIPTION_PLANS,
} from '../src/lib/store.tsx';

const seed = {
  profiles: SEED_PROFILES,
  landlordAccounts: SEED_LANDLORD_ACCOUNTS,
  accountMembers: SEED_ACCOUNT_MEMBERS,
  tenancyMembers: SEED_TENANCY_MEMBERS,
  tenantInvitations: SEED_TENANT_INVITATIONS,
  platformAdmins: SEED_PLATFORM_ADMINS,
  authAuditEvents: SEED_AUTH_AUDIT_EVENTS,
  properties: SEED_PROPERTIES,
  units: SEED_UNITS,
  tenancies: SEED_TENANCIES,
  rentCharges: SEED_CHARGES,
  rentPayments: SEED_PAYMENTS,
  maintenanceTickets: SEED_MAINTENANCE,
  tasks: SEED_TASKS,
  inspections: [SEED_INSPECTION],
  conversations: SEED_CONVERSATIONS,
  messages: SEED_MESSAGES,
  documents: SEED_DOCUMENTS,
  auditLogs: SEED_AUDIT_LOGS,
  subscriptionPlans: SUBSCRIPTION_PLANS,
};
writeFileSync(new URL('../server/seed.json', import.meta.url), JSON.stringify(seed, null, 2));
console.log('Wrote server/seed.json');
