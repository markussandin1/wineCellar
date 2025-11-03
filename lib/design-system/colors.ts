/**
 * Wine Cellar Design System - Color Constants
 *
 * This file contains all color values used in the Wine Cellar design system.
 * Colors are optimized for WCAG AA accessibility compliance on dark backgrounds.
 */

/**
 * Background Colors - Wine Cellar Aesthetic
 */
export const backgrounds = {
  deepBlack: '#0A0A0A',      // Main background
  cellarBrown: '#1A1410',    // Cards and elevated surfaces
  oakBarrel: '#2A1F1A',      // Secondary cards, hover states
  agedWood: '#1C1410',       // Alternative background
} as const;

/**
 * Accent Colors - Warm Amber & Gold
 */
export const accents = {
  amber200: '#FCD9B6',       // Light amber for gradients
  amber300: '#FCD34D',       // Medium amber
  amber400: '#FBBF24',       // Primary accent color (links, CTAs)
  amber500: '#F59E0B',       // Darker amber for gradients
  yellow400: '#FACC15',      // Highlight and emphasis
} as const;

/**
 * Wine Type Colors - Used for type indicators and badges
 */
export const wineTypes = {
  red: {
    from: '#7F1D1D',         // red-900
    to: '#450A0A',           // red-950
    accent: '#DC2626',       // red-600
  },
  white: {
    from: '#FEF3C7',         // amber-100
    to: '#FCD34D',           // amber-300
    accent: '#FBBF24',       // amber-400
  },
  rose: {
    from: '#FBCFE8',         // pink-200
    to: '#F472B6',           // pink-400
    accent: '#EC4899',       // pink-500
  },
  sparkling: {
    from: '#FEF08A',         // yellow-200
    to: '#FBBF24',           // amber-400
    accent: '#FACC15',       // yellow-400
  },
  dessert: {
    from: '#FDE68A',         // yellow-200
    to: '#F59E0B',           // amber-500
    accent: '#F59E0B',       // amber-500
  },
  fortified: {
    from: '#FCA5A5',         // red-300
    to: '#DC2626',           // red-600
    accent: '#EF4444',       // red-500
  },
} as const;

/**
 * Text Colors - Optimized for readability
 */
export const text = {
  primary: '#F3F4F6',        // gray-100 - Main body text (reduces eye strain)
  secondary: '#E5E7EB',      // gray-200 - Secondary information
  tertiary: '#D1D5DB',       // gray-300 - Metadata
  muted: '#9CA3AF',          // gray-400 - Subtle labels (18pt+ only)
  disabled: '#6B7280',       // gray-500 - Non-essential info
  white: '#FFFFFF',          // Pure white - Headings only
} as const;

/**
 * Gradient Definitions - Signature wine cellar gradients
 */
export const gradients = {
  cellarBackground: 'from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]',
  candlelightGlow: 'from-amber-200 via-yellow-400 to-amber-500',
  warmEmber: 'from-amber-400/20 to-yellow-500/10',
  oakBarrel: 'from-[#2A1F1A] to-[#1A1410]',
  goldHighlight: 'from-amber-500/0 via-amber-400/30 to-amber-500/0',
  agedPatina: 'from-amber-900/20 via-transparent to-yellow-800/10',
} as const;

/**
 * Border Colors - Subtle amber glow
 */
export const borders = {
  subtle: 'border-amber-900/20',
  medium: 'border-amber-900/30',
  strong: 'border-amber-500/30',
  focus: 'border-amber-400',
} as const;

/**
 * Shadow Definitions
 */
export const shadows = {
  subtle: 'shadow-sm',
  card: 'shadow-lg shadow-amber-900/20',
  glow: 'shadow-2xl shadow-amber-500/30',
  button: 'shadow-lg shadow-amber-500/20',
} as const;

/**
 * Helper function to get wine type gradient classes
 */
export function getWineTypeGradient(wineType: keyof typeof wineTypes): string {
  const colors = wineTypes[wineType];
  return `bg-gradient-to-br from-[${colors.from}] to-[${colors.to}]`;
}

/**
 * Helper function to get wine type accent color
 */
export function getWineTypeAccent(wineType: keyof typeof wineTypes): string {
  return wineTypes[wineType].accent;
}

/**
 * Type definitions
 */
export type WineType = keyof typeof wineTypes;
export type BackgroundColor = keyof typeof backgrounds;
export type AccentColor = keyof typeof accents;
export type TextColor = keyof typeof text;
