// Utility functions for validating 24-hour tariff coverage

interface TimeWindow {
  days: string[]
  startTime: string // HH:MM format
  endTime: string   // HH:MM format
}

interface ValidationResult {
  has24HourCoverage: boolean
  gaps: Array<{ day: string; startTime: string; endTime: string }>
  overlaps: Array<{ day: string; startTime: string; endTime: string; rates: number[] }>
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MINUTES_IN_DAY = 24 * 60

/**
 * Convert HH:MM time string to minutes since midnight
 * Handles special case: "00:00" at end time represents end of day (1440 minutes)
 */
function timeToMinutes(time: string, isEndTime: boolean = false): number {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes

  // Special case: "00:00" as end time means end of day (midnight next day)
  if (isEndTime && totalMinutes === 0) {
    return MINUTES_IN_DAY
  }

  return totalMinutes
}

/**
 * Convert minutes to HH:MM format
 */
function minutesToTime(minutes: number): string {
  if (minutes === MINUTES_IN_DAY) return '24:00'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Validate that all 24 hours of every day are covered by tariff periods
 * Also detects overlaps where multiple rates apply to the same time
 */
export function validate24HourCoverage(
  tariffPeriods: Array<{ timeWindows: TimeWindow[]; rate: number }>
): ValidationResult {
  const result: ValidationResult = {
    has24HourCoverage: true,
    gaps: [],
    overlaps: []
  }

  // Build coverage map for each day: array of 1440 minutes (24 hours * 60 min)
  // Each element stores the rates that apply at that minute
  const coverageMap: Map<string, number[][]> = new Map()
  DAYS.forEach(day => {
    // Initialize each minute with empty array
    coverageMap.set(day, Array(MINUTES_IN_DAY).fill(null).map(() => []))
  })

  // Fill in coverage from all tariff periods
  tariffPeriods.forEach((period) => {
    period.timeWindows.forEach((window) => {
      window.days.forEach((day) => {
        const dayMap = coverageMap.get(day)
        if (!dayMap) return

        const startMin = timeToMinutes(window.startTime, false)
        const endMin = timeToMinutes(window.endTime, true)

        // Mark each minute in this time window with this period's rate
        for (let minute = startMin; minute < endMin; minute++) {
          dayMap[minute].push(period.rate)
        }
      })
    })
  })

  // Analyze coverage for each day
  DAYS.forEach(day => {
    const dayMap = coverageMap.get(day)!

    let gapStart: number | null = null

    for (let minute = 0; minute < MINUTES_IN_DAY; minute++) {
      const rates = dayMap[minute]

      // Check for gaps (no coverage)
      if (rates.length === 0) {
        if (gapStart === null) {
          gapStart = minute
        }
      } else {
        // End of gap
        if (gapStart !== null) {
          result.gaps.push({
            day,
            startTime: minutesToTime(gapStart),
            endTime: minutesToTime(minute)
          })
          gapStart = null
        }

        // Check for overlaps (multiple rates)
        if (rates.length > 1) {
          // Find continuous overlap period
          let overlapEnd = minute + 1
          while (overlapEnd < MINUTES_IN_DAY && dayMap[overlapEnd].length > 1) {
            overlapEnd++
          }

          result.overlaps.push({
            day,
            startTime: minutesToTime(minute),
            endTime: minutesToTime(overlapEnd),
            rates: [...new Set(rates)] // Unique rates
          })

          // Skip to end of overlap period
          minute = overlapEnd - 1
        }
      }
    }

    // Check if gap extends to end of day
    if (gapStart !== null) {
      result.gaps.push({
        day,
        startTime: minutesToTime(gapStart),
        endTime: minutesToTime(MINUTES_IN_DAY)
      })
    }
  })

  result.has24HourCoverage = result.gaps.length === 0

  return result
}

/**
 * Helper to extract time windows from Prisma JSON data
 */
export function parseTimeWindows(timeWindowsJson: any): TimeWindow[] {
  if (Array.isArray(timeWindowsJson)) {
    return timeWindowsJson as TimeWindow[]
  }
  return []
}
