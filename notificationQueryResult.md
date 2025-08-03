[

  {

    "table_name": "notifications",

    "column_name": "id",

    "data_type": "uuid",

    "is_nullable": "NO",

    "column_default": "uuid_generate_v4()"

  },

  {

    "table_name": "notifications",

    "column_name": "user_id",

    "data_type": "uuid",

    "is_nullable": "YES",

    "column_default": null

  },

  {

    "table_name": "notifications",

    "column_name": "title",

    "data_type": "text",

    "is_nullable": "NO",

    "column_default": null

  },

  {

    "table_name": "notifications",

    "column_name": "message",

    "data_type": "text",

    "is_nullable": "NO",

    "column_default": null

  },

  {

    "table_name": "notifications",

    "column_name": "type",

    "data_type": "text",

    "is_nullable": "YES",

    "column_default": "'info'::text"

  },

  {

    "table_name": "notifications",

    "column_name": "read",

    "data_type": "boolean",

    "is_nullable": "YES",

    "column_default": "false"

  },

  {

    "table_name": "notifications",

    "column_name": "data",

    "data_type": "jsonb",

    "is_nullable": "YES",

    "column_default": "'{}'::jsonb"

  },

  {

    "table_name": "notifications",

    "column_name": "created_at",

    "data_type": "timestamp with time zone",

    "is_nullable": "YES",

    "column_default": "now()"

  }

]

This query below didn't return any result "-- 2. Check for user-related tables that might store notification preferences

SELECT 

    table_name, 

    column_name, 

    data_type 

FROM information_schema.columns 

WHERE table_name IN ('users', 'profiles', 'user_preferences', 'user_settings')

    AND column_name LIKE '%notification%' OR column_name LIKE '%fcm%' OR column_name LIKE '%push%'

ORDER BY table_name, column_name;"



[

  {

    "table_name": "inventory_changes",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "product_id",

    "data_type": "uuid"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "user_id",

    "data_type": "uuid"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "change_type",

    "data_type": "text"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "quantity_change",

    "data_type": "numeric"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "previous_quantity",

    "data_type": "numeric"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "new_quantity",

    "data_type": "numeric"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "reason",

    "data_type": "text"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "reference_id",

    "data_type": "uuid"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "reference_table",

    "data_type": "text"

  },

  {

    "table_name": "inventory_changes",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "products",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "products",

    "column_name": "owner_id",

    "data_type": "uuid"

  },

  {

    "table_name": "products",

    "column_name": "name",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "description",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "price",

    "data_type": "numeric"

  },

  {

    "table_name": "products",

    "column_name": "cost_price",

    "data_type": "numeric"

  },

  {

    "table_name": "products",

    "column_name": "quantity",

    "data_type": "integer"

  },

  {

    "table_name": "products",

    "column_name": "low_stock_threshold",

    "data_type": "integer"

  },

  {

    "table_name": "products",

    "column_name": "category",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "image_url",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "sku",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "active",

    "data_type": "boolean"

  },

  {

    "table_name": "products",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "products",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "products",

    "column_name": "supplier",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "last_restocked_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "products",

    "column_name": "barcode",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "unit",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "reorder_level",

    "data_type": "integer"

  },

  {

    "table_name": "products",

    "column_name": "supplier_id",

    "data_type": "uuid"

  },

  {

    "table_name": "products",

    "column_name": "last_sold_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "products",

    "column_name": "sub_category",

    "data_type": "text"

  },

  {

    "table_name": "products",

    "column_name": "reserved_quantity",

    "data_type": "integer"

  }

]

[

  {

    "table_name": "invoice_analytics",

    "column_name": "month",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "status",

    "data_type": "text"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "invoice_count",

    "data_type": "bigint"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "total_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "avg_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "paid_count",

    "data_type": "bigint"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "paid_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "overdue_count",

    "data_type": "bigint"

  },

  {

    "table_name": "invoice_analytics",

    "column_name": "overdue_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "invoices",

    "column_name": "owner_id",

    "data_type": "uuid"

  },

  {

    "table_name": "invoices",

    "column_name": "customer_id",

    "data_type": "uuid"

  },

  {

    "table_name": "invoices",

    "column_name": "customer_name",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "invoice_number",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "tax_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "total_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "status",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "due_date",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoices",

    "column_name": "paid_date",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoices",

    "column_name": "notes",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "items",

    "data_type": "jsonb"

  },

  {

    "table_name": "invoices",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoices",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoices",

    "column_name": "total_cogs",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "gross_profit",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "payment_terms",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "reminder_sent_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoices",

    "column_name": "issue_date",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoices",

    "column_name": "seller_name",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "seller_address",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "seller_contact",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "currency",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "discount_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "terms_and_conditions",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "inventory_updated",

    "data_type": "boolean"

  },

  {

    "table_name": "invoices",

    "column_name": "inventory_log_id",

    "data_type": "uuid"

  },

  {

    "table_name": "invoices",

    "column_name": "terms",

    "data_type": "text"

  },

  {

    "table_name": "invoices",

    "column_name": "subtotal",

    "data_type": "numeric"

  },

  {

    "table_name": "invoices",

    "column_name": "paid_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "invoices",

    "column_name": "paid_amount",

    "data_type": "numeric"

  },

  {

    "table_name": "payment_webhooks",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "payment_webhooks",

    "column_name": "event_type",

    "data_type": "text"

  },

  {

    "table_name": "payment_webhooks",

    "column_name": "payload",

    "data_type": "jsonb"

  },

  {

    "table_name": "payment_webhooks",

    "column_name": "received_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "payments",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "payments",

    "column_name": "owner_id",

    "data_type": "uuid"

  },

  {

    "table_name": "payments",

    "column_name": "invoice_id",

    "data_type": "uuid"

  },

  {

    "table_name": "payments",

    "column_name": "amount",

    "data_type": "numeric"

  },

  {

    "table_name": "payments",

    "column_name": "status",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "payment_reference",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "payment_method",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "paid_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "payments",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "payments",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "payments",

    "column_name": "currency",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "customer_email",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "customer_name",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "sale_id",

    "data_type": "uuid"

  },

  {

    "table_name": "payments",

    "column_name": "description",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "notes",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "reference_number",

    "data_type": "text"

  },

  {

    "table_name": "payments",

    "column_name": "phone",

    "data_type": "character varying"

  },

  {

    "table_name": "payments",

    "column_name": "customer_phone",

    "data_type": "character varying"

  }

]

[

  {

    "table_name": "check_constraint_routine_usage",

    "column_name": "constraint_catalog",

    "data_type": "name"

  },

  {

    "table_name": "check_constraint_routine_usage",

    "column_name": "constraint_schema",

    "data_type": "name"

  },

  {

    "table_name": "check_constraint_routine_usage",

    "column_name": "constraint_name",

    "data_type": "name"

  },

  {

    "table_name": "check_constraint_routine_usage",

    "column_name": "specific_catalog",

    "data_type": "name"

  },

  {

    "table_name": "check_constraint_routine_usage",

    "column_name": "specific_schema",

    "data_type": "name"

  },

  {

    "table_name": "check_constraint_routine_usage",

    "column_name": "specific_name",

    "data_type": "name"

  },

  {

    "table_name": "column_column_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "column_column_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "column_column_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "column_column_usage",

    "column_name": "column_name",

    "data_type": "name"

  },

  {

    "table_name": "column_column_usage",

    "column_name": "dependent_column",

    "data_type": "name"

  },

  {

    "table_name": "column_domain_usage",

    "column_name": "domain_catalog",

    "data_type": "name"

  },

  {

    "table_name": "column_domain_usage",

    "column_name": "domain_schema",

    "data_type": "name"

  },

  {

    "table_name": "column_domain_usage",

    "column_name": "domain_name",

    "data_type": "name"

  },

  {

    "table_name": "column_domain_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "column_domain_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "column_domain_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "column_domain_usage",

    "column_name": "column_name",

    "data_type": "name"

  },

  {

    "table_name": "column_udt_usage",

    "column_name": "udt_catalog",

    "data_type": "name"

  },

  {

    "table_name": "column_udt_usage",

    "column_name": "udt_schema",

    "data_type": "name"

  },

  {

    "table_name": "column_udt_usage",

    "column_name": "udt_name",

    "data_type": "name"

  },

  {

    "table_name": "column_udt_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "column_udt_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "column_udt_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "column_udt_usage",

    "column_name": "column_name",

    "data_type": "name"

  },

  {

    "table_name": "constraint_column_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "constraint_column_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "constraint_column_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "constraint_column_usage",

    "column_name": "column_name",

    "data_type": "name"

  },

  {

    "table_name": "constraint_column_usage",

    "column_name": "constraint_catalog",

    "data_type": "name"

  },

  {

    "table_name": "constraint_column_usage",

    "column_name": "constraint_schema",

    "data_type": "name"

  },

  {

    "table_name": "constraint_column_usage",

    "column_name": "constraint_name",

    "data_type": "name"

  },

  {

    "table_name": "constraint_table_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "constraint_table_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "constraint_table_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "constraint_table_usage",

    "column_name": "constraint_catalog",

    "data_type": "name"

  },

  {

    "table_name": "constraint_table_usage",

    "column_name": "constraint_schema",

    "data_type": "name"

  },

  {

    "table_name": "constraint_table_usage",

    "column_name": "constraint_name",

    "data_type": "name"

  },

  {

    "table_name": "domain_udt_usage",

    "column_name": "udt_catalog",

    "data_type": "name"

  },

  {

    "table_name": "domain_udt_usage",

    "column_name": "udt_schema",

    "data_type": "name"

  },

  {

    "table_name": "domain_udt_usage",

    "column_name": "udt_name",

    "data_type": "name"

  },

  {

    "table_name": "domain_udt_usage",

    "column_name": "domain_catalog",

    "data_type": "name"

  },

  {

    "table_name": "domain_udt_usage",

    "column_name": "domain_schema",

    "data_type": "name"

  },

  {

    "table_name": "domain_udt_usage",

    "column_name": "domain_name",

    "data_type": "name"

  },

  {

    "table_name": "feature_usage",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "feature_usage",

    "column_name": "user_id",

    "data_type": "uuid"

  },

  {

    "table_name": "feature_usage",

    "column_name": "feature_type",

    "data_type": "text"

  },

  {

    "table_name": "feature_usage",

    "column_name": "period_start",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "feature_usage",

    "column_name": "period_end",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "feature_usage",

    "column_name": "current_count",

    "data_type": "integer"

  },

  {

    "table_name": "feature_usage",

    "column_name": "limit_count",

    "data_type": "integer"

  },

  {

    "table_name": "feature_usage",

    "column_name": "last_updated",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "feature_usage",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "feature_usage",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "constraint_catalog",

    "data_type": "name"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "constraint_schema",

    "data_type": "name"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "constraint_name",

    "data_type": "name"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "column_name",

    "data_type": "name"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "ordinal_position",

    "data_type": "integer"

  },

  {

    "table_name": "key_column_usage",

    "column_name": "position_in_unique_constraint",

    "data_type": "integer"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "subid",

    "data_type": "oid"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "subname",

    "data_type": "name"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "worker_type",

    "data_type": "text"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "pid",

    "data_type": "integer"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "leader_pid",

    "data_type": "integer"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "relid",

    "data_type": "oid"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "received_lsn",

    "data_type": "pg_lsn"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "last_msg_send_time",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "last_msg_receipt_time",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "latest_end_lsn",

    "data_type": "pg_lsn"

  },

  {

    "table_name": "pg_stat_subscription",

    "column_name": "latest_end_time",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "pg_stat_subscription_stats",

    "column_name": "subid",

    "data_type": "oid"

  },

  {

    "table_name": "pg_stat_subscription_stats",

    "column_name": "subname",

    "data_type": "name"

  },

  {

    "table_name": "pg_stat_subscription_stats",

    "column_name": "apply_error_count",

    "data_type": "bigint"

  },

  {

    "table_name": "pg_stat_subscription_stats",

    "column_name": "sync_error_count",

    "data_type": "bigint"

  },

  {

    "table_name": "pg_stat_subscription_stats",

    "column_name": "stats_reset",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "oid",

    "data_type": "oid"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subdbid",

    "data_type": "oid"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subskiplsn",

    "data_type": "pg_lsn"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subname",

    "data_type": "name"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subowner",

    "data_type": "oid"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subenabled",

    "data_type": "boolean"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subbinary",

    "data_type": "boolean"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "substream",

    "data_type": "\"char\""

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subtwophasestate",

    "data_type": "\"char\""

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subdisableonerr",

    "data_type": "boolean"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subpasswordrequired",

    "data_type": "boolean"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subrunasowner",

    "data_type": "boolean"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subfailover",

    "data_type": "boolean"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subconninfo",

    "data_type": "text"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subslotname",

    "data_type": "name"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subsynccommit",

    "data_type": "text"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "subpublications",

    "data_type": "ARRAY"

  },

  {

    "table_name": "pg_subscription",

    "column_name": "suborigin",

    "data_type": "text"

  },

  {

    "table_name": "pg_subscription_rel",

    "column_name": "srsubid",

    "data_type": "oid"

  },

  {

    "table_name": "pg_subscription_rel",

    "column_name": "srrelid",

    "data_type": "oid"

  },

  {

    "table_name": "pg_subscription_rel",

    "column_name": "srsubstate",

    "data_type": "\"char\""

  },

  {

    "table_name": "pg_subscription_rel",

    "column_name": "srsublsn",

    "data_type": "pg_lsn"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "user_id",

    "data_type": "uuid"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "endpoint",

    "data_type": "text"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "keys",

    "data_type": "jsonb"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "active",

    "data_type": "boolean"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "token",

    "data_type": "text"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "device_type",

    "data_type": "character varying"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "device_info",

    "data_type": "jsonb"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "is_active",

    "data_type": "boolean"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "user_id",

    "data_type": "uuid"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "plan_id",

    "data_type": "text"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "amount",

    "data_type": "numeric"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "payment_reference",

    "data_type": "text"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "paystack_reference",

    "data_type": "text"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "status",

    "data_type": "text"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "metadata",

    "data_type": "jsonb"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "user_email",

    "data_type": "text"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "user_name",

    "data_type": "text"

  },

  {

    "table_name": "recent_subscription_transactions",

    "column_name": "business_name",

    "data_type": "text"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "grantor",

    "data_type": "name"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "grantee",

    "data_type": "name"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "object_catalog",

    "data_type": "name"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "object_schema",

    "data_type": "name"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "object_name",

    "data_type": "name"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "object_type",

    "data_type": "character varying"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "privilege_type",

    "data_type": "character varying"

  },

  {

    "table_name": "role_usage_grants",

    "column_name": "is_grantable",

    "data_type": "character varying"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "specific_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "specific_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "specific_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "routine_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "routine_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "routine_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_column_usage",

    "column_name": "column_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_routine_usage",

    "column_name": "specific_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_routine_usage",

    "column_name": "specific_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_routine_usage",

    "column_name": "specific_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_routine_usage",

    "column_name": "routine_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_routine_usage",

    "column_name": "routine_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_routine_usage",

    "column_name": "routine_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "specific_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "specific_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "specific_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "routine_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "routine_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "routine_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "sequence_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "sequence_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_sequence_usage",

    "column_name": "sequence_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "specific_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "specific_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "specific_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "routine_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "routine_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "routine_name",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "routine_table_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "subscription",

    "column_name": "id",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription",

    "column_name": "subscription_id",

    "data_type": "uuid"

  },

  {

    "table_name": "subscription",

    "column_name": "entity",

    "data_type": "regclass"

  },

  {

    "table_name": "subscription",

    "column_name": "filters",

    "data_type": "ARRAY"

  },

  {

    "table_name": "subscription",

    "column_name": "claims",

    "data_type": "jsonb"

  },

  {

    "table_name": "subscription",

    "column_name": "claims_role",

    "data_type": "regrole"

  },

  {

    "table_name": "subscription",

    "column_name": "created_at",

    "data_type": "timestamp without time zone"

  },

  {

    "table_name": "subscription_analytics",

    "column_name": "subscription_plan",

    "data_type": "text"

  },

  {

    "table_name": "subscription_analytics",

    "column_name": "subscription_status",

    "data_type": "text"

  },

  {

    "table_name": "subscription_analytics",

    "column_name": "user_count",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_analytics",

    "column_name": "active_count",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_analytics",

    "column_name": "trial_count",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_analytics",

    "column_name": "inactive_count",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_analytics",

    "column_name": "avg_trial_days_remaining",

    "data_type": "numeric"

  },

  {

    "table_name": "subscription_cron_status",

    "column_name": "jobname",

    "data_type": "text"

  },

  {

    "table_name": "subscription_cron_status",

    "column_name": "schedule",

    "data_type": "text"

  },

  {

    "table_name": "subscription_cron_status",

    "column_name": "active",

    "data_type": "boolean"

  },

  {

    "table_name": "subscription_cron_status",

    "column_name": "command",

    "data_type": "text"

  },

  {

    "table_name": "subscription_cron_status",

    "column_name": "status",

    "data_type": "text"

  },

  {

    "table_name": "subscription_cron_status",

    "column_name": "description",

    "data_type": "text"

  },

  {

    "table_name": "subscription_plan_limits",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "subscription_plan_limits",

    "column_name": "plan_name",

    "data_type": "text"

  },

  {

    "table_name": "subscription_plan_limits",

    "column_name": "feature_type",

    "data_type": "text"

  },

  {

    "table_name": "subscription_plan_limits",

    "column_name": "period_type",

    "data_type": "text"

  },

  {

    "table_name": "subscription_plan_limits",

    "column_name": "limit_count",

    "data_type": "integer"

  },

  {

    "table_name": "subscription_plan_limits",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "subscription_plan_limits",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "user_id",

    "data_type": "uuid"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "old_plan",

    "data_type": "character varying"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "new_plan",

    "data_type": "character varying"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "remaining_days",

    "data_type": "integer"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "remaining_value",

    "data_type": "numeric"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "bonus_days",

    "data_type": "integer"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "total_new_duration",

    "data_type": "integer"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "account_credit",

    "data_type": "numeric"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "calculation_details",

    "data_type": "jsonb"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "created_at",

    "data_type": "timestamp without time zone"

  },

  {

    "table_name": "subscription_proration_log",

    "column_name": "updated_at",

    "data_type": "timestamp without time zone"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "subscription_plan",

    "data_type": "text"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "subscription_status",

    "data_type": "text"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "total_users",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "active_users",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "trial_users",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "users_with_trial_remaining",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "avg_trial_days_remaining",

    "data_type": "numeric"

  },

  {

    "table_name": "subscription_summary",

    "column_name": "expired_subscriptions",

    "data_type": "bigint"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "id",

    "data_type": "uuid"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "user_id",

    "data_type": "uuid"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "plan_id",

    "data_type": "text"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "amount",

    "data_type": "numeric"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "payment_reference",

    "data_type": "text"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "paystack_reference",

    "data_type": "text"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "status",

    "data_type": "text"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "metadata",

    "data_type": "jsonb"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "created_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "updated_at",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "proration_applied",

    "data_type": "boolean"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "trial_bonus_applied",

    "data_type": "boolean"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "is_trial",

    "data_type": "boolean"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "bonus_days_used",

    "data_type": "integer"

  },

  {

    "table_name": "subscription_transactions",

    "column_name": "proration_details",

    "data_type": "jsonb"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "grantor",

    "data_type": "name"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "grantee",

    "data_type": "name"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "object_catalog",

    "data_type": "name"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "object_schema",

    "data_type": "name"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "object_name",

    "data_type": "name"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "object_type",

    "data_type": "character varying"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "privilege_type",

    "data_type": "character varying"

  },

  {

    "table_name": "usage_privileges",

    "column_name": "is_grantable",

    "data_type": "character varying"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "user_id",

    "data_type": "uuid"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "email",

    "data_type": "text"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "subscription_plan",

    "data_type": "text"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "subscription_status",

    "data_type": "text"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "trial_days_left",

    "data_type": "numeric"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "feature_type",

    "data_type": "text"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "current_count",

    "data_type": "integer"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "limit_count",

    "data_type": "integer"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "period_start",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "period_end",

    "data_type": "timestamp with time zone"

  },

  {

    "table_name": "user_feature_usage",

    "column_name": "usage_percentage",

    "data_type": "numeric"

  },

  {

    "table_name": "view_column_usage",

    "column_name": "view_catalog",

    "data_type": "name"

  },

  {

    "table_name": "view_column_usage",

    "column_name": "view_schema",

    "data_type": "name"

  },

  {

    "table_name": "view_column_usage",

    "column_name": "view_name",

    "data_type": "name"

  },

  {

    "table_name": "view_column_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "view_column_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "view_column_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "view_column_usage",

    "column_name": "column_name",

    "data_type": "name"

  },

  {

    "table_name": "view_routine_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "view_routine_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "view_routine_usage",

    "column_name": "table_name",

    "data_type": "name"

  },

  {

    "table_name": "view_routine_usage",

    "column_name": "specific_catalog",

    "data_type": "name"

  },

  {

    "table_name": "view_routine_usage",

    "column_name": "specific_schema",

    "data_type": "name"

  },

  {

    "table_name": "view_routine_usage",

    "column_name": "specific_name",

    "data_type": "name"

  },

  {

    "table_name": "view_table_usage",

    "column_name": "view_catalog",

    "data_type": "name"

  },

  {

    "table_name": "view_table_usage",

    "column_name": "view_schema",

    "data_type": "name"

  },

  {

    "table_name": "view_table_usage",

    "column_name": "view_name",

    "data_type": "name"

  },

  {

    "table_name": "view_table_usage",

    "column_name": "table_catalog",

    "data_type": "name"

  },

  {

    "table_name": "view_table_usage",

    "column_name": "table_schema",

    "data_type": "name"

  },

  {

    "table_name": "view_table_usage",

    "column_name": "table_name",

    "data_type": "name"

  }

]

[

  {

    "table_name": "email_verification_tokens",

    "column_name": "token",

    "data_type": "text"

  },

  {

    "table_name": "flow_state",

    "column_name": "provider_access_token",

    "data_type": "text"

  },

  {

    "table_name": "flow_state",

    "column_name": "provider_refresh_token",

    "data_type": "text"

  },

  {

    "table_name": "objects",

    "column_name": "path_tokens",

    "data_type": "ARRAY"

  },

  {

    "table_name": "one_time_tokens",

    "column_name": "token_hash",

    "data_type": "text"

  },

  {

    "table_name": "one_time_tokens",

    "column_name": "token_type",

    "data_type": "USER-DEFINED"

  },

  {

    "table_name": "pg_ts_config_map",

    "column_name": "maptokentype",

    "data_type": "integer"

  },

  {

    "table_name": "pg_ts_parser",

    "column_name": "prstoken",

    "data_type": "regproc"

  },

  {

    "table_name": "push_subscriptions",

    "column_name": "token",

    "data_type": "text"

  },

  {

    "table_name": "refresh_tokens",

    "column_name": "token",

    "data_type": "character varying"

  },

  {

    "table_name": "users",

    "column_name": "confirmation_token",

    "data_type": "character varying"

  },

  {

    "table_name": "users",

    "column_name": "email_change_token_current",

    "data_type": "character varying"

  },

  {

    "table_name": "users",

    "column_name": "email_change_token_new",

    "data_type": "character varying"

  },

  {

    "table_name": "users",

    "column_name": "phone_change_token",

    "data_type": "character varying"

  },

  {

    "table_name": "users",

    "column_name": "reauthentication_token",

    "data_type": "character varying"

  },

  {

    "table_name": "users",

    "column_name": "recovery_token",

    "data_type": "character varying"

  }

]

| schemaname | tablename     | policyname                         | permissive | roles    | cmd | qual                   | with_check |

| ---------- | ------------- | ---------------------------------- | ---------- | -------- | --- | ---------------------- | ---------- |

| public     | notifications | Users can manage own notifications | PERMISSIVE | {public} | ALL | (auth.uid() = user_id) | null       |

| id                                   | user_id                              | title                  | message                                                                            | type    | read  | data | created_at                    |



| bffc08db-5823-4788-a640-59802e948e3e | c9e4e667-94d5-41d3-bf36-41fa09336efe | Subscription Upgraded! | Your subscription has been upgraded to Silver Monthly. Enjoy your new features!    | success | false | {}   | 2025-08-01 10:44:21.918631+00 |

| 4f99fb27-9872-410b-8ade-50ceb54d20c5 | c9e4e667-94d5-41d3-bf36-41fa09336efe | Subscription Upgraded! | Your subscription has been upgraded to Silver Weekly. Enjoy your new features!     | success | false | {}   | 2025-08-01 15:21:49.753497+00 |

| c3d75cef-33bd-4bd6-b6a9-97a555cdf298 | c9e4e667-94d5-41d3-bf36-41fa09336efe | Subscription Upgraded! | Your subscription has been upgraded to Silver Monthly. Enjoy your new features!    | success | false | {}   | 2025-08-02 08:52:10.488889+00 |

| 45179366-0de2-41b6-bbe7-261202189cb2 | c9e4e667-94d5-41d3-bf36-41fa09336efe | Subscription Upgraded! | Your subscription has been upgraded to Silver Monthly. Enjoy your new features!    | success | false | {}   | 2025-08-02 12:18:43.571078+00 |

| e096e9ca-fe3c-483e-af57-4a45aab05e33 | c9e4e667-94d5-41d3-bf36-41fa09336efe | Low Stock Alert!       | Product 'Product 4' was created with low stock (Qty: 3). Consider restocking soon. | warning | false | {}   | 2025-08-02 15:54:23.841765+00 |

| 689bb557-1f92-42ca-bb24-c2c1c21f4283 | c9e4e667-94d5-41d3-bf36-41fa09336efe | Low Stock Alert!       | Product 'Product 5' was created with low stock (Qty: 2). Consider restocking soon. | warning | false | {}   | 2025-08-02 15:55:17.773182+00 |