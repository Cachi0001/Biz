import logging
from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

from core.interfaces.repositories.user_repository_interface import UserRepositoryInterface
from infrastructure.config.dependency_injection import get_container
from shared.exceptions.business_exceptions import AuthenticationFailedException, AuthorizationFailedException

logger = logging.getLogger(__name__)

def jwt_required_custom(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "AUTH_REQUIRED",
                        "message": "Authentication required"
                    }
                }), 401
            
            g.current_user_id = user_id
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.warning(f"JWT verification failed: {str(e)}")
            return jsonify({
                "success": False,
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Invalid or expired token"
                }
            }), 401
    
    return decorated_function

def owner_required(f):
    @wraps(f)
    @jwt_required_custom
    def decorated_function(*args, **kwargs):
        try:
            container = get_container()
            user_repository = container.get(UserRepositoryInterface)
            
            user = user_repository.find_user_by_id(g.current_user_id)
            if not user or not user.is_owner():
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "INSUFFICIENT_PERMISSIONS",
                        "message": "Owner access required"
                    }
                }), 403
            
            g.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Owner verification failed: {str(e)}")
            return jsonify({
                "success": False,
                "error": {
                    "code": "AUTH_ERROR",
                    "message": "Authorization failed"
                }
            }), 500
    
    return decorated_function

def subscription_required(f):
    @wraps(f)
    @jwt_required_custom
    def decorated_function(*args, **kwargs):
        try:
            container = get_container()
            user_repository = container.get(UserRepositoryInterface)
            
            user = user_repository.find_user_by_id(g.current_user_id)
            if not user or not (user.is_trial_active() or user.is_subscription_active()):
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "SUBSCRIPTION_REQUIRED",
                        "message": "Active subscription required"
                    }
                }), 402
            
            g.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Subscription verification failed: {str(e)}")
            return jsonify({
                "success": False,
                "error": {
                    "code": "AUTH_ERROR",
                    "message": "Authorization failed"
                }
            }), 500
    
    return decorated_function