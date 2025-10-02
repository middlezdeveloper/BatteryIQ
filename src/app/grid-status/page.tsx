import { Metadata } from 'next'
import GridStatusDashboard from '@/components/GridStatusDashboard'

export const metadata: Metadata = {
  title: 'Live Grid Status | BatteryIQ - Australian Energy Grid Dashboard',
  description: 'Real-time Australian electricity grid data, generation mix, weather conditions, and battery recommendations. Live AEMO data with interactive visualizations.',
  keywords: 'australian grid status, electricity grid live data, AEMO data, grid generation mix, battery recommendations, solar weather data'
}

export default function GridStatusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-morning-sky to-whisper-gray">
      <GridStatusDashboard />
    </main>
  )
}