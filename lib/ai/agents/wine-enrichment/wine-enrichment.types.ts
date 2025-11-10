/**
 * Types for Wine Enrichment Agent
 */

/**
 * Input for wine enrichment
 */
export interface WineEnrichmentInput {
  /** Wine name */
  name: string;
  /** Producer name */
  producerName: string;
  /** Wine type (optional) */
  wineType?: string | null;
  /** Vintage year (optional) */
  vintage?: number | null;
  /** Country (optional) */
  country?: string | null;
  /** Region (optional) */
  region?: string | null;
  /** Sub-region (optional) */
  subRegion?: string | null;
  /** Primary grape (optional) */
  primaryGrape?: string | null;
  /** Any additional tasting hints (optional) */
  tastingProfileHints?: string | null;
}

/**
 * Tasting notes structure
 */
export interface TastingNotes {
  /** Aromatic profile */
  nose: string;
  /** Flavor profile and texture */
  palate: string;
  /** Finish characteristics */
  finish: string;
}

/**
 * Output from wine enrichment
 */
export interface WineEnrichmentOutput {
  /** Two-sentence summary of the wine */
  summary: string;
  /** Overview of producer and wine positioning */
  overview: string;
  /** Terroir and vineyard details */
  terroir: string;
  /** Winemaking techniques */
  winemaking: string;
  /** Tasting notes */
  tastingNotes: TastingNotes;
  /** Serving and cellaring guidance */
  serving: string;
  /** Food pairing suggestions (3-4 items) */
  foodPairings: string[];
  /** Signature traits that make the wine distinctive */
  signatureTraits: string;
  /** Inferred country (if agent could determine with high confidence) */
  inferredCountry?: string | null;
  /** Inferred region (if agent could determine with high confidence) */
  inferredRegion?: string | null;
}
