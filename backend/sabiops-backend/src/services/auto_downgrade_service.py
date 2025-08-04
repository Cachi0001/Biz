"""
Auto-downgrade Service
Handles automatic downgrading of expired subscriptions to free plan
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from flask import current_app

from .real_time_day_calculator import RealTimeDayCalculator
from .subscription_expiration_monitor import SubscriptionExpirationMonitor

logger = logging.getLogger(__name__)

class AutoDowngradeService:
    """Service for automatically downgrading expired subscriptions"""
    
    def __init__(self):
        """Initialize the auto-downgrade service"""
        self.supabase = current_app.config.get('SUPABASE')
        self.day_calculator = RealTimeDayCalculator()
        self.expiration_monitor = SubscriptionExpirationMonitor()
        
        # Free plan configuration
        self.FREE_PLAN_LIMITS = {
            'invoices': 5,
            'expenses': 20,
            'products': 20,
            'sales': 50
        }
    
    def process_expired_subscriptions(self) -> Dict[str, int]:
        """
        Process all expired subscriptions and downgrade them to free plan
        
        Returns:
            Dict with processing statistics
        """
        try:
            logger.info("Starting expired subscription processing...")
            
            # Get all expired subscriptions
            expired_users = self.expiration_monitor.get_expired_subscriptions()
            
            stats = {
                'total_found': len(expired_users),
                'successfully_downgraded': 0,
                'errors': 0,
                'already_free': 0,
                'usage_reset': 0
            }
            
            for user in expired_users:
                try:
                    user_id = user['user_id']
                    current_plan = user['subscription_plan']
                    
                    # Skip if already on free plan
                    if current_plan == 'free':
                        stats['already_free'] += 1
                        continue
                    
                    # Downgrade the user
                    downgrade_result = self.downgrade_user_to_free(user_id)
                    
                    if downgrade_result['success']:
                        stats['successfully_downgraded'] += 1
                        
                        # Reset usage limits
                        if self.reset_usage_limits_to_free(user_id):
                            stats['usage_reset'] += 1
                        
                        # Log the downgrade action
                        self.log_downgrade_action(
                            user_id, 
                            f"Automatic downgrade from {current_plan} due to expiration"
                        )
                        
                        logger.info(f"Successfully downgraded user {user_id} from {current_plan} to free")
                        
                    else:
                        stats['errors'] += 1
                        logger.error(f"Failed to downgrade user {user_id}: {downgrade_result.get('error')}")
                        
                except Exception as e:
                    stats['errors'] += 1
                    logger.error(f"Error processing expired subscription for user {user.get('user_id')}: {str(e)}")
            
            logger.info(f"Expired subscription processing completed: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error in process_expired_subscriptions: {str(e)}")
            return {
                'total_found': 0,
                'successfully_downgraded': 0,
                'errors': 1,
                'already_free': 0,
                'usage_reset': 0
            }
    
    def downgrade_user_to_free(self, user_id: str) -> Dict[str, Any]:
        """
        Downgrade a specific user to free plan
        
        Args:
            user_id: User ID to downgrade
            
        Returns:
            Dict with downgrade result
        """
        try:
            # Get current user data
            user_result = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            if not user_result.data:
                return {
                    'success': False,
                    'error': 'User not found',
                    'user_id': user_id
                }
            
            user = user_result.data
            current_plan = user.get('subscription_plan', 'free')
            current_status = user.get('subscription_status', 'inactive')
            
            # Check if already on free plan
            if current_plan == 'free':
                return {
                    'success': True,
                    'message': 'User already on free plan',
                    'user_id': user_id,
                    'previous_plan': current_plan
                }
            
            # Verify subscription is actually expired
            subscription_end_date = user.get('subscription_end_date')
            trial_days_left = user.get('trial_days_left', 0)
            
            if subscription_end_date:
                is_expired = self.day_calculator.is_subscription_expired(subscription_end_date)
                if not is_expired and trial_days_left > 0:
                    return {
                        'success': False,
                        'error': 'Subscription is not expired yet',
                        'user_id': user_id,
                        'remaining_days': self.day_calculator.calculate_remaining_days(subscription_end_date)
                    }
            
            # Prepare downgrade data
            current_time = datetime.now(timezone.utc)
            downgrade_data = {
                'subscription_plan': 'free',
                'subscription_status': 'inactive',
                'subscription_end_date': None,
                'trial_days_left': 0,
                'trial_ends_at': None,
                'auto_downgrade_date': current_time.isoformat(),
                'updated_at': current_time.isoformat()
            }
            
            # Execute the downgrade
            update_result = self.supabase.table('users').update(downgrade_data).eq('id', user_id).execute()
            
            if not update_result.data:
                return {
                    'success': False,
                    'error': 'Failed to update user record',
                    'user_id': user_id
                }
            
            logger.info(f"Successfully downgraded user {user_id} from {current_plan} to free")
            
            return {
                'success': True,
                'message': f'Successfully downgraded from {current_plan} to free plan',
                'user_id': user_id,
                'previous_plan': current_plan,
                'previous_status': current_status,
                'downgrade_date': current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error downgrading user {user_id} to free: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'user_id': user_id
            }
    
    def reset_usage_limits_to_free(self, user_id: str) -> bool:
        """
        Reset usage limits to free plan limits
        
        Args:
            user_id: User ID to reset limits for
            
        Returns:
            bool: True if reset was successful
        """
        try:
            current_time = datetime.now(timezone.utc)
            current_period_start = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            current_period_end = (current_period_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            # Get business owner ID (in case this is a team member)
            business_owner_id = self._get_business_owner_id(user_id)
            
            # Reset each feature type to free plan limits
            reset_count = 0
            for feature_type, limit in self.FREE_PLAN_LIMITS.items():
                try:
                    # Update or insert feature usage record with free plan limits
                    upsert_data = {
                        'user_id': business_owner_id,
                        'feature_type': feature_type,
                        'limit_count': limit,
                        'period_start': current_period_start.isoformat(),
                        'period_end': current_period_end.isoformat(),
                        'updated_at': current_time.isoformat(),
                        'sync_status': 'synced',
                        'last_synced_at': current_time.isoformat()
                    }
                    
                    # Check if record exists
                    existing_result = self.supabase.table('feature_usage').select('*').eq(
                        'user_id', business_owner_id
                    ).eq('feature_type', feature_type).eq(
                        'period_start', current_period_start.isoformat()
                    ).execute()
                    
                    if existing_result.data:
                        # Update existing record
                        self.supabase.table('feature_usage').update(upsert_data).eq(
                            'user_id', business_owner_id
                        ).eq('feature_type', feature_type).eq(
                            'period_start', current_period_start.isoformat()
                        ).execute()
                    else:
                        # Insert new record
                        upsert_data['current_count'] = 0  # Start fresh for new period
                        self.supabase.table('feature_usage').insert(upsert_data).execute()
                    
                    reset_count += 1
                    
                except Exception as e:
                    logger.error(f"Error resetting {feature_type} usage for user {user_id}: {str(e)}")
            
            # Also update user table counters for backward compatibility
            try:
                self.supabase.table('users').update({
                    'current_month_invoices': 0,
                    'current_month_expenses': 0,
                    'usage_reset_date': current_time.date().isoformat(),
                    'updated_at': current_time.isoformat()
                }).eq('id', business_owner_id).execute()
            except Exception as e:
                logger.warning(f"Could not update user table counters for {user_id}: {str(e)}")
            
            logger.info(f"Reset {reset_count}/{len(self.FREE_PLAN_LIMITS)} usage limits for user {user_id}")
            return reset_count == len(self.FREE_PLAN_LIMITS)
            
        except Exception as e:
            logger.error(f"Error resetting usage limits for user {user_id}: {str(e)}")
            return False
    
    def log_downgrade_action(self, user_id: str, reason: str) -> None:
        """
        Log downgrade action for audit purposes
        
        Args:
            user_id: User ID that was downgraded
            reason: Reason for the downgrade
        """
        try:
            log_data = {
                'user_id': user_id,
                'action': 'auto_downgrade',
                'old_plan': 'paid',  # We don't have the exact old plan here
                'new_plan': 'free',
                'old_status': 'expired',
                'new_status': 'inactive',
                'reason': reason,
                'metadata': {
                    'automated': True,
                    'service': 'auto_downgrade_service',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                },
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Try to insert into subscription_audit_log table
            try:
                self.supabase.table('subscription_audit_log').insert(log_data).execute()
                logger.info(f"Logged downgrade action for user {user_id}")
            except Exception as e:
                # If audit table doesn't exist, log to application logs
                logger.info(f"Downgrade audit log for user {user_id}: {reason}")
                
        except Exception as e:
            logger.error(f"Error logging downgrade action for user {user_id}: {str(e)}")
    
    def get_downgrade_candidates(self) -> List[Dict[str, Any]]:
        """
        Get list of users who are candidates for downgrade
        
        Returns:
            List of users who should be downgraded
        """
        try:
            # Use the expiration monitor to get expired subscriptions
            expired_users = self.expiration_monitor.get_expired_subscriptions()
            
            candidates = []
            for user in expired_users:
                # Add additional checks if needed
                candidates.append({
                    'user_id': user['user_id'],
                    'email': user.get('email'),
                    'full_name': user.get('full_name'),
                    'current_plan': user['subscription_plan'],
                    'expired_since': user.get('expired_since', 0),
                    'reason': 'subscription_expired'
                })
            
            return candidates
            
        except Exception as e:
            logger.error(f"Error getting downgrade candidates: {str(e)}")
            return []
    
    def force_downgrade_user(self, user_id: str, reason: str = "Manual downgrade") -> Dict[str, Any]:
        """
        Force downgrade a user regardless of expiration status (for admin use)
        
        Args:
            user_id: User ID to downgrade
            reason: Reason for the forced downgrade
            
        Returns:
            Dict with downgrade result
        """
        try:
            # Get current user data
            user_result = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            if not user_result.data:
                return {
                    'success': False,
                    'error': 'User not found',
                    'user_id': user_id
                }
            
            user = user_result.data
            current_plan = user.get('subscription_plan', 'free')
            
            if current_plan == 'free':
                return {
                    'success': True,
                    'message': 'User already on free plan',
                    'user_id': user_id
                }
            
            # Force downgrade
            current_time = datetime.now(timezone.utc)
            downgrade_data = {
                'subscription_plan': 'free',
                'subscription_status': 'inactive',
                'subscription_end_date': None,
                'trial_days_left': 0,
                'trial_ends_at': None,
                'auto_downgrade_date': current_time.isoformat(),
                'updated_at': current_time.isoformat()
            }
            
            # Execute the downgrade
            update_result = self.supabase.table('users').update(downgrade_data).eq('id', user_id).execute()
            
            if update_result.data:
                # Reset usage limits
                self.reset_usage_limits_to_free(user_id)
                
                # Log the action
                self.log_downgrade_action(user_id, f"Force downgrade: {reason}")
                
                logger.info(f"Force downgraded user {user_id} from {current_plan} to free")
                
                return {
                    'success': True,
                    'message': f'Force downgraded from {current_plan} to free plan',
                    'user_id': user_id,
                    'previous_plan': current_plan,
                    'reason': reason
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to update user record',
                    'user_id': user_id
                }
                
        except Exception as e:
            logger.error(f"Error force downgrading user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'user_id': user_id
            }
    
    def _get_business_owner_id(self, user_id: str) -> str:
        """Get the business owner ID for a user (returns user_id if they are the owner)"""
        try:
            user_result = self.supabase.table('users').select('owner_id, role').eq('id', user_id).single().execute()
            
            if not user_result.data:
                return user_id
            
            # If user has owner_id, they are a team member - return the owner's ID
            if user_result.data.get('owner_id'):
                return user_result.data['owner_id']
            
            # If user has no owner_id, they are the owner themselves
            return user_id
            
        except Exception as e:
            logger.error(f"Error getting business owner ID for user {user_id}: {str(e)}")
            return user_id