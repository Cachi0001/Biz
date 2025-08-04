ERROR:  23514: new row for relation "feature_usage" violates check constraint "feature_usage_feature_type_check"
DETAIL:  Failing row contains (3007b1e4-2608-4ff6-ae22-355859630c5f, 9e20b532-6dc2-48b2-ac24-851275f0b696, storage_mb, 2025-08-04 00:00:00+00, 2025-09-04 00:00:00+00, 0, 1000, 2025-08-04 07:47:13.87089+00, 2025-08-04 04:45:41.801313+00, 2025-08-04 04:45:41.801313+00).
CONTEXT:  SQL statement "INSERT INTO feature_usage (
            user_id, feature_type, current_count, limit_count, 
            period_start, period_end, created_at, updated_at
        )
        SELECT 
            user_id, 
            feature_type, 
            current_count, 
            limit_count,
            COALESCE(period_start::timestamp with time zone, NOW()),
            COALESCE(period_end::timestamp with time zone, NOW() + INTERVAL '1 month'),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM user_feature_usage
        WHERE feature_type IN ('invoices', 'expenses', 'products', 'sales', 'storage_mb')"
PL/pgSQL function inline_code_block line 49 at SQL statement

please edit the query again to fix this