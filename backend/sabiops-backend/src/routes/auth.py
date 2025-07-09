from flask import Blueprint, request, jsonify, current_app, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pytz

auth_bp = Blueprint("auth", __name__)

def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    print(f"[ERROR] {message}: {error}") # Added for debugging
    return jsonify({
        "success": False,
        "error": str(error), # Ensure error is a string
        "message": message
    }), status_code

@auth_bp.route("/register", methods=["POST"])
def register():
    print("[DEBUG] /auth/register endpoint called")
    print(f"[DEBUG] Request method: {request.method}")
    print(f"[DEBUG] Request headers: {dict(request.headers)}")
    print(f"[DEBUG] Request content type: {request.content_type}")
    
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        
        print(f"[DEBUG] Request data received: {data}")
        
        if data is None:
            print("[ERROR] No JSON data received")
            return error_response(
                error="No JSON data",
                message="Request body must contain JSON data. Check Content-Type header is 'application/json'",
                status_code=400
            )
        
        required_fields = ["email", "phone", "password", "full_name"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        if supabase:
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
        else:
            # Mock DB check
            for user in mock_db["users"]:
                if user["email"] == data["email"]:
                    return error_response(
                        error="Email already exists",
                        message="An account with this email already exists. Please use a different email or try logging in.",
                        status_code=400
                    )
                if user["phone"] == data["phone"]:
                    return error_response(
                        error="Phone number already exists", 
                        message="An account with this phone number already exists. Please use a different phone number or try logging in.",
                        status_code=400
                    )

        password_hash = generate_password_hash(data["password"])
        
        # Handle referral code if provided
        referred_by_id = None
        if data.get("referral_code"):
            if supabase:
                referrer_result = supabase.table("users").select("id").eq("referral_code", data["referral_code"]).execute()
                if referrer_result.data:
                    referred_by_id = referrer_result.data[0]["id"]
                else:
                    return error_response(
                        error="Invalid referral code",
                        message="The referral code you entered is not valid. Please check and try again.",
                        status_code=400
                    )
            else:
                # Mock DB referral check
                found_referrer = False
                for user in mock_db["users"]:
                    if user.get("referral_code") == data["referral_code"]:
                        referred_by_id = user["id"]
                        found_referrer = True
                        break
                if not found_referrer:
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
            "created_at": pytz.UTC.localize(datetime.utcnow()).isoformat(),
            "updated_at": pytz.UTC.localize(datetime.utcnow()).isoformat(),
            "trial_ends_at": (pytz.UTC.localize(datetime.utcnow()) + timedelta(days=7)).isoformat()
        }
        
        if supabase:
            result = supabase.table("users").insert(user_data).execute()
            user = result.data[0]
        else:
            # Mock DB insert
            mock_db["users"].append(user_data)
            user = user_data
        
        # Create referral record if user was referred
        if referred_by_id:
            try:
                referral_data = {
                    "referrer_id": referred_by_id,
                    "referred_id": user["id"],
                    "status": "pending"
                }
                if supabase:
                    supabase.table("referrals").insert(referral_data).execute()
                else:
                    mock_db["referrals"].append(referral_data) # Assuming referrals in mock_db
            except Exception as referral_error:
                # Log the error but don\"t fail the registration
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
                    "trial_ends_at": user.get("trial_ends_at") # Use .get() for safety
                }
            },
            status_code=201
        )
            
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/login", methods=["POST"])
def login():
    print("[DEBUG] /auth/login endpoint called")
    print(f"[DEBUG] Request method: {request.method}")
    print(f"[DEBUG] Request headers: {dict(request.headers)}")
    print(f"[DEBUG] Request content type: {request.content_type}")
    
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        
        print(f"[DEBUG] Request data received: {data}")
        
        # Validate that data is actually a dictionary
        if data is None:
            return error_response(
                error="No JSON data",
                message="Request body must contain JSON data. Check Content-Type header is \'application/json\'",
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
        
        user = None
        if supabase:
            if "@" in login_field:
                user_result = supabase.table("users").select("*").eq("email", login_field).execute()
            else:
                user_result = supabase.table("users").select("*").eq("phone", login_field).execute()
            
            if user_result.data and len(user_result.data) > 0:
                user = user_result.data[0]
        else:
            # Mock DB lookup
            for u in mock_db["users"]:
                if ("@" in login_field and u["email"] == login_field) or \
                   ("@" not in login_field and u["phone"] == login_field):
                    user = u
                    break

        if not user:
            return error_response(
                error="Invalid credentials",
                message="No account found with this email or phone number. Please check your credentials or sign up for a new account.",
                status_code=401
            )
        
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
        
        if supabase:
            supabase.table("users").update({"last_login": pytz.UTC.localize(datetime.utcnow()).isoformat()}).eq("id", user["id"]).execute()
        else:
            # Update last_login in mock_db
            for i, u in enumerate(mock_db["users"]):
                if u["id"] == user["id"]:
                    mock_db["users"][i]["last_login"] = pytz.UTC.localize(datetime.utcnow()).isoformat()
                    break
        
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
        print(f"[ERROR] Login failed: {e}") # Added for debugging
        # Ensure the error message is a string and not an object like 'SUPABASE'
        error_message = str(e)
        if "object has no attribute" in error_message and "supabase" in error_message.lower():
            error_message = "Supabase client not initialized. Running in mock mode."
        return error_response(
            error=error_message,
            message=f"An error occurred during login: {error_message}",
            status_code=500
        )
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        user_id = get_jwt_identity()
        
        user = None
        if supabase:
            user_result = supabase.table("users").select("*").eq("id", user_id).execute()
            if user_result.data:
                user = user_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["id"] == user_id:
                    user = u
                    break

        if not user:
            return error_response("User not found", status_code=404)
        
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
                    "referral_code": user.get("referral_code"),
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
    This endpoint is called by the frontend to check if the user\'s token is still valid.
    """
    try:
        print(f"[DEBUG] verify_token: Request headers: {request.headers}")
        user_id = get_jwt_identity()
        print(f"[DEBUG] verify_token: JWT Identity: {user_id}")

        supabase = g.supabase
        mock_db = g.mock_db
        
        user = None
        if supabase:
            user_result = supabase.table("users").select("*").eq("id", user_id).execute()
            if user_result.data:
                user = user_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["id"] == user_id:
                    user = u
                    break
        
        if not user:
            print(f"[DEBUG] verify_token: User not found for ID: {user_id}")
            return error_response(
                error="User not found",
                message="The user associated with this token no longer exists.",
                status_code=404
            )
        
        # Check if user is still active
        if not user.get("active", True):
            print(f"[DEBUG] verify_token: User account deactivated for ID: {user_id}")
            return error_response(
                error="Account deactivated",
                message="Your account has been deactivated. Please contact support for assistance.",
                status_code=401
            )
        
        print(f"[DEBUG] verify_token: Token valid for user: {user_id}")
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
                    "owner_id": user.get("owner_id"),
                    "active": user.get("active", True) # Ensure \'active\' is always returned
                }
            }
        )
        
    except Exception as e:
        return error_response(
            error=str(e),
            message="Token verification failed",
            status_code=401
        )

# Error handler for JWT errors
@auth_bp.errorhandler(401)
def handle_auth_error(e):
    print(f"[ERROR] JWT Error Handler: Type: {type(e).__name__}, Message: {e}")
    print(f"[ERROR] Request URL: {request.url}")
    print(f"[ERROR] Request Headers: {dict(request.headers)}")
    
    # Handle specific JWT exceptions
    from flask_jwt_extended.exceptions import JWTExtendedException
    if isinstance(e, JWTExtendedException):
        return error_response(
            error=str(e),
            message="Authentication failed: Invalid or expired token",
            status_code=401
        )
    
    # Catch any other exception that might lead to a 401
    return error_response(
        error=str(e),
        message="Authentication failed",
        status_code=401
    )










