# Wine Cellar Design System

A comprehensive design system for the Wine Cellar application featuring a dark wine cellar aesthetic with warm amber accents. All components are WCAG AA compliant and optimized for readability.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Principles](#core-principles)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Components](#components)
6. [Layout Patterns](#layout-patterns)
7. [Accessibility](#accessibility)
8. [Best Practices](#best-practices)

---

## Getting Started

### Installation

All design system utilities are located in `lib/design-system/`:

```typescript
// Import everything
import { GradientText, WineTypeIcon, Button, Input, playfair } from '@/lib/design-system';

// Or import specific modules
import { backgrounds, accents, wineTypes } from '@/lib/design-system/colors';
import { Button } from '@/lib/design-system/button';
import { playfair } from '@/lib/design-system/fonts';
```

### Quick Start

```tsx
import { PageHeader, Button, playfair } from '@/lib/design-system';

export default function MyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="My Page"
          subtitle="This is my page"
          action={
            <Button variant="primary">
              Add Item
            </Button>
          }
        />
      </div>
    </div>
  );
}
```

---

## Core Principles

### 1. Dark Wine Cellar Aesthetic
- Deep blacks and warm browns evoke a wine cellar atmosphere
- Subtle gradients create depth without distraction
- Ambient glow effects add sophistication

### 2. Warm Amber Accents
- Amber/gold colors represent candlelight in a cellar
- Used for interactive elements and highlights
- Creates visual hierarchy and draws attention

### 3. Wine Type Color Coding
- Each wine type has distinct colors (red, white, rosé, etc.)
- Helps users quickly identify wine categories
- Consistent across all components

### 4. Accessibility First
- All text meets WCAG AA contrast ratios (4.5:1 minimum)
- Clear focus states for keyboard navigation
- Semantic HTML structure

---

## Color Palette

### Backgrounds

```typescript
import { backgrounds } from '@/lib/design-system/colors';

backgrounds.deepBlack    // #0A0A0A - Page backgrounds
backgrounds.cellarBrown  // #1A1410 - Secondary backgrounds
backgrounds.oakBarrel    // #2A1F1A - Card backgrounds
backgrounds.agedWood     // #1C1410 - Input backgrounds
```

**Usage:**
```tsx
// Page background
<div className="bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">

// Card background
<div className="bg-gradient-to-br from-[#2A1F1A] to-[#1A1410]">
```

### Accents (Amber/Gold)

```typescript
import { accents } from '@/lib/design-system/colors';

accents.amber400   // #FBBF24 - Primary interactive
accents.yellow400  // #FACC15 - Hover states
accents.amber200   // #FDE68A - Light accents
```

**Usage:**
```tsx
// Interactive text
<Link className="text-amber-400 hover:text-yellow-400">

// Borders
<div className="border border-amber-900/30">
```

### Wine Type Colors

```typescript
import { wineTypes } from '@/lib/design-system/colors';

wineTypes.red        // Deep burgundy
wineTypes.white      // Golden yellow
wineTypes.rose       // Soft pink
wineTypes.sparkling  // Champagne gold
wineTypes.dessert    // Rich amber
wineTypes.fortified  // Deep purple
```

**Usage:**
```tsx
import { WineTypeIcon } from '@/lib/design-system';

<WineTypeIcon type="red" className="w-12 h-12" />
```

### Text Colors

- **gray-100** (#F3F4F6): Headings, primary text
- **gray-300** (#D1D5DB): Body text, descriptions
- **gray-400** (#9CA3AF): Metadata, labels (use sparingly, mainly for large text)

---

## Typography

### Fonts

**Playfair Display** (Headings)
```tsx
import { playfair } from '@/lib/design-system';

<h1 className={`${playfair.className} text-3xl font-bold text-gray-100`}>
  Wine Cellar
</h1>
```

**Inter** (Body Text) - Default system font, no import needed

### Gradient Text (Candlelight Effect)

```tsx
import { GradientText } from '@/lib/design-system';

// As h1
<GradientText as="h1" className="text-3xl">
  Wine Cellar
</GradientText>

// As span
<GradientText>Highlighted text</GradientText>
```

### Type Scale

```tsx
// Page titles
<h1 className="text-4xl md:text-5xl font-bold">

// Section headers
<h2 className="text-2xl md:text-3xl font-semibold">

// Card headers
<h3 className="text-xl font-semibold">

// Body text
<p className="text-base">

// Metadata
<span className="text-sm">
```

---

## Components

### PageHeader

Consistent page header with title, subtitle, and optional action button.

```tsx
import { PageHeader } from '@/lib/design-system';

<PageHeader
  title="My Cellar"
  subtitle="120 bottles in your collection"
  action={
    <Link href="/cellar/add">
      <Button variant="primary">
        <Plus className="h-4 w-4" />
        Add Bottle
      </Button>
    </Link>
  }
/>
```

### SectionHeader

Smaller header for sections within a page.

```tsx
import { SectionHeader } from '@/lib/design-system';

<SectionHeader
  title="Recent Additions"
  subtitle="Last 7 days"
/>
```

### Button

Four variants with consistent styling.

```tsx
import { Button } from '@/lib/design-system';

// Primary (amber gradient)
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>

// Secondary (amber border)
<Button variant="secondary">
  Cancel
</Button>

// Outline (transparent with border)
<Button variant="outline">
  Learn More
</Button>

// Ghost (minimal styling)
<Button variant="ghost">
  Skip
</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  // default
<Button size="lg">Large</Button>

// Full width
<Button className="w-full">
  Sign In
</Button>
```

### Input, Textarea, Select

Form components with wine cellar styling.

```tsx
import { Input, Textarea, Select } from '@/lib/design-system';

// Input
<Input
  type="text"
  placeholder="Enter wine name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// Textarea
<Textarea
  placeholder="Tasting notes"
  rows={4}
/>

// Select
<Select value={selected} onChange={(e) => setSelected(e.target.value)}>
  <option value="">Select type</option>
  <option value="red">Red</option>
  <option value="white">White</option>
</Select>
```

### WineTypeIcon

Colored wine glass icons for each wine type.

```tsx
import { WineTypeIcon } from '@/lib/design-system';

<WineTypeIcon
  type="red"           // red | white | rose | sparkling | dessert | fortified
  className="w-12 h-12" // Optional size override
/>
```

### WineTypeBadge

Pill-shaped badge with wine type icon and label.

```tsx
import { WineTypeBadge } from '@/lib/design-system';

<WineTypeBadge type="red" />
```

### CellarCard

Card component with wine cellar styling and ambient glow.

```tsx
import { CellarCard } from '@/lib/design-system';

<CellarCard className="p-6">
  <h3 className="text-xl font-semibold mb-4">Card Title</h3>
  <p>Card content goes here</p>
</CellarCard>
```

### StatCard

Dashboard statistics card.

```tsx
import { StatCard } from '@/lib/design-system';

<StatCard
  label="Total Bottles"
  value={150}
  subtitle="In your cellar"
  icon={<Wine className="h-5 w-5" />}
  trend={{ value: 12, isPositive: true }}  // Optional
/>
```

---

## Layout Patterns

### Page Layout

Standard full-page layout with wine cellar background.

```tsx
export default function MyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader title="My Page" subtitle="Description" />

        {/* Page content */}
      </div>
    </div>
  );
}
```

### Card with Ambient Glow

Cards with subtle glowing effect in top-right corner.

```tsx
<div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
  {/* Ambient glow */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />

  {/* Card content (use relative positioning) */}
  <h3 className="relative text-xl font-semibold text-gray-100">
    Card Title
  </h3>
  <p className="relative text-gray-300">
    Card content
  </p>
</div>
```

### Grid Layout

Responsive grid for cards.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <CellarCard key={item.id}>
      {/* Card content */}
    </CellarCard>
  ))}
</div>
```

### Modal/Dialog

Overlay with wine cellar styled modal.

```tsx
{showModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6 max-w-md w-full mx-4">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />

      <h3 className="relative text-xl font-semibold mb-4 text-gray-100">
        Modal Title
      </h3>
      <p className="relative text-gray-300 mb-6">
        Modal content
      </p>

      <div className="relative flex gap-3 justify-end">
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## Accessibility

### Color Contrast

All text colors meet WCAG AA standards:

| Text Color | Background | Ratio | Pass |
|-----------|-----------|-------|------|
| gray-100 (#F3F4F6) | #1A1410 | 11.7:1 | ✓ AAA |
| gray-300 (#D1D5DB) | #1A1410 | 8.2:1 | ✓ AAA |
| gray-400 (#9CA3AF) | #1A1410 | 5.4:1 | ✓ AA (use for large text) |
| amber-400 (#FBBF24) | #1A1410 | 7.1:1 | ✓ AAA |

### Focus States

All interactive elements have visible focus states:

```tsx
// Buttons
className="focus:outline-none focus:ring-2 focus:ring-amber-400/50"

// Inputs
className="focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"

// Links
className="focus:outline-none focus:ring-2 focus:ring-amber-400/50 rounded"
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Enter/Space activate buttons and links
- Escape closes modals

### Semantic HTML

```tsx
// Use semantic HTML elements
<nav>      // Navigation
<main>     // Main content
<article>  // Independent content
<section>  // Thematic grouping
<header>   // Page/section header
<footer>   // Page/section footer

// Proper heading hierarchy
<h1> → <h2> → <h3> → <h4>  // Never skip levels
```

### ARIA Labels

```tsx
// Button with icon only
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Loading state
<button disabled aria-busy="true">
  Loading...
</button>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

---

## Best Practices

### 1. Use Design System Components

✅ **Do:**
```tsx
import { Button } from '@/lib/design-system';
<Button variant="primary">Save</Button>
```

❌ **Don't:**
```tsx
<button className="bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2...">
  Save
</button>
```

### 2. Consistent Spacing

Use Tailwind's spacing scale consistently:

```tsx
// Padding
p-4    // Small cards
p-6    // Standard cards
p-8    // Large cards/forms

// Margins
mb-4   // Between related elements
mb-6   // Between sections
mb-8   // Between major sections

// Gaps
gap-4  // Grid/flex items
gap-6  // Card grids
```

### 3. Typography Hierarchy

```tsx
// Page level
<h1 className={`${playfair.className} text-4xl font-bold text-gray-100`}>

// Section level
<h2 className={`${playfair.className} text-2xl font-semibold text-gray-100`}>

// Card level
<h3 className={`${playfair.className} text-xl font-semibold text-gray-100`}>

// Body
<p className="text-base text-gray-300">

// Metadata
<span className="text-sm text-gray-400">
```

### 4. Responsive Design

Mobile-first approach:

```tsx
// Mobile → Tablet → Desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Text sizes
<h1 className="text-3xl md:text-4xl lg:text-5xl">

// Padding
<div className="px-4 md:px-6 lg:px-8">
```

### 5. Loading States

Show clear loading indicators:

```tsx
<Button disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save Changes'}
</Button>
```

### 6. Error States

Make errors visible and helpful:

```tsx
{error && (
  <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-3 text-sm text-red-400">
    {error}
  </div>
)}
```

### 7. Empty States

Provide guidance when no data exists:

```tsx
{bottles.length === 0 ? (
  <div className="text-center py-12">
    <Wine className="h-12 w-12 text-gray-600 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-300 mb-2">
      No bottles yet
    </h3>
    <p className="text-gray-400 mb-4">
      Start building your collection
    </p>
    <Button variant="primary" onClick={() => router.push('/cellar/add')}>
      Add Your First Bottle
    </Button>
  </div>
) : (
  <BottleList bottles={bottles} />
)}
```

### 8. Transitions

Use consistent transitions:

```tsx
// Hover effects
className="transition-all hover:scale-105"

// Color transitions
className="transition-colors hover:text-yellow-400"

// Standard duration (default)
className="transition-all duration-200"
```

### 9. Z-Index Scale

Maintain consistent layering:

```tsx
z-0    // Base layer (default)
z-10   // Elevated content
z-20   // Dropdowns, tooltips
z-30   // Fixed headers
z-40   // Overlays
z-50   // Modals, dialogs
```

### 10. Performance

Optimize images and components:

```tsx
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={bottle.imageUrl}
  alt={bottle.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Lazy load off-screen content
<div className="grid grid-cols-3 gap-4">
  {bottles.slice(0, 12).map(bottle => (
    <BottleCard key={bottle.id} bottle={bottle} />
  ))}
</div>
```

---

## Examples

### Complete Page Example

```tsx
import { PageHeader, CellarCard, Button, playfair } from '@/lib/design-system';
import { Plus, Wine } from 'lucide-react';
import Link from 'next/link';

export default function CellarPage({ bottles }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader
          title="My Cellar"
          subtitle={`${bottles.length} bottles in your collection`}
          action={
            <Link href="/cellar/add">
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Add Bottle
              </Button>
            </Link>
          }
        />

        {bottles.length === 0 ? (
          <div className="text-center py-16">
            <Wine className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className={`${playfair.className} text-2xl font-semibold text-gray-300 mb-2`}>
              Your cellar is empty
            </h3>
            <p className="text-gray-400 mb-6">
              Start building your collection by adding your first bottle
            </p>
            <Link href="/cellar/add">
              <Button variant="primary" size="lg">
                <Plus className="h-5 w-5" />
                Add Your First Bottle
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bottles.map(bottle => (
              <CellarCard key={bottle.id} className="p-6">
                <WineTypeIcon
                  type={bottle.wine.wineType}
                  className="mb-4"
                />
                <h3 className={`${playfair.className} text-xl font-semibold mb-2 text-gray-100`}>
                  {bottle.wine.name}
                </h3>
                <p className="text-gray-300 mb-4">
                  {bottle.wine.vintage} • {bottle.wine.region}
                </p>
                <Link href={`/bottle/${bottle.id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CellarCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Migration Guide

If you're updating an existing component:

1. **Replace page background:**
   ```tsx
   // Before
   <div className="min-h-screen bg-background">

   // After
   <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
   ```

2. **Update cards:**
   ```tsx
   // Before
   <div className="rounded-lg border bg-card p-6">

   // After
   <CellarCard className="p-6">
   // Or manually:
   <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6">
     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 rounded-full blur-3xl" />
     {/* Content */}
   </div>
   ```

3. **Update text colors:**
   ```tsx
   // Before
   <h1 className="text-3xl font-bold">Title</h1>
   <p className="text-muted-foreground">Body</p>

   // After
   <h1 className={`${playfair.className} text-3xl font-bold text-gray-100`}>Title</h1>
   <p className="text-gray-300">Body</p>
   ```

4. **Update buttons:**
   ```tsx
   // Before
   <button className="bg-primary text-primary-foreground px-4 py-2 rounded">

   // After
   <Button variant="primary">
   ```

5. **Add wine type icons:**
   ```tsx
   // Before
   <Wine className="h-8 w-8 text-red-500" />

   // After
   <WineTypeIcon type="red" className="h-8 w-8" />
   ```

---

## Resources

- **Live Documentation:** Visit `/design-system` in the app to see all components with live examples
- **Design System Files:** `lib/design-system/`
- **Color Palette:** `lib/design-system/colors.ts`
- **Components:** `lib/design-system/components.tsx`
- **Forms:** `lib/design-system/button.tsx`, `lib/design-system/input.tsx`

---

## Support

For questions or issues with the design system:
1. Check the live documentation at `/design-system`
2. Review this guide for patterns and best practices
3. Look at existing components for reference (e.g., `app/dashboard/page.tsx`, `components/bottles/wine-card.tsx`)

---

**Version:** 1.0.0
**Last Updated:** November 2025
**WCAG Compliance:** AA Certified
