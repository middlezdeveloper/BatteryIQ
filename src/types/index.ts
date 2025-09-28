// Location types
export interface Location {
  id: string
  postcode: string
  suburb: string
  state: string
  latitude: number
  longitude: number
  solarZone: number
  gridRegion: string
  createdAt: Date
  updatedAt: Date
}

// Rebate types
export interface Rebate {
  id: string
  name: string
  type: 'federal' | 'state'
  state?: string
  amount: number
  maxCapacity: number
  startDate: Date
  endDate?: Date
  isActive: boolean
  requirements: string[]
  vppRequired: boolean
  createdAt: Date
  updatedAt: Date
}

// Energy plan types
export interface EnergyPlan {
  id: string
  retailerId: string
  retailerName: string
  planName: string
  state: string
  tariffType: 'flat' | 'time-of-use' | 'demand'
  peakRate: number
  offPeakRate?: number
  shoulderRate?: number
  demandRate?: number
  dailySupplyCharge: number
  feedInTariff: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Battery hardware types
export interface Battery {
  id: string
  brand: string
  model: string
  nominalCapacity: number
  usableCapacity: number
  powerRating: number
  efficiency: number
  warrantyYears: number
  isVppCapable: boolean
  price: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Calculator input types
export interface CalculatorInput {
  location: Location
  currentUsage: number
  householdType: 'small' | 'medium' | 'large' | 'commercial'
  priorities: {
    cost: number
    emissions: number
    backup: number
  }
  hasSolar: boolean
  solarCapacity?: number
  selectedBattery?: Battery
  selectedEnergyPlan?: EnergyPlan
}

// Calculator result types
export interface CalculatorResult {
  batterySize: number
  totalCost: number
  federalRebate: number
  stateRebate: number
  netCost: number
  annualSavings: number
  paybackYears: number
  co2Reduction: number
  roi: number
  npv: number
  irr: number
  backupHours: number
  optimizationStrategy: 'cost' | 'emissions' | 'backup' | 'hybrid'
}

// User types
export interface User {
  id: string
  email?: string
  locationId?: string
  calculationHistory: CalculatorResult[]
  createdAt: Date
  updatedAt: Date
}

// SEO types
export interface SEOData {
  id: string
  page: string
  title: string
  description: string
  canonicalUrl?: string
  keywords: string[]
  schemaMarkup?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}