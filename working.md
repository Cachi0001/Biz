(venv) PS C:\Users\DELL\Saas\Biz\backend\bizflow-backend> python test_backend.py 
🔍 Testing Bizflow Backend Components...
Current directory: C:\Users\DELL\Saas\Biz\backend\bizflow-backend
Source directory: C:\Users\DELL\Saas\Biz\backend\bizflow-backend\src
Python path: ['C:\\Users\\DELL\\Saas\\Biz\\backend\\bizflow-backend\\src', 'C:\\Users\\DELL\\Saas\\Biz\\backend\\bizflow-backend', 'C:\\Users\\DELL\\AppData\\Local\\Programs\\Python\\Python312\\python312.zip']...
🎯 Bizflow SME Nigeria - Backend Testing
==================================================

📦 Testing basic imports...
✅ Flask import successful
✅ Flask-SQLAlchemy import successful
✅ Flask-JWT-Extended import successful
✅ Flask-CORS import successful

🗄️ Testing model imports...
❌ models.user import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
❌ models.customer import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\flask_sqlalchemy\model.py:144: SAWarning: This declarative base already contains a class with the same class name and module name as models.customer.Customer, and will be replaced in the string-lookup table.
  super().__init__(name, bases, d, **kwargs)
❌ models.product import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
❌ models.invoice import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
❌ models.payment import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
❌ models.expense import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
❌ models.sale import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
❌ models.referral import failed: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.

🔧 Testing service imports...
❌ services.paystack_service import failed: PAYSTACK_SECRET_KEY environment variable is required
Email service not configured. SMTP credentials missing.
✅ services.email_service import successful
✅ services.pdf_service import successful
✅ services.excel_service import successful
✅ services.cloudinary_service import successful

🛣️ Testing route imports...
✅ routes.auth import successful
✅ routes.user import successful
✅ routes.customer import successful
✅ routes.product import successful
✅ routes.invoice import successful
✅ routes.payment import successful
✅ routes.dashboard import successful
✅ routes.expense import successful
✅ routes.sale import successful
✅ routes.referral import successful
✅ routes.subscription import successful

🚀 Testing Flask app creation...
✅ Basic Flask app created successfully

🗃️ Testing database initialization...
✅ Database initialization successful

📊 TESTING SUMMARY
==================================================
✅ Successful models: 0
❌ Failed models: 8
✅ Successful services: 4
❌ Failed services: 1
✅ Successful routes: 11
❌ Failed routes: 0

❌ Failed model imports:
   - models.user: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
   - models.customer: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
   - models.product: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
   - models.invoice: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
   - models.payment: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
   - models.expense: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
   - models.sale: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.
   - models.referral: Table 'customers' is already defined for this MetaData instance.  Specify 'extend_existing=True' to redefine options and columns on an existing Table object.

❌ Failed service imports:
   - services.paystack_service: PAYSTACK_SECRET_KEY environment variable is required   

🎯 Overall Success Rate: 62.5%
⚠️ Backend has some issues but is partially functional

(venv) PS C:\Users\DELL\Saas\Biz\backend\bizflow-backend> python -m src.main           
Base Directory: C:\Users\DELL\Saas\Biz\backend\bizflow-backend\src
Using Supabase PostgreSQL: okpqkuxnzibrjmniihhu
Traceback (most recent call last):
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 145, in __init__
    self._dbapi_connection = engine.raw_connection()
                             ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3297, in raw_connection
    return self.pool.connect()
           ^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 449, in connect
    return _ConnectionFairy._checkout(self)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 1264, in _checkout
    fairy = _ConnectionRecord.checkout(pool)
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 713, in checkout
    rec = pool._do_get()
          ^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\impl.py", line 179, in _do_get
    with util.safe_reraise():
         ^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\util\langhelpers.py", line 224, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\impl.py", line 177, in _do_get
    return self._create_connection()
           ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 390, in _create_connection
    return _ConnectionRecord(self)
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 675, in __init__
    self.__connect()
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 901, in __connect
    with util.safe_reraise():
         ^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\util\langhelpers.py", line 224, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 897, in __connect
    self.dbapi_connection = connection = pool._invoke_creator(self)
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\create.py", line 646, in connect
    return dialect.connect(*cargs, **cparams)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\default.py", line 625, in connect
    return self.loaded_dbapi.connect(*cargs, **cparams)  # type: ignore[no-any-return]  # NOQA: E501
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\psycopg2\__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
psycopg2.OperationalError: connection to server at "aws-0-us-west-1.pooler.supabase.com" (52.8.172.168), port 6543 failed: FATAL:  Tenant or user not found
connection to server at "aws-0-us-west-1.pooler.supabase.com" (52.8.172.168), port 6543 failed: FATAL:  Tenant or user not found


The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "<frozen runpy>", line 198, in _run_module_as_main
  File "<frozen runpy>", line 88, in _run_code
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\src\main.py", line 156, in <module>
    app = create_app()
          ^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\src\main.py", line 132, in create_app
    db.create_all()
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\flask_sqlalchemy\extension.py", line 900, in create_all
    self._call_for_binds(bind_key, "create_all")
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\flask_sqlalchemy\extension.py", line 881, in _call_for_binds
    getattr(metadata, op_name)(bind=engine)
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\sql\schema.py", line 5924, in create_all
    bind._run_ddl_visitor(
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3247, in _run_ddl_visitor
    with self.begin() as conn:
         ^^^^^^^^^^^^
  File "C:\Users\DELL\AppData\Local\Programs\Python\Python312\Lib\contextlib.py", line 137, in __enter__
    return next(self.gen)
           ^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3237, in begin
    with self.connect() as conn:
         ^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3273, in connect
    return self._connection_cls(self)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 147, in __init__
    Connection._handle_dbapi_exception_noconnection(
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 2436, in _handle_dbapi_exception_noconnection
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 145, in __init__
    self._dbapi_connection = engine.raw_connection()
                             ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3297, in raw_connection
    return self.pool.connect()
           ^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 449, in connect
    return _ConnectionFairy._checkout(self)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 1264, in _checkout
    fairy = _ConnectionRecord.checkout(pool)
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 713, in checkout
    rec = pool._do_get()
          ^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\impl.py", line 179, in _do_get
    with util.safe_reraise():
         ^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\util\langhelpers.py", line 224, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\impl.py", line 177, in _do_get
    return self._create_connection()
           ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 390, in _create_connection
    return _ConnectionRecord(self)
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 675, in __init__
    self.__connect()
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 901, in __connect
    with util.safe_reraise():
         ^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\util\langhelpers.py", line 224, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 897, in __connect
    self.dbapi_connection = connection = pool._invoke_creator(self)
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\create.py", line 646, in connect
    return dialect.connect(*cargs, **cparams)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\sqlalchemy\engine\default.py", line 625, in connect
    return self.loaded_dbapi.connect(*cargs, **cparams)  # type: ignore[no-any-return]  # NOQA: E501
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\DELL\Saas\Biz\backend\bizflow-backend\venv\Lib\site-packages\psycopg2\__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection to server at "aws-0-us-west-1.pooler.supabase.com" (52.8.172.168), port 6543 failed: FATAL:  Tenant or user not found
connection to server at "aws-0-us-west-1.pooler.supabase.com" (52.8.172.168), port 6543 failed: FATAL:  Tenant or user not found

(Background on this error at: https://sqlalche.me/e/20/e3q8)