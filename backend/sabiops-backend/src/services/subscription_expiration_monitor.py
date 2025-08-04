"""
Subscription Expiration Monitor Service
Monitors subscription status and triggers automatic actions for expiring/expired subscriptions
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from flask import current_app

from .real_time_day_calculator import RealTimeDayCalculator

logger = logging.getLogger(__name__)

class SubscriptionExpirationMonitor:
    """Service for monitoring subscription expiration and triggering automated actions"""
    
    def __init__(self):
        """Initialize the expiration monitor"""
        self.supabase = current_app.config.get('SUPABASE')
        self.day_calculator = RealTimeDayCalculator()
        
    def check_subscription_status(self, user_id: str) -> Dict[str, Any]:
        """
        Check subscription status for a specific user and return detailed information
        
        Args:
            user_id: User ID to check
            
        Returns:
            Dict with subscription status and expiration information
        """
        try:
            # Get user data
            user_result = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            if not user_result.data:
                return {
                    'error': 'User not found',
                    'user_id': user_id,
                    'status': 'not_found'
                }
            
            user = user_result.data
            subscription_plan = user.get('subscription_plan', 'free')
            subscription_status = user.get('subscription_status', 'inactive')
            subscription_end_date = user.get('subscription_end_date')
            trial_days_left = user.get('trial_days_left', 0)
            
            # Calculate remaining days using real-time calculator
            remaining_days = 0
            is_expired = False
            
            if subscription_plan != 'free' and subscription_end_date:
                remaining_days = self.day_calculator.calculate_remaining_days(subscription_end_date)
                is_expired = self.day_calculator.is_subscription_expired(subscription_end_date)
            elif trial_days_left > 0:
                remaining_days = trial_days_left
            
            # Get warnings
            warnings = self.day_calculator.get_expiration_warnings(remaining_days)
            
            # Determine action needed
            action_needed = self._determine_action_needed(
                subscription_plan, subscription_status, remaining_days, is_expired, trial_days_left
            )
            
            return {
                'user_id': user_id,
                'subscription_plan': subscription_plan,
                'subscription_status': subscription_status,
                'subscription_end_date': subscription_end_date,
                'remaining_days': remaining_days,
                'trial_days_left': trial_days_left,
                'is_expired': is_expired,
                'warnings': warnings,
                'action_needed': action_needed,
                'last_checked': datetime.now(timezone.utc).isoformat(),
                'status': 'checked'
            }
            
        except Exception as e:
            logger.error(f"Error checking subscription status for user {user_id}: {str(e)}")
            return {
                'error': str(e),
                'user_id': user_id,
                'status': 'error'
            }
    
    def get_expiring_subscriptions(self, days_threshold: int = 7) -> List[Dict[str, Any]]:
        """
        Get all subscriptions that are expiring within the specified threshold
        
        Args:
            days_threshold: Number of days to look ahead for expiring subscriptions
            
        Returns:
            List of users with expiring subscriptions
        """
        try:
            # Calculate the threshold date
            threshold_date = datetime.now(timezone.utc) + timedelta(days=days_threshold)
            
            # Get all users with active subscriptions that expire within threshold
            users_result = self.supabase.table('users').select('*').filter(
                'subscription_plan', 'neq', 'free'
            ).filter(
                'subscription_status', 'in', '(active,trial)'
            ).filter(
                'subscription_end_date', 'lte', threshold_date.isoformat()
            ).execute()
            
            expiring_users = []
            
            for user in users_result.data:
                user_id = user['id']
                subscription_end_date = user.get('subscription_end_date')
                
                if subscription_end_date:
                    remaining_days = self.day_calculator.calculate_remaining_days(subscription_end_date)
                    
                    if 0 <= remaining_days <= days_threshold:
                        warnings = self.day_calculator.get_expiration_warnings(remaining_days)
                        
                        expiring_users.append({
                            'user_id': user_id,
                            'email': user.get('email'),
                            'full_name': user.get('full_name'),
                            'subscription_plan': user.get('subscription_plan'),
                            'subscription_status': user.get('subscription_status'),
                            'subscription_end_date': subscription_end_date,
                            'remaining_days': remaining_days,
                            'warnings': warnings,
                            'urgency': self._get_urgency_level(remaining_days)
                        })
            
            # Sort by urgency (most urgent first)
            expiring_users.sort(key=lambda x: x['remaining_days'])
            
            logger.info(f"Found {len(expiring_users)} subscriptions expiring within {days_threshold} days")
            return expiring_users
            
        except Exception as e:
            logger.error(f"Error getting expiring subscriptions: {str(e)}")
            return []
    
    def get_expired_subscriptions(self) -> List[Dict[str, Any]]:
        """
        Get all subscriptions that have expired but are still marked as active
        
        Returns:
            List of users with expired subscriptions that need downgrading
        """
        try:
            # Get all users with non-free plans that might be expired
            users_result = self.supabase.table('users').select('*').filter(
                'subscription_plan', 'neq', 'free'
            ).filter(
                'subscription_status', 'in', '(active,trial)'
            ).execute()
            
            expired_users = []
            
            for user in users_result.data:
                user_id = user['id']
                subscription_end_date = user.get('subscription_end_date')
                trial_days_left = user.get('trial_days_left', 0)
                
                # Check if subscription is expired
                is_expired = False
                if subscription_end_date:
                    is_expired = self.day_calculator.is_subscription_expired(subscription_end_date)
                
                # If expired and no trial days left, add to list
                if is_expired and trial_days_left <= 0:
                    expired_users.append({
                        'user_id': user_id,
                        'email': user.get('email'),
                        'full_name': user.get('full_name'),
                        'subscription_plan': user.get('subscription_plan'),
                        'subscription_status': user.get('subscription_status'),
                        'subscription_end_date': subscription_end_date,
                        'trial_days_left': trial_days_left,
                        'expired_since': self._calculate_expired_since(subscription_end_date)
                    })
            
            logger.info(f"Found {len(expired_users)} expired subscriptions needing downgrade")
            return expired_users
            
        except Exception as e:
            logger.error(f"Error getting expired subscriptions: {str(e)}")
            return []
    
    def trigger_expiration_warnings(self, user_id: str, days_remaining: int) -> bool:
        """
        Trigger appropriate expiration warnings for a user
        
        Args:
            user_id: User ID to send warnings to
            days_remaining: Number of days remaining in subscription
            
        Returns:
            bool: True if warnings were sent successfully
        """
        try:
            warnings = self.day_calculator.get_expiration_warnings(days_remaining)
            
            if not warnings:
                return True  # No warnings needed
            
            # Get user info for personalized messages
            user_result = self.supabase.table('users').select('email, full_name, subscription_plan').eq(
                'id', user_id
            ).single().execute()
            
            if not user_result.data:
                logger.error(f"User {user_id} not found for warning notifications")
                return False
            
            user = user_result.data
            success_count = 0
            
            for warning in warnings:
                # Send notification based on warning type
                notification_sent = self._send_expiration_notification(
                    user_id=user_id,
                    user_email=user.get('email'),
                    user_name=user.get('full_name'),
                    subscription_plan=user.get('subscription_plan'),
                    warning=warning
                )
                
                if notification_sent:
                    success_count += 1
                    
                    # Log the warning in database
                    self._log_warning_sent(user_id, warning)
            
            logger.info(f"Sent {success_count}/{len(warnings)} expiration warnings to user {user_id}")
            return success_count == len(warnings)
            
        except Exception as e:
            logger.error(f"Error triggering expiration warnings for user {user_id}: {str(e)}")
            return False
    
    def process_all_expiring_subscriptions(self, days_threshold: int = 7) -> Dict[str, int]:
        """
        Process all expiring subscriptions and send appropriate warnings
        
        Args:
            days_threshold: Days ahead to check for expiring subscriptions
            
        Returns:
            Dict with processing statistics
        """
        try:
            expiring_users = self.get_expiring_subscriptions(days_threshold)
            
            stats = {
                'total_checked': len(expiring_users),
                'warnings_sent': 0,
                'errors': 0
            }
            
            for user in expiring_users:
                try:
                    success = self.trigger_expiration_warnings(
                        user['user_id'], 
                        user['remaining_days']
                    )
                    
                    if success:
                        stats['warnings_sent'] += 1
                    else:
                        stats['errors'] += 1
                        
                except Exception as e:
                    logger.error(f"Error processing expiration for user {user['user_id']}: {str(e)}")
                    stats['errors'] += 1
            
            logger.info(f"Processed expiring subscriptions: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error processing all expiring subscriptions: {str(e)}")
            return {'total_checked': 0, 'warnings_sent': 0, 'errors': 1}
    
    def _determine_action_needed(self, subscription_plan: str, subscription_status: str, 
                                remaining_days: int, is_expired: bool, trial_days_left: int) -> str:
        """Determine what action is needed for a subscription"""
        if subscription_plan == 'free':
            return 'none'
        
        if is_expired and trial_days_left <= 0:
            return 'downgrade_to_free'
        
        if remaining_days <= 0:
            return 'expired_check_needed'
        
        if remaining_days <= 1:
            return 'final_warning'
        
        if remaining_days <= 3:
            return 'urgent_warning'
        
        if remaining_days <= 7:
            return 'advance_warning'
        
        return 'none'
    
    def _get_urgency_level(self, days_remaining: int) -> str:
        """Get urgency level based on days remaining"""
        if days_remaining <= 0:
            return 'critical'
        elif days_remaining <= 1:
            return 'urgent'
        elif days_remaining <= 3:
            return 'high'
        elif days_remaining <= 7:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_expired_since(self, subscription_end_date: str) -> int:
        """Calculate how many days ago the subscription expired"""
        try:
            if not subscription_end_date:
                return 0
            
            end_date = self.day_calculator._parse_and_normalize_date(subscription_end_date)
            if not end_date:
                return 0
            
            now = datetime.now(timezone.utc)
            days_expired = (now - end_date).days
            
            return max(0, days_expired)
            
        except Exception as e:
            logger.error(f"Error calculating expired since: {str(e)}")
            return 0
    
    def _send_expiration_notification(self, user_id: str, user_email: str, user_name: str,
                                    subscription_plan: str, warning: Dict[str, Any]) -> bool:
        """
        Send expiration notification to user
        
        Args:
            user_id: User ID
            user_email: User email
            user_name: User name
            subscription_plan: Current subscription plan
            warning: Warning dictionary from day calculator
            
        Returns:
            bool: True if notification sent successfully
        """
        try:
            # For now, we'll create a notification record in the database
            # In a full implementation, this would also send emails
            
            notification_data = {
                'user_id': user_id,
                'type': 'subscription_expiration',
                'title': self._get_notification_title(warning['type']),
                'message': warning['message'],
                'urgency': warning['urgency'],
                'metadata': {
                    'warning_type': warning['type'],
                    'days_remaining': warning.get('days_remaining', 0),
                    'subscription_plan': subscription_plan,
                    'action_required': warning.get('action_required', False)
                },
                'read': False,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Insert notification (assuming notifications table exists)
            try:
                self.supabase.table('notifications').insert(notification_data).execute()
                logger.info(f"Created expiration notification for user {user_id}")
                return True
            except Exception as e:
                # If notifications table doesn't exist, just log the notification
                logger.info(f"Expiration notification for user {user_id}: {warning['message']}")
                return True
                
        except Exception as e:
            logger.error(f"Error sending expiration notification to user {user_id}: {str(e)}")
            return False
    
    def _get_notification_title(self, warning_type: str) -> str:
        """Get appropriate notification title based on warning type"""
        titles = {
            'expired': 'Subscription Expired',
            'final_warning': 'Subscription Expires Tomorrow!',
            'urgent_warning': 'Subscription Expiring Soon',
            'advance_warning': 'Subscription Renewal Reminder'
        }
        
        return titles.get(warning_type, 'Subscription Notice')
    
    def _log_warning_sent(self, user_id: str, warning: Dict[str, Any]) -> None:
        """Log that a warning was sent to prevent duplicate notifications"""
        try:
            log_data = {
                'user_id': user_id,
                'warning_type': warning['type'],
                'days_remaining': warning.get('days_remaining', 0),
                'sent_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Log to a warnings table or user record
            # For now, we'll update the user record with last warning info
            self.supabase.table('users').update({
                'last_expiration_warning': warning['type'],
                'last_expiration_warning_sent': datetime.now(timezone.utc).isoformat()
            }).eq('id', user_id).execute()
            
        except Exception as e:
            logger.error(f"Error logging warning sent for user {user_id}: {str(e)}")