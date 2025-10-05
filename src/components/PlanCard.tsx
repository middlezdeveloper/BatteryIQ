'use client'

import { useState } from 'react'

interface PlanCardProps {
  plan: {
    id: string
    retailerName: string
    planName: string
    state: string
    tariffType: string
    dailySupplyCharge: number
    singleRate: number | null
    peakRate: number | null
    shoulderRate: number | null
    offPeakRate: number | null
    feedInTariff: number | null
    hasBatteryIncentive: boolean
    batteryIncentiveValue: number | null
    hasVPP: boolean
    vppCreditPerYear: number | null
    payOnTimeDiscount: number | null
    directDebitDiscount: number | null
    contractLength: number | null
    greenPower: boolean
    carbonNeutral: boolean
  }
}

export default function PlanCard({ plan }: PlanCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-battery-green/10 to-money-green/10 p-6 border-b">
        <h3 className="text-xl font-heading font-bold text-midnight-blue mb-1">
          {plan.retailerName}
        </h3>
        <p className="text-serious-gray font-medium">{plan.planName}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {plan.hasBatteryIncentive && (
            <span className="px-3 py-1 bg-money-green text-white text-xs font-semibold rounded-full">
              🔋 Battery Incentive
            </span>
          )}
          {plan.hasVPP && (
            <span className="px-3 py-1 bg-electric-yellow text-midnight-blue text-xs font-semibold rounded-full">
              ⚡ VPP
            </span>
          )}
          {plan.greenPower && (
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              🌱 Green
            </span>
          )}
        </div>
      </div>

      {/* Key Details */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Supply Charge */}
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-serious-gray">Daily Supply Charge</span>
            <span className="font-bold text-midnight-blue">
              {plan.dailySupplyCharge ? `${plan.dailySupplyCharge.toFixed(2)}¢/day` : 'N/A'}
            </span>
          </div>

          {/* Usage Rates */}
          {plan.tariffType === 'FLAT' && plan.singleRate !== null && (
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-serious-gray">Usage Rate</span>
              <span className="font-bold text-midnight-blue">
                {plan.singleRate.toFixed(2)}¢/kWh
              </span>
            </div>
          )}

          {plan.tariffType === 'TIME_OF_USE' && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-serious-gray mb-2">Time of Use Rates</div>
              {plan.peakRate !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-serious-gray">Peak</span>
                  <span className="font-semibold text-red-600">
                    {plan.peakRate.toFixed(2)}¢/kWh
                  </span>
                </div>
              )}
              {plan.shoulderRate !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-serious-gray">Shoulder</span>
                  <span className="font-semibold text-orange-600">
                    {plan.shoulderRate.toFixed(2)}¢/kWh
                  </span>
                </div>
              )}
              {plan.offPeakRate !== null && (
                <div className="flex justify-between items-center text-sm pb-3 border-b">
                  <span className="text-serious-gray">Off-Peak</span>
                  <span className="font-semibold text-green-600">
                    {plan.offPeakRate.toFixed(2)}¢/kWh
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Solar Feed-in Tariff */}
          {plan.feedInTariff !== null && (
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-serious-gray">☀️ Solar Feed-in</span>
              <span className="font-bold text-battery-green">
                {plan.feedInTariff.toFixed(2)}¢/kWh
              </span>
            </div>
          )}

          {/* Battery Incentive */}
          {plan.hasBatteryIncentive && plan.batteryIncentiveValue !== null && (
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-serious-gray">🔋 Battery Credit</span>
              <span className="font-bold text-money-green">
                ${plan.batteryIncentiveValue}/year
              </span>
            </div>
          )}

          {/* VPP Credit */}
          {plan.hasVPP && plan.vppCreditPerYear !== null && (
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-serious-gray">⚡ VPP Credit</span>
              <span className="font-bold text-electric-yellow">
                ${plan.vppCreditPerYear}/year
              </span>
            </div>
          )}

          {/* Discounts */}
          {(plan.payOnTimeDiscount || plan.directDebitDiscount) && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm font-semibold text-green-800 mb-2">💰 Available Discounts</div>
              {plan.payOnTimeDiscount && (
                <div className="text-sm text-green-700">
                  • Pay on time: {plan.payOnTimeDiscount}% off
                </div>
              )}
              {plan.directDebitDiscount && (
                <div className="text-sm text-green-700">
                  • Direct debit: {plan.directDebitDiscount}% off
                </div>
              )}
            </div>
          )}

          {/* Contract */}
          {plan.contractLength !== null && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-serious-gray">Contract Length</span>
              <span className="text-midnight-blue">
                {plan.contractLength === 0 ? 'No lock-in' : `${plan.contractLength} months`}
              </span>
            </div>
          )}
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-6 text-battery-green font-semibold text-sm hover:text-battery-green/80 transition-colors"
        >
          {showDetails ? '▲ Hide Details' : '▼ Show More Details'}
        </button>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-serious-gray">Tariff Type</span>
              <span className="text-midnight-blue font-medium">{plan.tariffType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-serious-gray">State</span>
              <span className="text-midnight-blue font-medium">{plan.state}</span>
            </div>
            {plan.carbonNeutral && (
              <div className="flex justify-between">
                <span className="text-serious-gray">Carbon Neutral</span>
                <span className="text-green-600 font-medium">✓ Yes</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t">
        <button className="w-full bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90 text-white px-6 py-3 rounded-lg font-heading font-semibold transition-all">
          Select Plan
        </button>
      </div>
    </div>
  )
}
