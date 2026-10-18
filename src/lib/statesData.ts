import { USStateLegalProfile } from '../types';

export const US_STATES_LIST: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

export const STATE_PROFILES: Record<string, USStateLegalProfile> = {
  MD: {
    code: 'MD',
    name: 'Maryland',
    depositLimitSummary: 'Max 2 months rent (or 1 month under certain local rules). Must be placed in escrow within 30 days.',
    depositReturnDays: 45,
    entryNoticeHours: 24, // Reasonable notice required (standard practice 24 hrs)
    lateFeeSummary: 'Maximum 5% of monthly rent amount.',
    officialAgency: 'Maryland Department of Housing and Community Development (DHCD)',
    officialTenantRightsUrl: 'https://dhcd.maryland.gov',
    courtEvictionGuideUrl: 'https://www.mdcourts.gov/legalhelp/housing',
    specialDisclosures: [
      'Maryland Tenants\' Bill of Rights (Mandatory addendum; updated annually, current Oct 2026 edition)',
      'Lead Poisoning Prevention Program (MDE Notice & Registration for pre-1978 properties)',
      'Water meter submetering ratio disclosure'
    ]
  },
  VA: {
    code: 'VA',
    name: 'Virginia',
    depositLimitSummary: 'Max 2 months rent. Return within 45 days along with itemized list of deductions.',
    depositReturnDays: 45,
    entryNoticeHours: 72, // Virginia VRLTA requires 72 hours for routine maintenance unless emergency
    lateFeeSummary: 'Max 10% of unpaid rent or 10% of monthly rent, whichever is less.',
    officialAgency: 'Virginia Department of Housing and Community Development (DHCD)',
    officialTenantRightsUrl: 'https://www.dhcd.virginia.gov',
    courtEvictionGuideUrl: 'https://www.vacourts.gov',
    specialDisclosures: [
      'Virginia Statement of Tenant Rights and Responsibilities (Signed acknowledgment required)',
      'Mold disclosure in rental unit condition statement',
      'Defective drywall disclosure'
    ]
  },
  CA: {
    code: 'CA',
    name: 'California',
    depositLimitSummary: 'Max 1 month rent (AB 12 effective July 2024 for small landlords managing <= 2 properties/4 units).',
    depositReturnDays: 21,
    entryNoticeHours: 24,
    lateFeeSummary: 'Must be reasonable estimate of landlord\'s actual administrative costs (typically 5%).',
    officialAgency: 'California Department of Real Estate & Civil Rights Department (CRD)',
    officialTenantRightsUrl: 'https://landlordtenant.dre.ca.gov',
    courtEvictionGuideUrl: 'https://selfhelp.courts.ca.gov/eviction',
    specialDisclosures: [
      'AB 1482 Tenant Protection Act (Rent Cap & Just Cause Eviction Notice)',
      'Prop 65 Warning for chemical exposures',
      'Bedbug informational notice (Civil Code 1954.603)',
      'Shared utility meter disclosure'
    ]
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    depositLimitSummary: 'No statutory maximum state limit. Return within 30 days of surrender and written forwarding address.',
    depositReturnDays: 30,
    entryNoticeHours: 24, // Per lease terms; common law 24 hours standard
    lateFeeSummary: 'Max 12% of rent for properties with 4 or fewer units; requires 2 full day grace period.',
    officialAgency: 'Texas Department of Housing and Community Affairs (TDHCA)',
    officialTenantRightsUrl: 'https://www.tdhca.state.tx.us',
    courtEvictionGuideUrl: 'https://www.txcourts.gov',
    specialDisclosures: [
      'Notice of Tenant\'s Right to Request Keyless Deadbolt / Security Devices',
      'Parking rules and towing disclosure',
      'Flood hazard disclosure (Tex. Prop. Code § 92.0135)'
    ]
  },
  NY: {
    code: 'NY',
    name: 'New York',
    depositLimitSummary: 'Maximum 1 month rent. Return within 14 days of move-out with itemized deductions.',
    depositReturnDays: 14,
    entryNoticeHours: 24,
    lateFeeSummary: 'Capped at $50 or 5% of monthly rent, whichever is less. 5-day grace period required.',
    officialAgency: 'New York State Homes and Community Renewal (HCR)',
    officialTenantRightsUrl: 'https://hcr.ny.gov/tenants',
    courtEvictionGuideUrl: 'https://nycourts.gov',
    specialDisclosures: [
      'Lead-Based Paint Local Law 1 (NYC)',
      'Sprinkler system disclosure',
      'Window guard notice (for families with children < 10 in NYC)'
    ]
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    depositLimitSummary: 'No state cap. 15-day return if no claim; 30-day written notice to tenant if claim is made.',
    depositReturnDays: 15,
    entryNoticeHours: 24, // Increased under FS 83.53
    lateFeeSummary: 'Must be stipulated in lease, typically 5% or $20.',
    officialAgency: 'Florida Department of Agriculture and Consumer Services (FDACS)',
    officialTenantRightsUrl: 'https://www.fdacs.gov',
    courtEvictionGuideUrl: 'https://www.flcourts.gov',
    specialDisclosures: [
      'Bank location & deposit interest holding notice within 30 days of deposit receipt',
      'Radon gas notification mandated by Florida Statute § 404.056'
    ]
  }
};
