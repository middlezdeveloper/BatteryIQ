'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ALL_RETAILERS } from '@/lib/cdr-retailers'

interface SyncMessage {
  message: string
  timestamp: Date
}

interface SyncResult {
  done?: boolean
  success?: boolean
  totalPlans?: number
  retailers?: Array<{
    retailer: string
    plans: number
    totalPlans?: number
    isLastChunk?: boolean
  }>
  nextCursor?: number | null
  timestamp?: string
  error?: string
}

interface SyncHistoryEntry {
  timestamp: string
  retailer: string
  success: boolean
  plansProcessed: number
  duration: string
}

export default function SyncStatusPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState<SyncMessage[]>([])
  const [result, setResult] = useState<SyncResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([])
  const [chunkSize, setChunkSize] = useState('100')
  const [forceSync, setForceSync] = useState(false)
  const [showChunkInfo, setShowChunkInfo] = useState(false)
  const [showRetailerDropdown, setShowRetailerDropdown] = useState(false)
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([])
  const [syncStartTime, setSyncStartTime] = useState<Date | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load sync history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('syncHistory')
    if (history) {
      setSyncHistory(JSON.parse(history))
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRetailerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Save sync result to history
  const addToHistory = useCallback((retailer: string, success: boolean, plansProcessed: number, duration: string) => {
    setSyncHistory(prev => {
      const entry: SyncHistoryEntry = {
        timestamp: new Date().toISOString(),
        retailer,
        success,
        plansProcessed,
        duration
      }
      const newHistory = [entry, ...prev].slice(0, 10) // Keep last 10
      localStorage.setItem('syncHistory', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const toggleRetailer = (slug: string) => {
    setSelectedRetailers(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    )
  }

  const clearRetailers = () => {
    setSelectedRetailers([])
  }

  const selectAllRetailers = () => {
    setSelectedRetailers(ALL_RETAILERS.map(r => r.slug))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startSync = async () => {
    setMessages([])
    setResult(null)
    setIsRunning(true)
    const startTime = new Date()
    setSyncStartTime(startTime)

    const params = new URLSearchParams()
    // Use selected retailers if any, otherwise sync all
    const retailerParam = selectedRetailers.length > 0
      ? selectedRetailers.join(',')
      : 'ALL'
    if (selectedRetailers.length > 0) {
      params.set('retailer', selectedRetailers[0]) // For now, process first selected
    }
    params.set('chunkSize', chunkSize)
    if (forceSync) params.set('forceSync', 'true')

    const url = `/api/energy-plans/sync-cdr?${params.toString()}`

    try {
      const response = await fetch(url, { method: 'POST' })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          setIsRunning(false)
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.message) {
                setMessages(prev => [...prev, {
                  message: data.message,
                  timestamp: new Date()
                }])
              }

              if (data.done !== undefined) {
                setResult(data)
                if (data.done) {
                  setIsRunning(false)
                  // Add to history
                  const endTime = new Date()
                  const durationMs = endTime.getTime() - startTime.getTime()
                  const durationStr = `${Math.floor(durationMs / 1000)}s`
                  addToHistory(
                    retailerParam,
                    data.success || false,
                    data.totalPlans || 0,
                    durationStr
                  )
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error)
      setMessages(prev => [...prev, {
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }])
      setIsRunning(false)
      // Add failed sync to history
      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      const durationStr = `${Math.floor(durationMs / 1000)}s`
      addToHistory(retailerParam, false, 0, durationStr)
    }
  }

  const getProgressStats = () => {
    if (!messages.length) return null

    const lastMessage = messages[messages.length - 1]?.message || ''

    // Try to extract progress from messages like "📋 Fetching details: 50/436..."
    const match = lastMessage.match(/(\d+)\/(\d+)/)
    if (match) {
      const current = parseInt(match[1])
      const total = parseInt(match[2])
      const percentage = (current / total) * 100

      return {
        current,
        total,
        percentage: percentage.toFixed(1),
        estimatedTimeRemaining: total > current ? `~${Math.ceil((total - current) * 0.35)}s` : 'Completing...'
      }
    }

    return null
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check - in production, use proper auth
    if (password === 'batteryiq2025') {
      setIsAuthenticated(true)
      setPassword('')
    } else {
      alert('Incorrect password')
    }
  }

  // Login screen (before main UI)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-morning-sky to-whisper-gray flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-heading font-bold text-midnight-blue mb-6">
            🔒 Sync Status - Authentication Required
          </h1>
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              placeholder="Enter password"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-battery-green to-money-green text-white py-2 rounded-lg font-semibold hover:from-battery-green/90 hover:to-money-green/90"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  const stats = getProgressStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-morning-sky to-whisper-gray p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-midnight-blue mb-8">
          🔄 Energy Plans Sync Status
        </h1>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sync Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Retailer Multi-Select */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retailers (optional)
              </label>
              <button
                type="button"
                onClick={() => setShowRetailerDropdown(!showRetailerDropdown)}
                disabled={isRunning}
                className="w-full px-3 py-2 border rounded-lg text-left bg-white disabled:bg-gray-100 flex items-center justify-between"
              >
                <span className="text-sm text-gray-700 truncate">
                  {selectedRetailers.length === 0
                    ? 'All retailers (88)'
                    : `${selectedRetailers.length} selected`}
                </span>
                <span className="text-gray-400">▼</span>
              </button>

              {showRetailerDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {/* Quick actions */}
                  <div className="sticky top-0 bg-gray-50 border-b px-3 py-2 flex gap-2">
                    <button
                      onClick={selectAllRetailers}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearRetailers}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Retailer list */}
                  {ALL_RETAILERS.map((retailer) => (
                    <label
                      key={retailer.slug}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRetailers.includes(retailer.slug)}
                        onChange={() => toggleRetailer(retailer.slug)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{retailer.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Chunk Size with Tooltip */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                Chunk Size
                <button
                  type="button"
                  onMouseEnter={() => setShowChunkInfo(true)}
                  onMouseLeave={() => setShowChunkInfo(false)}
                  className="relative text-blue-500 hover:text-blue-600"
                >
                  ℹ️
                  {showChunkInfo && (
                    <div className="absolute left-0 top-6 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-20">
                      Number of plans to process per request. Larger chunks are faster but may timeout on Vercel (10min limit).
                      <br />
                      <br />
                      <strong>Recommended:</strong>
                      <br />• 100-200 for individual retailers
                      <br />• 50-100 for full syncs
                    </div>
                  )}
                </button>
              </label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={isRunning}
                min="10"
                max="500"
              />
            </div>

            {/* Force Sync */}
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={forceSync}
                  onChange={(e) => setForceSync(e.target.checked)}
                  className="mr-2"
                  disabled={isRunning}
                />
                <span className="text-sm font-medium">Force Full Sync</span>
              </label>
            </div>
          </div>

          <button
            onClick={startSync}
            disabled={isRunning}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90'
            }`}
          >
            {isRunning ? '⏳ Sync Running...' : '▶️ Start Sync'}
          </button>
        </div>

        {/* Progress Bar */}
        {stats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-battery-green to-money-green h-4 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{stats.current} / {stats.total} plans</span>
              <span>{stats.estimatedTimeRemaining}</span>
            </div>
          </div>
        )}

        {/* Live Console */}
        <div className="bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">📡 Live Console</h2>

          <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {messages.length === 0 ? (
              <p className="text-gray-500">No sync running. Click "Start Sync" to begin.</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="text-green-400 mb-1">
                  <span className="text-gray-500">
                    [{msg.timestamp.toLocaleTimeString()}]
                  </span>{' '}
                  {msg.message}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Results */}
        {result && result.done && (
          <div className={`rounded-xl shadow-lg p-6 ${result.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
            <h2 className="text-xl font-semibold mb-4">
              {result.success ? '✅ Sync Complete!' : '❌ Sync Failed'}
            </h2>

            {result.success && (
              <div className="space-y-2">
                <p className="text-lg">
                  <strong>Total Plans Processed:</strong> {result.totalPlans || 0}
                </p>

                {result.retailers && result.retailers.length > 0 && (
                  <div>
                    <strong>Retailers:</strong>
                    <ul className="ml-4 mt-2">
                      {result.retailers.map((r, idx) => (
                        <li key={idx}>
                          {r.retailer}: {r.plans} plans
                          {r.totalPlans && ` (${r.totalPlans} total)`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm text-gray-600 mt-4">
                  Completed at {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'just now'}
                </p>
              </div>
            )}

            {result.error && (
              <p className="text-red-700">
                <strong>Error:</strong> {result.error}
              </p>
            )}
          </div>
        )}

        {/* Sync History */}
        {syncHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">📊 Recent Syncs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Timestamp</th>
                    <th className="text-left py-2 px-3">Retailer</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Plans</th>
                    <th className="text-right py-2 px-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistory.map((entry, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-600">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {entry.retailer}
                      </td>
                      <td className="py-2 px-3">
                        {entry.success ? (
                          <span className="text-green-600 font-medium">✅ Success</span>
                        ) : (
                          <span className="text-red-600 font-medium">❌ Failed</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700">
                        {entry.plansProcessed.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {entry.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
