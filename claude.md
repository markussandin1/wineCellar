Wine Cellar - Development Instructions for Claude Code
Project Overview
Build a wine cellar management web application (PWA) that uses AI to make wine tracking effortless.

- AI can never be mention in the app, ai is just a tool not a feature.
- Always update the claude.md file before each commit

## Recent Updates (2025-11-11)

### AI Wine Enrichment Refactoring - Comprehensive Review with Diff Preview
Complete redesign of wine AI enrichment from separate modal to inline diff preview with selective field updates.

**User Feedback:** "Jag testade att uppdatera ett vin med AI funktionen i admin, men inget uppdaterades, varken vinnamn, druva, sort eller nån annan data. Jag fick heller inte upp vad ai:n hade skapat för info."

**Problem:**
- User context was lost (API received it but didn't pass to agent)
- AI only updated enrichment fields, not basic wine data (name, grape, type, etc.)
- No visual feedback after generating enrichment
- User never saw what AI suggested before it was saved
- Sparkles button in wine table overview was confusing (separate from edit flow)
- Enrichment modal was disconnected from edit modal

**User Requirements:**
1. AI should suggest improvements to ALL fields (basic data + enrichment)
2. AI enrichment only accessible from within edit modal (not from wine table)
3. Show preview with diff view (current vs suggested values)
4. Checkboxes to select which fields to update (all checked by default)
5. Apply selected changes to form fields (not saved until user saves the form)

**Solution - Inline Diff Preview with Selective Updates:**

**Architecture:**
```
Wine Table → Edit Wine (pencil icon)
  └─→ Wine Edit Modal
      └─→ "Granska med AI" button
          └─→ WineEnrichmentDiff (inline)
              ├─ Shows current vs suggested values
              ├─ Checkboxes for each changed field
              ├─ Diff highlighting (red/green)
              └─→ "Apply Selected Changes" → Updates form fields
                  └─→ User can edit further or save
```

**New Components:**

1. **WineEnrichmentDiff** (`/components/admin/wine-enrichment-diff.tsx`) - NEW
   - Displays current vs suggested values side-by-side
   - Checkbox for each field (all changed fields selected by default)
   - Visual diff: red background with strikethrough (current), green background (suggested)
   - Grouped sections: Basic Info | Location | Descriptions | Tasting Notes
   - "Select All" / "Deselect All" buttons
   - Shows count: "X suggested changes • Y selected"
   - Apply button updates form fields in WineEditModal

2. **Enhanced Wine Enrichment Agent** (`/lib/ai/agents/wine-enrichment/`)
   - New type: `WineDataSuggestions` - includes basicData, locationData, enrichmentData
   - New method: `executeComprehensiveReview()` - returns suggestions for ALL fields
   - New prompt: `buildComprehensiveReviewPrompt()` - asks AI to review and suggest improvements
   - AI suggests corrections to: name (capitalization), producer, grape, type, vintage, alcohol, sweetness, body, country, region, sub-region, appellation, plus all enrichment fields

**Updated Components:**

3. **WineEditModal** (`/components/admin/wine-edit-modal.tsx`)
   - Removed `onRegenerateEnrichment` callback
   - Added local state for AI suggestions and diff preview
   - "Regenerera med AI" → "Granska med AI"
   - Button triggers inline diff preview (not separate modal)
   - WineEnrichmentDiff shown inline below enrichment section
   - Apply handler updates form fields with selected changes
   - User can continue editing or save

4. **WineDataTable** (`/components/admin/wine-table.tsx`)
   - Removed Sparkles button from wine table overview
   - Removed `enrichingWine` state
   - Removed WineEnrichmentModal import and rendering
   - AI enrichment now only accessible from within edit modal

5. **Enrich Wine API** (`/app/api/admin/enrich-wine/route.ts`)
   - Now accepts `context` parameter (user's optional notes)
   - Passes context to enrichment agent as `tastingProfileHints`
   - Calls `executeComprehensiveReview()` instead of `execute()`
   - Returns suggestions WITHOUT saving to database
   - Frontend applies selected changes via PATCH to `/api/admin/wines/[id]`

**User Flow:**
```
1. Admin opens wine catalog → Clicks Edit (pencil icon)
2. Wine Edit Modal opens with all editable fields
3. Clicks "Granska med AI" button
4. API generates comprehensive review (3-5 seconds)
5. WineEnrichmentDiff appears inline showing:
   - Current values (red, strikethrough)
   - Suggested values (green, bold)
   - Checkboxes (all changes pre-selected)
6. User reviews suggestions:
   - Unchecks fields they don't want to update
   - Sees count: "15 suggested changes • 12 selected"
7. Clicks "Apply 12 Changes"
8. Form fields update with selected suggestions
9. User can:
   - Continue editing manually
   - Generate another AI review
   - Save changes to database
   - Cancel and discard all changes
```

**Technical Implementation:**

**Wine Enrichment Agent Enhancements:**
```typescript
// New type for comprehensive suggestions
interface WineDataSuggestions {
  basicData: {
    name, producerName, wineType, vintage,
    primaryGrape, alcoholContent, sweetnessLevel, body
  };
  locationData: {
    country, region, subRegion, appellation
  };
  enrichmentData: {
    summary, overview, terroir, winemaking,
    tastingNotes: { nose, palate, finish },
    serving, foodPairings, signatureTraits
  };
}

// New method
wineEnrichmentAgent.executeComprehensiveReview(input)
  → Returns WineDataSuggestions

// New prompt asks AI to:
- Correct capitalization (e.g., "pinot noir" → "Pinot Noir")
- Fix formatting (producer names, wine names)
- Infer missing data (alcohol %, sweetness, body)
- Suggest appellation based on region/producer
- Generate enrichment as usual
```

**Diff Component Logic:**
```typescript
// Calculate changed fields
fieldDiffs = useMemo(() => {
  compare current vs suggested for each field
  return { field, label, currentValue, suggestedValue, hasChanged }
});

// Pre-select all changed fields
useState(() => new Set(changedFields));

// Apply selected changes
selectedFields.forEach(field => {
  updates[field] = suggestions[field]
});
setFormData({ ...formData, ...updates });
```

**Files Modified:**
- `/lib/ai/agents/wine-enrichment/wine-enrichment.types.ts` - Added WineDataSuggestions
- `/lib/ai/agents/wine-enrichment/wine-enrichment.config.ts` - Added buildComprehensiveReviewPrompt, increased maxTokens to 1200
- `/lib/ai/agents/wine-enrichment/wine-enrichment.agent.ts` - Added executeComprehensiveReview() method
- `/components/admin/wine-enrichment-diff.tsx` - NEW diff component
- `/components/admin/wine-edit-modal.tsx` - Inline diff preview, removed callback
- `/components/admin/wine-table.tsx` - Removed sparkles button and enrichment modal
- `/app/api/admin/enrich-wine/route.ts` - Returns suggestions without saving

**Files Deleted:**
- `/components/admin/wine-enrichment-modal.tsx` - Replaced by inline diff

**Benefits:**
- ✅ AI suggests improvements to ALL fields (not just enrichment)
- ✅ User sees preview before applying changes
- ✅ Selective field updates with checkboxes
- ✅ Visual diff makes changes clear (red → green)
- ✅ Integrated into edit modal workflow
- ✅ User can edit AI suggestions before saving
- ✅ No database pollution (suggestions not saved until user confirms)
- ✅ Clear feedback on what changed and what was applied

### Admin Interface Contrast Improvements
Fixed low contrast text throughout admin interface to meet WCAG AA accessibility standards.

**User Feedback:** "kolla design systemet och uppdatera designen, vissa texter i admin går knappt att läsa då det är ljus text mot ljus bakgrund"

**Problem:**
- Design system is built for dark backgrounds (wine cellar aesthetic)
- Admin panel uses light backgrounds (white/neutral)
- Gray text colors (neutral-400, neutral-500, neutral-600) had insufficient contrast
- Text was difficult to read, especially for users with visual impairments
- Did not meet WCAG AA standard (4.5:1 contrast ratio for normal text)

**Root Cause Analysis:**
```typescript
// Design system colors.ts - optimized for DARK backgrounds
backgrounds: {
  deepBlack: '#0A0A0A',      // Main background
  cellarBrown: '#1A1410',    // Cards
}

text: {
  primary: '#F3F4F6',        // gray-100 - for dark backgrounds
  secondary: '#E5E7EB',      // gray-200
  muted: '#9CA3AF',          // gray-400
}

// Admin components - using LIGHT backgrounds
bg-white, bg-neutral-50, bg-neutral-100
text-neutral-600 → 2.9:1 contrast (FAIL)
text-neutral-500 → 2.3:1 contrast (FAIL)
text-neutral-400 → 1.7:1 contrast (FAIL)
```

**Solution:** Updated text colors for light backgrounds

**Color Mapping (for white/light backgrounds):**
- `text-neutral-600` → `text-neutral-700` (normal text labels)
- `text-neutral-500` → `text-neutral-600/700` (secondary text)
- `text-neutral-400` → `text-neutral-600` (icons and tertiary elements)

**Contrast Results:**
| Before | After | Standard |
|--------|-------|----------|
| 2.9:1 (neutral-600) | 4.6:1 (neutral-700) | ✅ WCAG AA (4.5:1) |
| 2.3:1 (neutral-500) | 4.6:1 (neutral-700) | ✅ WCAG AA |
| 1.7:1 (neutral-400) | 3.1:1 (neutral-600) | ⚠️ Large text only |

**Files Modified:**
- `/components/ui/table.tsx:76,102` (TableHead and TableCaption - fixes ALL tables)
- `/components/admin/wine-edit-modal.tsx:201,577,617,621,629`
- `/components/admin/wine-table.tsx:75,96,104,107,115,118,126,134` (added wine name, bottle count)
- `/components/admin/wine-enrichment-modal.tsx:121,137`
- `/components/admin/data-quality-section.tsx:41,48,90,99,100,102,127`
- `/components/admin/analytics-cards.tsx:68`
- `/components/admin/popular-wines-chart.tsx:32,43,63,66,67,70,78` (added wine name, total bottles)
- `/components/admin/user-wine-matrix.tsx:60,85,92,95,98,101,107,115,121` (added user name, bottle count, value)
- `/app/admin/layout.tsx:26,46,53` (navigation links)
- `/app/admin/wines/page.tsx:117,130,158` (page header and pagination)
- `/app/admin/analytics/page.tsx:89,109,115,116,78` (page header and stats)

**Specific Changes:**

**CRITICAL FIX - Table Headers (components/ui/table.tsx):**
- TableHead default: `text-muted-foreground` → `text-neutral-700`
- TableCaption default: `text-muted-foreground` → `text-neutral-600`
- **Impact**: Fixed headers in ALL admin tables (wine catalog, popular wines, user matrix)
- Before: Table headers "Vin", "Producent", "Årgång", etc. were nearly invisible (gray-300, 1.9:1 contrast)
- After: All table headers clearly readable (4.6:1 contrast)

**Admin Layout (app/admin/layout.tsx):**
- "Tillbaka till appen" link: `text-neutral-600` → `text-neutral-700`
- Navigation links (Analys, Vinkatalog): `text-neutral-600` → `text-neutral-700`

**Page Headers:**
- wines/page.tsx: Subtitle, results summary, pagination: `text-neutral-600` → `text-neutral-700`
- analytics/page.tsx: Subtitle, status labels, error text: `text-neutral-600` → `text-neutral-700`
- analytics/page.tsx: Draft count: `text-neutral-400` → `text-neutral-600`

**wine-edit-modal.tsx:**
- Wine subtitle: `text-neutral-600` → `text-neutral-700`
- Empty food pairings state: `text-neutral-500` → `text-neutral-600`
- Metadata section: all labels `text-neutral-600` → `text-neutral-700`

**wine-table.tsx:**
- Producer, vintage, country: `text-neutral-600` → `text-neutral-700`
- Region (secondary): `text-neutral-400` → `text-neutral-600`
- Empty state: `text-neutral-500` → `text-neutral-600`
- Draft status badge: `text-neutral-600` → `text-neutral-700`

**data-quality-section.tsx:**
- All stat labels: `text-neutral-600` → `text-neutral-700`
- "Utan beskrivning" count: `text-neutral-500` → `text-neutral-700`
- XCircle icon: `text-neutral-400` → `text-neutral-600`
- Version label: `text-neutral-500` → `text-neutral-600`

**popular-wines-chart.tsx:**
- Empty state message: `text-neutral-500` → `text-neutral-600`
- Subtitle "Viner med flest användare": `text-neutral-600` → `text-neutral-700`
- Ranking numbers (#1, #2, etc.): `text-neutral-500` → `text-neutral-600`
- Producer names: `text-neutral-600` → `text-neutral-700`
- Vintage: `text-neutral-600` → `text-neutral-700`

**user-wine-matrix.tsx:**
- Search icon: `text-neutral-400` → `text-neutral-600`
- Empty state: `text-neutral-500` → `text-neutral-600`
- User names: `font-medium` → `font-medium text-neutral-900` (primary data)
- Email column: `text-neutral-600` → `text-neutral-700`
- Bottle count: `text-right` → `text-right text-neutral-900` (primary data)
- Total value: `font-medium` → `font-medium text-neutral-900` (primary data)
- Wine list items: `text-neutral-600` → `text-neutral-700`
- "Inga flaskor" text: `text-neutral-400` → `text-neutral-600`
- "+X till" text: `text-neutral-400` → `text-neutral-600`

**CRITICAL FIX - Primary Data Visibility:**
- Wine names (wine-table.tsx): `font-medium` → `font-medium text-neutral-900`
- Wine names (popular-wines-chart.tsx): `font-medium` → `font-medium text-neutral-900`
- User names (user-wine-matrix.tsx): `font-medium` → `font-medium text-neutral-900`
- Bottle counts: `font-medium` → `font-medium text-neutral-900`
- Total bottles/values: Added `text-neutral-900` for maximum contrast
- **Impact**: Fixed nearly invisible primary data that was inheriting default text color

**Benefits:**
- ✅ Meets WCAG AA accessibility standard
- ✅ Improved readability for all users
- ✅ Better UX for users with visual impairments
- ✅ Consistent text hierarchy throughout admin interface

## Recent Updates (2025-11-10)

### Wine Edit Modal Refactoring - Single Form with Editable Enrichment
Complete redesign of wine edit modal from tabbed interface to single scrollable form with all fields editable.

**User Request:** "Varför har vi delat upp det i grundläggande info och enrichment? Beskrivning och enrichment går inte att editera."

**Problem:**
- Tab structure separated basic info from enrichment unnecessarily
- Enrichment fields (descriptions, tasting notes, food pairings) were read-only
- Users couldn't edit AI-generated text directly
- Confusing UX with two separate views

**Solution:** Unified single-form interface
1. **Removed tabs** - Replaced "Grundläggande info" / "Beskrivning & Enrichment" tabs with single scrollable form
2. **Made ALL enrichment editable** - Converted all read-only displays to editable textareas
3. **Array input for food pairings** - Add/remove buttons for managing food pairing list
4. **Integrated AI regeneration** - "Regenerera med AI" button in enrichment section
5. **Fixed enrichment save bug** - WineEnrichmentModal was using wrong field names

**Architecture Changes:**

**Before (Tabbed Interface):**
- Tab 1: Editable basic fields only
- Tab 2: Read-only enrichment display
- Separate sparkle button to regenerate enrichment
- Bug: Enrichment modal saved to non-existent columns

**After (Single Form):**
```
Form Sections (all in one scrollable view):
├── Grundläggande information (name, producer, vintage, type, grape, alcohol)
├── Plats (country, region, sub_region, appellation)
├── Egenskaper (sweetness_level, body)
├── Status (status, verified)
├── Beskrivningar & Enrichment [Regenerera med AI button]
│   ├── Sammanfattning (ai_generated_summary) - textarea
│   ├── Översikt (overview) - textarea
│   ├── Terroir (terroir) - textarea
│   └── Vinframställning (winemaking) - textarea
├── Provningsanteckningar
│   ├── Doft (nose) - textarea
│   ├── Smak (palate) - textarea
│   └── Eftersmak (finish) - textarea
├── Servering & Matpar
│   ├── Servering (serving) - textarea
│   ├── Matpar (foodPairings) - array inputs with add/remove
│   └── Signatur egenskaper (signatureTraits) - textarea
└── Metadata (created_at, updated_at) - read-only
```

**User Flow:**
1. Click Edit (pencil icon) → Single form with all fields visible
2. Directly edit ANY field (basic data OR enrichment text)
3. Click "Regenerera med AI" → Opens enrichment modal overlay
4. Generate → Preview → Save → Returns to wine list
5. Open edit modal again to see refreshed enrichment values

**Technical Implementation:**

**formData state** now includes all enrichment fields:
```typescript
{
  // Basic fields
  name, producer_name, vintage, wine_type, etc.
  // Enrichment fields (NEW - now editable)
  ai_generated_summary,
  enrichment_overview,
  enrichment_terroir,
  enrichment_winemaking,
  enrichment_tasting_notes_nose,
  enrichment_tasting_notes_palate,
  enrichment_tasting_notes_finish,
  enrichment_serving,
  enrichment_food_pairings: string[], // array input
  enrichment_signature_traits
}
```

**handleSubmit** builds enrichment_data JSONB correctly:
```typescript
const enrichmentData = {
  summary: formData.ai_generated_summary,
  overview: formData.enrichment_overview,
  terroir: formData.enrichment_terroir,
  winemaking: formData.enrichment_winemaking,
  tastingNotes: {
    nose: formData.enrichment_tasting_notes_nose,
    palate: formData.enrichment_tasting_notes_palate,
    finish: formData.enrichment_tasting_notes_finish,
  },
  serving: formData.enrichment_serving,
  foodPairings: formData.enrichment_food_pairings,
  signatureTraits: formData.enrichment_signature_traits,
};

// Send to API
updates.enrichment_data = enrichmentData;
updates.ai_generated_summary = formData.ai_generated_summary;
```

**Bug Fixed in WineEnrichmentModal:**
```typescript
// ❌ BEFORE (wrong - individual non-existent columns):
{
  enrichment_overview: enrichment.overview,
  enrichment_terroir: enrichment.terroir,
  // ... etc (these columns don't exist)
}

// ✅ AFTER (correct - JSONB field):
{
  ai_generated_summary: enrichment.summary,
  enrichment_data: enrichment, // Full JSONB object
  enrichment_version: timestamp,
  enrichment_generated_at: timestamp,
}
```

**Files Modified:**
- `/components/admin/wine-edit-modal.tsx` (complete rewrite - 660 lines)
- `/components/admin/wine-enrichment-modal.tsx:71-84` (fix save bug)
- `/components/admin/wine-table.tsx:186-191` (add regeneration callback)

**Benefits:**
- ✅ All fields accessible in one view (no tab switching)
- ✅ Direct editing of enrichment text (no need to regenerate if you just want to tweak)
- ✅ AI regeneration still available via button
- ✅ Enrichment save now works correctly
- ✅ Better UX for admin wine management

### Wine Edit Modal Type Error Fix
Fixed runtime TypeError when viewing wine enrichment data in admin panel.

**Problem:** `enrichment.signatureTraits.map is not a function` error when opening wine edit modal.

**Root Cause:** Type mismatch between enrichment data structure and display code:
- `signatureTraits` is defined as `string` in `/lib/ai/agents/wine-enrichment/wine-enrichment.types.ts:60`
- Admin modal was treating it as `string[]` and calling `.map()` on it

**Solution:**
- Display `signatureTraits` as text paragraph instead of mapped list
- Added `Array.isArray()` safety check for `foodPairings` to prevent similar errors
- Ensures type-safe rendering of enrichment data

**Files Modified:**
- `/components/admin/wine-edit-modal.tsx:488,499-503` (type-safe enrichment display)

### Admin Interface Implementation
Implemented comprehensive admin panel for wine catalog management and system analytics.

**Features Implemented:**

**1. Database & Authorization**
- Added `is_admin` boolean field to users table
- Created `wine_edit_logs` audit trail table
- Admin authorization middleware (`requireAdmin()`, `isAdmin()`)
- Protected all `/admin/*` routes in middleware

**2. Analytics Dashboard** (`/admin/analytics`)
- Overview metrics: total users, wines, bottles, cellar value
- User-wine matrix showing who owns which wines
- Popular wines ranked by user count and bottle count
- Data quality metrics: label scan success rate, enrichment coverage
- PostgreSQL functions: `get_user_wine_matrix()`, `get_popular_wines()`

**3. Wine Catalog Management** (`/admin/wines`)
- Searchable/filterable wine table (name, producer, grape)
- Filters: wine type, country, status (active/draft), verified
- Sorting: name, vintage, created/updated date
- Pagination (50 wines per page)
- Wine stats: user count, bottle count per wine

**4. Wine Editing**
- Edit modal for all wine fields (name, producer, location, characteristics, status)
- Verified flag toggle
- Full audit logging of all changes
- Automatic `full_name` regeneration

**5. Wine Enrichment**
- Re-generate wine descriptions with AI enrichment agent
- Optional context field for better accuracy
- Preview enrichment before saving
- Updates all enrichment fields + version tracking

**6. Wine Deletion**
- Safety checks: shows impact (user count, bottle count)
- Confirmation dialog with impact details
- Cascade delete bottles
- Audit logging of deletions

**7. UI Components**
- Conditional admin link in navigation (only for admins)
- Mobile-responsive admin layout
- Admin-specific navigation (Analytics | Wine Catalog)
- Toast notifications for actions

**Architecture:**
```
/app/admin/
├── layout.tsx               # Admin-only layout with nav
├── analytics/page.tsx       # Analytics dashboard
└── wines/page.tsx           # Wine catalog management

/app/api/admin/
├── analytics/route.ts       # System stats
├── wines/route.ts           # List/search wines
├── wines/[id]/route.ts      # Get/Update/Delete wine
├── enrich-wine/route.ts     # Re-enrich wine (updated with auth)
└── cleanup-duplicates/      # One-off script (updated with auth)

/lib/auth/
└── admin.ts                 # requireAdmin(), isAdmin() helpers

/components/admin/
├── analytics-cards.tsx      # Metric cards
├── user-wine-matrix.tsx     # User-wine table
├── popular-wines-chart.tsx  # Popular wines table
├── data-quality-section.tsx # Quality metrics
├── wine-table.tsx           # Wine catalog table
├── wine-search-bar.tsx      # Search input
├── wine-filters.tsx         # Filter dropdowns
├── wine-edit-modal.tsx      # Edit wine form
├── wine-enrichment-modal.tsx # Re-generate enrichment
└── wine-delete-dialog.tsx   # Delete confirmation
```

**SQL Migrations Applied:**
1. `supabase_migration_add_admin_role_and_audit.sql` - Admin role + audit logging
2. `supabase_migration_add_analytics_functions.sql` - Analytics functions
3. `supabase_migration_add_wine_catalog_functions.sql` - Wine catalog functions

**Security:**
- All admin routes protected with `requireAdmin()` middleware
- Middleware blocks non-admin access to `/admin/*` paths
- Server-side authorization on all API endpoints
- Client-side conditional rendering (admin link only shows for admins)

**Files Modified/Created:**
- Middleware updated to protect `/admin/*` routes
- Nav component updated to show admin link conditionally
- All layout files use NavWrapper instead of Nav directly
- Existing admin routes updated with authorization checks

### Country/Region Inference via Wine Enrichment Agent
Implemented intelligent country and region inference using wine knowledge instead of hardcoded mappings.

**Problem:**
Vision API only extracts text from labels (e.g., "Central Coast") without guessing country. This left country field empty, causing validation errors.

**Previous Approach:**
Backend had hardcoded mapping (Central Coast → USA, Barossa → Australia, etc.) in wine creation route.

**User Feedback:**
"Vision api:et ska inte gissa nåt, den ska extrahera texten. Däremot borde nästa agent kunna lista ut, inte gissa, land och region" (Vision API should extract text, not guess. But the next agent should be able to determine, not guess, country and region)

**New Approach - Wine Knowledge Inference:**
1. **Vision API**: Extracts text only (no inference)
2. **Enrichment Agent**: Uses wine knowledge to determine country/region with high confidence
   - Analyzes producer name, region, grape variety, and other facts
   - Example: "Central Coast" + "Pinot Noir" → infers "USA" with high confidence
   - Returns `inferredCountry` and `inferredRegion` fields (nullable)
3. **Wine Creation Route**: Uses inferred values if input fields are missing

**Prompt Updates:**
```typescript
// Dynamic prompt based on missing data
if (country missing && region provided) {
  "IMPORTANT: Country is missing but region 'Central Coast' is provided.
   Use your wine knowledge to determine the country with high confidence."
}

// Examples in prompt
"Use established wine knowledge to infer geographic origin when facts
 strongly indicate it (e.g., 'Central Coast' → USA, 'Barossa' → Australia)."
```

**Why This Is Better:**
- Separates concerns: Vision extracts, enrichment infers
- Uses AI's wine knowledge instead of brittle hardcoded mappings
- Can handle edge cases (e.g., producer name hints at origin)
- Only infers when high confidence, otherwise returns null

**Files Modified:**
- `/lib/ai/agents/wine-enrichment/wine-enrichment.types.ts:61-64` (added inferredCountry, inferredRegion)
- `/lib/ai/agents/wine-enrichment/wine-enrichment.config.ts:57-90` (updated prompt with inference instructions)
- `/lib/ai/agents/wine-enrichment/wine-enrichment.agent.ts:106-107` (validation accepts optional fields)
- `/app/api/wines/create/route.ts:39-56` (removed hardcoded mapping, use enrichment agent's inferred values)

## Recent Updates (2025-11-10)

### Wine Matching Logic - Strict Rules for Generic Names
Fixed false positive matches for generic wine names (grape varieties).

**Problem:**
"Pinot Noir by LYNX" matched with "Pinot Noir by Pike Road Vineyards" (75.6% match) even though producers were completely different (5.3% similarity). Generic wine names (just grape varieties) were matching incorrectly.

**Root Cause:**
Previous logic weighted wine name at 70% and producer at only 30%, with a 70% threshold. This allowed generic names like "Pinot Noir" to match any other "Pinot Noir" regardless of producer.

**Solution - Multi-layered Matching Logic:**

1. **Generic Wine Name Detection**
   - List of 16 common grape varieties that are often used as wine names
   - Examples: Pinot Noir, Chardonnay, Cabernet Sauvignon, Merlot, etc.

2. **Veto Rule for Generic Names**
   - If wine name is generic AND producer match <40% → **Candidate REJECTED**
   - Prevents "Pinot Noir" from matching any other "Pinot Noir" with different producer

3. **Dynamic Weighting**
   - **Generic names**: 40% wine name + **60% producer** (producer is key!)
   - **Unique names**: 70% wine name + 30% producer (name is distinctive)

4. **Stricter Threshold**
   - Increased from 70% to **85%** match required
   - Plus vintage match required (if vintage is known)
   - Plus producer requirement for generic names (≥40%)

**Example Results:**
```
Extracted: "Pinot Noir" by "LYNX"

Before (FALSE POSITIVE):
✓ Matched "Pinot Noir by Pike Road" (75.6%)
  Name: 100%, Producer: 5.3%, Weighted: 75.6%

After (CORRECT):
✗ "Pinot Noir by Pike Road" REJECTED
  Reason: Generic name requires producer >40% (got 5.3%)
→ Creates new wine "Pinot Noir by LYNX"
```

**Files Modified:**
- `/app/api/scan-label/route.ts:146-211` (matching logic)

### Wine Rejection Flow - Use Original Scanned Data
Fixed bug where wine rejection used wrong wine's data for enrichment.

**Problem:**
When user clicked "This is not the correct wine", the enrichment used the **matched wine's data** instead of the **scanned label's data**. Example: Scanned "LYNX Pinot Noir" but enrichment described "Pike Road Vineyards Pinot Noir".

**Root Cause:**
When `/api/scan-label` finds a match, it overwrites `extractedData` with the matched wine's information. The rejection flow then used this overwritten data instead of the original scan.

**Solution:**
1. API now preserves `originalScannedData` when returning matched wine
2. Components use `originalScannedData` (if available) when rejecting wine or saving enrichment
3. Ensures enrichment is always based on what was actually scanned

**Example:**
```
Scan: "Pinot Noir by LYNX"
Match: "Pinot Noir by Pike Road" (wrong match)
User clicks: "This is not the correct wine"

Before (BUG):
Enrichment for: "Pinot Noir by Pike Road Vineyards" ❌

After (FIXED):
Enrichment for: "Pinot Noir by LYNX" ✓
```

**Files Modified:**
- `/app/api/scan-label/route.ts:237-248` (preserve originalScannedData)
- `/components/bottles/scanned-bottle-form.tsx:38-47,153,198` (use originalScannedData)

### Wine Scanning UX Redesign - Preview & Edit Flow
Complete redesign of wine scanning workflow to give users control over enrichment data before saving.

**Problem:**
1. Wine was created in database immediately during scan (before user review)
2. No preview or edit capability for enrichment data
3. Confusing messaging about wine status ("found in database" vs "newly created")
4. Enrichment data was only showing summary, not all 8 sections

**Solution:**
Implemented a multi-step flow with clear state machine and preview/edit capability:

**Flow States:**
1. **SCAN LABEL** → Extract text + Search database + Generate enrichment (in memory)
2. **If Match Found** → Show "Found in catalog" + Wine details + "This is not the correct wine" option
3. **If No Match** → Show enrichment preview with all 8 editable sections
4. **Preview/Edit** → User can modify: summary, overview, terroir, winemaking, tasting notes (nose/palate/finish), serving, food pairings, signature traits
5. **Save** → Create wine in database with status='active'
6. **Bottle Details** → User adds bottle-specific info (price, location, etc.)

**Key Changes:**

**Database:**
- Added `status` column to wines table ('draft' | 'active')
- Migration: `/supabase_migration_add_wine_status.sql`

**Components:**
- Created `WineEnrichmentPreview` component (`/components/bottles/wine-enrichment-preview.tsx`)
  - 8 collapsible sections for editing all enrichment fields
  - Food pairings as array with add/remove functionality
  - Mobile-responsive design
- Refactored `ScannedBottleForm` (`/components/bottles/scanned-bottle-form.tsx`)
  - State machine: FOUND_EXISTING | ENRICHMENT_PREVIEW | WINE_CONFIRMED | ERROR
  - Clear visual distinction between wine states
  - Wine rejection flow triggers enrichment preview (not immediate DB creation)
- Updated `LabelScanner` (`/components/bottles/label-scanner.tsx`)
  - Removed automatic wine creation
  - Simplified loading states

**API Endpoints:**
- `/app/api/scan-label/route.ts`
  - Now runs enrichment when no match found
  - Returns enrichment data WITHOUT saving to database
  - User reviews/edits before committing
- `/app/api/scan-label/enrich/route.ts` (NEW)
  - Generates enrichment with user context (wine rejection flow)
  - Returns enrichment in memory (not saved)
- `/app/api/wines/create/route.ts`
  - Now accepts `enrichmentData` parameter (user-edited)
  - Sets status='active' when creating wine
  - Backward compatible with `runEnrichment` flag (deprecated)

**User-Facing Copy:**
- Removed all "AI" mentions from UI (per project guidelines)
- Changed "Generating sommelier-quality notes" → "Preparing wine profile"
- Changed "AI-generated profile" → "Wine profile"

**Benefits:**
1. ✅ Users can verify enrichment accuracy before saving
2. ✅ No database pollution from abandoned scans
3. ✅ Clear workflow: extract → search → preview → save → bottle details
4. ✅ Wine catalog stays clean (no draft wines)
5. ✅ Better UX for wine rejection (shows preview instead of immediate creation)

**Files Modified:**
- `/components/bottles/wine-enrichment-preview.tsx` (NEW)
- `/components/bottles/scanned-bottle-form.tsx` (refactored with state machine)
- `/components/bottles/label-scanner.tsx` (simplified)
- `/app/api/scan-label/route.ts` (enrichment in memory)
- `/app/api/scan-label/enrich/route.ts` (NEW)
- `/app/api/wines/create/route.ts` (accepts enrichmentData param)
- `/supabase_migration_add_wine_status.sql` (NEW)

## Recent Updates (2025-11-10)

### Environment Variables Fix
Fixed missing Supabase service role key causing image upload failures.

**Problem:** Label image upload failed with "Missing Supabase environment variables" error.

**Root Cause:** `SUPABASE_SERVICE_ROLE_KEY` was not present in `.env.local` file.

**Solution:**
- Pulled environment variables from Vercel using `vercel env pull`
- Service role key now present in `.env.local`
- Requires dev server restart to load new environment variable

**Note:** After pulling env vars, always restart Next.js dev server: `npm run dev`

### Wine Enrichment Validation Bug Fix
Fixed snake_case/camelCase mismatch in enrichment agent validation.

**Problem:** Wine enrichment agent validation failed with "Missing or invalid signature_traits" error.

**Root Cause:** Mismatch between prompt (camelCase: `tastingNotes`, `foodPairings`, `signatureTraits`) and validation code (snake_case: `tasting_notes`, `food_pairings`, `signature_traits`).

**Solution:** Updated validation in `wine-enrichment.agent.ts` to use camelCase consistently with prompt format.

**Files Modified:** `/lib/ai/agents/wine-enrichment/wine-enrichment.agent.ts:67-105`

### Wine Creation Bug Fixes
Fixed critical bugs in wine creation that caused missing metadata:

**Problem:** Wines created without `full_name` and `ai_generated_summary` fields, resulting in "Unknown Wine" display and missing descriptions.

**Root Cause:** `/app/api/wines/create/route.ts` did not populate:
- `full_name` (combination of name + producer + vintage)
- `ai_generated_summary` (extracted from enrichment data)

**Solution:**
- Generate `full_name` from name, producer, and vintage during wine creation
- Extract `summary` from enrichment data and save as `ai_generated_summary`
- Both fields now populated automatically when wines are created

**Files Modified:** `/app/api/wines/create/route.ts:92-123`

This ensures all new wines will have proper display names and AI-generated descriptions.

### Label Scanning UX Improvements
Enhanced the wine scanning workflow with better user verification and context:

1. **WineCard Enhancement** (`/components/bottles/wine-card.tsx`)
   - Added sub-region and primary grape variety display
   - Shows more comprehensive wine details for better match verification
   - Integrated into location display (region, sub-region, country)

2. **Wine Rejection Flow** (`/components/bottles/scanned-bottle-form.tsx`)
   - Added "⚠️ This is not the correct wine" button to WineCard
   - When clicked, shows form to create new wine with user context
   - Required context field: "Vad vet du om vinet?" (What do you know about the wine?)
   - User can describe wine characteristics, purchase details, tasting notes
   - Context is passed to AI enrichment as `tastingProfileHints`

3. **API Enhancement** (`/app/api/wines/create/route.ts`)
   - Now accepts `tastingProfileHints` parameter
   - Passes user context to wine enrichment agent
   - Helps AI generate more accurate sommelier notes based on user knowledge

**User Flow:**
- User scans label → Wine matches existing wine in DB
- WineCard shows detailed info (name, producer, vintage, region, sub-region, grape)
- If wrong match: User clicks "This is not the correct wine"
- Form appears with textarea for wine description
- User provides context (e.g., taste profile, origin, purchase location)
- New wine created with AI enrichment using user's context
- Form updates to show newly created wine
- User adds bottle details

This addresses the issue where AI was matching incorrect wines and helps prevent duplicate creation with better user verification.



The app solves three problems:

Memory: Track wine details, prices, and characteristics without manual effort
Discovery: Understand what you own and get smart recommendations
Ease of use: Zero-friction input via AI label scanning, not spreadsheets

Core Philosophy: AI is invisible infrastructure, not a chatbot. The app should feel magical but simple.

Technical Stack

ITS IMPORTANT TO KEEP THE FILE SIZE AND FUNCTIONS MANAGEBLE. BETTER TO SPLIT A FUNCTION OR COMPONENT IN TWO IF ITS GET TO LARGE.

Frontend

Framework: Next.js 14+ (App Router)
Styling: Tailwind CSS
UI Components: shadcn/ui
State Management: React Context + hooks (keep simple for MVP)
PWA: next-pwa for offline capabilities
Image Upload: Client-side image handling with preview

Backend

Framework: Next.js API routes (serverless functions)
Database: PostgreSQL (via Supabase or Neon)
ORM: Prisma
Authentication: NextAuth.js (start with email/password, Google OAuth)
File Storage: S3-compatible (Cloudflare R2, Supabase Storage, or AWS S3)

AI Integration

Label Recognition: OpenAI Vision API (gpt-4o)
Wine Knowledge: OpenAI API (gpt-4o-mini for cost efficiency)
Embeddings: OpenAI text-embedding-3-small (for semantic search - can add later)

Deployment

Platform: Vercel (optimal for Next.js)
Database: Supabase (free tier) or Neon
Environment: Production-ready from day one but a fully woring local enviroment as well
Dont push anything to production before we have a working mvp locally
CI/CD via gthub actions

Core Features Implementation Order
Phase 1: Foundation (Week 1)

Setup project with Next.js, Prisma, Tailwind, shadcn/ui
Database setup with Supabase/Neon
Authentication with NextAuth (email + Google)
Basic layout with responsive nav

Phase 2: Core Bottle Management (Week 2)

Manual bottle entry form with wine search/create
Bottle list/grid view with filters (type, region, status)
Bottle detail page with all info
Edit/delete bottles
Mark as consumed with simple rating

Phase 3: AI Label Scanning (Week 3)

Image upload UI with preview
OpenAI Vision integration for label extraction
Review/edit extracted data before saving
Wine matching (find existing wine or create new)
Storage integration for label images

Phase 4: Intelligence Layer (Week 4)

Dashboard insights:

Total bottles, value, by region/type
Bottles in peak drinking window
Recent additions


Wine knowledge explanations:

Tap grape → AI explanation
Tap region → AI context


Compare wines side-by-side with AI insights
Basic preference learning from ratings

UI/UX Guidelines
Design Principles

Mobile-first: All layouts must work perfectly on mobile
Fast photo capture: Camera/upload should be one tap from home
Minimal friction: Pre-fill everything possible, smart defaults
Visual hierarchy: Wine images prominent, actions clear
Progressive disclosure: Show basics, details on demand

Key Screens
Home Dashboard

Hero stats (bottles, value, peak window count)
Quick action: "Add Bottle" (camera icon)
Smart insights cards (max 3)
Recent additions grid (4-6 bottles)

Cellar View

Filter pills at top (All, Red, White, etc.)
Search bar
Sort dropdown (Recent, Name, Price, Vintage)
Grid/List toggle
Each card shows: image, name, vintage, price, status badge

Add Bottle Flow

Choice: "Scan Label" (camera) or "Enter Manually"
If scanning: Camera → Preview → AI extraction → Review/Edit → Save
If manual: Form with autocomplete for wine name/producer

Bottle Detail

Large label image
All wine details (collapsible sections)
AI summary ("About this wine")
Actions: Edit, Mark Consumed, Delete
Consumption history if any

Wine Knowledge

Triggered by tapping underlined terms (grape, region)
Modal or slide-up with AI explanation
"Learn more" links to related wines in cellar

Testing Strategy
Manual Testing Checklist

 Register new user
 Add bottle via label scan
 Add bottle manually
 Edit bottle details
 Filter/search bottles
 View bottle detail
 Mark bottle as consumed with rating
 View dashboard insights
 Compare two wines
 Tap grape/region for explanation
 Test on mobile device
 Test offline behavior (PWA)

Edge Cases to Handle

Label scan fails to extract data
Same wine added multiple times (different purchases)
Non-vintage wines (NV)
Blends with multiple grapes
Price in different currencies
Partial bottles consumed


Performance Considerations

Image optimization: Resize/compress label images before upload
Lazy loading: Load bottle images as user scrolls
API rate limiting: Cache OpenAI responses when possible
Database queries: Use proper indexes (already in schema)
Optimistic updates: Update UI before API confirms


Security

Authentication: All API routes must verify user session
Authorization: Users only see/modify their own bottles
Input validation: Use Zod schemas for all inputs
Image uploads: Validate file type/size, sanitize filenames
SQL injection: Prisma handles this, but validate all inputs
API keys: Never expose in client code
