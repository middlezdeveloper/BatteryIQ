'use client'

import { useState } from 'react'

interface PieChartData {
  label: string
  value: number
  color: string
  mw: number
}

interface PieChartProps {
  data: PieChartData[]
  size?: number
  showTooltip?: boolean
  className?: string
}

export default function PieChart({
  data,
  size = 200,
  showTooltip = true,
  className = ''
}: PieChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)

  // Calculate total and angles
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = size / 2 - 10 // Account for padding
  const centerX = size / 2
  const centerY = size / 2

  // Create path data for each slice
  let currentAngle = -90 // Start at top
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = (item.value / total) * 360

    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    // Convert to radians
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    // Calculate arc coordinates
    const largeArcFlag = angle > 180 ? 1 : 0

    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    currentAngle += angle

    return {
      ...item,
      pathData,
      percentage,
      angle,
      index
    }
  })

  const hoveredData = hoveredSlice !== null ? slices[hoveredSlice] : null

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="drop-shadow-sm">
        {slices.map((slice) => (
          <path
            key={slice.index}
            d={slice.pathData}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
            className={`transition-all duration-200 cursor-pointer ${
              hoveredSlice === slice.index ? 'opacity-90 drop-shadow-md' : 'opacity-80'
            }`}
            onMouseEnter={() => setHoveredSlice(slice.index)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredData && (
        <div className="absolute top-2 left-2 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: hoveredData.color }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {hoveredData.label}
              </p>
              <p className="text-xs text-gray-600">
                {hoveredData.mw} MW ({hoveredData.percentage.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {slices
          .filter(slice => slice.percentage >= 1) // Only show significant sources
          .sort((a, b) => b.percentage - a.percentage)
          .map((slice) => (
            <div
              key={slice.index}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              onMouseEnter={() => setHoveredSlice(slice.index)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 capitalize truncate">{slice.label}</p>
                <p className="text-gray-500">{slice.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}