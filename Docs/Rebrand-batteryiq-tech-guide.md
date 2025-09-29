# BatteryIQ Technical Implementation Guide
## Making Energy Storage Delightfully Unexpected 🔋✨

*Version 1.0 - For Claude Code Implementation*
*Last Updated: September 29, 2025*

---

## 🎯 Mission Statement

**We're not building another boring energy calculator.** We're creating the Duolingo of battery storage - playful, addictive, and surprisingly delightful. Think Oatly's irreverent honesty meets Tesla's sleek tech, wrapped in Australian humor.

**Core Philosophy:**
- Make people smile while saving money
- Turn dry data into delightful discoveries
- Be the brand that makes energy storage *actually* fun
- Speak human, not kilowatt-hour

---

## 🎨 Brand Voice & Visual Direction

### The BatteryIQ Personality

Inspired by Oatly's playful irreverence and Duolingo's gamified engagement:

**Voice Attributes:**
- **Cheeky but Trustworthy**: "Your power bill is having a laugh at your expense. Let's fix that."
- **Smart but Not Smug**: "We crunched 47 billion calculations so you don't have to. You're welcome."
- **Aussie but Universal**: Local slang, global appeal
- **Honest to a Fault**: "Batteries aren't magic. But they're pretty bloody close."

### Copy Examples for Implementation

```javascript
// Loading States (Instead of boring spinners)
const loadingMessages = [
  "Interrogating the grid monopoly...",
  "Teaching electrons to behave...",
  "Calculating your revenge on power companies...",
  "Finding money hiding in your roof...",
  "Asking the sun for a favor...",
  "Converting sunshine to cold hard cash..."
];

// Success Messages
const successMessages = {
  highSavings: "Holy renewable resources! You could save ${amount} per year!",
  mediumSavings: "Not bad! ${amount} stays in your pocket instead of theirs.",
  lowSavings: "Every dollar counts! ${amount} saved is ${beers} beers earned.",
  propertyValue: "Plus your house just became ${value} more attractive. You're welcome, future you."
};

// Error Messages (Make failures fun)
const errorMessages = {
  postcodeInvalid: "That postcode seems made up. Try again, but with real numbers this time.",
  apiDown: "The government's computers are having a nap. We'll use our backup brain instead.",
  noSavings: "Hmm, you might already be an energy genius. Or you typed something weird."
};
```

### Visual Design System

```scss
// Color Palette - Energetic but Sophisticated
$colors: (
  // Primary - The hero colors
  'electric-yellow': #FFE500,  // Solar energy, optimism
  'battery-green': #00D97E,    // Savings, sustainability
  'midnight-blue': #0B1929,    // Premium, trustworthy
  
  // Secondary - The supporting cast
  'grid-blue': #0073E6,        // Grid connection
  'sunset-orange': #FF6B35,    // Peak pricing warnings
  'morning-sky': #E8F4FD,      // Soft backgrounds
  
  // Semantic - The emotion drivers
  'money-green': #10B981,      // Savings indicators
  'warning-amber': #F59E0B,    // Attention grabbers
  'trust-navy': #1E293B,       // Text, authority
  
  // Grays - The subtle supporters
  'whisper-gray': #F8FAFC,     // Backgrounds
  'chat-gray': #94A3B8,        // Secondary text
  'serious-gray': #475569      // Important text
);

// Typography - Friendly but Professional
$fonts: (
  'heading': "'Bricolage Grotesque', system-ui, sans-serif",  // Quirky but readable
  'body': "'Inter', -apple-system, sans-serif",               // Crystal clear
  'accent': "'Space Grotesk', monospace"                      // For numbers that matter
);

// Spacing System - Breathing Room
$spacing: (
  'micro': 4px,
  'tiny': 8px,
  'small': 12px,
  'base': 16px,
  'medium': 24px,
  'large': 32px,
  'huge': 48px,
  'massive': 64px
);
```

---

## 🏗️ Technical Architecture

### Core Technology Stack

```typescript
// Next.js 14 App Router Configuration
const techStack = {
  framework: 'Next.js 14 (App Router)',
  language: 'TypeScript 5.x',
  styling: 'Tailwind CSS 3.x + Framer Motion',
  database: 'PostgreSQL + Prisma ORM',
  apis: {
    energy: ['OpenElectricity', 'AER', 'AEMO'],
    weather: ['BOM Solar API'],
    pricing: ['Clean Energy Regulator']
  },
  animations: 'Three.js + Lottie',
  analytics: 'Vercel Analytics + Posthog',
  deployment: 'Vercel Edge Functions'
};
```

### Project Structure

```
batteryiq/
├── app/
│   ├── (marketing)/          # Public pages
│   │   ├── page.tsx          # Playful homepage
│   │   ├── about/           # Our story (Oatly-style)
│   │   └── learn/           # Educational content
│   ├── calculator/          # The main event
│   │   ├── page.tsx         # Calculator interface
│   │   ├── components/      # Reusable UI pieces
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Calculation logic
│   ├── api/
│   │   ├── calculate/      # Core calculations
│   │   ├── energy-data/    # API integrations
│   │   └── webhooks/       # External services
│   └── results/            # Shareable results
├── components/
│   ├── ui/                 # Design system components
│   ├── animations/         # Delightful interactions
│   └── charts/            # Data visualizations
├── lib/
│   ├── api-clients/       # External API wrappers
│   ├── calculations/      # Energy math engine
│   └── constants/         # Configuration
└── public/
    ├── animations/        # Lottie files
    └── sounds/           # Micro-interactions audio
```

---

## 🔌 API Integration Implementation

### 1. OpenElectricity API Client

```typescript
// lib/api-clients/openelectricity.ts
import { z } from 'zod';

// Schema validation for type safety
const GridDataSchema = z.object({
  timestamp: z.string(),
  state: z.string(),
  gridMix: z.object({
    coal: z.number(),
    gas: z.number(),
    renewable: z.number(),
    hydro: z.number(),
    other: z.number()
  }),
  carbonIntensity: z.number(),
  spotPrice: z.number().optional(),
  demand: z.number()
});

export class OpenElectricityClient {
  private apiKey: string;
  private baseURL = 'https://api.openelectricity.org.au/v1';
  private cache = new Map<string, { data: any; expires: number }>();

  constructor() {
    this.apiKey = process.env.OPENELECTRICITY_API_KEY!;
    if (!this.apiKey) {
      console.warn('🔋 No OpenElectricity API key found. Using mock data.');
    }
  }

  async getGridMix(state: string): Promise<typeof GridDataSchema._type> {
    const cacheKey = `grid-mix-${state}`;
    
    // Check cache (5-minute TTL for real-time data)
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseURL}/grid/mix/${state}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client': 'BatteryIQ-Calculator'
        }
      });

      if (!response.ok) {
        throw new Error(`Grid API grumpy: ${response.status}`);
      }

      const data = await response.json();
      const validated = GridDataSchema.parse(data);
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, {
        data: validated,
        expires: Date.now() + 5 * 60 * 1000
      });

      return validated;
    } catch (error) {
      console.error('Grid mix fetch failed:', error);
      return this.getFallbackGridData(state);
    }
  }

  private getFallbackGridData(state: string) {
    // Realistic fallback data when API is down
    const stateDefaults: Record<string, any> = {
      NSW: { coal: 60, gas: 10, renewable: 25, hydro: 5 },
      VIC: { coal: 65, gas: 8, renewable: 22, hydro: 5 },
      QLD: { coal: 70, gas: 7, renewable: 20, hydro: 3 },
      SA: { coal: 30, gas: 40, renewable: 28, hydro: 2 },
      WA: { coal: 40, gas: 45, renewable: 13, hydro: 2 },
      TAS: { coal: 0, gas: 0, renewable: 20, hydro: 80 },
    };

    return {
      timestamp: new Date().toISOString(),
      state,
      gridMix: stateDefaults[state] || stateDefaults.NSW,
      carbonIntensity: 0.65, // kg CO2/kWh average
      demand: 5000 // MW
    };
  }
}
```

### 2. AER Energy Plans Integration

```typescript
// lib/api-clients/aer-energy-plans.ts
interface TariffPlan {
  retailer: string;
  planName: string;
  tariffs: {
    peak: number;      // $/kWh
    offPeak: number;
    shoulder?: number;
    solar: number;     // Feed-in tariff
    daily: number;     // Daily supply charge
  };
  timeOfUse: boolean;
  batteryOptimized: boolean;
  estimatedSavings?: number;
}

export class AERPlansClient {
  private baseURL = 'https://www.aer.gov.au/api/cdr/energy';
  
  async getPlansForPostcode(
    postcode: string,
    monthlyUsage: number
  ): Promise<TariffPlan[]> {
    try {
      // Fetch up to 100 plans for the postcode
      const response = await fetch(
        `${this.baseURL}/plans?postcode=${postcode}&page-size=100`,
        { next: { revalidate: 86400 } } // Cache for 24 hours
      );

      if (!response.ok) {
        throw new Error('AER API is having a moment');
      }

      const data = await response.json();
      
      // Transform and rank plans
      const plans = data.data.map(this.transformPlan);
      
      // Sort by battery-friendliness
      return this.rankPlansForBatteries(plans, monthlyUsage);
    } catch (error) {
      console.error('AER plans fetch failed:', error);
      return this.getDefaultPlans();
    }
  }

  private transformPlan(aerPlan: any): TariffPlan {
    const tariffs = aerPlan.electricityContract?.tariffPeriod || [];
    
    return {
      retailer: aerPlan.brandName,
      planName: aerPlan.planName,
      tariffs: {
        peak: this.extractRate(tariffs, 'PEAK') || 0.45,
        offPeak: this.extractRate(tariffs, 'OFF_PEAK') || 0.22,
        shoulder: this.extractRate(tariffs, 'SHOULDER'),
        solar: aerPlan.solarFeedInTariff?.rates?.[0]?.unitPrice || 0.05,
        daily: aerPlan.electricityContract?.fees?.daily || 1.20
      },
      timeOfUse: tariffs.length > 1,
      batteryOptimized: this.isBatteryFriendly(aerPlan)
    };
  }

  private isBatteryFriendly(plan: any): boolean {
    const hasTimeOfUse = plan.electricityContract?.tariffPeriod?.length > 1;
    const hasGoodSpread = this.calculateTariffSpread(plan) > 0.15;
    const hasDecentFeedIn = plan.solarFeedInTariff?.rates?.[0]?.unitPrice > 0.04;
    
    return hasTimeOfUse && hasGoodSpread && hasDecentFeedIn;
  }

  private rankPlansForBatteries(
    plans: TariffPlan[],
    monthlyUsage: number
  ): TariffPlan[] {
    return plans
      .map(plan => ({
        ...plan,
        estimatedSavings: this.calculateBatterySavings(plan, monthlyUsage)
      }))
      .sort((a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0));
  }

  private calculateBatterySavings(
    plan: TariffPlan,
    monthlyUsage: number
  ): number {
    const dailyUsage = monthlyUsage / 30;
    const batteryCapacity = 13.5; // kWh typical
    
    // Time-of-use arbitrage
    const arbitrage = batteryCapacity * 0.9 * // efficiency
      (plan.tariffs.peak - plan.tariffs.offPeak) * 365;
    
    // Solar self-consumption value
    const solarStored = Math.min(dailyUsage * 0.4, batteryCapacity);
    const selfConsumption = solarStored * 365 * 
      (plan.tariffs.peak - plan.tariffs.solar);
    
    return arbitrage + selfConsumption;
  }

  private getDefaultPlans(): TariffPlan[] {
    // Fallback plans when API fails
    return [
      {
        retailer: 'Generic Energy Co',
        planName: 'Battery Saver Plus',
        tariffs: {
          peak: 0.45,
          offPeak: 0.22,
          shoulder: 0.30,
          solar: 0.05,
          daily: 1.20
        },
        timeOfUse: true,
        batteryOptimized: true,
        estimatedSavings: 1250
      }
    ];
  }

  private extractRate(tariffs: any[], type: string): number | undefined {
    const tariff = tariffs.find(t => t.type === type);
    return tariff?.rates?.[0]?.unitPrice;
  }

  private calculateTariffSpread(plan: any): number {
    const tariffs = plan.electricityContract?.tariffPeriod || [];
    if (tariffs.length < 2) return 0;
    
    const rates = tariffs.map(t => t.rates?.[0]?.unitPrice || 0);
    return Math.max(...rates) - Math.min(...rates);
  }
}
```

---

## 🎮 Gamification & Engagement Features

### 1. Energy Achievement System

```typescript
// lib/gamification/achievements.ts
export const achievements = {
  // Milestone Achievements
  firstCalculation: {
    id: 'first-calc',
    name: 'Energy Curious',
    description: 'Completed your first calculation',
    icon: '🔍',
    points: 10
  },
  
  highSaver: {
    id: 'high-saver',
    name: 'Power Player',
    description: 'Found savings over $2,000/year',
    icon: '💰',
    points: 50,
    shareMessage: "I'm saving ${amount}/year on energy! 🔋"
  },
  
  greenWarrior: {
    id: 'green-warrior',
    name: 'Carbon Crusher',
    description: 'Offset 5 tonnes of CO2 annually',
    icon: '🌱',
    points: 100,
    shareMessage: "I'm offsetting ${co2} tonnes of CO2 with solar + battery!"
  },
  
  propertyMogul: {
    id: 'property-mogul',
    name: 'Property Value Booster',
    description: 'Increased home value by $20,000+',
    icon: '🏡',
    points: 75
  },
  
  // Engagement Achievements
  returnVisitor: {
    id: 'return-visitor',
    name: 'Coming Back for More',
    description: 'Visited 3 days in a row',
    icon: '🔄',
    points: 20
  },
  
  socialSharer: {
    id: 'social-sharer',
    name: 'Energy Evangelist',
    description: 'Shared your results',
    icon: '📢',
    points: 30
  }
};

// Achievement checker
export function checkAchievements(userData: UserData): Achievement[] {
  const earned = [];
  
  if (userData.calculations === 1) {
    earned.push(achievements.firstCalculation);
  }
  
  if (userData.annualSavings > 2000) {
    earned.push(achievements.highSaver);
  }
  
  if (userData.co2Offset > 5000) {
    earned.push(achievements.greenWarrior);
  }
  
  return earned;
}