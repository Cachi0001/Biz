from flask import Blueprint, request, jsonify, current_app, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime, timezone
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pytz
from secrets import token_urlsafe
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from threading import Lock
import requests
import os

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
        # 1. Check if user already exists in Supabase Auth
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        resp = requests.get(
            f"{SUPABASE_URL}/auth/v1/admin/users?email={data['email']}",
            headers=headers
        )
        if resp.status_code == 200 and resp.json().get("users"):
            return error_response(
                error="Email already exists",
                message="An account with this email already exists. Please log in or use 'Forgot Password'.",
                status_code=400
            )
        # 2. Create user in Supabase Auth
        payload = {"email": data["email"], "password": data["password"]}
        create_resp = requests.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            json=payload
        )
        print(f"[DEBUG] Supabase Auth create user response status: {create_resp.status_code}")
        print(f"[DEBUG] Supabase Auth create user response body: {create_resp.text}")
        if create_resp.status_code not in (200, 201):
            return error_response("Failed to create user in Supabase Auth.", status_code=500)
        supabase_auth_id = create_resp.json()["id"]
        # Defensive: Check if this ID already exists in public.users
        if supabase:
            existing_id = supabase.table("users").select("*").eq("id", supabase_auth_id).execute()
            if existing_id.data:
                return error_response(
                    error="Registration error",
                    message="A user with this ID already exists. Please contact support.",
                    status_code=400
                )
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
            "id": supabase_auth_id,
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
            mock_db["users"].append(user_data)
            user = user_data
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
                    mock_db["referrals"].append(referral_data)
            except Exception as referral_error:
                print(f"Failed to create referral record: {referral_error}")
        # After user is created in Supabase Auth and users table:
        # Generate email verification token
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        if supabase:
            supabase.table("email_verification_tokens").insert({
                "user_id": user["id"],
                "token": token,
                "expires_at": expires_at
            }).execute()
        else:
            mock_db.setdefault("email_verification_tokens", []).append({
                "user_id": user["id"],
                "token": token,
                "expires_at": expires_at,
                "used": False
            })
        # Send verification email with Edge Function link
        try:
            confirm_link = f"https://okpqkuxnzibrjmniihhu.supabase.co/functions/v1/smooth-api/verify-email?token={token}&email={user['email']}"
            subject = "SabiOps Email Confirmation"
            body = f"Welcome to SabiOps! Please confirm your email by clicking the link below:\n\n{confirm_link}\n\nIf you did not register, please ignore this email."
            from src.services.email_service import email_service
            email_service.send_email(
                to_email=user["email"],
                subject=subject,
                text_content=body
            )
        except Exception as mail_err:
            print(f"[ERROR] Failed to send confirmation email: {mail_err}")
        access_token = create_access_token(identity=user["id"])
        return success_response(
            message="User registered successfully. Please check your email to confirm your account.",
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
            },
            status_code=201
        )
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e):
            return error_response(
                error="Email or phone already exists",
                message="An account with this email or phone already exists. Please log in or use 'Forgot Password'.",
                status_code=400
            )
        return error_response(str(e), status_code=500)

@auth_bp.route("/register/confirmed", methods=["POST"])
def register_confirmed():
    print("[DEBUG] /register/confirmed endpoint called")
    data = request.get_json()
    email = data.get("email")
    if not email:
        return error_response("Email is required", status_code=400)
    supabase = g.supabase
    # 1. Check if user already exists in public.users
    if supabase:
        existing_user = supabase.table("users").select("*").eq("email", email).execute()
        if existing_user.data:
            return success_response(message="User already exists.")
    # 2. Check if user is verified in Supabase Auth
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.get(
        f"{SUPABASE_URL}/auth/v1/admin/users?email={email}",
        headers=headers
    )
    if resp.status_code != 200 or not resp.json().get("users"):
        return error_response("User not found in Supabase Auth", status_code=404)
    user_auth = resp.json()["users"][0]
    if not user_auth.get("email_confirmed_at"):
        return error_response("Email not verified yet", status_code=400)
    # 3. Create user in public.users
    user_data = {
        "id": user_auth["id"],
        "email": user_auth["email"],
        "phone": "",  # Optionally update later
        "password_hash": "",  # Not needed
        "full_name": "",  # Optionally update later
        "business_name": "",
        "referred_by": None,
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
        mock_db = g.mock_db
        mock_db["users"].append(user_data)
        user = user_data
    return success_response(message="User created after email verification.", data={"user": user})

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
        
        if not user.get("email_confirmed", False):
            return error_response(
                error="Email not confirmed",
                message="Please confirm your email before logging in.",
                status_code=403
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

# Setup Flask-Limiter (if not already set up elsewhere)
limiter = Limiter(key_func=get_remote_address)

# --- Password Reset Endpoints ---

# In-memory cooldown cache for mock_db/testing (email: last_request_time)
reset_cooldown_cache = {}
reset_cooldown_lock = Lock()
RESET_COOLDOWN_SECONDS = 60

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

def ensure_user_in_supabase_auth(email, password=None):
    """
    Ensure the user exists in Supabase Auth. If not, create/invite them.
    Returns the user id from Supabase Auth.
    """
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    # 1. Check if user exists in Supabase Auth
    resp = requests.get(
        f"{SUPABASE_URL}/auth/v1/admin/users?email={email}",
        headers=headers
    )
    if resp.status_code == 200 and resp.json().get("users"):
        return resp.json()["users"][0]["id"]  # Already exists
    # 2. If not, create/invite user
    payload = {"email": email}
    if password:
        payload["password"] = password
    invite_resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=headers,
        json=payload
    )
    if invite_resp.status_code in (200, 201):
        return invite_resp.json()["id"]
    else:
        raise Exception(f"Failed to create/invite user in Supabase Auth: {invite_resp.text}")

@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5 per hour", key_func=lambda: request.json.get('email') or request.form.get('email') or request.args.get('email', ''))
def forgot_password():
    """Request a password reset code via email."""
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        email = data.get("email")
        if not email:
            return error_response("Email is required", message="Please enter your email address.", status_code=400)
        # Find user
        user = None
        logging.warning(f"[DEBUG] Password reset requested for email: {email}")
        if supabase:
            user_result = supabase.table("users").select("id").eq("email", email).execute()
            logging.warning(f"[DEBUG] Supabase user lookup result: {user_result.data}")
            if user_result.data:
                user = user_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["email"] == email:
                    user = u
                    break
        if not user:
            logging.warning(f"[DEBUG] No user found for email: {email}")
            return error_response("Email not found", message="No account with this email.", status_code=404)
        if not user.get("email_confirmed", False):
            return error_response(
                error="Email not confirmed",
                message="Please confirm your email before requesting a password reset.",
                status_code=403
            )
        # --- Cooldown check ---
        now = datetime.now(timezone.utc)
        cooldown_remaining = 0
        if supabase:
            # Try to get last reset request from tokens
            recent_token = (
                supabase.table("password_reset_tokens")
                .select("created_at")
                .eq("user_id", user["id"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            logging.warning(f"[DEBUG] Supabase recent_token result: {recent_token.data}")
            if recent_token.data:
                last_time = recent_token.data[0].get("created_at")
                if last_time:
                    # Parse as UTC (handles both 'Z' and offset)
                    last_time_dt = datetime.fromisoformat(last_time).replace(tzinfo=timezone.utc)
                    delta = (now - last_time_dt).total_seconds()
                    if delta < RESET_COOLDOWN_SECONDS:
                        cooldown_remaining = int(RESET_COOLDOWN_SECONDS - delta)
        else:
            with reset_cooldown_lock:
                last_time = reset_cooldown_cache.get(email)
                if last_time:
                    delta = (now - last_time).total_seconds()
                    logging.warning(f"[DEBUG] Cooldown calculation (mock_db): now={now}, last_time={last_time}, delta={delta}")
                    if delta < RESET_COOLDOWN_SECONDS:
                        cooldown_remaining = int(RESET_COOLDOWN_SECONDS - delta)
        if cooldown_remaining > 0:
            logging.warning(f"[DEBUG] Cooldown active for {email}: {cooldown_remaining}s remaining")
            return error_response(
                "Please wait before requesting another reset.",
                message=f"Please wait {cooldown_remaining} seconds before requesting another reset.",
                status_code=429
            )
        # --- Passed cooldown, proceed ---
        if not supabase:
            with reset_cooldown_lock:
                reset_cooldown_cache[email] = now
        # Generate password reset token
        reset_code = secrets.token_urlsafe(32)
        expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        logging.warning(f"[DEBUG] Generated reset code for {email}: {reset_code}")
        token_data = {
            "user_id": user["id"],
            "reset_code": reset_code,
            "expires_at": expires_at,
            "used": False,
            "created_at": now.isoformat()  # for cooldown tracking
        }
        if supabase:
            insert_result = supabase.table("password_reset_tokens").insert(token_data).execute()
            logging.warning(f"[DEBUG] Supabase insert token result: {insert_result}")
        else:
            mock_db.setdefault("password_reset_tokens", []).append(token_data)
            logging.warning(f"[DEBUG] Token appended to mock_db for {email}")
        # Send password reset email with Edge Function link
        try:
            from src.services.email_service import email_service
            subject = "SabiOps Password Reset"
            body = f"You requested a password reset. Click the link below to reset your password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email."
            logging.warning(f"[DEBUG] Attempting to send reset email to {email} via email_service. Subject: {subject}, Body: {body}")
            email_service.send_email(
                to_email=email,
                subject=subject,
                text_content=body
            )
            logging.warning(f"[DEBUG] Reset email sent successfully to {email}!")
        except Exception as mail_err:
            logging.error(f"[ERROR] Failed to send reset email via email_service: {mail_err}")
            return error_response("Failed to send reset email. Contact support.", status_code=500)
        return success_response(message="A password reset link has been sent to your email.")
    except Exception as e:
        logging.error(f"[ERROR] Exception in forgot_password: {e}", exc_info=True)
        return error_response(str(e), status_code=500)

@auth_bp.route("/verify-reset-code", methods=["POST"])
def verify_reset_code():
    """Verify a password reset code."""
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        email = data.get("email")
        reset_code = data.get("reset_code")
        if not email or not reset_code:
            return error_response("Email and reset code are required", status_code=400)
        # Find user
        user = None
        if supabase:
            user_result = supabase.table("users").select("id").eq("email", email).execute()
            if user_result.data:
                user = user_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["email"] == email:
                    user = u
                    break
        if not user:
            return error_response("Email not found", status_code=404)
        # Find token
        if supabase:
            token_result = supabase.table("password_reset_tokens").select("*").eq("user_id", user["id"]).eq("reset_code", reset_code).eq("used", False).execute()
            token = token_result.data[0] if token_result.data else None
        else:
            token = next((t for t in mock_db.get("password_reset_tokens", []) if t["user_id"] == user["id"] and t["reset_code"] == reset_code and not t["used"]), None)
        if not token:
            return error_response("Invalid or expired code", status_code=400)
        # Check expiry
        if datetime.fromisoformat(token["expires_at"]).replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            return error_response("Invalid or expired code", status_code=400)
        return success_response(message="Code is valid.")
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Reset password using code."""
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        email = data.get("email")
        reset_code = data.get("reset_code")
        new_password = data.get("new_password")
        if not email or not reset_code or not new_password:
            return error_response("Email, reset code, and new password are required", status_code=400)
        # Find user
        user = None
        if supabase:
            user_result = supabase.table("users").select("*").eq("email", email).execute()
            if user_result.data:
                user = user_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["email"] == email:
                    user = u
                    break
        if not user:
            return error_response("Email not found", status_code=404)
        # Find token
        if supabase:
            token_result = supabase.table("password_reset_tokens").select("*").eq("user_id", user["id"]).eq("reset_code", reset_code).eq("used", False).execute()
            token = token_result.data[0] if token_result.data else None
        else:
            token = next((t for t in mock_db.get("password_reset_tokens", []) if t["user_id"] == user["id"] and t["reset_code"] == reset_code and not t["used"]), None)
        if not token:
            return error_response("Invalid or expired code", status_code=400)
        # Check expiry
        if datetime.fromisoformat(token["expires_at"]).replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            return error_response("Invalid or expired code", status_code=400)
        # Update password in Supabase Auth
        try:
            # Patch password in Supabase Auth
            user_id = user["id"]
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            }
            # Check user status in Supabase Auth
            resp = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}", headers=headers)
            if resp.status_code == 200:
                auth_user = resp.json()
                if auth_user.get("confirmed_at") is None:
                    return error_response(
                        "Account not activated",
                        message="Please check your email for an invite link to set your password for the first time.",
                        status_code=400
                    )
            resp = requests.patch(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers=headers,
                json={"password": new_password}
            )
            if resp.status_code != 200:
                return error_response("Failed to update password in Supabase Auth. Please contact support if this persists.", status_code=500)
        except Exception as e:
            return error_response("Failed to update password in Supabase Auth. Please contact support if this persists.", status_code=500)
        # Mark token as used
        if supabase:
            supabase.table("password_reset_tokens").update({"used": True}).eq("id", token["id"]).execute()
        else:
            token["used"] = True
        return success_response(message="Password updated successfully. You can now log in with your new password.")
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/update-password", methods=["POST"])
@jwt_required()
def update_password():
    """Authenticated Owner can update their own or a team member's password."""
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        requester_id = get_jwt_identity()
        data = request.get_json()
        target_email = data.get("target_email")
        new_password = data.get("new_password")
        if not target_email or not new_password:
            return error_response("target_email and new_password are required", status_code=400)
        # Get requester user
        requester = None
        if supabase:
            requester_result = supabase.table("users").select("*").eq("id", requester_id).execute()
            if requester_result.data:
                requester = requester_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["id"] == requester_id:
                    requester = u
                    break
        if not requester or requester["role"].lower() != "owner":
            return error_response("Only Owners can update passwords.", status_code=403)
        # Get target user
        target_user = None
        if supabase:
            target_result = supabase.table("users").select("*").eq("email", target_email).execute()
            if target_result.data:
                target_user = target_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["email"] == target_email:
                    target_user = u
                    break
        if not target_user:
            return error_response("Target user not found", status_code=404)
        # Update password in Supabase Auth
        try:
            user_id = target_user["id"]
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            }
            resp = requests.patch(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers=headers,
                json={"password": new_password}
            )
            if resp.status_code != 200:
                return error_response("Failed to update password in Supabase Auth. Please contact support if this persists.", status_code=500)
        except Exception as e:
            return error_response("Failed to update password in Supabase Auth. Please contact support if this persists.", status_code=500)
        return success_response(message=f"Password updated for {target_email}.")
    except Exception as e:
        return error_response(str(e), status_code=500)

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
    This endpoint is called by the frontend to check if the user's token is still valid.
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
                    "active": user.get("active", True) # Ensure 'active' is always returned
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












