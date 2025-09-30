import GridStatus from '@/components/GridStatus'
import { BRAND_VOICE } from '@/lib/brand'
import { BatteryIQLogo } from '@/components/ui/BatteryIQLogo'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-morning-sky to-whisper-gray">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <BatteryIQLogo
            size={40}
            animated={false}
            clickable={true}
            showText={true}
          />
          <nav className="hidden md:flex space-x-8">
            <a href="/calculator" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Calculator</a>
            <a href="/grid-status" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Grid Status</a>
            <a href="#rebates" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Rebates</a>
            <a href="#guides" className="text-serious-gray hover:text-battery-green font-medium transition-colors">Guides</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-midnight-blue mb-6 tracking-tight">
            Outsmart The <span className="text-battery-green">Energy
            Market</span>
            <br />
            <span className="text-trust-navy">Together</span>
          </h1>
          <p className="text-xl md:text-2xl text-serious-gray mb-8 max-w-4xl mx-auto font-body leading-relaxed">
            Save money AND the planet? It's almost too good to be true. Almost.
            <br />
            <strong>We crunched 47 billion calculations so you don't have to. You're welcome.</strong>
          </p>

          {/* Playful Rebate Highlight */}
          <div className="bg-gradient-to-r from-electric-yellow/20 to-battery-green/20 border-2 border-electric-yellow/30 rounded-xl p-6 mb-8 max-w-3xl mx-auto shadow-lg">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <span className="h-8 w-8 bg-money-green rounded-full text-white text-sm flex items-center justify-center animate-pulse">💰</span>
              <span className="font-heading font-bold text-lg text-midnight-blue">Government Money Feels Different</span>
            </div>
            <p className="text-trust-navy text-lg font-body">
              Ka-ching! Save up to <strong className="text-money-green font-accent text-xl">$4,650</strong> with federal rebates, plus whatever your state throws in.
              Our calculator does the boring math so you don't have to. You're welcome.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="/calculator" className="bg-gradient-to-r from-battery-green to-money-green hover:from-battery-green/90 hover:to-money-green/90 text-white px-8 py-4 text-lg rounded-xl font-heading font-semibold inline-flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <span className="mr-3 text-xl">🚀</span>
              {BRAND_VOICE.ctaCopy.getStarted}
            </a>
            <button className="border-2 border-battery-green text-battery-green hover:bg-battery-green hover:text-white px-8 py-4 text-lg rounded-xl font-heading font-medium transition-all">
              Show Me The Money
            </button>
          </div>
        </div>
      </section>

      {/* Real-Time Grid Status */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Live Australian Grid Status
          </h2>
          <div className="max-w-4xl mx-auto">
            <GridStatus autoDetectLocation={true} />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-whisper-gray">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-heading font-bold text-center text-midnight-blue mb-4">
            Why We're Different
          </h2>
          <p className="text-xl text-center text-chat-gray mb-16 max-w-2xl mx-auto">
            We crunched 47 billion calculations so you don't have to. You're welcome.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-money-green to-battery-green w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-heading font-bold text-midnight-blue mb-4">Smart But Not Smug</h3>
              <p className="text-serious-gray font-body leading-relaxed">
                {BRAND_VOICE.motivationalCopy.batteryBenefits} Our algorithms balance cost, planet-saving,
                and backup power without making your brain hurt.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-electric-yellow to-warning-amber w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-heading font-bold text-midnight-blue mb-4">Rebate Whisperer</h3>
              <p className="text-serious-gray font-body leading-relaxed">
                Federal + state rebate stacking decoded. No more 2025 confusion about VPP requirements
                or commissioning dates. We speak government.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-grid-blue to-midnight-blue w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-heading font-bold text-midnight-blue mb-4">Grid Optimization</h3>
              <p className="text-serious-gray font-body leading-relaxed">
                Real-time AEMO data meets time-of-use arbitrage. Because outsmarting the energy market
                feels pretty bloody good.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2025 Rebate Confusion Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-batteryGreen-400 rounded flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
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
