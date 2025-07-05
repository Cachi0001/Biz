"""Security configuration for Bizflow SME Nigeria."""

import os
from datetime import timedelta
from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_caching import Cache


def configure_security(app: Flask) -> tuple[Limiter, Cache]:
    """Configure security settings for the Flask app."""
    
    # Rate Limiting Configuration
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["1000 per hour", "100 per minute"],
        storage_uri=os.getenv('REDIS_URL', 'memory://'),
        strategy="fixed-window"
    )
    
    # Caching Configuration
    cache = Cache(app, config={
        'CACHE_TYPE': 'redis' if os.getenv('REDIS_URL') else 'simple',
        'CACHE_REDIS_URL': os.getenv('REDIS_URL'),
        'CACHE_DEFAULT_TIMEOUT': 300
    })
    
    # Security Headers with Talisman
    csp = {
        'default-src': "'self'",
        'script-src': [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://js.paystack.co",
            "https://checkout.paystack.com",
            "https://api.cloudinary.com"
        ],
        'style-src': [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com"
        ],
        'font-src': [
            "'self'",
            "https://fonts.gstatic.com"
        ],
        'img-src': [
            "'self'",
            "data:",
            "https:",
            "https://res.cloudinary.com"
        ],
        'connect-src': [
            "'self'",
            "https://api.paystack.co",
            "https://api.cloudinary.com"
        ],
        'frame-src': [
            "'self'",
            "https://js.paystack.co"
        ]
    }
    
    Talisman(
        app,
        force_https=app.config.get('ENV') == 'production',
        strict_transport_security=True,
        strict_transport_security_max_age=31536000,
        content_security_policy=csp,
        content_security_policy_nonce_in=['script-src', 'style-src'],
        feature_policy={
            'geolocation': "'none'",
            'camera': "'none'",
            'microphone': "'none'"
        }
    )
    
    # Additional Security Headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()'
        
        # Nigerian market specific headers
        response.headers['X-Powered-By'] = 'Bizflow SME Nigeria'
        
        return response
    
    return limiter, cache


def configure_rate_limits(limiter: Limiter):
    """Configure specific rate limits for different endpoints."""
    
    # Authentication endpoints - stricter limits
    limiter.limit("5 per minute")(lambda: None, endpoint='auth.login')
    limiter.limit("3 per minute")(lambda: None, endpoint='auth.register')
    limiter.limit("2 per minute")(lambda: None, endpoint='auth.reset_password')
    
    # Payment endpoints - moderate limits
    limiter.limit("10 per minute")(lambda: None, endpoint='payments.process')
    limiter.limit("20 per minute")(lambda: None, endpoint='payments.verify')
    
    # File upload endpoints
    limiter.limit("30 per minute")(lambda: None, endpoint='upload.image')
    
    # API endpoints - generous limits for business operations
    limiter.limit("200 per minute")(lambda: None, endpoint='customers')
    limiter.limit("200 per minute")(lambda: None, endpoint='products')
    limiter.limit("200 per minute")(lambda: None, endpoint='invoices')
    limiter.limit("100 per minute")(lambda: None, endpoint='reports')


# Input validation schemas
VALIDATION_SCHEMAS = {
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'phone': r'^\+?[1-9]\d{1,14}$',  # International format
    'nigerian_phone': r'^(\+234|0)[789]\d{9}$',  # Nigerian phone format
    'amount': r'^\d+(\.\d{1,2})?$',  # Currency amount
    'username': r'^[a-zA-Z0-9_]{3,20}$',
    'password': r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$'  # Strong password
}


def validate_input(input_type: str, value: str) -> bool:
    """Validate input against predefined schemas."""
    import re
    
    if input_type not in VALIDATION_SCHEMAS:
        return False
    
    pattern = VALIDATION_SCHEMAS[input_type]
    return bool(re.match(pattern, value))


def sanitize_input(value: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks."""
    import html
    import re
    
    # HTML escape
    value = html.escape(value)
    
    # Remove potentially dangerous characters
    value = re.sub(r'[<>"\']', '', value)
    
    # Limit length
    value = value[:1000]
    
    return value.strip()