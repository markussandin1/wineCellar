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

## Development Roadmap

### Phase 1: Foundation ✓
- [x] Next.js setup with TypeScript
- [x] Prisma + PostgreSQL
- [x] NextAuth authentication
- [x] Basic layout and navigation
- [x] PWA configuration

### Phase 2: Core Bottle Management (Current)
- [ ] Manual bottle entry form
- [ ] Bottle list/grid view with filters
- [ ] Bottle detail page
- [ ] Edit/delete bottles
- [ ] Mark as consumed with rating

### Phase 3: AI Label Scanning
- [ ] Image upload UI
- [ ] OpenAI Vision integration
- [ ] Review/edit extracted data
- [ ] Wine matching algorithm
- [ ] Storage integration

### Phase 4: Intelligence Layer
- [ ] Dashboard insights
- [ ] Wine knowledge explanations
- [ ] Wine comparison
- [ ] Preference learning

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## Contributing

This is an MVP project. Contributions are welcome!

## License

MIT
