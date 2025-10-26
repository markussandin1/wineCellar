/**
 * Wine matching utilities
 * Used for matching wines across label scanning and manual entry
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

/**
 * Match a wine against a list of candidates
 * Returns the best match if similarity > threshold
 */
export interface WineCandidate {
  id: string;
  name: string;
  producerName: string;
  vintage: number | null;
  [key: string]: any;
}

export interface WineMatch {
  wine: WineCandidate;
  score: number;
}

export function findBestWineMatch(
  target: {
    name: string;
    producerName: string;
    vintage?: number | null;
  },
  candidates: WineCandidate[],
  threshold: number = 0.85
): WineMatch | null {
  let bestMatch: WineCandidate | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const nameScore = stringSimilarity(candidate.name, target.name);
    const producerScore = stringSimilarity(candidate.producerName, target.producerName);
    const vintageMatch = !target.vintage || candidate.vintage === target.vintage;

    const totalScore = (nameScore + producerScore) / 2;

    // If we have a good match (>threshold) and vintage matches
    if (totalScore > threshold && vintageMatch && totalScore > bestScore) {
      bestMatch = candidate;
      bestScore = totalScore;
    }
  }

  if (bestMatch) {
    return { wine: bestMatch, score: bestScore };
  }

  return null;
}
