-- Migration: Add status column to wines table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pktiwlfxgfkkqxzhtaxe/sql
-- Date: 2025-11-10
-- Purpose: Enable draft/active workflow for wine creation with preview/edit step

-- Add status column with default 'active'
-- Values: 'draft' (enrichment generated but not confirmed), 'active' (confirmed and saved)
ALTER TABLE wines
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Set all existing wines to 'active' status
UPDATE wines
SET status = 'active'
WHERE status IS NULL;

-- Add NOT NULL constraint after setting default values
ALTER TABLE wines
ALTER COLUMN status SET NOT NULL;

-- Add check constraint to ensure only valid statuses
ALTER TABLE wines
ADD CONSTRAINT wines_status_check
CHECK (status IN ('draft', 'active'));

-- Add index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_wines_status
ON wines(status);

-- Add comment for documentation
COMMENT ON COLUMN wines.status IS
'Wine status: draft (enrichment generated but user has not confirmed) or active (confirmed and saved to catalog)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'wines'
  AND column_name = 'status';
