/**
 * Wine Enrichment Agent
 *
 * Generates comprehensive wine profiles including:
 * - Summary and overview
 * - Terroir and winemaking details
 * - Tasting notes (nose, palate, finish)
 * - Serving suggestions and food pairings
 * - Signature traits
 */

import { createAgent } from '../base';
import { wineEnrichmentConfig } from './wine-enrichment.config';
import type { WineEnrichmentInput, WineEnrichmentOutput } from './wine-enrichment.types';

/**
 * Parse and validate the wine enrichment response
 */
function parseWineEnrichmentResponse(rawResponse: string): WineEnrichmentOutput {
  try {
    const data = JSON.parse(rawResponse);

    // Validate required fields
    if (!data.summary || typeof data.summary !== 'string') {
      throw new Error('Missing or invalid summary');
    }
    if (!data.overview || typeof data.overview !== 'string') {
      throw new Error('Missing or invalid overview');
    }
    if (!data.terroir || typeof data.terroir !== 'string') {
      throw new Error('Missing or invalid terroir');
    }
    if (!data.winemaking || typeof data.winemaking !== 'string') {
      throw new Error('Missing or invalid winemaking');
    }
    if (!data.serving || typeof data.serving !== 'string') {
      throw new Error('Missing or invalid serving');
    }
    if (!data.signature_traits || typeof data.signature_traits !== 'string') {
      throw new Error('Missing or invalid signature_traits');
    }

    // Validate tasting notes
    if (!data.tasting_notes || typeof data.tasting_notes !== 'object') {
      throw new Error('Missing or invalid tasting_notes');
    }
    if (!data.tasting_notes.nose || typeof data.tasting_notes.nose !== 'string') {
      throw new Error('Missing or invalid tasting_notes.nose');
    }
    if (!data.tasting_notes.palate || typeof data.tasting_notes.palate !== 'string') {
      throw new Error('Missing or invalid tasting_notes.palate');
    }
    if (!data.tasting_notes.finish || typeof data.tasting_notes.finish !== 'string') {
      throw new Error('Missing or invalid tasting_notes.finish');
    }

    // Validate food pairings
    if (!Array.isArray(data.food_pairings) || data.food_pairings.length === 0) {
      throw new Error('Missing or invalid food_pairings (must be non-empty array)');
    }
    if (!data.food_pairings.every((p: unknown) => typeof p === 'string')) {
      throw new Error('All food_pairings must be strings');
    }

    return {
      summary: data.summary.trim(),
      overview: data.overview.trim(),
      terroir: data.terroir.trim(),
      winemaking: data.winemaking.trim(),
      tastingNotes: {
        nose: data.tasting_notes.nose.trim(),
        palate: data.tasting_notes.palate.trim(),
        finish: data.tasting_notes.finish.trim(),
      },
      serving: data.serving.trim(),
      foodPairings: data.food_pairings.map((p: string) => p.trim()),
      signatureTraits: data.signature_traits.trim(),
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse wine enrichment JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Wine enrichment agent
 */
export const wineEnrichmentAgent = createAgent({
  name: wineEnrichmentConfig.name,
  version: wineEnrichmentConfig.version,
  execute: async (input: WineEnrichmentInput): Promise<WineEnrichmentOutput> => {
    const { executeAgent } = await import('../base/agent.executor');

    const userPrompt = wineEnrichmentConfig.buildUserPrompt(input);

    const rawResponse = await executeAgent({
      agentName: wineEnrichmentConfig.name,
      systemPrompt: wineEnrichmentConfig.systemPrompt,
      userPrompt,
      options: wineEnrichmentConfig.options,
    });

    return parseWineEnrichmentResponse(rawResponse);
  },
});
