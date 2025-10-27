# Local Development Setup

## Current Architecture (Post-Migration)

After migrating from Prisma to Supabase Data API, the local development environment now matches production exactly.

### ✅ What Works Locally

1. **Supabase Data API** (REST-based)
   - All database queries use Supabase JS client
   - Uses snake_case column names (e.g., `producer_name`, `wine_type`)
   - Same behavior as production (serverless-friendly)

2. **Supabase Auth** (SSR)
   - Cookie-based authentication
   - Same flow as production

3. **OpenAI Integration**
   - Label scanning with GPT-4 Vision
   - Wine descriptions with GPT-4

### 🔧 Environment Variables Required

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://pktiwlfxgfkkqxzhtaxe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# OpenAI (REQUIRED for AI features)
OpenAI_API_Key=sk-proj-...

# Optional (legacy, not used in main app)
DATABASE_URL=postgresql://...  # Only for Prisma scripts
DIRECT_URL=postgresql://...    # Only for Prisma scripts
```

### 🚀 Quick Start

```bash
# Install dependencies
npm install

# Test your local setup
node scripts/test-local-setup.js

# Start dev server
npm run dev
```

### 🧪 Testing Locally

1. **Test Database Connection**
   ```bash
   node scripts/test-local-setup.js
   ```

2. **Test the App**
   - Go to http://localhost:3000
   - Register a new account
   - Try adding a bottle
   - Test label scanning (requires OpenAI key)

### 📊 Database Schema

The database uses **snake_case** for all column names:
- `user_id` (not userId)
- `wine_id` (not wineId)
- `producer_name` (not producerName)
- `wine_type` (not wineType)
- `created_at` (not createdAt)
- etc.

TypeScript code uses **camelCase** and we map between them.

### ⚠️ Important Notes

1. **No Prisma in Main App**
   - The main application NO LONGER uses Prisma
   - Prisma is only used for migration scripts
   - All queries use Supabase Data API

2. **Local = Production**
   - Both use the same Supabase instance
   - Both use the same authentication flow
   - Both use REST API (no connection pooler issues)

3. **NextAuth Removed**
   - We migrated from NextAuth to Supabase Auth
   - Old NextAuth config can be ignored

### 🐛 Troubleshooting

**Problem**: "Could not find table 'Bottle'"
- **Cause**: Using PascalCase table names
- **Fix**: Use lowercase: `bottles`, `wines`, etc.

**Problem**: "Column 'producerName' does not exist"
- **Cause**: Using camelCase column names
- **Fix**: Use snake_case: `producer_name`, `wine_type`, etc.

**Problem**: Can't connect to database
- **Cause**: Missing Supabase credentials
- **Fix**: Check `.env` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 📝 Adding New Features Locally

When adding new features:

1. Use Supabase Data API for all database operations
2. Use snake_case for column names in queries
3. Map results to camelCase for TypeScript code
4. Test locally before pushing (it will behave exactly like production)

Example:
```typescript
// ✅ Correct
const { data } = await supabase
  .from('bottles')  // lowercase table
  .select('producer_name, wine_type')  // snake_case columns
  .eq('user_id', userId);

// Map to camelCase for use in code
const normalized = data.map(bottle => ({
  producerName: bottle.producer_name,
  wineType: bottle.wine_type,
}));

// ❌ Wrong
const { data } = await prisma.bottle.findMany();  // Don't use Prisma
```
