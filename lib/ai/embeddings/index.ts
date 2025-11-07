/**
 * Embeddings Module
 *
 * Services for generating vector embeddings using OpenAI's text-embedding-3-small model.
 * Used for semantic search and food-wine pairing recommendations.
 */

export { generateTextEmbedding, generateTextEmbeddingsBatch, embeddingConfig } from './generate-text-embedding';
export { generateWineEmbedding, hasValidEnrichmentForEmbedding } from './generate-wine-embedding';
export type { GenerateWineEmbeddingInput, EmbeddingResult, EmbeddingConfig } from './embeddings.types';
