-- Migration: Add Wine Enrichment fields to wines table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pktiwlfxgfkkqxzhtaxe/sql
-- Date: 2025-11-02

-- Add enrichment_data: JSONB column to store the complete WineEnrichmentOutput
-- Structure: {
--   summary: string,
--   overview: string,
--   terroir: string,
--   winemaking: string,
--   tastingNotes: { nose: string, palate: string, finish: string },
--   serving: string,
--   foodPairings: string[],
--   signatureTraits: string
-- }
ALTER TABLE wines
ADD COLUMN IF NOT EXISTS enrichment_data JSONB;

-- Add enrichment_generated_at: Timestamp when enrichment was created
ALTER TABLE wines
ADD COLUMN IF NOT EXISTS enrichment_generated_at TIMESTAMPTZ;

-- Add enrichment_version: Track which agent version generated this data (e.g., "2.0.0")
ALTER TABLE wines
ADD COLUMN IF NOT EXISTS enrichment_version VARCHAR(20);

-- Add index on enrichment_generated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_wines_enrichment_generated_at
ON wines(enrichment_generated_at);

-- Add index on enrichment_version for faster filtering
CREATE INDEX IF NOT EXISTS idx_wines_enrichment_version
ON wines(enrichment_version)
WHERE enrichment_version IS NOT NULL;

-- Add comment to enrichment_data column for documentation
COMMENT ON COLUMN wines.enrichment_data IS
'Wine enrichment data from Wine Enrichment Agent V2. Contains sommelier-quality wine profile with 8 sections: summary, overview, terroir, winemaking, tastingNotes, serving, foodPairings, signatureTraits';

COMMENT ON COLUMN wines.enrichment_generated_at IS
'Timestamp when the wine enrichment was generated';

COMMENT ON COLUMN wines.enrichment_version IS
'Version of the Wine Enrichment Agent that generated this data (e.g., "2.0.0")';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'wines'
  AND column_name IN ('enrichment_data', 'enrichment_generated_at', 'enrichment_version')
ORDER BY column_name;
