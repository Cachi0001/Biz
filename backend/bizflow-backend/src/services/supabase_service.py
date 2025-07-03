"""
Supabase Service for Bizflow SME Nigeria
Handles Supabase authentication and database operations
"""
import os
from supabase import create_client, Client
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if self.url and self.key:
            self.client: Client = create_client(self.url, self.key)
            self.admin_client: Client = create_client(self.url, self.service_key) if self.service_key else None
            self.enabled = True
            logger.info("Supabase service initialized successfully")
        else:
            self.client = None
            self.admin_client = None
            self.enabled = False
            logger.warning("Supabase credentials not found, using SQLite fallback")
    
    def is_enabled(self) -> bool:
        """Check if Supabase is properly configured"""
        return self.enabled and self.client is not None
    
    # Authentication methods
    def sign_up(self, email: str, password: str, **kwargs) -> Dict[str, Any]:
        """Register a new user with Supabase Auth"""
        if not self.is_enabled():
            raise Exception("Supabase not configured")
        
        try:
            response = self.client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": kwargs  # Additional user metadata
                }
            })
            return response.dict()
        except Exception as e:
            logger.error(f"Supabase sign up error: {e}")
            raise
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in user with Supabase Auth"""
        if not self.is_enabled():
            raise Exception("Supabase not configured")
        
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return response.dict()
        except Exception as e:
            logger.error(f"Supabase sign in error: {e}")
            raise
    
    def get_user(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user from access token"""
        if not self.is_enabled():
            return None
        
        try:
            response = self.client.auth.get_user(access_token)
            return response.dict() if response else None
        except Exception as e:
            logger.error(f"Supabase get user error: {e}")
            return None
    
    def sign_out(self, access_token: str) -> bool:
        """Sign out user"""
        if not self.is_enabled():
            return True
        
        try:
            self.client.auth.sign_out()
            return True
        except Exception as e:
            logger.error(f"Supabase sign out error: {e}")
            return False
    
    # Database operations
    def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data into Supabase table"""
        if not self.is_enabled():
            raise Exception("Supabase not configured")
        
        try:
            response = self.client.table(table).insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Supabase insert error: {e}")
            raise
    
    def select(self, table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Select data from Supabase table"""
        if not self.is_enabled():
            raise Exception("Supabase not configured")
        
        try:
            query = self.client.table(table).select(columns)
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Supabase select error: {e}")
            raise
    
    def update(self, table: str, data: Dict[str, Any], filters: Dict[str, Any]) -> Dict[str, Any]:
        """Update data in Supabase table"""
        if not self.is_enabled():
            raise Exception("Supabase not configured")
        
        try:
            query = self.client.table(table).update(data)
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Supabase update error: {e}")
            raise
    
    def delete(self, table: str, filters: Dict[str, Any]) -> bool:
        """Delete data from Supabase table"""
        if not self.is_enabled():
            raise Exception("Supabase not configured")
        
        try:
            query = self.client.table(table).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            response = query.execute()
            return True
        except Exception as e:
            logger.error(f"Supabase delete error: {e}")
            raise
    
    # Real-time subscriptions
    def subscribe_to_table(self, table: str, callback):
        """Subscribe to real-time changes on a table"""
        if not self.is_enabled():
            return None
        
        try:
            return self.client.table(table).on('*', callback).subscribe()
        except Exception as e:
            logger.error(f"Supabase subscription error: {e}")
            return None
    
    # Notification methods
    def send_notification(self, user_id: str, title: str, message: str, type: str = "info"):
        """Send notification to user"""
        if not self.is_enabled():
            return False
        
        try:
            notification_data = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": type,
                "read": False,
                "created_at": "now()"
            }
            
            self.insert("notifications", notification_data)
            return True
        except Exception as e:
            logger.error(f"Send notification error: {e}")
            return False
    
    def get_notifications(self, user_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        """Get user notifications"""
        if not self.is_enabled():
            return []
        
        try:
            filters = {"user_id": user_id}
            if unread_only:
                filters["read"] = False
            
            return self.select("notifications", "*", filters)
        except Exception as e:
            logger.error(f"Get notifications error: {e}")
            return []
    
    def mark_notification_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        if not self.is_enabled():
            return False
        
        try:
            self.update("notifications", {"read": True}, {"id": notification_id})
            return True
        except Exception as e:
            logger.error(f"Mark notification read error: {e}")
            return False