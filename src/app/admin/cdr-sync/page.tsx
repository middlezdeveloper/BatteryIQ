'use client'

import { useState, useEffect, useRef } from 'react'
import { BatteryIQLogo } from '@/components/ui/BatteryIQLogo'

interface SyncResult {
  retailer: string
  plans: number
  error?: string
}

interface SyncResponse {
  success: boolean
  totalPlans?: number
  retailers?: SyncResult[]
  error?: string
  timestamp?: string
}

export default function CDRSyncAdmin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [results, setResults] = useState<SyncResponse | null>(null)
  const [dbStats, setDbStats] = useState<{ total: number; byRetailer: { retailer: string; count: number }[] } | null>(null)
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const progressEndRef = useRef<HTMLDivElement>(null)

  const fetchDbStats = async () => {
    try {
      const response = await fetch('/api/energy-plans/stats')
      const data = await response.json()
      setDbStats(data)
    } catch (error) {
      console.error('Failed to fetch DB stats:', error)
    }
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check - in production, use proper auth
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'batteryiq2025') {
      setAuthenticated(true)
      setAuthError(false)
    } else {
      setAuthError(true)
    }
  }

  const handleSync = async (retailer?: string, priorityOnly?: boolean) => {
    setSyncing(true)
    setResults(null)
    setProgressMessages([])

    try {
      const params = new URLSearchParams()
      if (retailer) params.append('retailer', retailer)
      if (priorityOnly) params.append('priorityOnly', 'true')

      const url = `/api/energy-plans/sync-cdr${params.toString() ? `?${params}` : ''}`

      const response = await fetch(url, { method: 'POST' })
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.done) {
                setResults({
                  success: data.success,
                  totalPlans: data.totalPlans,
                  retailers: data.retailers,
                  error: data.error,
                  timestamp: data.timestamp
                })
                break
              } else if (data.message) {
                setProgressMessages(prev => [...prev, data.message])
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError)
            }
          }
        }
      }

      // Refresh DB stats after sync
      await fetchDbStats()
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setSyncing(false)
    }
  }

  // Fetch initial DB stats on mount when authenticated
  useEffect(() => {
    if (authenticated) {
      fetchDbStats()
    }
  }, [authenticated])

  // Auto-scroll progress messages
  useEffect(() => {
    progressEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progressMessages])

  // Show login form if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-morning-sky to-whisper-gray flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <BatteryIQLogo size={48} animated={true} showText={true} />
            <h1 className="text-2xl font-heading font-bold text-midnight-blue mt-4">
              Admin Access Required
            </h1>
            <p className="text-serious-gray mt-2">Enter password to access CDR Sync Admin</p>
          </div>

          <form onSubmit={handleAuth}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-battery-green focus:outline-none mb-4"
              autoFocus
            />
            {authError && (
              <p className="text-red-600 text-sm mb-4">Incorrect password</p>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90 text-white rounded-lg font-heading font-semibold transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-morning-sky to-whisper-gray p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BatteryIQLogo size={40} animated={true} clickable={true} showText={true} />
          <h1 className="text-4xl font-heading font-bold text-midnight-blue mt-4">
            CDR Energy Plans Sync Admin
          </h1>
          <p className="text-serious-gray mt-2">
            Sync real energy plan data from Australian Consumer Data Right (CDR) APIs
          </p>
        </div>

        {/* Database Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-heading font-bold text-midnight-blue">
              Database Statistics
            </h2>
            <button
              onClick={fetchDbStats}
              disabled={syncing}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {dbStats ? (
            <div>
              <div className="text-3xl font-bold text-battery-green mb-6">
                {dbStats.total.toLocaleString()} Total Plans
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbStats.byRetailer.map((item) => (
                  <div key={item.retailer} className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-midnight-blue">{item.retailer}</div>
                    <div className="text-2xl font-bold text-battery-green">
                      {item.count.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-serious-gray">Loading stats...</div>
          )}
        </div>

        {/* Sync Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-heading font-bold text-midnight-blue mb-6">
            Sync Energy Plans
          </h2>

          {/* Individual Big 3 Retailers - Recommended for Production */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-midnight-blue mb-3">
              Individual Retailers (Recommended for Production)
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => handleSync('origin')}
                disabled={syncing}
                className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Origin Energy'}
                <div className="text-sm font-normal mt-1">~325 plans (~1 min)</div>
              </button>

              <button
                onClick={() => handleSync('agl')}
                disabled={syncing}
                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'AGL Energy'}
                <div className="text-sm font-normal mt-1">~325 plans (~1 min)</div>
              </button>

              <button
                onClick={() => handleSync('energyaustralia')}
                disabled={syncing}
                className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'EnergyAustralia'}
                <div className="text-sm font-normal mt-1">~325 plans (~1 min)</div>
              </button>
            </div>
          </div>

          {/* Batch Sync Options */}
          <div>
            <h3 className="text-lg font-semibold text-midnight-blue mb-3">
              Batch Sync (May timeout on Vercel)
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleSync('globird')}
                disabled={syncing}
                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Test: GloBird Energy'}
                <div className="text-sm font-normal mt-1">~300 plans (~1 min)</div>
              </button>

              <button
                onClick={() => handleSync(undefined, true)}
                disabled={syncing}
                className="px-6 py-4 bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90 text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Sync Big 3 Together'}
                <div className="text-sm font-normal mt-1">⚠️ May timeout (~20 min)</div>
              </button>

              <button
                onClick={() => handleSync()}
                disabled={syncing}
                className="px-6 py-4 bg-gradient-to-r from-electric-yellow to-battery-green hover:from-electric-yellow/90 hover:to-battery-green/90 text-midnight-blue rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Sync Top 10 Retailers'}
                <div className="text-sm font-normal mt-1">⚠️ Will timeout (~25 min)</div>
              </button>

              <button
                onClick={() => {
                  if (confirm('This will sync all 107 retailers and will take 1-2 hours. Continue?')) {
                    handleSync()
                  }
                }}
                disabled={syncing}
                className="px-6 py-4 bg-gradient-to-r from-midnight-blue to-serious-gray hover:from-midnight-blue/90 hover:to-serious-gray/90 text-white rounded-lg font-heading font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Sync ALL 107 Retailers'}
                <div className="text-sm font-normal mt-1">⚠️ Not for production</div>
              </button>
            </div>
          </div>

          {syncing && (
            <div className="mt-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-battery-green mx-auto mb-4"></div>

              {/* Live progress messages */}
              <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg max-h-96 overflow-y-auto">
                {progressMessages.length === 0 ? (
                  <div className="text-center text-gray-500">Connecting to CDR APIs...</div>
                ) : (
                  <>
                    {progressMessages.map((msg, idx) => (
                      <div key={idx} className="mb-1">{msg}</div>
                    ))}
                    <div ref={progressEndRef} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sync Results */}
        {results && (
          <div className={`rounded-xl shadow-lg p-6 ${results.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <h2 className="text-2xl font-heading font-bold text-midnight-blue mb-4">
              {results.success ? '✅ Sync Complete' : '❌ Sync Failed'}
            </h2>

            {results.error && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4">
                <strong>Error:</strong> {results.error}
              </div>
            )}

            {results.success && results.retailers && (
              <div>
                <div className="text-3xl font-bold text-battery-green mb-6">
                  {results.totalPlans?.toLocaleString()} Plans Synced
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Retailer</th>
                        <th className="text-right py-2 px-4">Plans</th>
                        <th className="text-left py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.retailers.map((result, idx) => (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="py-2 px-4 font-semibold text-midnight-blue">
                            {result.retailer}
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-battery-green">
                            {result.plans.toLocaleString()}
                          </td>
                          <td className="py-2 px-4">
                            {result.error ? (
                              <span className="text-red-600 text-sm">{result.error}</span>
                            ) : (
                              <span className="text-green-600">✓ Success</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-sm text-serious-gray">
                  Synced at: {results.timestamp ? new Date(results.timestamp).toLocaleString() : 'Unknown'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
