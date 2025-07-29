"""
Usage Tracking Service
Handles real-time usage tracking, limit enforcement, and team member inheritance
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, Any, List
import logging
from flask import current_app

logger = logging.getLogger(__name__)

class UsageService:
    """Service for tracking and enforcing subscription usage limits"""
    
    FEATURE_TYPES = ['invoices', 'expenses', 'sales', 'products']
    
    def __init__(self):
        self.supabase = current_app.config.get('SUPABASE')
    
    def check_usage_limit(self, user_id: str, feature_type: str) -> Dict[str, Any]:
        """Check if user has reached their usage limit for a feature"""
        try:
            if feature_type not in self.FEATURE_TYPES:
                raise ValueError(f"Invalid feature type: {feature_type}")
            
            # Get effective user ID (for team members, use business owner)
            effective_user_id = self._get_effective_user_id(user_id)
            
            # Get current usage
            usage_data = self._get_current_usage(effective_user_id, feature_type)
            
            if not usage_data:
                # No usage record exists, create one
                usage_data = self._initialize_usage_record(effective_user_id, feature_type)
            
            current_count = usage_data['current_count']
            limit_count = usage_data['limit_count']
            
            # Calculate usage percentage
            usage_percentage = (current_count / limit_count * 100) if limit_count > 0 else 0
            
            return {
                'user_id': user_id,
                'effective_user_id': effective_user_id,
                'feature_type': feature_type,
                'current_count': current_count,
                'limit_count': limit_count,
                'usage_percentage': round(usage_percentage, 1),
                'limit_reached': current_count >= limit_count,
                'warning_threshold': usage_percentage >= 80,
                'period_start': usage_data['period_start'],
                'period_end': usage_data['period_end']
            }
            
        except Exception as e:
            logger.error(f"Error checking usage limit for user {user_id}, feature {feature_type}: {str(e)}")
            raise
    
    def can_create_feature(self, user_id: str, feature_type: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create a new feature item"""
        try:
            usage_status = self.check_usage_limit(user_id, feature_type)
            
            can_create = not usage_status['limit_reached']
            
            return can_create, usage_status
            
        except Exception as e:
            logger.error(f"Error checking if user {user_id} can create {feature_type}: {str(e)}")
            # In case of error, allow creation but log the issue
            return True, {'error': str(e)}
    
    def increment_usage(self, user_id: str, feature_type: str) -> Dict[str, Any]:
        """Increment usage counter for a feature"""
        try:
            if feature_type not in self.FEATURE_TYPES:
                raise ValueError(f"Invalid feature type: {feature_type}")
            
            # Get effective user ID (for team members, use business owner)
            effective_user_id = self._get_effective_user_id(user_id)
            
            # Try to call the database function first
            try:
                result = self.supabase.rpc('increment_usage_counter', {
                    'p_user_id': effective_user_id,
                    'p_feature_type': feature_type
                }).execute()
                
                if result.data and result.data.get('success'):
                    logger.info(f"Incremented {feature_type} usage for user {user_id} (effective: {effective_user_id})")
                    return self.check_usage_limit(user_id, feature_type)
                else:
                    # Function returned error, fall back to manual increment
                    logger.warning(f"Database function failed, using manual increment: {result.data}")
            except Exception as rpc_error:
                logger.warning(f"Database function not available, using manual increment: {str(rpc_error)}")
            
            # Manual increment fallback
            usage_data = self._get_current_usage(effective_user_id, feature_type)
            
            if not usage_data:
                # Initialize usage record if it doesn't exist
                usage_data = self._initialize_usage_record(effective_user_id, feature_type)
            
            # Check if user has reached limit
            if usage_data['current_count'] >= usage_data['limit_count']:
                raise Exception(f"Usage limit reached for {feature_type}: {usage_data['current_count']}/{usage_data['limit_count']}")
            
            # Increment usage counter manually
            new_count = usage_data['current_count'] + 1
            
            self.supabase.table('feature_usage').update({
                'current_count': new_count,
                'updated_at': datetime.now().isoformat()
            }).eq('id', usage_data['id']).execute()
            
            # Also update user table for backward compatibility
            if feature_type == 'invoices':
                self.supabase.table('users').update({
                    'current_month_invoices': new_count
                }).eq('id', effective_user_id).execute()
            elif feature_type == 'expenses':
                self.supabase.table('users').update({
                    'current_month_expenses': new_count
                }).eq('id', effective_user_id).execute()
            
            logger.info(f"Manually incremented {feature_type} usage for user {user_id} (effective: {effective_user_id})")
            
            # Get updated usage status
            return self.check_usage_limit(user_id, feature_type)
            
        except Exception as e:
            logger.error(f"Error incrementing usage for user {user_id}, feature {feature_type}: {str(e)}")
            raise
    
    def decrement_usage(self, user_id: str, feature_type: str) -> Dict[str, Any]:
        """Decrement usage counter when a feature item is deleted"""
        try:
            if feature_type not in self.FEATURE_TYPES:
                raise ValueError(f"Invalid feature type: {feature_type}")
            
            # Get effective user ID (for team members, use business owner)
            effective_user_id = self._get_effective_user_id(user_id)
            
            # Get current usage
            usage_data = self._get_current_usage(effective_user_id, feature_type)
            
            if not usage_data or usage_data['current_count'] <= 0:
                logger.warning(f"Cannot decrement usage for user {user_id}, feature {feature_type}: no usage to decrement")
                return self.check_usage_limit(user_id, feature_type)
            
            # Update usage count
            new_count = max(0, usage_data['current_count'] - 1)
            
            self.supabase.table('feature_usage').update({
                'current_count': new_count,
                'updated_at': datetime.now().isoformat()
            }).eq('id', usage_data['id']).execute()
            
            # Also update user table for backward compatibility
            if feature_type == 'invoices':
                self.supabase.table('users').update({
                    'current_month_invoices': new_count
                }).eq('id', effective_user_id).execute()
            elif feature_type == 'expenses':
                self.supabase.table('users').update({
                    'current_month_expenses': new_count
                }).eq('id', effective_user_id).execute()
            
            logger.info(f"Decremented {feature_type} usage for user {user_id} (effective: {effective_user_id})")
            
            return self.check_usage_limit(user_id, feature_type)
            
        except Exception as e:
            logger.error(f"Error decrementing usage for user {user_id}, feature {feature_type}: {str(e)}")
            raise
    
    def get_all_usage_status(self, user_id: str) -> Dict[str, Any]:
        """Get usage status for all feature types"""
        try:
            # Get effective user ID (for team members, use business owner)
            effective_user_id = self._get_effective_user_id(user_id)
            
            # Get all usage records for the user
            usage_result = self.supabase.table('feature_usage').select('*').eq(
                'user_id', effective_user_id
            ).execute()
            
            usage_status = {}
            
            for feature_type in self.FEATURE_TYPES:
                try:
                    status = self.check_usage_limit(user_id, feature_type)
                    usage_status[feature_type] = status
                except Exception as e:
                    logger.error(f"Error getting usage status for {feature_type}: {str(e)}")
                    usage_status[feature_type] = {
                        'error': str(e),
                        'current_count': 0,
                        'limit_count': 0,
                        'limit_reached': False
                    }
            
            return {
                'user_id': user_id,
                'effective_user_id': effective_user_id,
                'usage_status': usage_status,
                'is_team_member': user_id != effective_user_id
            }
            
        except Exception as e:
            logger.error(f"Error getting all usage status for user {user_id}: {str(e)}")
            raise
    
    def reset_usage_for_plan(self, user_id: str, plan_id: str) -> Dict[str, Any]:
        """Reset usage counters when user upgrades to a new plan"""
        try:
            from src.services.subscription_service import SubscriptionService
            
            subscription_service = SubscriptionService()
            plan_config = subscription_service.PLAN_CONFIGS.get(plan_id)
            
            if not plan_config:
                raise ValueError(f"Invalid plan ID: {plan_id}")
            
            # Calculate period dates based on plan
            current_time = datetime.now()
            
            if plan_id == 'weekly':
                period_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start + timedelta(days=7)
            elif plan_id == 'yearly':
                period_start = current_time.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start.replace(year=period_start.year + 1)
            else:  # monthly or free
                period_start = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if period_start.month == 12:
                    period_end = period_start.replace(year=period_start.year + 1, month=1)
                else:
                    period_end = period_start.replace(month=period_start.month + 1)
            
            # Delete existing usage records
            self.supabase.table('feature_usage').delete().eq('user_id', user_id).execute()
            
            # Create new usage records with reset counters
            reset_results = {}
            
            for feature_type, limit in plan_config['features'].items():
                usage_data = {
                    'user_id': user_id,
                    'feature_type': feature_type,
                    'current_count': 0,
                    'limit_count': limit,
                    'period_start': period_start.isoformat(),
                    'period_end': period_end.isoformat(),
                    'created_at': current_time.isoformat(),
                    'updated_at': current_time.isoformat()
                }
                
                result = self.supabase.table('feature_usage').insert(usage_data).execute()
                
                reset_results[feature_type] = {
                    'current_count': 0,
                    'limit_count': limit,
                    'reset': True
                }
            
            # Update user table counters for backward compatibility
            self.supabase.table('users').update({
                'current_month_invoices': 0,
                'current_month_expenses': 0,
                'usage_reset_date': current_time.date().isoformat(),
                'updated_at': current_time.isoformat()
            }).eq('id', user_id).execute()
            
            logger.info(f"Reset usage counters for user {user_id} with plan {plan_id}")
            
            return {
                'user_id': user_id,
                'plan_id': plan_id,
                'reset_results': reset_results,
                'reset_date': current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error resetting usage for user {user_id}, plan {plan_id}: {str(e)}")
            raise
    
    def get_usage_warnings(self, user_id: str) -> List[Dict[str, Any]]:
        """Get usage warnings for features approaching limits"""
        try:
            all_usage = self.get_all_usage_status(user_id)
            warnings = []
            
            for feature_type, status in all_usage['usage_status'].items():
                if status.get('warning_threshold', False) and not status.get('limit_reached', False):
                    warnings.append({
                        'feature_type': feature_type,
                        'current_count': status['current_count'],
                        'limit_count': status['limit_count'],
                        'usage_percentage': status['usage_percentage'],
                        'message': f"You've used {status['usage_percentage']:.1f}% of your {feature_type} limit"
                    })
                elif status.get('limit_reached', False):
                    warnings.append({
                        'feature_type': feature_type,
                        'current_count': status['current_count'],
                        'limit_count': status['limit_count'],
                        'usage_percentage': status['usage_percentage'],
                        'message': f"You've reached your {feature_type} limit. Upgrade to continue.",
                        'limit_reached': True
                    })
            
            return warnings
            
        except Exception as e:
            logger.error(f"Error getting usage warnings for user {user_id}: {str(e)}")
            return []
    
    def _get_effective_user_id(self, user_id: str) -> str:
        """Get effective user ID (business owner for team members)"""
        try:
            # Check if user is a team member by looking for owner_id in users table
            user_result = self.supabase.table('users').select('owner_id').eq('id', user_id).single().execute()
            
            if user_result.data and user_result.data.get('owner_id'):
                # User is a team member, return business owner ID
                return user_result.data['owner_id']
            
            # User is not a team member (owner_id is null), return their own ID
            return user_id
            
        except Exception as e:
            logger.error(f"Error getting effective user ID for {user_id}: {str(e)}")
            # In case of error, return the original user ID
            return user_id
    
    def _get_current_usage(self, user_id: str, feature_type: str) -> Optional[Dict[str, Any]]:
        """Get current usage record for user and feature type"""
        try:
            current_time = datetime.now()
            
            # Get usage record for current period (period_start <= now <= period_end)
            usage_result = self.supabase.table('feature_usage').select('*').eq(
                'user_id', user_id
            ).eq('feature_type', feature_type).lte(
                'period_start', current_time.isoformat()
            ).gte('period_end', current_time.isoformat()).execute()
            
            if usage_result.data:
                return usage_result.data[0]
            
            # If no record found with the above query, try a simpler approach
            # Get the most recent record for this user and feature type
            usage_result = self.supabase.table('feature_usage').select('*').eq(
                'user_id', user_id
            ).eq('feature_type', feature_type).order('created_at', desc=True).limit(1).execute()
            
            if usage_result.data:
                record = usage_result.data[0]
                # Check if the record is still valid (within period)
                period_end = datetime.fromisoformat(record['period_end'].replace('Z', '+00:00'))
                if period_end > current_time:
                    return record
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting current usage for user {user_id}, feature {feature_type}: {str(e)}")
            return None
    
    def _initialize_usage_record(self, user_id: str, feature_type: str) -> Dict[str, Any]:
        """Initialize usage record for user and feature type"""
        try:
            from src.services.subscription_service import SubscriptionService
            
            # Get user's subscription plan
            user_result = self.supabase.table('users').select('subscription_plan').eq('id', user_id).single().execute()
            
            if not user_result.data:
                raise ValueError("User not found")
            
            subscription_plan = user_result.data.get('subscription_plan', 'free')
            
            # Get plan configuration
            subscription_service = SubscriptionService()
            plan_config = subscription_service.PLAN_CONFIGS.get(subscription_plan, subscription_service.PLAN_CONFIGS['free'])
            
            # Calculate period dates
            current_time = datetime.now()
            
            if subscription_plan == 'weekly':
                period_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start + timedelta(days=7)
            elif subscription_plan == 'yearly':
                period_start = current_time.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start.replace(year=period_start.year + 1)
            else:  # monthly or free
                period_start = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if period_start.month == 12:
                    period_end = period_start.replace(year=period_start.year + 1, month=1)
                else:
                    period_end = period_start.replace(month=period_start.month + 1)
            
            # Create usage record
            limit_count = plan_config['features'].get(feature_type, 0)
            
            usage_data = {
                'user_id': user_id,
                'feature_type': feature_type,
                'current_count': 0,
                'limit_count': limit_count,
                'period_start': period_start.isoformat(),
                'period_end': period_end.isoformat(),
                'created_at': current_time.isoformat(),
                'updated_at': current_time.isoformat()
            }
            
            result = self.supabase.table('feature_usage').insert(usage_data).execute()
            
            if not result.data:
                raise Exception("Failed to create usage record")
            
            logger.info(f"Initialized usage record for user {user_id}, feature {feature_type}")
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error initializing usage record for user {user_id}, feature {feature_type}: {str(e)}")
            raise