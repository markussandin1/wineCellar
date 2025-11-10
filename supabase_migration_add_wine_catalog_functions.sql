-- Add PostgreSQL functions for wine catalog admin features
-- Migration created: 2025-11-10

-- Function to get bottle stats for multiple wines
CREATE OR REPLACE FUNCTION get_wine_bottle_stats(wine_ids TEXT[])
RETURNS TABLE (
  wine_id TEXT,
  user_count BIGINT,
  bottle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.wine_id,
    COUNT(DISTINCT b.user_id)::BIGINT as user_count,
    SUM(b.quantity)::BIGINT as bottle_count
  FROM bottles b
  WHERE b.wine_id = ANY(wine_ids)
  GROUP BY b.wine_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user stats for a specific wine
CREATE OR REPLACE FUNCTION get_wine_user_stats(wine_id_param TEXT)
RETURNS TABLE (
  wine_id TEXT,
  user_id TEXT,
  user_name TEXT,
  quantity BIGINT,
  total_value NUMERIC,
  user_count BIGINT,
  bottle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH wine_bottles AS (
    SELECT
      b.wine_id,
      b.user_id,
      u.name as user_name,
      SUM(b.quantity)::BIGINT as quantity,
      SUM(b.purchase_price * b.quantity)::NUMERIC as total_value
    FROM bottles b
    JOIN users u ON b.user_id = u.id
    WHERE b.wine_id = wine_id_param
    GROUP BY b.wine_id, b.user_id, u.name
  ),
  wine_totals AS (
    SELECT
      COUNT(DISTINCT user_id)::BIGINT as total_users,
      SUM(quantity)::BIGINT as total_bottles
    FROM wine_bottles
  )
  SELECT
    wb.wine_id,
    wb.user_id,
    wb.user_name,
    wb.quantity,
    wb.total_value,
    wt.total_users as user_count,
    wt.total_bottles as bottle_count
  FROM wine_bottles wb
  CROSS JOIN wine_totals wt
  ORDER BY wb.quantity DESC;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON FUNCTION get_wine_bottle_stats IS 'Returns bottle statistics for multiple wines (user count, bottle count)';
COMMENT ON FUNCTION get_wine_user_stats IS 'Returns detailed user statistics for a specific wine';
