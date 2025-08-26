-- 创建一个函数来执行动态 SQL（仅用于测试环境）
-- 注意：生产环境中应该谨慎使用此功能

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 安全检查：只允许 CREATE TABLE 和 CREATE INDEX 语句
  IF sql !~* '^(CREATE TABLE|CREATE INDEX)' THEN
    RAISE EXCEPTION '只允许 CREATE TABLE 和 CREATE INDEX 语句';
  END IF;
  
  -- 执行 SQL
  EXECUTE sql;
  
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '执行 SQL 失败: %', SQLERRM;
END;
$$;

-- 为测试用户授权（根据实际情况调整）
-- GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
