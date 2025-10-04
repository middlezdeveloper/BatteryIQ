'use client'

import { useState, useEffect } from 'react'
import { BatteryIQLogo } from '@/components/ui/BatteryIQLogo'
import MobileNavigation from '@/components/MobileNavigation'
import PlanCard from '@/components/PlanCard'

interface Distributor {
  id: string
  code: string
  name: string
  state: string
  isPrimary: boolean
}

interface EnergyPlan {
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

export default function ComparePlans() {
  const [step, setStep] = useState(1)
  const [postcode, setPostcode] = useState('')
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [suburb, setSuburb] = useState('')
  const [plans, setPlans] = useState<EnergyPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterBattery, setFilterBattery] = useState(false)
  const [filterVPP, setFilterVPP] = useState(false)
  const [filterGreen, setFilterGreen] = useState(false)

  // Step 1: Enter postcode
  const handlePostcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/energy-plans/distributors?postcode=${postcode}`)
      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to find distributors for this postcode')
        setLoading(false)
        return
      }

      setDistributors(data.distributors)

      // If only one distributor, auto-select and move to plans
      if (data.distributors.length === 1) {
        setSelectedDistributor(data.distributors[0].code)
        setStep(3)
        await fetchPlans(data.distributors[0].code)
      } else {
        setStep(2)
      }
    } catch (err) {
      setError('Failed to fetch distributors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Select distributor or enter address
  const handleDistributorSelect = async (distributorCode: string) => {
    setSelectedDistributor(distributorCode)
    setStep(3)
    await fetchPlans(distributorCode)
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/energy-plans/distributor-by-address?address=${encodeURIComponent(address)}&suburb=${encodeURIComponent(suburb)}&postcode=${postcode}`
      )
      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to determine distributor from address')
        setLoading(false)
        return
      }

      setSelectedDistributor(data.distributor.code)
      setStep(3)
      await fetchPlans(data.distributor.code)
    } catch (err) {
      setError('Failed to determine distributor. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch plans
  const fetchPlans = async (distributorCode: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        postcode,
        distributorCode,
      })

      if (filterBattery) params.append('hasBattery', 'true')
      if (filterVPP) params.append('hasVPP', 'true')

      const response = await fetch(`/api/energy-plans/search?${params}`)
      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to fetch energy plans')
        setLoading(false)
        return
      }

      setPlans(data.plans)
    } catch (err) {
      setError('Failed to fetch plans. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    if (step === 3 && selectedDistributor) {
      fetchPlans(selectedDistributor)
    }
  }, [filterBattery, filterVPP, filterGreen])

  const filteredPlans = filterGreen
    ? plans.filter(p => p.greenPower || p.carbonNeutral)
    : plans

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
            <a href="/calculator" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Calculator</a>
            <a href="/grid-status" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Grid Status</a>
            <a href="/compare-plans" className="text-battery-green font-semibold transition-colors">Compare Plans</a>
            <a href="#rebates" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Rebates</a>
            <a href="#guides" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Guides</a>
          </nav>

          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-midnight-blue mb-4">
            Compare Energy Plans
          </h1>
          <p className="text-xl text-serious-gray">
            Find the best electricity plan for your home and battery
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-battery-green text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              1
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-battery-green' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-battery-green text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              2
            </div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-battery-green' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-battery-green text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              3
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Step 1: Postcode */}
        {step === 1 && (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-heading font-bold text-midnight-blue mb-6">
              Enter Your Postcode
            </h2>
            <form onSubmit={handlePostcodeSubmit}>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g., 3000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-battery-green focus:outline-none text-lg mb-4"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90 text-white px-6 py-3 rounded-lg font-heading font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Select Distributor or Enter Address */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-heading font-bold text-midnight-blue mb-6">
              Who's Your Electricity Distributor?
            </h2>
            <p className="text-serious-gray mb-6">
              Multiple distributors service postcode {postcode}. Select yours, or enter your address if you're not sure.
            </p>

            <div className="space-y-4 mb-8">
              {distributors.map((dist) => (
                <button
                  key={dist.id}
                  onClick={() => handleDistributorSelect(dist.code)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-battery-green hover:bg-battery-green/5 transition-all text-left"
                >
                  <div className="font-semibold text-midnight-blue">{dist.name}</div>
                  <div className="text-sm text-serious-gray">{dist.state}</div>
                </button>
              ))}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-midnight-blue mb-4">Not sure? Enter your address:</h3>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-battery-green focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  placeholder="Suburb"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-battery-green focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90 text-white px-6 py-3 rounded-lg font-heading font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? 'Finding Distributor...' : 'Find My Distributor'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Display Plans */}
        {step === 3 && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="font-heading font-semibold text-midnight-blue mb-4">Filter Plans</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterBattery}
                    onChange={(e) => setFilterBattery(e.target.checked)}
                    className="w-5 h-5 text-battery-green focus:ring-battery-green"
                  />
                  <span className="text-serious-gray">Battery Incentives</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterVPP}
                    onChange={(e) => setFilterVPP(e.target.checked)}
                    className="w-5 h-5 text-battery-green focus:ring-battery-green"
                  />
                  <span className="text-serious-gray">VPP Programs</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterGreen}
                    onChange={(e) => setFilterGreen(e.target.checked)}
                    className="w-5 h-5 text-battery-green focus:ring-battery-green"
                  />
                  <span className="text-serious-gray">Green Power</span>
                </label>
              </div>
            </div>

            {/* Plans Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-battery-green mx-auto"></div>
                <p className="text-serious-gray mt-4">Loading plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <p className="text-xl text-serious-gray">
                  No plans found matching your criteria. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-serious-gray">
                    Found <strong className="text-midnight-blue">{filteredPlans.length}</strong> plans for postcode <strong className="text-midnight-blue">{postcode}</strong>
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
