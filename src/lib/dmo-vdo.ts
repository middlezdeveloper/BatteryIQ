// DMO (Default Market Offer) and VDO (Victorian Default Offer) tariff data
// Based on official AER and ESC pricing for 2024-25

interface TimeOfUseSchedule {
  peak: {
    rate: number // c/kWh
    times: string[] // ["3:00PM-9:00PM"]
    days: string[] // ["MON", "TUE", "WED", "THU", "FRI"]
  }
  offPeak: {
    rate: number
    times: string[]
    days: string[]
  }
  shoulder?: {
    rate: number
    times: string[]
    days: string[]
  }
  superOffPeak?: { // For EV charging
    rate: number
    times: string[]
    days: string[]
  }
}

interface TariffData {
  id: string
  planName: string
  state: string
  distributor: string
  planType: 'DMO' | 'VDO'
  tariffType: 'FLAT' | 'TIME_OF_USE'

  // Flat rate (if applicable)
  flatRate?: number // c/kWh

  // Time-of-use rates
  peakRate?: number
  offPeakRate?: number
  shoulderRate?: number
  superOffPeakRate?: number

  // Charges
  dailySupplyCharge: number // c/day
  feedInTariff: number // c/kWh

  // Schedule
  timeOfUseSchedule?: TimeOfUseSchedule

  // Metadata
  validFrom: string
  validTo: string
  isEVFriendly: boolean
}

// DMO 2024-25 Data (NSW, QLD, SA)
export const DMO_TARIFFS_2024_25: TariffData[] = [
  // NSW - Endeavour Energy
  {
    id: 'dmo-nsw-endeavour-flat',
    planName: 'DMO Flat Rate',
    state: 'NSW',
    distributor: 'Endeavour Energy',
    planType: 'DMO',
    tariffType: 'FLAT',
    flatRate: 32.35,
    dailySupplyCharge: 104.5,
    feedInTariff: 5.0,
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: false
  },
  {
    id: 'dmo-nsw-endeavour-tou',
    planName: 'DMO Time of Use',
    state: 'NSW',
    distributor: 'Endeavour Energy',
    planType: 'DMO',
    tariffType: 'TIME_OF_USE',
    peakRate: 41.15,
    offPeakRate: 23.55,
    dailySupplyCharge: 104.5,
    feedInTariff: 5.0,
    timeOfUseSchedule: {
      peak: {
        rate: 41.15,
        times: ["2:00PM-8:00PM"],
        days: ["MON", "TUE", "WED", "THU", "FRI"]
      },
      offPeak: {
        rate: 23.55,
        times: ["8:00PM-2:00PM", "ALL_DAY"],
        days: ["ALL", "SAT", "SUN"]
      }
    },
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: true
  },

  // NSW - Essential Energy
  {
    id: 'dmo-nsw-essential-flat',
    planName: 'DMO Flat Rate',
    state: 'NSW',
    distributor: 'Essential Energy',
    planType: 'DMO',
    tariffType: 'FLAT',
    flatRate: 30.05,
    dailySupplyCharge: 107.8,
    feedInTariff: 5.0,
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: false
  },

  // QLD - Energex
  {
    id: 'dmo-qld-energex-flat',
    planName: 'DMO Flat Rate',
    state: 'QLD',
    distributor: 'Energex',
    planType: 'DMO',
    tariffType: 'FLAT',
    flatRate: 28.46,
    dailySupplyCharge: 122.1,
    feedInTariff: 7.0,
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: false
  },
  {
    id: 'dmo-qld-energex-tou',
    planName: 'DMO Time of Use',
    state: 'QLD',
    distributor: 'Energex',
    planType: 'DMO',
    tariffType: 'TIME_OF_USE',
    peakRate: 33.96,
    offPeakRate: 23.16,
    shoulderRate: 28.46,
    dailySupplyCharge: 122.1,
    feedInTariff: 7.0,
    timeOfUseSchedule: {
      peak: {
        rate: 33.96,
        times: ["4:00PM-9:00PM"],
        days: ["MON", "TUE", "WED", "THU", "FRI"]
      },
      shoulder: {
        rate: 28.46,
        times: ["7:00AM-4:00PM", "9:00PM-10:00PM"],
        days: ["MON", "TUE", "WED", "THU", "FRI"]
      },
      offPeak: {
        rate: 23.16,
        times: ["10:00PM-7:00AM", "ALL_DAY"],
        days: ["ALL", "SAT", "SUN"]
      }
    },
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: true
  },

  // SA - SA Power Networks
  {
    id: 'dmo-sa-sapn-flat',
    planName: 'DMO Flat Rate',
    state: 'SA',
    distributor: 'SA Power Networks',
    planType: 'DMO',
    tariffType: 'FLAT',
    flatRate: 40.84,
    dailySupplyCharge: 102.7,
    feedInTariff: 6.0,
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: false
  },
  {
    id: 'dmo-sa-sapn-tou',
    planName: 'DMO Time of Use',
    state: 'SA',
    distributor: 'SA Power Networks',
    planType: 'DMO',
    tariffType: 'TIME_OF_USE',
    peakRate: 50.04,
    offPeakRate: 31.64,
    dailySupplyCharge: 102.7,
    feedInTariff: 6.0,
    timeOfUseSchedule: {
      peak: {
        rate: 50.04,
        times: ["3:00PM-9:00PM"],
        days: ["MON", "TUE", "WED", "THU", "FRI"]
      },
      offPeak: {
        rate: 31.64,
        times: ["9:00PM-3:00PM", "ALL_DAY"],
        days: ["ALL", "SAT", "SUN"]
      }
    },
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: true
  }
]

// VDO 2024-25 Data (Victoria)
export const VDO_TARIFFS_2024_25: TariffData[] = [
  // VIC - CitiPower
  {
    id: 'vdo-vic-citipower-flat',
    planName: 'VDO Flat Rate',
    state: 'VIC',
    distributor: 'CitiPower',
    planType: 'VDO',
    tariffType: 'FLAT',
    flatRate: 29.26,
    dailySupplyCharge: 123.1,
    feedInTariff: 6.7,
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: false
  },
  {
    id: 'vdo-vic-citipower-tou',
    planName: 'VDO Time of Use',
    state: 'VIC',
    distributor: 'CitiPower',
    planType: 'VDO',
    tariffType: 'TIME_OF_USE',
    peakRate: 35.63,
    offPeakRate: 20.04,
    shoulderRate: 26.84,
    dailySupplyCharge: 123.1,
    feedInTariff: 6.7,
    timeOfUseSchedule: {
      peak: {
        rate: 35.63,
        times: ["3:00PM-9:00PM"],
        days: ["MON", "TUE", "WED", "THU", "FRI"]
      },
      shoulder: {
        rate: 26.84,
        times: ["7:00AM-3:00PM", "9:00PM-10:00PM"],
        days: ["MON", "TUE", "WED", "THU", "FRI"]
      },
      offPeak: {
        rate: 20.04,
        times: ["10:00PM-7:00AM", "ALL_DAY"],
        days: ["ALL", "SAT", "SUN"]
      }
    },
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: true
  },

  // VIC - AusNet Services
  {
    id: 'vdo-vic-ausnet-flat',
    planName: 'VDO Flat Rate',
    state: 'VIC',
    distributor: 'AusNet Services',
    planType: 'VDO',
    tariffType: 'FLAT',
    flatRate: 27.72,
    dailySupplyCharge: 116.2,
    feedInTariff: 6.7,
    validFrom: '2024-07-01',
    validTo: '2025-06-30',
    isEVFriendly: false
  }
]

// Combined tariff data
export const ALL_TARIFFS = [...DMO_TARIFFS_2024_25, ...VDO_TARIFFS_2024_25]

// Utility functions
export class TariffCalculator {
  /**
   * Get available tariffs for a state
   */
  static getTariffsForState(state: string): TariffData[] {
    return ALL_TARIFFS.filter(tariff =>
      tariff.state.toUpperCase() === state.toUpperCase()
    )
  }

  /**
   * Get the cheapest tariff for a state and usage pattern
   */
  static getCheapestTariff(
    state: string,
    annualUsage: number, // kWh
    usagePattern: 'flat' | 'peak_heavy' | 'off_peak_heavy' = 'flat'
  ): TariffData | null {
    const tariffs = this.getTariffsForState(state)
    if (tariffs.length === 0) return null

    // Calculate annual cost for each tariff
    const tariffCosts = tariffs.map(tariff => {
      const annualCost = this.calculateAnnualCost(tariff, annualUsage, usagePattern)
      return { tariff, annualCost }
    })

    // Return cheapest
    const cheapest = tariffCosts.sort((a, b) => a.annualCost - b.annualCost)[0]
    return cheapest.tariff
  }

  /**
   * Calculate annual electricity cost for a tariff
   */
  static calculateAnnualCost(
    tariff: TariffData,
    annualUsage: number,
    usagePattern: 'flat' | 'peak_heavy' | 'off_peak_heavy' = 'flat'
  ): number {
    // Daily supply charge
    const annualSupplyCharge = (tariff.dailySupplyCharge / 100) * 365

    let annualUsageCharge = 0

    if (tariff.tariffType === 'FLAT') {
      annualUsageCharge = (annualUsage * (tariff.flatRate || 0)) / 100
    } else {
      // Time-of-use calculation
      let peakUsage = 0, offPeakUsage = 0, shoulderUsage = 0

      switch (usagePattern) {
        case 'peak_heavy':
          peakUsage = annualUsage * 0.4
          shoulderUsage = annualUsage * 0.3
          offPeakUsage = annualUsage * 0.3
          break
        case 'off_peak_heavy':
          peakUsage = annualUsage * 0.2
          shoulderUsage = annualUsage * 0.2
          offPeakUsage = annualUsage * 0.6
          break
        default: // flat
          peakUsage = annualUsage * 0.3
          shoulderUsage = annualUsage * 0.3
          offPeakUsage = annualUsage * 0.4
      }

      annualUsageCharge =
        (peakUsage * (tariff.peakRate || 0)) / 100 +
        (offPeakUsage * (tariff.offPeakRate || 0)) / 100 +
        (shoulderUsage * (tariff.shoulderRate || 0)) / 100
    }

    return annualSupplyCharge + annualUsageCharge
  }

  /**
   * Calculate battery arbitrage value for time-of-use tariff
   */
  static calculateArbitrageValue(
    tariff: TariffData,
    batteryCapacity: number, // kWh
    dailyCycles: number = 1
  ): number {
    if (tariff.tariffType !== 'TIME_OF_USE' || !tariff.peakRate || !tariff.offPeakRate) {
      return 0
    }

    const priceDifferential = (tariff.peakRate - tariff.offPeakRate) / 100 // $/kWh
    const dailyArbitrage = batteryCapacity * dailyCycles * priceDifferential * 0.9 // 90% efficiency

    return dailyArbitrage * 365 // Annual arbitrage value
  }

  /**
   * Get tariff by ID
   */
  static getTariffById(id: string): TariffData | null {
    return ALL_TARIFFS.find(tariff => tariff.id === id) || null
  }

  /**
   * Check if tariff is EV-friendly
   */
  static isEVFriendly(tariff: TariffData): boolean {
    return tariff.isEVFriendly && tariff.tariffType === 'TIME_OF_USE'
  }
}

// Export commonly used functions
export const getTariffsForState = TariffCalculator.getTariffsForState
export const getCheapestTariff = TariffCalculator.getCheapestTariff
export const calculateAnnualCost = TariffCalculator.calculateAnnualCost
export const calculateArbitrageValue = TariffCalculator.calculateArbitrageValue