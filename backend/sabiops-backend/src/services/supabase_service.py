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
            
            # Try with admin client first if available (bypasses RLS)
            if self.admin_client:
                response = self.admin_client.table("notifications").insert(notification_data).execute()
            else:
                self.insert("notifications", notification_data)
            return True
        except Exception as e:
            logger.error(f"Send notification error: {e}")
            # Don't fail the main operation if notification fails
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

    def send_push_notification(self, user_id: str, title: str, message: str, type: str = "info"):
        """Send push notification to all device tokens for a user via Firebase Cloud Messaging (FCM v1 API) using service account."""
        import logging
        try:
            import firebase_admin
            from firebase_admin import credentials, messaging as fcm_messaging
            # Initialize Firebase app if not already
            if not firebase_admin._apps:
                cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': os.getenv("FIREBASE_PROJECT_ID")
                })
            # Get all device tokens for the user
            tokens = []
            if self.is_enabled():
                try:
                    # Try with 'token' column first, fallback to 'device_token'
                    subs = self.select("push_subscriptions", "token", {"user_id": user_id})
                    tokens = [s["token"] for s in subs if s.get("token")]
                except Exception as e:
                    logger.error(f"Error getting push subscriptions: {e}")
                    # If push_subscriptions table doesn't exist or column is wrong, skip push notifications
                    tokens = []
            if not tokens:
                logging.info(f"No device tokens for user {user_id}")
                return False
            # Build message
            notification = fcm_messaging.Notification(title=title, body=message)
            message = fcm_messaging.MulticastMessage(
                notification=notification,
                tokens=tokens,
                data={"type": type}
            )
            response = fcm_messaging.send_multicast(message)
            if response.failure_count > 0:
                logging.error(f"Push notification failures: {response.failure_count}, errors: {response.responses}")
            logging.info(f"Push notification sent to user {user_id}, success: {response.success_count}")
            return response.success_count > 0
        except Exception as e:
            logging.error(f"Push notification error: {e}")
            return False

    def notify_user(self, user_id: str, title: str, message: str, type: str = "info"):
        """Send both in-app and push notification to a user"""
        self.send_notification(user_id, title, message, type)
        self.send_push_notification(user_id, title, message, type)

# Instantiate the SupabaseService class to make it importable
supabase_instance = SupabaseService()