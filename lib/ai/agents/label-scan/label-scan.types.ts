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
 * Output from label scanning
 */
export interface LabelScanOutput {
  /** Wine name exactly as written on the label */
  wineName: string;
  /** Producer/winery name exactly as written */
  producerName: string;
  /** Vintage year (null if NV or not visible) */
  vintage: number | null;
  /** Wine type category */
  wineType: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified' | null;
  /** Country of origin (null if not visible on label) */
  country: string | null;
  /** Region (null if not visible on label) */
  region: string | null;
  /** Sub-region/appellation (null if not visible on label) */
  subRegion: string | null;
  /** Primary grape variety (null if not visible on label) */
  primaryGrape: string | null;
  /** Overall confidence in extraction (0-1) */
  confidence: number;
}
