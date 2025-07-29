from enum import Enum, auto
from functools import wraps
from typing import List, Optional, Callable, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.auth_bearer import JWTBearer
from app.auth.auth_handler import get_user_id_from_token
from app.db.database import get_db
import logging

logger = logging.getLogger(__name__)


class UserRole(Enum):
    OWNER = "owner"
    ADMIN = "admin"
    SALESPERSON = "salesperson"


def role_required(allowed_roles: List[UserRole]):
    """Decorator to restrict access to specific roles"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            token = kwargs.get("token")
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_id = get_user_id_from_token(token)
            db = kwargs.get("db")
            
            # Get user role from database
            user_query = "SELECT role FROM users WHERE id = $1"
            user = await db.fetch_one(user_query, user_id)
            
            if not user or not user["role"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User role not found"
                )
            
            user_role = UserRole(user["role"].lower())
            
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {', '.join([role.value for role in allowed_roles])}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def owner_only(func: Callable) -> Callable:
    """Decorator to restrict access to owners only"""
    return role_required([UserRole.OWNER])(func)


def admin_or_owner(func: Callable) -> Callable:
    """Decorator to allow access to admins and owners"""
    return role_required([UserRole.OWNER, UserRole.ADMIN])(func)


def any_authenticated(func: Callable) -> Callable:
    """Decorator to allow access to any authenticated user"""
    return role_required([UserRole.OWNER, UserRole.ADMIN, UserRole.SALESPERSON])(func)


async def get_user_with_role(db, user_id: str) -> dict:
    """Get user details including role and ownership info"""
    try:
        user_query = """
        SELECT 
            id, role, owner_id, subscription_plan, subscription_status, trial_days_left
        FROM users 
        WHERE id = $1
        """
        
        user = await db.fetch_one(user_query, user_id)
        
        if user:
            user_dict = dict(user)
            user_dict["is_owner"] = user_dict["role"].lower() == "owner"
            user_dict["effective_owner_id"] = user_dict["owner_id"] or user_dict["id"]
            return user_dict
        return None
    except Exception as e:
        logger.error(f"Failed to get user with role: {str(e)}")
        return None


async def check_resource_access(db, user_id: str, resource_owner_id: str) -> bool:
    """Check if user has access to a resource based on ownership or team membership"""
    try:
        user = await get_user_with_role(db, user_id)
        if not user:
            return False
        
        # Owner can access their own resources
        if user["is_owner"] and user["id"] == resource_owner_id:
            return True
        
        # Team members can access owner's resources
        if user["owner_id"] == resource_owner_id:
            return True
        
        return False
    except Exception as e:
        logger.error(f"Failed to check resource access: {str(e)}")
        return False


def resource_access_required(func: Callable) -> Callable:
    """Decorator to check resource access based on owner_id parameter"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        token = kwargs.get("token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user_id = get_user_id_from_token(token)
        db = kwargs.get("db")
        
        # Try to get owner_id from kwargs
        resource_owner_id = kwargs.get("owner_id")
        
        if not resource_owner_id:
            # If no owner_id specified, assume current user is the owner
            user = await get_user_with_role(db, user_id)
            resource_owner_id = user["effective_owner_id"] if user else user_id
        
        if not await check_resource_access(db, user_id, resource_owner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this resource"
            )
        
        return await func(*args, **kwargs)
    
    return wrapper


def subscription_required(required_plans: List[str]):
    """Decorator to check subscription plan requirements"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            token = kwargs.get("token")
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_id = get_user_id_from_token(token)
            db = kwargs.get("db")
            
            user = await get_user_with_role(db, user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Get effective subscription (owner's subscription for team members)
            effective_user_id = user["effective_owner_id"]
            
            if effective_user_id != user_id:
                # Get owner's subscription
                owner_query = """
                SELECT subscription_plan, subscription_status
                FROM users
                WHERE id = $1
                """
                
                owner = await db.fetch_one(owner_query, effective_user_id)
                
                if owner:
                    subscription_plan = owner["subscription_plan"]
                    subscription_status = owner["subscription_status"]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Owner subscription not found"
                    )
            else:
                subscription_plan = user["subscription_plan"]
                subscription_status = user["subscription_status"]
            
            # Check if subscription is active
            if subscription_status not in ["active", "trial"]:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "error": "Active subscription required",
                        "subscription_status": subscription_status
                    }
                )
            
            # Check if plan meets requirements
            if subscription_plan not in required_plans:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "error": f"Subscription upgrade required. Required plans: {', '.join(required_plans)}",
                        "current_plan": subscription_plan,
                        "required_plans": required_plans
                    }
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def feature_access_required(feature_type: str):
    """Decorator to check if user has access to a specific feature based on their plan"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            token = kwargs.get("token")
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_id = get_user_id_from_token(token)
            db = kwargs.get("db")
            
            # Check if user has reached their limit
            check_query = """
            SELECT check_usage_limit($1, $2) as limit_reached
            """
            
            result = await db.fetch_one(check_query, user_id, feature_type)
            limit_reached = result["limit_reached"] if result else False
            
            if limit_reached:
                # Get current usage details
                usage_query = """
                SELECT 
                    current_count, 
                    limit_count
                FROM 
                    feature_usage
                WHERE 
                    user_id = $1 AND
                    feature_type = $2 AND
                    period_start <= CURRENT_TIMESTAMP AND
                    period_end > CURRENT_TIMESTAMP
                """
                
                usage = await db.fetch_one(usage_query, user_id, feature_type)
                
                # Get user's subscription plan for upgrade message
                user_query = "SELECT subscription_plan FROM users WHERE id = $1"
                user = await db.fetch_one(user_query, user_id)
                subscription_plan = user["subscription_plan"] if user else "free"
                
                # Determine next tier for upgrade suggestion
                next_tier = "silver_weekly"
                if subscription_plan == "silver_weekly":
                    next_tier = "silver_monthly"
                elif subscription_plan == "silver_monthly":
                    next_tier = "silver_yearly"
                
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "error": f"Feature limit exceeded for {feature_type}",
                        "current_count": usage["current_count"] if usage else 0,
                        "limit_count": usage["limit_count"] if usage else 0,
                        "upgrade_required": True,
                        "suggested_plan": next_tier
                    }
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def get_effective_owner_id(db, user_id: str) -> str:
    """Get the effective owner ID for a user (their own ID if owner, or their owner's ID if team member)"""
    try:
        user = await get_user_with_role(db, user_id)
        return user["effective_owner_id"] if user else user_id
    except Exception as e:
        logger.error(f"Failed to get effective owner ID: {str(e)}")
        return user_id


async def is_owner(db, user_id: str) -> bool:
    """Check if user is an owner"""
    try:
        user_query = "SELECT role FROM users WHERE id = $1"
        user = await db.fetch_one(user_query, user_id)
        return user and user["role"].lower() == "owner"
    except Exception as e:
        logger.error(f"Failed to check if user is owner: {str(e)}")
        return False


async def is_team_member(db, user_id: str) -> bool:
    """Check if user is a team member (not an owner)"""
    try:
        user_query = "SELECT owner_id FROM users WHERE id = $1"
        user = await db.fetch_one(user_query, user_id)
        return user and user["owner_id"] is not None
    except Exception as e:
        logger.error(f"Failed to check if user is team member: {str(e)}")
        return False


async def can_manage_subscription(db, user_id: str) -> bool:
    """Check if user can manage subscription (owners only)"""
    return await is_owner(db, user_id)