# Repository Guidelines

## Project Structure & Module Organization
The Next.js app uses the `app/` directory for routes and layouts; this is where you'll add new pages such as `app/cellar/page.tsx`. Shared UI lives in `components/` (domain folders for bottles, layout, generic UI) and reusable logic sits in `lib/` (`lib/supabase`, `lib/ai`, `lib/utils`). Static assets live in `public/`, styles in `app/globals.css`, and operational scripts in `scripts/` (e.g., `scripts/test-local-setup.js`). `prisma/schema.prisma` only supports migration scripts—runtime data access must go through the Supabase wrappers in `lib/supabase`.

## Build, Test, and Development Commands
Install once with `npm install`, then use `npm run dev` for local development. Run `npm run lint` before committing and `npm run build` followed by `npm run start` when verifying production behaviour. Database helpers include `npm run db:generate`, `npm run db:push`, and `npm run db:studio`; invoke them only when updating the schema for deployment. Re-check credentials after environment changes with `node scripts/test-local-setup.js`.

## Coding Style & Naming Conventions
All code is TypeScript with two-space indentation, trailing commas, and single quotes—match the existing files. Name React components with PascalCase, hooks with `useCamelCase`, and utility exports with camelCase. Keep Tailwind class lists ordered from layout to color to mirror current components. ESLint (`npm run lint`) is authoritative; avoid disabling rules and map snake_case fields from Supabase to camelCase DTOs at module boundaries.

## Testing Guidelines
There is no dedicated test runner yet, so linting and the local setup script are mandatory smoke checks. When you add tests, co-locate them with the feature (e.g., `app/cellar/__tests__/cellar-page.test.tsx`) and mock Supabase interactions instead of hitting the live service. Document manual auth and bottle CRUD steps in the PR when automated coverage is missing.

## Commit & Pull Request Guidelines
Follow the established Git style: short, imperative subjects under 72 characters (e.g., "Fix TypeScript errors in build"). Keep commits focused, reference issues in the body when applicable, and note schema or config updates. Pull requests need a concise summary, affected routes or scripts, new environment variables, and UI screenshots or recordings when visual behaviour changes. List the manual checks you performed.

## Supabase & Environment Notes
Read `LOCAL_DEV.md` before onboarding; local and production share the same Supabase project. Provide `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OPENAI_API_KEY` before running `npm run dev`. Query tables and columns in snake_case and translate them to camelCase data structures immediately after fetching, then confirm access with `node scripts/test-local-setup.js`.

Wine Cellar MVP - Development Instructions for Claude Code
Project Overview
Build a wine cellar management web application (PWA) that uses AI to make wine tracking effortless. The app solves three problems:

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

---

# AI Agent System Architecture (V2)

## Overview

The Wine Cellar app uses a modular AI agent system to intelligently gather wine information. The key principle: **AI is only used when needed**, specifically when a wine doesn't exist in our database.

## Core Concepts

### Wine vs Bottle Separation

**Wine** = Immutable metadata about the wine itself
- Producer, name, vintage, region, grape varieties
- Tasting notes, food pairings, descriptions
- Shared across all users
- Only enriched once via AI agents

**Bottle** = User's specific instance
- Purchase price, date, location
- Consumption status, personal ratings
- User-specific notes
- Never requires AI processing

### Agent Philosophy

1. **Single Responsibility**: Each agent does ONE thing well
2. **Composable**: Agents can run independently or in parallel
3. **Testable**: Each agent has clear inputs/outputs
4. **Maintainable**: Config and prompts isolated per agent
5. **Efficient**: Only run when needed

## Agent System Structure

```
lib/ai/agents/
├── base/
│   ├── agent.types.ts          # Base interfaces for all agents
│   ├── agent.config.ts         # Shared configuration utilities
│   └── agent.executor.ts       # Orchestration helpers
├── label-scan/
│   ├── label-scan.agent.ts     # Vision API label extraction
│   ├── label-scan.config.ts    # Model & prompt configuration
│   └── label-scan.types.ts     # Input/output types
├── wine-enrichment/
│   ├── wine-enrichment.agent.ts    # Detailed wine descriptions
│   ├── wine-enrichment.config.ts   # Model & prompt configuration
│   └── wine-enrichment.types.ts    # Input/output types
├── food-pairing/
│   ├── food-pairing.agent.ts       # Food pairing recommendations
│   ├── food-pairing.config.ts      # Model & prompt configuration
│   └── food-pairing.types.ts       # Input/output types
└── price-estimation/
    ├── price-estimation.agent.ts   # Market price estimation
    ├── price-estimation.config.ts  # Model & prompt configuration
    └── price-estimation.types.ts   # Input/output types
```

## Agent Workflows

### Scenario 1: Existing Wine (Fast Path)

```
User scans label
    ↓
LabelScanAgent extracts: name, producer, vintage
    ↓
Database lookup → MATCH FOUND
    ↓
Return existing wine data
    ↓
Show bottle form (user adds price, date, location)
    ↓
Save bottle record
```

**AI Usage**: 1 agent (label scan only)
**Cost**: ~$0.001 per scan
**Speed**: ~2 seconds

### Scenario 2: New Wine (Enrichment Path)

```
User scans label
    ↓
LabelScanAgent extracts: name, producer, vintage
    ↓
Database lookup → NO MATCH
    ↓
Parallel agent execution:
    ├─ WineEnrichmentAgent → descriptions, tasting notes
    ├─ FoodPairingAgent → food recommendations
    └─ PriceEstimationAgent → market price
    ↓
Merge results & save wine record
    ↓
Show bottle form with pre-filled wine data
    ↓
User adds bottle-specific info
    ↓
Save bottle record
```

**AI Usage**: 4 agents (parallel execution)
**Cost**: ~$0.005 per new wine
**Speed**: ~5 seconds (parallel)

## Base Agent Interface

Every agent implements:

```typescript
interface Agent<TInput, TOutput> {
  name: string;
  version: string;
  execute(input: TInput): Promise<AgentResult<TOutput>>;
}

interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  metadata: {
    model: string;
    tokensUsed: number;
    latencyMs: number;
  };
}
```

## Agent Configuration Pattern

Each agent has isolated configuration:

```typescript
// agent-name.config.ts
export const agentConfig = {
  name: 'agent-name',
  version: '1.0.0',
  model: 'gpt-5-mini', // Can be overridden via env
  temperature: 0.2,
  maxTokens: 500,
  systemPrompt: '...',
  userPromptTemplate: '...',
};
```

## Testing Strategy

1. **Unit Tests**: Each agent tested in isolation
2. **Integration Tests**: Full workflow (scan → enrich → save)
3. **A/B Testing**: Compare V1 vs V2 results
4. **Manual Testing**: Real wine labels

## Migration Plan

### Phase 1: Build V2 (Parallel)
- Create new agent system in `lib/ai/agents/`
- New API endpoint: `/api/scan-label-v2`
- New component: `LabelScannerV2`
- V1 remains untouched and functional

### Phase 2: Testing & Validation
- Test V2 with various wine labels
- Compare accuracy and speed with V1
- Tune prompts and configs

### Phase 3: Cutover
- Rename V2 → V1 (atomic switch)
- Remove old V1 code
- Monitor for issues

### Rollback Plan
If V2 has issues, simply revert the rename commits.

## Adding New Agents

To add a new agent (e.g., "vintage-quality"):

1. Create folder: `lib/ai/agents/vintage-quality/`
2. Add three files:
   - `vintage-quality.agent.ts` (implements Agent interface)
   - `vintage-quality.config.ts` (model, prompts)
   - `vintage-quality.types.ts` (input/output types)
3. Register in orchestrator
4. Add to parallel execution in new wine flow

## Performance Optimizations

1. **Caching**: Cache wine enrichment results by wine ID
2. **Batching**: Queue multiple scans for batch processing
3. **Timeouts**: Fail fast if agent takes >10s
4. **Fallbacks**: If enrichment fails, save basic wine data
5. **Monitoring**: Track token usage and costs per agent
