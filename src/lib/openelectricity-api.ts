// OpenElectricity API integration for real-time Australian electricity data
// Documentation: https://docs.openelectricity.org.au/introduction
// Base URL: https://api.openelectricity.org.au
//
// ⚠️ WARNING: OpenElectricity API integration is currently DISABLED
// We are only using AEMO data for homepage display
// This file is kept for future reference but should not be used in production
// Last updated: October 2025

import { australiaFuelMixAPI } from './australia-fuel-mix'
import { aemoDistributedAPI } from './aemo-distributed-api'

interface OpenElectricityResponse {
  success: boolean
  data: {
    network: string
    region: string
    timestamp: string
    generation?: {
      coal: number
      gas: number
      hydro: number
      wind: number
      solar: number
      battery: number
      [key: string]: number
    }
    total?: number
    spot_price?: number
    currency?: string
    unit?: string
  }
}

interface OpenElectricityError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export interface OpenElectricityFuelMix {
  region: string
  timestamp: string
  totalDemand: number
  price: number
  fuels: {
    [key: string]: {
      power: number
      percentage: number
      renewable: boolean
      color: string
    }
  }
  renewableShare: number
  carbonIntensity: number
  dataSource: string
}

interface GenerationData {
  network: string
  region: string
  timestamp: string
  fuel_tech: string
  power_mw: number
}

interface DemandData {
  network: string
  region: string
  timestamp: string
  demand_mw: number
  price_aud_mwh: number
}

interface OpenElectricityGenerationResponse {
  success: boolean
  data: {
    network: string
    region: string
    timestamp: string
    generation: {
      [fuel: string]: number
    }
    total: number
  }
}

interface OpenElectricityPriceResponse {
  success: boolean
  data: {
    network: string
    region: string
    timestamp: string
    spot_price: number
    currency: string
    unit: string
  }
}

// Cache implementation for rate limiting (500 calls/day)
class OpenElectricityCache {
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  public apiCallCount: number = 0
  private dailyLimit: number = 500

  getCacheKey(endpoint: string, params: Record<string, any>): string {
    return `${endpoint}:${JSON.stringify(params)}`
  }

  get(endpoint: string, params: Record<string, any>): any | null {
    const key = this.getCacheKey(endpoint, params)
    const expiry = this.cacheExpiry.get(key)

    if (expiry && expiry > Date.now()) {
      return this.cache.get(key)
    }

    // Cache expired or doesn't exist
    this.cache.delete(key)
    this.cacheExpiry.delete(key)
    return null
  }

  set(endpoint: string, params: Record<string, any>, data: any, ttlMinutes: number = 5): void {
    const key = this.getCacheKey(endpoint, params)
    this.cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + (ttlMinutes * 60 * 1000))
  }

  canMakeApiCall(): boolean {
    return this.apiCallCount < this.dailyLimit
  }

  incrementApiCalls(): void {
    this.apiCallCount++
    console.log(`OpenElectricity API calls today: ${this.apiCallCount}/${this.dailyLimit}`)
  }

  resetDailyCount(): void {
    this.apiCallCount = 0
    console.log('OpenElectricity API call count reset for new day')
  }

  getRemainingCalls(): number {
    return this.dailyLimit - this.apiCallCount
  }
}

class OpenElectricityAPI {
  private baseUrl = 'https://api.openelectricity.org.au/v4'
  private apiKey: string = 'oe_3ZcWbaVvfvsifQu6ePZEehas'
  private cache: OpenElectricityCache = new OpenElectricityCache()

  constructor() {
    // Initialize daily reset schedule
    this.scheduleDailyReset()
  }

  /**
   * Schedule daily reset of API call counter
   */
  private scheduleDailyReset(): void {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    setTimeout(() => {
      this.cache.resetDailyCount()
      this.scheduleDailyReset() // Schedule next reset
    }, msUntilMidnight)
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null
  }

  /**
   * Get request headers with authentication
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)'
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(): { used: number; remaining: number; limit: number } {
    return {
      used: this.cache.apiCallCount,
      remaining: this.cache.getRemainingCalls(),
      limit: 500
    }
  }

  /**
   * Make authenticated request to OpenElectricity API
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    if (!this.apiKey) {
      console.warn('OpenElectricity API key not configured')
      return null
    }

    // Check cache first
    const cached = this.cache.get(endpoint, params)
    if (cached) {
      console.log('Using cached OpenElectricity data')
      return cached
    }

    // Check daily limit
    if (!this.cache.canMakeApiCall()) {
      console.warn('OpenElectricity daily API limit reached')
      return null
    }

    try {
      // Build query string
      const queryString = new URLSearchParams(params).toString()
      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`

      const response = await fetch(url, {
        headers: this.getHeaders(),
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenElectricity API error:', response.status, errorText)
        return null
      }

      const data = await response.json()

      // Increment API call counter
      this.cache.incrementApiCalls()

      // Cache the successful response (5 minutes for real-time data)
      this.cache.set(endpoint, params, data, 5)

      return data

    } catch (error) {
      console.error('Failed to fetch from OpenElectricity API:', error)
      return null
    }
  }

  /**
   * Get current generation mix for a region using real fuel breakdown data
   */
  async getCurrentGenerationMix(region: string): Promise<OpenElectricityFuelMix | null> {
    if (!this.apiKey) {
      console.log('OpenElectricity API key not available, using fallback estimation')
      return null
    }

    try {
      // Get current date in Australian timezone for API call
      const currentDate = new Date().toISOString().split('T')[0] // Get YYYY-MM-DD format

      // Get real fuel breakdown data using secondary_grouping=fueltech for detailed breakdown
      const fuelData = await this.makeRequest<any>('/data/network/NEM', {
        metrics: 'power',
        secondary_grouping: 'fueltech',
        date_start: `${currentDate}T00:00:00`
      })

      if (!fuelData || !fuelData.success) {
        console.log('OpenElectricity fuel breakdown API failed, using fallback estimation')
        return this.getFallbackEstimation(region)
      }

      console.log('✅ Successfully got real OpenElectricity fuel breakdown data!')

      // Process the real fuel breakdown data
      return await this.processRealFuelBreakdownData(fuelData, region)

    } catch (error) {
      console.error('Failed to get generation mix from OpenElectricity:', error)
      // Fallback to time-aware estimation
      return this.getFallbackEstimation(region)
    }
  }

  /**
   * Get current pricing data for a region or calculate Australia-wide average
   */
  async getCurrentPrice(region?: string): Promise<number> {
    if (!this.apiKey) {
      return 50 // Fallback placeholder
    }

    try {
      console.log(`🔍 Attempting to fetch v4 pricing data for region: ${region}`)

      // Based on API error message, use only valid single metrics
      const pricingAttempts = [
        // Attempt 1: Direct price metric
        {
          endpoint: '/v4/data/network/NEM',
          params: { metrics: 'price', limit: 1 },
          description: 'price metric for NEM'
        },
        // Attempt 2: Market value as alternative to price
        {
          endpoint: '/v4/data/network/NEM',
          params: { metrics: 'market_value', limit: 1 },
          description: 'market_value metric for NEM'
        }
      ]

      for (const attempt of pricingAttempts) {
        console.log(`🔍 Trying ${attempt.description}...`)

        const priceData = await this.makeRequest<any>(attempt.endpoint, attempt.params)

        if (priceData?.success && priceData.data && priceData.data.length > 0) {
          console.log('✅ Got v4 price data! Raw response:', JSON.stringify(priceData, null, 2))

          const price = this.processV4PriceData(priceData, region)
          if (price !== 50) { // Not fallback value
            console.log(`💰 Extracted price: $${price}/MWh`)
            return price
          }
        } else {
          console.log(`⚠️ No valid data from ${attempt.description}`)
          if (priceData) {
            console.log(`📊 Response structure: success=${priceData.success}, hasData=${!!priceData.data}`)
          }
        }
      }

      console.log('⚠️ All v4 pricing attempts failed, falling back to realistic estimate')
      return this.getRealisticPriceEstimate(region)

    } catch (error) {
      console.error('Failed to fetch price data:', error)
      return this.getRealisticPriceEstimate(region)
    }
  }

  /**
   * Get realistic price estimate based on Australian market conditions
   */
  private getRealisticPriceEstimate(region?: string): number {
    const currentHour = new Date().getHours()

    let basePrice = 75 // $/MWh - typical Australian average

    // Time-of-day pricing
    if ((currentHour >= 6 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 21)) {
      basePrice = 120 // Peak hours
    } else if (currentHour >= 22 || currentHour <= 6) {
      basePrice = 45 // Off-peak hours
    }

    // Regional adjustments
    if (region) {
      switch (region) {
        case 'SA1': // South Australia typically higher prices
          basePrice *= 1.3
          break
        case 'TAS1': // Tasmania typically lower prices
          basePrice *= 0.8
          break
        case 'QLD1': // Queensland moderate prices
          basePrice *= 1.1
          break
        case 'NSW1': // NSW baseline
          break
        case 'VIC1': // Victoria slightly lower
          basePrice *= 0.95
          break
      }
    }

    console.log(`💰 Fallback price estimate: $${Math.round(basePrice * 10) / 10}/MWh for ${region || 'Australia'}`)

    return Math.round(basePrice * 10) / 10
  }

  /**
   * Process v4 price data response
   */
  private processV4PriceData(priceData: any, targetRegion?: string): number {
    try {
      console.log('🔍 Processing v4 price data structure...')

      // Log the full structure to understand the data format
      const data = priceData.data
      if (!data || data.length === 0) {
        console.log('⚠️ No data array in response')
        return 50
      }

      console.log(`📊 Found ${data.length} data entries`)

      // Look for price data in different possible structures
      for (let i = 0; i < data.length; i++) {
        const entry = data[i]
        console.log(`🔍 Examining entry ${i}:`, JSON.stringify(entry, null, 2))

        // Check for results array
        if (entry.results && Array.isArray(entry.results)) {
          console.log(`📋 Found ${entry.results.length} results in entry ${i}`)

          for (let j = 0; j < entry.results.length; j++) {
            const result = entry.results[j]
            console.log(`🔍 Result ${j}:`, JSON.stringify(result, null, 2))

            // Look for price data
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              const priceValue = result.data[0]
              const region = result.group_by?.region || result.region || 'unknown'

              console.log(`💰 Found price value: ${priceValue} for region: ${region}`)

              // Handle different price data formats
              let extractedPrice: number | null = null

              if (typeof priceValue === 'number') {
                extractedPrice = priceValue
              } else if (typeof priceValue === 'string') {
                // Handle comma-separated format: "timestamp,value"
                const parts = priceValue.split(',')
                if (parts.length === 2) {
                  const value = parseFloat(parts[1])
                  if (!isNaN(value)) {
                    extractedPrice = value
                    console.log(`📊 Parsed CSV format: timestamp=${parts[0]}, value=${value}`)
                  }
                } else {
                  // Try direct parsing
                  const value = parseFloat(priceValue)
                  if (!isNaN(value)) {
                    extractedPrice = value
                  }
                }
              } else if (Array.isArray(priceValue) && priceValue.length >= 2) {
                // Handle array format: [timestamp, value]
                const value = parseFloat(priceValue[1])
                if (!isNaN(value)) {
                  extractedPrice = value
                  console.log(`📊 Parsed array format: timestamp=${priceValue[0]}, value=${value}`)
                }
              }

              if (extractedPrice !== null) {
                // Market value detected - return raw value for conversion in calling function
                if (result.name && result.name.includes('market_value')) {
                  console.log(`💡 Market value detected: ${extractedPrice} - returning for conversion`)
                  return extractedPrice
                }

                // If targeting specific region, match it
                if (targetRegion && targetRegion !== 'Australia') {
                  if (region === targetRegion || region.includes(targetRegion)) {
                    console.log(`✅ Matched target region ${targetRegion}: $${extractedPrice}/MWh`)
                    return Math.round(extractedPrice * 10) / 10
                  }
                } else {
                  // Return first valid price for Australia-wide
                  console.log(`✅ Using price for Australia-wide: $${extractedPrice}/MWh`)
                  return Math.round(extractedPrice * 10) / 10
                }
              }
            }
          }
        }

        // Check for direct price value in entry
        if (entry.price && typeof entry.price === 'number') {
          console.log(`✅ Found direct price in entry: $${entry.price}/MWh`)
          return entry.price
        }
      }

      console.log('⚠️ No valid price data found in v4 response')
      return 50 // Fallback

    } catch (error) {
      console.error('Error processing v4 price data:', error)
      return 50 // Fallback
    }
  }


  /**
   * Process real OpenElectricity fuel breakdown data
   */
  private async processRealFuelBreakdownData(
    apiResponse: any,
    region: string
  ): Promise<OpenElectricityFuelMix> {
    const results = apiResponse.data[0]?.results
    if (!results || results.length === 0) {
      throw new Error('No fuel breakdown data available in API response')
    }

    // Get the timestamp from the first result
    const firstResult = results[0]
    if (!firstResult.data || firstResult.data.length === 0) {
      throw new Error('No data points available')
    }
    const timestamp = firstResult.data[firstResult.data.length - 1][0]

    // Process each fuel type from the API response
    const fuels: OpenElectricityFuelMix['fuels'] = {}
    let totalDemand = 0
    let renewableTotalMW = 0

    // Map only the 8 energy SOURCES (no loads, pumps, charging, or distillate)
    const fuelMapping = {
      'power_battery_discharging': { display: 'Battery', renewable: true, color: '#1E40AF' }, // Darker blue
      'power_coal_black': { display: 'Coal (Black)', renewable: false, color: '#000000' }, // Black
      'power_coal_brown': { display: 'Coal (Brown)', renewable: false, color: '#8B4513' }, // Brown
      'power_gas_ccgt': { display: 'Gas', renewable: false, color: '#6366F1' }, // Combined gas color
      'power_gas_ocgt': { display: 'Gas', renewable: false, color: '#6366F1' },
      'power_gas_steam': { display: 'Gas', renewable: false, color: '#6366F1' },
      'power_gas_wcmg': { display: 'Gas', renewable: false, color: '#6366F1' },
      'power_gas_recip': { display: 'Gas', renewable: false, color: '#6366F1' },
      'power_hydro': { display: 'Hydro', renewable: true, color: '#87CEEB' }, // Light blue
      'power_solar_utility': { display: 'Solar (Utility)', renewable: true, color: '#DAA520' }, // Dark yellow/gold
      'power_solar_rooftop': { display: 'Solar (Rooftop)', renewable: true, color: '#FFFF00' }, // Yellow
      'power_wind': { display: 'Wind', renewable: true, color: '#22C55E' } // Green
    }

    // Process each fuel type result
    for (const result of results) {
      if (!result.data || result.data.length === 0) continue

      // Use the fueltech column for detailed fuel type mapping
      const fuelType = result.columns?.fueltech || result.name
      const latestDataPoint = result.data[result.data.length - 1]
      let powerMW = latestDataPoint[1]

      // Map fueltech to our power_ naming convention for lookup
      const mappingKey = fuelType.startsWith('power_') ? fuelType : `power_${fuelType}`
      const fuelInfo = fuelMapping[mappingKey as keyof typeof fuelMapping]
      if (!fuelInfo) continue

      // Only include battery discharging (sources), skip charging (loads)
      if (fuelType.includes('battery')) {
        // Skip battery charging and net battery (only show discharging as source)
        if (fuelType === 'battery_charging' || fuelType === 'battery') continue
        // For battery discharging, ensure it's positive (energy source)
        if (powerMW <= 0) continue
      }

      // Skip very small or negative values for all sources
      if (powerMW <= 0) continue

      // Aggregate fuels with the same display name
      const displayName = fuelInfo.display
      if (fuels[displayName]) {
        fuels[displayName].power += Math.round(powerMW)
      } else {
        fuels[displayName] = {
          power: Math.round(powerMW),
          percentage: 0, // Will calculate after we have total
          renewable: fuelInfo.renewable,
          color: fuelInfo.color
        }
      }

      totalDemand += powerMW

      if (fuelInfo.renewable) {
        renewableTotalMW += powerMW
      }
    }

    // Add Solar (Rooftop) from AEMO distributed generation data
    try {
      console.log('🔋 Fetching Solar Rooftop data from AEMO...')
      const rooftopSolarMW = await aemoDistributedAPI.getEstimatedSolarRooftop(region)

      if (rooftopSolarMW > 0) {
        fuels['Solar (Rooftop)'] = {
          power: Math.round(rooftopSolarMW),
          percentage: 0, // Will calculate below
          renewable: true,
          color: '#FFFF00'
        }

        totalDemand += rooftopSolarMW
        renewableTotalMW += rooftopSolarMW
        console.log(`✅ Added Solar Rooftop: ${rooftopSolarMW.toFixed(0)} MW`)
      }
    } catch (error) {
      console.warn('⚠️ Failed to get AEMO Solar Rooftop data, using fallback estimation')

      // Fallback: estimate based on utility solar
      const utilitySolarMW = fuels['Solar (Utility)']?.power || 0
      if (utilitySolarMW > 0) {
        const now = new Date(timestamp)
        const hour = now.getHours()

        // Only add rooftop solar during daylight hours (6am-7pm)
        if (hour >= 6 && hour <= 19) {
          const rooftopSolarMW = Math.round(utilitySolarMW * 1.5) // Conservative estimate

          fuels['Solar (Rooftop)'] = {
            power: rooftopSolarMW,
            percentage: 0, // Will calculate below
            renewable: true,
            color: '#FFFF00'
          }

          totalDemand += rooftopSolarMW
          renewableTotalMW += rooftopSolarMW
        }
      }
    }

    // Calculate percentages now that we have total demand including rooftop solar
    for (const fuel of Object.values(fuels)) {
      fuel.percentage = Math.round((fuel.power / totalDemand) * 100 * 10) / 10
    }

    // Ensure all 8 energy source categories are present (add missing ones with 0 values)
    const requiredCategories = [
      { name: 'Solar (Rooftop)', renewable: true, color: '#FFFF00' },
      { name: 'Solar (Utility)', renewable: true, color: '#DAA520' },
      { name: 'Wind', renewable: true, color: '#22C55E' },
      { name: 'Hydro', renewable: true, color: '#87CEEB' },
      { name: 'Battery', renewable: true, color: '#1E40AF' },
      { name: 'Gas', renewable: false, color: '#6366F1' },
      { name: 'Coal (Black)', renewable: false, color: '#000000' },
      { name: 'Coal (Brown)', renewable: false, color: '#8B4513' }
    ]

    for (const category of requiredCategories) {
      if (!fuels[category.name]) {
        fuels[category.name] = {
          power: 0,
          percentage: 0,
          renewable: category.renewable,
          color: category.color
        }
      }
    }

    // Calculate renewable share
    const renewableShare = Math.round((renewableTotalMW / totalDemand) * 100 * 10) / 10

    // Calculate carbon intensity
    const carbonIntensity = this.calculateCarbonIntensityFromRealData(fuels, totalDemand)

    console.log(`Real fuel breakdown: ${Math.round(totalDemand)} MW total, ${renewableShare}% renewable`)

    // Get pricing data via dedicated pricing API call
    const rawPrice = await this.getCurrentPrice('Australia')

    // Convert market value to $/MWh if needed
    let price = rawPrice
    if (rawPrice > 1000) {
      // This is likely market value in total dollars, convert to $/MWh
      price = rawPrice / totalDemand
      // No rounding - keep precise price
      console.log(`🔄 Converted market value $${rawPrice} ÷ ${Math.round(totalDemand)}MW = $${price.toFixed(2)}/MWh`)
    }

    // Convert to $/kWh (divide by 1000)
    const pricePerKWh = price / 1000
    // Round to 4 decimal places for kWh display (e.g., $0.0045)
    const roundedPricePerKWh = Math.round(pricePerKWh * 10000) / 10000
    console.log(`💰 Final price: $${roundedPricePerKWh.toFixed(4)}/kWh`)

    return {
      region: 'Australia',
      timestamp: timestamp,
      totalDemand: Math.round(totalDemand),
      price: roundedPricePerKWh,
      fuels,
      renewableShare,
      carbonIntensity,
      dataSource: `OpenElectricity API (Real fuel breakdown: ${Math.round(totalDemand)} MW)`
    }
  }

  /**
   * Extract price data from fuel/power API response that includes pricing metrics
   */
  private extractPriceFromFuelResponse(apiResponse: any): number | null {
    try {
      console.log('🔍 Looking for pricing data in fuel API response...')

      const results = apiResponse.data[0]?.results
      if (!results || results.length === 0) {
        console.log('⚠️ No results in fuel API response')
        return null
      }

      // Look for price-related results
      for (const result of results) {
        console.log(`🔍 Checking result: ${result.name || result.metric || 'unnamed'}`)
        console.log(`📊 Columns: ${JSON.stringify(result.columns)}`)

        // Check if this result contains price data
        if (result.name && result.name.includes('price')) {
          if (result.data && result.data.length > 0) {
            const latestDataPoint = result.data[result.data.length - 1]
            const priceValue = latestDataPoint[1] // [timestamp, price]

            if (typeof priceValue === 'number') {
              console.log(`✅ Found price data: $${priceValue}/MWh`)
              return priceValue
            }
          }
        }

        // Check if columns indicate price data
        if (result.columns && result.columns.price) {
          if (result.data && result.data.length > 0) {
            const latestDataPoint = result.data[result.data.length - 1]
            // Find price column index
            const priceIndex = Object.keys(result.columns).indexOf('price')
            if (priceIndex >= 0 && latestDataPoint[priceIndex] !== undefined) {
              const priceValue = latestDataPoint[priceIndex]
              if (typeof priceValue === 'number') {
                console.log(`✅ Found price in columns: $${priceValue}/MWh`)
                return priceValue
              }
            }
          }
        }
      }

      console.log('⚠️ No price data found in fuel API response')
      return null

    } catch (error) {
      console.error('Error extracting price from fuel response:', error)
      return null
    }
  }

  /**
   * Process real OpenElectricity v4 API data using Australia-wide fuel mix (legacy method)
   */
  private async processRealOpenElectricityDataWithAustraliaFuelMix(
    apiResponse: any,
    region: string
  ): Promise<OpenElectricityFuelMix> {
    // Extract the latest power data point
    const powerResult = apiResponse.data[0]?.results[0]
    if (!powerResult || !powerResult.data || powerResult.data.length === 0) {
      throw new Error('No power data available in API response')
    }

    // Get the most recent data point [timestamp, power_mw]
    const latestDataPoint = powerResult.data[powerResult.data.length - 1]
    const timestamp = latestDataPoint[0]
    const totalPowerMW = latestDataPoint[1]

    console.log(`Real data: ${totalPowerMW} MW at ${timestamp}`)

    // Use the new Australia-wide fuel mix algorithm
    const australiaFuelMix = await australiaFuelMixAPI.getWholeFuelMix(totalPowerMW, timestamp)

    return {
      region: region,
      timestamp: timestamp,
      totalDemand: Math.round(totalPowerMW),
      price: 50, // Still need price endpoint
      fuels: australiaFuelMix.fuels,
      renewableShare: australiaFuelMix.renewableShare,
      carbonIntensity: australiaFuelMix.carbonIntensity,
      dataSource: `OpenElectricity API + Australia fuel mix (Real: ${Math.round(totalPowerMW)} MW)`
    }
  }

  /**
   * Process real OpenElectricity v4 API data into our format (legacy method)
   */
  private processRealOpenElectricityData(
    apiResponse: any,
    region: string
  ): OpenElectricityFuelMix {
    // Extract the latest power data point
    const powerResult = apiResponse.data[0]?.results[0]
    if (!powerResult || !powerResult.data || powerResult.data.length === 0) {
      throw new Error('No power data available in API response')
    }

    // Get the most recent data point [timestamp, power_mw]
    const latestDataPoint = powerResult.data[powerResult.data.length - 1]
    const timestamp = latestDataPoint[0]
    const totalPowerMW = latestDataPoint[1]

    console.log(`Real data: ${totalPowerMW} MW at ${timestamp}`)

    // For now, we still need to estimate fuel mix breakdown since OpenElectricity
    // v4 API gives us total power but not fuel-specific breakdown
    // We'll combine real total demand with our time-aware estimation

    // Use the real total power as demand, but estimate fuel mix
    const estimatedFuelMix = this.estimateFuelMixFromTotalPower(totalPowerMW, timestamp, region)

    return {
      region: region,
      timestamp: timestamp,
      totalDemand: Math.round(totalPowerMW),
      price: 50, // Still need price endpoint
      fuels: estimatedFuelMix.fuels,
      renewableShare: estimatedFuelMix.renewableShare,
      carbonIntensity: estimatedFuelMix.carbonIntensity,
      dataSource: `OpenElectricity API (Real: ${Math.round(totalPowerMW)} MW)`
    }
  }

  /**
   * Estimate fuel mix breakdown from real total power and timestamp
   */
  private estimateFuelMixFromTotalPower(totalPowerMW: number, timestamp: string, region: string) {
    const date = new Date(timestamp)
    const hour = date.getHours()
    const month = date.getMonth() + 1

    // Calculate solar generation based on real timestamp
    const solarGeneration = this.calculateSolarGeneration(hour, month, region, 35, totalPowerMW) // Assume ~35% renewable

    // Estimate renewable share based on time of day and real total demand
    let estimatedRenewableShare = 35 // Base assumption

    // Adjust renewable share based on time patterns
    if (hour >= 10 && hour <= 14) {
      estimatedRenewableShare += 15 // More solar during peak hours
    } else if (hour >= 0 && hour <= 5) {
      estimatedRenewableShare -= 10 // Less renewable at night
    }

    const renewableMW = (estimatedRenewableShare / 100) * totalPowerMW
    const solarMW = solarGeneration
    const remainingRenewableMW = Math.max(0, renewableMW - solarMW)

    // Regional renewable mix (excluding solar)
    const regionalRenewableMix = this.getRegionalRenewableMix(region)
    const windMW = remainingRenewableMW * regionalRenewableMix.wind
    const hydroMW = remainingRenewableMW * regionalRenewableMix.hydro
    // Battery storage is minimal in real grid data (~0.1% of total)
    const batteryMW = remainingRenewableMW * regionalRenewableMix.battery

    // Fossil fuel breakdown
    const fossilMW = totalPowerMW - renewableMW
    const fossilMix = this.getRegionalFossilMix(region)
    const coalMW = fossilMW * fossilMix.coal
    const gasMW = fossilMW * fossilMix.gas
    const otherMW = fossilMW * fossilMix.other

    // Build fuel breakdown
    const fuels: OpenElectricityFuelMix['fuels'] = {}

    if (coalMW > 0) {
      fuels.coal = {
        power: Math.round(coalMW),
        percentage: Math.round((coalMW / totalPowerMW) * 100 * 10) / 10,
        renewable: false,
        color: '#374151'
      }
    }

    if (gasMW > 0) {
      fuels.gas = {
        power: Math.round(gasMW),
        percentage: Math.round((gasMW / totalPowerMW) * 100 * 10) / 10,
        renewable: false,
        color: '#3B82F6'
      }
    }

    if (solarMW > 0) {
      fuels.solar = {
        power: Math.round(solarMW),
        percentage: Math.round((solarMW / totalPowerMW) * 100 * 10) / 10,
        renewable: true,
        color: '#F59E0B'
      }
    }

    if (windMW > 0) {
      fuels.wind = {
        power: Math.round(windMW),
        percentage: Math.round((windMW / totalPowerMW) * 100 * 10) / 10,
        renewable: true,
        color: '#10B981'
      }
    }

    if (hydroMW > 0) {
      fuels.hydro = {
        power: Math.round(hydroMW),
        percentage: Math.round((hydroMW / totalPowerMW) * 100 * 10) / 10,
        renewable: true,
        color: '#06B6D4'
      }
    }

    // Only show battery if it's a meaningful contribution (>0.1%)
    if (batteryMW > 0 && (batteryMW / totalPowerMW) > 0.001) {
      fuels.battery = {
        power: Math.round(batteryMW),
        percentage: Math.round((batteryMW / totalPowerMW) * 100 * 10) / 10,
        renewable: true,
        color: '#8B5CF6'
      }
    }

    if (otherMW > 0) {
      fuels.other = {
        power: Math.round(otherMW),
        percentage: Math.round((otherMW / totalPowerMW) * 100 * 10) / 10,
        renewable: false,
        color: '#6B7280'
      }
    }

    const carbonIntensity = this.calculateCarbonIntensity(fuels, totalPowerMW)

    return {
      fuels,
      renewableShare: Math.round(estimatedRenewableShare * 10) / 10,
      carbonIntensity
    }
  }

  /**
   * Fallback to time-aware estimation when API is unavailable
   */
  private async getFallbackEstimation(region: string): Promise<OpenElectricityFuelMix | null> {
    try {
      // Get base AEMO data for renewable share and demand
      const aemoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/grid?state=${region.replace('1', '')}`)
      if (!aemoResponse.ok) throw new Error('Failed to fetch AEMO data')

      const aemoData = await aemoResponse.json()
      const now = new Date()
      const hour = now.getHours()
      const month = now.getMonth() + 1

      // Calculate solar generation based on time of day and season
      const solarGeneration = this.calculateSolarGeneration(hour, month, region, aemoData.renewableShare, aemoData.totalDemand)

      // Estimate other renewables
      const renewableMW = (aemoData.renewableShare / 100) * aemoData.totalDemand
      const solarMW = solarGeneration
      const remainingRenewableMW = Math.max(0, renewableMW - solarMW)

      // Regional renewable mix (excluding solar)
      const regionalRenewableMix = this.getRegionalRenewableMix(region)
      const windMW = remainingRenewableMW * regionalRenewableMix.wind
      const hydroMW = remainingRenewableMW * regionalRenewableMix.hydro
      const batteryMW = remainingRenewableMW * regionalRenewableMix.battery

      // Fossil fuel breakdown
      const fossilMW = aemoData.totalDemand - renewableMW
      const fossilMix = this.getRegionalFossilMix(region)
      const coalMW = fossilMW * fossilMix.coal
      const gasMW = fossilMW * fossilMix.gas
      const otherMW = fossilMW * fossilMix.other

      // Build fuel breakdown
      const fuels: OpenElectricityFuelMix['fuels'] = {}

      if (coalMW > 0) {
        fuels.coal = {
          power: Math.round(coalMW),
          percentage: Math.round((coalMW / aemoData.totalDemand) * 100 * 10) / 10,
          renewable: false,
          color: '#374151'
        }
      }

      if (gasMW > 0) {
        fuels.gas = {
          power: Math.round(gasMW),
          percentage: Math.round((gasMW / aemoData.totalDemand) * 100 * 10) / 10,
          renewable: false,
          color: '#3B82F6'
        }
      }

      if (solarMW > 0) {
        fuels.solar = {
          power: Math.round(solarMW),
          percentage: Math.round((solarMW / aemoData.totalDemand) * 100 * 10) / 10,
          renewable: true,
          color: '#F59E0B'
        }
      }

      if (windMW > 0) {
        fuels.wind = {
          power: Math.round(windMW),
          percentage: Math.round((windMW / aemoData.totalDemand) * 100 * 10) / 10,
          renewable: true,
          color: '#10B981'
        }
      }

      if (hydroMW > 0) {
        fuels.hydro = {
          power: Math.round(hydroMW),
          percentage: Math.round((hydroMW / aemoData.totalDemand) * 100 * 10) / 10,
          renewable: true,
          color: '#06B6D4'
        }
      }

      // Only show battery if it's a meaningful contribution (>0.1%)
      if (batteryMW > 0 && (batteryMW / aemoData.totalDemand) > 0.001) {
        fuels.battery = {
          power: Math.round(batteryMW),
          percentage: Math.round((batteryMW / aemoData.totalDemand) * 100 * 10) / 10,
          renewable: true,
          color: '#8B5CF6'
        }
      }

      if (otherMW > 0) {
        fuels.other = {
          power: Math.round(otherMW),
          percentage: Math.round((otherMW / aemoData.totalDemand) * 100 * 10) / 10,
          renewable: false,
          color: '#6B7280'
        }
      }

      // Calculate carbon intensity
      const carbonIntensity = this.calculateCarbonIntensity(fuels, aemoData.totalDemand)

      return {
        region: aemoData.region,
        timestamp: aemoData.timestamp,
        totalDemand: aemoData.totalDemand,
        price: 50, // Placeholder
        fuels,
        renewableShare: aemoData.renewableShare,
        carbonIntensity,
        dataSource: 'Time-aware estimation (API unavailable)'
      }

    } catch (error) {
      console.error('Failed to calculate fallback fuel mix:', error)
      return null
    }
  }

  /**
   * Calculate solar generation based on time of day and season
   */
  private calculateSolarGeneration(hour: number, month: number, region: string, renewableShare: number, totalDemand: number): number {
    // Solar generation is zero outside daylight hours
    if (hour < 6 || hour > 19) return 0

    // Peak solar hours (10am-2pm) with seasonal adjustment
    const summerMonths = [12, 1, 2]
    const winterMonths = [6, 7, 8]

    let seasonalMultiplier = 1.0
    if (summerMonths.includes(month)) seasonalMultiplier = 1.3
    if (winterMonths.includes(month)) seasonalMultiplier = 0.7

    // Solar capacity by region (rough estimates)
    const regionalSolarCapacity = {
      'NSW1': 0.15, // 15% of renewable capacity
      'VIC1': 0.12,
      'QLD1': 0.25,
      'SA1': 0.30,
      'TAS1': 0.05
    }

    const solarCapacity = regionalSolarCapacity[region as keyof typeof regionalSolarCapacity] || 0.15
    const renewableMW = (renewableShare / 100) * totalDemand
    const maxSolarMW = renewableMW * solarCapacity * seasonalMultiplier

    // Time of day curve (simplified sine wave for daylight hours)
    const dayProgress = (hour - 6) / 13 // 6am to 7pm = 13 hours
    const solarCurve = Math.sin(dayProgress * Math.PI)

    return maxSolarMW * solarCurve
  }

  /**
   * Get regional renewable mix characteristics (excluding solar)
   * Updated with realistic battery percentages based on OpenElectricity data
   */
  private getRegionalRenewableMix(region: string) {
    const renewableMix = {
      'NSW1': { wind: 0.45, hydro: 0.54, battery: 0.01 }, // Battery ~0.1% of total
      'VIC1': { wind: 0.65, hydro: 0.34, battery: 0.01 },
      'QLD1': { wind: 0.35, hydro: 0.64, battery: 0.01 },
      'SA1': { wind: 0.75, hydro: 0.24, battery: 0.01 },
      'TAS1': { wind: 0.25, hydro: 0.75, battery: 0.00 } // Tasmania has minimal battery storage
    }

    return renewableMix[region as keyof typeof renewableMix] || renewableMix['NSW1']
  }

  /**
   * Get regional fossil fuel mix characteristics
   */
  private getRegionalFossilMix(region: string) {
    const fossilMix = {
      'NSW1': { coal: 0.6, gas: 0.35, other: 0.05 },
      'VIC1': { coal: 0.8, gas: 0.15, other: 0.05 },
      'QLD1': { coal: 0.7, gas: 0.25, other: 0.05 },
      'SA1': { coal: 0.1, gas: 0.8, other: 0.1 },
      'TAS1': { coal: 0.0, gas: 0.1, other: 0.9 }
    }

    return fossilMix[region as keyof typeof fossilMix] || fossilMix['NSW1']
  }

  /**
   * Calculate weighted carbon intensity for real fuel breakdown data
   */
  private calculateCarbonIntensityFromRealData(fuels: OpenElectricityFuelMix['fuels'], totalDemand: number): number {
    const carbonIntensities = {
      'Coal (Black)': 820,
      'Coal (Brown)': 1200,
      'Gas': 490, // Combined gas category
      'Wind': 11,
      'Solar (Utility)': 41,
      'Solar (Rooftop)': 41,
      'Hydro': 24,
      'Battery': 50,
      'Bioenergy (Biomass)': 230,
      'Pumps': 0,
      'Distillate': 778
    }

    let totalCarbon = 0

    for (const [fuel, data] of Object.entries(fuels)) {
      const intensity = carbonIntensities[fuel as keyof typeof carbonIntensities] || 0
      totalCarbon += data.power * intensity
    }

    return Math.round(totalCarbon / totalDemand)
  }

  /**
   * Calculate weighted carbon intensity (legacy method)
   */
  private calculateCarbonIntensity(fuels: OpenElectricityFuelMix['fuels'], totalDemand: number): number {
    const carbonIntensities = {
      coal: 850,
      gas: 490,
      solar: 41,
      wind: 11,
      hydro: 24,
      battery: 50, // Lifecycle emissions
      other: 300
    }

    let totalCarbon = 0

    for (const [fuel, data] of Object.entries(fuels)) {
      const intensity = carbonIntensities[fuel as keyof typeof carbonIntensities] || 0
      totalCarbon += data.power * intensity
    }

    return Math.round(totalCarbon / totalDemand)
  }

  /**
   * Get fuel characteristics
   */
  private getFuelInfo(fuel: string) {
    const fuelData = {
      coal: { renewable: false, color: '#374151', carbonIntensity: 850 },
      gas: { renewable: false, color: '#3B82F6', carbonIntensity: 490 },
      solar: { renewable: true, color: '#F59E0B', carbonIntensity: 41 },
      wind: { renewable: true, color: '#10B981', carbonIntensity: 11 },
      hydro: { renewable: true, color: '#06B6D4', carbonIntensity: 24 },
      battery: { renewable: true, color: '#8B5CF6', carbonIntensity: 50 },
      other: { renewable: false, color: '#6B7280', carbonIntensity: 300 }
    }

    return fuelData[fuel as keyof typeof fuelData] || fuelData.other
  }

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('No API key configured for OpenElectricity')
      return false
    }

    try {
      // Test with a simple endpoint once we know what's available
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.getHeaders()
      })

      return response.ok
    } catch (error) {
      console.error('OpenElectricity API connection test failed:', error)
      return false
    }
  }
}

export const openElectricityAPI = new OpenElectricityAPI()

// Utility function to check if real API is available
export function hasOpenElectricityAPI(): boolean {
  return openElectricityAPI.isConfigured()
}