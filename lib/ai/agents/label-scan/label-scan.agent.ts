/**
 * Label Scan Agent - Extracts wine information from label images
 */

import OpenAI from 'openai';
import {
  Agent,
  AgentResult,
  AgentError,
  getOpenAIKey,
  validateOpenAIKey,
  stripCodeFences,
  extractOutputText,
} from '../base';
import { labelScanConfig } from './label-scan.config';
import type { LabelScanInput, LabelScanOutput } from './label-scan.types';

export class LabelScanAgent implements Agent<LabelScanInput, LabelScanOutput> {
  name = labelScanConfig.name;
  version = labelScanConfig.version;

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
   * Execute label scanning
   */
  async execute(input: LabelScanInput): Promise<AgentResult<LabelScanOutput>> {
    const startTime = Date.now();

    try {
      const client = this.getClient();

      // Call OpenAI Vision API
      const response = await client.responses.create({
        model: labelScanConfig.model,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: labelScanConfig.prompt,
              },
              {
                type: 'input_image',
                image_url: `data:${input.mimeType};base64,${input.imageBase64}`,
                detail: 'auto',
              },
            ],
          },
        ],
        max_output_tokens: labelScanConfig.maxTokens,
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'low' },
        store: false,
      });

      // Extract text from response
      const extractedText = extractOutputText(response);
      if (!extractedText) {
        throw new AgentError(
          'Failed to extract text from OpenAI response',
          this.name
        );
      }

      // Clean and parse JSON
      const cleanedText = stripCodeFences(extractedText);
      const data = JSON.parse(cleanedText) as LabelScanOutput;

      // Calculate latency
      const latencyMs = Date.now() - startTime;

      // Estimate tokens (rough approximation)
      const tokensUsed = Math.ceil(extractedText.length / 4) + 500; // 500 for image

      return {
        success: true,
        data,
        confidence: data.confidence,
        metadata: {
          model: labelScanConfig.model,
          tokensUsed,
          latencyMs,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      if (error instanceof AgentError) {
        throw error;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          model: labelScanConfig.model,
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
export const labelScanAgent = new LabelScanAgent();
