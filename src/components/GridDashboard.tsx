'use client'

import { useState, useEffect } from 'react'
import { Battery, Zap, Leaf, AlertTriangle, MapPin, Sun, Cloud, Eye, Thermometer, Wind } from 'lucide-react'
import { BatteryIQLogo } from '@/components/ui/BatteryIQLogo'
import PieChart from '@/components/ui/PieChart'
import Link from 'next/link'

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
  recommendation: {
    action: 'charge' | 'hold' | 'discharge'
    priority: 'low' | 'medium' | 'high'
    message: string
  }
}

interface WeatherData {
  location: string
  coordinates: {
    lat: number
    lng: number
  }
  current: {
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: string
    cloudCover: number
    visibility: number
    uvIndex: number
    solarIrradiance: number
  }
  solar: {
    estimatedGeneration: number
    peakSunHours: number
    efficiency: number
    recommendation: string
  }
}

interface LocationData {
  state: string
  city: string
  region: string
  coordinates: {
    lat: number
    lng: number
  }
}

export default function GridDashboard() {
  const [gridData, setGridData] = useState<GridMixData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null)
  const [currentState, setCurrentState] = useState<string>('VIC')

  // Detect user location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('/api/location')
        if (response.ok) {
          const locationData = await response.json()
          if (locationData.success && locationData.isAustralian) {
            setDetectedLocation({
              state: locationData.location.state,
              city: locationData.location.city,
              region: locationData.location.region,
              coordinates: locationData.location.coordinates
            })
            setCurrentState(locationData.location.state)
          }
        }
      } catch (err) {
        console.log('Location detection failed, using default VIC')
      }
    }

    detectLocation()
  }, [])

  // Fetch grid data
  useEffect(() => {
    const fetchGridData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/grid?state=${currentState}`)

        if (!response.ok) {
          throw new Error('Failed to fetch grid data')
        }

        const data = await response.json()
        setGridData(data)
        setLastUpdated(new Date())
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchGridData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchGridData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [currentState])

  // Fetch weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!detectedLocation?.coordinates) return

      try {
        setWeatherLoading(true)
        const response = await fetch(`/api/solar?lat=${detectedLocation.coordinates.lat}&lng=${detectedLocation.coordinates.lng}`)

        if (!response.ok) {
          throw new Error('Failed to fetch weather data')
        }

        const data = await response.json()
        setWeatherData(data)
      } catch (err) {
        console.error('Weather data fetch failed:', err)
      } finally {
        setWeatherLoading(false)
      }
    }

    if (detectedLocation) {
      fetchWeatherData()
      // Refresh weather every 15 minutes
      const weatherInterval = setInterval(fetchWeatherData, 15 * 60 * 1000)
      return () => clearInterval(weatherInterval)
    }
  }, [detectedLocation])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'charge':
        return <Battery className="w-5 h-5 text-battery-green" />
      case 'discharge':
        return <Zap className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getWeatherIcon = (cloudCover: number, uvIndex: number) => {
    if (cloudCover < 20 && uvIndex > 3) return <Sun className="w-5 h-5 text-yellow-500" />
    if (cloudCover < 50) return <Sun className="w-5 h-5 text-yellow-400" />
    return <Cloud className="w-5 h-5 text-gray-500" />
  }

  if (loading && !gridData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl">
          <div className="mb-4 flex justify-center">
            <BatteryIQLogo size={64} animated={true} clickable={false} />
          </div>
          <p className="text-serious-gray font-body text-center">Loading grid dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <BatteryIQLogo
            size={32}
            animated={false}
            clickable={true}
            showText={true}
          />
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-serious-gray hover:text-battery-green font-medium transition-colors">
              Home
            </Link>
            <Link href="/calculator" className="text-serious-gray hover:text-battery-green font-medium transition-colors">
              Calculator
            </Link>
            <span className="text-sm text-serious-gray">Grid Dashboard</span>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-midnight-blue mb-2">
            Live Australian Grid Dashboard
          </h1>
          {detectedLocation && (
            <div className="flex items-center justify-center space-x-2 text-lg text-serious-gray">
              <MapPin className="w-5 h-5" />
              <span>{detectedLocation.city}, {detectedLocation.state}</span>
            </div>
          )}
          <p className="text-serious-gray mt-2">
            Real-time electricity grid data, weather conditions, and battery optimization insights
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">Failed to load data: {error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Grid Status Panel */}
          {gridData && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-battery-green/10 rounded-lg">
                    <Leaf className="w-6 h-6 text-battery-green" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-midnight-blue">
                      {gridData.region} Grid Status
                    </h2>
                    <p className="text-serious-gray">Live data from AEMO</p>
                  </div>
                </div>
                {lastUpdated && (
                  <p className="text-sm text-gray-400">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-battery-green">
                    {gridData.renewableShare}%
                  </p>
                  <p className="text-sm text-gray-600">Renewable</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {gridData.carbonIntensity}
                  </p>
                  <p className="text-sm text-gray-600">kg CO₂/MWh</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    ${gridData.price}
                  </p>
                  <p className="text-sm text-gray-600">per MWh</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(gridData.totalDemand)}
                  </p>
                  <p className="text-sm text-gray-600">MW Demand</p>
                </div>
              </div>

              {/* Generation Mix Pie Chart */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Generation Mix ({Math.round(gridData.totalDemand)} MW)
                </h3>
                <div className="flex justify-center">
                  <PieChart
                    data={Object.entries(gridData.fueltechBreakdown)
                      .filter(([_, value]) => value > 0)
                      .map(([fuel, mw]) => ({
                        label: fuel,
                        value: mw,
                        mw: Math.round(mw),
                        color: {
                          coal: '#374151',      // gray-700
                          gas: '#3B82F6',       // blue-500
                          wind: '#10B981',      // emerald-500
                          solar: '#F59E0B',     // amber-500
                          hydro: '#06B6D4',     // cyan-500
                          battery: '#8B5CF6',   // violet-500
                          other: '#6B7280'      // gray-500
                        }[fuel] || '#9CA3AF'
                      }))}
                    size={280}
                    className="mx-auto"
                  />
                </div>
              </div>

              {/* Battery Recommendation */}
              <div className={`p-4 rounded-lg border-l-4 ${
                gridData.recommendation.action === 'charge'
                  ? 'bg-battery-green/10 border-battery-green'
                  : gridData.recommendation.action === 'discharge'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-gray-50 border-gray-500'
              }`}>
                <div className="flex items-center space-x-3">
                  {getActionIcon(gridData.recommendation.action)}
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {gridData.recommendation.action} Battery Now
                    </p>
                    <p className="text-sm text-gray-600">
                      {gridData.recommendation.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weather & Solar Conditions Panel */}
          <div className="space-y-6">
            {weatherData && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    {getWeatherIcon(weatherData.current.cloudCover, weatherData.current.uvIndex)}
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-midnight-blue">
                      Solar Conditions
                    </h3>
                    <p className="text-serious-gray">Live BOM weather data</p>
                  </div>
                </div>

                {/* Current Weather */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {weatherData.current.temperature}°C
                        </p>
                        <p className="text-xs text-gray-500">Temperature</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Cloud className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {weatherData.current.cloudCover}%
                        </p>
                        <p className="text-xs text-gray-500">Cloud Cover</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Sun className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {weatherData.current.uvIndex}
                        </p>
                        <p className="text-xs text-gray-500">UV Index</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Wind className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {weatherData.current.windSpeed} km/h
                        </p>
                        <p className="text-xs text-gray-500">Wind Speed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solar Performance */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Solar Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Solar Irradiance</span>
                      <span className="text-sm font-medium">{weatherData.current.solarIrradiance} W/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Generation Efficiency</span>
                      <span className="text-sm font-medium">{weatherData.solar.efficiency}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Peak Sun Hours Today</span>
                      <span className="text-sm font-medium">{weatherData.solar.peakSunHours}h</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-700">{weatherData.solar.recommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {weatherLoading && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/calculator"
                  className="block w-full bg-battery-green hover:bg-battery-green/90 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors"
                >
                  Calculate My Battery Savings
                </Link>
                <button className="w-full border-2 border-battery-green text-battery-green hover:bg-battery-green hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
                  Set Price Alerts
                </button>
                <button className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors">
                  Historical Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}