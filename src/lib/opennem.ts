// AEMO API integration for real-time Australian NEM grid data
// API Documentation: https://dev.aemo.com.au/api-docs
// Real-time endpoint: https://visualisations.aemo.com.au/aemo/apps/api/report/ELEC_NEM_SUMMARY

interface AEMORegionSummary {
  SETTLEMENTDATE: string
  REGIONID: string
  PRICE: number
  PRICE_STATUS: string
  APCFLAG: number
  MARKETSUSPENDEDFLAG: number
  TOTALDEMAND: number
  NETINTERCHANGE: number
  SCHEDULEDGENERATION: number
  SEMISCHEDULEDGENERATION: number
  INTERCONNECTORFLOWS: string
}

interface AEMOPriceData {
  REGIONID: string
  RRP: number
  RAISEREGRRP: number
  LOWERREGRRP: number
  RAISE1SECRRP: number
  RAISE6SECRRP: number
  RAISE60SECRRP: number
  RAISE5MINRRP: number
  LOWER1SECRRP: number
  LOWER6SECRRP: number
  LOWER60SECRRP: number
  LOWER5MINRRP: number
}

interface AEMOResponse {
  ELEC_NEM_SUMMARY: AEMORegionSummary[]
  ELEC_NEM_SUMMARY_PRICES: AEMOPriceData[]
  ELEC_NEM_SUMMARY_MARKET_NOTICE: any[]
}

interface GridMixData {
  region: string
  timestamp: string
  renewableShare: number
  carbonIntensity: number
  totalDemand: number
  price: number
  fueltechBreakdown: {
    coal: number
    gas: number
    hydro: number
    wind: number
    solar: number
    battery: number
    other: number
  }
}

class AEMOAPI {
  private baseUrl = 'https://visualisations.aemo.com.au/aemo/apps/api/report'

  /**
   * Get current NEM summary data for all regions
   * @returns Current grid data for all NEM regions
   */
  async getCurrentNEMSummary(): Promise<AEMOResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ELEC_NEM_SUMMARY`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)'
        }
      })

      if (!response.ok) {
        console.error(`AEMO API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('Failed to fetch AEMO NEM summary:', error)
      return null
    }
  }

  /**
   * Get current power generation and grid data for a specific region
   * @param region NEM region code (NSW1, VIC1, QLD1, SA1, TAS1)
   * @returns Current generation mix and carbon intensity
   */
  async getCurrentGridMix(region: string): Promise<GridMixData | null> {
    try {
      const nemData = await this.getCurrentNEMSummary()
      if (!nemData) return null

      const regionData = nemData.ELEC_NEM_SUMMARY.find(
        r => r.REGIONID === region.toUpperCase()
      )

      if (!regionData) {
        console.error(`Region ${region} not found in AEMO data`)
        return null
      }

      return this.transformAEMOData(regionData)

    } catch (error) {
      console.error('Failed to fetch grid mix data:', error)
      return null
    }
  }

  /**
   * Get wholesale electricity price for a region
   * @param region NEM region code
   * @returns Current wholesale price in $/MWh
   */
  async getCurrentPrice(region: string): Promise<number | null> {
    try {
      const nemData = await this.getCurrentNEMSummary()
      if (!nemData) return null

      const regionData = nemData.ELEC_NEM_SUMMARY.find(
        r => r.REGIONID === region.toUpperCase()
      )

      return regionData?.PRICE || null

    } catch (error) {
      console.error('Failed to fetch price data:', error)
      return null
    }
  }

  /**
   * Get all NEM regions current status
   * @returns Grid mix data for all regions
   */
  async getAllRegionsGridMix(): Promise<GridMixData[]> {
    try {
      const nemData = await this.getCurrentNEMSummary()
      if (!nemData) return []

      const results: GridMixData[] = []

      for (const regionData of nemData.ELEC_NEM_SUMMARY) {
        const gridMix = this.transformAEMOData(regionData)
        if (gridMix) {
          results.push(gridMix)
        }
      }

      return results
    } catch (error) {
      console.error('Failed to fetch all regions grid mix:', error)
      return []
    }
  }

  /**
   * Transform AEMO data into our standardized GridMixData format
   * @param regionData AEMO region summary data
   * @returns Standardized grid mix data
   */
  private transformAEMOData(regionData: AEMORegionSummary): GridMixData {
    // Calculate renewable share based on semi-scheduled generation (mostly renewables)
    const totalGeneration = regionData.SCHEDULEDGENERATION + regionData.SEMISCHEDULEDGENERATION
    const renewableGeneration = regionData.SEMISCHEDULEDGENERATION
    const renewableShare = totalGeneration > 0 ? (renewableGeneration / totalGeneration) * 100 : 0

    // Estimate carbon intensity based on renewable share and typical grid mix
    // This is a simplified estimation - for precise values would need fuel mix data
    const carbonIntensity = this.estimateCarbonIntensity(renewableShare, regionData.REGIONID)

    // Estimate fuel breakdown based on region characteristics and renewable share
    const fueltechBreakdown = this.estimateFuelBreakdown(
      renewableShare,
      totalGeneration,
      regionData.REGIONID
    )

    return {
      region: regionData.REGIONID,
      timestamp: regionData.SETTLEMENTDATE,
      renewableShare: Math.round(renewableShare * 10) / 10,
      carbonIntensity: Math.round(carbonIntensity * 10) / 10,
      totalDemand: Math.round(regionData.TOTALDEMAND),
      price: Math.round(regionData.PRICE * 10) / 10,
      fueltechBreakdown
    }
  }

  /**
   * Estimate carbon intensity based on renewable share and region
   * @param renewableShare Percentage of renewable generation
   * @param region NEM region
   * @returns Estimated carbon intensity in kg CO2/MWh
   */
  private estimateCarbonIntensity(renewableShare: number, region: string): number {
    // Base carbon intensities by region (typical non-renewable mix)
    const baseIntensity = {
      'NSW1': 750,  // Mix of coal and gas
      'VIC1': 900,  // High brown coal
      'QLD1': 800,  // Mix of black coal and gas
      'SA1': 400,   // High gas, some wind
      'TAS1': 50    // Mostly hydro
    }

    const base = baseIntensity[region as keyof typeof baseIntensity] || 700
    const renewableIntensity = 30 // Average for renewables including lifecycle

    // Weighted average based on renewable share
    return (base * (100 - renewableShare) + renewableIntensity * renewableShare) / 100
  }

  /**
   * Estimate fuel breakdown based on regional characteristics
   * @param renewableShare Percentage of renewable generation
   * @param totalGeneration Total generation in MW
   * @param region NEM region
   * @returns Estimated fuel breakdown
   */
  private estimateFuelBreakdown(renewableShare: number, totalGeneration: number, region: string) {
    const renewableMW = (renewableShare / 100) * totalGeneration
    const fossilMW = totalGeneration - renewableMW

    // Regional characteristics for non-renewable mix
    const regionalMix = {
      'NSW1': { coal: 0.6, gas: 0.35, other: 0.05 },
      'VIC1': { coal: 0.8, gas: 0.15, other: 0.05 },
      'QLD1': { coal: 0.7, gas: 0.25, other: 0.05 },
      'SA1': { coal: 0.1, gas: 0.8, other: 0.1 },
      'TAS1': { coal: 0.0, gas: 0.1, other: 0.9 }
    }

    const mix = regionalMix[region as keyof typeof regionalMix] || { coal: 0.5, gas: 0.4, other: 0.1 }

    // Check if it's daytime (solar only generates during day)
    // Use Australian Eastern Time (AEST/AEDT) for most NEM regions
    const now = new Date()
    const australiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))
    const hour = australiaTime.getHours()
    const isDaytime = hour >= 6 && hour <= 19

    // Solar can only generate during daylight hours
    const solarMW = isDaytime ? Math.round(renewableMW * 0.25) : 0

    // Redistribute solar's share to wind/hydro at night
    const remainingRenewableMW = renewableMW - solarMW
    const windShare = isDaytime ? 0.4 : 0.55  // More wind at night
    const hydroShare = isDaytime ? 0.3 : 0.4  // More hydro at night
    const batteryShare = 0.05

    return {
      coal: Math.round(fossilMW * mix.coal),
      gas: Math.round(fossilMW * mix.gas),
      hydro: Math.round(remainingRenewableMW * hydroShare),
      wind: Math.round(remainingRenewableMW * windShare),
      solar: solarMW,
      battery: Math.round(remainingRenewableMW * batteryShare),
      other: Math.round(fossilMW * mix.other)
    }
  }
}

// Export singleton instance
export const aemoAPI = new AEMOAPI()

// Utility function to map location state to NEM region
export function getRegionFromState(state: string): string {
  const regionMap: { [key: string]: string } = {
    'NSW': 'NSW1',
    'VIC': 'VIC1',
    'QLD': 'QLD1',
    'SA': 'SA1',
    'TAS': 'TAS1',
    'WA': 'NSW1', // Western Australia uses WEM (not NEM), fallback to NSW1 for now
    'NT': 'NSW1', // Northern Territory connected to NEM via NSW
    'ACT': 'NSW1'  // ACT is part of NSW region
  }

  return regionMap[state.toUpperCase()] || 'NSW1'
}

// Carbon intensity thresholds for grid optimization
export const CARBON_THRESHOLDS = {
  VERY_CLEAN: 100,   // kg CO2/MWh - Charge batteries
  CLEAN: 300,        // kg CO2/MWh - Normal operation
  MODERATE: 600,     // kg CO2/MWh - Discharge batteries
  DIRTY: 800         // kg CO2/MWh - Maximize discharge
} as const