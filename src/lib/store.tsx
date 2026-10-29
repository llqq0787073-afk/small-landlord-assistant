import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Property,
  Unit,
  Tenancy,
  RentCharge,
  RentPayment,
  LedgerAdjustment,
  MaintenanceTicket,
  Task,
  Inspection,
  Message,
  Conversation,
  LegalResource,
  SubscriptionPlan,
  AuditLog,
  DocumentItem,
  UserRole,
  UserProfile,
  LandlordAccount,
  AccountMember,
  TenancyMember,
  TenantInvitation,
  PlatformAdmin,
  AuthAuditEvent,
  AuthEventType
} from '../types';
import { INITIAL_LEGAL_RESOURCES } from './legalResourcesData';
import { api, getToken, setToken, ApiError } from './api';

export interface AppState {
  currentRole: UserRole;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  activeRoute: string; // e.g. '/', '/register/landlord', '/register/tenant', '/login', '/auth/mfa', '/select-role', '/forgot-password', '/reset-password', '/verify-email', '/settings/profile', '/landlord/dashboard', '/tenant/dashboard', '/admin/dashboard'
  profiles: UserProfile[];
  landlordAccounts: LandlordAccount[];
  accountMembers: AccountMember[];
  tenancyMembers: TenancyMember[];
  tenantInvitations: TenantInvitation[];
  platformAdmins: PlatformAdmin[];
  authAuditEvents: AuthAuditEvent[];
  pendingMfaUser: UserProfile | null;
  pendingVerificationEmail: string | null;
  activeResetToken: { email: string; token: string; expiresAt: string } | null;
  properties: Property[];
  units: Unit[];
  tenancies: Tenancy[];
  rentCharges: RentCharge[];
  payments: RentPayment[];
  adjustments: LedgerAdjustment[];
  maintenanceTickets: MaintenanceTicket[];
  tasks: Task[];
  inspections: Inspection[];
  conversations: Conversation[];
  messages: Message[];
  legalResources: LegalResource[];
  documents: DocumentItem[];
  auditLogs: AuditLog[];
  subscriptionPlans: SubscriptionPlan[];
  activePlanId: string;
  toastMessage: { text: string; type: 'success' | 'info' | 'warning' } | null;
}

interface AppContextType extends AppState {
  setCurrentRole: (role: UserRole) => void;
  setActiveRoute: (route: string) => void;
  login: (email: string, password: string, portalRole?: UserRole) => Promise<{ success: boolean; requiresMfa?: boolean; requiresRoleSelect?: boolean; error?: string; user?: UserProfile }>;
  verifyMfaCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerLandlord: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string, token?: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<void>;
  activateTenantInvitation: (code: string, name: string, email: string, password: string) => Promise<{ success: boolean; unitInfo?: string; error?: string }>;
  createTenantInvitation: (propertyId: string, unitId: string, tenancyId: string, email: string) => Promise<TenantInvitation | null>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchActiveRole: (role: UserRole) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleUserSuspension: (userId: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (target: 'landlord' | 'tenant' | 'admin' | 'multi' | 'suspended') => Promise<void>;
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>, unitDetails: { rent: number; deposit: number; bed: number; bath: number; sqft: number }) => Promise<void>;
  recordPayment: (payment: { unitId: string; tenancyId: string; chargeId: string; amount: number; method: RentPayment['method']; reference?: string; notes?: string }) => Promise<void>;
  addLedgerAdjustment: (chargeId: string, tenancyId: string, amount: number, reason: string) => Promise<void>;
  addMaintenanceTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'ticketNumber' | 'submittedAt' | 'updatedAt'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: MaintenanceTicket['status'], resolutionNotes?: string, actualCost?: number) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  updateInspectionItem: (inspectionId: string, itemId: string, condition: Inspection['items'][0]['condition'], notes: string, category: Inspection['items'][0]['wearTearCategory']) => Promise<void>;
  signInspection: (inspectionId: string, signerRole: 'landlord' | 'tenant', signerName: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, attachmentName?: string, attachmentType?: 'image' | 'pdf') => Promise<void>;
  toggleBookmarkResource: (resourceId: string) => void;
  simulateLiveRentEvent: () => Promise<void>;
  simulateLiveMaintenanceEvent: () => Promise<void>;
  clearToast: () => void;
}

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  landlord: {
    id: 'usr_landlord_1',
    name: 'David Miller',
    email: 'david.miller@rentals.com',
    role: 'landlord',
    roles: ['landlord'],
    phone: '+1 (301) 555-0192',
    preferredLanguage: 'zh',
    status: 'active',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: '2025-01-10T08:00:00Z',
    lastLoginAt: '2026-10-18T09:20:00Z'
  },
  tenant: {
    id: 'usr_tenant_1',
    name: 'Emily Zhang (张晓雯)',
    email: 'emily.zhang@gmail.com',
    role: 'tenant',
    roles: ['tenant'],
    phone: '+1 (240) 555-8834',
    preferredLanguage: 'zh',
    unitId: 'unit_2b',
    propertyId: 'prop_elmwood',
    status: 'active',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: '2025-10-25T14:30:00Z',
    lastLoginAt: '2026-10-17T15:25:00Z'
  },
  admin: {
    id: 'usr_admin_1',
    name: 'Sarah Lin',
    email: 'admin.sarah@smalllandlord.app',
    role: 'admin',
    roles: ['admin'],
    phone: '+1 (415) 555-3210',
    preferredLanguage: 'en',
    status: 'active',
    emailVerified: true,
    mfaEnabled: true,
    createdAt: '2024-11-01T10:00:00Z',
    lastLoginAt: '2026-10-18T08:45:00Z'
  }
};

export const SEED_PROFILES: UserProfile[] = [
  DEMO_USERS.landlord,
  DEMO_USERS.tenant,
  DEMO_USERS.admin,
  {
    id: 'usr_multi_1',
    name: 'Alex Wong (王嘉明)',
    email: 'alex.wong@metroproperties.com',
    role: 'landlord',
    roles: ['landlord', 'tenant'],
    phone: '+1 (202) 555-9011',
    preferredLanguage: 'zh',
    unitId: 'unit_1a',
    propertyId: 'prop_elmwood',
    status: 'active',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: '2025-06-15T11:00:00Z',
    lastLoginAt: '2026-10-16T12:00:00Z'
  },
  {
    id: 'usr_suspended_1',
    name: 'Suspended Account Demo',
    email: 'restricted.user@example.com',
    role: 'tenant',
    roles: ['tenant'],
    status: 'suspended',
    emailVerified: true,
    preferredLanguage: 'en',
    createdAt: '2025-09-01T10:00:00Z'
  },
  {
    id: 'usr_pending_1',
    name: 'Pending Verification Demo',
    email: 'new.pending@example.com',
    role: 'landlord',
    roles: ['landlord'],
    status: 'pending_verification',
    emailVerified: false,
    preferredLanguage: 'en',
    createdAt: '2026-10-18T01:00:00Z'
  }
];

export const SEED_LANDLORD_ACCOUNTS: LandlordAccount[] = [
  {
    id: 'acct_miller_holdings',
    name: 'Miller Capital Real Estate LLC',
    ownerId: 'usr_landlord_1',
    planId: 'standard',
    maxUnits: 10,
    createdAt: '2025-01-10'
  }
];

export const SEED_ACCOUNT_MEMBERS: AccountMember[] = [
  {
    id: 'acct_mem_1',
    accountId: 'acct_miller_holdings',
    userId: 'usr_landlord_1',
    role: 'owner',
    joinedAt: '2025-01-10'
  }
];

export const SEED_TENANCY_MEMBERS: TenancyMember[] = [
  {
    id: 'tmem_1',
    tenancyId: 'ten_2b',
    userId: 'usr_tenant_1',
    unitId: 'unit_2b',
    propertyId: 'prop_elmwood',
    status: 'active',
    joinedAt: '2025-11-01'
  },
  {
    id: 'tmem_2',
    tenancyId: 'ten_1a',
    userId: 'usr_tenant_marcus',
    unitId: 'unit_1a',
    propertyId: 'prop_elmwood',
    status: 'active',
    joinedAt: '2025-08-01'
  }
];

export const SEED_TENANT_INVITATIONS: TenantInvitation[] = [
  {
    id: 'inv_austin_b_01',
    propertyId: 'prop_austin_condo',
    unitId: 'unit_austin_b',
    tenancyId: 'ten_austin_b_draft',
    propertyName: 'Barton Springs Duplex / 奥斯汀双拼',
    unitNumber: 'Unit B',
    email: 'austin.tenant@techcorp.io',
    invitationCode: 'SLA-7842-ELM',
    codeHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    expiresAt: '2026-11-30T23:59:59Z',
    status: 'pending',
    createdBy: 'David Miller',
    createdAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'inv_oakview_02',
    propertyId: 'prop_oakview',
    unitId: 'unit_oakview_main',
    tenancyId: 'ten_oakview',
    propertyName: 'Oakview Colonial House / 橡树景观独栋',
    unitNumber: 'Main House',
    email: 'rvance.med@virginia.edu',
    invitationCode: 'VA-OAK-9921',
    codeHash: 'f4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b866',
    expiresAt: '2026-02-01T00:00:00Z',
    status: 'accepted',
    createdBy: 'David Miller',
    createdAt: '2025-12-20T12:00:00Z',
    usedAt: '2025-12-22T14:15:00Z'
  }
];

export const SEED_PLATFORM_ADMINS: PlatformAdmin[] = [
  {
    id: 'padm_1',
    userId: 'usr_admin_1',
    email: 'admin.sarah@smalllandlord.app',
    mfaEnabled: true,
    permissions: ['SYSTEM_SUPERADMIN', 'SECURITY_AUDIT', 'SAAS_PLANS', 'LEGAL_VERIFICATION'],
    createdAt: '2024-11-01'
  }
];

export const SEED_AUTH_AUDIT_EVENTS: AuthAuditEvent[] = [
  {
    id: 'aev_1',
    userId: 'usr_admin_1',
    actorEmail: 'admin.sarah@smalllandlord.app',
    actorRole: 'admin',
    eventType: 'MFA_CHALLENGE_SUCCESS',
    ipAddress: '198.51.100.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2026-10-18T08:45:12Z',
    details: 'Admin passed TOTP 2FA verification challenge for platform management portal'
  },
  {
    id: 'aev_2',
    userId: 'usr_landlord_1',
    actorEmail: 'david.miller@rentals.com',
    actorRole: 'landlord',
    eventType: 'LOGIN_SUCCESS',
    ipAddress: '192.0.2.14',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2026-10-18T09:20:00Z',
    details: 'Landlord authenticated with session persistence token'
  },
  {
    id: 'aev_3',
    userId: 'usr_landlord_1',
    actorEmail: 'david.miller@rentals.com',
    actorRole: 'landlord',
    eventType: 'TENANT_INVITE_CREATED',
    ipAddress: '192.0.2.14',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2026-10-15T10:00:00Z',
    details: 'Generated one-time invite code SLA-7842-ELM for Austin Duplex Unit B'
  },
  {
    id: 'aev_4',
    userId: 'usr_tenant_1',
    actorEmail: 'emily.zhang@gmail.com',
    actorRole: 'tenant',
    eventType: 'TENANT_INVITE_ACTIVATED',
    ipAddress: '198.51.100.89',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)',
    timestamp: '2025-10-25T14:35:00Z',
    details: 'Activated tenant account and cryptographically verified Elmwood Unit 2B tenancy'
  }
];

export const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop_elmwood',
    name: 'Elmwood Townhomes / 榆树林联排',
    address: '4720 Elmwood Terrace',
    city: 'Bethesda',
    state: 'MD',
    county: 'Montgomery County',
    zip: '20814',
    type: 'townhouse',
    unitsCount: 2,
    yearBuilt: 1986,
    notes: 'Well maintained brick exterior, dedicated parking bays, close to NIH & Metro.',
    createdAt: '2025-01-15'
  },
  {
    id: 'prop_oakview',
    name: 'Oakview Colonial House / 橡树景观独栋',
    address: '1108 Oakview Drive',
    city: 'Arlington',
    state: 'VA',
    county: 'Arlington County',
    zip: '22207',
    type: 'single_family',
    unitsCount: 1,
    yearBuilt: 1974, // pre-1978 lead paint disclosure applicable!
    notes: 'Single family home with fenced backyard. Lead-based paint disclosure certified in lease.',
    createdAt: '2025-03-20'
  },
  {
    id: 'prop_austin_condo',
    name: 'Barton Springs Duplex / 奥斯汀双拼',
    address: '2204 Barton Skyway',
    city: 'Austin',
    state: 'TX',
    county: 'Travis County',
    zip: '78704',
    type: 'multi_family',
    unitsCount: 2,
    yearBuilt: 2012,
    notes: 'Modern duplex with separate meters and HVAC heat pumps.',
    createdAt: '2025-06-10'
  }
];

export const SEED_UNITS: Unit[] = [
  {
    id: 'unit_1a',
    propertyId: 'prop_elmwood',
    unitNumber: 'Unit 1A',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1150,
    monthlyRent: 2400,
    securityDeposit: 2400,
    status: 'occupied',
    appliances: ['Refrigerator', 'Dishwasher', 'Microwave', 'Washer/Dryer in unit', 'Central AC']
  },
  {
    id: 'unit_2b',
    propertyId: 'prop_elmwood',
    unitNumber: 'Unit 2B',
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 1050,
    monthlyRent: 2200,
    securityDeposit: 2200,
    status: 'occupied',
    appliances: ['Stainless Range', 'Dishwasher', 'Washer/Dryer', 'Nest Thermostat']
  },
  {
    id: 'unit_oakview_main',
    propertyId: 'prop_oakview',
    unitNumber: 'Main House',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2600,
    monthlyRent: 3800,
    securityDeposit: 3800,
    status: 'occupied',
    appliances: ['Dual Refrigerator', 'Induction Cooktop', 'Wine Cooler', 'HVAC Multi-zone']
  },
  {
    id: 'unit_austin_a',
    propertyId: 'prop_austin_condo',
    unitNumber: 'Unit A',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
    monthlyRent: 2700,
    securityDeposit: 2700,
    status: 'occupied',
    appliances: ['Gas Range', 'Smart Locks', 'Tankless Water Heater']
  },
  {
    id: 'unit_austin_b',
    propertyId: 'prop_austin_condo',
    unitNumber: 'Unit B',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    monthlyRent: 2100,
    securityDeposit: 2100,
    status: 'vacant', // 1 vacant unit to show occupancy rate of 80% (4/5 units)
    appliances: ['Electric Oven', 'Dishwasher', 'Dryer']
  }
];

export const SEED_TENANCIES: Tenancy[] = [
  {
    id: 'ten_1a',
    unitId: 'unit_1a',
    propertyId: 'prop_elmwood',
    tenantName: 'Marcus Johnson',
    tenantEmail: 'marcus.j@gmail.com',
    tenantPhone: '+1 (301) 555-7712',
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    rentAmount: 2400,
    dueDay: 1,
    securityDeposit: 2400,
    depositHeldStatus: 'held_in_escrow',
    depositBank: 'PNC Bank Maryland Escrow #***4412',
    status: 'active',
    version: 1
  },
  {
    id: 'ten_2b',
    unitId: 'unit_2b',
    propertyId: 'prop_elmwood',
    tenantName: 'Emily Zhang (张晓雯)',
    tenantEmail: 'emily.zhang@gmail.com',
    tenantPhone: '+1 (240) 555-8834',
    startDate: '2025-11-01',
    endDate: '2026-10-31', // Expiring in October 2026!
    rentAmount: 2200,
    dueDay: 1,
    securityDeposit: 2200,
    depositHeldStatus: 'held_in_escrow',
    depositBank: 'M&T Bank MD Escrow #***9021',
    status: 'active',
    version: 1
  },
  {
    id: 'ten_oakview',
    unitId: 'unit_oakview_main',
    propertyId: 'prop_oakview',
    tenantName: 'Dr. Robert & Claire Vance',
    tenantEmail: 'rvance.med@virginia.edu',
    tenantPhone: '+1 (703) 555-4491',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rentAmount: 3800,
    dueDay: 1,
    securityDeposit: 3800,
    depositHeldStatus: 'held_in_escrow',
    depositBank: 'Capital One VA Escrow #***1109',
    status: 'active',
    version: 1
  },
  {
    id: 'ten_austin_a',
    unitId: 'unit_austin_a',
    propertyId: 'prop_austin_condo',
    tenantName: 'Liam & Sophia Chen',
    tenantEmail: 'schen.design@austin.tech',
    tenantPhone: '+1 (512) 555-6677',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    rentAmount: 2700,
    dueDay: 1,
    securityDeposit: 2700,
    depositHeldStatus: 'held_in_escrow',
    depositBank: 'Frost Bank Austin #***5523',
    status: 'active',
    version: 1
  }
];

export const SEED_CHARGES: RentCharge[] = [
  {
    id: 'chg_1a_oct',
    tenancyId: 'ten_1a',
    unitId: 'unit_1a',
    propertyId: 'prop_elmwood',
    billingMonth: '2026-10',
    dueDate: '2026-10-01',
    amount: 2400,
    paidAmount: 2400,
    status: 'paid',
    type: 'rent'
  },
  {
    id: 'chg_2b_oct',
    tenancyId: 'ten_2b',
    unitId: 'unit_2b',
    propertyId: 'prop_elmwood',
    billingMonth: '2026-10',
    dueDate: '2026-10-01',
    amount: 2200,
    paidAmount: 1550, // Partial payment of $1,550 recorded; balance $650! Exactly matches spec wireframe!
    status: 'partial',
    type: 'rent'
  },
  {
    id: 'chg_oakview_oct',
    tenancyId: 'ten_oakview',
    unitId: 'unit_oakview_main',
    propertyId: 'prop_oakview',
    billingMonth: '2026-10',
    dueDate: '2026-10-01',
    amount: 3800,
    paidAmount: 3800,
    status: 'paid',
    type: 'rent'
  },
  {
    id: 'chg_austin_oct',
    tenancyId: 'ten_austin_a',
    unitId: 'unit_austin_a',
    propertyId: 'prop_austin_condo',
    billingMonth: '2026-10',
    dueDate: '2026-10-01',
    amount: 2700,
    paidAmount: 2700,
    status: 'paid',
    type: 'rent'
  }
];

export const SEED_PAYMENTS: RentPayment[] = [
  {
    id: 'pay_1a_oct',
    tenancyId: 'ten_1a',
    unitId: 'unit_1a',
    chargeId: 'chg_1a_oct',
    amount: 2400,
    paymentDate: '2026-10-01',
    method: 'bank_transfer',
    source: 'landlord_reported',
    referenceNumber: 'ACH-PNC-99812',
    notes: 'Received via direct electronic transfer',
    reportedBy: 'David Miller',
    createdAt: '2026-10-01T14:22:00Z'
  },
  {
    id: 'pay_2b_part',
    tenancyId: 'ten_2b',
    unitId: 'unit_2b',
    chargeId: 'chg_2b_oct',
    amount: 1550,
    paymentDate: '2026-10-03',
    method: 'zelle',
    source: 'landlord_reported',
    referenceNumber: 'ZLL-90342',
    notes: 'Partial payment received; remaining $650 promised by Oct 20th',
    reportedBy: 'David Miller',
    createdAt: '2026-10-03T18:10:00Z'
  },
  {
    id: 'pay_oakview_oct',
    tenancyId: 'ten_oakview',
    unitId: 'unit_oakview_main',
    chargeId: 'chg_oakview_oct',
    amount: 3800,
    paymentDate: '2026-09-30',
    method: 'check',
    source: 'landlord_reported',
    referenceNumber: 'CHK #4012',
    notes: 'Deposited check into Capital One',
    reportedBy: 'David Miller',
    createdAt: '2026-09-30T10:00:00Z'
  },
  {
    id: 'pay_austin_oct',
    tenancyId: 'ten_austin_a',
    unitId: 'unit_austin_a',
    chargeId: 'chg_austin_oct',
    amount: 2700,
    paymentDate: '2026-10-02',
    method: 'bank_transfer',
    source: 'landlord_reported',
    referenceNumber: 'TX-ACH-8841',
    notes: 'Regular monthly payment confirmed',
    reportedBy: 'David Miller',
    createdAt: '2026-10-02T16:30:00Z'
  }
];

export const SEED_MAINTENANCE: MaintenanceTicket[] = [
  {
    id: 'tkt_001',
    ticketNumber: 'WO-2026-089',
    propertyId: 'prop_elmwood',
    unitId: 'unit_2b',
    requesterName: 'Emily Zhang',
    requesterEmail: 'emily.zhang@gmail.com',
    title: 'Kitchen faucet pipe slow drip under sink / 厨房水槽下方轻微滴水',
    category: 'plumbing',
    description: 'Noticed a slow steady leak beneath the P-trap when running cold water. Cleaned the cabinet, placed a plastic basin.',
    priority: 'medium',
    status: 'in_progress',
    isEmergency: false,
    assignedVendor: 'Apex Plumbing DMV (License #MD-PL8831)',
    estimatedCost: 180,
    actualCost: undefined,
    photos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80'],
    submittedAt: '2026-10-12T09:15:00Z',
    updatedAt: '2026-10-14T11:00:00Z'
  },
  {
    id: 'tkt_002',
    ticketNumber: 'WO-2026-088',
    propertyId: 'prop_oakview',
    unitId: 'unit_oakview_main',
    requesterName: 'Robert Vance',
    requesterEmail: 'rvance.med@virginia.edu',
    title: 'HVAC Air Filter Replacement & Fall Tune-up / 空调滤网更换与秋季巡检',
    category: 'hvac',
    description: 'Scheduled seasonal maintenance and thermostat sensor calibration before winter heating season.',
    priority: 'low',
    status: 'completed',
    isEmergency: false,
    assignedVendor: 'Arlington Climate Solutions',
    estimatedCost: 150,
    actualCost: 145,
    photos: [],
    completionPhotos: [],
    resolutionNotes: 'Filters replaced (Merv 13), heat pump refrigerant pressure verified normal.',
    submittedAt: '2026-10-05T14:00:00Z',
    updatedAt: '2026-10-08T16:30:00Z',
    closedAt: '2026-10-08T16:30:00Z'
  },
  {
    id: 'tkt_003',
    ticketNumber: 'WO-2026-090',
    propertyId: 'prop_austin_condo',
    unitId: 'unit_austin_a',
    requesterName: 'Liam Chen',
    requesterEmail: 'schen.design@austin.tech',
    title: 'Patio sliding door lock latch sticking / 后院推拉门门锁卡顿',
    category: 'structural',
    description: 'Secondary safety bolt needs lubrication or readjustment. Door closes but lock requires heavy force.',
    priority: 'low',
    status: 'reviewed',
    isEmergency: false,
    assignedVendor: 'Handyman Joe Austin',
    estimatedCost: 85,
    photos: [],
    submittedAt: '2026-10-16T11:30:00Z',
    updatedAt: '2026-10-17T10:00:00Z'
  }
];

export const SEED_TASKS: Task[] = [
  {
    id: 'tsk_1',
    title: 'Review Emily Zhang (Unit 2B) lease renewal terms / 审核 2B 单元续租方案',
    description: 'Current 12-month lease ends October 31, 2026. Prepare renewal offer with 3.5% adjustment per market rates.',
    propertyId: 'prop_elmwood',
    unitId: 'unit_2b',
    relatedType: 'lease_renewal',
    relatedId: 'ten_2b',
    assigneeName: 'David Miller',
    dueDate: '2026-10-20',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2026-10-10'
  },
  {
    id: 'tsk_2',
    title: 'Follow up on Unit 2B remaining balance ($650) / 跟进 2B 剩余租金尾款',
    description: 'Tenant partial payment registered on Oct 3; follow up before Oct 20th deadline.',
    propertyId: 'prop_elmwood',
    unitId: 'unit_2b',
    relatedType: 'general',
    assigneeName: 'David Miller',
    dueDate: '2026-10-19',
    priority: 'medium',
    status: 'todo',
    createdAt: '2026-10-04'
  },
  {
    id: 'tsk_3',
    title: 'Prepare Unit B Austin vacancy listing / 准备奥斯汀 B 单元招租',
    description: 'Take updated staging photos and advertise on Zillow/Realtor.',
    propertyId: 'prop_austin_condo',
    unitId: 'unit_austin_b',
    assigneeName: 'David Miller',
    dueDate: '2026-10-25',
    priority: 'medium',
    status: 'todo',
    createdAt: '2026-10-15'
  },
  {
    id: 'tsk_4',
    title: 'Annual smoke & CO detector battery test / 年度烟雾及一氧化碳报警器测试',
    description: 'Mandatory annual inspection for Arlington property.',
    propertyId: 'prop_oakview',
    dueDate: '2026-10-14',
    priority: 'high',
    status: 'completed',
    assigneeName: 'David Miller',
    createdAt: '2026-10-01'
  }
];

export const SEED_INSPECTION: Inspection = {
  id: 'insp_2b_movein',
  unitId: 'unit_2b',
  propertyId: 'prop_elmwood',
  tenancyId: 'ten_2b',
  type: 'move_in',
  status: 'completed',
  scheduledDate: '2025-10-31',
  completedDate: '2025-10-31',
  landlordSigned: true,
  landlordSignedAt: '2025-10-31T15:20:00Z',
  landlordSignatureName: 'David Miller (Certified Landlord)',
  tenantSigned: true,
  tenantSignedAt: '2025-10-31T16:05:00Z',
  tenantSignatureName: 'Emily Zhang (Tenant)',
  version: 1,
  items: [
    {
      id: 'item_kit_counters',
      roomName: 'Kitchen / 厨房',
      itemKey: 'Granite Countertops & Sink',
      condition: 'excellent',
      notes: 'Polished granite countertops, stainless steel undermount sink, zero chips or cracks.',
      wearTearCategory: 'normal_wear',
      evidenceFiles: [
        {
          id: 'ev_01',
          fileName: 'kitchen_counter_movein.jpg',
          storageKey: 'evidence/unit2b/movein_kitchen_01.jpg',
          url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          fileSizeBytes: 2451000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-10-31T14:10:00Z',
          serverReceivedAt: '2025-10-31T14:10:03Z',
          exifDateTime: '2025:10:31 14:08:22',
          exifGpsNote: 'Lat 38.9847 N, Lon 77.0947 W (Bethesda MD)'
        }
      ]
    },
    {
      id: 'item_kit_appliances',
      roomName: 'Kitchen / 厨房',
      itemKey: 'Gas Range & Microwave',
      condition: 'good',
      notes: 'All 4 burners spark and light promptly. Microwave digital display clean.',
      wearTearCategory: 'normal_wear',
      evidenceFiles: [
        {
          id: 'ev_02',
          fileName: 'kitchen_range_movein.jpg',
          storageKey: 'evidence/unit2b/movein_range_02.jpg',
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
          sha256Hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          fileSizeBytes: 1890000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-10-31T14:12:15Z',
          serverReceivedAt: '2025-10-31T14:12:17Z',
          exifDateTime: '2025:10:31 14:11:05',
          exifGpsNote: 'Lat 38.9847 N, Lon 77.0947 W'
        }
      ]
    },
    {
      id: 'item_liv_floors',
      roomName: 'Living Room / 客厅',
      itemKey: 'Hardwood Oak Flooring',
      condition: 'good',
      notes: 'Slight pre-existing minor surface scuff near south window (approx 2 inches), normal wear from previous tenancy.',
      wearTearCategory: 'normal_wear',
      evidenceFiles: [
        {
          id: 'ev_03',
          fileName: 'living_floor_scuff_movein.jpg',
          storageKey: 'evidence/unit2b/living_floor_03.jpg',
          url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600&auto=format&fit=crop&q=80',
          sha256Hash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
          fileSizeBytes: 3105000,
          mimeType: 'image/jpeg',
          uploadedAt: '2025-10-31T14:18:40Z',
          serverReceivedAt: '2025-10-31T14:18:42Z',
          exifDateTime: '2025:10:31 14:17:50',
          exifGpsNote: 'Lat 38.9847 N, Lon 77.0947 W'
        }
      ]
    },
    {
      id: 'item_safety_detectors',
      roomName: 'Safety / 消防安全',
      itemKey: 'Smoke & CO Detectors',
      condition: 'excellent',
      notes: 'Test button activated loud alarm in hallway and upstairs bedroom. 10-year sealed lithium battery verified.',
      wearTearCategory: 'normal_wear',
      evidenceFiles: []
    }
  ]
};

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_unit_2b',
    propertyId: 'prop_elmwood',
    unitId: 'unit_2b',
    tenantId: 'usr_tenant_1',
    tenantName: 'Emily Zhang (张晓雯)',
    unitNumber: 'Unit 2B',
    lastMessageSnippet: 'Hi David, thanks for following up on the sink leak! Apex Plumbing called for Thursday 10 AM.',
    lastMessageAt: '2026-10-17T15:30:00Z',
    unreadCount: 1
  },
  {
    id: 'conv_unit_1a',
    propertyId: 'prop_elmwood',
    unitId: 'unit_1a',
    tenantId: 'usr_tenant_marcus',
    tenantName: 'Marcus Johnson',
    unitNumber: 'Unit 1A',
    lastMessageSnippet: 'Rent transferred for October. Please confirm when received.',
    lastMessageAt: '2026-10-01T14:30:00Z',
    unreadCount: 0
  }
];

export const SEED_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_unit_2b',
    senderId: 'usr_tenant_1',
    senderRole: 'tenant',
    senderName: 'Emily Zhang',
    body: 'Hello David, I noticed a minor water drip under the kitchen sink when doing dishes. I submitted a work order WO-2026-089 with photos.',
    sentAt: '2026-10-12T09:18:00Z',
    read: true,
    linkedTicketId: 'tkt_001'
  },
  {
    id: 'msg_2',
    conversationId: 'conv_unit_2b',
    senderId: 'usr_landlord_1',
    senderRole: 'landlord',
    senderName: 'David Miller',
    body: 'Thanks for flagging it promptly Emily! I reviewed the ticket and contacted Apex Plumbing. They have an opening this Thursday at 10:00 AM.',
    sentAt: '2026-10-14T11:05:00Z',
    read: true,
    linkedTicketId: 'tkt_001'
  },
  {
    id: 'msg_3',
    conversationId: 'conv_unit_2b',
    senderId: 'usr_tenant_1',
    senderRole: 'tenant',
    senderName: 'Emily Zhang',
    body: 'Hi David, thanks for following up on the sink leak! Apex Plumbing called for Thursday 10 AM. I will be working from home.',
    sentAt: '2026-10-17T15:30:00Z',
    read: false,
    linkedTicketId: 'tkt_001'
  }
];

export const SEED_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_1',
    propertyId: 'prop_elmwood',
    unitId: 'unit_2b',
    name: 'Standard Maryland Residential Lease Agreement (Unit 2B).pdf',
    type: 'lease',
    storageKey: 'leases/elmwood_2b_2025.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '2025-10-28',
    sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
  },
  {
    id: 'doc_2',
    propertyId: 'prop_elmwood',
    unitId: 'unit_2b',
    name: 'Maryland Tenants\' Bill of Rights - Mandatory Addendum (2026).pdf',
    type: 'disclosure',
    storageKey: 'disclosures/md_tenants_rights_2026.pdf',
    fileSize: '420 KB',
    uploadedAt: '2026-10-01',
    sha256Hash: '9a8b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
  },
  {
    id: 'doc_3',
    propertyId: 'prop_elmwood',
    unitId: 'unit_2b',
    name: 'Official Move-In Inspection Certificate & SHA-256 Photo Index.pdf',
    type: 'inspection_report',
    storageKey: 'inspections/unit_2b_movein_cert.pdf',
    fileSize: '3.4 MB',
    uploadedAt: '2025-10-31',
    sha256Hash: '3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1'
  },
  {
    id: 'doc_4',
    propertyId: 'prop_oakview',
    unitId: 'unit_oakview_main',
    name: 'EPA Lead-Based Paint Hazard Disclosure & Pamphlet Receipt.pdf',
    type: 'disclosure',
    storageKey: 'disclosures/oakview_epa_lead_disclosure.pdf',
    fileSize: '890 KB',
    uploadedAt: '2025-12-15',
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    timestamp: '2026-10-18T09:30:15Z',
    actorName: 'David Miller',
    actorRole: 'landlord',
    action: 'RECORD_RENT_PAYMENT',
    entityType: 'RentPayment',
    entityId: 'pay_2b_part',
    details: 'Recorded partial payment $1,550 via Zelle with tag Landlord-Reported'
  },
  {
    id: 'aud_2',
    timestamp: '2026-10-17T11:00:22Z',
    actorName: 'Emily Zhang',
    actorRole: 'tenant',
    action: 'SUBMIT_MAINTENANCE_TICKET',
    entityType: 'MaintenanceTicket',
    entityId: 'tkt_001',
    details: 'Submitted ticket for kitchen faucet leak with 1 photo evidence'
  },
  {
    id: 'aud_3',
    timestamp: '2026-10-15T16:45:00Z',
    actorName: 'Sarah Lin',
    actorRole: 'admin',
    action: 'LEGAL_RESOURCE_VERIFICATION',
    entityType: 'LegalResource',
    entityId: 'md-dhcd-tenants-bill',
    details: 'Verified Maryland DHCD October 2026 Tenants Bill of Rights annual update'
  }
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free_trial',
    nameEn: '14-Day Free Trial',
    nameZh: '14天免费试用',
    unitLimit: 2,
    priceMonthly: 0,
    featuresEn: ['Up to 2 rental units', 'Basic rent tracking', 'Maintenance request portal', 'Email notifications'],
    featuresZh: ['最多支持 2 套出租单元', '基础租金分类账', '租客维修申请门户', '站内与邮件提醒']
  },
  {
    id: 'starter',
    nameEn: 'Starter Plan',
    nameZh: '入门版 (Starter)',
    unitLimit: 3,
    priceMonthly: 9,
    featuresEn: ['1–3 rental units ($9/mo)', 'Full rent ledger with Landlord-Reported tags', 'Work order tracking', 'Photo evidence storage (5 GB)', 'US State Legal Resources'],
    featuresZh: ['1–3 套出租单元 ($9/月)', '完整租金分类账与申报标记', '维修工单流转与成本核算', '照片证据云存储 (5 GB)', '全美 50 州租赁法规中心']
  },
  {
    id: 'standard',
    nameEn: 'Standard Plan',
    nameZh: '标准版 (Standard)',
    unitLimit: 10,
    priceMonthly: 19,
    isPopular: true,
    featuresEn: ['4–10 rental units ($19/mo)', 'Everything in Starter', 'Dual-signature Move-in/Out inspections', 'SHA-256 Photo Hash Integrity', 'Real-time Analytics Dashboard', 'CSV & PDF Financial Exports'],
    featuresZh: ['4–10 套出租单元 ($19/月)', '包含入门版全部功能', '双人电子签署房屋检查', 'SHA-256 照片防伪哈希', '实时数据分析看板与报表', 'CSV 与 PDF 财务对账单导出']
  },
  {
    id: 'plus',
    nameEn: 'Plus Compliance',
    nameZh: '增强版 (Plus)',
    unitLimit: 10,
    priceMonthly: 29,
    featuresEn: ['1–10 rental units ($29/mo)', 'Advanced Legal Disclosures Tracker', 'Automated Annual State Rule Alerts', 'Priority Tenant Messaging', '25 GB Secure Document Vault', 'Full Audit Logs Export'],
    featuresZh: ['1–10 套出租单元 ($29/月)', '高级州法强制披露追踪', '年度州法律变更自动预警', '租客优先沟通通道', '25 GB 高防加密文件库', '完整合规审计日志导出']
  }
];

const AppContext = createContext<AppContextType | null>(null);

const EMPTY_USER: UserProfile = {
  id: '', name: '', email: '', role: 'landlord', roles: [],
  phone: '', preferredLanguage: 'zh', status: 'active', emailVerified: false, mfaEnabled: false,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>('landlord');
  const [currentUser, setCurrentUserState] = useState<UserProfile>(EMPTY_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<string>('/');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [landlordAccounts, setLandlordAccounts] = useState<LandlordAccount[]>([]);
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>([]);
  const [tenancyMembers, setTenancyMembers] = useState<TenancyMember[]>([]);
  const [tenantInvitations, setTenantInvitations] = useState<TenantInvitation[]>([]);
  const [platformAdmins, setPlatformAdmins] = useState<PlatformAdmin[]>([]);
  const [authAuditEvents, setAuthAuditEvents] = useState<AuthAuditEvent[]>([]);
  const [pendingMfaUser, setPendingMfaUser] = useState<UserProfile | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [activeResetToken] = useState<{ email: string; token: string; expiresAt: string } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [rentCharges, setRentCharges] = useState<RentCharge[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [adjustments, setAdjustments] = useState<LedgerAdjustment[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [legalResources, setLegalResources] = useState<LegalResource[]>(INITIAL_LEGAL_RESOURCES);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [subscriptionPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [activePlanId, setActivePlanId] = useState<string>('standard');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const clearSession = () => {
    setToken(null);
    setIsAuthenticated(false);
    setCurrentUserState(EMPTY_USER);
    setCurrentRoleState('landlord');
    setPendingMfaUser(null);
    setPendingVerificationEmail(null);
  };

  const applyBootstrap = (data: any, role?: UserRole) => {
    setCurrentUserState(data.currentUser);
    setCurrentRoleState(role || data.currentUser.role);
    setProfiles(data.profiles || []);
    setLandlordAccounts(data.landlordAccounts || []);
    setAccountMembers(data.accountMembers || []);
    setTenancyMembers(data.tenancyMembers || []);
    setTenantInvitations(data.tenantInvitations || []);
    setPlatformAdmins(data.platformAdmins || []);
    setAuthAuditEvents(data.authAuditEvents || []);
    setProperties(data.properties || []);
    setUnits(data.units || []);
    setTenancies(data.tenancies || []);
    setRentCharges(data.rentCharges || []);
    setPayments(data.payments || []);
    setAdjustments(data.adjustments || []);
    setMaintenanceTickets(data.maintenanceTickets || []);
    setTasks(data.tasks || []);
    setInspections(data.inspections || []);
    setConversations(data.conversations || []);
    setMessages(data.messages || []);
    setDocuments(data.documents || []);
    setAuditLogs(data.auditLogs || []);
    if (data.subscriptionPlans?.length) { /* plans are static in the frontend for phase 1 */ }
    setActivePlanId(data.activePlanId || 'standard');
  };

  const refresh = async () => {
    try {
      const data = await api('/bootstrap');
      applyBootstrap(data);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        clearSession();
        setActiveRoute('/');
      }
    }
  };

  // Restore a previous session from the stored JWT, if any.
  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const me = await api('/auth/me');
        setCurrentUserState(me.user);
        setCurrentRoleState(me.role);
        setIsAuthenticated(true);
        await refresh();
        setActiveRoute(me.role === 'tenant' ? '/tenant/dashboard' : me.role === 'admin' ? '/admin/dashboard' : '/landlord/dashboard');
      } catch {
        clearSession();
        setActiveRoute('/');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failToast = (e: unknown, fallback: string) => {
    const msg = e instanceof ApiError ? (e.body?.error || fallback) : fallback;
    setToastMessage({ text: String(msg), type: 'warning' });
  };

  const login = async (email: string, password: string, portalRole?: UserRole) => {
    try {
      const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, portalRole }) });
      setToken(res.token);
      setCurrentUserState(res.user);
      setCurrentRoleState(res.role);
      setIsAuthenticated(true);
      setPendingMfaUser(null);
      await refresh();
      if (res.requiresRoleSelect) { setActiveRoute('/select-role'); return { success: true, requiresRoleSelect: true, user: res.user }; }
      setActiveRoute(res.role === 'tenant' ? '/tenant/dashboard' : res.role === 'admin' ? '/admin/dashboard' : '/landlord/dashboard');
      setToastMessage({ text: `Welcome back, ${res.user.name}!`, type: 'success' });
      return { success: true, user: res.user };
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.body?.error === 'emailUnverifiedNotice') { setPendingVerificationEmail(e.body.pendingVerificationEmail || email); setActiveRoute('/verify-email'); }
        return { success: false, error: e.body?.error || 'invalidCredentials' };
      }
      return { success: false, error: 'invalidCredentials' };
    }
  };

  // MFA is not implemented in phase 1. This deliberately never grants access.
  const verifyMfaCode = async (_code: string) => ({ success: false, error: 'mfaNotImplemented' });

  const logout = () => {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    clearSession();
    setProperties([]); setUnits([]); setTenancies([]); setRentCharges([]); setPayments([]);
    setMaintenanceTickets([]); setTasks([]); setInspections([]); setConversations([]); setMessages([]);
    setActiveRoute('/');
    setToastMessage({ text: 'You have been signed out safely.', type: 'info' });
  };

  const registerLandlord = async (name: string, email: string, password: string) => {
    try {
      const res = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setPendingVerificationEmail(res.pendingVerificationEmail || email.trim().toLowerCase());
      setActiveRoute('/verify-email');
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof ApiError ? (e.body?.error || 'invalidInput') : 'invalidInput' };
    }
  };

  const verifyEmail = async (email: string, token?: string) => {
    if (!token) return { success: false, error: 'invalidVerificationToken' };
    try {
      const res = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, token }) });
      setToken(res.token);
      setCurrentUserState(res.user);
      setCurrentRoleState(res.user.role);
      setIsAuthenticated(true);
      setPendingVerificationEmail(null);
      await refresh();
      setActiveRoute('/landlord/dashboard');
      setToastMessage({ text: 'Email verified successfully! Welcome to your Landlord Portal.', type: 'success' });
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof ApiError ? (e.body?.error || 'invalidVerificationToken') : 'invalidVerificationToken' };
    }
  };

  const activateTenantInvitation = async (code: string, name: string, email: string, password: string) => {
    try {
      const res = await api('/auth/activate-invitation', { method: 'POST', body: JSON.stringify({ code, name, email, password }) });
      setToken(res.token);
      setCurrentUserState(res.user);
      setCurrentRoleState('tenant');
      setIsAuthenticated(true);
      await refresh();
      setActiveRoute('/tenant/dashboard');
      setToastMessage({ text: `Tenant account activated! Linked to ${res.unitInfo}`, type: 'success' });
      return { success: true, unitInfo: res.unitInfo };
    } catch (e) {
      return { success: false, error: e instanceof ApiError ? (e.body?.error || 'invalidInvitationCode') : 'invalidInvitationCode' };
    }
  };

  const createTenantInvitation = async (propertyId: string, unitId: string, tenancyId: string, email: string) => {
    try {
      const res = await api('/invitations', { method: 'POST', body: JSON.stringify({ propertyId, unitId, tenancyId, email }) });
      await refresh();
      setToastMessage({ text: `Tenant invitation code ${res.invitation.invitationCode} generated successfully.`, type: 'success' });
      return res.invitation as TenantInvitation;
    } catch (e) { failToast(e, 'Failed to create invitation'); return null; }
  };

  const requestPasswordReset = async (email: string) => {
    try { await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); return { success: true }; }
    catch (e) { return { success: false, error: e instanceof ApiError ? (e.body?.error || 'invalidInput') : 'invalidInput' }; }
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    try {
      await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
      setToastMessage({ text: 'Password updated successfully! Please sign in with your new credentials.', type: 'success' });
      setActiveRoute('/login');
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof ApiError ? (e.body?.error || 'invalidOrExpiredToken') : 'invalidOrExpiredToken' };
    }
  };

  const switchActiveRole = async (role: UserRole) => {
    try {
      const res = await api('/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) });
      setToken(res.token);
      setCurrentRoleState(role);
      setPendingMfaUser(null);
      await refresh();
      setActiveRoute(role === 'tenant' ? '/tenant/dashboard' : role === 'admin' ? '/admin/dashboard' : '/landlord/dashboard');
      setToastMessage({ text: `Switched to ${role} portal`, type: 'info' });
    } catch (e) { failToast(e, 'Role switch was rejected by the server'); }
  };

  const setCurrentRole = (role: UserRole) => {
    // Never trust the navbar alone: the server validates roles.
    if (currentUser.id && !(currentUser.roles || []).includes(role)) {
      setToastMessage({ text: 'This account does not have that role.', type: 'warning' });
      return;
    }
    void switchActiveRole(role);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      const res = await api(`/users/${currentUser.id}`, { method: 'PATCH', body: JSON.stringify({ name: updates.name, phone: updates.phone, preferredLanguage: updates.preferredLanguage }) });
      setCurrentUserState(res.user);
      setToastMessage({ text: 'Profile settings saved successfully.', type: 'success' });
    } catch (e) { failToast(e, 'Failed to save profile'); }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try { await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }); return { success: true }; }
    catch (e) { return { success: false, error: e instanceof ApiError ? (e.body?.error || 'currentPasswordIncorrect') : 'currentPasswordIncorrect' }; }
  };

  const toggleUserSuspension = async (userId: string) => {
    try { await api(`/users/${userId}/suspension`, { method: 'PATCH' }); await refresh(); setToastMessage({ text: 'User account status updated.', type: 'info' }); }
    catch (e) { failToast(e, 'Failed to update user status'); }
  };

  const quickDemoLogin = async (target: 'landlord' | 'tenant' | 'admin' | 'multi' | 'suspended') => {
    const map: Record<string, string> = {
      landlord: 'david.miller@rentals.com', tenant: 'emily.zhang@gmail.com',
      admin: 'admin.sarah@smalllandlord.app', multi: 'alex.wong@metroproperties.com',
      suspended: 'restricted.user@example.com',
    };
    const res = await login(map[target], 'DemoPass123', target === 'multi' ? undefined : (target === 'suspended' ? undefined : (target as UserRole)));
    if (!res.success) setToastMessage({ text: res.error || 'Login failed', type: 'warning' });
  };

  const addProperty = async (propData: Omit<Property, 'id' | 'createdAt'>, unitDetails: { rent: number; deposit: number; bed: number; bath: number; sqft: number }) => {
    try {
      await api('/properties', { method: 'POST', body: JSON.stringify({ property: propData, unitDetails }) });
      await refresh();
      setToastMessage({ text: `Property "${propData.name}" added successfully.`, type: 'success' });
    } catch (e) { failToast(e, 'Failed to add property'); }
  };

  const recordPayment = async (payment: { unitId: string; tenancyId: string; chargeId: string; amount: number; method: RentPayment['method']; reference?: string; notes?: string }) => {
    try {
      await api('/payments', { method: 'POST', body: JSON.stringify(payment) });
      await refresh();
      setToastMessage({ text: `Payment of $${payment.amount.toLocaleString()} recorded. Marked as Landlord-Reported.`, type: 'success' });
    } catch (e) {
      if (e instanceof ApiError && e.body?.error === 'overpaymentRejected') {
        setToastMessage({ text: `Payment rejected: amount exceeds the remaining balance of $${e.body.remaining}. Overpayments are not silently absorbed.`, type: 'warning' });
      } else failToast(e, 'Failed to record payment');
    }
  };

  const addLedgerAdjustment = async (chargeId: string, tenancyId: string, amount: number, reason: string) => {
    try { await api('/adjustments', { method: 'POST', body: JSON.stringify({ chargeId, tenancyId, amount, reason }) }); await refresh(); setToastMessage({ text: `Ledger adjusted by ${amount >= 0 ? '+' : ''}$${amount}: ${reason}`, type: 'info' }); }
    catch (e) { failToast(e, 'Failed to adjust ledger'); }
  };

  const addMaintenanceTicket = async (ticketData: Omit<MaintenanceTicket, 'id' | 'ticketNumber' | 'submittedAt' | 'updatedAt'>) => {
    try { await api('/tickets', { method: 'POST', body: JSON.stringify(ticketData) }); await refresh(); setToastMessage({ text: 'Maintenance ticket logged successfully.', type: 'success' }); }
    catch (e) { failToast(e, 'Failed to log ticket'); }
  };

  const updateTicketStatus = async (ticketId: string, status: MaintenanceTicket['status'], resolutionNotes?: string, actualCost?: number) => {
    try { await api(`/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify({ status, resolutionNotes, actualCost }) }); await refresh(); setToastMessage({ text: `Ticket status updated to "${status}".`, type: 'info' }); }
    catch (e) { failToast(e, 'Ticket status change was rejected by the server'); }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try { await api('/tasks', { method: 'POST', body: JSON.stringify(taskData) }); await refresh(); setToastMessage({ text: `Task "${taskData.title}" added to agenda.`, type: 'success' }); }
    catch (e) { failToast(e, 'Failed to add task'); }
  };

  const toggleTaskStatus = async (taskId: string) => {
    try { await api(`/tasks/${taskId}/toggle`, { method: 'PATCH' }); await refresh(); }
    catch (e) { failToast(e, 'Failed to update task'); }
  };

  const updateInspectionItem = async (inspectionId: string, itemId: string, condition: Inspection['items'][0]['condition'], notes: string, category: Inspection['items'][0]['wearTearCategory']) => {
    try { await api(`/inspections/${inspectionId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ condition, notes, wearTearCategory: category }) }); await refresh(); }
    catch (e) { failToast(e, 'Inspection is locked or the change was rejected'); }
  };

  const signInspection = async (inspectionId: string, signerRole: 'landlord' | 'tenant', _signerName: string) => {
    try {
      await api(`/inspections/${inspectionId}/sign`, { method: 'POST', body: JSON.stringify({ signerRole }) });
      await refresh();
      setToastMessage({ text: `Inspection signed as ${signerRole}. The server records your account name, not a typed name.`, type: 'success' });
    } catch (e) { failToast(e, 'Signature was rejected: you can only sign your own side'); }
  };

  const sendMessage = async (conversationId: string, text: string, attachmentName?: string, attachmentType?: 'image' | 'pdf') => {
    if (attachmentName) { setToastMessage({ text: 'Attachment upload is not implemented yet; the message was not sent with a file.', type: 'warning' }); return; }
    try { await api('/messages', { method: 'POST', body: JSON.stringify({ conversationId, body: text, attachmentType }) }); await refresh(); }
    catch (e) { failToast(e, 'Failed to send message'); }
  };

  const toggleBookmarkResource = (resourceId: string) => {
    // Phase 1: bookmarks are a local UI preference; legal resources themselves
    // remain the static dataset. This is intentionally not presented as a
    // persisted server feature.
    setLegalResources(prev => prev.map(res => res.id === resourceId ? { ...res, isBookmarked: !res.isBookmarked } : res));
  };

  const simulateLiveRentEvent = async () => {
    try { await api('/simulate/rent', { method: 'POST' }); await refresh(); }
    catch (e) { failToast(e, 'No partial charge to simulate'); }
  };
  const simulateLiveMaintenanceEvent = async () => {
    try { await api('/simulate/maintenance', { method: 'POST' }); await refresh(); }
    catch (e) { failToast(e, 'Failed to create simulated ticket'); }
  };

  const clearToast = () => setToastMessage(null);

  return (
    <AppContext.Provider
      value={{
        currentRole, currentUser, isAuthenticated, activeRoute,
        profiles, landlordAccounts, accountMembers, tenancyMembers, tenantInvitations,
        platformAdmins, authAuditEvents, pendingMfaUser, pendingVerificationEmail, activeResetToken,
        setActiveRoute, login, verifyMfaCode, logout, registerLandlord, verifyEmail,
        activateTenantInvitation, createTenantInvitation, requestPasswordReset, resetPasswordWithToken, resendVerification: async (email: string) => { try { await api('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }); setToastMessage({ text: 'Verification token re-issued. In local development, check the backend terminal log.', type: 'info' }); } catch { setToastMessage({ text: 'Failed to re-issue verification token.', type: 'warning' }); } },
        switchActiveRole, updateUserProfile, toggleUserSuspension, changePassword, quickDemoLogin,
        properties, units, tenancies, rentCharges, payments, adjustments, maintenanceTickets,
        tasks, inspections, conversations, messages, legalResources, documents, auditLogs,
        subscriptionPlans, activePlanId, toastMessage, setCurrentRole, addProperty, recordPayment,
        addLedgerAdjustment, addMaintenanceTicket, updateTicketStatus, addTask, toggleTaskStatus,
        updateInspectionItem, signInspection, sendMessage, toggleBookmarkResource,
        simulateLiveRentEvent, simulateLiveMaintenanceEvent, clearToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
