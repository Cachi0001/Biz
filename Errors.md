ERROR:src.services.subscription_service:Error resolving subscription conflicts for user c9e4e667-94d5-41d3-bf36-41fa09336efe: can't compare offset-naive and offset-aware datetimes
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=%2A&id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/feature_usage?select=%2A&user_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=owner_id%2C%20role&id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/invoices?select=id&owner_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/expenses?select=id&owner_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/sales?select=id&owner_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/products?select=id&owner_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=id%2C%20role%2C%20owner_id&id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=subscription_plan%2Ccurrent_month_invoices&id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/customers?select=%2A&id=eq.1cd33b25-775b-40a5-a3bc-735bf0421322&owner_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/invoices?select=id&owner_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe&created_at=gte.2025-08-01T00%3A00%3A00&created_at=lt.2025-08-02T00%3A00%3A00 "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/invoices?select=id&invoice_number=eq.INV-20250801-0001 "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/products?select=name%2C%20quantity&id=eq.9e14bf80-aa6b-454c-a359-3d89156665e6&owner_id=eq.c9e4e667-94d5-41d3-bf36-41fa09336efe "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: POST https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/invoices "HTTP/1.1 400 Bad Request"
Error creating invoice: {'code': 'PGRST204', 'details': None, 'hint': None, 'message': "Could not find the 'terms' column of 'invoices' in the schema cache"}
127.0.0.1 - - [01/Aug/2025 10:45:52] "POST /api/invoices/ HTTP/1.1" 500 -