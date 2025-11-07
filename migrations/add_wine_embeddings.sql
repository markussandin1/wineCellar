-- Migration: Add Vector Embeddings for Semantic Search
-- Run this in Supabase SQL Editor
-- Date: 2025-11-07
-- Purpose: Enable semantic search for food-wine pairing using OpenAI embeddings

-- 1. Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to wines table
-- OpenAI text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE wines
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Add index for fast vector similarity search using cosine distance
-- HNSW (Hierarchical Navigable Small World) is optimal for high-dimensional vectors
CREATE INDEX IF NOT EXISTS idx_wines_embedding_cosine
ON wines
USING hnsw (embedding vector_cosine_ops);

-- Alternative: IVFFlat index (faster build, slightly slower search)
-- CREATE INDEX IF NOT EXISTS idx_wines_embedding_ivfflat
-- ON wines
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- 4. Add embedding metadata columns
ALTER TABLE wines
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ;

ALTER TABLE wines
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'text-embedding-3-small';

-- 5. Add index on embedding_generated_at for tracking
CREATE INDEX IF NOT EXISTS idx_wines_embedding_generated_at
ON wines(embedding_generated_at)
WHERE embedding_generated_at IS NOT NULL;

-- 6. Add comments for documentation
COMMENT ON COLUMN wines.embedding IS
'Vector embedding (1536 dimensions) generated from wine characteristics using OpenAI text-embedding-3-small. Used for semantic search and food-wine pairing recommendations.';

COMMENT ON COLUMN wines.embedding_generated_at IS
'Timestamp when the embedding was generated';

COMMENT ON COLUMN wines.embedding_model IS
'Name of the embedding model used (e.g., "text-embedding-3-small")';

-- 7. Create function for semantic search
-- Searches wines by vector similarity, filtered by user's bottles
CREATE OR REPLACE FUNCTION search_wines_by_embedding(
  query_embedding vector(1536),
  match_count INT DEFAULT 20,
  match_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  wine_id UUID,
  name VARCHAR,
  producer_name VARCHAR,
  vintage INTEGER,
  wine_type VARCHAR,
  body VARCHAR,
  tannin_level VARCHAR,
  acidity_level VARCHAR,
  sweetness_level VARCHAR,
  primary_grape VARCHAR,
  food_pairings TEXT[],
  embedding vector(1536),
  primary_label_image_url TEXT,
  distance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- If user_id provided, search only wines in user's cellar
  IF match_user_id IS NOT NULL THEN
    RETURN QUERY
    SELECT DISTINCT
      w.id AS wine_id,
      w.name,
      w.producer_name,
      w.vintage,
      w.wine_type,
      w.body,
      w.tannin_level,
      w.acidity_level,
      w.sweetness_level,
      w.primary_grape,
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(w.enrichment_data->'foodPairings'))::TEXT[],
        ARRAY[]::TEXT[]
      ) AS food_pairings,
      w.embedding,
      w.primary_label_image_url,
      (w.embedding <-> query_embedding)::FLOAT AS distance
    FROM wines w
    INNER JOIN bottles b ON b.wine_id = w.id
    WHERE w.embedding IS NOT NULL
      AND b.user_id = match_user_id
      AND b.status = 'in_cellar'
      AND b.quantity > 0
    ORDER BY w.embedding <-> query_embedding
    LIMIT match_count;
  ELSE
    -- Search all wines with embeddings
    RETURN QUERY
    SELECT
      w.id AS wine_id,
      w.name,
      w.producer_name,
      w.vintage,
      w.wine_type,
      w.body,
      w.tannin_level,
      w.acidity_level,
      w.sweetness_level,
      w.primary_grape,
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(w.enrichment_data->'foodPairings'))::TEXT[],
        ARRAY[]::TEXT[]
      ) AS food_pairings,
      w.embedding,
      w.primary_label_image_url,
      (w.embedding <-> query_embedding)::FLOAT AS distance
    FROM wines w
    WHERE w.embedding IS NOT NULL
    ORDER BY w.embedding <-> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;

-- 8. Add comment to function
COMMENT ON FUNCTION search_wines_by_embedding IS
'Performs semantic search using vector similarity (cosine distance). Returns wines most similar to query embedding, optionally filtered by user bottles.';

-- 9. Verify setup
SELECT
  'Migration completed successfully!' AS status,
  (SELECT COUNT(*) FROM wines WHERE embedding IS NOT NULL) AS wines_with_embeddings,
  (SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector') AS vector_extension_installed;
