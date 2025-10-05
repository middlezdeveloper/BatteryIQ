// OpenElectricity API Sandbox - Clean Implementation
// Testing proper API configuration based on official documentation
// Base URL: https://api.openelectricity.org.au/v4
// Auth: Authorization: Bearer <api_key>

interface OpenElectricityConfig {
  baseUrl: string
  apiKey: string | null
  version: string
}

interface OpenElectricityResponse<T = any> {
  version: string
  created_at: string
  success: boolean
  data: T[]
  total_records?: number
}

interface OpenElectricityError {
  error: {
    code: string
    message: string
    details?: any[]
  }
}

class OpenElectricitySandbox {
  private config: OpenElectricityConfig

  constructor() {
    this.config = {
      baseUrl: 'https://api.openelectricity.org.au/v4', // Correct v4 endpoint
      apiKey: process.env.OPENELECTRICITY_API_KEY || null, // Use environment variable
      version: '4.0'
    }
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    return this.config.apiKey !== null
  }

  /**
   * Get authentication headers according to documentation
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BatteryIQ/1.0 (https://batteryiq.com.au)',
      'Accept': 'application/json'
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }

  /**
   * Make a test API call to verify configuration
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'API key not configured. Set OPENELECTRICITY_API_KEY environment variable.'
      }
    }

    try {
      console.log('🔧 Testing OpenElectricity API connection...')
      console.log(`📍 Base URL: ${this.config.baseUrl}`)
      console.log(`🔑 API Key: ${this.config.apiKey ? 'Configured' : 'Missing'}`)

      // Test with a simple endpoint - let's try to get available datasets
      const response = await fetch(`${this.config.baseUrl}/data/network/NEM`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      console.log(`📊 Response Status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error: ${response.status}`, errorText)

        return {
          success: false,
          message: `API returned ${response.status}: ${response.statusText}`,
          details: errorText
        }
      }

      const data = await response.json()
      console.log('✅ API connection successful!')
      console.log('📋 Response structure:', JSON.stringify(data, null, 2))

      return {
        success: true,
        message: 'API connection successful',
        details: data
      }

    } catch (error) {
      console.error('💥 Connection test failed:', error)
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      }
    }
  }

  /**
   * Test specific data endpoints we need for BatteryIQ
   */
  async testDataEndpoints(): Promise<{ endpoint: string; success: boolean; message: string; data?: any }[]> {
    if (!this.isConfigured()) {
      return [{
        endpoint: 'none',
        success: false,
        message: 'API key not configured'
      }]
    }

    const testEndpoints = [
      {
        name: 'Power Generation Data',
        url: `${this.config.baseUrl}/data/network/NEM?metrics=power&limit=1`
      },
      {
        name: 'Generation by Fuel Type',
        url: `${this.config.baseUrl}/data/network/NEM?metrics=power&secondary_grouping=fueltech&limit=1`
      },
      {
        name: 'Pricing Data',
        url: `${this.config.baseUrl}/data/network/NEM?metrics=price&limit=1`
      },
      {
        name: 'Demand Data',
        url: `${this.config.baseUrl}/data/network/NEM?metrics=demand&limit=1`
      }
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      console.log(`\n🧪 Testing: ${endpoint.name}`)
      console.log(`🔗 URL: ${endpoint.url}`)

      try {
        const response = await fetch(endpoint.url, {
          headers: this.getHeaders()
        })

        console.log(`📊 Status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Success')
          console.log(`📈 Records: ${data.total_records || data.data?.length || 'unknown'}`)

          results.push({
            endpoint: endpoint.name,
            success: true,
            message: `Success: ${response.status}`,
            data: data
          })
        } else {
          const errorText = await response.text()
          console.log(`❌ Failed: ${errorText}`)

          results.push({
            endpoint: endpoint.name,
            success: false,
            message: `Error ${response.status}: ${errorText}`,
            data: null
          })
        }

        // Add small delay between requests to be polite
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.log(`💥 Exception: ${error}`)

        results.push({
          endpoint: endpoint.name,
          success: false,
          message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
          data: null
        })
      }
    }

    return results
  }

  /**
   * Get available metrics and parameters
   */
  async getAvailableMetrics(): Promise<string[]> {
    // Based on documentation, these are the available metrics
    return [
      'power',
      'energy',
      'price',
      'market_value',
      'demand',
      'demand_energy',
      'curtailment',
      'curtailment_energy',
      'curtailment_solar_utility',
      'curtailment_solar_utility_energy',
      'curtailment_wind',
      'curtailment_wind_energy',
      'emissions',
      'renewable_proportion',
      'pollution',
      'storage_battery'
    ]
  }

  /**
   * Test a custom endpoint with specific parameters
   */
  async testCustomEndpoint(
    metrics: string,
    additionalParams: Record<string, string> = {}
  ): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'API key not configured'
      }
    }

    try {
      const params = new URLSearchParams({
        metrics,
        limit: '5',
        ...additionalParams
      })

      const url = `${this.config.baseUrl}/data/network/NEM?${params.toString()}`
      console.log(`🔗 Testing custom endpoint: ${url}`)

      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      console.log(`📊 Status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Custom endpoint success')
        return {
          success: true,
          message: 'Success',
          data
        }
      } else {
        const errorText = await response.text()
        console.log(`❌ Custom endpoint failed: ${errorText}`)
        return {
          success: false,
          message: `Error ${response.status}: ${errorText}`
        }
      }

    } catch (error) {
      console.log(`💥 Custom endpoint exception: ${error}`)
      return {
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}

// Export singleton instance
export const openElectricitySandbox = new OpenElectricitySandbox()

// Export types for use in other files
export type { OpenElectricityResponse, OpenElectricityError }