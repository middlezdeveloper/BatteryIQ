import BatteryCalculator from '@/components/BatteryCalculator'

export const metadata = {
  title: 'Battery Calculator | BatteryIQ - Find Your Perfect Battery Setup',
  description: 'Calculate your battery savings with our intelligent Australian battery calculator. Get personalized recommendations, federal rebate eligibility, and real-time tariff analysis.',
  keywords: 'battery calculator, solar battery calculator, home battery calculator, battery savings calculator, federal battery rebate calculator, Australia battery calculator'
}

export default function CalculatorPage() {
  return (
    <main>
      <BatteryCalculator />
    </main>
  )
}