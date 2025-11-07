/**
 * Food-Wine Pairing Module
 *
 * Intelligent food-wine matching using hybrid approach:
 * - Rule-based scoring (wine characteristics + food category)
 * - Semantic search (vector similarity with embeddings)
 */

export { searchFoodPairings } from './food-pairing-matcher';
export { classifyFood, calculateRuleBasedScore, generatePairingExplanation } from './rule-based-scoring';
export { semanticSearchWines, isSemanticSearchAvailable } from './semantic-search';
export type {
  WineCharacteristics,
  BottleWithWine,
  FoodCategory,
  MatchScore,
  WineRecommendation,
  FoodPairingSearchInput,
  FoodPairingSearchResult,
} from './food-pairing.types';
