// Open-Meteo Weather API Integration
// Free, fast, and accurate weather data for Australia
// https://open-meteo.com/

interface WeatherData {
  timestamp: string
  location: {
    latitude: number
    longitude: number
    timezone: string
  }
  current: {
    temperature: number // °C
    humidity: number // %
    cloudCover: number // %
    windSpeed: number // km/h
  }
  solar: {
    ghi: number // Global Horizontal Irradiance (W/m²)
    dni: number // Direct Normal Irradiance (W/m²)
    dhi: number // Diffuse Horizontal Irradiance (W/m²)
  }
  conditions: string
}

class WeatherAPI {
  private baseUrl = 'https://api.open-meteo.com/v1/forecast'
  private cache = new Map<string, { data: WeatherData; expires: number }>()

  /**
   * Clear the cache for debugging or forced refresh
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 Weather API cache cleared')
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Get real-time weather and solar data for a location
   * @param latitude Location latitude
   * @param longitude Location longitude
   * @returns Current weather and solar conditions
   */
  async getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      // Create cache key based on rounded coordinates
      const cacheKey = `weather-${latitude.toFixed(2)}_${longitude.toFixed(2)}`

      // Check cache (15-minute TTL)
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        console.log(`📋 Using cached weather data for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        return cached.data
      }

      console.log(`🌤️ Fetching fresh weather data for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)

      // Build API URL with all required parameters
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: 'temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m',
        hourly: 'shortwave_radiation,direct_radiation,diffuse_radiation',
        timezone: 'auto',
      })

      const response = await fetch(`${this.baseUrl}?${params}`)

      if (!response.ok) {
        throw new Error(`Open-Meteo API returned ${response.status}`)
      }

      const data = await response.json()

      // Transform to our format
      const weatherData = this.transformWeatherData(data, latitude, longitude)

      // Cache for 15 minutes
      this.cache.set(cacheKey, {
        data: weatherData,
        expires: Date.now() + 15 * 60 * 1000
      })

      return weatherData

    } catch (error) {
      console.error('Weather API error:', error)
      throw error
    }
  }

  /**
   * Transform Open-Meteo data to our format
   */
  private transformWeatherData(data: any, lat: number, lon: number): WeatherData {
    const current = data.current || {}
    const hourly = data.hourly || {}

    // Get current hour index (Open-Meteo returns 0 for midnight)
    const currentHour = new Date().getHours()

    return {
      timestamp: current.time || new Date().toISOString(),
      location: {
        latitude: lat,
        longitude: lon,
        timezone: data.timezone || 'Australia/Sydney'
      },
      current: {
        temperature: current.temperature_2m ?? 0,
        humidity: current.relative_humidity_2m ?? 0,
        cloudCover: current.cloud_cover ?? 0,
        windSpeed: current.wind_speed_10m ?? 0
      },
      solar: {
        ghi: hourly.shortwave_radiation?.[currentHour] ?? 0,
        dni: hourly.direct_radiation?.[currentHour] ?? 0,
        dhi: hourly.diffuse_radiation?.[currentHour] ?? 0
      },
      conditions: this.describeConditions(
        current.cloud_cover ?? 0,
        hourly.shortwave_radiation?.[currentHour] ?? 0
      )
    }
  }

  /**
   * Generate human-readable weather conditions
   */
  private describeConditions(cloudCover: number, irradiance: number): string {
    const isDaytime = irradiance > 0

    if (!isDaytime) {
      return 'Night'
    }

    if (cloudCover < 25) {
      return 'Clear skies ☀️'
    } else if (cloudCover < 50) {
      return 'Partly cloudy ⛅'
    } else if (cloudCover < 75) {
      return 'Mostly cloudy ☁️'
    } else {
      return 'Overcast 🌥️'
    }
  }
}

// Export singleton instance
export const weatherAPI = new WeatherAPI()

/**
 * Calculate current solar generation potential
 * @param solarCapacity System capacity in kW
 * @param weatherData Current weather data
 * @param panelEfficiency Panel efficiency (default 0.2 = 20%)
 * @returns Estimated current generation in kW
 */
export function calculateSolarGeneration(
  solarCapacity: number,
  weatherData: WeatherData,
  panelEfficiency: number = 0.2
): number {
  const irradianceKW = weatherData.solar.ghi / 1000 // W/m² to kW/m²
  const standardIrradiance = 1 // 1 kW/m² STC

  // Temperature derating (panels lose efficiency when hot)
  const tempCoeff = -0.004 // -0.4% per °C above 25°C
  const tempDerate = 1 + (weatherData.current.temperature - 25) * tempCoeff

  // Current generation in kW
  const generation = solarCapacity *
    (irradianceKW / standardIrradiance) *
    tempDerate *
    panelEfficiency

  return Math.max(0, generation)
}

/**
 * Get enhanced solar generation estimate
 * @param solarCapacity System capacity in kW
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Solar generation estimate with conditions
 */
export async function getEnhancedSolarEstimate(
  solarCapacity: number,
  latitude: number,
  longitude: number
): Promise<{
  currentGeneration: number
  conditions: string
  irradiance: number
  temperature: number
  cloudCover: number
}> {
  try {
    const weatherData = await weatherAPI.getWeatherData(latitude, longitude)
    const currentGen = calculateSolarGeneration(solarCapacity, weatherData)

    return {
      currentGeneration: Math.round(currentGen * 100) / 100,
      conditions: weatherData.conditions,
      irradiance: Math.round(weatherData.solar.ghi),
      temperature: Math.round(weatherData.current.temperature * 10) / 10,
      cloudCover: Math.round(weatherData.current.cloudCover)
    }

  } catch (error) {
    console.error('Failed to get solar estimate:', error)

    // Return fallback data
    return {
      currentGeneration: 0,
      conditions: 'Data unavailable',
      irradiance: 0,
      temperature: 0,
      cloudCover: 0
    }
  }
}
