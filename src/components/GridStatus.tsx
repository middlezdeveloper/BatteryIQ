'use client'

import { useState, useEffect } from 'react'
import { Battery, Zap, Leaf, AlertTriangle, MapPin } from 'lucide-react'
import PieChart from '@/components/ui/PieChart'

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

interface GridStatusProps {
  state?: string
  compact?: boolean
  autoDetectLocation?: boolean
}

interface LocationData {
  state: string
  city: string
  region: string
}

export default function GridStatus({
  state,
  compact = false,
  autoDetectLocation = true
}: GridStatusProps) {
  const [gridData, setGridData] = useState<GridMixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null)
  const [currentState, setCurrentState] = useState<string>(state || 'VIC')

  // Detect user location on mount
  useEffect(() => {
    const detectLocation = async () => {
      if (!autoDetectLocation || state) {
        // Skip detection if autoDetect is disabled or state is explicitly provided
        return
      }

      try {
        const response = await fetch('/api/location')
        if (response.ok) {
          const locationData = await response.json()
          if (locationData.success && locationData.isAustralian) {
            setDetectedLocation({
              state: locationData.location.state,
              city: locationData.location.city,
              region: locationData.location.region
            })
            setCurrentState(locationData.location.state)
          }
        }
      } catch (err) {
        console.log('Location detection failed, using default VIC')
      }
    }

    detectLocation()
  }, [autoDetectLocation, state])

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'charge':
        return <Battery className="w-4 h-4 text-battery-green" />
      case 'discharge':
        return <Zap className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string, priority: string) => {
    if (action === 'charge') return 'text-battery-green bg-battery-green/10'
    if (action === 'discharge' && priority === 'high') return 'text-red-600 bg-red-50'
    if (action === 'discharge') return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${compact ? 'p-3' : 'p-4'} bg-gray-50 rounded-lg`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (error || !gridData) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-red-50 border border-red-200 rounded-lg`}>
        <p className="text-red-700 text-sm">
          Failed to load grid data: {error}
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getActionIcon(gridData.recommendation.action)}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {gridData.region} Grid
              </p>
              <p className="text-xs text-gray-500">
                {gridData.renewableShare}% renewable
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              ${gridData.price}/MWh
            </p>
            <p className={`text-xs px-2 py-1 rounded ${getActionColor(
              gridData.recommendation.action,
              gridData.recommendation.priority
            )}`}>
              {gridData.recommendation.action}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-battery-green/10 rounded-lg">
            <Leaf className="w-5 h-5 text-battery-green" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {gridData.region} Grid Status
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Live data from AEMO</span>
              {detectedLocation && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>Detected: {detectedLocation.city}, {detectedLocation.state}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-battery-green">
            {gridData.renewableShare}%
          </p>
          <p className="text-xs text-gray-600">Renewable</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {gridData.carbonIntensity}
          </p>
          <p className="text-xs text-gray-600">kg CO₂/MWh</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            ${gridData.price}
          </p>
          <p className="text-xs text-gray-600">per MWh</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(gridData.totalDemand)}
          </p>
          <p className="text-xs text-gray-600">MW Demand</p>
        </div>
      </div>

      {/* Recommendation */}
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
            <p className="font-medium text-gray-900 capitalize">
              {gridData.recommendation.action} Battery
            </p>
            <p className="text-sm text-gray-600">
              {gridData.recommendation.message}
            </p>
          </div>
        </div>
      </div>

      {/* Generation Mix - Pie Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">
          Generation Mix ({Math.round(gridData.totalDemand)} MW)
        </h4>
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
            size={240}
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  )
}