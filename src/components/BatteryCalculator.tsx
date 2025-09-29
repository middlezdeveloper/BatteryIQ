'use client'

import { useState, useEffect } from 'react'
import { MapPin, Users, Zap, Home, TrendingUp, Battery, Leaf, DollarSign } from 'lucide-react'

// Types for calculator state
interface CalculatorState {
  // Stage 1: Quick wins
  postcode: string
  householdSize: number

  // Stage 2: Motivation & context
  motivation: ('cost' | 'environment' | 'backup')[]
  currentProvider: string
  hasSolar: boolean
  hasEV: boolean
  planningEV: boolean
  evTimeframe?: 'current' | '12months' | '3-5years' | 'none'

  // Stage 3: Technical details
  quarterlyBill: number
  solarCapacity?: number
  showCustomSolar?: boolean
  currentTariff: 'flat' | 'time-of-use' | 'unknown'
  householdIncome?: number

  // Stage 4: Contact
  email: string
  phone: string

  // Derived data
  annualUsage?: number
  currentCO2Impact?: number
  locationData?: any
}

interface InsightData {
  title: string
  value: string
  subtitle: string
  emoji: string
  color: string
}

const INITIAL_STATE: CalculatorState = {
  postcode: '',
  householdSize: 2,
  motivation: [],
  currentProvider: '',
  hasSolar: false,
  hasEV: false,
  planningEV: false,
  quarterlyBill: 0,
  currentTariff: 'unknown',
  email: '',
  phone: ''
}

export default function BatteryCalculator() {
  const [stage, setStage] = useState(1)
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE)
  const [insights, setInsights] = useState<InsightData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showInsight, setShowInsight] = useState(false)

  // Update state helper
  const updateState = (updates: Partial<CalculatorState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Generate insights based on current data
  const generateInsights = async () => {
    setIsLoading(true)

    // Fetch real-time data from our APIs
    const newInsights: InsightData[] = []

    // Get real tariff data if we have enough info
    let tariffData = null
    let solarData = null

    if (state.postcode && stage >= 2) {
      try {
        const stateMap: { [key: string]: string } = {
          '1': 'NSW', '2': 'NSW', '3': 'VIC', '4': 'QLD', '5': 'SA', '6': 'WA', '7': 'NT', '8': 'WA', '9': 'WA'
        }
        const state_code = stateMap[state.postcode.charAt(0)] || 'NSW'

        // Get solar zone data based on postcode
        const solarZoneMap: { [key: string]: number } = {
          '1': 4, '2': 4, '3': 4, '4': 3, '5': 3, '6': 2, '7': 1, '8': 2, '9': 2
        }
        const solarZone = solarZoneMap[state.postcode.charAt(0)] || 4

        // Fetch solar data if we have solar capacity info
        if (state.hasSolar && state.solarCapacity && stage >= 3) {
          const solarResponse = await fetch(`/api/solar?solarZone=${solarZone}&panelCapacity=${state.solarCapacity}&includeCurrent=true`)
          if (solarResponse.ok) {
            solarData = await solarResponse.json()
          }
        }

        if (['NSW', 'VIC', 'QLD', 'SA'].includes(state_code) && state.quarterlyBill > 0) {
          const annualUsage = (state.quarterlyBill * 4) / 0.30 // Rough usage estimate from bill
          const response = await fetch(`/api/tariffs?state=${state_code}&compare=true&annualUsage=${annualUsage}&batteryCapacity=13.5`)
          if (response.ok) {
            tariffData = await response.json()
          }
        }
      } catch (error) {
        console.log('API error:', error)
      }
    }

    if (state.postcode && stage >= 1) {
      // Use real tariff data if available, otherwise estimates
      let avgSavings = state.postcode.startsWith('2') ? 850 :
                      state.postcode.startsWith('3') ? 780 :
                      state.postcode.startsWith('4') ? 920 : 750

      if (tariffData?.summary?.averageArbitrageValue) {
        avgSavings = tariffData.summary.averageArbitrageValue + 200 // Add base savings
      }

      newInsights.push({
        title: tariffData ? "Real Tariff Analysis" : "Local Battery Savings",
        value: `$${avgSavings}/year`,
        subtitle: tariffData ?
          `Based on ${tariffData.comparison?.length || 0} local tariffs` :
          `Average for ${state.postcode} area`,
        emoji: tariffData ? "🎯" : "💰",
        color: "text-batteryGreen-600"
      })
    }

    if (state.householdSize && stage >= 1) {
      const dailyUsage = state.householdSize * 6.5 // Rough estimate
      const annualCO2 = dailyUsage * 365 * 0.82 // kg CO2 per kWh in Australia

      updateState({
        annualUsage: dailyUsage * 365,
        currentCO2Impact: annualCO2
      })

      newInsights.push({
        title: "Your CO₂ Impact",
        value: `${Math.round(annualCO2/1000)} tonnes/year`,
        subtitle: `That's like driving ${Math.round(annualCO2/0.2)} km annually`,
        emoji: "🌍",
        color: "text-orange-600"
      })
    }

    if (state.motivation.length > 0 && stage >= 2) {
      const motivationText = state.motivation.includes('environment')
        ? "Brilliant! Planet-conscious choices add up. 🌱"
        : state.motivation.includes('cost')
        ? "Smart thinking! Every dollar saved matters. 💡"
        : "Great call! Backup power = peace of mind. 🏠"

      newInsights.push({
        title: "Your Priority",
        value: motivationText,
        subtitle: "We'll optimise for what matters to you",
        emoji: "🎯",
        color: "text-batteryGreen-600"
      })
    }

    if (state.quarterlyBill > 0 && stage >= 3) {
      const annualBill = state.quarterlyBill * 4
      const potentialSavings = Math.round(annualBill * 0.3) // 30% potential savings

      newInsights.push({
        title: "Potential Savings",
        value: `$${potentialSavings}/year`,
        subtitle: `From your $${annualBill} annual bill`,
        emoji: "📉",
        color: "text-batteryGreen-600"
      })
    }

    if (state.hasSolar && state.solarCapacity && stage >= 3) {
      let batteryBoost = Math.round(state.solarCapacity * 400) // Rough self-consumption boost
      let subtitle = `Extra value from your ${state.solarCapacity}kW solar`

      if (solarData?.generation?.annualGeneration) {
        batteryBoost = Math.round(solarData.generation.annualGeneration * 0.3) // 30% additional self-consumption
        subtitle = `Real solar data: ${Math.round(solarData.generation.annualGeneration)} kWh/year total`
      }

      newInsights.push({
        title: solarData ? "Real Solar + Battery Analysis" : "Solar + Battery Boost",
        value: `+${batteryBoost} kWh/year`,
        subtitle: subtitle,
        emoji: solarData ? "🔥" : "⚡",
        color: "text-solarYellow-600"
      })
    }

    if (state.currentTariff === 'time-of-use' && stage >= 3) {
      let arbitrageValue = "$600-800/year"
      let subtitle = "Perfect! Time-of-use tariffs are battery gold 🏆"

      if (tariffData?.summary?.averageArbitrageValue) {
        arbitrageValue = `$${tariffData.summary.averageArbitrageValue}/year`
        subtitle = tariffData.recommendations?.batteryBenefit || subtitle
      }

      newInsights.push({
        title: "Arbitrage Opportunity",
        value: arbitrageValue,
        subtitle: subtitle,
        emoji: "💎",
        color: "text-batteryGreen-600"
      })
    }

    if ((state.hasEV || state.planningEV) && stage >= 2) {
      newInsights.push({
        title: state.hasEV ? "EV Charging Synergy!" : "EV-Ready Setup",
        value: state.hasEV ? "Super cheap night charging" : "Future-proofed",
        subtitle: state.hasEV ? "Perfect for EV tariffs + battery arbitrage" : "Ready for when you get an EV",
        emoji: state.hasEV ? "⚡" : "🔮",
        color: "text-blue-600"
      })
    }

    if (stage >= 4 && state.email) {
      const federalRebate = Math.min(4650, state.quarterlyBill * 10) // Max federal rebate logic

      newInsights.push({
        title: "Federal Rebate Ready!",
        value: `$${federalRebate}`,
        subtitle: "Your report will include rebate application steps",
        emoji: "🎯",
        color: "text-batteryGreen-600"
      })
    }

    setInsights(newInsights)
    setIsLoading(false)
    setShowInsight(true)

    // Auto-hide insight after 3 seconds
    setTimeout(() => setShowInsight(false), 3000)
  }

  // Progress calculation
  const totalStages = 4
  const progress = (stage / totalStages) * 100

  // Stage navigation
  const nextStage = () => {
    if (stage < totalStages) {
      setStage(stage + 1)
      generateInsights()
    }
  }

  const prevStage = () => {
    if (stage > 1) {
      setStage(stage - 1)
    }
  }

  // Render insight popup
  const InsightPopup = ({ insight }: { insight: InsightData }) => (
    <div className={`fixed top-4 right-4 z-50 p-4 bg-white rounded-lg shadow-lg border-l-4 border-batteryGreen-500 transform transition-all duration-500 ${
      showInsight ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{insight.emoji}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
          <p className={`text-lg font-bold ${insight.color}`}>{insight.value}</p>
          <p className="text-sm text-gray-600">{insight.subtitle}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-batteryGreen-50 to-solarYellow-50 p-4">
      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm text-gray-600">{stage} of {totalStages}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-batteryGreen-500 to-batteryGreen-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Calculator */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Stage 1: Quick Wins */}
          {stage === 1 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Let's find your perfect battery setup! ⚡
                </h2>
                <p className="text-lg text-gray-600">
                  Just a few quick questions to get started...
                </p>
              </div>

              <div className="space-y-6">
                {/* Postcode */}
                <div>
                  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <MapPin className="w-5 h-5 mr-2 text-batteryGreen-600" />
                    What's your postcode?
                  </label>
                  <input
                    type="text"
                    value={state.postcode}
                    onChange={(e) => updateState({ postcode: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full p-4 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-batteryGreen-500 focus:border-transparent"
                    maxLength={4}
                  />
                  {state.postcode && state.postcode.length === 4 && (
                    <p className="mt-2 text-sm text-batteryGreen-600 flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      Great! We'll tailor everything to your area
                    </p>
                  )}
                </div>

                {/* Household Size */}
                <div>
                  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <Users className="w-5 h-5 mr-2 text-batteryGreen-600" />
                    How many people live in your home?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, '5+'].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateState({ householdSize: typeof size === 'number' ? size : 5 })}
                        className={`p-4 border-2 rounded-lg text-lg font-semibold transition-all ${
                          state.householdSize === (typeof size === 'number' ? size : 5)
                            ? 'border-batteryGreen-500 bg-batteryGreen-50 text-batteryGreen-700'
                            : 'border-gray-200 hover:border-batteryGreen-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={nextStage}
                  disabled={!state.postcode || state.postcode.length !== 4 || !state.householdSize}
                  className="bg-batteryGreen-600 hover:bg-batteryGreen-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
                >
                  Show me what's possible! →
                </button>
              </div>
            </div>
          )}

          {/* Stage 2: Motivation & Context */}
          {stage === 2 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  What matters most to you? 🎯
                </h2>
                <p className="text-lg text-gray-600">
                  We'll optimize your setup based on your priorities
                </p>
              </div>

              <div className="space-y-6">
                {/* Motivation */}
                <div>
                  <label className="text-lg font-semibold text-gray-900 mb-4 block">
                    Why are you interested in a battery? (Choose all that apply)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'cost', label: 'Save money', icon: DollarSign, color: 'solarYellow' },
                      { id: 'environment', label: 'Reduce emissions', icon: Leaf, color: 'batteryGreen' },
                      { id: 'backup', label: 'Backup power', icon: Home, color: 'blue' }
                    ].map((option) => {
                      const Icon = option.icon
                      const isSelected = state.motivation.includes(option.id as any)

                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            const newMotivation = isSelected
                              ? state.motivation.filter(m => m !== option.id)
                              : [...state.motivation, option.id as any]
                            updateState({ motivation: newMotivation })
                          }}
                          className={`p-6 border-2 rounded-xl text-center transition-all ${
                            isSelected
                              ? `border-${option.color}-500 bg-${option.color}-50`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-3 ${
                            isSelected ? `text-${option.color}-600` : 'text-gray-400'
                          }`} />
                          <p className={`font-semibold ${
                            isSelected ? `text-${option.color}-700` : 'text-gray-600'
                          }`}>
                            {option.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Current Provider */}
                <div>
                  <label className="text-lg font-semibold text-gray-900 mb-3 block">
                    Who's your current energy provider?
                  </label>
                  <select
                    value={state.currentProvider}
                    onChange={(e) => updateState({ currentProvider: e.target.value })}
                    className="w-full p-4 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-batteryGreen-500 focus:border-transparent"
                  >
                    <option value="">Select your provider...</option>
                    <option value="AGL">AGL</option>
                    <option value="Origin">Origin Energy</option>
                    <option value="EnergyAustralia">Energy Australia</option>
                    <option value="Red Energy">Red Energy</option>
                    <option value="Alinta">Alinta Energy</option>
                    <option value="Simply Energy">Simply Energy</option>
                    <option value="Other">Other / Not sure</option>
                  </select>
                </div>

                {/* Solar Status */}
                <div>
                  <label className="text-lg font-semibold text-gray-900 mb-3 block">
                    Do you currently have solar panels?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateState({ hasSolar: true })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        state.hasSolar === true
                          ? 'border-solarYellow-500 bg-solarYellow-50 text-solarYellow-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-2">☀️</span>
                      <span className="font-semibold">Yes, I have solar</span>
                    </button>
                    <button
                      onClick={() => updateState({ hasSolar: false })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        state.hasSolar === false
                          ? 'border-batteryGreen-500 bg-batteryGreen-50 text-batteryGreen-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-2">🏠</span>
                      <span className="font-semibold">No solar yet</span>
                    </button>
                  </div>
                </div>

                {/* EV Status */}
                <div>
                  <label className="text-lg font-semibold text-gray-900 mb-3 block">
                    Electric vehicle situation?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => updateState({ hasEV: true, planningEV: false, evTimeframe: 'current' })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        state.hasEV === true
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-2">🚗</span>
                      <span className="font-semibold">Have EV now</span>
                      <p className="text-xs text-gray-600 mt-1">Access to EV tariffs</p>
                    </button>
                    <button
                      onClick={() => updateState({ hasEV: false, planningEV: true, evTimeframe: '12months' })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        state.evTimeframe === '12months'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-2">🎯</span>
                      <span className="font-semibold">EV within 12 months</span>
                      <p className="text-xs text-gray-600 mt-1">Novated lease ready</p>
                    </button>
                    <button
                      onClick={() => updateState({ hasEV: false, planningEV: true, evTimeframe: '3-5years' })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        state.evTimeframe === '3-5years'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-2">🔮</span>
                      <span className="font-semibold">Planning EV (3-5 years)</span>
                      <p className="text-xs text-gray-600 mt-1">Future-proof setup</p>
                    </button>
                    <button
                      onClick={() => updateState({ hasEV: false, planningEV: false, evTimeframe: 'none' })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        state.evTimeframe === 'none'
                          ? 'border-gray-500 bg-gray-50 text-gray-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-2">⛽</span>
                      <span className="font-semibold">No EV plans</span>
                      <p className="text-xs text-gray-600 mt-1">Standard tariffs</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={prevStage}
                  className="text-batteryGreen-600 hover:text-batteryGreen-700 px-4 py-2 font-semibold"
                >
                  ← Back
                </button>
                <button
                  onClick={nextStage}
                  disabled={state.motivation.length === 0 || !state.currentProvider}
                  className="bg-batteryGreen-600 hover:bg-batteryGreen-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
                >
                  Let's get technical! →
                </button>
              </div>
            </div>
          )}

          {/* Stage 3: Technical Details */}
          {stage === 3 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Let's crunch some numbers! 📊
                </h2>
                <p className="text-lg text-gray-600">
                  This helps us calculate your exact savings potential
                </p>
              </div>

              <div className="space-y-6">
                {/* Quarterly Bill */}
                <div>
                  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <DollarSign className="w-5 h-5 mr-2 text-batteryGreen-600" />
                    What's your quarterly electricity bill?
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                    <input
                      type="number"
                      value={state.quarterlyBill || ''}
                      onChange={(e) => updateState({ quarterlyBill: parseFloat(e.target.value) || 0 })}
                      placeholder="450"
                      className="w-full pl-8 pr-4 py-4 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-batteryGreen-500 focus:border-transparent"
                      min="0"
                      step="10"
                    />
                  </div>
                  {state.quarterlyBill > 0 && (
                    <p className="mt-2 text-sm text-batteryGreen-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      That's ${state.quarterlyBill * 4}/year - we can help reduce this!
                    </p>
                  )}
                </div>

                {/* Solar Capacity (if they have solar) */}
                {state.hasSolar && (
                  <div>
                    <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                      <Zap className="w-5 h-5 mr-2 text-solarYellow-600" />
                      How big is your current solar system?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {['3kW', '5kW', '6.6kW', '10kW', '15kW+'].map((size) => {
                        const numericSize = size === '15kW+' ? 15 : parseFloat(size)
                        const isCustom = size === '15kW+'
                        return (
                          <button
                            key={size}
                            onClick={() => {
                              if (isCustom) {
                                // For 15kW+, show the input field and set focus
                                updateState({ solarCapacity: 15, showCustomSolar: true })
                              } else {
                                updateState({ solarCapacity: numericSize, showCustomSolar: false })
                              }
                            }}
                            className={`p-4 border-2 rounded-lg text-center font-semibold transition-all ${
                              (state.solarCapacity === numericSize) || (isCustom && (state.solarCapacity || 0) >= 15)
                                ? 'border-solarYellow-500 bg-solarYellow-50 text-solarYellow-700'
                                : 'border-gray-200 hover:border-solarYellow-300'
                            }`}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                    {(state.showCustomSolar || (state.solarCapacity || 0) >= 15) && (
                      <div className="mt-3">
                        <input
                          type="number"
                          value={state.solarCapacity || ''}
                          onChange={(e) => updateState({ solarCapacity: parseFloat(e.target.value) || 0 })}
                          placeholder="Enter system size (kW)"
                          className="w-full p-3 border border-solarYellow-300 rounded-lg focus:ring-2 focus:ring-solarYellow-500 focus:border-transparent"
                          step="0.1"
                          min="0"
                        />
                        <p className="mt-1 text-xs text-gray-500">Large systems qualify for commercial rebates</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Tariff Type */}
                <div>
                  <label className="text-lg font-semibold text-gray-900 mb-3 block">
                    What type of electricity plan are you on?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'flat', label: 'Flat rate', desc: 'Same price all day', icon: '📊' },
                      { id: 'time-of-use', label: 'Time of use', desc: 'Different prices by time', icon: '⏰' },
                      { id: 'unknown', label: 'Not sure', desc: "We'll help you figure it out", icon: '🤷‍♂️' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => updateState({ currentTariff: option.id as any })}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          state.currentTariff === option.id
                            ? 'border-batteryGreen-500 bg-batteryGreen-50 text-batteryGreen-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-2">{option.icon}</span>
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-sm text-gray-600">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Household Income (for state rebate eligibility) */}
                <div>
                  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <DollarSign className="w-5 h-5 mr-2 text-batteryGreen-600" />
                    Combined household income (for state rebate eligibility)
                  </label>

                  {/* State-specific income thresholds */}
                  {(() => {
                    const stateMap: { [key: string]: string } = {
                      '1': 'NSW', '2': 'NSW', '3': 'VIC', '4': 'QLD', '5': 'SA', '6': 'WA', '7': 'NT', '8': 'WA', '9': 'WA'
                    }
                    const userState = stateMap[state.postcode?.charAt(0)] || 'NSW'

                    const stateThresholds: { [key: string]: { limit: number; note: string } } = {
                      'NSW': { limit: 180000, note: 'NSW state rebate requires household income under $180,000' },
                      'VIC': { limit: 210000, note: 'VIC state rebate requires household income under $210,000' },
                      'QLD': { limit: 180000, note: 'QLD rebate schemes have various income limits around $180,000' },
                      'SA': { limit: 0, note: 'SA currently has no income testing for battery rebates' },
                      'WA': { limit: 0, note: 'WA rebate eligibility varies by program' }
                    }

                    const threshold = stateThresholds[userState]

                    return (
                      <>
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            📍 <strong>{userState} residents:</strong> {threshold.note}
                          </p>
                          {threshold.limit === 0 && (
                            <p className="text-sm text-green-700 mt-1">
                              ✅ <strong>Federal rebate ($4,650)</strong> available to all income levels regardless!
                            </p>
                          )}
                        </div>

                        {threshold.limit > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                              onClick={() => updateState({ householdIncome: threshold.limit - 1000 })}
                              className={`p-4 border-2 rounded-lg text-center transition-all ${
                                state.householdIncome && state.householdIncome < threshold.limit
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-200 hover:border-green-300'
                              }`}
                            >
                              <span className="text-2xl block mb-2">✅</span>
                              <p className="font-semibold">Under ${threshold.limit.toLocaleString()}</p>
                              <p className="text-xs text-gray-600 mt-1">Eligible for state rebate</p>
                            </button>
                            <button
                              onClick={() => updateState({ householdIncome: threshold.limit + 1000 })}
                              className={`p-4 border-2 rounded-lg text-center transition-all ${
                                state.householdIncome && state.householdIncome >= threshold.limit
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-gray-200 hover:border-red-300'
                              }`}
                            >
                              <span className="text-2xl block mb-2">❌</span>
                              <p className="font-semibold">Over ${threshold.limit.toLocaleString()}</p>
                              <p className="text-xs text-gray-600 mt-1">State rebate not available</p>
                            </button>
                            <button
                              onClick={() => updateState({ householdIncome: 999999 })}
                              className={`p-4 border-2 rounded-lg text-center transition-all ${
                                state.householdIncome === 999999
                                  ? 'border-batteryGreen-500 bg-batteryGreen-50 text-batteryGreen-700'
                                  : 'border-gray-200 hover:border-batteryGreen-300'
                              }`}
                            >
                              <span className="text-2xl block mb-2">🤐</span>
                              <p className="font-semibold">Prefer not to say</p>
                              <p className="text-xs text-gray-600 mt-1">Still eligible for federal</p>
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                            <span className="text-2xl block mb-2">🎉</span>
                            <p className="font-semibold text-green-800">No income testing in {userState}</p>
                            <p className="text-sm text-green-700 mt-1">
                              You're automatically eligible for both federal ($4,650) and any available state rebates!
                            </p>
                          </div>
                        )}

                        {state.householdIncome && threshold.limit > 0 && state.householdIncome !== 999999 && (
                          <div className="mt-3 p-3 rounded-lg text-sm">
                            {state.householdIncome < threshold.limit ? (
                              <div className="bg-green-50 text-green-700">
                                ✅ <strong>Eligible for {userState} state rebate</strong> + federal rebate ($4,650)
                              </div>
                            ) : (
                              <div className="bg-orange-50 text-orange-700">
                                ⚠️ <strong>Not eligible for {userState} state rebate</strong> - but federal rebate ($4,650) still available!
                              </div>
                            )}
                          </div>
                        )}

                        {state.householdIncome === 999999 && threshold.limit > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 text-gray-700 rounded-lg text-sm">
                            ℹ️ <strong>Federal rebate ($4,650) definitely available</strong> - state rebate eligibility depends on actual income
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={prevStage}
                  className="text-batteryGreen-600 hover:text-batteryGreen-700 px-4 py-2 font-semibold"
                >
                  ← Back
                </button>
                <button
                  onClick={nextStage}
                  disabled={state.quarterlyBill === 0}
                  className="bg-batteryGreen-600 hover:bg-batteryGreen-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
                >
                  Show me my savings! →
                </button>
              </div>
            </div>
          )}

          {/* Stage 4: Contact & Results */}
          {stage === 4 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  You're so close to savings! 🎉
                </h2>
                <p className="text-lg text-gray-600">
                  Just need your details to send your personalized battery report
                </p>
              </div>

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <span className="text-2xl mr-2">📧</span>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={state.email}
                    onChange={(e) => updateState({ email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full p-4 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-batteryGreen-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    We'll send your detailed savings report and never spam you (promise!) 🤞
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <span className="text-2xl mr-2">📱</span>
                    Phone number <span className="text-sm text-gray-500 ml-1">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={state.phone}
                    onChange={(e) => updateState({ phone: e.target.value })}
                    placeholder="04XX XXX XXX"
                    className="w-full p-4 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-batteryGreen-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    For a quick call from our battery experts (only if you want it)
                  </p>
                </div>

                {/* Quick Results Preview */}
                <div className="bg-gradient-to-r from-batteryGreen-50 to-solarYellow-50 p-6 rounded-xl border">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Your preliminary results 👀</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-batteryGreen-600">
                        ${Math.round((state.quarterlyBill * 4) * 0.25)}/year
                      </p>
                      <p className="text-sm text-gray-600">Potential savings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-solarYellow-600">
                        ${Math.round(4650 - (state.quarterlyBill * 0.1))}
                      </p>
                      <p className="text-sm text-gray-600">With federal rebate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {Math.round(state.householdSize * 2.4)}t CO₂
                      </p>
                      <p className="text-sm text-gray-600">Annual reduction</p>
                    </div>
                  </div>
                  <p className="text-center mt-4 text-sm text-gray-600">
                    Full detailed report coming to your inbox! 📨
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={prevStage}
                  className="text-batteryGreen-600 hover:text-batteryGreen-700 px-4 py-2 font-semibold"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    // Handle final submission
                    console.log('Final submission:', state)

                    // Encode user data for the report
                    const reportData = encodeURIComponent(JSON.stringify(state))

                    // Redirect to report page with user data
                    window.location.href = `/report?data=${reportData}`
                  }}
                  disabled={!state.email}
                  className="bg-gradient-to-r from-batteryGreen-600 to-solarYellow-600 hover:from-batteryGreen-700 hover:to-solarYellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
                >
                  Get My Battery Report! 🚀
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Insight Popup */}
      {insights.length > 0 && insights.map((insight, index) => (
        <InsightPopup key={index} insight={insight} />
      ))}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin w-8 h-8 border-4 border-batteryGreen-200 border-t-batteryGreen-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Crunching the numbers...</p>
          </div>
        </div>
      )}
    </div>
  )
}