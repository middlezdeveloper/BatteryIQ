import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // BatteryIQ Rebrand - Energetic but Sophisticated
        'electric-yellow': '#FFE500',    // Solar energy, optimism
        'battery-green': '#00D97E',      // Savings, sustainability
        'midnight-blue': '#0B1929',      // Premium, trustworthy
        'grid-blue': '#0073E6',          // Grid connection
        'sunset-orange': '#FF6B35',      // Peak pricing warnings
        'morning-sky': '#E8F4FD',        // Soft backgrounds
        'money-green': '#10B981',        // Savings indicators
        'warning-amber': '#F59E0B',      // Attention grabbers
        'trust-navy': '#1E293B',         // Text, authority
        'whisper-gray': '#F8FAFC',       // Backgrounds
        'chat-gray': '#94A3B8',          // Secondary text
        'serious-gray': '#475569',       // Important text

        // Legacy colors for compatibility
        batteryGreen: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00D97E',  // Updated to match rebrand
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        solarYellow: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FFE500',  // Updated to match rebrand
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
      },
      fontFamily: {
        'heading': ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        'body': ['Inter', '-apple-system', 'sans-serif'],
        'accent': ['Space Grotesk', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;