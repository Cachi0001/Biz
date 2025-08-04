| constraint_name                | constraint_type | column_name         | check_clause                                                                                         |
| ------------------------------ | --------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| sales_amount_due_check         | CHECK           | null                | (amount_due >= (0)::numeric)                                                                         |
| sales_amount_paid_check        | CHECK           | null                | (amount_paid >= (0)::numeric)                                                                        |
| sales_customer_id_fkey         | FOREIGN KEY     | customer_id         | null                                                                                                 |
| sales_owner_id_fkey            | FOREIGN KEY     | owner_id            | null                                                                                                 |
| sales_payment_method_id_fkey   | FOREIGN KEY     | payment_method_id   | null                                                                                                 |
| sales_payment_status_check     | CHECK           | null                | (payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])) |
| sales_pkey                     | PRIMARY KEY     | id                  | null                                                                                                 |
| sales_product_category_id_fkey | FOREIGN KEY     | product_category_id | null                                                                                                 |
| sales_product_id_fkey          | FOREIGN KEY     | product_id          | null                                                                                                 |
| sales_salesperson_id_fkey      | FOREIGN KEY     | salesperson_id      | null                                                                                                 |
| 2200_19148_1_not_null          | CHECK           | null                | id IS NOT NULL                                                                                       |
| 2200_19148_6_not_null          | CHECK           | null                | product_name IS NOT NULL                                                                             |
| 2200_19148_7_not_null          | CHECK           | null                | quantity IS NOT NULL                                                                                 |
| 2200_19148_8_not_null          | CHECK           | null                | unit_price IS NOT NULL                                                                               |
| 2200_19148_9_not_null          | CHECK           | null                | total_amount IS NOT NULL                                                                             |