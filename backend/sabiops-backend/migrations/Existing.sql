        Payment current table
| column_name       | data_type                | character_maximum_length | column_default     | is_nullable |
| ----------------- | ------------------------ | ------------------------ | ------------------ | ----------- |
| id                | uuid                     | null                     | uuid_generate_v4() | NO          |
| owner_id          | uuid                     | null                     | null               | YES         |
| invoice_id        | uuid                     | null                     | null               | YES         |
| amount            | numeric                  | null                     | null               | NO          |
| status            | text                     | null                     | 'pending'::text    | YES         |
| payment_reference | text                     | null                     | null               | YES         |
| payment_method    | text                     | null                     | 'cash'::text       | YES         |
| paid_at           | timestamp with time zone | null                     | null               | YES         |
| created_at        | timestamp with time zone | null                     | now()              | YES         |
| updated_at        | timestamp with time zone | null                     | now()              | YES         |
| currency          | text                     | null                     | 'NGN'::text        | NO          |
| customer_email    | text                     | null                     | null               | YES         |
| customer_name     | text                     | null                     | null               | YES         |
| sale_id           | uuid                     | null                     | null               | YES         |
| description       | text                     | null                     | null               | YES         |
| notes             | text                     | null                     | null               | YES         |
| reference_number  | text                     | null                     | null               | YES         |
| phone             | character varying        | 20                       | null               | YES         |
| customer_phone    | character varying        | 32                       | null               | YES         |                                                                                 | YES         |    
    sales current table
| column_name       | data_type                | character_maximum_length | column_default     | is_nullable |
| ----------------- | ------------------------ | ------------------------ | ------------------ | ----------- |
| id                | uuid                     | null                     | uuid_generate_v4() | NO          |
| owner_id          | uuid                     | null                     | null               | YES         |
| customer_id       | uuid                     | null                     | null               | YES         |
| customer_name     | text                     | null                     | null               | YES         |
| product_id        | uuid                     | null                     | null               | YES         |
| product_name      | text                     | null                     | null               | NO          |
| quantity          | integer                  | null                     | null               | NO          |
| unit_price        | numeric                  | null                     | null               | NO          |
| total_amount      | numeric                  | null                     | null               | NO          |
| payment_method    | text                     | null                     | 'cash'::text       | YES         |
| salesperson_id    | uuid                     | null                     | null               | YES         |
| date              | timestamp with time zone | null                     | now()              | YES         |
| created_at        | timestamp with time zone | null                     | now()              | YES         |
| total_cogs        | numeric                  | null                     | 0                  | YES         |
| gross_profit      | numeric                  | null                     | 0                  | YES         |
| profit_margin     | numeric                  | null                     | 0                  | YES         |
| notes             | text                     | null                     | null               | YES         |
| customer_email    | text                     | null                     | null               | YES         |
| currency          | text                     | null                     | 'NGN'::text        | YES         |
| payment_status    | text                     | null                     | 'completed'::text  | YES         |
| discount_amount   | numeric                  | null                     | 0                  | YES         |
| tax_amount        | numeric                  | null                     | 0                  | YES         |
| profit_from_sales | numeric                  | null                     | 0                  | YES         |
| description       | text                     | null                     | null               | YES         |
| reference_id      | text                     | null                     | null               | YES         |
| reference_type    | character varying        | 50                       | null               | YES         |    
    invoice current table
| column_name          | data_type                | character_maximum_length | column_default                                                                        | is_nullable |
| -------------------- | ------------------------ | ------------------------ | ------------------------------------------------------------------------------------- | ----------- |
| id                   | uuid                     | null                     | uuid_generate_v4()                                                                    | NO          |
| owner_id             | uuid                     | null                     | null                                                                                  | YES         |
| customer_id          | uuid                     | null                     | null                                                                                  | YES         |
| customer_name        | text                     | null                     | null                                                                                  | YES         |
| invoice_number       | text                     | null                     | ('INV-'::text || lpad((nextval('invoice_number_seq'::regclass))::text, 6, '0'::text)) | NO          |
| amount               | numeric                  | null                     | null                                                                                  | NO          |
| tax_amount           | numeric                  | null                     | 0                                                                                     | YES         |
| total_amount         | numeric                  | null                     | null                                                                                  | NO          |
| status               | text                     | null                     | 'draft'::text                                                                         | YES         |
| due_date             | timestamp with time zone | null                     | null                                                                                  | YES         |
| paid_date            | timestamp with time zone | null                     | null                                                                                  | YES         |
| notes                | text                     | null                     | null                                                                                  | YES         |
| items                | jsonb                    | null                     | '[]'::jsonb                                                                           | YES         |
| created_at           | timestamp with time zone | null                     | now()                                                                                 | YES         |
| updated_at           | timestamp with time zone | null                     | now()                                                                                 | YES         |
| total_cogs           | numeric                  | null                     | 0                                                                                     | YES         |
| gross_profit         | numeric                  | null                     | 0                                                                                     | YES         |
| payment_terms        | text                     | null                     | 30                                                                                    | YES         |
| reminder_sent_at     | timestamp with time zone | null                     | null                                                                                  | YES         |
| issue_date           | timestamp with time zone | null                     | now()                                                                                 | YES         |
| seller_name          | text                     | null                     | null                                                                                  | YES         |
| seller_address       | text                     | null                     | null                                                                                  | YES         |
| seller_contact       | text                     | null                     | null                                                                                  | YES         |
| currency             | text                     | null                     | 'NGN'::text                                                                           | YES         |
| discount_amount      | numeric                  | null                     | 0                                                                                     | YES         |
| terms_and_conditions | text                     | null                     | 'Payment is due within 30 days of invoice date.'::text                                | YES         |
| inventory_updated    | boolean                  | null                     | false                                                                                 | YES         |
| inventory_log_id     | uuid                     | null                     | null                                                                                  | YES         |
| terms                | text                     | null                     | ''::text                                                                              | YES         |
| subtotal             | numeric                  | null                     | 0                                                                                     | YES         |
| paid_at              | timestamp with time zone | null                     | null                                                                                  | YES         |
| paid_amount          | numeric                  | null                     | 0    