'use client'

import { useState, useEffect } from 'react'
import { Battery, Zap, Leaf, AlertTriangle } from 'lucide-react'

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
}

export default function GridStatus({ state = 'NSW', compact = false }: GridStatusProps) {
  const [gridData, setGridData] = useState<GridMixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchGridData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/grid?state=${state}`)

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
  }, [state])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'charge':
        return <Battery className="w-4 h-4 text-batteryGreen-600" />
      case 'discharge':
        return <Zap className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string, priority: string) => {
    if (action === 'charge') return 'text-batteryGreen-600 bg-batteryGreen-50'
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
          <div className="p-2 bg-batteryGreen-100 rounded-lg">
            <Leaf className="w-5 h-5 text-batteryGreen-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {gridData.region} Grid Status
            </h3>
            <p className="text-sm text-gray-500">
              Live data from AEMO
            </p>
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
          <p className="text-2xl font-bold text-batteryGreen-600">
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
          ? 'bg-batteryGreen-50 border-batteryGreen-500'
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

      {/* Generation Mix */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Generation Mix ({Math.round(gridData.totalDemand)} MW)
        </h4>
        <div className="space-y-2">
          {Object.entries(gridData.fueltechBreakdown)
            .filter(([_, value]) => value > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([fuel, mw]) => {
              const percentage = (mw / gridData.totalDemand) * 100
              const color = {
                coal: 'bg-gray-800',
                gas: 'bg-blue-500',
                wind: 'bg-green-500',
                solar: 'bg-yellow-500',
                hydro: 'bg-blue-300',
                battery: 'bg-purple-500',
                other: 'bg-gray-400'
              }[fuel] || 'bg-gray-300'

              return (
                <div key={fuel} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600">{fuel}</span>
                      <span className="text-gray-500">
                        {mw} MW ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}