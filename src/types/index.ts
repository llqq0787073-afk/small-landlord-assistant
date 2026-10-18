export type UserRole = 'landlord' | 'tenant' | 'admin';
export type Language = 'en' | 'zh';

export type PropertyType = 'single_family' | 'townhouse' | 'multi_family' | 'apartment' | 'condo';
export type UnitStatus = 'occupied' | 'vacant' | 'maintenance' | 'inactive';
export type LeaseStatus = 'draft' | 'pending' | 'active' | 'ended' | 'renewed' | 'terminated';
export type PaymentMethod = 'bank_transfer' | 'check' | 'zelle' | 'cash' | 'credit_card' | 'other';
export type PaymentSource = 'landlord_reported' | 'online_portal';
export type TicketPriority = 'emergency' | 'high' | 'medium' | 'low';
export type TicketStatus = 'submitted' | 'reviewed' | 'in_progress' | 'completed' | 'closed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'canceled';
export type InspectionType = 'move_in' | 'move_out' | 'routine';
export type InspectionStatus = 'in_progress' | 'pending_tenant_review' | 'completed';
export type RoomCondition = 'excellent' | 'good' | 'fair' | 'damaged';
export type VerificationStatus = 'verified' | 'pending_review' | 'archived';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[]; // Supports multi-role users (e.g. Landlord & Tenant)
  phone?: string;
  preferredLanguage: Language;
  avatarUrl?: string;
  unitId?: string; // For tenants
  propertyId?: string; // For tenants
  status?: 'active' | 'suspended' | 'pending_verification';
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LandlordAccount {
  id: string;
  name: string;
  ownerId: string;
  planId: string;
  maxUnits: number;
  createdAt: string;
}

export interface AccountMember {
  id: string;
  accountId: string;
  userId: string;
  role: 'owner' | 'manager' | 'viewer';
  joinedAt: string;
}

export interface TenancyMember {
  id: string;
  tenancyId: string;
  userId: string;
  unitId: string;
  propertyId: string;
  status: 'active' | 'expired';
  joinedAt: string;
}

export interface TenantInvitation {
  id: string;
  propertyId: string;
  unitId: string;
  tenancyId: string;
  propertyName: string;
  unitNumber: string;
  email: string;
  invitationCode: string;
  codeHash: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  createdBy: string;
  createdAt: string;
  usedAt?: string;
}

export interface PlatformAdmin {
  id: string;
  userId: string;
  email: string;
  mfaEnabled: boolean;
  permissions: string[];
  createdAt: string;
}

export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SIGNUP_LANDLORD'
  | 'TENANT_INVITE_CREATED'
  | 'TENANT_INVITE_ACTIVATED'
  | 'MFA_CHALLENGE_SUCCESS'
  | 'MFA_CHALLENGE_FAILED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'ROLE_SWITCHED'
  | 'EMAIL_VERIFIED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_ACTIVATED'
  | 'PROFILE_UPDATED';

export interface AuthAuditEvent {
  id: string;
  userId?: string;
  actorEmail: string;
  actorRole?: UserRole;
  eventType: AuthEventType;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  monthlyRent: number;
  securityDeposit: number;
  status: UnitStatus;
  currentTenancyId?: string;
  notes?: string;
  appliances: string[];
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string; // 2-letter state code, e.g. 'MD', 'VA', 'CA'
  county: string;
  zip: string;
  type: PropertyType;
  unitsCount: number;
  yearBuilt: number;
  notes?: string;
  createdAt: string;
}

export interface Tenancy {
  id: string;
  unitId: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  dueDay: number; // e.g. 1st of month
  securityDeposit: number;
  depositHeldStatus: 'held_in_escrow' | 'returned' | 'partial_deduction';
  depositBank?: string;
  status: LeaseStatus;
  leaseDocumentUrl?: string;
  version: number;
}

export interface RentCharge {
  id: string;
  tenancyId: string;
  unitId: string;
  propertyId: string;
  billingMonth: string; // YYYY-MM
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  type: 'rent' | 'late_fee' | 'utility' | 'deposit';
}

export interface RentPayment {
  id: string;
  tenancyId: string;
  unitId: string;
  chargeId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  source: PaymentSource; // "landlord_reported" mandatory tag
  referenceNumber?: string;
  notes?: string;
  reportedBy: string;
  createdAt: string;
}

export interface LedgerAdjustment {
  id: string;
  chargeId: string;
  tenancyId: string;
  amount: number; // positive or negative
  reason: string;
  recordedBy: string;
  date: string;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  propertyId: string;
  unitId: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  category: 'plumbing' | 'hvac' | 'electrical' | 'appliance' | 'structural' | 'pest' | 'other';
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  isEmergency: boolean;
  assignedVendor?: string;
  estimatedCost?: number;
  actualCost?: number;
  photos: string[];
  completionPhotos?: string[];
  resolutionNotes?: string;
  submittedAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  propertyId?: string;
  unitId?: string;
  relatedType?: 'maintenance' | 'lease_renewal' | 'inspection' | 'general';
  relatedId?: string;
  assigneeName: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

export interface EvidenceFile {
  id: string;
  fileName: string;
  storageKey: string;
  url: string;
  sha256Hash: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  serverReceivedAt: string;
  exifDateTime?: string;
  exifGpsNote?: string;
}

export interface InspectionItem {
  id: string;
  roomName: string;
  itemKey: string;
  condition: RoomCondition;
  notes: string;
  wearTearCategory: 'normal_wear' | 'potential_damage' | 'undetermined';
  evidenceFiles: EvidenceFile[];
}

export interface Inspection {
  id: string;
  unitId: string;
  propertyId: string;
  tenancyId: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  items: InspectionItem[];
  landlordSigned: boolean;
  landlordSignedAt?: string;
  landlordSignatureName?: string;
  tenantSigned: boolean;
  tenantSignedAt?: string;
  tenantSignatureName?: string;
  version: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  body: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf';
  sentAt: string;
  read: boolean;
  linkedTicketId?: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  tenantName: string;
  unitNumber: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface LegalResource {
  id: string;
  jurisdictionId: string; // state code or 'FEDERAL'
  jurisdictionName: string;
  topicId: string; // e.g. 'security_deposits'
  topicNameEn: string;
  topicNameZh: string;
  titleEn: string;
  titleZh: string;
  summaryEn: string;
  summaryZh: string;
  officialAgency: string;
  officialUrl: string;
  resourceType: 'statute' | 'official_guide' | 'court_rules' | 'disclosure_form' | 'agency_portal';
  verificationStatus: VerificationStatus;
  effectiveDate: string;
  verifiedAt: string;
  lastCheckedAt: string;
  citationText?: string;
  isBookmarked?: boolean;
}

export interface USStateLegalProfile {
  code: string;
  name: string;
  depositLimitSummary: string;
  depositReturnDays: number;
  entryNoticeHours: number;
  lateFeeSummary: string;
  officialAgency: string;
  officialTenantRightsUrl: string;
  courtEvictionGuideUrl: string;
  specialDisclosures: string[];
}

export interface DocumentItem {
  id: string;
  propertyId: string;
  unitId?: string;
  name: string;
  type: 'lease' | 'inspection_report' | 'rent_receipt' | 'repair_invoice' | 'insurance' | 'disclosure';
  storageKey: string;
  fileSize: string;
  uploadedAt: string;
  sha256Hash: string;
}

export interface SubscriptionPlan {
  id: string;
  nameEn: string;
  nameZh: string;
  unitLimit: number;
  priceMonthly: number;
  isPopular?: boolean;
  featuresEn: string[];
  featuresZh: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}
