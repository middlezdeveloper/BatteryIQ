import { Button } from "@/components/ui/button"
import { Calculator, Zap, TrendingUp, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-batteryGreen-50 to-solarYellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-batteryGreen-600" />
            <span className="text-2xl font-bold text-gray-900">BatteryIQ</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#calculator" className="text-gray-600 hover:text-batteryGreen-600">Calculator</a>
            <a href="#rebates" className="text-gray-600 hover:text-batteryGreen-600">Rebates</a>
            <a href="#guides" className="text-gray-600 hover:text-batteryGreen-600">Guides</a>
            <a href="#installers" className="text-gray-600 hover:text-batteryGreen-600">Installers</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Intelligent Battery
            <span className="text-batteryGreen-600"> Decisions</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Smart battery optimization with real-time Federal & State rebate calculations.
            Maximize cost savings, minimize emissions, optimize backup power.
          </p>

          {/* Federal Rebate Highlight */}
          <div className="bg-solarYellow-100 border border-solarYellow-300 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-solarYellow-600" />
              <span className="font-semibold text-solarYellow-800">Federal Battery Rebate 2025</span>
            </div>
            <p className="text-solarYellow-700">
              Save up to <strong>$4,650</strong> with the Cheaper Home Batteries Program.
              Plus state rebates! Calculator shows exact savings for your location.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-batteryGreen-600 hover:bg-batteryGreen-700 text-white px-8 py-4 text-lg">
              <Calculator className="mr-2 h-5 w-5" />
              Calculate My Savings
            </Button>
            <Button variant="outline" size="lg" className="border-batteryGreen-600 text-batteryGreen-600 hover:bg-batteryGreen-50 px-8 py-4 text-lg">
              Learn About Rebates
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose BatteryIQ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-batteryGreen-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-batteryGreen-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Objective Optimization</h3>
              <p className="text-gray-600">
                Balance cost savings, emissions reduction, and backup power based on your priorities.
                Smart algorithms find your perfect battery size.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-solarYellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-solarYellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Rebate Intelligence</h3>
              <p className="text-gray-600">
                Federal + state rebate stacking with 2025 confusion clarity. VPP requirements,
                installation timing, and rebate decline schedules explained.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-batteryGreen-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-batteryGreen-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Grid Strategies</h3>
              <p className="text-gray-600">
                Grid-charging optimization and non-solar battery scenarios. Perfect for renters
                and those maximizing time-of-use savings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2025 Rebate Confusion Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            2025 Battery Rebate Confusion? We've Got Answers.
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Can I stack NSW and Federal rebates?</h3>
              <p className="text-gray-600">NSW suspended their rebate when federal started - you can't combine them. Our calculator shows which gives you more savings.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Installation vs Commissioning Date?</h3>
              <p className="text-gray-600">Batteries must be commissioned (tested/certified) on/after July 1, 2025. Installation can be earlier.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">VPP Capable vs Required?</h3>
              <p className="text-gray-600">Must be VPP-capable for rebate, but you don't need to actually join a VPP program.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Usable vs Nominal Capacity?</h3>
              <p className="text-gray-600">Rebate calculated on usable capacity (what you can actually use), not total battery size.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-6 w-6 text-batteryGreen-400" />
                <span className="text-xl font-bold">BatteryIQ</span>
              </div>
              <p className="text-gray-400">
                Intelligent battery decisions for smart, environmentally conscious Australians.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tools</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Battery Calculator</a></li>
                <li><a href="#" className="hover:text-white">Rebate Calculator</a></li>
                <li><a href="#" className="hover:text-white">ROI Calculator</a></li>
                <li><a href="#" className="hover:text-white">Installer Finder</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">2025 Rebate Guide</a></li>
                <li><a href="#" className="hover:text-white">VPP Requirements</a></li>
                <li><a href="#" className="hover:text-white">Installation Timeline</a></li>
                <li><a href="#" className="hover:text-white">Battery Comparison</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BatteryIQ. All rights reserved. Intelligent battery decisions for Australia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
