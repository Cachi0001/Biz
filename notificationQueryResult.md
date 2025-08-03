| column_name         | data_type                | is_nullable | column_default |
| ------------------- | ------------------------ | ----------- | -------------- |
| user_id             | uuid                     | YES         | null           |
| email               | text                     | YES         | null           |
| subscription_plan   | text                     | YES         | null           |
| subscription_status | text                     | YES         | null           |
| trial_days_left     | numeric                  | YES         | null           |
| feature_type        | text                     | YES         | null           |
| current_count       | integer                  | YES         | null           |
| limit_count         | integer                  | YES         | null           |
| period_start        | timestamp with time zone | YES         | null           |
| period_end          | timestamp with time zone | YES         | null           |
| usage_percentage    | numeric                  | YES         | null           |
| table_name         | view_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| user_feature_usage |  SELECT u.id AS user_id,
    u.email,
    u.subscription_plan,
    u.subscription_status,
        CASE
            WHEN (u.subscription_status = 'trial'::text) THEN GREATEST((0)::numeric, EXTRACT(days FROM (u.trial_ends_at - CURRENT_TIMESTAMP)))
            ELSE NULL::numeric
        END AS trial_days_left,
    fu.feature_type,
    fu.current_count,
    fu.limit_count,
    fu.period_start,
    fu.period_end,
        CASE
            WHEN (fu.limit_count = 0) THEN (0)::numeric
            ELSE round((((fu.current_count)::numeric / (fu.limit_count)::numeric) * (100)::numeric), 2)
        END AS usage_percentage
   FROM (users u
     LEFT JOIN feature_usage fu ON (((u.id = fu.user_id) AND (fu.period_start <= CURRENT_TIMESTAMP) AND (fu.period_end > CURRENT_TIMESTAMP)))); |
     | column_name       | data_type                | is_nullable | column_default     |
| ----------------- | ------------------------ | ----------- | ------------------ |
| id                | uuid                     | NO          | uuid_generate_v4() |
| product_id        | uuid                     | NO          | null               |
| user_id           | uuid                     | YES         | null               |
| change_type       | text                     | NO          | null               |
| quantity_change   | numeric                  | NO          | null               |
| previous_quantity | numeric                  | NO          | null               |
| new_quantity      | numeric                  | NO          | null               |
| reason            | text                     | NO          | null               |
| reference_id      | uuid                     | YES         | null               |
| reference_table   | text                     | YES         | 'invoices'::text   |
| created_at        | timestamp with time zone | YES         | now()              |
| indexname                        | tablename         | indexdef                                                                                                              |
| -------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| inventory_changes_pkey           | inventory_changes | CREATE UNIQUE INDEX inventory_changes_pkey ON public.inventory_changes USING btree (id)                               |
| idx_inventory_changes_product_id | inventory_changes | CREATE INDEX idx_inventory_changes_product_id ON public.inventory_changes USING btree (product_id)                    |
| idx_inventory_changes_created_at | inventory_changes | CREATE INDEX idx_inventory_changes_created_at ON public.inventory_changes USING btree (created_at DESC)               |
| idx_inventory_changes_reference  | inventory_changes | CREATE INDEX idx_inventory_changes_reference ON public.inventory_changes USING btree (reference_id, reference_table)  |
| notifications_pkey               | notifications     | CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)                                       |
| idx_notifications_priority       | notifications     | CREATE INDEX idx_notifications_priority ON public.notifications USING btree (priority)                                |
| idx_notifications_category       | notifications     | CREATE INDEX idx_notifications_category ON public.notifications USING btree (category)                                |
| idx_notifications_expires_at     | notifications     | CREATE INDEX idx_notifications_expires_at ON public.notifications USING btree (expires_at)                            |
| products_pkey                    | products          | CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id)                                                 |
| idx_products_category            | products          | CREATE INDEX idx_products_category ON public.products USING btree (category)                                          |
| idx_products_low_stock           | products          | CREATE INDEX idx_products_low_stock ON public.products USING btree (quantity) WHERE (quantity <= low_stock_threshold) |
| idx_products_owner_active        | products          | CREATE INDEX idx_products_owner_active ON public.products USING btree (owner_id, active)                              |
| idx_products_owner_inventory     | products          | CREATE INDEX idx_products_owner_inventory ON public.products USING btree (owner_id, quantity, reserved_quantity)      |

This query didn't return any result
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('increment_feature_usage', 'get_current_usage_stats', 'update_usage_percentage', 'track_inventory_change');
