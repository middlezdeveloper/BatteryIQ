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

// All retailers from AER March 2025 list (111 active retailers)
export const ALL_RETAILERS: CDRRetailer[] = [
  ...TOP_RETAILERS,
  // Additional retailers (priority 3)
  { name: '1st Energy', slug: '1st-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/1st-energy/', priority: 3 },
  { name: 'ActewAGL', slug: 'actewagl', baseUri: 'https://cdr.energymadeeasy.gov.au/actewagl/', priority: 3 },
  { name: 'Active Utilities Retail', slug: 'active-utilities', baseUri: 'https://cdr.energymadeeasy.gov.au/active-utilities/', priority: 3 },
  { name: 'Altogether', slug: 'altogether', baseUri: 'https://cdr.energymadeeasy.gov.au/altogether/', priority: 3 },
  { name: 'Amber Electric', slug: 'amber', baseUri: 'https://cdr.energymadeeasy.gov.au/amber/', priority: 3 },
  { name: 'Ampol Energy', slug: 'ampol', baseUri: 'https://cdr.energymadeeasy.gov.au/ampol/', priority: 3 },
  { name: 'Arc Energy Group', slug: 'arc-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/arc-energy/', priority: 3 },
  { name: 'ARCLINE by RACV', slug: 'arcline', baseUri: 'https://cdr.energymadeeasy.gov.au/arcline/', priority: 3 },
  { name: 'Arcstream', slug: 'arcstream', baseUri: 'https://cdr.energymadeeasy.gov.au/arcstream/', priority: 3 },
  { name: 'Aurora Energy', slug: 'aurora', baseUri: 'https://cdr.energymadeeasy.gov.au/aurora/', priority: 3 },
  { name: 'Besy', slug: 'besy', baseUri: 'https://cdr.energymadeeasy.gov.au/besy/', priority: 3 },
  { name: 'Blue NRG', slug: 'blue-nrg', baseUri: 'https://cdr.energymadeeasy.gov.au/blue-nrg/', priority: 3 },
  { name: 'Brighte Energy', slug: 'brighte', baseUri: 'https://cdr.energymadeeasy.gov.au/brighte/', priority: 3 },
  { name: 'Circular Energy', slug: 'circular', baseUri: 'https://cdr.energymadeeasy.gov.au/circular/', priority: 3 },
  { name: 'CleanCo Queensland', slug: 'cleanco', baseUri: 'https://cdr.energymadeeasy.gov.au/cleanco/', priority: 3 },
  { name: 'CleanPeak Energy Retail', slug: 'cleanpeak', baseUri: 'https://cdr.energymadeeasy.gov.au/cleanpeak/', priority: 3 },
  { name: 'Coles Energy', slug: 'coles', baseUri: 'https://cdr.energymadeeasy.gov.au/coles/', priority: 3 },
  { name: 'Cooperative Power', slug: 'cooperative', baseUri: 'https://cdr.energymadeeasy.gov.au/energy-locals/', priority: 3 },
  { name: 'CPE Mascot', slug: 'cpe-mascot', baseUri: 'https://cdr.energymadeeasy.gov.au/cpe-mascot/', priority: 3 },
  { name: 'Diamond Energy', slug: 'diamond', baseUri: 'https://cdr.energymadeeasy.gov.au/diamond/', priority: 3 },
  { name: 'Discover Energy', slug: 'discover', baseUri: 'https://cdr.energymadeeasy.gov.au/discover/', priority: 3 },
  { name: 'Dodo Power & Gas', slug: 'dodo', baseUri: 'https://cdr.energymadeeasy.gov.au/dodo/', priority: 3 },
  { name: 'Electricity in a Box', slug: 'electricity-in-a-box', baseUri: 'https://cdr.energymadeeasy.gov.au/electricity-in-a-box/', priority: 3 },
  { name: 'Ellis Air Connect', slug: 'ea-connect', baseUri: 'https://cdr.energymadeeasy.gov.au/ea-connect/', priority: 3 },
  { name: 'Energy Locals', slug: 'energy-locals', baseUri: 'https://cdr.energymadeeasy.gov.au/energy-locals/', priority: 3 },
  { name: 'Ergon Energy', slug: 'ergon', baseUri: 'https://cdr.energymadeeasy.gov.au/ergon/', priority: 3 },
  { name: 'Evergy', slug: 'evergy', baseUri: 'https://cdr.energymadeeasy.gov.au/evergy/', priority: 3 },
  { name: 'Flipped Energy', slug: 'flipped', baseUri: 'https://cdr.energymadeeasy.gov.au/flipped/', priority: 3 },
  { name: 'Flow Power', slug: 'flow-power', baseUri: 'https://cdr.energymadeeasy.gov.au/flow-power/', priority: 3 },
  { name: 'Flow Systems', slug: 'flow-systems', baseUri: 'https://cdr.energymadeeasy.gov.au/flow-systems/', priority: 3 },
  { name: 'Future X Power', slug: 'future-x', baseUri: 'https://cdr.energymadeeasy.gov.au/future-x/', priority: 3 },
  { name: 'GEE Energy', slug: 'gee-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/gee-energy/', priority: 3 },
  { name: 'Glow Power', slug: 'glow-power', baseUri: 'https://cdr.energymadeeasy.gov.au/glow-power/', priority: 3 },
  { name: 'Humenergy Group', slug: 'humenergy', baseUri: 'https://cdr.energymadeeasy.gov.au/humenergy/', priority: 3 },
  { name: 'iGENO', slug: 'igeno', baseUri: 'https://cdr.energymadeeasy.gov.au/igeno/', priority: 3 },
  { name: 'Indigo Power', slug: 'indigo', baseUri: 'https://cdr.energymadeeasy.gov.au/energy-locals/', priority: 3 },
  { name: 'iO Energy Retail Services', slug: 'io-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/io-energy/', priority: 3 },
  { name: 'Kogan Energy', slug: 'kogan', baseUri: 'https://cdr.energymadeeasy.gov.au/kogan/', priority: 3 },
  { name: 'Locality Planning Energy', slug: 'locality-planning', baseUri: 'https://cdr.energymadeeasy.gov.au/locality-planning/', priority: 3 },
  { name: 'Localvolts', slug: 'localvolts', baseUri: 'https://cdr.energymadeeasy.gov.au/localvolts/', priority: 3 },
  { name: 'Lumo Energy', slug: 'lumo', baseUri: 'https://cdr.energymadeeasy.gov.au/lumo/', priority: 3 },
  { name: 'Macarthur Energy Retail', slug: 'macarthur', baseUri: 'https://cdr.energymadeeasy.gov.au/macarthur/', priority: 3 },
  { name: 'Macquarie', slug: 'macquarie', baseUri: 'https://cdr.energymadeeasy.gov.au/macquarie/', priority: 3 },
  { name: 'Metered Energy Holdings', slug: 'metered-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/metered-energy/', priority: 3 },
  { name: 'Microgrid Power', slug: 'microgrid', baseUri: 'https://cdr.energymadeeasy.gov.au/microgrid/', priority: 3 },
  { name: 'MYOB powered by OVO', slug: 'myob', baseUri: 'https://cdr.energymadeeasy.gov.au/ovo-energy/', priority: 3 },
  { name: 'Nectr', slug: 'nectr', baseUri: 'https://cdr.energymadeeasy.gov.au/nectr/', priority: 3 },
  { name: 'Next Business Energy', slug: 'next-business', baseUri: 'https://cdr.energymadeeasy.gov.au/next-business/', priority: 3 },
  { name: 'OVO Energy', slug: 'ovo-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/ovo-energy/', priority: 3 },
  { name: 'Pacific Blue Retail', slug: 'pacific-blue', baseUri: 'https://cdr.energymadeeasy.gov.au/pacific-blue/', priority: 3 },
  { name: 'People Energy', slug: 'people-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/people-energy/', priority: 3 },
  { name: 'Perpetual Energy', slug: 'perpetual', baseUri: 'https://cdr.energymadeeasy.gov.au/perpetual/', priority: 3 },
  { name: 'Powerdirect', slug: 'powerdirect', baseUri: 'https://cdr.energymadeeasy.gov.au/powerdirect/', priority: 3 },
  { name: 'PowerHub', slug: 'powerhub', baseUri: 'https://cdr.energymadeeasy.gov.au/powerhub/', priority: 3 },
  { name: 'Powow Power', slug: 'powow', baseUri: 'https://cdr.energymadeeasy.gov.au/powow/', priority: 3 },
  { name: 'RAA Energy', slug: 'raa', baseUri: 'https://cdr.energymadeeasy.gov.au/energy-locals/', priority: 3 },
  { name: 'Radian Energy', slug: 'radian', baseUri: 'https://cdr.energymadeeasy.gov.au/radian/', priority: 3 },
  { name: 'Real Utilities', slug: 'real-utilities', baseUri: 'https://cdr.energymadeeasy.gov.au/real-utilities/', priority: 3 },
  { name: 'ReAmped Energy', slug: 'reamped', baseUri: 'https://cdr.energymadeeasy.gov.au/reamped/', priority: 3 },
  { name: 'Sanctuary Energy', slug: 'sanctuary', baseUri: 'https://cdr.energymadeeasy.gov.au/sanctuary/', priority: 3 },
  { name: 'Savant Energy', slug: 'savant', baseUri: 'https://cdr.energymadeeasy.gov.au/savant/', priority: 3 },
  { name: 'Seene', slug: 'seene', baseUri: 'https://cdr.energymadeeasy.gov.au/seene/', priority: 3 },
  { name: 'Shell Energy', slug: 'shell-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/shell-energy/', priority: 3 },
  { name: 'Smart Energy', slug: 'smart-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/smart-energy/', priority: 3 },
  { name: 'SmartestEnergy', slug: 'smartestenergy', baseUri: 'https://cdr.energymadeeasy.gov.au/smartestenergy/', priority: 3 },
  { name: 'Solstice Energy', slug: 'solstice', baseUri: 'https://cdr.energymadeeasy.gov.au/solstice/', priority: 3 },
  { name: 'Sonnen', slug: 'sonnen', baseUri: 'https://cdr.energymadeeasy.gov.au/sonnen/', priority: 3 },
  { name: 'Stanwell Energy', slug: 'stanwell', baseUri: 'https://cdr.energymadeeasy.gov.au/stanwell/', priority: 3 },
  { name: 'Sumo Gas', slug: 'sumo-gas', baseUri: 'https://cdr.energymadeeasy.gov.au/sumo-gas/', priority: 3 },
  { name: 'Sumo Power', slug: 'sumo-power', baseUri: 'https://cdr.energymadeeasy.gov.au/sumo-power/', priority: 3 },
  { name: 'Tango Energy', slug: 'tango', baseUri: 'https://cdr.energymadeeasy.gov.au/tango/', priority: 3 },
  { name: 'Telstra Energy', slug: 'telstra-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/telstra-energy/', priority: 3 },
  { name: 'Tesla Energy Ventures', slug: 'tesla', baseUri: 'https://cdr.energymadeeasy.gov.au/tesla/', priority: 3 },
  { name: 'YES Energy', slug: 'yes-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/yes-energy/', priority: 3 },
  { name: 'ZEN Energy', slug: 'zen-energy', baseUri: 'https://cdr.energymadeeasy.gov.au/zen-energy/', priority: 3 }
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
