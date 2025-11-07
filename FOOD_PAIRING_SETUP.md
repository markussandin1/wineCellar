# Food-Wine Pairing Feature - Setup Guide

## Overview
The food-wine pairing feature uses a hybrid approach combining semantic search (vector embeddings) with rule-based scoring to recommend wines from your cellar based on food/dish descriptions.

## Features Implemented

### 1. Core Library (`lib/food-pairing/`)
- **food-pairing-matcher.ts** - Main matcher combining semantic + rule-based scoring
- **semantic-search.ts** - Vector similarity search using pgvector
- **rule-based-scoring.ts** - Classic pairing rules (wine type, body, tannin, acidity)
- **food-pairing.types.ts** - TypeScript type definitions

### 2. AI Embeddings (`lib/ai/embeddings/`)
- **generate-text-embedding.ts** - OpenAI text-embedding-3-small integration
- **generate-wine-embedding.ts** - Wine-specific embedding generation
- **embeddings.types.ts** - Type definitions

### 3. API Endpoints
- **POST /api/embeddings/generate** - Generate embedding for single wine
- **POST /api/embeddings/generate-all** - Batch generate embeddings for all wines
- **POST /api/food-pairing/search** - Search for wine pairings by dish

### 4. UI Components
- **FoodPairingWidget** - Dashboard widget for food pairing search
  - Search input for dish/food description
  - AI-powered recommendations with scores
  - Real-time search with error handling
  - Integrated into dashboard page

## Database Setup

### Step 1: Run the Migration
Execute the SQL migration in Supabase SQL Editor:

```bash
migrations/add_wine_embeddings.sql
```

This will:
- ✅ Enable pgvector extension
- ✅ Add `embedding` column (vector 1536) to wines table
- ✅ Add `embedding_generated_at` and `embedding_model` columns
- ✅ Create HNSW index for fast cosine similarity search
- ✅ Create `search_wines_by_embedding()` PostgreSQL function

### Step 2: Generate Embeddings
After wines have enrichment data, generate embeddings:

**Option A: Batch generate for all wines**
```bash
curl -X POST http://localhost:3000/api/embeddings/generate-all \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie"
```

**Option B: Generate for specific wine**
```bash
curl -X POST http://localhost:3000/api/embeddings/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"wineId": "wine-uuid-here"}'
```

## How It Works

### Hybrid Scoring Algorithm
The system combines two approaches:

1. **Semantic Search (60% weight)**
   - Generates embedding from dish description
   - Finds wines with similar flavor profiles using vector similarity
   - Cosine distance converted to 0-100 similarity score

2. **Rule-Based Scoring (40% weight)**
   - Classifies food into categories (red-meat, fish-seafood, pasta, etc.)
   - Matches wine characteristics:
     - Wine type (red/white/sparkling) - 40% of rule score
     - Body (light/medium/full) - 25% of rule score
     - Tannin level (low/medium/high) - 20% of rule score
     - Acidity level (low/medium/high) - 15% of rule score

### Food Categories
Supported categories with keyword matching:
- red-meat (beef, steak, lamb, game)
- white-meat (chicken, turkey, pork)
- fish-seafood (salmon, shrimp, oyster)
- pasta (spaghetti, carbonara, lasagna)
- cheese (camembert, brie, cheddar)
- grilled-smoked (grilled, bbq, smoked)
- rich-fatty (cream, butter, fried)
- spicy (curry, chili, thai, indian)
- vegetables (salad, greens, mushroom)
- dessert (cake, chocolate, pie)

## Usage Examples

### In the Dashboard
1. Navigate to `/dashboard`
2. Find the "Food Pairing" widget
3. Enter a dish (e.g., "grilled salmon with lemon butter")
4. Click "Find Pairing"
5. See ranked recommendations with scores and explanations

### API Usage
```javascript
// Search for pairing
const response = await fetch('/api/food-pairing/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dish: 'pasta carbonara with bacon',
    limit: 10
  })
});

const result = await response.json();
// {
//   success: true,
//   query: "pasta carbonara with bacon",
//   foodCategory: "pasta",
//   recommendations: [
//     {
//       wine: { wineId, wineName, ... },
//       score: {
//         total: 85,
//         ruleBasedScore: 75,
//         semanticScore: 92,
//         breakdown: { ... }
//       },
//       explanation: "Classic pairing...",
//       pairingReason: "Traditionally pairs with..."
//     }
//   ],
//   totalWinesScanned: 42
// }
```

## Performance Considerations

### Indexing
- HNSW index provides O(log n) search time
- Optimized for high-dimensional vectors (1536 dims)
- Cosine distance operator (`<->`) for similarity

### Rate Limiting
- Batch embedding generation includes 100ms delay between wines
- OpenAI API rate limits apply
- Consider caching embeddings (already done via DB)

### Fallback Behavior
- If no embeddings exist: Falls back to rule-based only
- If embedding generation fails: Returns rule-based results
- Graceful degradation ensures feature always works

## Cost Optimization

### Embedding Generation
- Model: `text-embedding-3-small` (most cost-effective)
- Dimensions: 1536 (vs 3072 for large model)
- Cost: ~$0.02 per 1M tokens
- Average wine embedding: ~200-300 tokens

### When to Generate Embeddings
- After wine enrichment is complete
- Only for wines with enrichment data
- Skip if embedding already exists
- Batch process during off-peak hours

## Testing

### Manual Testing Checklist
- [ ] Run migration successfully
- [ ] Generate embeddings for test wines
- [ ] Search for food pairing via API
- [ ] Use widget in dashboard
- [ ] Test with various food categories
- [ ] Verify fallback to rule-based if no embeddings

### Test Queries
```
"grilled ribeye steak with garlic butter"
"pasta carbonara with bacon and parmesan"
"fresh oysters with lemon"
"spicy thai green curry"
"dark chocolate dessert"
```

## Troubleshooting

### No recommendations returned
- Check if wines have embeddings: `SELECT COUNT(*) FROM wines WHERE embedding IS NOT NULL`
- Verify user has bottles: `SELECT COUNT(*) FROM bottles WHERE user_id = 'uuid' AND status = 'in_cellar'`
- Check API logs for errors

### Embedding generation fails
- Verify OpenAI API key is set: `OPENAI_API_KEY` in `.env`
- Check wine has enrichment data: `SELECT enrichment_data FROM wines WHERE id = 'uuid'`
- Review API rate limits

### Low quality recommendations
- Ensure wines have rich enrichment data (especially foodPairings)
- Consider generating more embeddings
- Adjust hybrid score weights in `food-pairing-matcher.ts`

## Future Enhancements

### Phase 2 Ideas
- [ ] User feedback loop (thumbs up/down on recommendations)
- [ ] Learn from consumption history
- [ ] Seasonal pairing suggestions
- [ ] Meal course sequencing (appetizer → main → dessert)
- [ ] Recipe integration
- [ ] Social sharing of pairings
- [ ] Wine pairing challenges/education

### Technical Improvements
- [ ] Add embeddings to search results cache
- [ ] Implement incremental embedding updates
- [ ] Add A/B testing for scoring weights
- [ ] Performance monitoring dashboard
- [ ] Automatic embedding regeneration on enrichment updates

## References
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- pgvector: https://github.com/pgvector/pgvector
- Wine Pairing Principles: Classic sommelier guidelines
