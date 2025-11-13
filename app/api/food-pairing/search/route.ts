import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchFoodPairings } from '@/lib/food-pairing';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


/**
 * POST /api/food-pairing/search
 *
 * Search for wine recommendations based on food/dish description.
 * Uses hybrid matching: semantic search + rule-based scoring.
 *
 * Request body:
 * {
 *   "dish": "pasta carbonara with bacon",
 *   "limit": 10  // optional, default 10
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "query": "pasta carbonara with bacon",
 *   "foodCategory": "pasta",
 *   "recommendations": [
 *     {
 *       "wine": {...},
 *       "score": {
 *         "total": 85,
 *         "ruleBasedScore": 75,
 *         "semanticScore": 92,
 *         "breakdown": {...}
 *       },
 *       "explanation": "Classic pairing - red wine complements pasta dishes",
 *       "pairingReason": "Traditionally pairs with: Pasta, Grilled meats"
 *     }
 *   ],
 *   "totalWinesScanned": 42
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { dish, limit } = body;

    // Validate input
    if (!dish || typeof dish !== 'string' || dish.trim().length === 0) {
      return NextResponse.json(
        { error: 'Dish description is required' },
        { status: 400 }
      );
    }

    if (dish.trim().length > 500) {
      return NextResponse.json(
        { error: 'Dish description too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const searchLimit = limit && typeof limit === 'number' && limit > 0 && limit <= 50
      ? limit
      : 10;

    console.log(`Food pairing search: "${dish}" for user ${user.id}`);

    // Perform search
    const result = await searchFoodPairings(supabase, {
      dish: dish.trim(),
      userId: user.id,
      limit: searchLimit,
    });

    console.log(`Found ${result.recommendations.length} recommendations`);

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error('Food pairing search error:', error);

    // Handle specific error cases
    if (error.message?.includes('OpenAI API key')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to search food pairings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/food-pairing/search
 *
 * Health check / info endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/food-pairing/search',
    method: 'POST',
    description: 'Search for wine pairings based on food/dish description',
    parameters: {
      dish: 'string (required) - Food or dish description',
      limit: 'number (optional) - Max results, default 10, max 50',
    },
    example: {
      dish: 'pasta carbonara with bacon',
      limit: 10,
    },
  });
}
