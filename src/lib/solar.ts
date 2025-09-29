// Solar irradiance calculations for Australian locations
// Based on Bureau of Meteorology solar zones and Clean Energy Council guidelines

interface SolarZoneData {
  zone: number
  description: string
  annualSolarIrradiance: number // kWh/m²/year
  stcMultiplier: number // STC calculation multiplier
  monthlyMultipliers: number[] // Jan-Dec seasonal adjustment
  typicalPeakSunHours: number // Daily average peak sun hours
}

// Australian Solar Zones (1-7) based on Clean Energy Council guidelines
export const AUSTRALIAN_SOLAR_ZONES: SolarZoneData[] = [
  {
    zone: 1,
    description: "Highest irradiance - Central Australia, Western Queensland",
    annualSolarIrradiance: 2300,
    stcMultiplier: 1.7,
    monthlyMultipliers: [1.25, 1.15, 1.05, 0.95, 0.85, 0.75, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25],
    typicalPeakSunHours: 6.3
  },
  {
    zone: 2,
    description: "Very high irradiance - Northern Australia, inland areas",
    annualSolarIrradiance: 2100,
    stcMultiplier: 1.5,
    monthlyMultipliers: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2],
    typicalPeakSunHours: 5.8
  },
  {
    zone: 3,
    description: "High irradiance - Brisbane, Perth, Adelaide regions",
    annualSolarIrradiance: 1900,
    stcMultiplier: 1.3,
    monthlyMultipliers: [1.15, 1.05, 0.95, 0.85, 0.75, 0.65, 0.65, 0.75, 0.85, 0.95, 1.05, 1.15],
    typicalPeakSunHours: 5.2
  },
  {
    zone: 4,
    description: "Moderate irradiance - Sydney, Melbourne, Canberra",
    annualSolarIrradiance: 1700,
    stcMultiplier: 1.2,
    monthlyMultipliers: [1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1],
    typicalPeakSunHours: 4.7
  },
  {
    zone: 5,
    description: "Lower irradiance - Coastal NSW, Victoria",
    annualSolarIrradiance: 1500,
    stcMultiplier: 1.0,
    monthlyMultipliers: [1.05, 0.95, 0.85, 0.75, 0.65, 0.55, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05],
    typicalPeakSunHours: 4.1
  },
  {
    zone: 6,
    description: "Low irradiance - Tasmania, southern Victoria",
    annualSolarIrradiance: 1300,
    stcMultiplier: 0.9,
    monthlyMultipliers: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    typicalPeakSunHours: 3.6
  },
  {
    zone: 7,
    description: "Lowest irradiance - Southern Tasmania",
    annualSolarIrradiance: 1100,
    stcMultiplier: 0.8,
    monthlyMultipliers: [0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
    typicalPeakSunHours: 3.0
  }
]

interface SolarCalculationParams {
  solarZone: number
  panelCapacityKw: number
  panelTilt?: number // degrees from horizontal (default: latitude)
  panelAzimuth?: number // degrees from north (0 = north, 180 = south)
  systemEfficiency?: number // overall system efficiency (default: 0.85)
  month?: number // 1-12, if null returns annual average
}

interface SolarOutput {
  monthlyGeneration: number[] // kWh per month for each month
  annualGeneration: number // total kWh per year
  dailyAverageGeneration: number // kWh per day average
  peakSunHours: number // equivalent peak sun hours per day
  capacityFactor: number // actual vs theoretical output percentage
  stcValue: number // Small-scale Technology Certificates eligible
}

export class SolarCalculator {
  /**
   * Calculate solar generation for a given system and location
   */
  static calculateSolarOutput(params: SolarCalculationParams): SolarOutput {
    const zoneData = AUSTRALIAN_SOLAR_ZONES.find(z => z.zone === params.solarZone)
    if (!zoneData) {
      throw new Error(`Invalid solar zone: ${params.solarZone}`)
    }

    const systemEfficiency = params.systemEfficiency || 0.85
    const tiltEfficiency = this.calculateTiltEfficiency(params.panelTilt, params.panelAzimuth)
    const totalEfficiency = systemEfficiency * tiltEfficiency

    // Calculate monthly generation
    // Formula: kWh = Solar irradiance (kWh/m²) × System size (kW) × Performance ratio
    const monthlyGeneration = zoneData.monthlyMultipliers.map((multiplier, monthIndex) => {
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex]
      const monthlyIrradiance = (zoneData.annualSolarIrradiance / 12) * multiplier
      const monthlyGeneration = (monthlyIrradiance * params.panelCapacityKw * totalEfficiency) / 1000
      return monthlyGeneration * 1000 // Convert back to kWh
    })

    const annualGeneration = monthlyGeneration.reduce((sum, month) => sum + month, 0)
    const dailyAverageGeneration = annualGeneration / 365

    // Calculate STC value (based on first year output and deeming period)
    const stcEligibleCapacity = Math.min(params.panelCapacityKw, 100) // Max 100kW for STC
    const stcValue = stcEligibleCapacity * zoneData.stcMultiplier * 15 // 15-year deeming period

    return {
      monthlyGeneration,
      annualGeneration,
      dailyAverageGeneration,
      peakSunHours: zoneData.typicalPeakSunHours * tiltEfficiency,
      capacityFactor: (annualGeneration / (params.panelCapacityKw * 8760)) * 100,
      stcValue: Math.round(stcValue)
    }
  }

  /**
   * Calculate efficiency adjustment for panel tilt and azimuth
   */
  private static calculateTiltEfficiency(tilt?: number, azimuth?: number): number {
    // Simplified efficiency calculation
    // In practice, this would use more complex solar geometry

    const optimalTilt = 25 // degrees (approximate for most of Australia)
    const optimalAzimuth = 0 // north-facing

    const actualTilt = tilt || optimalTilt
    const actualAzimuth = azimuth || optimalAzimuth

    // Tilt efficiency (peaks at optimal tilt)
    const tiltDeviation = Math.abs(actualTilt - optimalTilt)
    const tiltEfficiency = Math.max(0.7, 1 - (tiltDeviation * 0.006)) // 0.6% loss per degree

    // Azimuth efficiency (peaks facing north)
    const azimuthDeviation = Math.min(Math.abs(actualAzimuth), Math.abs(actualAzimuth - 360))
    const azimuthEfficiency = Math.max(0.5, 1 - (azimuthDeviation * 0.003)) // 0.3% loss per degree

    return tiltEfficiency * azimuthEfficiency
  }

  /**
   * Calculate current solar generation based on time of day and conditions
   */
  static calculateCurrentGeneration(
    params: SolarCalculationParams,
    currentHour: number, // 0-23
    cloudCover: number = 0, // 0-1 (0 = clear, 1 = completely cloudy)
    month: number = new Date().getMonth() + 1
  ): number {
    const baseOutput = this.calculateSolarOutput(params)
    const monthlyMultiplier = AUSTRALIAN_SOLAR_ZONES.find(z => z.zone === params.solarZone)
      ?.monthlyMultipliers[month - 1] || 1

    // Solar curve throughout the day (simplified sine wave)
    const solarCurve = Math.max(0, Math.sin((currentHour - 6) * Math.PI / 12))

    // Cloud reduction
    const cloudReduction = 1 - (cloudCover * 0.8) // Up to 80% reduction from clouds

    // Peak generation for this month
    const monthlyPeakGeneration = (baseOutput.annualGeneration / 12) * monthlyMultiplier / 30 // Daily average

    return monthlyPeakGeneration * solarCurve * cloudReduction
  }

  /**
   * Get solar zone for a location
   */
  static getSolarZoneInfo(solarZone: number): SolarZoneData | null {
    return AUSTRALIAN_SOLAR_ZONES.find(z => z.zone === solarZone) || null
  }

  /**
   * Calculate Small-scale Technology Certificate value
   */
  static calculateSTCValue(
    panelCapacityKw: number,
    solarZone: number,
    currentSTCPrice: number = 40 // $/STC
  ): { stcCount: number; stcValue: number } {
    const zoneData = this.getSolarZoneInfo(solarZone)
    if (!zoneData) return { stcCount: 0, stcValue: 0 }

    const stcEligibleCapacity = Math.min(panelCapacityKw, 100) // Max 100kW
    const stcCount = Math.round(stcEligibleCapacity * zoneData.stcMultiplier * 15) // 15-year deeming
    const stcValue = stcCount * currentSTCPrice

    return { stcCount, stcValue }
  }
}

// Export commonly used functions
export const calculateSolarOutput = SolarCalculator.calculateSolarOutput
export const calculateCurrentGeneration = SolarCalculator.calculateCurrentGeneration
export const getSolarZoneInfo = SolarCalculator.getSolarZoneInfo
export const calculateSTCValue = SolarCalculator.calculateSTCValue