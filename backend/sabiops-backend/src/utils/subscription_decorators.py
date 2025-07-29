"""
Subscription Decorators
Decorators for checking subscription limits and access control
"""

from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity
import logging

logger = logging.getLogger(__name__)

def error_response(error, message="Error", status_code=400):
    """Standard error response format"""
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

def check_feature_limit(feature_type):
    """
    Decorator to check if user has reached their feature limit before allowing creation
    
    Args:
        feature_type (str): Type of feature ('invoices', 'expenses', 'sales', 'products')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                from src.services.usage_service import UsageService
                
                user_id = get_jwt_identity()
                if not user_id:
                    return error_response("Authentication required", "Unauthorized", 401)
                
                usage_service = UsageService()
                
                # Check if user can create this feature
                can_create, usage_status = usage_service.can_create_feature(user_id, feature_type)
                
                if not can_create:
                    return error_response(
                        f"You have reached your {feature_type} limit ({usage_status['current_count']}/{usage_status['limit_count']}). Please upgrade your subscription to continue.",
                        "Feature limit reached",
                        403
                    )
                
                # If user is approaching limit (80%), add warning to response
                if usage_status.get('warning_threshold', False):
                    logger.warning(f"User {user_id} approaching {feature_type} limit: {usage_status['usage_percentage']:.1f}%")
                
                # Proceed with the original function
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error checking feature limit for {feature_type}: {str(e)}")
                # In case of error, allow the operation but log the issue
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def require_subscription(required_plans=None):
    """
    Decorator to require specific subscription plans for access
    
    Args:
        required_plans (list): List of required subscription plans (e.g., ['weekly', 'monthly', 'yearly'])
                              If None, any active subscription is required
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                from src.services.subscription_service import SubscriptionService
                
                user_id = get_jwt_identity()
                if not user_id:
                    return error_response("Authentication required", "Unauthorized", 401)
                
                subscription_service = SubscriptionService()
                
                # Get user's subscription status (handles team member inheritance)
                subscription_status = subscription_service.get_user_subscription_status(user_id)
                
                # Check if subscription is active
                if not subscription_status['is_active']:
                    return error_response(
                        "This feature requires an active subscription. Please upgrade to continue.",
                        "Subscription required",
                        403
                    )
                
                # Check specific plan requirements
                if required_plans:
                    current_plan = subscription_status['subscription_plan']
                    if current_plan not in required_plans:
                        return error_response(
                            f"This feature requires one of the following plans: {', '.join(required_plans)}. Your current plan: {current_plan}",
                            "Plan upgrade required",
                            403
                        )
                
                # Proceed with the original function
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error checking subscription requirement: {str(e)}")
                # In case of error, allow the operation but log the issue
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def check_team_access():
    """
    Decorator to ensure team members inherit subscription access from business owner
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                from src.services.subscription_service import SubscriptionService
                
                user_id = get_jwt_identity()
                if not user_id:
                    return error_response("Authentication required", "Unauthorized", 401)
                
                subscription_service = SubscriptionService()
                
                # Get subscription status (automatically handles team member inheritance)
                subscription_status = subscription_service.get_user_subscription_status(user_id)
                
                # Check if user has access (either direct subscription or inherited from owner)
                if not subscription_status['is_active']:
                    # Check if user is a team member and get owner's subscription
                    owner_subscription = subscription_service.get_team_owner_subscription(user_id)
                    
                    if not owner_subscription or not owner_subscription['is_active']:
                        return error_response(
                            "Access denied. This feature requires an active subscription.",
                            "Subscription required",
                            403
                        )
                
                # Proceed with the original function
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Error checking team access: {str(e)}")
                # In case of error, allow the operation but log the issue
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def track_feature_usage(feature_type):
    """
    Decorator to automatically track feature usage after successful creation
    
    Args:
        feature_type (str): Type of feature to track ('invoices', 'expenses', 'sales', 'products')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Execute the original function first
                result = f(*args, **kwargs)
                
                # Only track usage if the operation was successful
                if isinstance(result, tuple) and len(result) == 2:
                    response, status_code = result
                    if status_code >= 200 and status_code < 300:
                        # Success response, track usage
                        try:
                            from src.services.usage_service import UsageService
                            
                            user_id = get_jwt_identity()
                            if user_id:
                                usage_service = UsageService()
                                usage_service.increment_usage(user_id, feature_type)
                                logger.info(f"Tracked {feature_type} usage for user {user_id}")
                        except Exception as e:
                            logger.error(f"Error tracking usage for {feature_type}: {str(e)}")
                            # Don't fail the original operation due to tracking errors
                
                return result
                
            except Exception as e:
                logger.error(f"Error in track_feature_usage decorator: {str(e)}")
                # Return the original function result even if tracking fails
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def subscription_required_for_creation(feature_type):
    """
    Combined decorator that checks both subscription requirements and feature limits
    
    Args:
        feature_type (str): Type of feature ('invoices', 'expenses', 'sales', 'products')
    """
    def decorator(f):
        @wraps(f)
        @check_team_access()
        @check_feature_limit(feature_type)
        def decorated_function(*args, **kwargs):
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def get_usage_status_for_response(user_id, feature_type):
    """
    Helper function to get usage status for including in API responses
    
    Args:
        user_id (str): User ID
        feature_type (str): Feature type
        
    Returns:
        dict: Usage status information
    """
    try:
        from src.services.usage_service import UsageService
        
        usage_service = UsageService()
        usage_status = usage_service.check_usage_limit(user_id, feature_type)
        
        return {
            'current_usage': usage_status['current_count'],
            'usage_limit': usage_status['limit_count'],
            'usage_percentage': usage_status['usage_percentage'],
            'approaching_limit': usage_status.get('warning_threshold', False),
            'limit_reached': usage_status.get('limit_reached', False)
        }
        
    except Exception as e:
        logger.error(f"Error getting usage status for response: {str(e)}")
        return {
            'current_usage': 0,
            'usage_limit': 0,
            'usage_percentage': 0,
            'approaching_limit': False,
            'limit_reached': False,
            'error': str(e)
        }

def premium_feature_required(required_plans=['weekly', 'monthly', 'yearly']):
    """
    Decorator for features that require premium subscription plans
    
    Args:
        required_plans (list): List of plans that can access this feature
    """
    def decorator(f):
        @wraps(f)
        @require_subscription(required_plans)
        @check_team_access()
        def decorated_function(*args, **kwargs):
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# Convenience decorators for specific features
def check_invoice_limit(f):
    """Decorator specifically for invoice creation"""
    return check_feature_limit('invoices')(f)

def check_expense_limit(f):
    """Decorator specifically for expense creation"""
    return check_feature_limit('expenses')(f)

def check_sales_limit(f):
    """Decorator specifically for sales creation"""
    return check_feature_limit('sales')(f)

def check_product_limit(f):
    """Decorator specifically for product creation"""
    return check_feature_limit('products')(f)

# Combined decorators for complete protection
def protected_invoice_creation(f):
    """Complete protection for invoice creation"""
    return subscription_required_for_creation('invoices')(f)

def protected_expense_creation(f):
    """Complete protection for expense creation"""
    return subscription_required_for_creation('expenses')(f)

def protected_sales_creation(f):
    """Complete protection for sales creation"""
    return subscription_required_for_creation('sales')(f)

def protected_product_creation(f):
    """Complete protection for product creation"""
    return subscription_required_for_creation('products')(f)