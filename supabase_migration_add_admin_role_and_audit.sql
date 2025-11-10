-- Add admin role and audit logging for wine cellar admin interface
-- Migration created: 2025-11-10

-- Add admin role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Track who last modified wines
ALTER TABLE wines ADD COLUMN IF NOT EXISTS updated_by TEXT REFERENCES users(id);

-- Audit log for wine edits
CREATE TABLE IF NOT EXISTS wine_edit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wine_id TEXT NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- 'update', 'delete', 'enrich'
  changes JSONB, -- Store old/new values
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wine_edit_logs_wine_id ON wine_edit_logs(wine_id);
CREATE INDEX IF NOT EXISTS idx_wine_edit_logs_user_id ON wine_edit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wine_edit_logs_created_at ON wine_edit_logs(created_at DESC);

-- Add index on users.is_admin for faster admin checks
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Comment for documentation
COMMENT ON COLUMN users.is_admin IS 'Flag indicating if user has admin privileges';
COMMENT ON COLUMN wines.updated_by IS 'User ID of the last person who modified this wine';
COMMENT ON TABLE wine_edit_logs IS 'Audit trail for all wine modifications';
