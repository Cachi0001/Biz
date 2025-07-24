Traceback (most recent call last):
File "/var/task/vc__handler__python.py", line 14, in <module>
__vc_spec.loader.exec_module(__vc_module)
File "<frozen importlib._bootstrap_external>", line 999, in exec_module
File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
File "/var/task/api/index.py", line 31, in <module>
from routes.search import search_bp
File "/var/task/api/../src/routes/search.py", line 3, in <module>
from src.services.supabase_service import supabase
ImportError: cannot import name 'supabase' from 'src.services.supabase_service' (/var/task/src/services/supabase_service.py)
Python process exited with exit status: 1. The logs above can help with debugging the issue.
Traceback (most recent call last):
File "/var/task/vc__handler__python.py", line 14, in <module>
__vc_spec.loader.exec_module(__vc_module)
File "<frozen importlib._bootstrap_external>", line 999, in exec_module
File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
File "/var/task/api/index.py", line 31, in <module>
from routes.search import search_bp
File "/var/task/api/../src/routes/search.py", line 3, in <module>
from src.services.supabase_service import supabase
ImportError: cannot import name 'supabase' from 'src.services.supabase_service' (/var/task/src/services/supabase_service.py)
Python process exited with exit status: 1. The logs above can help with debugging the issue.