/**
 * Types for Label Scan Agent
 */

/**
 * Input for label scanning
 */
export interface LabelScanInput {
  /** Base64-encoded image data */
  imageBase64: string;
  /** MIME type of the image */
  mimeType: string;
}

/**
 * Estimated price information
 */
export interface EstimatedPrice {
  /** Price amount in EUR */
  amount: number | null;
  /** Currency code (always EUR) */
  currency: string;
  /** Confidence in the estimate (0-1) */
  confidence: number;
  /** Reasoning for the estimate */
  reasoning: string;
}

/**
 * Output from label scanning
 */
export interface LabelScanOutput {
  /** Wine name (e.g., 'Barolo', 'Chardonnay') */
  wineName: string;
  /** Producer/winery name */
  producerName: string;
  /** Vintage year (null if NV or not visible) */
  vintage: number | null;
  /** Wine type category */
  wineType: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified' | null;
  /** Country of origin */
  country: string | null;
  /** Region */
  region: string | null;
  /** Sub-region/appellation */
  subRegion: string | null;
  /** Primary grape variety */
  primaryGrape: string | null;
  /** Estimated price */
  estimatedPrice: EstimatedPrice;
  /** Overall confidence in extraction (0-1) */
  confidence: number;
}
