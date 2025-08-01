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