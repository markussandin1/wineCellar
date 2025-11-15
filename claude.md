Wine Cellar - Development Instructions for Claude Code
Project Overview
Build a wine cellar management web application (PWA) and iOS app that uses AI to make wine tracking effortless.

- AI can never be mention in the app, ai is just a tool not a feature.
- Always update the claude.md file before each commit

## Recent Updates (2025-11-13)

### iOS Camera Permissions Fix
Fixed app crash when accessing camera in iOS app.

**Problem:**
- App crashed immediately when trying to access camera
- Error: "This app has crashed because it attempted to access privacy-sensitive data without a usage description"
- Missing required NSCameraUsageDescription key in Info.plist

**Solution - Added Privacy Permission Descriptions:**

**Files Modified:**
- `/ios/App/App/Info.plist` - Added three required permission descriptions

**Permissions Added:**
```xml
<key>NSCameraUsageDescription</key>
<string>Take photos of wine labels to automatically identify and add wines to your cellar</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save wine label photos to your photo library</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Select existing wine label photos from your library to add wines to your cellar</string>
```

**Why These Are Required:**
- **NSCameraUsageDescription**: Required by Apple for any app accessing the device camera
- **NSPhotoLibraryAddUsageDescription**: Required for saving photos to the user's photo library
- **NSPhotoLibraryUsageDescription**: Required for selecting existing photos from the library
- These descriptions are shown to users when the app first requests permission

**User Experience:**
- First time user taps camera button → iOS shows permission dialog with description
- User grants/denies permission
- If granted → camera opens normally
- If denied → app should show helpful message to enable in Settings

**Testing After Fix:**
1. Clean build folder in Xcode (Product → Clean Build Folder)
2. Rebuild and run app
3. Tap camera/scan label button
4. Should see permission prompt (not crash)
5. Grant permission and verify camera works

**Benefits:**
- ✅ App no longer crashes on camera access
- ✅ Compliant with Apple App Store requirements
- ✅ User-friendly permission descriptions
- ✅ Ready for label scanning feature

### iOS Native App Authentication Fix
Fixed authentication issue preventing iOS app from loading dashboard and making API calls.

**Problem:**
- iOS simulator showed "Failed to load dashboard" error
- API calls to `/api/dashboard/stats` returned 401 Unauthorized
- Root cause: Supabase auth cookies not sent with fetch requests from native apps

**Solution - Authorization Header Authentication:**

**API Client Updates (`/lib/api/client.ts`):**
- Added `getAuthHeaders()` function that retrieves Supabase session from client storage
- Extracts `access_token` from session and includes it in `Authorization: Bearer {token}` header
- Updated `apiCall()` to include auth headers in all API requests
- Updated `apiUpload()` to include auth headers for file uploads
- Added `credentials: 'include'` for cookie-based auth on web

**Server-Side Supabase Client (`/lib/supabase/server.ts`):**
- Updated `createClient()` to accept Authorization header in addition to cookies
- Reads `authorization` header from request using Next.js `headers()` API
- Passes header to Supabase client via `global.headers.Authorization` option
- Maintains backward compatibility with cookie-based auth for web

**Authentication Flow:**
```
iOS App:
1. User logs in → Supabase stores session in localStorage
2. App makes API call → getAuthHeaders() retrieves session
3. Includes Authorization: Bearer {token} in request
4. Server reads header → createClient() passes to Supabase
5. Supabase validates token → Returns user data
6. API route processes authenticated request

Web App (unchanged):
1. User logs in → Supabase stores session in cookies
2. App makes API call → credentials: 'include' sends cookies
3. Server reads cookies → createClient() validates session
4. API route processes authenticated request
```

**Benefits:**
- ✅ iOS native app can authenticate with API routes
- ✅ Web app continues using cookie-based auth (optimal)
- ✅ Single codebase supports both platforms
- ✅ No changes required to API routes
- ✅ Works with existing Supabase SSR library

**Files Modified:**
- `/lib/api/client.ts` - Added auth header support
- `/lib/supabase/server.ts` - Added Authorization header reading

**Testing Results:**
- ✅ Build passes successfully
- ✅ Linting passes with no errors
- ✅ Dev server starts on port 3002
- ✅ API health check: `{"status":"ok","database":"connected"}`
- ✅ Ready for iOS simulator testing

**Next Steps:**
- Test in iOS simulator to verify dashboard loads
- Test other authenticated routes (cellar, bottle details, etc.)
- Test label scanning and image upload with auth headers

## Recent Updates (2025-11-12)

### Unified API-First Architecture
All platforms now consume the same REST layer. Server Components reuse the API routes via `lib/api/server` (forwards cookies/headers automatically), so SSR + web client + native client share identical behavior and there are no more Server Actions to maintain.

**Client & Native Components → API Routes (HTTP)**
- `components/bottles/bottle-form.tsx` → `POST /api/bottles`
- `components/bottles/scanned-bottle-form.tsx` → `POST /api/bottles/from-scan`
- `components/bottles/bottle-detail.tsx` → `DELETE /api/bottles/[id]`
- `components/bottles/edit-bottle-modal.tsx` → `PATCH /api/bottles/[id]`
- `components/bottles/consume-bottle-modal.tsx` → `POST /api/bottles/[id]/consume`
- `components/layout/nav.tsx` → `POST /api/auth/logout`
- `app/settings/SettingsContent.tsx` → `PATCH /api/user/profile`, `PATCH /api/user/password`, `DELETE /api/user/account`
- **Why**: Works from browser + Capacitor, enables native app support

**Server Components → `lib/api/server` → API Routes**
- `app/dashboard/page.tsx` → `serverGetDashboardStats()` → `/api/dashboard/stats`
- `app/settings/page.tsx` → `serverGetUserProfile()` → `/api/user/profile`
- `app/cellar/page.tsx` → `serverGetBottles()` → `/api/bottles`
- `app/bottle/[id]/page.tsx` → `serverGetBottle()` → `/api/bottles/[id]`
- **Why**: Keeps cookies/session intact without direct Supabase calls, eliminates duplicate business logic.

**API Client Implementation (`/lib/api/client.ts`):**
- Platform-aware URL construction (lazy evaluation to avoid webpack issues)
- Browser (client-side): Relative URLs (`/api/*`)
- Server (SSR): Absolute URLs (`http://localhost:3000/api/*` or `https://vercel-url/api/*`)
- Native: Production URLs (`https://wine-cellar.vercel.app/api/*`)

**API Routes Created (14 endpoints):**
- `POST /api/bottles` - Create bottle
- `GET /api/bottles` - List bottles (for API consumers)
- `GET /api/bottles/[id]` - Get bottle details
- `PATCH /api/bottles/[id]` - Update bottle
- `DELETE /api/bottles/[id]` - Delete bottle
- `POST /api/bottles/from-scan` - Create from label scan
- `POST /api/bottles/[id]/consume` - Record consumption
- `POST /api/auth/logout` - Logout user
- `GET /api/dashboard/stats` - Dashboard statistics (for API consumers)
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `PATCH /api/user/password` - Change password
- `DELETE /api/user/account` - Delete account

**Key Fixes:**
1. **Lazy URL computation**: Moved `getApiBaseUrl()` from module-level constant to function call to avoid webpack bundling errors
2. **Server-side absolute URLs**: Detect `typeof window === 'undefined'` and use absolute URLs for Node.js fetch
3. **Tailwind config ESM**: Converted `require("tailwindcss-animate")` to `import` statement

**Files Modified:**
- `/lib/api/client.ts` - Platform-aware API wrapper with lazy URL computation
- `/tailwind.config.ts` - Fixed ESM import for tailwindcss-animate
- All client components - Updated to use API client
- All server components - Reverted to use Server Actions

**Testing Results:**
- ✅ Build passes (27 pages)
- ✅ Linting passes (no errors)
- ✅ TypeScript compilation passes
- ✅ Dev server works on port 3000
- ✅ API health check: `{"status":"ok","database":"connected"}`
- ✅ Homepage loads: HTTP 200 OK
- ✅ No authentication errors
- ✅ No webpack bundling errors

**Architecture Benefits:**
- Optimal performance (no HTTP overhead for SSR)
- Capacitor-ready (APIs work from native apps)
- Single codebase (web + native)
- User-friendly (standard REST API pattern)

**Next Steps:**
- Phase 7: iOS camera implementation (when ready for native testing)
- Phase 8: Update architecture documentation

## Recent Updates (2025-11-11)

### Capacitor Setup & Web App Testing
Complete Capacitor architecture setup and verification that existing web app works correctly.

**Testing Summary:**
- ✅ Environment variables configured
- ✅ Linting passes with no errors
- ✅ TypeScript compilation successful
- ✅ Regular build completes (27 pages generated)
- ✅ Dev server starts correctly
- ✅ Homepage loads
- ✅ Auth pages (login/register) load
- ✅ API health check works
- ✅ API auth protection works (401 for protected routes)
- ✅ All core features functional

**Capacitor Configuration:**
- Created `/capacitor.config.ts` with app configuration
- Updated `/next.config.js` with conditional static export for Capacitor builds
- Added TypeScript path aliases: `@/shared`, `@/capacitor`
- Created `/shared/platform.ts` for platform detection
- Created `/shared/features.ts` for feature flags

**API Routes Configuration:**
All API routes now have `export const dynamic = "force-dynamic"` directive to indicate they:
- Run server-side only (cannot be statically exported)
- Will be called via HTTPS from native apps (pointing to Vercel deployment)
- Are excluded from Capacitor static builds

**Important Discovery - Capacitor Build Strategy:**

Next.js static export (`output: 'export'`) **fundamentally cannot** include API routes. This is by design.

**Solution (per architecture docs):**
1. **Web deployment:** Regular Next.js build → Vercel (includes API routes)
2. **Native app deployment:**
   - Native app will call Vercel-deployed APIs via HTTPS
   - Static export build will be used when implementing first native feature (camera)
   - Until then, web app works normally without changes

**Files Modified:**
- `/next.config.js` - Added Capacitor conditional config
- `/capacitor.config.ts` - NEW - Capacitor configuration
- `/shared/platform.ts` - NEW - Platform detection utility
- `/shared/features.ts` - NEW - Feature flags
- All `/app/api/**/route.ts` files - Added `dynamic = "force-dynamic"` directive

**Next Steps:**
- iOS/Android native projects will be created with `npx cap add ios/android` when implementing camera feature
- Until then, continue developing web features normally
- Capacitor structure is ready for native development

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
