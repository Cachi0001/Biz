"""
Subscription Decorators
Provides decorators for subscription-based access control
"""

from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity
import logging

logger = logging.getLogger(__name__)

def subscription_required(allowed_plans=None, allow_trial=True):
    """
    Decorator to require specific subscription plans for endpoint access
    
    Args:
        allowed_plans (list): List of allowed subscription plans (e.g., ['weekly', 'monthly', 'yearly'])
        allow_trial (bool): Whether to allow trial users access
    """
    if allowed_plans is None:
        allowed_plans = ['weekly', 'monthly', 'yearly']
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({
                        'success': False,
                        'error': 'Authentication required',
                        'message': 'Please log in to access this feature',
                        'upgrade_required': True
                    }), 401
                
                # Get subscription service
                from src.services.subscription_service import SubscriptionService
                subscription_service = SubscriptionService()
                
                # Get user's subscription status
                subscription_status = subscription_service.get_unified_subscription_status(user_id)
                
                if not subscription_status:
                    return jsonify({
                        'success': False,
                        'error': 'Unable to verify subscription',
                        'message': 'Please try again or contact support',
                        'upgrade_required': True
                    }), 500
                
                user_plan = subscription_status.get('subscription_plan', 'free')
                is_trial = subscription_status.get('is_trial', False)
                is_active = subscription_status.get('is_active', False)
                
                # Check if user is on free plan (not allowed)
                if user_plan == 'free' and not is_trial:
                    return jsonify({
                        'success': False,
                        'error': 'Subscription required',
                        'message': 'This feature requires a subscription. Upgrade to access advanced analytics.',
                        'upgrade_required': True,
                        'current_plan': user_plan,
                        'allowed_plans': allowed_plans,
                        'upgrade_url': '/subscription-upgrade'
                    }), 403
                
                # Check if trial is allowed and user is on trial
                if is_trial and allow_trial:
                    logger.info(f"Trial user {user_id} accessing analytics feature")
                    return f(*args, **kwargs)
                
                # Check if user's plan is in allowed plans
                if user_plan in allowed_plans and is_active:
                    return f(*args, **kwargs)
                
                # Check if subscription has expired
                if not is_active:
                    return jsonify({
                        'success': False,
                        'error': 'Subscription expired',
                        'message': 'Your subscription has expired. Please renew to continue accessing analytics.',
                        'upgrade_required': True,
                        'current_plan': user_plan,
                        'is_expired': True,
                        'upgrade_url': '/subscription-upgrade'
                    }), 403
                
                # Default denial
                return jsonify({
                    'success': False,
                    'error': 'Insufficient subscription',
                    'message': f'Your current plan ({user_plan}) does not include this feature. Upgrade to access analytics.',
                    'upgrade_required': True,
                    'current_plan': user_plan,
                    'allowed_plans': allowed_plans,
                    'upgrade_url': '/subscription-upgrade'
                }), 403
                
            except Exception as e:
                logger.error(f"Error in subscription_required decorator: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'Subscription verification failed',
                    'message': 'Unable to verify your subscription. Please try again.',
                    'upgrade_required': True
                }), 500
        
        return decorated_function
    return decorator

def analytics_access_required(f):
    """
    Specific decorator for analytics access
    Allows trial and paid subscription users only
    """
    return subscription_required(
        allowed_plans=['weekly', 'monthly', 'yearly'],
        allow_trial=True
    )(f)

def premium_analytics_required(f):
    """
    Decorator for premium analytics features
    Requires paid subscription only (no trial)
    """
    return subscription_required(
        allowed_plans=['monthly', 'yearly'],
        allow_trial=False
    )(f)

def check_analytics_access(user_id: str) -> dict:
    """
    Utility function to check analytics access without decorator
    Returns access status and details
    """
    try:
        from src.services.subscription_service import SubscriptionService
        subscription_service = SubscriptionService()
        
        subscription_status = subscription_service.get_unified_subscription_status(user_id)
        
        if not subscription_status:
            return {
                'has_access': False,
                'reason': 'Unable to verify subscription',
                'upgrade_required': True
            }
        
        user_plan = subscription_status.get('subscription_plan', 'free')
        is_trial = subscription_status.get('is_trial', False)
        is_active = subscription_status.get('is_active', False)
        
        # Free plan users don't have access
        if user_plan == 'free' and not is_trial:
            return {
                'has_access': False,
                'reason': 'Free plan does not include analytics',
                'current_plan': user_plan,
                'upgrade_required': True,
                'trial_available': True
            }
        
        # Trial users have access
        if is_trial:
            return {
                'has_access': True,
                'reason': 'Trial access granted',
                'current_plan': user_plan,
                'is_trial': True,
                'trial_days_left': subscription_status.get('trial_days_left', 0)
            }
        
        # Paid users have access if subscription is active
        if user_plan in ['weekly', 'monthly', 'yearly'] and is_active:
            return {
                'has_access': True,
                'reason': 'Paid subscription active',
                'current_plan': user_plan,
                'is_trial': False
            }
        
        # Expired subscription
        if not is_active:
            return {
                'has_access': False,
                'reason': 'Subscription expired',
                'current_plan': user_plan,
                'upgrade_required': True,
                'is_expired': True
            }
        
        # Default denial
        return {
            'has_access': False,
            'reason': 'Insufficient subscription level',
            'current_plan': user_plan,
            'upgrade_required': True
        }
        
    except Exception as e:
        logger.error(f"Error checking analytics access for user {user_id}: {str(e)}")
        return {
            'has_access': False,
            'reason': 'Error verifying subscription',
            'error': str(e),
            'upgrade_required': True
        }

def get_subscription_upgrade_info(user_id: str) -> dict:
    """
    Get subscription upgrade information for analytics access
    """
    try:
        from src.services.subscription_service import SubscriptionService
        subscription_service = SubscriptionService()
        
        subscription_status = subscription_service.get_unified_subscription_status(user_id)
        current_plan = subscription_status.get('subscription_plan', 'free') if subscription_status else 'free'
        
        # Define upgrade paths
        upgrade_options = []
        
        if current_plan == 'free':
            upgrade_options = [
                {
                    'plan': 'weekly',
                    'name': 'Silver Weekly',
                    'price': '₦1,400',
                    'features': ['Full Analytics Access', '7-day Trial Available'],
                    'recommended': True
                },
                {
                    'plan': 'monthly',
                    'name': 'Silver Monthly',
                    'price': '₦4,500',
                    'features': ['Full Analytics Access', 'Advanced Reports', 'Data Export'],
                    'recommended': False
                },
                {
                    'plan': 'yearly',
                    'name': 'Silver Yearly',
                    'price': '₦50,000',
                    'features': ['Full Analytics Access', 'Advanced Reports', 'Data Export', 'Priority Support'],
                    'recommended': False
                }
            ]
        
        return {
            'current_plan': current_plan,
            'upgrade_options': upgrade_options,
            'trial_available': current_plan == 'free',
            'upgrade_url': '/subscription-upgrade'
        }
        
    except Exception as e:
        logger.error(f"Error getting upgrade info for user {user_id}: {str(e)}")
        return {
            'current_plan': 'unknown',
            'upgrade_options': [],
            'error': str(e)
        }