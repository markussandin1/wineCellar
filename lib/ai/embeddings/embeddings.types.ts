/**
 * Types for embedding generation service
 */

import type { WineEnrichmentOutput } from '../agents/wine-enrichment/wine-enrichment.types';

/**
 * Input for generating wine embedding
 */
export interface GenerateWineEmbeddingInput {
  enrichmentData: WineEnrichmentOutput;
  wineId: string;
  wineName: string;
  producerName: string;
  wineType?: string | null;
  primaryGrape?: string | null;
}

/**
 * Result from embedding generation
 */
export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  tokensUsed: number;
}

/**
 * Configuration for embedding generation
 */
export interface EmbeddingConfig {
  model: string;
  dimensions: number;
}
