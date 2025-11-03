import { playfair } from '@/lib/design-system/fonts';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A] text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <h1 className={`${playfair.className} text-5xl font-bold mb-4 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent`}>
            Wine Cellar Design System
          </h1>
          <p className="text-gray-300 text-lg">Dark wine cellar aesthetic with warm amber accents</p>
          <p className="text-sm text-amber-400 mt-2">✓ WCAG AA Compliant • Optimized for readability</p>
        </div>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className={`${playfair.className} text-3xl font-bold mb-8 text-amber-400`}>Color Palette</h2>

          {/* Dark Backgrounds */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Backgrounds (Wine Cellar Dark)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-24 bg-[#0A0A0A] rounded-lg border border-gray-800"></div>
                <p className="text-sm text-gray-300">#0A0A0A</p>
                <p className="text-xs text-gray-400">Deep Black</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#1A1410] rounded-lg border border-gray-800"></div>
                <p className="text-sm text-gray-300">#1A1410</p>
                <p className="text-xs text-gray-400">Cellar Brown</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#2A1F1A] rounded-lg border border-gray-800"></div>
                <p className="text-sm text-gray-300">#2A1F1A</p>
                <p className="text-xs text-gray-400">Oak Barrel</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#1C1410] rounded-lg border border-gray-800"></div>
                <p className="text-sm text-gray-300">#1C1410</p>
                <p className="text-xs text-gray-400">Aged Wood</p>
              </div>
            </div>
          </div>

          {/* Accent Colors */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Accents (Warm Amber & Gold)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-24 bg-amber-200 rounded-lg"></div>
                <p className="text-sm text-gray-300">#FCD9B6</p>
                <p className="text-xs text-gray-400">Amber 200</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-amber-300 rounded-lg"></div>
                <p className="text-sm text-gray-300">#FCD34D</p>
                <p className="text-xs text-gray-400">Amber 300</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-amber-400 rounded-lg"></div>
                <p className="text-sm text-gray-300">#FBBF24</p>
                <p className="text-xs text-gray-400">Amber 400</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-amber-500 rounded-lg"></div>
                <p className="text-sm text-gray-300">#F59E0B</p>
                <p className="text-xs text-gray-400">Amber 500</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-yellow-400 rounded-lg"></div>
                <p className="text-sm text-gray-300">#FACC15</p>
                <p className="text-xs text-gray-400">Yellow 400</p>
              </div>
            </div>
          </div>

          {/* Wine Type Colors */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Wine Type Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-24 bg-gradient-to-br from-red-900 to-red-950 rounded-lg"></div>
                <p className="text-sm text-gray-300">#7F1D1D → #450A0A</p>
                <p className="text-xs text-gray-400">Red Wine</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-gradient-to-br from-amber-100 to-amber-300 rounded-lg"></div>
                <p className="text-sm text-gray-300">#FEF3C7 → #FCD34D</p>
                <p className="text-xs text-gray-400">White Wine</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-gradient-to-br from-pink-200 to-pink-400 rounded-lg"></div>
                <p className="text-sm text-gray-300">#FBCFE8 → #F472B6</p>
                <p className="text-xs text-gray-400">Rosé</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-gradient-to-br from-yellow-200 to-amber-400 rounded-lg"></div>
                <p className="text-sm text-gray-300">#FEF08A → #FBBF24</p>
                <p className="text-xs text-gray-400">Sparkling</p>
              </div>
            </div>
          </div>

          {/* Grays */}
          <div>
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Grays (Stone & Slate)</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="space-y-2">
                  <div className={`h-16 bg-gray-${shade} rounded-lg border border-gray-700`}></div>
                  <p className="text-xs text-gray-400">Gray {shade}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Text Contrast & Accessibility */}
        <section className="mb-16">
          <h2 className={`${playfair.className} text-3xl font-bold mb-8 text-amber-400`}>Text Contrast & Accessibility</h2>
          <p className="text-gray-200 mb-8">All text colors meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text) on dark backgrounds.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Text */}
            <div className="bg-[#1A1410] p-6 rounded-lg border border-amber-900/20">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Primary Text</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-100 mb-1">text-gray-100 - Body text (Recommended)</p>
                  <code className="text-xs text-gray-400">#F3F4F6 • Reduces eye strain vs pure white</code>
                </div>
                <div>
                  <p className="text-white mb-1">text-white - Headings & emphasis</p>
                  <code className="text-xs text-gray-400">#FFFFFF • Use for titles only</code>
                </div>
              </div>
            </div>

            {/* Secondary Text */}
            <div className="bg-[#1A1410] p-6 rounded-lg border border-amber-900/20">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Secondary Text</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-200 mb-1">text-gray-200 - Secondary info</p>
                  <code className="text-xs text-gray-400">#E5E7EB • High contrast</code>
                </div>
                <div>
                  <p className="text-gray-300 mb-1">text-gray-300 - Metadata</p>
                  <code className="text-xs text-gray-400">#D1D5DB • WCAG AA compliant</code>
                </div>
              </div>
            </div>

            {/* Tertiary Text */}
            <div className="bg-[#1A1410] p-6 rounded-lg border border-amber-900/20">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Tertiary Text</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 mb-1">text-gray-400 - Subtle labels</p>
                  <code className="text-xs text-gray-400">#9CA3AF • Use for large text only (18pt+)</code>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">text-gray-500 - Disabled/non-essential</p>
                  <code className="text-xs text-gray-400">#6B7280 • Non-critical info only</code>
                </div>
              </div>
            </div>

            {/* Accent Text */}
            <div className="bg-[#1A1410] p-6 rounded-lg border border-amber-900/20">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Accent Colors</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-amber-400 mb-1">text-amber-400 - Interactive elements</p>
                  <code className="text-xs text-gray-400">#FBBF24 • Links, CTAs, highlights</code>
                </div>
                <div>
                  <p className="text-yellow-400 mb-1">text-yellow-400 - Emphasis</p>
                  <code className="text-xs text-gray-400">#FACC15 • Important values</code>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="mt-8 bg-[#1A1410] p-8 rounded-lg border border-amber-900/20">
            <h3 className={`${playfair.className} text-xl font-semibold text-white mb-6`}>Real-world Examples</h3>

            {/* Example 1: Card */}
            <div className="bg-[#2A1F1A] p-6 rounded-lg border border-amber-900/20 mb-6">
              <h4 className={`${playfair.className} text-white text-lg font-semibold mb-2`}>Château Margaux 1982</h4>
              <p className="text-gray-200 mb-3">A legendary vintage from Bordeaux, showcasing exceptional balance and complexity.</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Bordeaux, France</span>
                <span className="text-amber-400 font-semibold">SEK 4,500</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <span className="text-gray-400 text-xs">Added 3 days ago</span>
              </div>
            </div>

            {/* Example 2: List Item */}
            <div className="bg-[#2A1F1A] p-4 rounded-lg border border-amber-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className={`${playfair.className} text-gray-100 font-medium`}>Barolo Monfortino</h5>
                  <p className="text-gray-300 text-sm">Giacomo Conterno • 2016</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-semibold">SEK 3,200</p>
                  <p className="text-gray-400 text-xs">In stock</p>
                </div>
              </div>
            </div>
          </div>

          {/* Accessibility Notes */}
          <div className="mt-8 p-6 bg-amber-900/10 border border-amber-500/20 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-400 mb-3">♿ Accessibility Guidelines</h3>
            <ul className="space-y-2 text-gray-200 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Never use text-gray-400 or darker</strong> for body text or small labels - insufficient contrast</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Prefer text-gray-100 over text-white</strong> for body text - reduces halation and eye strain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Reserve gradient text</strong> for hero moments (large headings, stat numbers) - not for UI text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Test all custom colors</strong> at WebAIM contrast checker before using</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Gradients */}
        <section className="mb-16">
          <h2 className={`${playfair.className} text-3xl font-bold mb-8 text-amber-400`}>Signature Gradients</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cellar Background */}
            <div className="space-y-3">
              <div className="h-32 bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A] rounded-lg border border-gray-800"></div>
              <p className="text-sm text-gray-300 font-semibold">Cellar Background</p>
              <code className="text-xs text-gray-400 block">from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]</code>
            </div>

            {/* Candlelight Glow */}
            <div className="space-y-3">
              <div className="h-32 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 rounded-lg"></div>
              <p className="text-sm text-gray-300 font-semibold">Candlelight Glow</p>
              <code className="text-xs text-gray-400 block">from-amber-200 via-yellow-400 to-amber-500</code>
            </div>

            {/* Warm Ember */}
            <div className="space-y-3">
              <div className="h-32 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-lg border border-amber-500/20"></div>
              <p className="text-sm text-gray-300 font-semibold">Warm Ember (Subtle Overlay)</p>
              <code className="text-xs text-gray-400 block">from-amber-400/20 to-yellow-500/10</code>
            </div>

            {/* Oak Barrel */}
            <div className="space-y-3">
              <div className="h-32 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] rounded-lg border border-amber-900/30"></div>
              <p className="text-sm text-gray-300 font-semibold">Oak Barrel</p>
              <code className="text-xs text-gray-400 block">from-[#2A1F1A] to-[#1A1410]</code>
            </div>

            {/* Gold Highlight */}
            <div className="space-y-3">
              <div className="h-32 bg-gradient-to-r from-amber-500/0 via-amber-400/30 to-amber-500/0 rounded-lg"></div>
              <p className="text-sm text-gray-300 font-semibold">Gold Highlight (Border/Divider)</p>
              <code className="text-xs text-gray-400 block">from-amber-500/0 via-amber-400/30 to-amber-500/0</code>
            </div>

            {/* Aged Patina */}
            <div className="space-y-3">
              <div className="h-32 bg-gradient-to-tl from-amber-900/20 via-transparent to-yellow-800/10 rounded-lg border border-amber-900/20"></div>
              <p className="text-sm text-gray-300 font-semibold">Aged Patina</p>
              <code className="text-xs text-gray-400 block">from-amber-900/20 via-transparent to-yellow-800/10</code>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className={`${playfair.className} text-3xl font-bold mb-8 text-amber-400`}>Typography</h2>

          {/* Font Pairing Overview */}
          <div className="mb-8 p-6 bg-amber-900/10 border border-amber-500/20 rounded-lg">
            <h3 className={`${playfair.className} text-xl font-semibold text-amber-400 mb-4`}>Font Pairing Philosophy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className={`${playfair.className} text-2xl font-bold text-white mb-2`}>Playfair Display</p>
                <p className="text-gray-200 mb-2">Elegant serif for sophistication and prestige</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• All headings (h1, h2, h3, h4)</li>
                  <li>• Wine names in cards</li>
                  <li>• Feature titles</li>
                  <li>• Weights: 400-900</li>
                </ul>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-2">Inter</p>
                <p className="text-gray-200 mb-2">Modern sans-serif for perfect readability</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• All body text (p)</li>
                  <li>• Buttons and CTAs</li>
                  <li>• Labels and metadata</li>
                  <li>• Form inputs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Heading Styles */}
          <div className="space-y-6 bg-[#1A1410] p-8 rounded-lg border border-amber-900/20 mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-amber-400`}>Headings (Playfair Display)</h3>

            <div>
              <h1 className={`${playfair.className} text-6xl font-bold mb-2`}>Display Heading</h1>
              <p className="text-sm text-gray-300">font-[&apos;Playfair_Display&apos;] • text-6xl font-bold • text-white</p>
            </div>
            <div>
              <h2 className={`${playfair.className} text-5xl font-bold mb-2`}>Page Title</h2>
              <p className="text-sm text-gray-300">font-[&apos;Playfair_Display&apos;] • text-5xl font-bold • text-white</p>
            </div>
            <div>
              <h3 className={`${playfair.className} text-3xl font-semibold mb-2`}>Section Header</h3>
              <p className="text-sm text-gray-300">font-[&apos;Playfair_Display&apos;] • text-3xl font-semibold • text-white or text-amber-400</p>
            </div>
            <div>
              <h4 className={`${playfair.className} text-xl font-semibold mb-2 text-gray-100`}>Card Title</h4>
              <p className="text-sm text-gray-300">font-[&apos;Playfair_Display&apos;] • text-xl font-semibold • text-gray-100 or text-white</p>
            </div>
          </div>

          {/* Body Text Styles */}
          <div className="space-y-6 bg-[#1A1410] p-8 rounded-lg border border-amber-900/20">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-amber-400`}>Body Text (Inter)</h3>

            <div>
              <p className="text-base text-gray-100 mb-2">Body text with excellent readability in the wine cellar dark theme. Use text-gray-100 to reduce eye strain compared to pure white.</p>
              <p className="text-sm text-gray-300">font-[&apos;Inter&apos;] • text-base • text-gray-100 (recommended for paragraphs)</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-2">Secondary text for metadata and descriptions.</p>
              <p className="text-sm text-gray-300">font-[&apos;Inter&apos;] • text-sm • text-gray-300 (WCAG AA compliant)</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Tiny text for labels and captions (use sparingly).</p>
              <p className="text-sm text-gray-300">font-[&apos;Inter&apos;] • text-xs • text-gray-400 (non-essential info only)</p>
            </div>
            <div>
              <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg">
                Button Text
              </button>
              <p className="text-sm text-gray-300 mt-2">font-[&apos;Inter&apos;] • font-semibold • Used in all buttons</p>
            </div>
          </div>

          {/* Gradient Text Examples */}
          <div className="mt-8 space-y-4 bg-[#1A1410] p-8 rounded-lg border border-amber-900/20">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-amber-400`}>Gradient Text Effects (Hero Moments Only)</h3>
            <p className="text-sm text-gray-300 mb-6">Use gradient text sparingly for maximum impact - hero headings and large stat numbers only.</p>

            <div className="space-y-6">
              <div>
                <h1 className={`${playfair.className} text-5xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2`}>
                  Premium Wine Collection
                </h1>
                <p className="text-xs text-gray-400">✓ Large hero heading - Playfair Display with gradient</p>
              </div>

              <div>
                <h2 className={`${playfair.className} text-3xl font-semibold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent mb-2`}>
                  1982 Château Margaux
                </h2>
                <p className="text-xs text-gray-400">✓ Feature title - Playfair Display adds elegance</p>
              </div>

              <div>
                <p className={`${playfair.className} text-6xl font-bold bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent mb-2`}>
                  42
                </p>
                <p className="text-xs text-gray-400">✓ Large stat number - perfect for gradients</p>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h4 className={`${playfair.className} text-lg font-semibold text-amber-400 mb-2`}>For UI text, use solid colors:</h4>
                <p className="text-gray-300 mb-1">Headings - Playfair Display • text-white or text-amber-400</p>
                <p className="text-gray-300 mb-1">Card text - Inter • text-gray-100</p>
                <p className="text-gray-300 mb-1">Links/CTAs - Inter • text-amber-400</p>
                <p className="text-gray-300">Metadata - Inter • text-gray-300</p>
              </div>
            </div>
          </div>
        </section>

        {/* Component Examples */}
        <section className="mb-16">
          <h2 className={`${playfair.className} text-3xl font-bold mb-8 text-amber-400`}>Component Examples</h2>

          {/* Stat Cards */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Stat Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Bottles */}
              <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-300 uppercase tracking-wider">Total Bottles</p>
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent mb-2">
                    42
                  </p>
                  <p className="text-sm text-gray-300">In your cellar</p>
                </div>
              </div>

              {/* Total Value */}
              <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-amber-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-300 uppercase tracking-wider">Total Value</p>
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent mb-2">
                    SEK 15,240
                  </p>
                  <p className="text-sm text-gray-300">Collection value</p>
                </div>
              </div>

              {/* Wine Types */}
              <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-yellow-400/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-300 uppercase tracking-wider">Wine Types</p>
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent mb-2">
                    5
                  </p>
                  <p className="text-sm text-gray-300">Different types</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Buttons</h3>
            <div className="flex flex-wrap gap-4">
              {/* Primary */}
              <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-lg shadow-amber-500/20">
                Primary Action
              </button>

              {/* Secondary */}
              <button className="px-6 py-3 bg-[#2A1F1A] border border-amber-500/30 text-amber-400 font-semibold rounded-lg hover:bg-[#3A2F2A] hover:border-amber-400/50 transition-all">
                Secondary Action
              </button>

              {/* Outline */}
              <button className="px-6 py-3 border border-amber-400 text-amber-400 font-semibold rounded-lg hover:bg-amber-400/10 transition-all">
                Outline Button
              </button>

              {/* Ghost */}
              <button className="px-6 py-3 text-gray-400 font-semibold rounded-lg hover:bg-white/5 transition-all">
                Ghost Button
              </button>
            </div>
          </div>

          {/* Wine Cards */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Wine Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Red Wine Card */}
              <div className="group relative overflow-hidden rounded-xl border border-red-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 hover:scale-105 transition-all cursor-pointer shadow-lg hover:shadow-red-900/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-900/30 to-red-950/20 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-900 to-red-950 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 2h10v2h-1v15c0 1.654-1.346 3-3 3s-3-1.346-3-3V4H9V2z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">Red</span>
                  </div>
                  <h4 className={`${playfair.className} text-xl font-bold mb-1 text-gray-100`}>Barolo</h4>
                  <p className="text-sm text-gray-300 mb-2">Josetta Saffirio • 2021</p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">SEK 450</span>
                    <span className="text-xs text-gray-400">Added 2 days ago</span>
                  </div>
                </div>
              </div>

              {/* White Wine Card */}
              <div className="group relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 hover:scale-105 transition-all cursor-pointer shadow-lg hover:shadow-amber-900/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/30 to-yellow-500/20 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 2h10v2h-1v15c0 1.654-1.346 3-3 3s-3-1.346-3-3V4H9V2z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">White</span>
                  </div>
                  <h4 className={`${playfair.className} text-xl font-bold mb-1 text-gray-100`}>Chardonnay</h4>
                  <p className="text-sm text-gray-300 mb-2">Matias Riccitelli • 2022</p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">SEK 280</span>
                    <span className="text-xs text-gray-400">Added 1 week ago</span>
                  </div>
                </div>
              </div>

              {/* Sparkling Wine Card */}
              <div className="group relative overflow-hidden rounded-xl border border-yellow-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 hover:scale-105 transition-all cursor-pointer shadow-lg hover:shadow-yellow-900/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/30 to-amber-500/20 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 2h10v2h-1v15c0 1.654-1.346 3-3 3s-3-1.346-3-3V4H9V2z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">Sparkling</span>
                  </div>
                  <h4 className={`${playfair.className} text-xl font-bold mb-1 text-gray-100`}>Prosecco</h4>
                  <p className="text-sm text-gray-300 mb-2">Nino Franco • NV</p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">SEK 180</span>
                    <span className="text-xs text-gray-400">Added 3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Fields */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-semibold mb-4 text-gray-300`}>Form Inputs</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Wine Name</label>
                <input
                  type="text"
                  placeholder="Enter wine name..."
                  className="w-full px-4 py-3 bg-[#1A1410] border border-amber-900/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search your cellar..."
                    className="w-full pl-10 pr-4 py-3 bg-[#1A1410] border border-amber-900/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                  />
                  <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shadows & Effects */}
        <section className="mb-16">
          <h2 className={`${playfair.className} text-3xl font-bold mb-8 text-amber-400`}>Shadows & Effects</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="h-32 bg-[#2A1F1A] rounded-lg shadow-sm border border-gray-800"></div>
              <p className="text-sm text-gray-300 font-semibold">Subtle (shadow-sm)</p>
              <code className="text-xs text-gray-400 block">shadow-sm</code>
            </div>

            <div className="space-y-3">
              <div className="h-32 bg-[#2A1F1A] rounded-lg shadow-lg shadow-amber-900/20 border border-amber-900/30"></div>
              <p className="text-sm text-gray-300 font-semibold">Card Shadow</p>
              <code className="text-xs text-gray-400 block">shadow-lg shadow-amber-900/20</code>
            </div>

            <div className="space-y-3">
              <div className="h-32 bg-[#2A1F1A] rounded-lg shadow-2xl shadow-amber-500/30 border border-amber-500/30"></div>
              <p className="text-sm text-gray-300 font-semibold">Glow Effect</p>
              <code className="text-xs text-gray-400 block">shadow-2xl shadow-amber-500/30</code>
            </div>
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="mb-16">
          <h2 className={`${playfair.className} text-3xl font-bold mb-8 text-amber-400`}>Design Guidelines</h2>

          <div className="space-y-6 bg-[#1A1410] p-8 rounded-lg border border-amber-900/20">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-amber-400">Color Philosophy</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>90% Dark:</strong> Use dark backgrounds (#0A0A0A, #1A1410, #2A1F1A) for main surfaces</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>10% Warm Accents:</strong> Strategic use of amber/gold for CTAs, highlights, and important elements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Wine Type Coding:</strong> Use wine-specific gradients for type indicators</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Cellar Atmosphere:</strong> Dark like a wine cellar, warm accents like candlelight</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-amber-400">Interaction Patterns</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Hover:</strong> Scale (1.02-1.05), deeper shadows, brighter borders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Focus:</strong> Amber ring (ring-2 ring-amber-400/50)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Active:</strong> Gradient intensifies, scale down slightly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Transitions:</strong> Use transition-all for smooth animations</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-amber-400">Spacing & Layout</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Generous Padding:</strong> Cards use p-6 to p-8</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Section Spacing:</strong> mb-12 to mb-16 between major sections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Rounded Corners:</strong> rounded-lg (8px) or rounded-xl (12px)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong>Borders:</strong> Subtle amber borders (border-amber-900/30)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
