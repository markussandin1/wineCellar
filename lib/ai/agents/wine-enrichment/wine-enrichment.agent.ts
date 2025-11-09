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

import OpenAI from 'openai';
import {
  Agent,
  AgentResult,
  AgentError,
  getOpenAIKey,
  validateOpenAIKey,
  stripCodeFences,
} from '../base';
import { wineEnrichmentConfig } from './wine-enrichment.config';
import type { WineEnrichmentInput, WineEnrichmentOutput } from './wine-enrichment.types';

export class WineEnrichmentAgent implements Agent<WineEnrichmentInput, WineEnrichmentOutput> {
  name = wineEnrichmentConfig.name;
  version = wineEnrichmentConfig.version;

  private client: OpenAI | null = null;

  /**
   * Get or create OpenAI client
   */
  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    validateOpenAIKey();
    const apiKey = getOpenAIKey()!;
    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  /**
   * Parse and validate the wine enrichment response
   */
  private parseResponse(rawResponse: string): WineEnrichmentOutput {
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
      if (!data.signatureTraits || typeof data.signatureTraits !== 'string') {
        throw new Error('Missing or invalid signatureTraits');
      }

      // Validate tasting notes
      if (!data.tastingNotes || typeof data.tastingNotes !== 'object') {
        throw new Error('Missing or invalid tastingNotes');
      }
      if (!data.tastingNotes.nose || typeof data.tastingNotes.nose !== 'string') {
        throw new Error('Missing or invalid tastingNotes.nose');
      }
      if (!data.tastingNotes.palate || typeof data.tastingNotes.palate !== 'string') {
        throw new Error('Missing or invalid tastingNotes.palate');
      }
      if (!data.tastingNotes.finish || typeof data.tastingNotes.finish !== 'string') {
        throw new Error('Missing or invalid tastingNotes.finish');
      }

      // Validate food pairings
      if (!Array.isArray(data.foodPairings) || data.foodPairings.length === 0) {
        throw new Error('Missing or invalid foodPairings (must be non-empty array)');
      }
      if (!data.foodPairings.every((p: unknown) => typeof p === 'string')) {
        throw new Error('All foodPairings must be strings');
      }

      return {
        summary: data.summary.trim(),
        overview: data.overview.trim(),
        terroir: data.terroir.trim(),
        winemaking: data.winemaking.trim(),
        tastingNotes: {
          nose: data.tastingNotes.nose.trim(),
          palate: data.tastingNotes.palate.trim(),
          finish: data.tastingNotes.finish.trim(),
        },
        serving: data.serving.trim(),
        foodPairings: data.foodPairings.map((p: string) => p.trim()),
        signatureTraits: data.signatureTraits.trim(),
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AgentError(
          `Failed to parse wine enrichment JSON: ${error.message}`,
          this.name,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Execute wine enrichment
   */
  async execute(input: WineEnrichmentInput): Promise<AgentResult<WineEnrichmentOutput>> {
    const startTime = Date.now();

    try {
      const client = this.getClient();

      // Build the user prompt
      const userPrompt = wineEnrichmentConfig.buildUserPrompt(input);

      // Call OpenAI Chat API
      // Note: gpt-5-mini only supports temperature=1 (default), so we omit it
      const response = await client.chat.completions.create({
        model: wineEnrichmentConfig.model,
        messages: [
          {
            role: 'system',
            content: wineEnrichmentConfig.systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_completion_tokens: wineEnrichmentConfig.maxTokens,
      });

      // Extract response text
      const rawText = response.choices[0]?.message?.content;
      if (!rawText) {
        throw new AgentError('No response from OpenAI', this.name);
      }

      // Clean and parse JSON
      const cleanedText = stripCodeFences(rawText);
      const data = this.parseResponse(cleanedText);

      // Calculate latency
      const latencyMs = Date.now() - startTime;
      const tokensUsed = response.usage?.total_tokens || 0;

      // Log performance metrics
      console.log(`[${this.name}] ✓ Success | Model: ${wineEnrichmentConfig.model} | Duration: ${(latencyMs / 1000).toFixed(2)}s | Tokens: ${tokensUsed}`);
      console.log(`[${this.name}] Response:`, JSON.stringify(data, null, 2));

      return {
        success: true,
        data,
        confidence: 1.0,
        metadata: {
          model: wineEnrichmentConfig.model,
          tokensUsed,
          latencyMs,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log error metrics
      console.error(`[${this.name}] ✗ Error | Model: ${wineEnrichmentConfig.model} | Duration: ${(latencyMs / 1000).toFixed(2)}s | Error: ${errorMessage}`);

      if (error instanceof AgentError) {
        throw error;
      }

      return {
        success: false,
        error: errorMessage,
        metadata: {
          model: wineEnrichmentConfig.model,
          tokensUsed: 0,
          latencyMs,
          timestamp: new Date(),
        },
      };
    }
  }
}

/**
 * Create a singleton instance
 */
export const wineEnrichmentAgent = new WineEnrichmentAgent();
