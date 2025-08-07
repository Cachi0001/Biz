from flask import Blueprint, request, g
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import datetime, timedelta
import logging

from infrastructure.services.authentication_service import AuthenticationService
from shared.utils.response_utils import (
    success_response, error_response, validation_error_response,
    unauthorized_response, internal_server_error_response
)

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)

def get_auth_service():
    """Get authentication service instance"""
    return AuthenticationService(g.supabase)

@auth_bp.route("/register", methods=["POST"])
def register():
    """User registration endpoint with complete email verification"""
    try:
        if not g.supabase:
            return internal_server_error_response("Database connection not available")
        
        data = request.get_json()
        if not data:
            return validation_error_response("Request body is required")
        
        auth_service = get_auth_service()
        result = auth_service.register_user(data)
        
        if result["success"]:
            return success_response(message=result["message"])
        else:
            if result.get("code") == "EMAIL_EXISTS":
                return error_response(result["code"], result["message"], 409)
            elif result.get("code") == "PHONE_EXISTS":
                return error_response(result["code"], result["message"], 409)
            elif result.get("errors"):
                return validation_error_response(result["message"], result["errors"])
            else:
                return error_response("REGISTRATION_FAILED", result["message"], 400)
            
    except Exception as e:
        logger.error(f"Registration endpoint error: {str(e)}")
        return internal_server_error_response(f"Registration failed: {str(e)}")

@auth_bp.route("/login", methods=["POST"])
def login():
    """User login endpoint with complete authentication"""
    try:
        if not g.supabase:
            return internal_server_error_response("Database connection not available")
        
        data = request.get_json()
        if not data:
            return validation_error_response("Request body is required")
        
        email = data.get("email") or data.get("login")
        password = data.get("password")
        
        if not email or not password:
            return validation_error_response("Email and password are required")
        
        auth_service = get_auth_service()
        result = auth_service.authenticate_user(email, password)
        
        if result["success"]:
            return success_response(
                data=result["data"],
                message=result["message"]
            )
        else:
            return unauthorized_response(result["message"])
            
    except Exception as e:
        logger.error(f"Login endpoint error: {str(e)}")
        return internal_server_error_response(f"Login failed: {str(e)}")

@auth_bp.route("/register/confirmed", methods=["POST"])
def register_confirmed():
    """Email verification endpoint"""
    try:
        if not g.supabase:
            return internal_server_error_response("Database connection not available")
        
        data = request.get_json()
        if not data:
            return validation_error_response("Request body is required")
        
        token = data.get("token")
        email = data.get("email")
        
        if not token or not email:
            return validation_error_response("Token and email are required")
        
        auth_service = get_auth_service()
        result = auth_service.verify_email_token(token, email)
        
        if result["success"]:
            # Get user data for login
            user = auth_service.get_user_by_id(result["user_id"])
            if user:
                # Generate access token for immediate login
                access_token = create_access_token(
                    identity=user["id"],
                    expires_delta=timedelta(hours=24)
                )
                
                return success_response(
                    data={
                        "access_token": access_token,
                        "user": {
                            "id": user["id"],
                            "email": user["email"],
                            "full_name": user["full_name"],
                            "business_name": user.get("business_name"),
                            "role": user["role"],
                            "subscription_plan": user["subscription_plan"],
                            "subscription_status": user["subscription_status"],
                            "trial_days_left": user.get("trial_days_left"),
                            "email_confirmed": True
                        }
                    },
                    message="Email confirmed and user logged in."
                )
            else:
                return success_response(message=result["message"])
        else:
            return error_response("VERIFICATION_FAILED", result["message"], 400)
            
    except Exception as e:
        logger.error(f"Email verification endpoint error: {str(e)}")
        return internal_server_error_response(f"Email verification failed: {str(e)}")

@auth_bp.route("/resend-verification-email", methods=["POST"])
def resend_verification_email():
    """Resend verification email endpoint"""
    try:
        if not g.supabase:
            return internal_server_error_response("Database connection not available")
        
        data = request.get_json()
        if not data:
            return validation_error_response("Request body is required")
        
        email = data.get("email")
        if not email:
            return validation_error_response("Email is required")
        
        auth_service = get_auth_service()
        result = auth_service.resend_verification_email(email)
        
        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response("RESEND_FAILED", result["message"], 400)
            
    except Exception as e:
        logger.error(f"Resend verification endpoint error: {str(e)}")
        return internal_server_error_response(f"Failed to resend verification email: {str(e)}")

@auth_bp.route("/verify-token", methods=["POST"])
@jwt_required()
def verify_token():
    """Verify JWT token endpoint"""
    try:
        user_id = get_jwt_identity()
        
        if g.supabase:
            auth_service = get_auth_service()
            user = auth_service.get_user_by_id(user_id)
            
            if not user or not user.get("active", True):
                return unauthorized_response("Invalid or expired token")
        
        return success_response(
            data={"user_id": user_id, "valid": True},
            message="Token is valid"
        )
        
    except Exception as e:
        logger.error(f"Token verification endpoint error: {str(e)}")
        return unauthorized_response("Invalid token")

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Get user profile endpoint"""
    try:
        user_id = get_jwt_identity()
        
        if g.supabase:
            auth_service = get_auth_service()
            user = auth_service.get_user_by_id(user_id)
            
            if not user:
                return error_response("USER_NOT_FOUND", "User not found", 404)
            
            return success_response(
                data=user,
                message="Profile retrieved successfully"
            )
        else:
            return success_response(
                data={"id": user_id, "email": "mock@example.com"},
                message="Profile retrieved (development mode)"
            )
            
    except Exception as e:
        logger.error(f"Get profile endpoint error: {str(e)}")
        return internal_server_error_response(f"Failed to get profile: {str(e)}")

@auth_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update user profile endpoint"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        if not g.supabase:
            return internal_server_error_response("Database connection not available")
        
        # Only allow certain fields to be updated
        allowed_fields = ['full_name', 'business_name', 'phone']
        updates = {k: v for k, v in data.items() if k in allowed_fields and v is not None}
        
        if not updates:
            return validation_error_response("No valid fields to update")
        
        updates['updated_at'] = datetime.now().isoformat()
        
        result = g.supabase.table("users").update(updates).eq("id", user_id).execute()
        
        if result.data:
            user = result.data[0]
            user.pop("password_hash", None)  # Remove sensitive data
            
            return success_response(
                data=user,
                message="Profile updated successfully"
            )
        else:
            return error_response("UPDATE_FAILED", "Failed to update profile", 400)
            
    except Exception as e:
        logger.error(f"Update profile endpoint error: {str(e)}")
        return internal_server_error_response(f"Failed to update profile: {str(e)}")