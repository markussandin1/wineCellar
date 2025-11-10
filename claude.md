Wine Cellar - Development Instructions for Claude Code
Project Overview
Build a wine cellar management web application (PWA) that uses AI to make wine tracking effortless.

- AI can never be mention in the app, ai is just a tool not a feature.
- Always update the claude.md file before each commit

## Recent Updates (2025-11-10)

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
