'use client'

import { useState, useEffect } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'
import { BatteryIQLogo } from '@/components/ui/BatteryIQLogo'
import MobileNavigation from '@/components/MobileNavigation'

interface LocationData {
  city: string
  state: string
  country: string
  isAustralian: boolean
  latitude: number
  longitude: number
  region: string
}

interface WeatherData {
  timestamp: string
  location: {
    latitude: number
    longitude: number
    timezone: string
  }
  current: {
    temperature: number
    humidity: number
    cloudCover: number
    windSpeed: number
  }
  solar: {
    ghi: number
    dni: number
    dhi: number
  }
  conditions: string
}

interface GridData {
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
  recommendation: {
    action: string
    priority: string
    message: string
  }
}

interface OpenElectricityData {
  success: boolean
  region: string
  timestamp: string
  totalDemand: number
  renewableShare: number
  carbonIntensity: number | null
  fuels: {
    coal: number
    biomass: number
    gas: number
    hydro: number
    solar_utility: number
    solar_rooftop: number
    solar_total: number
    wind: number
    distillate: number
    grid_battery: number
    grid_battery_state: 'charging' | 'discharging' | 'idle'
  }
  dataSource: string
}

export default function GridStatusDashboard() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [gridData, setGridData] = useState<GridData | null>(null)
  const [openElectricityData, setOpenElectricityData] = useState<OpenElectricityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('/api/location')
        if (response.ok) {
          const locationData = await response.json()
          if (locationData.success) {
            // Set location regardless of whether they're Australian
            setLocation(locationData.location)

            // If not Australian, show NSW (NEM-wide) data as fallback
            const stateToUse = locationData.isAustralian ? locationData.location.state : 'NSW'

            // Fetch weather, grid, and OpenElectricity data
            await Promise.all([
              fetchWeatherData(locationData.location.latitude, locationData.location.longitude),
              fetchGridData(stateToUse),
              fetchOpenElectricityData(stateToUse)
            ])
          } else {
            // Fallback to NSW/Melbourne if location detection completely fails
            setLocation({
              city: 'Melbourne',
              state: 'NSW',
              country: 'AU',
              isAustralian: true,
              latitude: -37.8136,
              longitude: 144.9631,
              region: 'NSW1'
            })
            await Promise.all([
              fetchWeatherData(-37.8136, 144.9631),
              fetchGridData('NSW'),
              fetchOpenElectricityData('NSW')
            ])
          }
        } else {
          throw new Error('Location API failed')
        }
      } catch (err) {
        console.error('Location detection error:', err)
        // Fallback to NSW data on error
        setLocation({
          city: 'Sydney',
          state: 'NSW',
          country: 'AU',
          isAustralian: true,
          latitude: -33.8688,
          longitude: 151.2093,
          region: 'NSW1'
        })
        await Promise.all([
          fetchWeatherData(-33.8688, 151.2093),
          fetchGridData('NSW'),
          fetchOpenElectricityData('NSW')
        ])
        setError(null) // Clear error since we have fallback data
      } finally {
        setLoading(false)
      }
    }

    detectLocation()
  }, [])

  const fetchWeatherData = async (latitude: number, longitude: number) => {
    try {
      // Call weather API via the backend
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Weather data:', result)
        setWeatherData(result.data)
        setLastUpdated(new Date())
        setError(null)
      } else {
        throw new Error('Weather API failed')
      }
    } catch (err) {
      console.error('Weather data error:', err)
      setError('Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const fetchGridData = async (state: string) => {
    try {
      // Map state to AEMO region, fallback to NSW1 for non-AEMO states
      const aemoRegions = ['NSW', 'VIC', 'QLD', 'SA', 'TAS', 'ACT']
      const mappedState = aemoRegions.includes(state) ? state : 'NSW'

      const response = await fetch(`/api/grid?state=${mappedState}`)

      if (response.ok) {
        const result = await response.json()
        console.log('Grid data:', result)
        setGridData(result)
        setError(null)
      } else {
        throw new Error('Grid API failed')
      }
    } catch (err) {
      console.error('Grid data error:', err)
      setError('Failed to fetch grid data')
    }
  }

  const fetchOpenElectricityData = async (state: string) => {
    try {
      // Map state to region, fallback to NSW1 for non-AEMO states
      const regionMap: Record<string, string> = {
        'NSW': 'NSW1',
        'VIC': 'VIC1',
        'QLD': 'QLD1',
        'SA': 'SA1',
        'TAS': 'TAS1',
        'ACT': 'NSW1',
        'NT': 'NSW1', // Northern Territory -> fallback to NSW
        'WA': 'NSW1'  // Western Australia -> fallback to NSW (not in NEM but shows NEM data)
      }
      const region = regionMap[state] || 'NSW1'

      const response = await fetch(`/api/openelectricity-fueltech?region=${region}`)

      if (response.ok) {
        const result = await response.json()
        console.log('OpenElectricity data:', result)
        setOpenElectricityData(result)
      } else {
        console.warn('OpenElectricity API failed - this is expected for testing')
      }
    } catch (err) {
      console.error('OpenElectricity data error:', err)
    }
  }

  const refreshData = () => {
    if (location) {
      setLoading(true)
      Promise.all([
        fetchWeatherData(location.latitude, location.longitude),
        fetchGridData(location.state),
        fetchOpenElectricityData(location.state)
      ]).finally(() => setLoading(false))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-gray-600">Loading location and weather data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-morning-sky to-whisper-gray">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <BatteryIQLogo
            size={32}
            animated={true}
            clickable={true}
            showText={true}
          />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Home</a>
            <a href="/calculator" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Calculator</a>
            <a href="/grid-status" className="text-battery-green font-medium">Grid Status</a>
            <a href="/#rebates" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Rebates</a>
            <a href="/#guides" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Guides</a>
          </nav>

          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Live Grid Status</h1>

        {/* Location Display */}
        {location && (
          <>
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Detected Location</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>City:</strong> {location.city}</div>
                <div><strong>State:</strong> {location.state}</div>
                <div><strong>Country:</strong> {location.country}</div>
                <div><strong>NEM Region:</strong> {location.region}</div>
                <div><strong>Latitude:</strong> {location.latitude.toFixed(4)}°</div>
                <div><strong>Longitude:</strong> {location.longitude.toFixed(4)}°</div>
              </div>
            </div>

            {/* Non-Australian Notice */}
            {location.country !== 'AU' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ International Visitor:</strong> You're viewing data for NSW/NEM (Australian National Electricity Market).
                  Grid data and recommendations are specific to Australia's electricity network.
                </p>
              </div>
            )}

            {/* WA Notice */}
            {location.state === 'WA' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Western Australia:</strong> WA uses the SWIS (South West Interconnected System), not the NEM.
                  Showing NSW/NEM data as a reference. WA-specific data coming soon.
                </p>
              </div>
            )}
          </>
        )}

        {/* Weather Data Display */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Real-Time Weather & Solar Data</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshData}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            {/* Current Conditions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-1">Current Conditions</h3>
              <div><strong>Conditions:</strong> {weatherData?.conditions || 'No data'}</div>
              <div><strong>Temperature:</strong> {weatherData?.current?.temperature !== undefined ? `${weatherData.current.temperature.toFixed(1)}°C` : 'No data'}</div>
              <div><strong>Cloud Cover:</strong> {weatherData?.current?.cloudCover !== undefined ? `${weatherData.current.cloudCover}%` : 'No data'}</div>
            </div>

            {/* Humidity & Wind */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-1">Humidity & Wind</h3>
              <div><strong>Humidity:</strong> {weatherData?.current?.humidity !== undefined ? `${weatherData.current.humidity}%` : 'No data'}</div>
              <div><strong>Wind Speed:</strong> {weatherData?.current?.windSpeed !== undefined ? `${weatherData.current.windSpeed.toFixed(1)} km/h` : 'No data'}</div>
            </div>

            {/* Solar Irradiance */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-1">Solar Irradiance</h3>
              <div><strong>GHI:</strong> {weatherData?.solar?.ghi !== undefined ? `${Math.round(weatherData.solar.ghi)} W/m²` : 'No data'}</div>
              <div><strong>DNI:</strong> {weatherData?.solar?.dni !== undefined ? `${Math.round(weatherData.solar.dni)} W/m²` : 'No data'}</div>
              <div><strong>DHI:</strong> {weatherData?.solar?.dhi !== undefined ? `${Math.round(weatherData.solar.dhi)} W/m²` : 'No data'}</div>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-1">Location Info</h3>
              <div><strong>Timezone:</strong> {weatherData?.location?.timezone || 'No data'}</div>
              <div><strong>Data Source:</strong> Open-Meteo</div>
            </div>
          </div>

          {/* Data Source Attribution */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Weather data provided by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open-Meteo</a> - Free open-source weather API</p>
          </div>
        </div>

        {/* Grid & Fuel Mix Display */}
        {gridData && (
          <div className="bg-white rounded-lg p-6 shadow-sm mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Grid Consumption Mix - {gridData.region}</h2>
            <p className="text-sm text-gray-600 mb-4">⚡ Shows what {gridData.region} is consuming (includes imports from other states)</p>

            {/* Grid Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600 text-xs mb-1">Total Demand</div>
                <div className="text-lg font-semibold">{(gridData.totalDemand / 1000).toFixed(1)} GW</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-gray-600 text-xs mb-1">Renewable Share</div>
                <div className="text-lg font-semibold text-green-700">{gridData.renewableShare.toFixed(1)}%</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-gray-600 text-xs mb-1">Carbon Intensity</div>
                <div className="text-lg font-semibold text-orange-700">{Math.round(gridData.carbonIntensity)} kg/MWh</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-600 text-xs mb-1">Price</div>
                <div className="text-lg font-semibold text-blue-700">${gridData.price.toFixed(0)}/MWh</div>
              </div>
            </div>

            {/* Fuel Mix Breakdown */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 mb-3">Consumption by Source</h3>

              {gridData.fueltechBreakdown.battery > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="font-medium">Battery</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{gridData.fueltechBreakdown.battery} MW</span>
                    <span className="ml-4 text-gray-600">{((gridData.fueltechBreakdown.battery / gridData.totalDemand) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {gridData.fueltechBreakdown.coal > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                    <span className="font-medium">Coal</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{(gridData.fueltechBreakdown.coal / 1000).toFixed(1)} GW</span>
                    <span className="ml-4 text-gray-600">{((gridData.fueltechBreakdown.coal / gridData.totalDemand) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {gridData.fueltechBreakdown.gas > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium">Gas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{gridData.fueltechBreakdown.gas} MW</span>
                    <span className="ml-4 text-gray-600">{((gridData.fueltechBreakdown.gas / gridData.totalDemand) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {gridData.fueltechBreakdown.hydro > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <span className="font-medium">Hydro</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{gridData.fueltechBreakdown.hydro} MW</span>
                    <span className="ml-4 text-gray-600">{((gridData.fueltechBreakdown.hydro / gridData.totalDemand) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {/* Solar (Utility) - ALWAYS SHOW even if 0 */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">Solar (Utility)</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{gridData.fueltechBreakdown.solar} MW</span>
                  <span className="ml-4 text-gray-600">{((gridData.fueltechBreakdown.solar / gridData.totalDemand) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {gridData.fueltechBreakdown.wind > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium">Wind</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{(gridData.fueltechBreakdown.wind / 1000).toFixed(1)} GW</span>
                    <span className="ml-4 text-gray-600">{((gridData.fueltechBreakdown.wind / gridData.totalDemand) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {gridData.fueltechBreakdown.other > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="font-medium">Other</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{gridData.fueltechBreakdown.other} MW</span>
                    <span className="ml-4 text-gray-600">{((gridData.fueltechBreakdown.other / gridData.totalDemand) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendation */}
            {gridData.recommendation && (
              <div className={`mt-6 p-4 rounded-lg ${
                gridData.recommendation.priority === 'high' ? 'bg-red-50 border border-red-200' :
                gridData.recommendation.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <div className="font-semibold text-sm uppercase mb-1">
                  {gridData.recommendation.action === 'charge' ? '🔋 Charge Battery' :
                   gridData.recommendation.action === 'discharge' ? '⚡ Discharge Battery' :
                   '⏸️ Hold'}
                </div>
                <div className="text-sm">{gridData.recommendation.message}</div>
              </div>
            )}

            {/* Data Source Attribution */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>Grid data from <strong>AEMO</strong> (Australian Energy Market Operator)</p>
              <p className="text-xs mt-1">Updated: {new Date(gridData.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* OpenElectricity Real Fuel Mix (Test) */}
        {openElectricityData && (
          <div className="bg-white rounded-lg p-6 shadow-sm mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Local Generation Mix - {openElectricityData.region}</h2>
            <p className="text-sm text-gray-600 mb-4">⚡ Shows what {openElectricityData.region} is generating locally (excludes imports)</p>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600 text-xs mb-1">Local Generation</div>
                <div className="text-lg font-semibold">{(openElectricityData.totalDemand / 1000).toFixed(1)} GW</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-gray-600 text-xs mb-1">Renewable Share</div>
                <div className="text-lg font-semibold text-green-700">{openElectricityData.renewableShare.toFixed(1)}%</div>
              </div>
              {openElectricityData.carbonIntensity !== null && (
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-gray-600 text-xs mb-1">Carbon Intensity</div>
                  <div className="text-lg font-semibold text-orange-700">{openElectricityData.carbonIntensity} kg/MWh</div>
                </div>
              )}
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-600 text-xs mb-1">Data Source</div>
                <div className="text-sm font-semibold text-blue-700">Real-time API</div>
              </div>
            </div>

            {/* Fuel Mix Breakdown - Always show all fuel types including Solar at 0 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 mb-3">Generation by Source</h3>

              {/* Grid Battery */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="font-medium">
                    Grid Battery {openElectricityData.fuels.grid_battery_state !== 'idle' && `(${openElectricityData.fuels.grid_battery_state})`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{openElectricityData.fuels.grid_battery} MW</span>
                  <span className="ml-4 text-gray-600">{((Math.abs(openElectricityData.fuels.grid_battery) / openElectricityData.totalDemand) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Biomass */}
              {openElectricityData.fuels.biomass > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-lime-600"></div>
                    <span className="font-medium">Biomass</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{openElectricityData.fuels.biomass} MW</span>
                    <span className="ml-4 text-gray-600">{((openElectricityData.fuels.biomass / openElectricityData.totalDemand) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Coal */}
              {openElectricityData.fuels.coal > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                    <span className="font-medium">Coal</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{(openElectricityData.fuels.coal / 1000).toFixed(1)} GW</span>
                    <span className="ml-4 text-gray-600">{((openElectricityData.fuels.coal / openElectricityData.totalDemand) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {/* Gas */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Gas</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{openElectricityData.fuels.gas} MW</span>
                  <span className="ml-4 text-gray-600">{((openElectricityData.fuels.gas / openElectricityData.totalDemand) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Hydro */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="font-medium">Hydro</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{(openElectricityData.fuels.hydro / 1000).toFixed(1)} GW</span>
                  <span className="ml-4 text-gray-600">{((openElectricityData.fuels.hydro / openElectricityData.totalDemand) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Solar (Utility) - ALWAYS SHOW even if 0 */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">Solar (Utility)</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{openElectricityData.fuels.solar_utility} MW</span>
                  <span className="ml-4 text-gray-600">{((openElectricityData.fuels.solar_utility / openElectricityData.totalDemand) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Solar (Rooftop) - ALWAYS SHOW even if 0 */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className="font-medium">Solar (Rooftop)</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{openElectricityData.fuels.solar_rooftop} MW</span>
                  <span className="ml-4 text-gray-600">{((openElectricityData.fuels.solar_rooftop / openElectricityData.totalDemand) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Wind */}
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Wind</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{(openElectricityData.fuels.wind / 1000).toFixed(1)} GW</span>
                  <span className="ml-4 text-gray-600">{((openElectricityData.fuels.wind / openElectricityData.totalDemand) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Liquid Fuel */}
              {openElectricityData.fuels.distillate > 0 && (
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-medium">Liquid Fuel</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{openElectricityData.fuels.distillate} MW</span>
                    <span className="ml-4 text-gray-600">{((openElectricityData.fuels.distillate / openElectricityData.totalDemand) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}

            </div>

            {/* Data Source Attribution */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>Data Source: <strong>{openElectricityData.dataSource}</strong></p>
              <p className="text-xs mt-1">Region: {openElectricityData.region} | Updated: {new Date(openElectricityData.timestamp).toLocaleString()}</p>
              <p className="mt-2 text-gray-600">Note: This shows local generation only. {openElectricityData.region} may import/export power via interconnectors. Brown coal is Victoria-specific; black coal comes from NSW/QLD imports (shown in consumption mix above).</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <BatteryIQLogo
                  size={24}
                  animated={false}
                  clickable={false}
                  showText={true}
                  color="#00D97E"
                  className="[&_span]:text-white [&_span]:text-xl"
                />
              </div>
              <p className="text-gray-400">
                Intelligent battery decisions for smart, environmentally conscious Australians.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tools</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/calculator" className="hover:text-white">Battery Calculator</a></li>
                <li><a href="/grid-status" className="hover:text-white">Grid Status</a></li>
                <li><a href="#" className="hover:text-white">ROI Calculator</a></li>
                <li><a href="#" className="hover:text-white">Installer Finder</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/#rebates" className="hover:text-white">2025 Rebate Guide</a></li>
                <li><a href="#" className="hover:text-white">VPP Requirements</a></li>
                <li><a href="#" className="hover:text-white">Installation Timeline</a></li>
                <li><a href="#" className="hover:text-white">Battery Comparison</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BatteryIQ. All rights reserved. Intelligent battery decisions for Australia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}