/**
 * Semantic Search using pgvector
 *
 * Performs vector similarity search using cosine distance in PostgreSQL.
 * Finds wines semantically similar to a food description.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { WineCharacteristics } from './food-pairing.types';

/**
 * Result from semantic search
 */
export interface SemanticSearchResult {
  wine: WineCharacteristics;
  similarityScore: number; // 0-100 (higher is more similar)
  cosineSimilarity: number; // Raw cosine similarity from pgvector
}

/**
 * Perform semantic search for wines similar to a food description
 *
 * @param supabase - Supabase client
 * @param queryEmbedding - Embedding vector for the food description
 * @param userId - User ID to filter wines from their cellar
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of wines with similarity scores
 *
 * Uses cosine distance (<->) operator from pgvector:
 * - Distance 0 = identical vectors
 * - Distance 2 = completely opposite vectors
 * - We convert to similarity score: (2 - distance) / 2 * 100
 */
export async function semanticSearchWines(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  userId: string,
  limit: number = 20
): Promise<SemanticSearchResult[]> {
  try {
    // Query wines with embeddings that user has bottles for
    // Using cosine distance for similarity search
    const { data, error } = await supabase.rpc('search_wines_by_embedding', {
      query_embedding: queryEmbedding,
      match_count: limit,
      match_user_id: userId,
    });

    if (error) {
      console.error('Semantic search error:', error);
      throw new Error(`Semantic search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map results and calculate similarity scores
    return data.map((row: any) => {
      // Cosine distance ranges from 0 (identical) to 2 (opposite)
      // Convert to similarity percentage: (2 - distance) / 2 * 100
      const cosineSimilarity = (2 - row.distance) / 2;
      const similarityScore = Math.max(0, Math.min(100, cosineSimilarity * 100));

      const wine: WineCharacteristics = {
        wineId: row.wine_id,
        wineName: row.name,
        producerName: row.producer_name,
        vintage: row.vintage,
        wineType: row.wine_type,
        body: row.body,
        tanninLevel: row.tannin_level,
        acidityLevel: row.acidity_level,
        sweetnessLevel: row.sweetness_level,
        primaryGrape: row.primary_grape,
        foodPairings: row.food_pairings,
        embedding: row.embedding,
        primaryLabelImageUrl: row.primary_label_image_url,
      };

      return {
        wine,
        similarityScore,
        cosineSimilarity,
      };
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Semantic search failed: ${error.message}`);
    }
    throw new Error('Semantic search failed: Unknown error');
  }
}

/**
 * Check if semantic search is available (embeddings exist)
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns True if user has wines with embeddings
 */
export async function isSemanticSearchAvailable(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    // Check if any of user's wines have embeddings
    const { data, error } = await supabase
      .from('bottles')
      .select('wine_id, wines!inner(embedding)')
      .eq('user_id', userId)
      .not('wines.embedding', 'is', null)
      .limit(1);

    if (error) {
      console.error('Error checking semantic search availability:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking semantic search availability:', error);
    return false;
  }
}
