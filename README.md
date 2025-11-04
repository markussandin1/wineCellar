# Wine Cellar MVP

AI-Powered Wine Collection Manager - Track your wine collection effortlessly with AI label scanning and smart insights.

## Features

- **AI Label Scanning**: Snap a photo of wine labels and let AI extract details automatically
- **Smart Insights**: Dashboard with collection stats, drinking windows, and value tracking
- **Bottle Management**: Track purchases, storage locations, ratings, and consumption history
- **Wine Knowledge**: AI-powered explanations for grapes, regions, and wine characteristics
- **Mobile-First PWA**: Optimized for mobile with offline capabilities

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **PWA**: @ducanh2912/next-pwa

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Prisma Postgres local or Supabase/Neon for production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (Credentials + Google OAuth)

### AI Integration
- **Label Recognition**: OpenAI Vision API (gpt-4o)
- **Wine Knowledge**: OpenAI API (gpt-4o-mini)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database (local Prisma Postgres or Supabase/Neon)

### Installation

1. Clone the repository
```bash
git clone https://github.com/markussandin1/wineCellar.git
cd wineCellar
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your:
- OpenAI API key
- Database URL
- NextAuth secret
- Google OAuth credentials (optional)

4. Generate Prisma client
```bash
npm run db:generate
```

5. Push database schema
```bash
npm run db:push
```

6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

The app uses a comprehensive schema with 10 models:
- **User**: User accounts and preferences
- **Account/Session**: NextAuth session management
- **Wine**: Canonical wine information
- **Bottle**: Individual bottle purchases
- **ConsumptionLog**: Drinking history and ratings
- **LabelScan**: AI label scanning history
- **Producer**: Wine producers (optional)
- **WineKnowledge**: Cached AI explanations
- **PriceHistory**: Wine value tracking
- **UserPreferenceLearning**: AI preference learning

See `datamodels.md` for detailed schema documentation.

## Design System

The app features a comprehensive Wine Cellar Design System with dark aesthetics and warm amber accents, fully WCAG AA compliant.

**Documentation:**
- **[Design System Guide](DESIGN_SYSTEM.md)** - Complete component library, usage patterns, and best practices
- **[Accessibility Audit](ACCESSIBILITY_AUDIT.md)** - WCAG 2.1 AA compliance checklist and testing results
- **Live Documentation**: Visit `/design-system` in the app for interactive examples

**Key Features:**
- Dark wine cellar aesthetic with ambient glow effects
- Playfair Display typography for elegant headings
- Wine type color coding (red, white, rosé, sparkling, dessert, fortified)
- Reusable component library (`lib/design-system/`)
- Form components with consistent styling
- Mobile-first responsive design

## Development Roadmap

### Phase 1: Foundation ✓
- [x] Next.js setup with TypeScript
- [x] Prisma + PostgreSQL
- [x] NextAuth authentication
- [x] Basic layout and navigation
- [x] PWA configuration

### Phase 2: Core Bottle Management ✓
- [x] Manual bottle entry form with validation
- [x] Bottle list/grid view with filters (type, status, search)
- [x] Bottle detail page with all information
- [x] Edit/delete bottles with confirmation
- [x] Mark as consumed with rating and tasting notes
- [x] Dashboard with real stats and insights
- [x] Filter by wine type, status, and region
- [x] Grid/list view toggle
- [x] **Wine Cellar Design System** - Complete visual overhaul
  - [x] Dark wine cellar aesthetic with amber accents
  - [x] Playfair Display typography
  - [x] Reusable component library
  - [x] WCAG AA compliant
  - [x] Comprehensive documentation

### Phase 3: AI Label Scanning ✓
- [x] Image upload UI with preview
- [x] OpenAI Vision integration for label extraction
- [x] Review/edit extracted data before saving
- [x] Wine matching algorithm (find existing or create new)
- [x] Batch upload support (up to 20 labels)
- [x] Parallel AI processing with rate limiting
- [x] Real-time progress tracking

### Phase 4: Intelligence Layer (Next)
- [ ] S3/Cloudflare R2 storage integration for images
- [ ] Advanced dashboard insights (peak drinking window)
- [ ] Wine knowledge explanations (tap grape/region)
- [ ] Wine comparison side-by-side
- [ ] AI preference learning from ratings
- [ ] Recommendation engine

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run mcp:supabase # Compile and launch the Supabase MCP server
```

## MCP Supabase Server

This repository ships with a Model Context Protocol (MCP) server that exposes Supabase metadata and read-only helpers so AI coding agents can reason about the live schema and data.

- Ensure the following environment variables are available when you launch the server: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or fall back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and a database connection string via `SUPABASE_DB_URL` or `DATABASE_URL`.
- Start the server locally:
  ```bash
  npm run mcp:supabase
  ```
- By default it listens on `http://127.0.0.1:54322/mcp`. Override the host/port/path with `SUPABASE_MCP_HOST`, `SUPABASE_MCP_PORT`, and `SUPABASE_MCP_PATH` if your MCP client requires a different endpoint.
- In VS Code / Claude Desktop, register the endpoint under a LocalProcess/HTTP MCP server entry to gain Supabase-aware tools (`list_supabase_tables`, `describe_supabase_table`, `sample_supabase_table`, `run_supabase_sql`, etc.).


## Contributing

This is an MVP project. Contributions are welcome!

## License

MIT
