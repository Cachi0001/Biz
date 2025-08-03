"""
Consolidated Notification Service
Handles both in-app notifications and Firebase push notifications
"""

import logging
import uuid
from datetime import datetime, timezone, time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from .firebase_service import send_push_notification, firebase_initialized

logger = logging.getLogger(__name__)

class NotificationType(Enum):
    LOW_STOCK_ALERT = "low_stock_alert"
    OVERDUE_INVOICE = "overdue_invoice"
    USAGE_LIMIT_WARNING = "usage_limit_warning"
    SUBSCRIPTION_EXPIRY = "subscription_expiry"
    PROFIT_ALERT = "profit_alert"
    PAYMENT_RECEIVED = "payment_received"
    SYSTEM_UPDATE = "system_update"
    INVOICE_CREATED = "invoice_created"
    SALE_COMPLETED = "sale_completed"
    TEAM_ACTIVITY = "team_activity"

@dataclass
class NotificationData:
    """Data structure for notification content"""
    title: str
    message: str
    type: NotificationType
    data: Dict[str, Any] = None
    navigation_url: str = None
    action_required: bool = False
    priority: str = "medium"  # low, medium, high, urgent

@dataclass
class UserPreferences:
    """User notification preferences"""
    enabled: bool = True
    push_enabled: bool = True
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None

class NotificationService:
    """Consolidated service for managing all notifications"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.firebase_available = firebase_initialized
        
    async def create_notification(
        self, 
        user_id: str, 
        notification_data: NotificationData
    ) -> Tuple[bool, Optional[str]]:
        """
        Create a notification and optionally send push notification
        
        Returns:
            Tuple[bool, Optional[str]]: (success, notification_id)
        """
        try:
            # Create notification record in database
            notification_record = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'title': notification_data.title,
                'message': notification_data.message,
                'type': notification_data.type.value,
                'data': notification_data.data or {},
                'read': False,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'navigation_url': notification_data.navigation_url,
                'action_required': notification_data.action_required
            }
            
            # Insert notification into database
            result = self.supabase.table('notifications').insert(notification_record).execute()
            
            if not result.data:
                logger.error(f"Failed to create notification in database for user {user_id}")
                return False, None
            
            notification_id = result.data[0]['id']
            logger.info(f"Created notification {notification_id} for user {user_id}")
            
            # Check user preferences and send push notification if appropriate
            should_send_push = await self._should_send_push_notification(
                user_id, 
                notification_data.type
            )
            
            if should_send_push:
                push_success = await self._send_push_notification(user_id, notification_data)
                if push_success:
                    logger.info(f"Push notification sent for notification {notification_id}")
                else:
                    logger.warning(f"Push notification failed for notification {notification_id}")
            else:
                logger.info(f"Push notification skipped for notification {notification_id} (user preferences)")
            
            return True, notification_id
            
        except Exception as e:
            logger.error(f"Error creating notification for user {user_id}: {str(e)}")
            return False, None
    
    async def _should_send_push_notification(
        self, 
        user_id: str, 
        notification_type: NotificationType
    ) -> bool:
        """Check if push notification should be sent based on user preferences"""
        try:
            # Get user preferences
            preferences = await self._get_user_preferences(user_id, notification_type.value)
            
            if not preferences:
                # Default to enabled if no preferences found
                return True
            
            # Check if notification type is enabled
            if not preferences.enabled:
                return False
            
            # Check if push notifications are enabled for this type
            if not preferences.push_enabled:
                return False
            
            # Check quiet hours
            if preferences.quiet_hours_start and preferences.quiet_hours_end:
                current_time = datetime.now().time()
                
                if preferences.quiet_hours_start <= preferences.quiet_hours_end:
                    # Normal case: 22:00 to 08:00
                    if preferences.quiet_hours_start <= current_time <= preferences.quiet_hours_end:
                        return False
                else:
                    # Spans midnight: 22:00 to 08:00 next day
                    if current_time >= preferences.quiet_hours_start or current_time <= preferences.quiet_hours_end:
                        return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking push notification preferences for user {user_id}: {str(e)}")
            # Default to enabled on error
            return True
    
    async def _get_user_preferences(
        self, 
        user_id: str, 
        notification_type: str
    ) -> Optional[UserPreferences]:
        """Get user preferences for a specific notification type"""
        try:
            result = self.supabase.table('user_notification_preferences').select('*').eq(
                'user_id', user_id
            ).eq('notification_type', notification_type).execute()
            
            if result.data:
                pref_data = result.data[0]
                return UserPreferences(
                    enabled=pref_data.get('enabled', True),
                    push_enabled=pref_data.get('push_enabled', True),
                    quiet_hours_start=pref_data.get('quiet_hours_start'),
                    quiet_hours_end=pref_data.get('quiet_hours_end')
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user preferences for {user_id}: {str(e)}")
            return None
    
    async def _send_push_notification(
        self, 
        user_id: str, 
        notification_data: NotificationData
    ) -> bool:
        """Send push notification to user's active devices"""
        if not self.firebase_available:
            logger.warning("Firebase not available, skipping push notification")
            return False
        
        try:
            # Get user's active FCM tokens
            active_tokens = await self._get_user_active_tokens(user_id)
            
            if not active_tokens:
                logger.info(f"No active FCM tokens found for user {user_id}")
                return False
            
            # Send push notification to each active token
            success_count = 0
            for token_data in active_tokens:
                token = token_data.get('fcm_token') or token_data.get('token')
                if not token:
                    continue
                
                try:
                    # Prepare push notification data
                    push_data = {
                        'type': notification_data.type.value,
                        'navigation_url': notification_data.navigation_url or '',
                        'action_required': str(notification_data.action_required).lower(),
                        'priority': notification_data.priority
                    }
                    
                    if notification_data.data:
                        push_data.update(notification_data.data)
                    
                    # Send push notification
                    response = send_push_notification(
                        token=token,
                        title=notification_data.title,
                        body=notification_data.message,
                        data=push_data
                    )
                    
                    if response:
                        success_count += 1
                        # Update last_used_at for successful token
                        await self._update_token_last_used(token_data['id'])
                    else:
                        logger.warning(f"Failed to send push notification to token {token[:10]}...")
                        # Mark token as potentially invalid
                        await self._handle_failed_token(token_data['id'])
                        
                except Exception as e:
                    logger.error(f"Error sending push to token {token[:10] if token else 'unknown'}: {str(e)}")
                    await self._handle_failed_token(token_data['id'])
            
            logger.info(f"Push notifications sent to {success_count}/{len(active_tokens)} devices for user {user_id}")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error sending push notifications to user {user_id}: {str(e)}")
            return False
    
    async def _get_user_active_tokens(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's active FCM tokens"""
        try:
            result = self.supabase.table('push_subscriptions').select('*').eq(
                'user_id', user_id
            ).eq('active', True).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting active tokens for user {user_id}: {str(e)}")
            return []
    
    async def _update_token_last_used(self, token_id: str) -> None:
        """Update last_used_at timestamp for successful token"""
        try:
            self.supabase.table('push_subscriptions').update({
                'last_used_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', token_id).execute()
            
        except Exception as e:
            logger.error(f"Error updating token last_used for {token_id}: {str(e)}")
    
    async def _handle_failed_token(self, token_id: str) -> None:
        """Handle failed token delivery (mark for cleanup)"""
        try:
            # For now, just log the failure
            # In a production system, you might want to track failure counts
            # and deactivate tokens after multiple failures
            logger.warning(f"Token {token_id} failed delivery - marked for review")
            
        except Exception as e:
            logger.error(f"Error handling failed token {token_id}: {str(e)}")
    
    # Convenience methods for specific notification types
    
    async def send_low_stock_alert(
        self, 
        user_id: str, 
        product_name: str, 
        current_quantity: int, 
        threshold: int,
        product_id: str = None
    ) -> Tuple[bool, Optional[str]]:
        """Send low stock alert notification"""
        notification_data = NotificationData(
            title="Low Stock Alert!",
            message=f"Product '{product_name}' is running low (Qty: {current_quantity}). Restock soon!",
            type=NotificationType.LOW_STOCK_ALERT,
            data={
                'product_name': product_name,
                'current_quantity': current_quantity,
                'threshold': threshold,
                'product_id': product_id
            },
            navigation_url=f"/inventory/products/{product_id}" if product_id else "/inventory",
            action_required=True,
            priority="high" if current_quantity <= 1 else "medium"
        )
        
        return await self.create_notification(user_id, notification_data)
    
    async def send_overdue_invoice_alert(
        self, 
        user_id: str, 
        customer_name: str, 
        invoice_number: str, 
        amount: float,
        days_overdue: int,
        invoice_id: str = None
    ) -> Tuple[bool, Optional[str]]:
        """Send overdue invoice alert notification"""
        priority = "urgent" if days_overdue >= 30 else "high" if days_overdue >= 7 else "medium"
        
        notification_data = NotificationData(
            title="Overdue Invoice Alert!",
            message=f"Invoice {invoice_number} from {customer_name} is {days_overdue} days overdue (₦{amount:,.2f})",
            type=NotificationType.OVERDUE_INVOICE,
            data={
                'customer_name': customer_name,
                'invoice_number': invoice_number,
                'amount': amount,
                'days_overdue': days_overdue,
                'invoice_id': invoice_id
            },
            navigation_url=f"/invoices/{invoice_id}" if invoice_id else "/invoices",
            action_required=True,
            priority=priority
        )
        
        return await self.create_notification(user_id, notification_data)
    
    async def send_usage_limit_warning(
        self, 
        user_id: str, 
        feature_type: str, 
        current_usage: int, 
        limit: int,
        percentage: float
    ) -> Tuple[bool, Optional[str]]:
        """Send usage limit warning notification"""
        priority = "urgent" if percentage >= 100 else "high" if percentage >= 95 else "medium"
        
        notification_data = NotificationData(
            title="Usage Limit Warning!",
            message=f"You've used {percentage:.0f}% of your {feature_type} limit ({current_usage}/{limit})",
            type=NotificationType.USAGE_LIMIT_WARNING,
            data={
                'feature_type': feature_type,
                'current_usage': current_usage,
                'limit': limit,
                'percentage': percentage
            },
            navigation_url="/subscription/usage",
            action_required=percentage >= 95,
            priority=priority
        )
        
        return await self.create_notification(user_id, notification_data)
    
    async def send_subscription_expiry_warning(
        self, 
        user_id: str, 
        days_remaining: int,
        plan_name: str = None
    ) -> Tuple[bool, Optional[str]]:
        """Send subscription expiry warning notification"""
        priority = "urgent" if days_remaining <= 1 else "high" if days_remaining <= 3 else "medium"
        
        if days_remaining <= 0:
            title = "Subscription Expired!"
            message = f"Your {plan_name or 'subscription'} has expired. Renew now to continue using all features."
        else:
            title = "Subscription Expiring Soon!"
            message = f"Your {plan_name or 'subscription'} expires in {days_remaining} day{'s' if days_remaining != 1 else ''}. Renew now!"
        
        notification_data = NotificationData(
            title=title,
            message=message,
            type=NotificationType.SUBSCRIPTION_EXPIRY,
            data={
                'days_remaining': days_remaining,
                'plan_name': plan_name
            },
            navigation_url="/subscription/billing",
            action_required=True,
            priority=priority
        )
        
        return await self.create_notification(user_id, notification_data)
    
    async def send_profit_alert(
        self, 
        user_id: str, 
        current_profit: float, 
        breakeven_threshold: float,
        period: str = "daily"
    ) -> Tuple[bool, Optional[str]]:
        """Send profit alert notification"""
        notification_data = NotificationData(
            title="Profit Alert!",
            message=f"Your {period} profit (₦{current_profit:,.2f}) is below your breakeven threshold (₦{breakeven_threshold:,.2f})",
            type=NotificationType.PROFIT_ALERT,
            data={
                'current_profit': current_profit,
                'breakeven_threshold': breakeven_threshold,
                'period': period
            },
            navigation_url="/analytics/profit",
            action_required=True,
            priority="high"
        )
        
        return await self.create_notification(user_id, notification_data)
    
    # Utility methods
    
    async def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read"""
        try:
            result = self.supabase.table('notifications').update({
                'read': True,
                'read_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', notification_id).eq('user_id', user_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error marking notification {notification_id} as read: {str(e)}")
            return False
    
    async def mark_all_notifications_read(self, user_id: str) -> bool:
        """Mark all notifications as read for a user"""
        try:
            result = self.supabase.table('notifications').update({
                'read': True,
                'read_at': datetime.now(timezone.utc).isoformat()
            }).eq('user_id', user_id).eq('read', False).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read for user {user_id}: {str(e)}")
            return False
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user"""
        try:
            query = self.supabase.table('notifications').select('*').eq('user_id', user_id)
            
            if unread_only:
                query = query.eq('read', False)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting notifications for user {user_id}: {str(e)}")
            return []
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        try:
            result = self.supabase.table('notifications').select('id').eq(
                'user_id', user_id
            ).eq('read', False).execute()
            
            return len(result.data) if result.data else 0
            
        except Exception as e:
            logger.error(f"Error getting unread count for user {user_id}: {str(e)}")
            return 0
    
    async def cleanup_old_notifications(self, days_old: int = 30) -> int:
        """Clean up notifications older than specified days"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
            
            result = self.supabase.table('notifications').delete().lt(
                'created_at', cutoff_date.isoformat()
            ).execute()
            
            count = len(result.data) if result.data else 0
            logger.info(f"Cleaned up {count} old notifications")
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up old notifications: {str(e)}")
            return 0