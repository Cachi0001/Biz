"""
Push Notification Service
Handles web push notifications for SabiOps
"""

import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests
from pywebpush import webpush, WebPushException
from supabase import create_client
import os

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.vapid_private_key = os.getenv('VAPID_PRIVATE_KEY')
        self.vapid_public_key = os.getenv('VAPID_PUBLIC_KEY')
        self.vapid_claims = {
            "sub": "mailto:onyemechicaleb4@gmail.com"
        }
    
    def subscribe_user(self, user_id: str, subscription_data: Dict) -> bool:
        """Subscribe user to push notifications"""
        try:
            # Store subscription in database
            supabase.table('push_subscriptions').upsert({
                'user_id': user_id,
                'endpoint': subscription_data['endpoint'],
                'p256dh_key': subscription_data['keys']['p256dh'],
                'auth_key': subscription_data['keys']['auth'],
                'is_active': True,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }).execute()
            
            logger.info(f"User {user_id} subscribed to push notifications")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe user {user_id}: {str(e)}")
            return False
    
    def unsubscribe_user(self, user_id: str, endpoint: str = None) -> bool:
        """Unsubscribe user from push notifications"""
        try:
            query = supabase.table('push_subscriptions').update({
                'is_active': False,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('user_id', user_id)
            
            if endpoint:
                query = query.eq('endpoint', endpoint)
            
            query.execute()
            
            logger.info(f"User {user_id} unsubscribed from push notifications")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unsubscribe user {user_id}: {str(e)}")
            return False
    
    def send_notification(self, user_id: str, title: str, body: str, 
                         data: Dict = None, icon: str = None, 
                         badge: str = None, actions: List = None) -> bool:
        """Send push notification to a specific user"""
        try:
            # Get user's active subscriptions
            subscriptions_response = supabase.table('push_subscriptions').select(
                'endpoint, p256dh_key, auth_key'
            ).eq('user_id', user_id).eq('is_active', True).execute()
            
            if not subscriptions_response.data:
                logger.warning(f"No active subscriptions found for user {user_id}")
                return False
            
            # Prepare notification payload
            payload = {
                'title': title,
                'body': body,
                'icon': icon or '/icons/icon-192x192.png',
                'badge': badge or '/icons/badge-72x72.png',
                'data': data or {},
                'timestamp': datetime.utcnow().isoformat(),
                'requireInteraction': True,
                'actions': actions or []
            }
            
            success_count = 0
            
            # Send to all user's subscriptions
            for subscription in subscriptions_response.data:
                try:
                    subscription_info = {
                        'endpoint': subscription['endpoint'],
                        'keys': {
                            'p256dh': subscription['p256dh_key'],
                            'auth': subscription['auth_key']
                        }
                    }
                    
                    webpush(
                        subscription_info=subscription_info,
                        data=json.dumps(payload),
                        vapid_private_key=self.vapid_private_key,
                        vapid_claims=self.vapid_claims
                    )
                    
                    success_count += 1
                    
                except WebPushException as e:
                    logger.error(f"WebPush error for user {user_id}: {str(e)}")
                    
                    # Handle expired subscriptions
                    if e.response and e.response.status_code in [410, 413]:
                        self.unsubscribe_user(user_id, subscription['endpoint'])
                
                except Exception as e:
                    logger.error(f"Failed to send notification to user {user_id}: {str(e)}")
            
            # Log notification
            self.log_notification(user_id, title, body, success_count > 0)
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Failed to send notification to user {user_id}: {str(e)}")
            return False
    
    def send_bulk_notification(self, user_ids: List[str], title: str, body: str,
                              data: Dict = None, icon: str = None) -> Dict:
        """Send push notification to multiple users"""
        results = {
            'success': 0,
            'failed': 0,
            'total': len(user_ids)
        }
        
        for user_id in user_ids:
            if self.send_notification(user_id, title, body, data, icon):
                results['success'] += 1
            else:
                results['failed'] += 1
        
        logger.info(f"Bulk notification sent: {results}")
        return results
    
    def send_low_stock_alert(self, owner_id: str, product_name: str, 
                           current_stock: int, threshold: int) -> bool:
        """Send low stock alert notification"""
        title = "Low Stock Alert"
        body = f"{product_name} is running low ({current_stock} left)"
        
        data = {
            'type': 'low_stock',
            'product_name': product_name,
            'current_stock': current_stock,
            'threshold': threshold,
            'url': '/products'
        }
        
        actions = [
            {
                'action': 'restock',
                'title': 'Restock Now',
                'icon': '/icons/restock.png'
            },
            {
                'action': 'view',
                'title': 'View Product',
                'icon': '/icons/view.png'
            }
        ]
        
        return self.send_notification(owner_id, title, body, data, actions=actions)
    
    def send_payment_notification(self, user_id: str, invoice_number: str, 
                                amount: float, customer_name: str) -> bool:
        """Send payment received notification"""
        title = "Payment Received"
        body = f"₦{amount:,.2f} received from {customer_name}"
        
        data = {
            'type': 'payment',
            'invoice_number': invoice_number,
            'amount': amount,
            'customer_name': customer_name,
            'url': f'/invoices/{invoice_number}'
        }
        
        return self.send_notification(user_id, title, body, data)
    
    def send_trial_expiry_warning(self, user_id: str, days_left: int) -> bool:
        """Send trial expiry warning notification"""
        title = "Trial Expiring Soon"
        body = f"Your free trial expires in {days_left} day{'s' if days_left != 1 else ''}"
        
        data = {
            'type': 'trial_expiry',
            'days_left': days_left,
            'url': '/pricing'
        }
        
        actions = [
            {
                'action': 'upgrade',
                'title': 'Upgrade Now',
                'icon': '/icons/upgrade.png'
            }
        ]
        
        return self.send_notification(user_id, title, body, data, actions=actions)
    
    def send_team_invitation(self, user_id: str, team_member_name: str, 
                           role: str) -> bool:
        """Send team member invitation notification"""
        title = "New Team Member Added"
        body = f"{team_member_name} has been added as {role}"
        
        data = {
            'type': 'team_invitation',
            'team_member_name': team_member_name,
            'role': role,
            'url': '/team'
        }
        
        return self.send_notification(user_id, title, body, data)
    
    def log_notification(self, user_id: str, title: str, body: str, 
                        success: bool) -> None:
        """Log notification for analytics"""
        try:
            supabase.table('notifications').insert({
                'user_id': user_id,
                'title': title,
                'body': body,
                'type': 'push',
                'status': 'sent' if success else 'failed',
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log notification: {str(e)}")
    
    def get_user_notifications(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Get user's notification history"""
        try:
            response = supabase.table('notifications').select(
                'id, title, body, type, status, created_at, read_at'
            ).eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"Failed to get notifications for user {user_id}: {str(e)}")
            return []
    
    def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """Mark notification as read"""
        try:
            supabase.table('notifications').update({
                'read_at': datetime.utcnow().isoformat()
            }).eq('id', notification_id).eq('user_id', user_id).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark notification as read: {str(e)}")
            return False
    
    def cleanup_expired_subscriptions(self) -> int:
        """Clean up expired push subscriptions"""
        try:
            # Remove subscriptions older than 30 days that are inactive
            cutoff_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
            
            response = supabase.table('push_subscriptions').delete().eq(
                'is_active', False
            ).lt('updated_at', cutoff_date).execute()
            
            count = len(response.data) if response.data else 0
            logger.info(f"Cleaned up {count} expired push subscriptions")
            
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired subscriptions: {str(e)}")
            return 0

# Global instance
notification_service = NotificationService()

