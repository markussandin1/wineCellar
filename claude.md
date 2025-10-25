Wine Cellar MVP - Development Instructions for Claude Code
Project Overview
Build a wine cellar management web application (PWA) that uses AI to make wine tracking effortless. The app solves three problems:

Memory: Track wine details, prices, and characteristics without manual effort
Discovery: Understand what you own and get smart recommendations
Ease of use: Zero-friction input via AI label scanning, not spreadsheets

Core Philosophy: AI is invisible infrastructure, not a chatbot. The app should feel magical but simple.

Technical Stack
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
