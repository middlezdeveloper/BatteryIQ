'use client'

import { useState, useEffect, useRef } from 'react'

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

export default function SyncStatusPage() {
  const [messages, setMessages] = useState<SyncMessage[]>([])
  const [result, setResult] = useState<SyncResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [retailer, setRetailer] = useState('')
  const [chunkSize, setChunkSize] = useState('100')
  const [forceSync, setForceSync] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    const params = new URLSearchParams()
    if (retailer) params.set('retailer', retailer)
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retailer (optional)
              </label>
              <input
                type="text"
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
                placeholder="e.g., ovo-energy"
                className="w-full px-3 py-2 border rounded-lg"
                disabled={isRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chunk Size
              </label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={isRunning}
              />
            </div>

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
      </div>
    </div>
  )
}
