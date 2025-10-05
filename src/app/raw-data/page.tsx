'use client'

import { useState, useEffect } from 'react'

interface RawDataResponse {
  timestamp: string
  region: string
  currentDate: string
  urls: {
    fuelMix: string
    price: string
  }
  rawResponses: {
    fuelMix: {
      status: number
      statusText: string
      data: any
    }
    price: {
      status: number
      statusText: string
      data: any
    }
  }
}

export default function RawDataPage() {
  const [data, setData] = useState<RawDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [region, setRegion] = useState('NEM')

  const fetchRawData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/raw-data?region=${region}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRawData()
  }, [region])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Raw API Data Verification</h1>
        <p className="text-gray-600 mb-4">
          This page shows the exact raw data we receive from the OpenElectricity API
          without any manipulation. Use this to verify accuracy against{' '}
          <a
            href="https://explore.openelectricity.org.au"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            explore.openelectricity.org.au
          </a>
        </p>

        <div className="flex gap-4 mb-4">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="NEM">NEM (All Australia)</option>
            <option value="NSW1">NSW</option>
            <option value="VIC1">Victoria</option>
            <option value="QLD1">Queensland</option>
            <option value="SA1">South Australia</option>
            <option value="TAS1">Tasmania</option>
          </select>

          <button
            onClick={fetchRawData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="text-lg">Loading raw data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* API Request Info */}
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h2 className="text-xl font-semibold mb-3">Request Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Timestamp:</strong> {data.timestamp}</div>
              <div><strong>Region:</strong> {data.region}</div>
              <div><strong>Date:</strong> {data.currentDate}</div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">API Endpoints Called:</h3>
              <div className="space-y-1 text-xs font-mono bg-white p-2 rounded border">
                <div><strong>Fuel Mix:</strong> {data.urls.fuelMix}</div>
                <div><strong>Price:</strong> {data.urls.price}</div>
              </div>
            </div>
          </div>

          {/* Fuel Mix Response */}
          <div className="border border-gray-200 rounded">
            <div className="bg-green-50 border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold">Fuel Mix Response</h2>
              <div className="text-sm text-gray-600 mt-1">
                Status: {data.rawResponses.fuelMix.status} {data.rawResponses.fuelMix.statusText}
              </div>
            </div>
            <div className="p-4">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(data.rawResponses.fuelMix.data, null, 2)}
              </pre>
            </div>
          </div>

          {/* Price Response */}
          <div className="border border-gray-200 rounded">
            <div className="bg-blue-50 border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold">Price Response</h2>
              <div className="text-sm text-gray-600 mt-1">
                Status: {data.rawResponses.price.status} {data.rawResponses.price.statusText}
              </div>
            </div>
            <div className="p-4">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(data.rawResponses.price.data, null, 2)}
              </pre>
            </div>
          </div>

          {/* Quick Summary for Easy Comparison */}
          {data.rawResponses.fuelMix.data?.success && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h2 className="text-xl font-semibold mb-3">Quick Summary (for comparison)</h2>
              <div className="text-sm">
                <div><strong>API Version:</strong> {data.rawResponses.fuelMix.data.version}</div>
                <div><strong>Total Records:</strong> {data.rawResponses.fuelMix.data.total_records}</div>
                <div><strong>Data Points:</strong> {data.rawResponses.fuelMix.data.data?.[0]?.results?.length || 0} fuel types</div>
                {data.rawResponses.fuelMix.data.data?.[0]?.results?.map((result: any, index: number) => (
                  <div key={index} className="ml-4">
                    <strong>{result.columns?.fueltech || result.name}:</strong> {' '}
                    {result.data?.[result.data.length - 1]?.[1]?.toFixed(0) || 0} MW
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}