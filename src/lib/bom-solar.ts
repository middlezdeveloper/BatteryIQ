// BOM (Bureau of Meteorology) Solar API Integration
// Real-time solar irradiance data for more accurate generation estimates

interface BOMSolarData {
  timestamp: string
  location: string
  latitude: number
  longitude: number
  globalHorizontalIrradiance: number  // W/m²
  directNormalIrradiance: number      // W/m²
  diffuseHorizontalIrradiance: number // W/m²
  cloudCover: number                  // %
  temperature: number                 // °C
  uvIndex: number
  visibility: number                  // km
}

interface BOMApiResponse {
  observations: {
    data: Array<{
      sort_order: number
      wmo: number
      name: string
      history_product: string
      local_date_time: string
      local_date_time_full: string
      aifstime_utc: string
      lat: number
      lon: number
      apparent_t: number
      cloud: string
      cloud_base_m: number
      cloud_oktas: number
      cloud_type_id: number
      cloud_type: string
      delta_t: number
      gust_kmh: number
      gust_kt: number
      air_temp: number
      dewpt: number
      press: number
      press_qnh: number
      press_msl: number
      press_tend: string
      rain_trace: string
      rel_hum: number
      sea_state: string
      swell_dir_worded: string
      swell_height: number
      swell_period: number
      vis_km: number
      weather: string
      wind_dir: string
      wind_spd_kmh: number
      wind_spd_kt: number
    }>
  }
}

class BOMSolarAPI {
  private baseUrl = 'http://reg.bom.gov.au/fwo'
  private cache = new Map<string, { data: BOMSolarData; expires: number }>()

  /**
   * Get real-time solar irradiance for a location
   * @param latitude Location latitude
   * @param longitude Location longitude
   * @returns Current solar conditions
   */
  async getSolarIrradiance(latitude: number, longitude: number): Promise<BOMSolarData | null> {
    try {
      // Find nearest BOM weather station
      const stationId = this.findNearestStation(latitude, longitude)
      const cacheKey = `solar-${stationId}`

      // Check cache (15-minute TTL)
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        return cached.data
      }

      // Fetch current weather observations
      const response = await fetch(
        `${this.baseUrl}/${stationId}.json`,
        {
          headers: {
            'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)',
            'Accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.warn(`BOM API returned ${response.status} for station ${stationId}`)
        return this.getFallbackSolarData(latitude, longitude)
      }

      const data: BOMApiResponse = await response.json()

      if (!data.observations?.data?.length) {
        console.warn('No BOM observation data available')
        return this.getFallbackSolarData(latitude, longitude)
      }

      const latest = data.observations.data[0]
      const solarData = this.transformBOMData(latest, latitude, longitude)

      // Cache for 15 minutes
      this.cache.set(cacheKey, {
        data: solarData,
        expires: Date.now() + 15 * 60 * 1000
      })

      return solarData

    } catch (error) {
      console.error('BOM Solar API error:', error)
      return this.getFallbackSolarData(latitude, longitude)
    }
  }

  /**
   * Transform BOM weather data into solar irradiance estimates
   * @param bomData Raw BOM observation data
   * @param lat Location latitude
   * @param lon Location longitude
   * @returns Estimated solar irradiance data
   */
  private transformBOMData(bomData: any, lat: number, lon: number): BOMSolarData {
    const timestamp = bomData.aifstime_utc || new Date().toISOString()
    const cloudCover = this.parseCloudCover(bomData.cloud, bomData.cloud_oktas)

    // Estimate solar irradiance based on time, cloud cover, and atmospheric conditions
    const solarElevation = this.calculateSolarElevation(lat, lon, new Date(timestamp))
    const clearSkyIrradiance = this.calculateClearSkyIrradiance(solarElevation)

    // Reduce irradiance based on cloud cover
    const cloudReduction = this.calculateCloudReduction(cloudCover, bomData.vis_km)
    const actualIrradiance = clearSkyIrradiance * (1 - cloudReduction)

    return {
      timestamp,
      location: bomData.name || 'Unknown',
      latitude: bomData.lat || lat,
      longitude: bomData.lon || lon,
      globalHorizontalIrradiance: Math.max(0, actualIrradiance),
      directNormalIrradiance: Math.max(0, actualIrradiance * 0.8), // Estimate
      diffuseHorizontalIrradiance: Math.max(0, actualIrradiance * 0.2), // Estimate
      cloudCover,
      temperature: bomData.air_temp || 25,
      uvIndex: this.estimateUVIndex(actualIrradiance, cloudCover),
      visibility: bomData.vis_km || 10
    }
  }

  /**
   * Find nearest BOM weather station for coordinates
   * @param lat Latitude
   * @param lon Longitude
   * @returns BOM station identifier
   */
  private findNearestStation(lat: number, lon: number): string {
    // Major Australian weather stations with solar relevance
    const stations = [
      { id: 'IDN60901', lat: -33.9, lon: 151.2, name: 'Sydney' },
      { id: 'IDV60901', lat: -37.8, lon: 144.9, name: 'Melbourne' },
      { id: 'IDQ60901', lat: -27.4, lon: 153.0, name: 'Brisbane' },
      { id: 'IDS60901', lat: -34.9, lon: 138.6, name: 'Adelaide' },
      { id: 'IDW60901', lat: -31.9, lon: 115.9, name: 'Perth' },
      { id: 'IDT60901', lat: -42.9, lon: 147.3, name: 'Hobart' },
      { id: 'IDD60901', lat: -12.4, lon: 130.8, name: 'Darwin' },
      { id: 'IDN60903', lat: -35.3, lon: 149.1, name: 'Canberra' }
    ]

    // Find closest station by distance
    let nearest = stations[0]
    let minDistance = this.calculateDistance(lat, lon, nearest.lat, nearest.lon)

    for (const station of stations.slice(1)) {
      const distance = this.calculateDistance(lat, lon, station.lat, station.lon)
      if (distance < minDistance) {
        minDistance = distance
        nearest = station
      }
    }

    return nearest.id
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  /**
   * Parse cloud cover from BOM data
   */
  private parseCloudCover(cloudText: string, cloudOktas: number): number {
    if (typeof cloudOktas === 'number' && cloudOktas >= 0 && cloudOktas <= 8) {
      return (cloudOktas / 8) * 100 // Convert oktas (0-8) to percentage
    }

    // Fallback: parse text descriptions
    if (!cloudText) return 0

    const text = cloudText.toLowerCase()
    if (text.includes('clear') || text.includes('sunny')) return 0
    if (text.includes('few clouds')) return 25
    if (text.includes('scattered')) return 50
    if (text.includes('broken')) return 75
    if (text.includes('overcast') || text.includes('cloudy')) return 90

    return 50 // Default moderate cloud cover
  }

  /**
   * Calculate solar elevation angle
   */
  private calculateSolarElevation(lat: number, lon: number, date: Date): number {
    // Simplified solar position calculation
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180)

    const hour = date.getUTCHours() + date.getUTCMinutes() / 60
    const solarHour = hour + (lon / 15) - 12

    const elevation = Math.asin(
      Math.sin(declination * Math.PI / 180) * Math.sin(lat * Math.PI / 180) +
      Math.cos(declination * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.cos(solarHour * 15 * Math.PI / 180)
    ) * 180 / Math.PI

    return Math.max(0, elevation)
  }

  /**
   * Calculate clear sky irradiance based on solar elevation
   */
  private calculateClearSkyIrradiance(elevation: number): number {
    if (elevation <= 0) return 0

    // Direct normal irradiance model (simplified)
    const airMass = 1 / Math.sin(elevation * Math.PI / 180)
    const clearSkyDNI = 900 * Math.exp(-0.15 * airMass) // W/m²

    // Convert to global horizontal irradiance
    return clearSkyDNI * Math.sin(elevation * Math.PI / 180)
  }

  /**
   * Calculate cloud reduction factor
   */
  private calculateCloudReduction(cloudCover: number, visibility: number): number {
    // Cloud cover reduces irradiance
    const cloudReduction = (cloudCover / 100) * 0.75

    // Poor visibility also reduces irradiance
    const visibilityReduction = visibility < 10 ? (10 - visibility) / 10 * 0.2 : 0

    return Math.min(0.95, cloudReduction + visibilityReduction)
  }

  /**
   * Estimate UV Index from irradiance
   */
  private estimateUVIndex(irradiance: number, cloudCover: number): number {
    // Rough UV index estimation
    const maxUV = 12
    const baseUV = (irradiance / 1000) * maxUV
    const cloudReduction = (cloudCover / 100) * 0.3
    return Math.max(0, Math.round(baseUV * (1 - cloudReduction)))
  }

  /**
   * Fallback solar data when BOM API is unavailable
   */
  private getFallbackSolarData(lat: number, lon: number): BOMSolarData {
    const now = new Date()
    const elevation = this.calculateSolarElevation(lat, lon, now)
    const irradiance = this.calculateClearSkyIrradiance(elevation) * 0.8 // Assume some clouds

    return {
      timestamp: now.toISOString(),
      location: 'Estimated',
      latitude: lat,
      longitude: lon,
      globalHorizontalIrradiance: irradiance,
      directNormalIrradiance: irradiance * 0.8,
      diffuseHorizontalIrradiance: irradiance * 0.2,
      cloudCover: 20, // Assume light clouds
      temperature: 25, // Default temperature
      uvIndex: this.estimateUVIndex(irradiance, 20),
      visibility: 10
    }
  }
}

// Export singleton instance
export const bomSolarAPI = new BOMSolarAPI()

// Utility function to calculate current solar generation potential
export function calculateCurrentSolarGeneration(
  solarCapacity: number, // kW
  solarData: BOMSolarData,
  panelEfficiency: number = 0.2 // 20% panel efficiency
): number {
  const irradianceKW = solarData.globalHorizontalIrradiance / 1000 // Convert W/m² to kW/m²
  const standardIrradiance = 1 // 1 kW/m² standard test conditions

  // Temperature derating (panels lose efficiency when hot)
  const tempCoeff = -0.004 // -0.4% per °C above 25°C
  const tempDerate = 1 + (solarData.temperature - 25) * tempCoeff

  // Current generation in kW
  const currentGeneration = solarCapacity *
    (irradianceKW / standardIrradiance) *
    tempDerate *
    panelEfficiency

  return Math.max(0, currentGeneration)
}

// Enhanced solar generation estimate using real-time data
export function getEnhancedSolarEstimate(
  solarCapacity: number,
  latitude: number,
  longitude: number
): Promise<{
  currentGeneration: number
  todayEstimate: number
  conditions: string
  irradiance: number
}> {
  return bomSolarAPI.getSolarIrradiance(latitude, longitude).then(solarData => {
    if (!solarData) {
      // Fallback to standard estimates
      return {
        currentGeneration: solarCapacity * 0.8, // Assume good conditions
        todayEstimate: solarCapacity * 4.2, // Standard daily estimate
        conditions: 'Estimated (no real-time data)',
        irradiance: 800 // W/m²
      }
    }

    const currentGen = calculateCurrentSolarGeneration(solarCapacity, solarData)

    // Estimate today's total based on current conditions
    const hoursRemaining = (18 - new Date().getHours()) // Assume sunset at 6pm
    const todayEstimate = currentGen * Math.max(0, hoursRemaining) +
      (solarCapacity * 4.2 * (new Date().getHours() / 24)) // Already generated today

    let conditions = ''
    if (solarData.cloudCover < 25) conditions = 'Excellent solar conditions ☀️'
    else if (solarData.cloudCover < 50) conditions = 'Good solar conditions ⛅'
    else if (solarData.cloudCover < 75) conditions = 'Moderate solar conditions ☁️'
    else conditions = 'Poor solar conditions 🌧️'

    return {
      currentGeneration: Math.round(currentGen * 100) / 100,
      todayEstimate: Math.round(todayEstimate * 100) / 100,
      conditions,
      irradiance: Math.round(solarData.globalHorizontalIrradiance)
    }
  })
}