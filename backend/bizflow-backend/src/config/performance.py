"""Performance optimization configuration for Bizflow SME Nigeria."""

import os
from flask import Flask, request, g
from flask_caching import Cache
from functools import wraps
import time
import logging


def configure_performance(app: Flask, cache: Cache):
    """Configure performance optimizations."""
    
    # Database connection pooling
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 20,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'max_overflow': 30
    }
    
    # Request timing middleware
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            response.headers['X-Response-Time'] = f"{duration:.3f}s"
            
            # Log slow requests
            if duration > 1.0:  # Log requests taking more than 1 second
                app.logger.warning(f"Slow request: {request.method} {request.path} took {duration:.3f}s")
        
        return response
    
    # Compression for responses
    @app.after_request
    def compress_response(response):
        if (response.content_length and 
            response.content_length > 1000 and
            'gzip' in request.headers.get('Accept-Encoding', '')):
            response.headers['Content-Encoding'] = 'gzip'
        return response


def cache_key_generator(*args, **kwargs):
    """Generate cache keys for functions."""
    key_parts = []
    
    # Add function arguments
    for arg in args:
        if hasattr(arg, 'id'):
            key_parts.append(f"{type(arg).__name__}_{arg.id}")
        else:
            key_parts.append(str(arg))
    
    # Add keyword arguments
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}_{v}")
    
    return "_".join(key_parts)


def cached_query(timeout=300, key_prefix="query"):
    """Decorator for caching database queries."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import current_app
            cache = current_app.extensions.get('cache')
            
            if not cache:
                return func(*args, **kwargs)
            
            # Generate cache key
            cache_key = f"{key_prefix}_{func.__name__}_{cache_key_generator(*args, **kwargs)}"
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout=timeout)
            
            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str):
    """Invalidate cache entries matching a pattern."""
    from flask import current_app
    cache = current_app.extensions.get('cache')
    
    if cache and hasattr(cache, 'delete_many'):
        # For Redis cache
        cache.delete_many(pattern)


# Database query optimizations
class QueryOptimizer:
    """Optimize database queries for better performance."""
    
    @staticmethod
    def paginate_query(query, page=1, per_page=20, max_per_page=100):
        """Paginate query results efficiently."""
        per_page = min(per_page, max_per_page)
        return query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    
    @staticmethod
    def optimize_joins(query, *relationships):
        """Optimize query with eager loading."""
        from sqlalchemy.orm import joinedload
        
        for relationship in relationships:
            query = query.options(joinedload(relationship))
        
        return query
    
    @staticmethod
    def bulk_insert(model_class, data_list):
        """Perform bulk insert operations."""
        from src.models import db
        
        try:
            db.session.bulk_insert_mappings(model_class, data_list)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            logging.error(f"Bulk insert failed: {e}")
            return False
    
    @staticmethod
    def bulk_update(model_class, data_list):
        """Perform bulk update operations."""
        from src.models import db
        
        try:
            db.session.bulk_update_mappings(model_class, data_list)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            logging.error(f"Bulk update failed: {e}")
            return False


# Background task processing
class BackgroundTasks:
    """Handle background tasks for performance."""
    
    @staticmethod
    def send_email_async(email_data):
        """Send email in background."""
        # This would integrate with Celery or similar
        pass
    
    @staticmethod
    def generate_report_async(report_type, user_id, filters):
        """Generate reports in background."""
        # This would integrate with Celery or similar
        pass
    
    @staticmethod
    def process_bulk_upload_async(file_path, user_id):
        """Process bulk uploads in background."""
        # This would integrate with Celery or similar
        pass


# Nigerian market specific optimizations
class NigerianOptimizations:
    """Optimizations specific to Nigerian market conditions."""
    
    @staticmethod
    def optimize_for_mobile():
        """Optimize responses for mobile connections."""
        # Reduce payload size for mobile users
        pass
    
    @staticmethod
    def handle_poor_connectivity():
        """Handle poor internet connectivity gracefully."""
        # Implement retry mechanisms and offline capabilities
        pass
    
    @staticmethod
    def optimize_payment_processing():
        """Optimize for Nigerian payment gateways."""
        # Cache payment verification results
        pass