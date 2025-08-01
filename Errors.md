INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=%2A&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=%2A&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/feature_usage?select=%2A&user_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
ERROR:src.services.subscription_service:Error getting actual database counts for user 7a600a40-4a62-4bf7-b46b-7417843b026a: 'SyncSelectRequestBuilder' object has no attribute 'or_'
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=id%2C%20role%2C%20owner_id&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: POST https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/products "HTTP/1.1 201 Created"
Traceback (most recent call last):
File "/var/task/api/../src/routes/product.py", line 344, in create_product
    usage_status = get_usage_status_for_response(user_id, 'products')
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
TypeError: get_usage_status_for_response() takes 1 positional argument but 2 were given
ERROR:api.index:Error creating product: get_usage_status_for_response() takes 1 positional argument but 2 were given
ERROR:routes.product:[PRODUCT API ERROR] Status: 500, Message: Failed to create product, Error: get_usage_status_for_response() takes 1 positional argument but 2 were given
127.0.0.1 - - [01/Aug/2025 08:12:55] "POST /api/products/ HTTP/1.1" 500 -

INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=%2A&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=%2A&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/feature_usage?select=%2A&user_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
ERROR:src.services.subscription_service:Error getting actual database counts for user 7a600a40-4a62-4bf7-b46b-7417843b026a: 'SyncSelectRequestBuilder' object has no attribute 'or_'
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=id%2C%20role%2C%20owner_id&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
Sales route received data: <class 'dict'> - {'product_id': '514b5671-8aa6-471b-a0db-19aa8293178c', 'product_name': 'Unknown Product', 'quantity': 5, 'unit_price': 3000, 'customer_id': None, 'customer_name': 'Walk-in Customer', 'payment_method': 'cash', 'payment_status': 'completed', 'currency': 'NGN', 'date': '2025-08-01', 'salesperson_id': None, 'notes': '', 'discount_amount': 0, 'total_amount': 15000, 'net_amount': 0, 'total_cogs': 0, 'profit_from_sales': 0, 'sale_items': [{'product_id': '514b5671-8aa6-471b-a0db-19aa8293178c', 'product_name': 'Unknown Product', 'quantity': 5, 'unit_price': 3000, 'total_price': 15000, 'cost_price': 0}]}
Sales route processed data: {'product_id': '514b5671-8aa6-471b-a0db-19aa8293178c', 'product_name': 'Unknown Product', 'quantity': 5, 'unit_price': 3000.0, 'customer_id': None, 'customer_name': 'Walk-in Customer', 'payment_method': 'cash', 'payment_status': 'completed', 'currency': 'NGN', 'date': '2025-08-01', 'salesperson_id': None, 'notes': '', 'discount_amount': 0.0, 'total_amount': 15000.0, 'net_amount': 0, 'total_cogs': 0, 'profit_from_sales': 0, 'sale_items': [{'product_id': '514b5671-8aa6-471b-a0db-19aa8293178c', 'product_name': 'Unknown Product', 'quantity': 5, 'unit_price': 3000, 'total_price': 15000, 'cost_price': 0}]}
INFO:src.utils.business_operations:Starting process_sale_transaction - Context: {"owner_id": "7a600a40-4a62-4bf7-b46b-7417843b026a", "data_type": "dict", "data_size": 607}
INFO:src.utils.business_operations:Processing 1 sale items for owner 7a600a40-4a62-4bf7-b46b-7417843b026a
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/products?select=name%2C%20cost_price&id=eq.514b5671-8aa6-471b-a0db-19aa8293178c "HTTP/1.1 200 OK"
ERROR:src.utils.business_operations:DEBUG: normalized_data type: <class 'dict'>, content: {'product_id': '514b5671-8aa6-471b-a0db-19aa8293178c', 'product_name': 'Unknown Product', 'quantity': 5, 'unit_price': 3000.0, 'customer_id': None, 'customer_name': 'Walk-in Customer', 'payment_method': 'cash', 'payment_status': 'completed', 'currency': 'NGN', 'date': '2025-08-01', 'salesperson_id': None, 'notes': '', 'discount_amount': 0.0, 'total_amount': 15000.0, 'net_amount': 0, 'total_cogs': 0, 'profit_from_sales': 0, 'sale_items': [{'product_id': '514b5671-8aa6-471b-a0db-19aa8293178c', 'product_name': 'Unknown Product', 'quantity': 5, 'unit_price': 3000, 'total_price': 15000, 'cost_price': 0}]}
ERROR:src.utils.business_operations:DEBUG: product type: <class 'dict'>, content: {'name': 'Product 3', 'cost_price': 0.0}
ERROR:src.utils.business_operations:DEBUG: Creating RPC params step by step
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('customer_id')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('customer_name')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('payment_method')
ERROR:src.utils.business_operations:DEBUG: About to access product.get('name')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('notes')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('date')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('discount_amount')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('tax_amount')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('currency')
ERROR:src.utils.business_operations:DEBUG: About to access normalized_data.get('payment_status')
ERROR:src.utils.business_operations:DEBUG: RPC params created successfully: {'p_owner_id': '7a600a40-4a62-4bf7-b46b-7417843b026a', 'p_product_id': '514b5671-8aa6-471b-a0db-19aa8293178c', 'p_quantity': 5, 'p_unit_price': 3000.0, 'p_total_amount': 15000.0, 'p_total_cogs': 0.0, 'p_salesperson_id': '7a600a40-4a62-4bf7-b46b-7417843b026a', 'p_customer_id': None, 'p_customer_name': 'Walk-in Customer', 'p_payment_method': 'cash', 'p_product_name': 'Product 3', 'p_notes': '', 'p_date': '2025-08-01', 'p_discount_amount': 0.0, 'p_tax_amount': 0, 'p_currency': 'NGN', 'p_payment_status': 'completed'}
ERROR:src.utils.business_operations:DEBUG: About to call RPC
INFO:httpx:HTTP Request: POST https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/rpc/create_sale_transaction "HTTP/1.1 200 OK"
WARNING:src.utils.business_operations:Supabase client parsing error, but RPC likely succeeded: 'str' object has no attribute 'get'
INFO:src.utils.business_operations:Successfully processed sale item 0 (despite client error): Product 514b5671-8aa6-471b-a0db-19aa8293178c, Amount 15000.0
INFO:src.utils.business_operations:Successfully processed 1 sale items. Total amount: 15000.0
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/sales?select=%2A&id=eq.3eccaf9a-5964-46d0-8abd-e59c3791ef93 "HTTP/1.1 406 Not Acceptable"
ERROR:src.utils.business_operations:Exception fetching sale record: {'code': 'PGRST116', 'details': 'The result contains 0 rows', 'hint': None, 'message': 'JSON object requested, multiple (or no) rows returned'}
Error creating sale: get_usage_status_for_response() takes 1 positional argument but 2 were given
127.0.0.1 - - [01/Aug/2025 08:15:49] "POST /api/sales/ HTTP/1.1" 500 -

INFO:routes.subscription:Verifying payment SABI_MONTHLY_1754036292849_18hsfk for user 7a600a40-4a62-4bf7-b46b-7417843b026a
INFO:routes.subscription:Upgrading user 7a600a40-4a62-4bf7-b46b-7417843b026a to plan monthly
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=%2A&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
Traceback (most recent call last):
File "/var/task/src/services/subscription_service.py", line 322, in upgrade_subscription
    now = datetime.now(timezone.utc)
                       ^^^^^^^^
ERROR:src.services.subscription_service:Error in upgrade_subscription: name 'timezone' is not defined
NameError: name 'timezone' is not defined
INFO:src.services.supabase_service:Supabase service initialized successfully
WARNING:routes.subscription:Failed to send upgrade notification: 'plan_config'
ERROR:routes.subscription:Payment verification failed: 'subscription'
127.0.0.1 - - [01/Aug/2025 08:18:24] "POST /api/subscription/verify-payment HTTP/1.1" 500 -
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/feature_usage?select=%2A&user_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/notifications?select=%2A&user_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a&order=created_at.desc&limit=50 "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
ERROR:src.services.subscription_service:Error getting actual database counts for user 7a600a40-4a62-4bf7-b46b-7417843b026a: 'SyncSelectRequestBuilder' object has no attribute 'or_'
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=id%2C%20role%2C%20owner_id&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/notifications?select=id&user_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a&read=eq.False "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=subscription_plan%2Ccurrent_month_invoices&id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/customers?select=%2A&id=eq.1ae8c4b7-0c69-4b16-8ea8-7a6f8f677ad3&owner_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/invoices?select=id&owner_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a&created_at=gte.2025-08-01T00%3A00%3A00&created_at=lt.2025-08-02T00%3A00%3A00 "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/invoices?select=id&invoice_number=eq.INV-20250801-0001 "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/products?select=name%2C%20quantity%2C%20reserved_quantity&id=eq.bcb8f104-e70e-4d55-bb7c-4487d491c93d&owner_id=eq.7a600a40-4a62-4bf7-b46b-7417843b026a "HTTP/1.1 400 Bad Request"
ERROR:src.utils.invoice_inventory_manager:Error validating stock availability: {'code': '42703', 'details': None, 'hint': None, 'message': 'column products.reserved_quantity does not exist'}
127.0.0.1 - - [01/Aug/2025 08:21:20] "POST /api/invoices/ HTTP/1.1" 400 -