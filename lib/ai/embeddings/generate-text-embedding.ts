/**
 * Generate Text Embedding Service
 *
 * Generates vector embeddings from arbitrary text using OpenAI's embedding model.
 * Used for:
 * - User input (food/dish descriptions) for semantic search
 * - Wine descriptions for building searchable vector database
 */

import OpenAI from 'openai';
import type { EmbeddingResult, EmbeddingConfig } from './embeddings.types';

/**
 * Embedding configuration
 * Using text-embedding-3-small for cost efficiency and good performance
 */
export const embeddingConfig: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
};

/**
 * Get OpenAI API key from environment
 */
function getOpenAIKey(): string {
  const key = process.env.OpenAI_API_Key || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key not configured');
  }
  return key;
}

/**
 * Generate embedding for arbitrary text
 *
 * @param text - Text to generate embedding for
 * @returns Embedding result with vector, dimensions, and metadata
 *
 * @example
 * ```ts
 * const result = await generateTextEmbedding('pasta carbonara with bacon');
 * console.log(result.embedding.length); // 1536
 * console.log(result.tokensUsed); // ~6
 * ```
 */
export async function generateTextEmbedding(text: string): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  const apiKey = getOpenAIKey();
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.embeddings.create({
      model: embeddingConfig.model,
      input: text.trim(),
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;
    const tokensUsed = response.usage.total_tokens;

    // Validate embedding dimensions
    if (embedding.length !== embeddingConfig.dimensions) {
      throw new Error(
        `Unexpected embedding dimensions: expected ${embeddingConfig.dimensions}, got ${embedding.length}`
      );
    }

    return {
      embedding,
      dimensions: embeddingConfig.dimensions,
      model: embeddingConfig.model,
      tokensUsed,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate text embedding: ${error.message}`);
    }
    throw new Error('Failed to generate text embedding: Unknown error');
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateTextEmbedding multiple times
 *
 * @param texts - Array of texts to generate embeddings for (max 2048 texts)
 * @returns Array of embedding results
 */
export async function generateTextEmbeddingsBatch(
  texts: string[]
): Promise<EmbeddingResult[]> {
  if (texts.length === 0) {
    return [];
  }

  if (texts.length > 2048) {
    throw new Error('Cannot generate embeddings for more than 2048 texts at once');
  }

  const cleanedTexts = texts.map((t) => t.trim()).filter((t) => t.length > 0);

  if (cleanedTexts.length === 0) {
    throw new Error('No valid texts to generate embeddings for');
  }

  const apiKey = getOpenAIKey();
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.embeddings.create({
      model: embeddingConfig.model,
      input: cleanedTexts,
      encoding_format: 'float',
    });

    return response.data.map((item) => ({
      embedding: item.embedding,
      dimensions: embeddingConfig.dimensions,
      model: embeddingConfig.model,
      tokensUsed: response.usage.total_tokens / response.data.length, // Approximate per-text
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate text embeddings batch: ${error.message}`);
    }
    throw new Error('Failed to generate text embeddings batch: Unknown error');
  }
}
