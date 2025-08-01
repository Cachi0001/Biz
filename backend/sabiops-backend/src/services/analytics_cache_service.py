"""
Analytics Cache Service
Provides caching functionality for analytics data to improve performance
"""

import json
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

class AnalyticsCacheService:
    """Service for caching analytics data to improve performance"""
    
    def __init__(self):
        # In-memory cache for development
        # In production, you would use Redis or similar
        self._cache = {}
        self._cache_ttl = {}
        
        # Cache TTL settings (in seconds)
        self.TTL_SETTINGS = {
            'daily': 300,    # 5 minutes for daily data
            'weekly': 900,   # 15 minutes for weekly data
            'monthly': 1800, # 30 minutes for monthly data
            'yearly': 3600   # 1 hour for yearly data
        }
    
    def get_cache_key(self, user_id: str, analytics_type: str, time_period: str, **kwargs) -> str:
        """Generate a unique cache key for analytics data"""
        key_data = {
            'user_id': user_id,
            'type': analytics_type,
            'period': time_period,
            **kwargs
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get_cached_data(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached data if it exists and is not expired"""
        try:
            if cache_key not in self._cache:
                return None
            
            # Check if cache has expired
            if cache_key in self._cache_ttl:
                expiry_time = self._cache_ttl[cache_key]
                if datetime.now(timezone.utc) > expiry_time:
                    # Cache expired, remove it
                    del self._cache[cache_key]
                    del self._cache_ttl[cache_key]
                    return None
            
            cached_data = self._cache[cache_key]
            logger.info(f"Cache hit for key: {cache_key}")
            return cached_data
            
        except Exception as e:
            logger.error(f"Error retrieving cached data: {str(e)}")
            return None
    
    def set_cached_data(self, cache_key: str, data: Dict[str, Any], time_period: str) -> bool:
        """Store data in cache with appropriate TTL"""
        try:
            ttl_seconds = self.TTL_SETTINGS.get(time_period, 1800)  # Default 30 minutes
            expiry_time = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
            
            self._cache[cache_key] = data
            self._cache_ttl[cache_key] = expiry_time
            
            logger.info(f"Data cached with key: {cache_key}, TTL: {ttl_seconds}s")
            return True
            
        except Exception as e:
            logger.error(f"Error caching data: {str(e)}")
            return False
    
    def invalidate_user_cache(self, user_id: str) -> int:
        """Invalidate all cached data for a specific user"""
        try:
            keys_to_remove = []
            for cache_key in self._cache.keys():
                # Check if this cache key belongs to the user
                if user_id in cache_key:
                    keys_to_remove.append(cache_key)
            
            # Remove the keys
            for key in keys_to_remove:
                if key in self._cache:
                    del self._cache[key]
                if key in self._cache_ttl:
                    del self._cache_ttl[key]
            
            logger.info(f"Invalidated {len(keys_to_remove)} cache entries for user {user_id}")
            return len(keys_to_remove)
            
        except Exception as e:
            logger.error(f"Error invalidating user cache: {str(e)}")
            return 0
    
    def clear_expired_cache(self) -> int:
        """Remove all expired cache entries"""
        try:
            current_time = datetime.now(timezone.utc)
            expired_keys = []
            
            for cache_key, expiry_time in self._cache_ttl.items():
                if current_time > expiry_time:
                    expired_keys.append(cache_key)
            
            # Remove expired entries
            for key in expired_keys:
                if key in self._cache:
                    del self._cache[key]
                if key in self._cache_ttl:
                    del self._cache_ttl[key]
            
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")
            return len(expired_keys)
            
        except Exception as e:
            logger.error(f"Error clearing expired cache: {str(e)}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring"""
        try:
            current_time = datetime.now(timezone.utc)
            total_entries = len(self._cache)
            expired_entries = 0
            
            for expiry_time in self._cache_ttl.values():
                if current_time > expiry_time:
                    expired_entries += 1
            
            return {
                'total_entries': total_entries,
                'active_entries': total_entries - expired_entries,
                'expired_entries': expired_entries,
                'cache_hit_ratio': getattr(self, '_hit_ratio', 0.0),
                'last_cleanup': getattr(self, '_last_cleanup', None)
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {str(e)}")
            return {
                'total_entries': 0,
                'active_entries': 0,
                'expired_entries': 0,
                'error': str(e)
            }

# Global cache service instance
analytics_cache = AnalyticsCacheService()