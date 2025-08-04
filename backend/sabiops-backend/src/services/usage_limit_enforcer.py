"""
Usage Limit Enforcer Service
Enforces feature usage limits based on current subscription status
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from flask import current_app

from .real_time_day_calculator import RealTimeDayCalculator

logger = logging.getLogger(__name__)

class UsageLimitEnforcer:
    """Service for enforcing usage limits based on subscription status"""
    
    def __init__(self):
        """Initialize the usage limit enforcer"""
        self.supabase = current_app.config.get('SUPABASE')
        self.day_calculator = RealTimeDayCalculator()
        
        # Plan configurations with limits
        self.PLAN_LIMITS = {
            'free': {
                'invoices': 5,
                'expenses': 20,
                'products': 20,
                'sales': 50
            },
            'weekly': {
                'invoices': 100,
                'expenses': 100,
                'products': 100,
                'sales': 250
            },
            'monthly': {
                'invoices': 450,
                'expenses': 500,
                'products': 500,
                'sales': 1500
            },
            'yearly': {
                'invoices': 6000,
                'expenses': 2000,
                'products': 2000,
                'sales': 18000
            }
        }
    
    def check_feature_access(self, user_id: str, feature_type: str) -> Dict[str, Any]:
        """
        Check if user has access to create a new record of the specified feature type
        
        Args:
            user_id: User ID to check
            feature_type: Type of feature (invoices, expenses, products, sales)
            
        Returns:
            Dict with access information and current usage status
        """
        try:
            # Get current subscription status
            subscription_status = self._get_current_subscription_status(user_id)
            
            if subscription_status.get('error'):
                return {
                    'access_granted': False,
                    'error': subscription_status['error'],
                    'feature_type': feature_type,
                    'user_id': user_id
                }
            
            # Get current usage for this feature
            usage_status = self.get_current_usage_status(user_id, feature_type)
            
            # Determine if access should be granted
            access_result = self._determine_access(subscription_status, usage_status, feature_type)
            
            return {
                'access_granted': access_result['granted'],
                'feature_type': feature_type,
                'user_id': user_id,
                'subscription_plan': subscription_status['plan'],
                'subscription_status': subscription_status['status'],
                'is_expired': subscription_status['is_expired'],
                'current_usage': usage_status['current_count'],
                'usage_limit': usage_status['limit_count'],
                'remaining_usage': usage_status['remaining'],
                'usage_percentage': usage_status['usage_percentage'],
                'reason': access_result.get('reason'),
                'upgrade_required': access_result.get('upgrade_required', False),
                'message': access_result.get('message'),
                'warnings': subscription_status.get('warnings', [])
            }
            
        except Exception as e:
            logger.error(f"Error checking feature access for user {user_id}, feature {feature_type}: {str(e)}")
            return {
                'access_granted': False,
                'error': str(e),
                'feature_type': feature_type,
                'user_id': user_id
            }
    
    def can_create_record(self, user_id: str, feature_type: str) -> bool:
        """
        Simple boolean check if user can create a new record
        
        Args:
            user_id: User ID to check
            feature_type: Type of feature to check
            
        Returns:
            bool: True if user can create record, False otherwise
        """
        try:
            access_result = self.check_feature_access(user_id, feature_type)
            return access_result.get('access_granted', False)
        except Exception as e:
            logger.error(f"Error in can_create_record for user {user_id}: {str(e)}")
            return False
    
    def get_current_usage_status(self, user_id: str, feature_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Get current usage status for a user
        
        Args:
            user_id: User ID to check
            feature_type: Specific feature type, or None for all features
            
        Returns:
            Dict with usage information
        """
        try:
            # Get business owner ID (for team member support)
            business_owner_id = self._get_business_owner_id(user_id)
            
            # Get current period
            current_time = datetime.now(timezone.utc)
            current_period_start = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if feature_type:
                # Get usage for specific feature
                usage_result = self.supabase.table('feature_usage').select('*').eq(
                    'user_id', business_owner_id
                ).eq('feature_type', feature_type).eq(
                    'period_start', current_period_start.isoformat()
                ).execute()
                
                if usage_result.data:
                    usage_record = usage_result.data[0]
                    return {
                        'feature_type': feature_type,
                        'current_count': usage_record['current_count'],
                        'limit_count': usage_record['limit_count'],
                        'remaining': max(0, usage_record['limit_count'] - usage_record['current_count']),
                        'usage_percentage': (usage_record['current_count'] / usage_record['limit_count'] * 100) if usage_record['limit_count'] > 0 else 0,
                        'period_start': usage_record['period_start'],
                        'period_end': usage_record['period_end'],
                        'sync_status': usage_record.get('sync_status', 'unknown')
                    }
                else:
                    # No usage record found, return default
                    return {
                        'feature_type': feature_type,
                        'current_count': 0,
                        'limit_count': self.PLAN_LIMITS['free'].get(feature_type, 0),
                        'remaining': self.PLAN_LIMITS['free'].get(feature_type, 0),
                        'usage_percentage': 0,
                        'period_start': current_period_start.isoformat(),
                        'period_end': (current_period_start + timedelta(days=32)).replace(day=1).isoformat(),
                        'sync_status': 'not_initialized'
                    }
            else:
                # Get usage for all features
                usage_result = self.supabase.table('feature_usage').select('*').eq(
                    'user_id', business_owner_id
                ).eq('period_start', current_period_start.isoformat()).execute()
                
                usage_data = {}
                for record in usage_result.data:
                    ft = record['feature_type']
                    usage_data[ft] = {
                        'current_count': record['current_count'],
                        'limit_count': record['limit_count'],
                        'remaining': max(0, record['limit_count'] - record['current_count']),
                        'usage_percentage': (record['current_count'] / record['limit_count'] * 100) if record['limit_count'] > 0 else 0,
                        'sync_status': record.get('sync_status', 'unknown')
                    }
                
                return {
                    'user_id': user_id,
                    'business_owner_id': business_owner_id,
                    'usage_data': usage_data,
                    'period_start': current_period_start.isoformat(),
                    'period_end': (current_period_start + timedelta(days=32)).replace(day=1).isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting usage status for user {user_id}: {str(e)}")
            return {
                'error': str(e),
                'user_id': user_id
            }
    
    def enforce_limit_on_action(self, user_id: str, feature_type: str, action: str) -> Dict[str, Any]:
        """
        Enforce usage limit when user attempts to perform an action
        
        Args:
            user_id: User ID performing the action
            feature_type: Type of feature being used
            action: Action being performed (create, update, delete)
            
        Returns:
            Dict with enforcement result
        """
        try:
            # Only enforce limits on create actions
            if action.lower() != 'create':
                return {
                    'allowed': True,
                    'action': action,
                    'feature_type': feature_type,
                    'reason': 'No limits enforced for non-create actions'
                }
            
            # Check feature access
            access_result = self.check_feature_access(user_id, feature_type)
            
            if access_result['access_granted']:
                return {
                    'allowed': True,
                    'action': action,
                    'feature_type': feature_type,
                    'current_usage': access_result['current_usage'],
                    'usage_limit': access_result['usage_limit'],
                    'remaining_usage': access_result['remaining_usage']
                }
            else:
                return {
                    'allowed': False,
                    'action': action,
                    'feature_type': feature_type,
                    'reason': access_result.get('reason', 'Usage limit exceeded'),
                    'message': access_result.get('message'),
                    'current_usage': access_result.get('current_usage', 0),
                    'usage_limit': access_result.get('usage_limit', 0),
                    'upgrade_required': access_result.get('upgrade_required', True),
                    'subscription_plan': access_result.get('subscription_plan'),
                    'is_expired': access_result.get('is_expired', False)
                }
                
        except Exception as e:
            logger.error(f"Error enforcing limit for user {user_id}, action {action}: {str(e)}")
            return {
                'allowed': False,
                'action': action,
                'feature_type': feature_type,
                'error': str(e)
            }
    
    def get_upgrade_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get upgrade recommendations based on current usage patterns
        
        Args:
            user_id: User ID to analyze
            
        Returns:
            List of upgrade recommendations
        """
        try:
            # Get current subscription and usage status
            subscription_status = self._get_current_subscription_status(user_id)
            usage_status = self.get_current_usage_status(user_id)
            
            if subscription_status.get('error') or usage_status.get('error'):
                return []
            
            recommendations = []
            current_plan = subscription_status['plan']
            
            # Only recommend upgrades for free plan users
            if current_plan != 'free':
                return recommendations
            
            # Analyze usage patterns
            usage_data = usage_status.get('usage_data', {})
            
            for feature_type, usage_info in usage_data.items():
                usage_percentage = usage_info['usage_percentage']
                
                if usage_percentage >= 90:
                    recommendations.append({
                        'feature_type': feature_type,
                        'current_usage': usage_info['current_count'],
                        'current_limit': usage_info['limit_count'],
                        'usage_percentage': usage_percentage,
                        'priority': 'high',
                        'message': f"You've used {usage_percentage:.1f}% of your {feature_type} limit. Upgrade to get more capacity.",
                        'suggested_plan': 'weekly'
                    })
                elif usage_percentage >= 75:
                    recommendations.append({
                        'feature_type': feature_type,
                        'current_usage': usage_info['current_count'],
                        'current_limit': usage_info['limit_count'],
                        'usage_percentage': usage_percentage,
                        'priority': 'medium',
                        'message': f"You're approaching your {feature_type} limit ({usage_percentage:.1f}% used). Consider upgrading soon.",
                        'suggested_plan': 'weekly'
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting upgrade recommendations for user {user_id}: {str(e)}")
            return []
    
    def _get_current_subscription_status(self, user_id: str) -> Dict[str, Any]:
        """Get current subscription status for a user"""
        try:
            # Import here to avoid circular imports
            from .subscription_service import SubscriptionService
            
            subscription_service = SubscriptionService()
            return subscription_service.get_unified_subscription_status(user_id)
            
        except Exception as e:
            logger.error(f"Error getting subscription status for user {user_id}: {str(e)}")
            return {'error': str(e)}
    
    def _determine_access(self, subscription_status: Dict[str, Any], usage_status: Dict[str, Any], 
                         feature_type: str) -> Dict[str, Any]:
        """Determine if access should be granted based on subscription and usage status"""
        try:
            plan = subscription_status['subscription_plan']
            is_expired = subscription_status.get('is_expired', False)
            is_active = subscription_status.get('is_active', False)
            
            # If subscription is expired, enforce free plan limits
            if is_expired or not is_active:
                effective_plan = 'free'
            else:
                effective_plan = plan
            
            # Get the limit for this plan and feature
            plan_limits = self.PLAN_LIMITS.get(effective_plan, self.PLAN_LIMITS['free'])
            feature_limit = plan_limits.get(feature_type, 0)
            
            current_usage = usage_status.get('current_count', 0)
            
            # Check if user has reached the limit
            if current_usage >= feature_limit:
                if is_expired:
                    return {
                        'granted': False,
                        'reason': 'subscription_expired',
                        'message': f'Your subscription has expired. You\'ve reached the free plan limit for {feature_type} ({current_usage}/{feature_limit}). Please renew your subscription to continue.',
                        'upgrade_required': True
                    }
                elif effective_plan == 'free':
                    return {
                        'granted': False,
                        'reason': 'free_plan_limit_reached',
                        'message': f'You\'ve reached your free plan limit for {feature_type} ({current_usage}/{feature_limit}). Upgrade to create more records.',
                        'upgrade_required': True
                    }
                else:
                    return {
                        'granted': False,
                        'reason': 'plan_limit_reached',
                        'message': f'You\'ve reached your {plan} plan limit for {feature_type} ({current_usage}/{feature_limit}). Consider upgrading to a higher plan.',
                        'upgrade_required': True
                    }
            
            # Access granted
            return {
                'granted': True,
                'reason': 'within_limits',
                'message': f'You can create {feature_limit - current_usage} more {feature_type}.',
                'upgrade_required': False
            }
            
        except Exception as e:
            logger.error(f"Error determining access: {str(e)}")
            return {
                'granted': False,
                'reason': 'error',
                'message': 'An error occurred while checking your limits. Please try again.',
                'upgrade_required': False
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
    
    def increment_usage_with_enforcement(self, user_id: str, feature_type: str) -> Dict[str, Any]:
        """
        Increment usage count with enforcement check
        
        Args:
            user_id: User ID
            feature_type: Feature type to increment
            
        Returns:
            Dict with increment result
        """
        try:
            # Check if user can create the record
            access_result = self.check_feature_access(user_id, feature_type)
            
            if not access_result['access_granted']:
                return {
                    'success': False,
                    'reason': 'access_denied',
                    'message': access_result.get('message'),
                    'access_result': access_result
                }
            
            # Increment the usage using the subscription service
            from .subscription_service import SubscriptionService
            subscription_service = SubscriptionService()
            
            business_owner_id = self._get_business_owner_id(user_id)
            increment_result = subscription_service.increment_usage_atomic(
                business_owner_id, feature_type, 1
            )
            
            return {
                'success': increment_result.get('success', False),
                'new_count': increment_result.get('new_count', 0),
                'limit': increment_result.get('limit', 0),
                'remaining': increment_result.get('remaining', 0),
                'business_owner_id': business_owner_id,
                'feature_type': feature_type
            }
            
        except Exception as e:
            logger.error(f"Error incrementing usage with enforcement for user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'feature_type': feature_type
            }