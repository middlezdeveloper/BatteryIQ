// BatteryIQ Brand Voice & Messaging
// Inspired by Oatly's playful irreverence and Duolingo's gamified engagement

export const BRAND_VOICE = {
  // Loading States (Instead of boring spinners)
  loadingMessages: [
    "Interrogating the grid monopoly...",
    "Teaching electrons to behave...",
    "Calculating your revenge on power companies...",
    "Finding money hiding in your roof...",
    "Asking the sun for a favor...",
    "Converting sunshine to cold hard cash...",
    "Negotiating better rates with photons...",
    "Convincing batteries to play nice...",
    "Outsmarting the energy market...",
    "Running the numbers (twice, for safety)..."
  ],

  // Success Messages
  successMessages: {
    highSavings: (amount: number) => `Holy renewable resources! You could save $${amount.toLocaleString()} per year! 🔋`,
    mediumSavings: (amount: number) => `Not bad! $${amount.toLocaleString()} stays in your pocket instead of theirs.`,
    lowSavings: (amount: number, beers: number) => `Every dollar counts! $${amount.toLocaleString()} saved is ${beers} beers earned. 🍺`,
    propertyValue: (value: number) => `Plus your house just became $${value.toLocaleString()} more attractive. You're welcome, future you.`,
    evSavings: (amount: number) => `EV charging could save you another $${amount.toLocaleString()}/year. The future is electric! ⚡`,
    rebateEligible: (amount: number) => `Ka-ching! You qualify for $${amount.toLocaleString()} in rebates. Government money feels different, doesn't it?`
  },

  // Error Messages (Make failures fun)
  errorMessages: {
    postcodeInvalid: "That postcode seems made up. Try again, but with real numbers this time.",
    apiDown: "The government's computers are having a nap. We'll use our backup brain instead.",
    noSavings: "Hmm, you might already be an energy genius. Or you typed something weird.",
    networkError: "The internet hiccupped. Even the best of us stumble sometimes.",
    calculationError: "Our calculator had a moment. Let's try that again, shall we?"
  },

  // Interactive Messages
  interactionMessages: {
    postcodeEntry: "Where's home? (We promise not to visit unannounced)",
    householdSize: "How many humans share your electricity bill?",
    solarQuestions: "Tell us about your solar situation (or lack thereof)",
    evQuestions: "Electric vehicle chat - the future is calling",
    billQuestions: "Let's talk money. Your quarterly bill is...?",
    resultsReady: "Drumroll please... Your energy liberation plan is ready! 🥁"
  },

  // Motivational Copy
  motivationalCopy: {
    solarBenefits: "Solar panels: because paying for sunshine feels wrong.",
    batteryBenefits: "Batteries aren't magic. But they're pretty bloody close.",
    combinedSystem: "Solar + Battery = Your personal power station. Take that, grid!",
    environmentalImpact: "Save money AND the planet? It's almost too good to be true. Almost.",
    propertyValue: "Your house is about to become the cool house on the block."
  },

  // Call-to-Action Copy
  ctaCopy: {
    getStarted: "Start Your Energy Revolution",
    calculateSavings: "Show Me The Money",
    findInstallers: "Connect Me With Experts",
    shareResults: "Spread The Energy Gospel",
    downloadReport: "Give Me The Paperwork"
  }
}

// Random message helpers
export function getRandomLoadingMessage(): string {
  return BRAND_VOICE.loadingMessages[Math.floor(Math.random() * BRAND_VOICE.loadingMessages.length)]
}

export function formatSavingsMessage(amount: number): string {
  const beers = Math.floor(amount / 8) // $8 per beer average

  if (amount > 2000) {
    return BRAND_VOICE.successMessages.highSavings(amount)
  } else if (amount > 800) {
    return BRAND_VOICE.successMessages.mediumSavings(amount)
  } else {
    return BRAND_VOICE.successMessages.lowSavings(amount, beers)
  }
}

// Brand Colors (TypeScript constants)
export const BRAND_COLORS = {
  electricYellow: '#FFE500',
  batteryGreen: '#00D97E',
  midnightBlue: '#0B1929',
  gridBlue: '#0073E6',
  sunsetOrange: '#FF6B35',
  morningSky: '#E8F4FD',
  moneyGreen: '#10B981',
  warningAmber: '#F59E0B',
  trustNavy: '#1E293B',
  whisperGray: '#F8FAFC',
  chatGray: '#94A3B8',
  seriousGray: '#475569'
} as const

// Typography
export const BRAND_FONTS = {
  heading: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Inter', -apple-system, sans-serif",
  accent: "'Space Grotesk', monospace"
} as const