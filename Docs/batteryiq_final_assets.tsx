import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function BatteryIQAssets() {
  const [selectedColor, setSelectedColor] = useState('#FFE500');
  const [selectedSize, setSelectedSize] = useState('large');

  const colors = [
    { name: 'Electric Yellow', hex: '#FFE500', var: 'electric-yellow' },
    { name: 'Battery Green', hex: '#00D97E', var: 'battery-green' },
    { name: 'Grid Blue', hex: '#0073E6', var: 'grid-blue' },
    { name: 'Sunset Orange', hex: '#FF6B35', var: 'sunset-orange' },
    { name: 'Money Green', hex: '#10B981', var: 'money-green' },
    { name: 'Midnight Blue', hex: '#0B1929', var: 'midnight-blue' },
  ];

  const sizes = [
    { name: '16x16 (Favicon)', size: 16, viewBox: '0 0 80 80', id: 'favicon' },
    { name: '32x32', size: 32, viewBox: '0 0 80 80', id: 'small' },
    { name: '48x48', size: 48, viewBox: '0 0 80 80', id: 'medium' },
    { name: '128x128', size: 128, viewBox: '0 0 80 80', id: 'large' },
    { name: '256x256', size: 256, viewBox: '0 0 80 80', id: 'xlarge' },
  ];

  const AnimatedLogo = ({ color, size }) => (
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
  );

  const StaticLogo = ({ color, size, isFavicon }) => {
    const strokeWidth = isFavicon ? 8 : 7;
    const rectWidth = 70;
    const rectHeight = 56;
    const terminalWidth = 20;
    const terminalHeight = 9;
    
    return (
      <svg width={size} height={size} viewBox="0 0 80 80">
        <rect x="5" y="12" width={rectWidth} height={rectHeight} rx="3" fill="none" stroke={color} strokeWidth={strokeWidth}/>
        <rect x="30" y="3" width={terminalWidth} height={terminalHeight} rx="2" fill={color}/>
        <path
          d="M 9 40 Q 22 28, 35 40 Q 48 52, 61 40 Q 71 28, 75 40 L 75 64 L 9 64 Z"
          fill={color}
          opacity="0.5"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2" style={{ color: '#0B1929' }}>
            BatteryIQ Brand Assets
          </h1>
          <p className="text-gray-600">Complete package for implementation</p>
        </div>

        {/* Color Palette */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0B1929' }}>Brand Color Palette</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {colors.map(({ name, hex, var: varName }) => (
              <div
                key={hex}
                onClick={() => setSelectedColor(hex)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedColor === hex ? 'border-blue-500 shadow-md' : 'border-gray-200'
                }`}
              >
                <div
                  className="h-20 rounded-lg mb-3 border-2 border-gray-100"
                  style={{ backgroundColor: hex }}
                />
                <div className="text-sm font-semibold text-gray-900">{name}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">{hex}</div>
                <div className="text-xs text-gray-400 font-mono">--{varName}</div>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">Tailwind Config</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-x-auto">
{`colors: {
  'electric-yellow': '#FFE500',
  'battery-green': '#00D97E',
  'midnight-blue': '#0B1929',
  'grid-blue': '#0073E6',
  'sunset-orange': '#FF6B35',
  'money-green': '#10B981',
}`}
            </pre>
          </div>
        </div>

        {/* Animated Version */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0B1929' }}>Animated Logo (Loading State)</h2>
          <div className="bg-slate-900 rounded-lg p-12 flex items-center justify-center mb-6">
            <AnimatedLogo color={selectedColor} size={128} />
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">React Component (Framer Motion)</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-x-auto">
{`import { motion } from 'framer-motion';

export const BatteryIQLoader = ({ color = '#FFE500', size = 128 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80">
    <rect x="20" y="25" width="40" height="30" rx="2" 
          fill="none" stroke={color} strokeWidth="3"/>
    <rect x="35" y="20" width="10" height="5" rx="1" fill={color}/>
    <g clipPath="url(#batteryClip)">
      <motion.path
        d="M -40 40 Q -20 30, 0 40 Q 20 50, 40 40 Q 60 30, 80 40 Q 100 50, 120 40 Q 140 30, 160 40 Q 180 50, 200 40 L 200 70 L -40 70 Z"
        fill={color}
        opacity="0.5"
        animate={{ x: [0, -80] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </g>
    <defs>
      <clipPath id="batteryClip">
        <rect x="22" y="27" width="36" height="26" rx="1"/>
      </clipPath>
    </defs>
  </svg>
);`}
            </pre>
          </div>
        </div>

        {/* Static Versions */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0B1929' }}>Static Logo (Favicon & Icons)</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
            {sizes.map(({ name, size, id }) => (
              <div key={id} className="text-center">
                <div className="bg-slate-900 rounded-lg p-4 mb-2 flex items-center justify-center" style={{ minHeight: '120px' }}>
                  <StaticLogo color={selectedColor} size={size} isFavicon={id === 'favicon'} />
                </div>
                <div className="text-xs font-medium text-gray-700">{name}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">Static SVG Component</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-x-auto">
{`export const BatteryIQLogo = ({ color = '#FFE500', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80">
    <rect x="5" y="12" width="70" height="56" rx="3" 
          fill="none" stroke={color} strokeWidth="7"/>
    <rect x="30" y="3" width="20" height="9" rx="2" fill={color}/>
    <path
      d="M 9 40 Q 22 28, 35 40 Q 48 52, 61 40 Q 71 28, 75 40 L 75 64 L 9 64 Z"
      fill={color}
      opacity="0.5"
    />
  </svg>
);`}
            </pre>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">Favicon HTML (16x16)</h3>
            <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-x-auto">
{`<!-- In your <head> -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">

<!-- favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect x="5" y="12" width="70" height="56" rx="3" 
        fill="none" stroke="#FFE500" stroke-width="8"/>
  <rect x="30" y="3" width="20" height="9" rx="2" fill="#FFE500"/>
  <path d="M 9 40 Q 22 28, 35 40 Q 48 52, 61 40 L 75 40 L 75 64 L 9 64 Z" 
        fill="#FFE500" opacity="0.5"/>
</svg>`}
            </pre>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0B1929' }}>Usage Guidelines</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">When to use Animated vs Static:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">✓ Use Animated</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Loading states</li>
                    <li>• Page transitions</li>
                    <li>• Processing indicators</li>
                    <li>• Dashboard refreshing</li>
                    <li>• App initialization</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">✓ Use Static</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Favicons</li>
                    <li>• App icons</li>
                    <li>• Navigation logos</li>
                    <li>• Email signatures</li>
                    <li>• Social media avatars</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Color Recommendations:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Primary Usage</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Electric Yellow (#FFE500):</strong> Main brand color, high energy</li>
                    <li>• <strong>Battery Green (#00D97E):</strong> Success states, savings</li>
                    <li>• <strong>Midnight Blue (#0B1929):</strong> Dark backgrounds, premium feel</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Contextual Usage</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Grid Blue (#0073E6):</strong> Grid/utility related features</li>
                    <li>• <strong>Sunset Orange (#FF6B35):</strong> Warnings, peak pricing</li>
                    <li>• <strong>Money Green (#10B981):</strong> Financial savings</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Technical Notes:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• The wave animation is seamless (loops perfectly without visible restart)</li>
                <li>• Animation duration: 4 seconds with linear easing</li>
                <li>• Wave pattern repeats every 40px horizontally with 10px amplitude</li>
                <li>• All SVGs use viewBox="0 0 80 80" for consistent scaling</li>
                <li>• Favicon uses 8px stroke width for better visibility at 16x16</li>
                <li>• Larger sizes use 7px stroke width for optimal appearance</li>
                <li>• Wave opacity set to 0.5 for subtle energy effect</li>
              </ul>
            </div>
          </div>
        </div>

        {/* File Exports */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0B1929' }}>File Export Checklist</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">For Claude Code Implementation:</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✓ Copy the React component code above</li>
                <li>✓ Install framer-motion: <code className="bg-yellow-100 px-2 py-1 rounded">npm install framer-motion</code></li>
                <li>✓ Add Tailwind color variables to your config</li>
                <li>✓ Export static SVG for favicon.svg</li>
                <li>✓ Generate PNG versions for social media (use any SVG to PNG converter)</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Component Files Needed</h4>
                <ul className="text-sm text-gray-700 space-y-1 font-mono">
                  <li>• BatteryIQLogo.tsx</li>
                  <li>• BatteryIQLoader.tsx</li>
                  <li>• favicon.svg</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">PNG Exports Needed</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• logo-16.png (favicon fallback)</li>
                  <li>• logo-32.png</li>
                  <li>• logo-192.png (Android)</li>
                  <li>• logo-512.png (iOS)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}