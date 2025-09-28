import { NextSeo } from 'next-seo'

export interface SEOConfig {
  title: string
  description: string
  canonical?: string
  location?: string
  batteryType?: string
  rebateAmount?: number
}

export function generateSEOConfig(config: SEOConfig) {
  const baseTitle = "BatteryIQ - Intelligent Battery & Solar Calculator"
  const baseDescription = "Smart battery decisions with real-time Federal & State rebate calculations. Optimize cost vs emissions vs backup power for Australian homes."

  const fullTitle = config.title.includes('BatteryIQ')
    ? config.title
    : `${config.title} | ${baseTitle}`

  return {
    title: fullTitle,
    description: config.description || baseDescription,
    canonical: config.canonical,
    openGraph: {
      title: fullTitle,
      description: config.description || baseDescription,
      type: 'website',
      locale: 'en_AU',
      site_name: 'BatteryIQ',
      images: [
        {
          url: '/images/og-battery-calculator.jpg',
          width: 1200,
          height: 630,
          alt: 'BatteryIQ - Intelligent Battery Calculator'
        }
      ]
    },
    twitter: {
      handle: '@BatteryIQ_AU',
      site: '@BatteryIQ_AU',
      cardType: 'summary_large_image',
    },
    additionalMetaTags: [
      {
        name: 'author',
        content: 'BatteryIQ'
      },
      {
        name: 'robots',
        content: 'index,follow'
      },
      {
        name: 'geo.region',
        content: 'AU'
      },
      {
        name: 'geo.country',
        content: 'Australia'
      },
      ...(config.location ? [{
        name: 'geo.placename',
        content: config.location
      }] : [])
    ]
  }
}

export function generateLocationSEO(location: string, state: string) {
  return generateSEOConfig({
    title: `Smart Battery Calculator ${location} | Federal + ${state} Rebates 2025`,
    description: `Calculate your battery rebate savings in ${location}. Real-time Federal + ${state} rebate stacking, VPP requirements, and intelligent ROI optimization for ${location} residents.`,
    location: `${location}, ${state}, Australia`
  })
}

export function generateRebateSEO(rebateType: string, amount?: number) {
  const amountText = amount ? `Save up to $${amount.toLocaleString()}` : 'Maximum savings'
  return generateSEOConfig({
    title: `${rebateType} Battery Rebate Calculator 2025 | ${amountText}`,
    description: `Calculate your ${rebateType} battery rebate. Real-time rebate values, stacking rules, installation timing, and VPP requirements explained. ${amountText} available.`,
    rebateAmount: amount
  })
}