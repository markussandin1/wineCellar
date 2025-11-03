/**
 * Wine Cellar Design System - Fonts
 *
 * Font definitions for the Wine Cellar application.
 */

import { Playfair_Display } from 'next/font/google';

/**
 * Playfair Display - Elegant serif for headings and wine names
 *
 * Usage:
 *   import { playfair } from '@/lib/design-system/fonts';
 *   <h1 className={playfair.className}>Title</h1>
 */
export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-playfair'
});
