ERROR:api.index:Unhandled exception: Install Flask with the 'async' extra in order to use async views.
ERROR:api.index:Traceback (most recent call last):
File "/var/task/flask/app.py", line 1484, in full_dispatch_request
rv = self.dispatch_request()
^^^^^^^^^^^^^^^^^^^^^^^
File "/var/task/flask/app.py", line 1469, in dispatch_request
return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
File "/var/task/flask_jwt_extended/view_decorators.py", line 170, in decorator
return current_app.ensure_sync(fn)(*args, **kwargs)
^^^^^^^^^^^^^^^^^^^^^^^^^^^
File "/var/task/flask/app.py", line 1553, in ensure_sync
return self.async_to_sync(func)
^^^^^^^^^^^^^^^^^^^^^^^^
File "/var/task/flask/app.py", line 1574, in async_to_sync
raise RuntimeError(
RuntimeError: Install Flask with the 'async' extra in order to use async views.
127.0.0.1 - - [01/Aug/2025 11:44:42] "PUT /api/invoices/fe78633f-946f-48a2-91ea-7ca3109ef83a/status HTTP/1.1" 500 -

In the advanced analytics chart there is no orange candle that represents the expenses real time from the users expenses that allows the user to compare the revenue and expenses please can you fix this

And also i tried updating invoice status and got the error message in the Errors.md file

Traceback (most recent call last): File "/var/task/vc__handler__python.py", line 14, in <module> __vc_spec.loader.exec_module(__vc_module) File "<frozen importlib._bootstrap_external>", line 999, in exec_module File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed File "/var/task/api/index.py", line 23, in <module> from routes.invoice import invoice_bp File "/var/task/api/../src/routes/invoice.py", line 587 await send_invoice_notification(updated_invoice, new_status) ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ SyntaxError: 'await' outside async function Python process exited with exit status: 1. The logs above can help with debugging the issue.

Am tired of this invoice issue i just wanted an invoice that once created the product quantity reduces similar pattern to how sales reduces the product quantity once a sale is recorded and once the status change to paid it is been recorded across all the analytics , dashboard cards for calculation and transaction history , check this file C:\Users\DELL\Saas\Biz\Errors.md and check this to understand the current setup of invoice tableC:\Users\DELL\Saas\Biz\backend\migeration\fix_invoice_data.sql  on the supbase and help me implement or enhance to match this fix, and also for the toast error message on invoice am getting two different types please maintain one type please