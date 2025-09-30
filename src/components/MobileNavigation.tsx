'use client'

import { useState } from 'react'
import { BatteryIQLogo } from '@/components/ui/BatteryIQLogo'

export default function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    document.body.style.overflow = ''
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none group"
        onClick={toggleMenu}
      >
        <span className={`block w-6 h-0.5 bg-midnight-blue transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'rotate-45 translate-y-2' : ''
        }`}></span>
        <span className={`block w-6 h-0.5 bg-midnight-blue transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-0' : ''
        }`}></span>
        <span className={`block w-6 h-0.5 bg-midnight-blue transition-all duration-300 ease-in-out ${
          isMenuOpen ? '-rotate-45 -translate-y-2' : ''
        }`}></span>
      </button>

      {/* Mobile Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-white via-morning-sky to-whisper-gray backdrop-blur-lg border-l border-gray-200 shadow-2xl transform transition-all duration-300 ease-out z-50 md:hidden ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <BatteryIQLogo
              size={28}
              animated={false}
              clickable={false}
              showText={true}
            />
            <button
              className="p-2 text-midnight-blue hover:text-battery-green transition-colors"
              onClick={closeMenu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Links */}
          <nav className="flex-1 px-6 py-8">
            <ul className="space-y-6">
              {[
                { href: '/calculator', icon: '🚀', label: 'Calculator' },
                { href: '/grid-status', icon: '⚡', label: 'Grid Status' },
                { href: '#rebates', icon: '💰', label: 'Rebates' },
                { href: '#guides', icon: '📚', label: 'Guides' }
              ].map((item, index) => (
                <li
                  key={item.href}
                  className={`transform transition-all duration-300 ease-out ${
                    isMenuOpen
                      ? 'translate-x-0 opacity-100'
                      : 'translate-x-5 opacity-0'
                  }`}
                  style={{
                    transitionDelay: isMenuOpen ? `${(index + 1) * 100}ms` : '0ms'
                  }}
                >
                  <a
                    href={item.href}
                    className="block text-lg font-heading font-semibold text-midnight-blue hover:text-battery-green transition-colors py-2"
                    onClick={closeMenu}
                  >
                    {item.icon} {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="p-6 border-t border-gray-200">
            <p className="text-sm text-serious-gray text-center">
              Intelligent battery decisions for Australia
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  )
}