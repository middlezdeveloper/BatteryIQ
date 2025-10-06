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
  canceled?: boolean
}

interface RetailerProgress {
  retailer: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  plansProcessed: number
  totalPlans: number
  currentChunk: number
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
  const [retailerProgress, setRetailerProgress] = useState<RetailerProgress[]>([])
  const [overallProgress, setOverallProgress] = useState({ processed: 0, total: 0 })
  const [currentTime, setCurrentTime] = useState(new Date())
  const cancelSyncRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load sync history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('syncHistory')
    if (history) {
      setSyncHistory(JSON.parse(history))
    }
  }, [])

  // Update current time every second when sync is running
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

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
  const addToHistory = useCallback((retailer: string, success: boolean, plansProcessed: number, duration: string, canceled = false) => {
    setSyncHistory(prev => {
      const entry: SyncHistoryEntry = {
        timestamp: new Date().toISOString(),
        retailer,
        success,
        plansProcessed,
        duration,
        canceled
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

  // Process a single chunk for a retailer
  const processSingleChunk = async (retailerSlug: string, cursor: number, chunkSize: string, forceSync: boolean) => {
    try {
      const params = new URLSearchParams()
      params.set('retailer', retailerSlug)
      params.set('chunkSize', chunkSize)
      params.set('cursor', cursor.toString())
      if (forceSync) params.set('forceSync', 'true')

      const url = `/api/energy-plans/sync-cdr?${params.toString()}`

      const response = await fetch(url, { method: 'POST' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let chunkResult: SyncResult | null = null
      let newPlansInChunk = 0

      while (true) {
        // Check for cancel
        if (cancelSyncRef.current) {
          await reader.cancel()
          return {
            nextCursor: null,
            plansProcessed: 0,
            newPlansInChunk: 0,
            success: false,
            canceled: true
          }
        }

        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.message) {
                setMessages(prev => [...prev, {
                  message: `[${retailerSlug}:${cursor}] ${data.message}`,
                  timestamp: new Date()
                }])

                const newPlansMatch = data.message.match(/🆕 New plans: (\d+)/)
                if (newPlansMatch) {
                  newPlansInChunk = parseInt(newPlansMatch[1])
                  // Update total on first chunk to set accurate progress bar
                  if (cursor === 0) {
                    setOverallProgress(prev => ({
                      ...prev,
                      total: newPlansInChunk
                    }))
                  }
                }
              }

              if (data.done !== undefined) {
                chunkResult = data
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }

      return {
        nextCursor: chunkResult?.nextCursor,
        plansProcessed: chunkResult?.totalPlans || 0,
        newPlansInChunk,
        success: chunkResult?.success || false,
        canceled: false
      }
    } catch (error) {
      console.error(`Error processing chunk ${cursor} for ${retailerSlug}:`, error)
      return {
        nextCursor: null,
        plansProcessed: 0,
        newPlansInChunk: 0,
        success: false,
        canceled: false
      }
    }
  }

  // Helper to format duration as MM:SS
  const formatDuration = (durationMs: number) => {
    const totalSeconds = Math.floor(durationMs / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Sync a single retailer with parallel chunk processing
  const syncSingleRetailer = async (retailerSlug: string, startTime: Date, retailerBatchSize: number) => {
    let cursor: number | null = 0
    let totalPlansProcessed = 0
    let activeChunks = []
    // Dynamically calculate max parallel chunks based on retailer batch size
    // Target: 180 concurrent operations (90% of 200 connection pool)
    // Formula: 180 / (retailerBatchSize * PARALLEL_BATCH_SIZE)
    const maxParallelChunks = Math.max(1, Math.floor(180 / (retailerBatchSize * 20)))

    // Process all chunks in parallel batches from the start
    try {
      cursor = 0

      while (cursor !== null) {
        // Create batch of parallel chunk requests
        const chunkBatch = []
        for (let i = 0; i < maxParallelChunks && cursor !== null; i++) {
          chunkBatch.push({ cursor, index: i })
          cursor += parseInt(chunkSize) // Estimate next cursor
        }

        setMessages(prev => [...prev, {
          message: `[${retailerSlug}] 🔄 Processing ${chunkBatch.length} chunks in parallel (max ${maxParallelChunks} chunks per retailer)...`,
          timestamp: new Date()
        }])

        // Process this batch of chunks in parallel with staggered start to avoid DB connection spikes
        const batchResults: Awaited<ReturnType<typeof processSingleChunk>>[] = await Promise.all(
          chunkBatch.map(({ cursor: chunkCursor }, index) => {
            // Stagger chunk starts by 3 seconds each to spread out DB queries
            return new Promise<Awaited<ReturnType<typeof processSingleChunk>>>(resolve => {
              setTimeout(async () => {
                const result = await processSingleChunk(retailerSlug, chunkCursor, chunkSize, forceSync)
                resolve(result)
              }, index * 3000)
            })
          })
        )

        // Check if any result was canceled
        const wasCanceled = batchResults.some(r => r.canceled)
        if (wasCanceled) {
          const endTime = new Date()
          const durationMs = endTime.getTime() - startTime.getTime()
          const durationStr = formatDuration(durationMs)
          addToHistory(retailerSlug, false, totalPlansProcessed, durationStr, true)
          return { success: false, totalPlans: totalPlansProcessed, canceled: true }
        }

        // Accumulate results
        for (const result of batchResults) {
          totalPlansProcessed += result.plansProcessed
          setOverallProgress(prev => ({
            ...prev,
            processed: prev.processed + result.plansProcessed
          }))
        }

        // Check if we need more chunks (use last result's nextCursor)
        const lastResult: Awaited<ReturnType<typeof processSingleChunk>> = batchResults[batchResults.length - 1]
        cursor = lastResult.nextCursor || null

        if (cursor === null) {
          // All done
          const endTime = new Date()
          const durationMs = endTime.getTime() - startTime.getTime()
          const durationStr = formatDuration(durationMs)

          addToHistory(retailerSlug, true, totalPlansProcessed, durationStr)

          setMessages(prev => [...prev, {
            message: `[${retailerSlug}] ✅ Complete! ${totalPlansProcessed} plans in ${durationStr}`,
            timestamp: new Date()
          }])

          return { success: true, totalPlans: totalPlansProcessed }
        }
      }

      return { success: true, totalPlans: totalPlansProcessed }

    } catch (error) {
      console.error(`Sync error for ${retailerSlug}:`, error)
      setMessages(prev => [...prev, {
        message: `[${retailerSlug}] ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }])

      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      const durationStr = formatDuration(durationMs)
      addToHistory(retailerSlug, false, 0, durationStr)

      return { success: false, totalPlans: 0 }
    }
  }

  // Main sync function with parallel processing
  const startSync = async () => {
    setMessages([])
    setResult(null)
    setIsRunning(true)
    cancelSyncRef.current = false // Reset cancel flag
    const startTime = new Date()
    setSyncStartTime(startTime)

    // Determine which retailers to sync
    const retailersToSync = selectedRetailers.length > 0
      ? selectedRetailers
      : ALL_RETAILERS.map(r => r.slug)

    // Initialize overall progress
    setOverallProgress({ processed: 0, total: retailersToSync.length * 100 }) // Estimate

    setMessages(prev => [...prev, {
      message: `🚀 Starting parallel sync for ${retailersToSync.length} retailers (${retailersToSync.length > 5 ? '5' : retailersToSync.length} at a time)...`,
      timestamp: new Date()
    }])

    try {
      // Process retailers in batches of 5 for parallel execution
      const batchSize = 5
      const batches = []
      for (let i = 0; i < retailersToSync.length; i += batchSize) {
        batches.push(retailersToSync.slice(i, i + batchSize))
      }

      let totalPlansAllRetailers = 0

      for (let i = 0; i < batches.length; i++) {
        // Check if sync was canceled
        if (cancelSyncRef.current) {
          setMessages(prev => [...prev, {
            message: `🛑 Sync canceled by user`,
            timestamp: new Date()
          }])
          break
        }

        const batch = batches[i]
        const currentBatchSize = batch.length
        setMessages(prev => [...prev, {
          message: `📦 Processing batch ${i + 1}/${batches.length}: ${batch.join(', ')}`,
          timestamp: new Date()
        }])

        // Run batch in parallel
        const batchResults = await Promise.all(
          batch.map(retailer => syncSingleRetailer(retailer, startTime, currentBatchSize))
        )

        // Sum up results
        totalPlansAllRetailers += batchResults.reduce((sum, r) => sum + r.totalPlans, 0)

        setMessages(prev => [...prev, {
          message: `✅ Batch ${i + 1} complete! Total so far: ${totalPlansAllRetailers} plans`,
          timestamp: new Date()
        }])
      }

      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      const durationStr = formatDuration(durationMs)

      setResult({
        done: true,
        success: true,
        totalPlans: totalPlansAllRetailers,
        timestamp: endTime.toISOString()
      })

      setMessages(prev => [...prev, {
        message: `🎉 All syncs complete! ${totalPlansAllRetailers} total plans in ${durationStr}`,
        timestamp: new Date()
      }])

      setIsRunning(false)

    } catch (error) {
      console.error('Sync error:', error)
      setMessages(prev => [...prev, {
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }])
      setIsRunning(false)
    }
  }

  const cancelSync = () => {
    if (!isRunning) return

    cancelSyncRef.current = true
    setMessages(prev => [...prev, {
      message: `⚠️  Canceling sync... This may take a moment to complete current operations gracefully.`,
      timestamp: new Date()
    }])
  }

  const getProgressStats = () => {
    if (!isRunning) return null

    // Use overall progress instead of last message
    const { processed, total } = overallProgress

    if (total === 0) return null

    const percentage = (processed / total) * 100

    // Calculate elapsed time and estimate remaining (using currentTime for smooth updates)
    const elapsed = syncStartTime ? (currentTime.getTime() - syncStartTime.getTime()) / 1000 : 0
    const rate = processed > 0 ? elapsed / processed : 0.35
    const remaining = (total > processed && processed > 0) ? (total - processed) * rate : 0

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return {
      current: processed,
      total,
      percentage: percentage.toFixed(1),
      estimatedTimeRemaining: remaining > 0 ? formatTime(remaining) : 'Completing...',
      elapsedTime: formatTime(elapsed)
    }
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

          <div className="flex gap-3">
            <button
              onClick={startSync}
              disabled={isRunning}
              className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90'
              }`}
            >
              {isRunning ? '⏳ Sync Running...' : '▶️ Start Sync'}
            </button>

            {isRunning && (
              <button
                onClick={cancelSync}
                className="px-6 py-3 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-all"
              >
                🛑 Cancel
              </button>
            )}
          </div>

          {/* Parallel Sync Info */}
          {isRunning && (selectedRetailers.length > 1 || selectedRetailers.length === 0) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <span className="font-semibold">⚡ Parallel Processing Active</span>
                <span>•</span>
                <span>Processing up to 5 retailers simultaneously</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar - Always visible when running */}
        {stats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-medium">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-battery-green to-money-green h-4 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Plans:</span> {stats.current.toLocaleString()} / {stats.total.toLocaleString()}
              </div>
              <div className="text-center">
                <span className="font-medium">Elapsed:</span> {stats.elapsedTime}
              </div>
              <div className="text-right">
                <span className="font-medium">ETA:</span> {stats.estimatedTimeRemaining}
              </div>
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
                        {entry.canceled ? (
                          <span className="text-orange-600 font-medium">🛑 Canceled</span>
                        ) : entry.success ? (
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
