// AEMO Distributed Generation API Integration
// Fetches Solar Rooftop data that's missing from OpenElectricity API
// Based on AEMO's public data API for distributed PV generation

interface AEMODistributedPVData {
  region: string
  datetime: string
  distributedPV: number // MW
  totalDemand?: number // MW
}

interface AEMODataPoint {
  REGION: string
  DATETIME: string
  DISTRIBUTED_PV: number
  TOTAL_DEMAND?: number
}

class AEMODistributedAPI {
  private baseUrl = 'https://visualisations.aemo.com.au'

  /**
   * Get current distributed solar rooftop generation for a region
   */
  async getCurrentDistributedPV(region: string): Promise<AEMODistributedPVData | null> {
    try {
      console.log(`🔋 Fetching AEMO distributed PV data for ${region}...`)

      // AEMO provides distributed PV data through their visualizations API
      // This is a public endpoint that doesn't require authentication
      const url = `${this.baseUrl}/aemo/nemweb/DISPATCHSCADA`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)'
        }
      })

      if (!response.ok) {
        console.error(`❌ AEMO API error: ${response.status}`)
        return null
      }

      const data = await response.json()

      // Find the most recent data point for the region
      const regionData = this.findLatestRegionData(data, region)

      if (!regionData) {
        console.warn(`⚠️ No distributed PV data found for region ${region}`)
        return null
      }

      console.log(`✅ AEMO distributed PV: ${regionData.distributedPV} MW`)

      return regionData

    } catch (error) {
      console.error('💥 AEMO distributed PV fetch failed:', error)
      return null
    }
  }

  /**
   * Find the latest data point for a specific region
   */
  private findLatestRegionData(data: any, region: string): AEMODistributedPVData | null {
    try {
      // AEMO data structure varies, this is a fallback approach
      // In practice, we might need to adapt this based on actual AEMO API response format

      if (Array.isArray(data)) {
        const regionEntry = data
          .filter((item: AEMODataPoint) => item.REGION === region.toUpperCase())
          .sort((a: AEMODataPoint, b: AEMODataPoint) =>
            new Date(b.DATETIME).getTime() - new Date(a.DATETIME).getTime()
          )[0]

        if (regionEntry) {
          return {
            region: regionEntry.REGION,
            datetime: regionEntry.DATETIME,
            distributedPV: regionEntry.DISTRIBUTED_PV || 0,
            totalDemand: regionEntry.TOTAL_DEMAND
          }
        }
      }

      return null

    } catch (error) {
      console.error('Failed to parse AEMO data:', error)
      return null
    }
  }

  /**
   * Fallback: Use estimated solar rooftop based on time of day and weather
   * This is a temporary solution while we work on getting real AEMO data
   */
  async getEstimatedSolarRooftop(region: string): Promise<number> {
    const hour = new Date().getHours()

    // Basic solar estimation based on time of day
    // Peak solar hours: 10 AM - 2 PM
    let solarFactor = 0

    if (hour >= 6 && hour <= 18) {
      // Daytime hours
      const noonDistance = Math.abs(hour - 12)
      solarFactor = Math.max(0, 1 - (noonDistance / 6))
    }

    // Estimated rooftop solar capacity by region (MW)
    const rooftopCapacity = {
      'NSW1': 5000,
      'QLD1': 4500,
      'VIC1': 4000,
      'SA1': 2500,
      'TAS1': 500,
      'WA1': 2000
    }

    const capacity = rooftopCapacity[region as keyof typeof rooftopCapacity] || 3000
    const estimatedOutput = capacity * solarFactor * 0.7 // 70% capacity factor on average

    console.log(`☀️ Estimated solar rooftop for ${region}: ${estimatedOutput.toFixed(0)} MW (${(solarFactor * 100).toFixed(0)}% solar factor)`)

    return estimatedOutput
  }
}

// Export singleton instance
export const aemoDistributedAPI = new AEMODistributedAPI()

// Export types
export type { AEMODistributedPVData }