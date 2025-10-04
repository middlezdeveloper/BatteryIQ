// CDR Energy Retailer Base URIs (March 2025)
// Source: AER Consumer Data Right - Energy Retailer Base URIs and CDR Brands

export interface CDRRetailer {
  name: string
  slug: string
  baseUri: string
  marketShare?: number // Approximate market share percentage
  priority: number // 1 = highest priority (Big 3), 2 = major retailers, 3 = others
}

// Top retailers by market share and priority
export const TOP_RETAILERS: CDRRetailer[] = [
  // Big 3 - ~65% market share
  {
    name: 'Origin Energy',
    slug: 'origin',
    baseUri: 'https://cdr.energymadeeasy.gov.au/origin/',
    marketShare: 26.3,
    priority: 1
  },
  {
    name: 'AGL',
    slug: 'agl',
    baseUri: 'https://cdr.energymadeeasy.gov.au/agl/',
    marketShare: 20,
    priority: 1
  },
  {
    name: 'EnergyAustralia',
    slug: 'energyaustralia',
    baseUri: 'https://cdr.energymadeeasy.gov.au/energyaustralia/',
    marketShare: 18,
    priority: 1
  },

  // Major Tier 2 Retailers - Next 7 by market presence
  {
    name: 'Red Energy',
    slug: 'red-energy',
    baseUri: 'https://cdr.energymadeeasy.gov.au/red-energy/',
    priority: 2
  },
  {
    name: 'Alinta',
    slug: 'alinta',
    baseUri: 'https://cdr.energymadeeasy.gov.au/alinta/',
    priority: 2
  },
  {
    name: 'Momentum Energy',
    slug: 'momentum',
    baseUri: 'https://cdr.energymadeeasy.gov.au/momentum/',
    priority: 2
  },
  {
    name: 'Powershop',
    slug: 'powershop',
    baseUri: 'https://cdr.energymadeeasy.gov.au/powershop/',
    priority: 2
  },
  {
    name: 'GloBird Energy',
    slug: 'globird',
    baseUri: 'https://cdr.energymadeeasy.gov.au/globird/',
    priority: 2
  },
  {
    name: 'CovaU',
    slug: 'covau',
    baseUri: 'https://cdr.energymadeeasy.gov.au/covau/',
    priority: 2
  },
  {
    name: 'ENGIE',
    slug: 'engie',
    baseUri: 'https://cdr.energymadeeasy.gov.au/engie/',
    priority: 2
  }
]

// All retailers from AER March 2025 list
export const ALL_RETAILERS: CDRRetailer[] = [
  ...TOP_RETAILERS,
  { name: '1st Energy', slug: '1st-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/1st-energy/', priority: 3 },
  { name: 'ActewAGL', slug: 'actewagl', baseUri: 'https://cdr.energymadeeasy.gov.au/actewagl/', priority: 3 },
  { name: 'Active Utilities Retail', slug: 'active-utilities', baseUri: 'https://cdr.energymadeeasy.gov.au/active-utilities/', priority: 3 },
  { name: 'Altogether', slug: 'altogether', baseUri: 'https://cdr.energymadeeasy.gov.au/altogether/', priority: 3 },
  { name: 'Amber Electric', slug: 'amber', baseUri: 'https://cdr.energymadeeasy.gov.au/amber/', priority: 3 },
  { name: 'Ampol Energy', slug: 'ampol', baseUri: 'https://cdr.energymadeeasy.gov.au/ampol/', priority: 3 },
  // ... add more as needed
]

// CDR API configuration (per Consumer Data Standards)
// NO AUTHENTICATION REQUIRED - Product Reference Data (PRD) APIs are public
export const CDR_CONFIG = {
  headers: {
    'x-v': '1',                     // Mandatory - API version (Get Generic Plans only supports v1)
    'x-min-v': '1',                 // Optional - minimum acceptable version
  },
  planEndpoint: 'cds-au/v1/energy/plans',
  queryParams: {
    type: 'ALL',
    'page-size': '1000' // Maximum allowed per AER documentation
  }
}

export function getRetailerEndpoint(retailer: CDRRetailer): string {
  const params = new URLSearchParams(CDR_CONFIG.queryParams)
  return `${retailer.baseUri}${CDR_CONFIG.planEndpoint}?${params}`
}
