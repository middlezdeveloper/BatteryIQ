'use client'

interface Plan {
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
  peakTimes?: any[]
  shoulderTimes?: any[]
  offPeakTimes?: any[]
  feedInTariff: number | null
  hasBatteryIncentive: boolean
  batteryIncentiveValue: number | null
  hasVPP: boolean
  vppCreditPerYear: number | null
  payOnTimeDiscount: number | null
  directDebitDiscount: number | null
  connectionFee?: number | null
  disconnectionFee?: number | null
  latePaymentFee?: number | null
  paperBillFee?: number | null
  contractLength: number | null
  exitFees?: number | null
  greenPower: boolean
  carbonNeutral: boolean
  isEVFriendly?: boolean
}

interface PlanComparisonProps {
  plans: Plan[]
  onRemovePlan?: (planId: string) => void
}

export default function PlanComparison({ plans, onRemovePlan }: PlanComparisonProps) {
  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <p className="text-xl text-serious-gray">
          Select 2-3 plans to compare side by side
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-battery-green/10 to-money-green/10">
              <th className="p-4 text-left font-heading font-bold text-midnight-blue border-r">
                Compare Plans
              </th>
              {plans.map((plan) => (
                <th key={plan.id} className="p-4 text-center border-r last:border-r-0 min-w-[250px]">
                  <div className="space-y-2">
                    <div className="font-heading font-bold text-midnight-blue text-lg">
                      {plan.retailerName}
                    </div>
                    <div className="text-sm text-serious-gray font-normal">
                      {plan.planName}
                    </div>
                    {onRemovePlan && (
                      <button
                        onClick={() => onRemovePlan(plan.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Supply Charge */}
            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                Daily Supply Charge
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  <span className="font-bold text-midnight-blue">
                    {plan.dailySupplyCharge.toFixed(2)}¢/day
                  </span>
                </td>
              ))}
            </tr>

            {/* Tariff Type */}
            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                Tariff Type
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  <span className="text-midnight-blue">{plan.tariffType}</span>
                </td>
              ))}
            </tr>

            {/* Single Rate (if applicable) */}
            {plans.some(p => p.singleRate !== null) && (
              <tr className="border-t">
                <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                  Usage Rate
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                    {plan.singleRate !== null ? (
                      <span className="font-bold text-midnight-blue">
                        {plan.singleRate.toFixed(2)}¢/kWh
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* Time of Use Rates */}
            {plans.some(p => p.peakRate !== null || p.shoulderRate !== null || p.offPeakRate !== null) && (
              <>
                <tr className="border-t bg-gray-100">
                  <td className="p-4 font-bold text-midnight-blue border-r" colSpan={plans.length + 1}>
                    Time of Use Rates
                  </td>
                </tr>
                {plans.some(p => p.peakRate !== null) && (
                  <tr className="border-t">
                    <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                      Peak Rate
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                        {plan.peakRate !== null ? (
                          <span className="font-bold text-red-600">
                            {plan.peakRate.toFixed(2)}¢/kWh
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
                {plans.some(p => p.shoulderRate !== null) && (
                  <tr className="border-t">
                    <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                      Shoulder Rate
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                        {plan.shoulderRate !== null ? (
                          <span className="font-bold text-orange-600">
                            {plan.shoulderRate.toFixed(2)}¢/kWh
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
                {plans.some(p => p.offPeakRate !== null) && (
                  <tr className="border-t">
                    <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                      Off-Peak Rate
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                        {plan.offPeakRate !== null ? (
                          <span className="font-bold text-green-600">
                            {plan.offPeakRate.toFixed(2)}¢/kWh
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
              </>
            )}

            {/* Solar & Battery */}
            <tr className="border-t bg-gray-100">
              <td className="p-4 font-bold text-midnight-blue border-r" colSpan={plans.length + 1}>
                Solar & Battery Benefits
              </td>
            </tr>

            {/* Feed-in Tariff */}
            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                ☀️ Solar Feed-in Tariff
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.feedInTariff !== null ? (
                    <span className="font-bold text-battery-green">
                      {plan.feedInTariff.toFixed(2)}¢/kWh
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Battery Incentive */}
            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                🔋 Battery Incentive
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.hasBatteryIncentive ? (
                    <div>
                      <span className="font-bold text-money-green">✓ Yes</span>
                      {plan.batteryIncentiveValue !== null && (
                        <div className="text-sm text-serious-gray">
                          ${plan.batteryIncentiveValue}/year
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">✗ No</span>
                  )}
                </td>
              ))}
            </tr>

            {/* VPP */}
            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                ⚡ VPP Program
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.hasVPP ? (
                    <div>
                      <span className="font-bold text-electric-yellow">✓ Yes</span>
                      {plan.vppCreditPerYear !== null && (
                        <div className="text-sm text-serious-gray">
                          ${plan.vppCreditPerYear}/year
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">✗ No</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Discounts */}
            <tr className="border-t bg-gray-100">
              <td className="p-4 font-bold text-midnight-blue border-r" colSpan={plans.length + 1}>
                Discounts & Incentives
              </td>
            </tr>

            {/* Pay on Time */}
            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                Pay on Time Discount
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.payOnTimeDiscount !== null ? (
                    <span className="font-bold text-green-600">
                      {plan.payOnTimeDiscount}% off
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Direct Debit */}
            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                Direct Debit Discount
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.directDebitDiscount !== null ? (
                    <span className="font-bold text-green-600">
                      {plan.directDebitDiscount}% off
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Contract Terms */}
            <tr className="border-t bg-gray-100">
              <td className="p-4 font-bold text-midnight-blue border-r" colSpan={plans.length + 1}>
                Contract Terms
              </td>
            </tr>

            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                Contract Length
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.contractLength !== null ? (
                    <span className="text-midnight-blue">
                      {plan.contractLength === 0 ? 'No lock-in' : `${plan.contractLength} months`}
                    </span>
                  ) : (
                    <span className="text-gray-400">Unknown</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Environmental */}
            <tr className="border-t bg-gray-100">
              <td className="p-4 font-bold text-midnight-blue border-r" colSpan={plans.length + 1}>
                Environmental
              </td>
            </tr>

            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                🌱 Green Power
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.greenPower ? (
                    <span className="font-bold text-green-600">✓ Available</span>
                  ) : (
                    <span className="text-gray-400">✗ No</span>
                  )}
                </td>
              ))}
            </tr>

            <tr className="border-t">
              <td className="p-4 font-semibold text-serious-gray bg-gray-50 border-r">
                🌍 Carbon Neutral
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center border-r last:border-r-0">
                  {plan.carbonNeutral ? (
                    <span className="font-bold text-green-600">✓ Yes</span>
                  ) : (
                    <span className="text-gray-400">✗ No</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
