/**
 * Types for food-wine pairing functionality
 */

/**
 * Wine characteristics relevant for food pairing
 */
export interface WineCharacteristics {
  wineId: string;
  wineName: string;
  producerName: string;
  vintage?: number | null;
  wineType: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified';
  body?: 'light' | 'medium' | 'full' | null;
  tanninLevel?: 'low' | 'medium' | 'high' | null;
  acidityLevel?: 'low' | 'medium' | 'high' | null;
  sweetnessLevel?: 'dry' | 'off-dry' | 'medium' | 'sweet' | 'very_sweet' | null;
  primaryGrape?: string | null;
  foodPairings?: string[];
  embedding?: number[];
  primaryLabelImageUrl?: string | null;
}

/**
 * User's bottle with availability info
 */
export interface BottleWithWine extends WineCharacteristics {
  bottleId: string;
  quantity: number;
  status: 'in_cellar' | 'consumed' | 'gifted' | 'other';
  purchasePrice?: number | null;
  storageLocation?: string | null;
}

/**
 * Food category classification
 */
export type FoodCategory =
  | 'red-meat'
  | 'white-meat'
  | 'fish-seafood'
  | 'pasta'
  | 'cheese'
  | 'vegetables'
  | 'spicy'
  | 'rich-fatty'
  | 'grilled-smoked'
  | 'dessert'
  | 'unknown';

/**
 * Scoring components for wine-food match
 */
export interface MatchScore {
  total: number; // 0-100
  ruleBasedScore: number; // 0-100
  semanticScore: number; // 0-100
  breakdown: {
    wineTypeMatch: number;
    bodyMatch: number;
    tanninMatch: number;
    acidityMatch: number;
    semanticSimilarity: number;
  };
}

/**
 * Wine recommendation with explanation
 */
export interface WineRecommendation {
  wine: BottleWithWine;
  score: MatchScore;
  explanation: string;
  pairingReason: string;
}

/**
 * Input for food pairing search
 */
export interface FoodPairingSearchInput {
  dish: string;
  userId: string;
  limit?: number;
}

/**
 * Result from food pairing search
 */
export interface FoodPairingSearchResult {
  query: string;
  foodCategory: FoodCategory;
  recommendations: WineRecommendation[];
  totalWinesScanned: number;
}
