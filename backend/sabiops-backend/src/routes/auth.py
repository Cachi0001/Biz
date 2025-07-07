from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

auth_bp = Blueprint("auth", __name__)

def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        data = request.get_json()
        
        required_fields = ["email", "phone", "password", "full_name"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        existing_user_email = supabase.table("users").select("*").eq("email", data["email"]).execute()
        existing_user_phone = supabase.table("users").select("*").eq("phone", data["phone"]).execute()
        
        if existing_user_email.data:
            return error_response(
                error="Email already exists",
                message="An account with this email already exists. Please use a different email or try logging in.",
                status_code=400
            )
            
        if existing_user_phone.data:
            return error_response(
                error="Phone number already exists", 
                message="An account with this phone number already exists. Please use a different phone number or try logging in.",
                status_code=400
            )
        
        password_hash = generate_password_hash(data["password"])
        
        # Handle referral code if provided
        referred_by_id = None
        if data.get("referral_code"):
            referrer_result = supabase.table("users").select("id").eq("referral_code", data["referral_code"]).execute()
            if referrer_result.data:
                referred_by_id = referrer_result.data[0]["id"]
            else:
                return error_response(
                    error="Invalid referral code",
                    message="The referral code you entered is not valid. Please check and try again.",
                    status_code=400
                )
        
        user_data = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "phone": data["phone"],
            "password_hash": password_hash,
            "full_name": data["full_name"],
            "business_name": data.get("business_name", ""),
            "referred_by": referred_by_id,
            "role": "Owner",
            "subscription_plan": "weekly",
            "subscription_status": "trial",
            "active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "trial_ends_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        result = supabase.table("users").insert(user_data).execute()
        
        if result.data:
            user = result.data[0]
            
            # Create referral record if user was referred
            if referred_by_id:
                try:
                    referral_data = {
                        "referrer_id": referred_by_id,
                        "referred_id": user["id"],
                        "status": "pending"
                    }
                    supabase.table("referrals").insert(referral_data).execute()
                except Exception as referral_error:
                    # Log the error but don't fail the registration
                    print(f"Failed to create referral record: {referral_error}")
            
            access_token = create_access_token(identity=user["id"])
            
            return success_response(
                message="User registered successfully",
                data={
                    "access_token": access_token,
                    "user": {
                        "id": user["id"],
                        "email": user["email"],
                        "phone": user["phone"],
                        "full_name": user["full_name"],
                        "business_name": user["business_name"],
                        "role": user["role"],
                        "subscription_plan": user["subscription_plan"],
                        "subscription_status": user["subscription_status"],
                        "trial_ends_at": user["trial_ends_at"]
                    }
                },
                status_code=201
            )
            
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        data = request.get_json()
        
        # Validate that data is actually a dictionary
        if data is None:
            return error_response(
                error="No JSON data",
                message="Request body must contain JSON data. Check Content-Type header is 'application/json'",
                status_code=400
            )
        
        if not isinstance(data, dict):
            return error_response(
                error="Invalid JSON format",
                message=f"Expected JSON object, received {type(data).__name__}: {str(data)[:100]}",
                status_code=400
            )
        
        if not data.get("login") or not data.get("password"):
            return error_response(
                error="Login credentials required",
                message="Email/Phone and password are required",
                status_code=400
            )
        
        login_field = data["login"]
        password = data["password"]
        
        if "@" in login_field:
            user_result = supabase.table("users").select("*").eq("email", login_field).execute()
        else:
            user_result = supabase.table("users").select("*").eq("phone", login_field).execute()
        
        if not user_result.data or len(user_result.data) == 0:
            return error_response(
                error="Invalid credentials",
                message="No account found with this email or phone number. Please check your credentials or sign up for a new account.",
                status_code=401
            )
        
        user = user_result.data[0]
        
        if not check_password_hash(user["password_hash"], password):
            return error_response(
                error="Invalid credentials",
                message="Incorrect password. Please check your password and try again.",
                status_code=401
            )
        
        if not user.get("active", True):
            return error_response(
                error="Account deactivated",
                message="Your account has been deactivated. Please contact support for assistance.",
                status_code=401
            )
        
        supabase.table("users").update({"last_login": datetime.now().isoformat()}).eq("id", user["id"]).execute()
        
        access_token = create_access_token(identity=user["id"])
        
        return success_response(
            message="Login successful",
            data={
                "access_token": access_token,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "phone": user["phone"],
                    "full_name": user["full_name"],
                    "business_name": user["business_name"],
                    "role": user["role"],
                    "subscription_plan": user["subscription_plan"],
                    "subscription_status": user["subscription_status"],
                    "trial_ends_at": user.get("trial_ends_at")
                }
            }
        )
        
    except Exception as e:
        return error_response(
            error=str(e),
            message=f"An error occurred during login: {str(e)}",
            status_code=500
        )

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        user_result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not user_result.data:
            return error_response("User not found", status_code=404)
        
        user = user_result.data[0]
        
        return success_response(
            data={
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "phone": user["phone"],
                    "full_name": user["full_name"],
                    "business_name": user["business_name"],
                    "role": user["role"],
                    "subscription_plan": user["subscription_plan"],
                    "subscription_status": user["subscription_status"],
                    "referral_code": user["referral_code"],
                    "trial_ends_at": user.get("trial_ends_at")
                }
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/verify-token", methods=["POST"])
@jwt_required()
def verify_token():
    """
    Verify JWT token and return user information.
    This endpoint is called by the frontend to check if the user's token is still valid.
    """
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        
        # Get user information from database
        user_result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not user_result.data:
            return error_response(
                error="User not found",
                message="The user associated with this token no longer exists.",
                status_code=404
            )
        
        user = user_result.data[0]
        
        # Check if user is still active
        if not user.get("active", True):
            return error_response(
                error="Account deactivated",
                message="Your account has been deactivated. Please contact support for assistance.",
                status_code=401
            )
        
        return success_response(
            message="Token is valid",
            data={
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "phone": user["phone"],
                    "full_name": user["full_name"],
                    "business_name": user["business_name"],
                    "role": user["role"],
                    "subscription_plan": user["subscription_plan"],
                    "subscription_status": user["subscription_status"],
                    "referral_code": user.get("referral_code"),
                    "trial_ends_at": user.get("trial_ends_at"),
                    "owner_id": user.get("owner_id")
                }
            }
        )
        
    except Exception as e:
        return error_response(
            error=str(e),
            message="Token verification failed",
            status_code=401
        )

