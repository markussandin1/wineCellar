/**
 * Generate Wine Embedding Service
 *
 * Generates vector embeddings from wine enrichment data for semantic search.
 * Combines all relevant wine information into a single text representation:
 * - Summary and overview
 * - Tasting notes (nose, palate, finish)
 * - Food pairings
 * - Signature traits
 * - Basic wine info (name, producer, type, grape)
 */

import { generateTextEmbedding } from './generate-text-embedding';
import type { GenerateWineEmbeddingInput, EmbeddingResult } from './embeddings.types';

/**
 * Build comprehensive text representation of wine for embedding
 *
 * @param input - Wine data to convert to text
 * @returns Text representation optimized for semantic search
 */
function buildWineTextForEmbedding(input: GenerateWineEmbeddingInput): string {
  const { enrichmentData, wineName, producerName, wineType, primaryGrape } = input;

  const sections: string[] = [];

  // Basic wine information
  const basicInfo = [wineName, producerName, wineType, primaryGrape]
    .filter(Boolean)
    .join(' • ');
  sections.push(basicInfo);

  // Summary - High-level overview
  if (enrichmentData.summary) {
    sections.push(enrichmentData.summary);
  }

  // Overview - Producer context
  if (enrichmentData.overview) {
    sections.push(enrichmentData.overview);
  }

  // Tasting notes - Most important for food pairing
  if (enrichmentData.tastingNotes) {
    const tastingText = [
      enrichmentData.tastingNotes.nose,
      enrichmentData.tastingNotes.palate,
      enrichmentData.tastingNotes.finish,
    ]
      .filter(Boolean)
      .join(' ');

    if (tastingText) {
      sections.push(`Tasting: ${tastingText}`);
    }
  }

  // Food pairings - Critical for food-wine matching
  if (enrichmentData.foodPairings && enrichmentData.foodPairings.length > 0) {
    sections.push(`Pairs with: ${enrichmentData.foodPairings.join(', ')}`);
  }

  // Signature traits - What makes this wine unique
  if (enrichmentData.signatureTraits) {
    sections.push(enrichmentData.signatureTraits);
  }

  // Terroir - Regional characteristics (optional, can be verbose)
  if (enrichmentData.terroir) {
    sections.push(enrichmentData.terroir);
  }

  return sections.join('\n\n');
}

/**
 * Generate embedding for a wine based on its enrichment data
 *
 * @param input - Wine enrichment data and metadata
 * @returns Embedding result with vector and metadata
 *
 * @example
 * ```ts
 * const result = await generateWineEmbedding({
 *   wineId: 'abc123',
 *   wineName: 'Barolo',
 *   producerName: 'Conterno',
 *   wineType: 'red',
 *   primaryGrape: 'Nebbiolo',
 *   enrichmentData: {
 *     summary: 'Powerful, structured wine...',
 *     foodPairings: ['Braised beef', 'Truffle dishes'],
 *     // ... other enrichment data
 *   }
 * });
 *
 * // Store result.embedding in database
 * await supabase
 *   .from('wines')
 *   .update({ embedding: result.embedding })
 *   .eq('id', input.wineId);
 * ```
 */
export async function generateWineEmbedding(
  input: GenerateWineEmbeddingInput
): Promise<EmbeddingResult> {
  // Validate input
  if (!input.enrichmentData) {
    throw new Error('Enrichment data is required to generate wine embedding');
  }

  if (!input.wineId || !input.wineName || !input.producerName) {
    throw new Error('Wine ID, name, and producer name are required');
  }

  // Build comprehensive text representation
  const wineText = buildWineTextForEmbedding(input);

  if (!wineText || wineText.trim().length === 0) {
    throw new Error('Failed to build text representation for wine');
  }

  // Generate embedding using text embedding service
  try {
    const result = await generateTextEmbedding(wineText);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate wine embedding: ${error.message}`);
    }
    throw new Error('Failed to generate wine embedding: Unknown error');
  }
}

/**
 * Validate that enrichment data has sufficient information for embedding
 *
 * @param enrichmentData - Wine enrichment data to validate
 * @returns True if data is sufficient, false otherwise
 */
export function hasValidEnrichmentForEmbedding(
  enrichmentData: any
): boolean {
  if (!enrichmentData) {
    return false;
  }

  // Must have at least summary OR (tastingNotes AND foodPairings)
  const hasSummary = Boolean(enrichmentData.summary);
  const hasTastingNotes = Boolean(
    enrichmentData.tastingNotes?.nose ||
    enrichmentData.tastingNotes?.palate ||
    enrichmentData.tastingNotes?.finish
  );
  const hasFoodPairings = Boolean(
    enrichmentData.foodPairings && enrichmentData.foodPairings.length > 0
  );

  return hasSummary || (hasTastingNotes && hasFoodPairings);
}
