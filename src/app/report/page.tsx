'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Battery, DollarSign, Leaf, Home, TrendingUp, Zap, Clock, Award, CheckCircle } from 'lucide-react'

// Calculation functions
const calculatePersonalizedReport = (userInfo: any) => {
  console.log('🔍 Debug userInfo:', userInfo) // Debug log

  const annualBill = (userInfo.quarterlyBill || 450) * 4
  const dailyUsage = annualBill / 365 / 0.30 // Estimate kWh/day from bill (assuming ~30c/kWh average)

  console.log('⚡ Usage estimate:', {
    annualBill,
    dailyUsage: Math.round(dailyUsage),
    annualUsage: Math.round(dailyUsage * 365)
  })

  // PROPER BATTERY SAVINGS CALCULATION
  // 1. Solar excess storage (if they have solar)
  let solarStorageSavings = 0
  if (userInfo.hasSolar && userInfo.solarCapacity) {
    // Solar generates ~4.2 kWh/kW/day average in Australia
    const dailySolarGen = userInfo.solarCapacity * 4.2
    // Assume 40% excess during day without battery, 80% self-consumption with battery
    const excessSolar = Math.min(dailySolarGen * 0.4, 13.5) // Battery capacity limit
    // Store at feed-in rate (~5c), use at peak rate (~45c) = 40c/kWh benefit
    solarStorageSavings = excessSolar * 365 * 0.40
    console.log('☀️ Solar storage savings:', Math.round(solarStorageSavings))
  }

  // 2. Time-of-use arbitrage (buy off-peak, use peak)
  let arbitrageSavings = 0
  if (userInfo.currentTariff === 'time-of-use') {
    // Off-peak ~22c, Peak ~45c = 23c/kWh arbitrage opportunity
    // Battery cycles ~70% of capacity daily for arbitrage
    const dailyArbitrage = 13.5 * 0.7 * 0.23 // kWh * efficiency * price differential
    arbitrageSavings = dailyArbitrage * 365
    console.log('🔄 Arbitrage savings:', Math.round(arbitrageSavings))
  }

  // 3. Peak avoidance savings
  // Replace peak consumption (6-9pm) with stored power
  const peakConsumption = Math.min(dailyUsage * 0.3, 13.5 * 0.8) // 30% usage during peak, limited by battery
  const peakAvoidanceSavings = peakConsumption * 365 * 0.20 // Save ~20c/kWh vs peak rates
  console.log('📈 Peak avoidance savings:', Math.round(peakAvoidanceSavings))

  // Total realistic savings
  const potentialSavings = Math.round(solarStorageSavings + arbitrageSavings + peakAvoidanceSavings)
  const federalRebate = Math.min(4650, userInfo.householdSize * 1550) // Up to $4650

  console.log('💰 Total calculated savings:', potentialSavings, 'vs old method:', Math.round(annualBill * 0.3))

  // State rebate based on postcode and income eligibility
  const postcode = String(userInfo.postcode || '')
  const firstDigit = postcode.charAt(0)
  console.log('🗺️ Full postcode:', postcode, 'First digit:', firstDigit)

  const stateName = firstDigit === '2' ? 'NSW' :
                   firstDigit === '3' ? 'VIC' :
                   firstDigit === '4' ? 'QLD' :
                   firstDigit === '5' ? 'SA' : 'Other'

  // Income-based state rebate eligibility
  const baseStateRebate = firstDigit === '2' ? 1600 : // NSW
                         firstDigit === '3' ? 1400 : // VIC
                         firstDigit === '4' ? 1200 : // QLD
                         firstDigit === '5' ? 1800 : // SA
                         1000 // Default

  // Check income eligibility for state rebates
  const stateIncomeThresholds: { [key: string]: number } = {
    'NSW': 180000,
    'VIC': 210000,
    'QLD': 180000,
    'SA': 0 // No income testing
  }

  const incomeThreshold = stateIncomeThresholds[stateName] || 180000
  const householdIncome = userInfo.householdIncome || 0

  let stateRebate = baseStateRebate
  let stateRebateEligible = true

  if (incomeThreshold > 0 && householdIncome > 0 && householdIncome !== 999999) {
    stateRebateEligible = householdIncome <= incomeThreshold
    if (!stateRebateEligible) {
      stateRebate = 0 // Not eligible for state rebate
    }
  }

  console.log('💰 State rebate analysis:', {
    state: stateName,
    baseAmount: baseStateRebate,
    incomeThreshold,
    userIncome: householdIncome,
    eligible: stateRebateEligible,
    finalRebate: stateRebate
  })

  const totalRebates = federalRebate + stateRebate

  // More realistic battery system pricing
  const batterySize = userInfo.householdSize <= 2 ? 10 :
                     userInfo.householdSize <= 4 ? 13.5 : 17

  // Base battery costs (realistic 2024 prices)
  const baseBatteryCost = batterySize <= 10 ? 12000 :
                         batterySize <= 13.5 ? 16000 : 20000

  // Installation complexity factors
  let installationCost = 3500 // Base installation

  // Solar integration cost (if they have existing solar)
  if (userInfo.hasSolar) {
    installationCost += 1200 // Additional solar integration work
  }

  // Location-based pricing (metro vs regional)
  const locationMultiplier = userInfo.postcode?.startsWith('2') && parseInt(userInfo.postcode) < 2500 ? 1.1 : // Sydney metro
                            userInfo.postcode?.startsWith('3') && parseInt(userInfo.postcode) < 3200 ? 1.05 : // Melbourne metro
                            userInfo.postcode?.startsWith('4') && parseInt(userInfo.postcode) < 4300 ? 1.0 : // Brisbane metro
                            0.95 // Regional discount

  const batterySystemCost = Math.round((baseBatteryCost + installationCost) * locationMultiplier)
  const netCost = batterySystemCost - totalRebates

  console.log('💰 Pricing breakdown:', {
    batterySize: `${batterySize}kWh`,
    baseBatteryCost,
    installationCost,
    locationMultiplier,
    totalSystemCost: batterySystemCost,
    netCost
  })
  const paybackYears = potentialSavings > 0 ? Math.round((netCost / potentialSavings) * 10) / 10 : 99

  // CO2 calculations
  const co2Reduction = Math.round(userInfo.householdSize * 2.4 * 10) / 10

  // Solar calculations if they have solar
  const solarGeneration = userInfo.hasSolar && userInfo.solarCapacity ?
    Math.round(userInfo.solarCapacity * 1400) : 0 // ~1400 kWh/kW in Australia
  const batteryBoost = userInfo.hasSolar && userInfo.solarCapacity ?
    Math.round(solarGeneration * 0.3) : 0 // 30% additional self-consumption

  // Battery model recommendations based on size
  const batteryRecommendations = batterySize <= 10 ? [
      { brand: 'Tesla Powerwall 2', capacity: '13.5kWh', price: '$15,500', warranty: '10 years', features: ['Weather resistant', 'Integrated inverter', 'Mobile app'] },
      { brand: 'Enphase IQ Battery 10', capacity: '10.08kWh', price: '$13,900', warranty: '15 years', features: ['Modular design', 'AC coupled', 'Storm guard'] },
      { brand: 'sonnenBatterie eco 9.53', capacity: '9.53kWh', price: '$14,200', warranty: '10 years', features: ['German engineering', 'Smart energy management', 'Grid services'] }
    ] : batterySize <= 13.5 ? [
      { brand: 'Tesla Powerwall 2', capacity: '13.5kWh', price: '$15,500', warranty: '10 years', features: ['Weather resistant', 'Integrated inverter', 'Mobile app'] },
      { brand: 'Alpha ESS SMILE5', capacity: '13.3kWh', price: '$16,800', warranty: '10 years', features: ['High efficiency', 'Stackable', 'Fire safe LiFePO4'] },
      { brand: 'BYD Battery-Box Premium HVS', capacity: '12.8kWh', price: '$14,900', warranty: '10 years', features: ['Scalable', 'High voltage', 'Proven technology'] }
    ] : [
      { brand: 'Tesla Powerwall 2 x2', capacity: '27kWh', price: '$31,000', warranty: '10 years', features: ['Weather resistant', 'Integrated inverter', 'Mobile app'] },
      { brand: 'Alpha ESS SMILE5 Stack', capacity: '19.95kWh', price: '$24,500', warranty: '10 years', features: ['High efficiency', 'Stackable', 'Fire safe LiFePO4'] },
      { brand: 'Redflow ZBM2', capacity: '20kWh', price: '$28,000', warranty: '10 years', features: ['Zinc bromide flow', '100% DoD', 'Fire safe'] }
    ]

  return {
    userInfo,
    calculations: {
      annualBill,
      dailyUsage: Math.round(dailyUsage),
      potentialSavings,
      solarStorageSavings: Math.round(solarStorageSavings),
      arbitrageSavings: Math.round(arbitrageSavings),
      peakAvoidanceSavings: Math.round(peakAvoidanceSavings),
      federalRebate,
      stateRebate,
      baseStateRebate,
      stateRebateEligible,
      stateName,
      totalRebates,
      netCost,
      paybackYears,
      co2Reduction,
      solarGeneration,
      batteryBoost,
      systemCost: batterySystemCost
    },
    recommendations: {
      batterySize: `${batterySize}kWh`,
      batteryModels: batteryRecommendations,
      bestTariff: userInfo.currentTariff === 'time-of-use' ?
        'Your current tariff is already optimal!' : 'Switch to Time-of-Use',
      switchSavings: userInfo.currentTariff === 'time-of-use' ? 0 : 200,
      installationTimeframe: '4-6 weeks'
    }
  }
}

// Default sample data for direct access
const defaultReportData = calculatePersonalizedReport({
  postcode: '2000',
  householdSize: 3,
  motivation: ['cost', 'environment'],
  currentProvider: 'AGL',
  hasSolar: true,
  quarterlyBill: 450,
  solarCapacity: 6.6,
  currentTariff: 'time-of-use',
  email: 'test@example.com'
})

function BatteryReportContent() {
  const [reportData, setReportData] = useState(defaultReportData)
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Try to get user data from URL parameters
    const dataParam = searchParams.get('data')
    if (dataParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(dataParam))
        const personalizedReport = calculatePersonalizedReport(userData)
        setReportData(personalizedReport)
      } catch (error) {
        console.error('Error parsing user data:', error)
        // Fall back to default data
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-batteryGreen-50 to-solarYellow-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-batteryGreen-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">⚡</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">BatteryIQ</span>
          </div>
          <span className="text-sm text-gray-600">Personal Battery Report</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Report Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Your Personalized Battery Report 🎯
            </h1>
            <p className="text-lg text-gray-600">
              Based on your {reportData.userInfo.postcode} location and energy usage
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6 bg-batteryGreen-50 rounded-xl">
              <div className="text-3xl font-bold text-batteryGreen-600">
                ${reportData.calculations.potentialSavings}
              </div>
              <div className="text-sm text-gray-600 mt-1">Annual Savings</div>
            </div>
            <div className="text-center p-6 bg-solarYellow-50 rounded-xl">
              <div className="text-3xl font-bold text-solarYellow-600">
                ${reportData.calculations.totalRebates}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Rebates</div>
              <div className="text-xs text-gray-500 mt-1">
                Federal: ${reportData.calculations.federalRebate} + {reportData.calculations.stateName}: ${reportData.calculations.stateRebate}
              </div>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <div className="text-3xl font-bold text-orange-600">
                {reportData.calculations.co2Reduction}t
              </div>
              <div className="text-sm text-gray-600 mt-1">CO₂ Reduction/Year</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">
                {reportData.calculations.paybackYears} years
              </div>
              <div className="text-sm text-gray-600 mt-1">Payback Period</div>
            </div>
          </div>

          {/* Federal Rebate Highlight */}
          <div className="bg-gradient-to-r from-solarYellow-100 to-batteryGreen-100 border-2 border-solarYellow-300 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-solarYellow-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">Federal Rebate Eligible: ${reportData.calculations.totalRebates}</h3>
            </div>
            <div className="text-center mb-4">
              <p className="text-lg text-gray-700 mb-2">
                <strong>${reportData.calculations.federalRebate}</strong> federal (✅ no income test) +
                {reportData.calculations.stateRebateEligible ? (
                  <strong className="text-green-600"> ${reportData.calculations.stateRebate}</strong>
                ) : (
                  <span>
                    <span className="line-through text-gray-400">${reportData.calculations.baseStateRebate}</span>
                    <strong className="text-orange-600"> $0</strong>
                  </span>
                )} {reportData.calculations.stateName} rebate
              </p>
              {reportData.calculations.stateRebateEligible ? (
                <p className="text-sm text-green-600 font-semibold">
                  ✅ Eligible for full state rebate based on income provided
                </p>
              ) : (
                <p className="text-sm text-orange-600 font-semibold">
                  ⚠️ May not qualify for state rebate based on income - but federal rebate still applies!
                </p>
              )}
            </div>

            {/* Eligibility Requirements */}
            <div className="bg-white rounded-lg p-4 text-left">
              <h4 className="font-bold text-gray-900 mb-3">📋 Key Eligibility Requirements:</h4>

              {/* Federal Requirements */}
              <div className="mb-3">
                <p className="font-semibold text-gray-700 mb-1">Federal Cheaper Home Batteries Program:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ✅ <strong>No income test</strong> - available to all income levels</li>
                  <li>• Installation date: Certificate of Electrical Safety on/after July 1, 2025</li>
                  <li>• Open to homeowners, small businesses, community facilities</li>
                  <li>• One rebate per property (with separate electricity meter)</li>
                  <li>• Applied as upfront discount by accredited installers</li>
                  <li>• Can be stacked with state/territory rebates</li>
                </ul>
              </div>

              {/* State Requirements */}
              <div className="mb-3">
                <p className="font-semibold text-gray-700 mb-1">{reportData.calculations.stateName} State Rebate:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {reportData.calculations.stateName === 'VIC' && (
                    <>
                      <li>• Household income under $210,000</li>
                      <li>• Property value under $3 million</li>
                      <li>• Existing solar system required</li>
                    </>
                  )}
                  {reportData.calculations.stateName === 'NSW' && (
                    <>
                      <li>• Combined household income under $180,000</li>
                      <li>• Property value under $3 million</li>
                      <li>• Peak demand rebate also available</li>
                    </>
                  )}
                  {reportData.calculations.stateName === 'SA' && (
                    <>
                      <li>• No income testing currently</li>
                      <li>• Must be owner-occupier</li>
                      <li>• Battery capacity 1-30kWh eligible</li>
                    </>
                  )}
                  {reportData.calculations.stateName === 'QLD' && (
                    <>
                      <li>• Income limits vary by scheme</li>
                      <li>• Property value restrictions apply</li>
                      <li>• Regional variations available</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="bg-blue-50 rounded p-3 mt-3">
                <p className="text-sm text-blue-700">
                  <strong>✅ Next Step:</strong> Our installer partners can help verify your eligibility and handle all rebate applications for you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Financial Analysis */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-batteryGreen-600" />
              Financial Analysis
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-gray-700">Current Annual Bill</span>
                  <p className="text-xs text-gray-500">Your total electricity costs per year</p>
                </div>
                <span className="font-semibold">${reportData.calculations.annualBill}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-batteryGreen-50 rounded-lg">
                <div>
                  <span className="text-gray-700">Total Annual Savings</span>
                  <p className="text-xs text-gray-500">All battery benefits combined</p>
                </div>
                <span className="font-semibold text-batteryGreen-600">-${reportData.calculations.potentialSavings}</span>
              </div>

              {reportData.calculations.solarStorageSavings > 0 && (
                <div className="flex justify-between items-center p-4 bg-solarYellow-50 rounded-lg">
                  <div>
                    <span className="text-gray-700">├ Solar Storage Value</span>
                    <p className="text-xs text-gray-500">Store excess solar instead of selling at 5c, use at 45c</p>
                  </div>
                  <span className="font-semibold text-solarYellow-600">${reportData.calculations.solarStorageSavings}</span>
                </div>
              )}

              {reportData.calculations.arbitrageSavings > 0 && (
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <span className="text-gray-700">├ Time-of-Use Arbitrage</span>
                    <p className="text-xs text-gray-500">Buy power at 22c off-peak, use during 45c peak</p>
                  </div>
                  <span className="font-semibold text-blue-600">${reportData.calculations.arbitrageSavings}</span>
                </div>
              )}

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <span className="text-gray-700">├ Peak Avoidance</span>
                  <p className="text-xs text-gray-500">Use stored power during expensive 6-9pm peak periods</p>
                </div>
                <span className="font-semibold text-green-600">${reportData.calculations.peakAvoidanceSavings}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <span className="text-gray-700">System Cost (after rebates)</span>
                  <p className="text-xs text-gray-500">Battery + installation - federal/state rebates</p>
                </div>
                <span className="font-semibold text-blue-600">${reportData.calculations.netCost}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-batteryGreen-50 to-solarYellow-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Time-of-Use Tariff Benefit</h3>
              <p className="text-sm text-gray-600">
                Your current {reportData.userInfo.currentTariff} tariff is perfect for battery arbitrage!
                Store cheap off-peak power and use it during expensive peak times.
              </p>
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Leaf className="w-6 h-6 mr-2 text-green-600" />
              Environmental Impact
            </h2>

            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {reportData.calculations.co2Reduction * 25}t
                </div>
                <div className="text-sm text-gray-600">Lifetime CO₂ Reduction</div>
                <div className="text-xs text-gray-500 mt-1">
                  Equivalent to planting {Math.round(reportData.calculations.co2Reduction * 25 * 16)} trees
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(reportData.calculations.co2Reduction * 2.4)}
                  </div>
                  <div className="text-xs text-gray-600">Cars off road/year</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(reportData.calculations.co2Reduction * 0.85)}%
                  </div>
                  <div className="text-xs text-gray-600">Household footprint reduction</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Solar + Battery Analysis */}
        {reportData.userInfo.hasSolar && reportData.userInfo.solarCapacity && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-solarYellow-600" />
              Your {reportData.userInfo.solarCapacity}kW Solar + Battery System
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-solarYellow-50 rounded-xl">
                <div className="text-3xl font-bold text-solarYellow-600">
                  {reportData.calculations.solarGeneration}
                </div>
                <div className="text-sm text-gray-600 mt-1">kWh Annual Solar Generation</div>
              </div>
              <div className="text-center p-6 bg-batteryGreen-50 rounded-xl">
                <div className="text-3xl font-bold text-batteryGreen-600">
                  +{reportData.calculations.batteryBoost}
                </div>
                <div className="text-sm text-gray-600 mt-1">kWh Additional Self-Consumption</div>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-3xl font-bold text-orange-600">
                  85%
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Self-Consumption Rate</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-solarYellow-50 to-batteryGreen-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Perfect Solar + Battery Match! 🔥</h3>
              <p className="text-sm text-gray-600">
                Your {reportData.userInfo.solarCapacity}kW system generates enough excess power to make battery storage highly profitable.
                You'll boost your solar self-consumption from ~55% to 85%!
              </p>
            </div>
          </div>
        )}

        {/* Battery Model Recommendations */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Battery className="w-6 h-6 mr-2 text-batteryGreen-600" />
            Recommended Battery Systems
          </h2>

          <div className="mb-6 p-4 bg-batteryGreen-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Best for your {reportData.userInfo.householdSize}-person household: {reportData.recommendations.batterySize}</h3>
            <p className="text-sm text-gray-600">
              Based on your usage patterns and home setup, here are our top 3 recommendations:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {reportData.recommendations.batteryModels?.map((battery, index) => (
              <div key={index} className={`border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                index === 0 ? 'border-batteryGreen-300 bg-batteryGreen-50' : 'border-gray-200 hover:border-batteryGreen-200'
              }`}>
                {index === 0 && (
                  <div className="bg-batteryGreen-600 text-white text-xs px-2 py-1 rounded-full w-fit mb-2">
                    RECOMMENDED
                  </div>
                )}
                <h3 className="font-bold text-gray-900 mb-1">{battery.brand}</h3>
                <p className="text-lg font-semibold text-batteryGreen-600 mb-2">{battery.capacity}</p>
                <p className="text-xl font-bold text-gray-900 mb-3">{battery.price}</p>
                <div className="text-xs text-gray-600 mb-3">
                  <p>Warranty: {battery.warranty}</p>
                </div>
                <div className="space-y-1">
                  {battery.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center text-xs text-gray-600">
                      <CheckCircle className="w-3 h-3 text-batteryGreen-500 mr-1" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Recommendations */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Installation & Setup Recommendations 🎯
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-solarYellow-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-solarYellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Tariff Optimization</h3>
                  <p className="text-sm text-gray-600">
                    {reportData.recommendations.bestTariff === 'Your current tariff is already optimal!'
                      ? reportData.recommendations.bestTariff
                      : `Switch to ${reportData.recommendations.bestTariff} for extra $${reportData.recommendations.switchSavings}/year savings`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Installation Timeline</h3>
                  <p className="text-sm text-gray-600">
                    Typical installation: {reportData.recommendations.installationTimeframe}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                <Home className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Backup Power</h3>
                  <p className="text-sm text-gray-600">
                    {reportData.recommendations.batterySize} provides ~12 hours backup for essential loads
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-batteryGreen-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-batteryGreen-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">System Cost</h3>
                  <p className="text-sm text-gray-600">
                    Est. ${reportData.calculations.systemCost} installed (before ${reportData.calculations.totalRebates} rebates)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-batteryGreen-600 to-solarYellow-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Saving? 🚀</h2>
          <p className="text-xl mb-6 opacity-90">
            Get connected with certified installers in your area and secure your rebates
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-batteryGreen-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
              Find Local Installers
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-batteryGreen-600 transition-all">
              Download PDF Report
            </button>
          </div>
        </div>

        {/* Fine Print */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Report generated on {new Date().toLocaleDateString()} |
            Based on current DMO/VDO tariffs and federal rebate programs |
            Savings estimates are indicative and depend on usage patterns
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BatteryReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-batteryGreen-600 mx-auto"></div><p className="mt-4 text-gray-600">Loading your personalized report...</p></div></div>}>
      <BatteryReportContent />
    </Suspense>
  )
}