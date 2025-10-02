import { NextResponse } from 'next/server'
import { weatherAPI } from '@/lib/weather-api'

// GET /api/clear-cache - Clear weather API cache for testing
export async function GET() {
  try {
    // Get cache status before clearing
    const beforeStatus = weatherAPI.getCacheStatus()

    // Clear the cache
    weatherAPI.clearCache()

    // Get cache status after clearing
    const afterStatus = weatherAPI.getCacheStatus()

    return NextResponse.json({
      success: true,
      message: 'Weather API cache cleared successfully',
      before: beforeStatus,
      after: afterStatus,
      clearedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/clear-cache - Same as GET for convenience
export async function POST() {
  return GET()
}