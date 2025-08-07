import logging
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta
from typing import Dict, List
import hashlib

logger = logging.getLogger(__name__)

class RateLimiter:
    
    def __init__(self):
        self.requests: Dict[str, List[datetime]] = {}
        self.limits = {
            'login': {'requests': 5, 'window': 300},  # 5 requests per 5 minutes
            'register': {'requests': 3, 'window': 600},  # 3 requests per 10 minutes
            'default': {'requests': 100, 'window': 60}  # 100 requests per minute
        }
    
    def _get_client_id(self) -> str:
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')
        return hashlib.md5(f"{client_ip}:{user_agent}".encode()).hexdigest()
    
    def _clean_old_requests(self, client_id: str, window_seconds: int):
        if client_id not in self.requests:
            return
        
        cutoff_time = datetime.now() - timedelta(seconds=window_seconds)
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id] 
            if req_time > cutoff_time
        ]
    
    def is_rate_limited(self, endpoint: str) -> bool:
        client_id = self._get_client_id()
        limit_config = self.limits.get(endpoint, self.limits['default'])
        
        self._clean_old_requests(client_id, limit_config['window'])
        
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        current_requests = len(self.requests[client_id])
        
        if current_requests >= limit_config['requests']:
            logger.warning(f"Rate limit exceeded for client {client_id} on endpoint {endpoint}")
            return True
        
        self.requests[client_id].append(datetime.now())
        return False

rate_limiter = RateLimiter()

def rate_limit(endpoint: str = 'default'):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if rate_limiter.is_rate_limited(endpoint):
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later."
                    }
                }), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator