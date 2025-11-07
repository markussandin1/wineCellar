/**
 * Rule-Based Food-Wine Pairing Scoring
 *
 * Calculates compatibility scores based on classic food-wine pairing principles:
 * - Wine type matching food category
 * - Body matching richness
 * - Tannin cutting through fat
 * - Acidity balancing richness
 */

import type { WineCharacteristics, FoodCategory } from './food-pairing.types';

/**
 * Classify food into categories based on keywords
 */
export function classifyFood(dish: string): FoodCategory {
  const lower = dish.toLowerCase();

  // Red meat
  if (/(beef|steak|lamb|venison|game|red meat|brisket|ribs)/i.test(lower)) {
    return 'red-meat';
  }

  // White meat
  if (/(chicken|turkey|pork|veal|white meat)/i.test(lower)) {
    return 'white-meat';
  }

  // Fish & seafood
  if (/(fish|salmon|tuna|cod|seafood|shrimp|lobster|crab|oyster|mussel|clam)/i.test(lower)) {
    return 'fish-seafood';
  }

  // Pasta (often identifies Italian dishes)
  if (/(pasta|spaghetti|linguine|penne|carbonara|bolognese|lasagna|ravioli|gnocchi)/i.test(lower)) {
    return 'pasta';
  }

  // Cheese
  if (/(cheese|camembert|brie|cheddar|gouda|parmesan|blue cheese)/i.test(lower)) {
    return 'cheese';
  }

  // Grilled/smoked
  if (/(grilled|grillad|bbq|barbecue|smoked|rökt)/i.test(lower)) {
    return 'grilled-smoked';
  }

  // Rich/fatty
  if (/(cream|butter|fried|creamy|rich|fatty|truffle)/i.test(lower)) {
    return 'rich-fatty';
  }

  // Spicy
  if (/(spicy|curry|chili|hot|thai|indian|mexican)/i.test(lower)) {
    return 'spicy';
  }

  // Vegetables
  if (/(vegetable|salad|greens|mushroom|vegetarian)/i.test(lower)) {
    return 'vegetables';
  }

  // Dessert
  if (/(dessert|cake|chocolate|pie|tart|sweet)/i.test(lower)) {
    return 'dessert';
  }

  return 'unknown';
}

/**
 * Score wine type compatibility with food category
 * Returns 0-100
 */
function scoreWineTypeMatch(wineType: string, foodCategory: FoodCategory): number {
  const rules: Record<FoodCategory, Record<string, number>> = {
    'red-meat': {
      red: 100,
      fortified: 70,
      rose: 40,
      white: 20,
      sparkling: 30,
      dessert: 10,
    },
    'white-meat': {
      white: 90,
      rose: 85,
      red: 50,
      sparkling: 80,
      fortified: 30,
      dessert: 10,
    },
    'fish-seafood': {
      white: 100,
      sparkling: 90,
      rose: 70,
      red: 20,
      fortified: 30,
      dessert: 10,
    },
    'pasta': {
      red: 85,
      white: 75,
      rose: 70,
      sparkling: 60,
      fortified: 40,
      dessert: 10,
    },
    'cheese': {
      red: 80,
      white: 75,
      fortified: 85,
      sparkling: 70,
      rose: 65,
      dessert: 80,
    },
    'vegetables': {
      white: 90,
      rose: 85,
      sparkling: 80,
      red: 50,
      fortified: 30,
      dessert: 10,
    },
    'spicy': {
      white: 85,
      rose: 80,
      sparkling: 75,
      dessert: 70,
      red: 40,
      fortified: 30,
    },
    'rich-fatty': {
      red: 90,
      sparkling: 85,
      white: 70,
      rose: 65,
      fortified: 75,
      dessert: 50,
    },
    'grilled-smoked': {
      red: 95,
      fortified: 70,
      rose: 60,
      white: 40,
      sparkling: 45,
      dessert: 20,
    },
    'dessert': {
      dessert: 100,
      fortified: 85,
      sparkling: 70,
      white: 50,
      rose: 40,
      red: 20,
    },
    'unknown': {
      red: 60,
      white: 60,
      rose: 60,
      sparkling: 60,
      fortified: 50,
      dessert: 40,
    },
  };

  return rules[foodCategory]?.[wineType] ?? 50;
}

/**
 * Score body match with food richness
 * Lighter foods need lighter wines, rich foods need full-bodied wines
 */
function scoreBodyMatch(
  body: 'light' | 'medium' | 'full' | null | undefined,
  foodCategory: FoodCategory
): number {
  if (!body) return 50; // Neutral if unknown

  const richCategories: FoodCategory[] = ['red-meat', 'rich-fatty', 'grilled-smoked', 'cheese'];
  const lightCategories: FoodCategory[] = ['fish-seafood', 'vegetables', 'white-meat'];

  const isRichFood = richCategories.includes(foodCategory);
  const isLightFood = lightCategories.includes(foodCategory);

  if (isRichFood) {
    return body === 'full' ? 100 : body === 'medium' ? 70 : 40;
  }

  if (isLightFood) {
    return body === 'light' ? 100 : body === 'medium' ? 70 : 40;
  }

  // Pasta, spicy, dessert - medium body usually works
  return body === 'medium' ? 100 : body === 'full' ? 75 : 75;
}

/**
 * Score tannin level match
 * High tannin cuts through fat, complements protein
 */
function scoreTanninMatch(
  tanninLevel: 'low' | 'medium' | 'high' | null | undefined,
  foodCategory: FoodCategory
): number {
  if (!tanninLevel) return 50; // Neutral if unknown

  const highProteinFat: FoodCategory[] = ['red-meat', 'rich-fatty', 'grilled-smoked', 'cheese'];
  const lowProteinFat: FoodCategory[] = ['fish-seafood', 'vegetables', 'spicy', 'dessert'];

  if (highProteinFat.includes(foodCategory)) {
    return tanninLevel === 'high' ? 100 : tanninLevel === 'medium' ? 70 : 40;
  }

  if (lowProteinFat.includes(foodCategory)) {
    return tanninLevel === 'low' ? 100 : tanninLevel === 'medium' ? 60 : 20;
  }

  // White meat, pasta - medium tannin OK
  return tanninLevel === 'medium' ? 100 : tanninLevel === 'low' ? 80 : 60;
}

/**
 * Score acidity level match
 * High acidity balances richness and fat
 */
function scoreAcidityMatch(
  acidityLevel: 'low' | 'medium' | 'high' | null | undefined,
  foodCategory: FoodCategory
): number {
  if (!acidityLevel) return 50; // Neutral if unknown

  const richCategories: FoodCategory[] = ['red-meat', 'rich-fatty', 'cheese', 'white-meat'];
  const acidicFoods: FoodCategory[] = ['fish-seafood', 'vegetables'];

  if (richCategories.includes(foodCategory)) {
    // High acidity cuts through richness
    return acidityLevel === 'high' ? 100 : acidityLevel === 'medium' ? 80 : 50;
  }

  if (acidicFoods.includes(foodCategory)) {
    // Match acidity with acidity
    return acidityLevel === 'high' ? 100 : acidityLevel === 'medium' ? 90 : 60;
  }

  // Pasta, grilled, spicy - medium to high acidity works
  return acidityLevel === 'high' ? 90 : acidityLevel === 'medium' ? 100 : 60;
}

/**
 * Calculate rule-based score for wine-food pairing
 *
 * @param wine - Wine characteristics
 * @param foodCategory - Classified food category
 * @returns Score 0-100 with breakdown
 */
export function calculateRuleBasedScore(
  wine: WineCharacteristics,
  foodCategory: FoodCategory
): {
  score: number;
  breakdown: {
    wineTypeMatch: number;
    bodyMatch: number;
    tanninMatch: number;
    acidityMatch: number;
  };
} {
  const wineTypeMatch = scoreWineTypeMatch(wine.wineType, foodCategory);
  const bodyMatch = scoreBodyMatch(wine.body, foodCategory);
  const tanninMatch = scoreTanninMatch(wine.tanninLevel, foodCategory);
  const acidityMatch = scoreAcidityMatch(wine.acidityLevel, foodCategory);

  // Weighted average (wine type is most important)
  const score =
    wineTypeMatch * 0.4 +
    bodyMatch * 0.25 +
    tanninMatch * 0.2 +
    acidityMatch * 0.15;

  return {
    score,
    breakdown: {
      wineTypeMatch,
      bodyMatch,
      tanninMatch,
      acidityMatch,
    },
  };
}

/**
 * Generate human-readable explanation for the pairing
 */
export function generatePairingExplanation(
  wine: WineCharacteristics,
  foodCategory: FoodCategory,
  ruleScore: number
): string {
  const { wineType, body, tanninLevel, acidityLevel } = wine;

  const explanations: string[] = [];

  // Wine type explanation
  if (foodCategory === 'red-meat' && wineType === 'red') {
    explanations.push('Classic pairing - red wine complements red meat beautifully');
  } else if (foodCategory === 'fish-seafood' && wineType === 'white') {
    explanations.push('Perfect match - white wine enhances delicate seafood flavors');
  } else if (foodCategory === 'pasta' && (wineType === 'red' || wineType === 'white')) {
    explanations.push('Italian classic - pairs wonderfully with pasta dishes');
  }

  // Body explanation
  if (body === 'full' && ['red-meat', 'rich-fatty', 'grilled-smoked'].includes(foodCategory)) {
    explanations.push('Full body matches the richness of the dish');
  } else if (body === 'light' && ['fish-seafood', 'vegetables'].includes(foodCategory)) {
    explanations.push('Light body won&apos;t overpower delicate flavors');
  }

  // Tannin explanation
  if (tanninLevel === 'high' && ['red-meat', 'rich-fatty'].includes(foodCategory)) {
    explanations.push('Tannins cut through fat and complement protein');
  }

  // Acidity explanation
  if (acidityLevel === 'high' && ['rich-fatty', 'cheese'].includes(foodCategory)) {
    explanations.push('High acidity balances richness perfectly');
  }

  if (explanations.length === 0) {
    if (ruleScore >= 70) {
      return 'Good pairing based on wine characteristics and food type';
    }
    return 'This wine could work depending on preparation and personal taste';
  }

  return explanations.join('. ');
}
