Key Columns:

id: UUID (Primary Key)
owner_id: UUID (Foreign Key to users table)
customer_id: UUID (Foreign Key to customers table)
invoice_number: Text (Unique, auto-generated)
amount: Numeric (Invoice subtotal)
tax_amount: Numeric (Tax amount)
total_amount: Numeric (Total invoice amount)
status: Text (Invoice status)
Possible values: 'draft', 'sent', 'paid', 'overdue', 'cancelled'
due_date: Timestamp
paid_date: Timestamp
items: JSONB (Stores invoice line items)
currency: Text (Default: 'NGN')
issue_date: Timestamp (Default: current timestamp)
Additional Interesting Columns:

total_cogs: Numeric (Total Cost of Goods Sold)
gross_profit: Numeric
payment_terms: Text (Default: 30 days)
seller_name, seller_address, seller_contact
discount_amount: Numeric
inventory_updated: Boolean (Tracks if inventory has been updated)