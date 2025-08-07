import logging
from typing import Dict, Any
from datetime import datetime, timezone, timedelta

from core.interfaces.repositories.user_repository_interface import UserRepositoryInterface
from core.interfaces.repositories.subscription_repository_interface import SubscriptionRepositoryInterface
from shared.exceptions.business_exceptions import BusinessException

logger = logging.getLogger(__name__)

class CheckUsageLimitUseCase:
    
    def __init__(self, 
                 user_repository: UserRepositoryInterface,
                 subscription_repository: SubscriptionRepositoryInterface):
        self.user_repository = user_repository
        self.subscription_repository = subscription_repository
        
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
    
    async def execute(self, user_id: str, feature_type: str) -> Dict[str, Any]:
        """
        Check if user has access to create a new record of the specified feature type
        
        Args:
            user_id: User ID to check
            feature_type: Type of feature (invoices, expenses, products, sales)
            
        Returns:
            Dict with access information and current usage status
        """
        try:
            # Get user to determine business owner
            user = await self.user_repository.find_user_by_id(user_id)
            if not user:
                raise BusinessException("User not found")
            
            # Get business owner ID (for team member support)
            business_owner_id = user.owner_id if user.owner_id else user.id
            
            # Get current subscription status
            subscription_status = await self._get_current_subscription_status(business_owner_id)
            
            if subscription_status.get('error'):
                return {
                    'access_granted': False,
                    'error': subscription_status['error'],
                    'feature_type': feature_type,
                    'user_id': user_id
                }
            
            # Get current usage for this feature
            usage_status = await self._get_current_usage_status(business_owner_id, feature_type)
            
            # Determine if access should be granted
            access_result = self._determine_access(subscription_status, usage_status, feature_type)
            
            logger.info(f"Usage limit check for user {user_id}, feature {feature_type}: {access_result['granted']}")
            
            return {
                'access_granted': access_result['granted'],
                'feature_type': feature_type,
                'user_id': user_id,
                'business_owner_id': business_owner_id,
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
            raise BusinessException(f"Failed to check usage limit: {str(e)}")
    
    async def can_create_record(self, user_id: str, feature_type: str) -> bool:
        """
        Simple boolean check if user can create a new record
        
        Args:
            user_id: User ID to check
            feature_type: Type of feature to check
            
        Returns:
            bool: True if user can create record, False otherwise
        """
        try:
            access_result = await self.execute(user_id, feature_type)
            return access_result.get('access_granted', False)
        except Exception as e:
            logger.error(f"Error in can_create_record for user {user_id}: {str(e)}")
            return False
    
    async def _get_current_subscription_status(self, business_owner_id: str) -> Dict[str, Any]:
        """Get current subscription status for a business owner"""
        try:
            # Get active subscription
            subscription = await self.subscription_repository.find_active_subscription_by_user(business_owner_id)
            
            if not subscription:
                return {
                    'plan': 'free',
                    'status': 'free',
                    'is_expired': False,
                    'is_active': True,
                    'subscription_plan': 'free'
                }
            
            is_active = subscription.is_active()
            is_expired = subscription.is_expired()
            
            return {
                'plan': subscription.plan.value,
                'status': subscription.status.value,
                'is_expired': is_expired,
                'is_active': is_active,
                'subscription_plan': subscription.plan.value,
                'end_date': subscription.end_date.isoformat(),
                'days_remaining': subscription.days_remaining()
            }
            
        except Exception as e:
            logger.error(f"Error getting subscription status for user {business_owner_id}: {str(e)}")
            return {'error': str(e)}
    
    async def _get_current_usage_status(self, business_owner_id: str, feature_type: str) -> Dict[str, Any]:
        """
        Get current usage status for a feature type
        
        Args:
            business_owner_id: Business owner ID
            feature_type: Feature type to check
            
        Returns:
            Dict with usage information
        """
        try:
            # For now, we'll simulate usage tracking
            # In a full implementation, this would query a feature_usage table
            current_time = datetime.now(timezone.utc)
            current_period_start = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Get subscription to determine limits
            subscription_status = await self._get_current_subscription_status(business_owner_id)
            plan = subscription_status.get('plan', 'free')
            
            # Get limits for the plan
            plan_limits = self.PLAN_LIMITS.get(plan, self.PLAN_LIMITS['free'])
            limit_count = plan_limits.get(feature_type, 0)
            
            # TODO: Implement actual usage counting from database
            # For now, return simulated usage
            current_count = 0  # This should be queried from actual usage data
            
            remaining = max(0, limit_count - current_count)
            usage_percentage = (current_count / limit_count * 100) if limit_count > 0 else 0
            
            return {
                'feature_type': feature_type,
                'current_count': current_count,
                'limit_count': limit_count,
                'remaining': remaining,
                'usage_percentage': usage_percentage,
                'period_start': current_period_start.isoformat(),
                'sync_status': 'simulated'
            }
            
        except Exception as e:
            logger.error(f"Error getting usage status for user {business_owner_id}: {str(e)}")
            return {
                'feature_type': feature_type,
                'current_count': 0,
                'limit_count': self.PLAN_LIMITS['free'].get(feature_type, 0),
                'remaining': self.PLAN_LIMITS['free'].get(feature_type, 0),
                'usage_percentage': 0,
                'sync_status': 'error'
            }
    
    def _determine_access(self, subscription_status: Dict[str, Any], usage_status: Dict[str, Any], 
                         feature_type: str) -> Dict[str, Any]:
        """Determine if access should be granted based on subscription and usage status"""
        try:
            plan = subscription_status.get('subscription_plan', 'free')
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