"""
Role-based Access Control Decorators
Provides decorators and utilities for role-based access control in Flask routes
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
import logging
from ..database import supabase

logger = logging.getLogger(__name__)

def role_required(*allowed_roles):
    """
    Decorator to restrict access to specific roles
    Usage: @role_required('Owner', 'Admin')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Authentication required'}), 401
                
                user_role = get_user_role(user_id)
                if not user_role:
                    return jsonify({'error': 'User role not found'}), 403
                
                if user_role not in allowed_roles:
                    return jsonify({
                        'error': f'Access denied. Required roles: {", ".join(allowed_roles)}',
                        'user_role': user_role
                    }), 403
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Role check failed: {str(e)}")
                return jsonify({'error': 'Access control check failed'}), 500
        
        return decorated_function
    return decorator

def owner_only(f):
    """Decorator to restrict access to owners only"""
    return role_required('Owner')(f)

def admin_or_owner(f):
    """Decorator to allow access to admins and owners"""
    return role_required('Owner', 'Admin')(f)

def any_authenticated(f):
    """Decorator to allow access to any authenticated user"""
    return role_required('Owner', 'Admin', 'Salesperson')(f)

def get_user_role(user_id: str) -> str:
    """Get user role from database"""
    try:
        response = supabase.table('users').select('role').eq('id', user_id).single().execute()
        if response.data:
            return response.data['role']
        return None
    except Exception as e:
        logger.error(f"Failed to get user role: {str(e)}")
        return None

def get_user_with_role(user_id: str) -> dict:
    """Get user details including role and ownership info"""
    try:
        response = supabase.table('users').select(
            'id, role, owner_id, subscription_plan, subscription_status'
        ).eq('id', user_id).single().execute()
        
        if response.data:
            user = response.data
            user['is_owner'] = user['role'] == 'Owner'
            user['effective_owner_id'] = user['owner_id'] or user['id']
            return user
        return None
    except Exception as e:
        logger.error(f"Failed to get user with role: {str(e)}")
        return None

def check_resource_access(user_id: str, resource_owner_id: str) -> bool:
    """
    Check if user has access to a resource based on ownership or team membership
    """
    try:
        user = get_user_with_role(user_id)
        if not user:
            return False
        
        # Owner can access their own resources
        if user['is_owner'] and user['id'] == resource_owner_id:
            return True
        
        # Team members can access owner's resources
        if user['owner_id'] == resource_owner_id:
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Failed to check resource access: {str(e)}")
        return False

def resource_access_required(f):
    """
    Decorator to check resource access based on owner_id parameter
    Expects the route to have an 'owner_id' parameter or extract it from request
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user_id = get_jwt_identity()
            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Try to get owner_id from kwargs first, then from request
            resource_owner_id = kwargs.get('owner_id')
            
            if not resource_owner_id:
                from flask import request
                resource_owner_id = request.json.get('owner_id') if request.json else None
            
            if not resource_owner_id:
                # If no owner_id specified, assume current user is the owner
                user = get_user_with_role(user_id)
                resource_owner_id = user['effective_owner_id'] if user else user_id
            
            if not check_resource_access(user_id, resource_owner_id):
                return jsonify({'error': 'Access denied to this resource'}), 403
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Resource access check failed: {str(e)}")
            return jsonify({'error': 'Access control check failed'}), 500
    
    return decorated_function

def subscription_required(*required_plans):
    """
    Decorator to check subscription plan requirements
    Usage: @subscription_required('monthly', 'yearly')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Authentication required'}), 401
                
                user = get_user_with_role(user_id)
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                # Get effective subscription (owner's subscription for team members)
                effective_user_id = user['effective_owner_id']
                
                if effective_user_id != user_id:
                    # Get owner's subscription
                    owner_response = supabase.table('users').select(
                        'subscription_plan, subscription_status'
                    ).eq('id', effective_user_id).single().execute()
                    
                    if owner_response.data:
                        subscription_plan = owner_response.data['subscription_plan']
                        subscription_status = owner_response.data['subscription_status']
                    else:
                        return jsonify({'error': 'Owner subscription not found'}), 403
                else:
                    subscription_plan = user['subscription_plan']
                    subscription_status = user['subscription_status']
                
                # Check if subscription is active
                if subscription_status not in ['active', 'trial']:
                    return jsonify({
                        'error': 'Active subscription required',
                        'subscription_status': subscription_status
                    }), 402  # Payment Required
                
                # Check if plan meets requirements
                if subscription_plan not in required_plans:
                    return jsonify({
                        'error': f'Subscription upgrade required. Required plans: {", ".join(required_plans)}',
                        'current_plan': subscription_plan,
                        'required_plans': required_plans
                    }), 402  # Payment Required
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Subscription check failed: {str(e)}")
                return jsonify({'error': 'Subscription check failed'}), 500
        
        return decorated_function
    return decorator

def feature_access_required(feature_name: str):
    """
    Decorator to check if user has access to a specific feature based on their plan
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Authentication required'}), 401
                
                # Import here to avoid circular imports
                from ..services.subscription_service import subscription_service
                
                # Check feature access
                usage_limits = subscription_service.check_usage_limits(user_id)
                
                if 'error' in usage_limits:
                    return jsonify({'error': 'Failed to check feature access'}), 500
                
                # Check if feature is exceeded
                if usage_limits.get('exceeded', {}).get(feature_name, False):
                    return jsonify({
                        'error': f'Feature limit exceeded for {feature_name}',
                        'current_usage': usage_limits.get('usage', {}).get(feature_name, 0),
                        'limit': usage_limits.get('limits', {}).get(feature_name, 0),
                        'upgrade_required': True
                    }), 402  # Payment Required
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Feature access check failed: {str(e)}")
                return jsonify({'error': 'Feature access check failed'}), 500
        
        return decorated_function
    return decorator

def get_effective_owner_id(user_id: str) -> str:
    """Get the effective owner ID for a user (their own ID if owner, or their owner's ID if team member)"""
    try:
        user = get_user_with_role(user_id)
        return user['effective_owner_id'] if user else user_id
    except Exception as e:
        logger.error(f"Failed to get effective owner ID: {str(e)}")
        return user_id

def is_owner(user_id: str) -> bool:
    """Check if user is an owner"""
    try:
        role = get_user_role(user_id)
        return role == 'Owner'
    except Exception as e:
        logger.error(f"Failed to check if user is owner: {str(e)}")
        return False

def is_team_member(user_id: str) -> bool:
    """Check if user is a team member (not an owner)"""
    try:
        user = get_user_with_role(user_id)
        return user and user['owner_id'] is not None
    except Exception as e:
        logger.error(f"Failed to check if user is team member: {str(e)}")
        return False

def get_team_members(owner_id: str) -> list:
    """Get all team members for an owner"""
    try:
        response = supabase.table('team').select(
            'team_member_id, role, active'
        ).eq('owner_id', owner_id).eq('active', True).execute()
        
        return response.data
    except Exception as e:
        logger.error(f"Failed to get team members: {str(e)}")
        return []

def can_manage_team(user_id: str) -> bool:
    """Check if user can manage team (owners only)"""
    return is_owner(user_id)

def can_access_financials(user_id: str) -> bool:
    """Check if user can access financial data (owners only)"""
    return is_owner(user_id)

def can_access_referrals(user_id: str) -> bool:
    """Check if user can access referral data (owners only)"""
    return is_owner(user_id)

def can_manage_subscription(user_id: str) -> bool:
    """Check if user can manage subscription (owners only)"""
    return is_owner(user_id)

# Role-based data filtering utilities

def filter_data_by_role(user_id: str, data: dict) -> dict:
    """Filter data based on user role"""
    try:
        role = get_user_role(user_id)
        
        if role == 'Owner':
            # Owners get all data
            return data
        elif role == 'Admin':
            # Admins get operational data but no financial details
            filtered_data = data.copy()
            
            # Remove sensitive financial data
            sensitive_keys = ['profit', 'expenses', 'referrals', 'subscription_insights']
            for key in sensitive_keys:
                filtered_data.pop(key, None)
            
            return filtered_data
        elif role == 'Salesperson':
            # Salespersons get limited data
            allowed_keys = ['sales', 'customers', 'products', 'activities']
            return {key: data[key] for key in allowed_keys if key in data}
        
        return {}
        
    except Exception as e:
        logger.error(f"Failed to filter data by role: {str(e)}")
        return {}

def get_accessible_resources(user_id: str, resource_type: str) -> list:
    """Get list of resources accessible to user based on role"""
    try:
        user = get_user_with_role(user_id)
        if not user:
            return []
        
        owner_id = user['effective_owner_id']
        
        # Define resource access based on role
        if user['role'] == 'Owner':
            # Owners can access all their resources
            response = supabase.table(resource_type).select('id').eq('owner_id', owner_id).execute()
        elif user['role'] == 'Admin':
            # Admins can access most resources except sensitive ones
            if resource_type in ['referral_earnings', 'subscription_payments']:
                return []  # No access to financial/referral data
            response = supabase.table(resource_type).select('id').eq('owner_id', owner_id).execute()
        elif user['role'] == 'Salesperson':
            # Salespersons can only access resources they created or are assigned to
            if resource_type == 'sales':
                response = supabase.table(resource_type).select('id').eq('salesperson_id', user_id).execute()
            elif resource_type in ['customers', 'products']:
                response = supabase.table(resource_type).select('id').eq('owner_id', owner_id).execute()
            else:
                return []  # No access to other resources
        else:
            return []
        
        return [item['id'] for item in response.data] if response.data else []
        
    except Exception as e:
        logger.error(f"Failed to get accessible resources: {str(e)}")
        return []

# Audit logging for role-based actions

def log_role_action(user_id: str, action: str, resource_type: str, resource_id: str = None, details: dict = None):
    """Log role-based actions for audit purposes"""
    try:
        user = get_user_with_role(user_id)
        if not user:
            return
        
        log_entry = {
            'user_id': user_id,
            'user_role': user['role'],
            'owner_id': user['effective_owner_id'],
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'details': details or {},
            'timestamp': datetime.utcnow().isoformat(),
            'ip_address': get_client_ip(),
            'user_agent': get_user_agent()
        }
        
        # Store in audit log table (create if doesn't exist)
        supabase.table('audit_logs').insert(log_entry).execute()
        
    except Exception as e:
        logger.error(f"Failed to log role action: {str(e)}")

def get_client_ip():
    """Get client IP address from request"""
    try:
        from flask import request
        return request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
    except:
        return 'unknown'

def get_user_agent():
    """Get user agent from request"""
    try:
        from flask import request
        return request.headers.get('User-Agent', 'unknown')
    except:
        return 'unknown'

