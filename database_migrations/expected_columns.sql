[
  {
    "table_name": "sales",
    "column_name": "quantity",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "owner_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "invoice_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "products",
    "column_name": "last_restocked_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "sales",
    "column_name": "owner_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "customer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "product_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "sales",
    "column_name": "unit_price",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "total_amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "salesperson_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "sales",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "sales",
    "column_name": "total_cogs",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "sales",
    "column_name": "gross_profit",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "sales",
    "column_name": "profit_margin",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "payments",
    "column_name": "paid_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "payments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "products",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "products",
    "column_name": "owner_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "price",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "cost_price",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "quantity",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "products",
    "column_name": "low_stock_threshold",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "5"
  },
  {
    "table_name": "products",
    "column_name": "active",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "products",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "payments",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pending'::text"
  },
  {
    "table_name": "payments",
    "column_name": "payment_reference",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "payment_method",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'cash'::text"
  },
  {
    "table_name": "sales",
    "column_name": "customer_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "category",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'General'::text"
  },
  {
    "table_name": "products",
    "column_name": "image_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "currency",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'NGN'::text"
  },
  {
    "table_name": "payments",
    "column_name": "customer_email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "sku",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "payment_method",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'cash'::text"
  },
  {
    "table_name": "products",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "product_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "sales",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "products",
    "column_name": "supplier",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  }
]
-- this is query below is already executed and was successful

-- Ensure products table id has default (already correct, but verify)
ALTER TABLE products
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Ensure payments table has all required columns
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NGN';

-- Ensure sales table supports customer_email (optional)
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS customer_email text;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload';