'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface LogoProps {
  color?: string
  size?: number
  className?: string
  animated?: boolean
  clickable?: boolean
  showText?: boolean
}

export const BatteryIQLogo = ({
  color = '#00D97E',
  size = 48,
  className = '',
  animated = false,
  clickable = false,
  showText = false
}: LogoProps) => {
  const logoContent = animated ? (
    <AnimatedLogo color={color} size={size} />
  ) : (
    <StaticLogo color={color} size={size} />
  )

  const content = showText ? (
    <div className="flex items-center space-x-3">
      {logoContent}
      <span className="text-2xl font-heading font-bold text-midnight-blue">BatteryIQ</span>
    </div>
  ) : logoContent

  if (clickable) {
    return (
      <Link href="/" className={`inline-block ${className}`}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {content}
        </motion.div>
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

const StaticLogo = ({ color, size }: { color: string; size: number }) => {
  const strokeWidth = size <= 32 ? 8 : 7
  const rectWidth = 70
  const rectHeight = 56
  const terminalWidth = 20
  const terminalHeight = 9

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="transition-transform duration-200">
      <rect
        x="5"
        y="12"
        width={rectWidth}
        height={rectHeight}
        rx="3"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <rect
        x="30"
        y="3"
        width={terminalWidth}
        height={terminalHeight}
        rx="2"
        fill={color}
      />
      <path
        d="M 9 40 Q 22 28, 35 40 Q 48 52, 61 40 Q 71 28, 75 40 L 75 64 L 9 64 Z"
        fill={color}
        opacity="0.5"
      />
    </svg>
  )
}

const AnimatedLogo = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80">
    <rect x="20" y="25" width="40" height="30" rx="2" fill="none" stroke={color} strokeWidth="3"/>
    <rect x="35" y="20" width="10" height="5" rx="1" fill={color}/>
    <g clipPath="url(#batteryClipAnimated)">
      <motion.path
        d="M -40 40 Q -20 30, 0 40 Q 20 50, 40 40 Q 60 30, 80 40 Q 100 50, 120 40 Q 140 30, 160 40 Q 180 50, 200 40 L 200 70 L -40 70 Z"
        fill={color}
        opacity="0.5"
        animate={{ x: [0, -80] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </g>
    <defs>
      <clipPath id="batteryClipAnimated">
        <rect x="22" y="27" width="36" height="26" rx="1"/>
      </clipPath>
    </defs>
  </svg>
)

export const BatteryIQLoader = ({
  color = '#00D97E',
  size = 128,
  className = ''
}: LogoProps) => (
  <div className={`flex items-center justify-center ${className}`}>
    <AnimatedLogo color={color} size={size} />
  </div>
)

export default BatteryIQLogo