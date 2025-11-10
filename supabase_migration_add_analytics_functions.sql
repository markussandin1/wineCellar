-- Add PostgreSQL functions for admin analytics
-- Migration created: 2025-11-10

-- Function to get user-wine matrix
CREATE OR REPLACE FUNCTION get_user_wine_matrix()
RETURNS TABLE (
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  wine_id TEXT,
  wine_name TEXT,
  quantity BIGINT,
  total_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    w.id as wine_id,
    w.full_name as wine_name,
    SUM(b.quantity)::BIGINT as quantity,
    SUM(b.purchase_price * b.quantity)::NUMERIC as total_price
  FROM users u
  LEFT JOIN bottles b ON u.id = b.user_id
  LEFT JOIN wines w ON b.wine_id = w.id
  GROUP BY u.id, u.name, u.email, w.id, w.full_name
  ORDER BY u.name, w.full_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular wines
CREATE OR REPLACE FUNCTION get_popular_wines()
RETURNS TABLE (
  wine_id TEXT,
  wine_name TEXT,
  producer TEXT,
  vintage INTEGER,
  user_count BIGINT,
  total_bottles BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id as wine_id,
    w.full_name as wine_name,
    w.producer_name as producer,
    w.vintage,
    COUNT(DISTINCT b.user_id)::BIGINT as user_count,
    SUM(b.quantity)::BIGINT as total_bottles
  FROM wines w
  JOIN bottles b ON w.id = b.wine_id
  GROUP BY w.id, w.full_name, w.producer_name, w.vintage
  ORDER BY user_count DESC, total_bottles DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON FUNCTION get_user_wine_matrix IS 'Returns matrix of users and their wines with quantities and values';
COMMENT ON FUNCTION get_popular_wines IS 'Returns top 20 most popular wines by user count';
