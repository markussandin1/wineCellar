/**
 * Hybrid Food-Wine Pairing Matcher
 *
 * Combines rule-based scoring with semantic search for intelligent recommendations.
 *
 * Strategy:
 * 1. Classify food into category for rule-based matching
 * 2. Generate embedding for semantic search
 * 3. Fetch candidate wines from user's cellar with embeddings
 * 4. Calculate hybrid score (60% semantic + 40% rule-based)
 * 5. Return top matches with explanations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateTextEmbedding } from '../ai/embeddings';
import { classifyFood, calculateRuleBasedScore, generatePairingExplanation } from './rule-based-scoring';
import { semanticSearchWines, isSemanticSearchAvailable } from './semantic-search';
import type {
  FoodPairingSearchInput,
  FoodPairingSearchResult,
  WineRecommendation,
  MatchScore,
  BottleWithWine,
  FoodCategory,
} from './food-pairing.types';

/**
 * Calculate hybrid score combining semantic and rule-based scoring
 */
function calculateHybridScore(
  semanticScore: number,
  ruleBasedScore: number,
  ruleBreakdown: {
    wineTypeMatch: number;
    bodyMatch: number;
    tanninMatch: number;
    acidityMatch: number;
  }
): MatchScore {
  // Weight semantic search more heavily (60%) since it captures food pairing context
  // Rule-based provides complementary structural matching (40%)
  const SEMANTIC_WEIGHT = 0.6;
  const RULE_WEIGHT = 0.4;

  const total = semanticScore * SEMANTIC_WEIGHT + ruleBasedScore * RULE_WEIGHT;

  return {
    total: Math.round(total),
    ruleBasedScore: Math.round(ruleBasedScore),
    semanticScore: Math.round(semanticScore),
    breakdown: {
      semanticSimilarity: Math.round(semanticScore),
      ...ruleBreakdown,
    },
  };
}

/**
 * Generate pairing reason combining semantic and rule-based insights
 */
function generatePairingReason(
  wine: BottleWithWine,
  foodCategory: FoodCategory,
  score: MatchScore
): string {
  const reasons: string[] = [];

  // Check if wine's food pairings mention similar foods
  if (wine.foodPairings && wine.foodPairings.length > 0) {
    const relevantPairings = wine.foodPairings.slice(0, 2);
    reasons.push(`Traditionally pairs with: ${relevantPairings.join(', ')}`);
  }

  // Add rule-based explanation
  const ruleExplanation = generatePairingExplanation(wine, foodCategory, score.ruleBasedScore);
  if (ruleExplanation) {
    reasons.push(ruleExplanation);
  }

  if (reasons.length === 0) {
    return 'This wine matches your dish based on flavor profiles and characteristics';
  }

  return reasons.join('. ');
}

/**
 * Search for wine pairings for a dish
 *
 * @param supabase - Supabase client
 * @param input - Search input with dish and user ID
 * @returns Search result with recommendations
 */
export async function searchFoodPairings(
  supabase: SupabaseClient,
  input: FoodPairingSearchInput
): Promise<FoodPairingSearchResult> {
  const { dish, userId, limit = 10 } = input;

  // 1. Classify food for rule-based matching
  const foodCategory = classifyFood(dish);
  console.log(`Classified "${dish}" as: ${foodCategory}`);

  // 2. Check if semantic search is available
  const hasEmbeddings = await isSemanticSearchAvailable(supabase, userId);

  if (!hasEmbeddings) {
    console.log('No embeddings available for user wines - falling back to rule-based only');
    return fallbackRuleBasedSearch(supabase, userId, dish, foodCategory, limit);
  }

  // 3. Generate embedding for dish description
  let queryEmbedding: number[];
  try {
    const embeddingResult = await generateTextEmbedding(dish);
    queryEmbedding = embeddingResult.embedding;
    console.log(`Generated embedding for "${dish}" (${embeddingResult.tokensUsed} tokens)`);
  } catch (error) {
    console.error('Failed to generate embedding, falling back to rule-based:', error);
    return fallbackRuleBasedSearch(supabase, userId, dish, foodCategory, limit);
  }

  // 4. Perform semantic search
  const semanticResults = await semanticSearchWines(
    supabase,
    queryEmbedding,
    userId,
    limit * 2 // Get more candidates for re-ranking
  );

  console.log(`Found ${semanticResults.length} wines via semantic search`);

  // 5. Calculate hybrid scores and create recommendations
  const recommendations: WineRecommendation[] = semanticResults.map((result) => {
    // Calculate rule-based score
    const ruleResult = calculateRuleBasedScore(result.wine, foodCategory);

    // Combine scores
    const hybridScore = calculateHybridScore(
      result.similarityScore,
      ruleResult.score,
      ruleResult.breakdown
    );

    // Create bottle object (semantic search returns wine data, but we need bottle structure)
    const bottleWithWine: BottleWithWine = {
      ...result.wine,
      bottleId: '', // Will be populated from bottles table if needed
      quantity: 1, // Placeholder
      status: 'in_cellar',
    };

    return {
      wine: bottleWithWine,
      score: hybridScore,
      explanation: generatePairingExplanation(result.wine, foodCategory, ruleResult.score),
      pairingReason: generatePairingReason(bottleWithWine, foodCategory, hybridScore),
    };
  });

  // 6. Sort by total score and limit results
  recommendations.sort((a, b) => b.score.total - a.score.total);
  const topRecommendations = recommendations.slice(0, limit);

  return {
    query: dish,
    foodCategory,
    recommendations: topRecommendations,
    totalWinesScanned: semanticResults.length,
  };
}

/**
 * Fallback to rule-based only when embeddings are not available
 */
async function fallbackRuleBasedSearch(
  supabase: SupabaseClient,
  userId: string,
  dish: string,
  foodCategory: FoodCategory,
  limit: number
): Promise<FoodPairingSearchResult> {
  // Fetch all user's wines with characteristics
  const { data: userBottles, error } = await supabase
    .from('bottles')
    .select(`
      id,
      quantity,
      status,
      purchase_price,
      storage_location,
      wines!inner(
        id,
        name,
        producer_name,
        vintage,
        wine_type,
        body,
        tannin_level,
        acidity_level,
        sweetness_level,
        primary_grape,
        enrichment_data,
        primary_label_image_url
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'in_cellar')
    .gt('quantity', 0);

  if (error || !userBottles || userBottles.length === 0) {
    console.error('Error fetching user bottles:', error);
    return {
      query: dish,
      foodCategory,
      recommendations: [],
      totalWinesScanned: 0,
    };
  }

  // Score each wine using rule-based matching
  const recommendations: WineRecommendation[] = userBottles
    .map((bottle: any) => {
      const wine = bottle.wines;
      const foodPairings = wine.enrichment_data?.foodPairings || [];

      const wineCharacteristics = {
        wineId: wine.id,
        wineName: wine.name,
        producerName: wine.producer_name,
        vintage: wine.vintage,
        wineType: wine.wine_type,
        body: wine.body,
        tanninLevel: wine.tannin_level,
        acidityLevel: wine.acidity_level,
        sweetnessLevel: wine.sweetness_level,
        primaryGrape: wine.primary_grape,
        foodPairings,
        primaryLabelImageUrl: wine.primary_label_image_url,
      };

      const ruleResult = calculateRuleBasedScore(wineCharacteristics, foodCategory);

      // In rule-based only mode, semantic score = 0
      const score: MatchScore = {
        total: ruleResult.score,
        ruleBasedScore: ruleResult.score,
        semanticScore: 0,
        breakdown: {
          semanticSimilarity: 0,
          ...ruleResult.breakdown,
        },
      };

      const bottleWithWine: BottleWithWine = {
        ...wineCharacteristics,
        bottleId: bottle.id,
        quantity: bottle.quantity,
        status: bottle.status,
        purchasePrice: bottle.purchase_price,
        storageLocation: bottle.storage_location,
      };

      return {
        wine: bottleWithWine,
        score,
        explanation: generatePairingExplanation(wineCharacteristics, foodCategory, ruleResult.score),
        pairingReason: generatePairingReason(bottleWithWine, foodCategory, score),
      };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, limit);

  return {
    query: dish,
    foodCategory,
    recommendations,
    totalWinesScanned: userBottles.length,
  };
}
