Wine Cellar - Development Instructions for Claude Code
Project Overview
Build a wine cellar management web application (PWA) that uses AI to make wine tracking effortless.

- AI can never be mention in the app, ai is just a tool not a feature.
- Always update the claude.md file before each commit

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
