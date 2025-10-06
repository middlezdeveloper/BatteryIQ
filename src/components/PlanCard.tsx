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
    distributors?: string[]
    eligibilityCriteria?: Array<{
      type: string
      description: string
      information?: string
    }>
    tariffPeriods?: Array<{
      name: string
      type: string
      price: number
      timeWindows: any
      sequenceOrder: number
    }>
    // New ROI-relevant fields
    discounts?: Array<{
      type: string
      category?: string
      displayName: string
      description?: string
      methodUType?: string
      percentOfBill?: number
      fixedAmount?: number
      percentOfUse?: number
    }>
    incentives?: Array<{
      category: string
      displayName: string
      description?: string
      eligibility?: string
    }>
    fees?: Array<{
      type: string
      term: string
      amount?: number
      rate?: number
      description?: string
    }>
    coolingOffDays?: number | null
    billFrequency?: string | null
    paymentOptions?: Array<string | {
      paymentInstrumentType: string
      detail?: string
    }>
    onExpiryDescription?: string | null
    variationTerms?: string | null
    greenPowerDetails?: Array<{
      type: string
      scheme: string
      displayName: string
      description?: string
      tiers?: Array<{
        percentGreen: number
        rate: number
      }>
    }>
    controlledLoads?: Array<{
      displayName: string
      rateBlockUType: string
      startDate?: string
      endDate?: string
      dailySupplyCharges?: number
      rates?: Array<{
        unitPrice: number
        volume?: number
      }>
    }>
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
              {plan.dailySupplyCharge ? `$${plan.dailySupplyCharge.toFixed(2)}/day` : 'N/A'}
            </span>
          </div>

          {/* Usage Rates */}
          {plan.tariffType === 'FLAT' && plan.singleRate !== null && (
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-serious-gray">Usage Rate</span>
              <span className="font-bold text-midnight-blue">
                ${plan.singleRate.toFixed(2)}/kWh
              </span>
            </div>
          )}

          {plan.tariffType === 'TIME_OF_USE' && plan.tariffPeriods && plan.tariffPeriods.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-serious-gray mb-2">Time of Use Rates</div>
              {plan.tariffPeriods.map((period, index) => {
                // Determine color based on type
                const colorClass = period.type === 'PEAK' ? 'text-red-600' :
                                   period.type === 'SHOULDER' ? 'text-orange-600' :
                                   'text-green-600'

                // Format time windows
                const formatTimeWindows = (windows: any) => {
                  if (!Array.isArray(windows) || windows.length === 0) return ''
                  return windows.map((w: any) => {
                    const days = Array.isArray(w.days) ? w.days.join(', ') : 'All days'
                    return `${w.startTime}-${w.endTime}`
                  }).join(', ')
                }

                return (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-serious-gray">{period.name}</span>
                      <span className={`font-semibold ${colorClass}`}>
                        ${period.price.toFixed(2)}/kWh
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeWindows(period.timeWindows)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : plan.tariffType === 'TIME_OF_USE' && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-serious-gray mb-2">Time of Use Rates</div>
              {plan.peakRate !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-serious-gray">Peak</span>
                  <span className="font-semibold text-red-600">
                    ${plan.peakRate.toFixed(2)}/kWh
                  </span>
                </div>
              )}
              {plan.shoulderRate !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-serious-gray">Shoulder</span>
                  <span className="font-semibold text-orange-600">
                    ${plan.shoulderRate.toFixed(2)}/kWh
                  </span>
                </div>
              )}
              {plan.offPeakRate !== null && (
                <div className="flex justify-between items-center text-sm pb-3 border-b">
                  <span className="text-serious-gray">Off-Peak</span>
                  <span className="font-semibold text-green-600">
                    ${plan.offPeakRate.toFixed(2)}/kWh
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Solar Feed-in Tariff - Always show */}
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-serious-gray">☀️ Solar Feed-in</span>
            <span className="font-bold text-battery-green">
              {plan.feedInTariff !== null && plan.feedInTariff !== undefined
                ? `$${plan.feedInTariff.toFixed(2)}/kWh`
                : 'N/A'}
            </span>
          </div>

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
            <div className="text-xs text-gray-500 italic mb-3">
              All prices inc. GST
            </div>
            <div className="flex justify-between">
              <span className="text-serious-gray">Tariff Type</span>
              <span className="text-midnight-blue font-medium">{plan.tariffType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-serious-gray">State</span>
              <span className="text-midnight-blue font-medium">{plan.state}</span>
            </div>
            {plan.distributors && plan.distributors.length > 0 && (
              <div className="flex justify-between">
                <span className="text-serious-gray">Distributors</span>
                <span className="text-midnight-blue font-medium">{plan.distributors.join(', ')}</span>
              </div>
            )}
            {plan.eligibilityCriteria && plan.eligibilityCriteria.length > 0 && (
              <div className="space-y-1">
                <span className="text-serious-gray text-xs">Eligibility Requirements:</span>
                {plan.eligibilityCriteria.map((criteria, index) => (
                  <div key={index} className="text-xs text-orange-600 font-medium">
                    ⚠️ {criteria.description || criteria.information}
                  </div>
                ))}
              </div>
            )}
            {plan.carbonNeutral && (
              <div className="flex justify-between">
                <span className="text-serious-gray">Carbon Neutral</span>
                <span className="text-green-600 font-medium">✓ Yes</span>
              </div>
            )}

            {/* Full Discounts Details */}
            {plan.discounts && plan.discounts.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <div className="text-sm font-semibold text-green-800">💰 All Discounts</div>
                {plan.discounts.map((discount, index) => (
                  <div key={index} className="bg-green-50 rounded p-2">
                    <div className="text-sm font-medium text-green-700">{discount.displayName}</div>
                    {discount.percentOfBill && (
                      <div className="text-xs text-green-600">
                        {discount.percentOfBill}% off total bill
                      </div>
                    )}
                    {discount.fixedAmount && (
                      <div className="text-xs text-green-600">
                        ${discount.fixedAmount} discount
                      </div>
                    )}
                    {discount.description && (
                      <div className="text-xs text-gray-600 mt-1">{discount.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Incentives */}
            {plan.incentives && plan.incentives.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <div className="text-sm font-semibold text-blue-800">🎁 Incentives</div>
                {plan.incentives.map((incentive, index) => (
                  <div key={index} className="bg-blue-50 rounded p-2">
                    <div className="text-sm font-medium text-blue-700">{incentive.displayName}</div>
                    {incentive.description && (
                      <div className="text-xs text-gray-600 mt-1">{incentive.description}</div>
                    )}
                    {incentive.eligibility && (
                      <div className="text-xs text-blue-600 mt-1">Eligibility: {incentive.eligibility}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Fees */}
            {plan.fees && plan.fees.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <div className="text-sm font-semibold text-orange-800">⚠️ Fees</div>
                {plan.fees.map((fee, index) => (
                  <div key={index} className="text-xs text-gray-700">
                    <span className="font-medium">{fee.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}:</span>{' '}
                    {fee.amount ? `$${fee.amount}` : fee.rate ? `${fee.rate}%` : 'See details'}
                    {fee.description && ` - ${fee.description}`}
                  </div>
                ))}
              </div>
            )}

            {/* Contract Terms */}
            {(plan.coolingOffDays || plan.billFrequency || plan.onExpiryDescription || plan.variationTerms) && (
              <div className="space-y-2 pt-3 border-t">
                <div className="text-sm font-semibold text-midnight-blue">📋 Contract Terms</div>
                {plan.coolingOffDays && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Cooling off period:</span> {plan.coolingOffDays} days
                  </div>
                )}
                {plan.billFrequency && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Bill frequency:</span> {plan.billFrequency === 'P1M' ? 'Monthly' : plan.billFrequency === 'P3M' ? 'Quarterly' : plan.billFrequency}
                  </div>
                )}
                {plan.onExpiryDescription && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">On expiry:</span> {plan.onExpiryDescription}
                  </div>
                )}
                {plan.variationTerms && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Rate variations:</span> {plan.variationTerms}
                  </div>
                )}
              </div>
            )}

            {/* Payment Options */}
            {plan.paymentOptions && plan.paymentOptions.length > 0 && (
              <div className="space-y-1 pt-3 border-t">
                <div className="text-sm font-semibold text-midnight-blue">💳 Payment Options</div>
                <div className="text-xs text-gray-700">
                  {plan.paymentOptions.map(opt => typeof opt === 'string' ? opt.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : opt.paymentInstrumentType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).join(', ')}
                </div>
              </div>
            )}

            {/* Green Power Details */}
            {plan.greenPowerDetails && plan.greenPowerDetails.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <div className="text-sm font-semibold text-green-800">🌱 Green Power Options</div>
                {plan.greenPowerDetails.map((gp, index) => (
                  <div key={index} className="bg-green-50 rounded p-2">
                    <div className="text-sm font-medium text-green-700">{gp.displayName}</div>
                    {gp.description && (
                      <div className="text-xs text-gray-600 mt-1">{gp.description}</div>
                    )}
                    {gp.tiers && gp.tiers.length > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        {gp.tiers.map((tier, tidx) => (
                          <div key={tidx}>{tier.percentGreen}% green: +${tier.rate}/kWh</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Controlled Loads */}
            {plan.controlledLoads && plan.controlledLoads.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <div className="text-sm font-semibold text-midnight-blue">🔌 Controlled Loads</div>
                {plan.controlledLoads.map((cl, index) => (
                  <div key={index} className="text-xs text-gray-700">
                    <span className="font-medium">{cl.displayName}:</span>{' '}
                    {cl.rates && cl.rates.length > 0 && `$${cl.rates[0].unitPrice}/kWh`}
                    {cl.dailySupplyCharges && ` + $${cl.dailySupplyCharges}/day supply`}
                  </div>
                ))}
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
