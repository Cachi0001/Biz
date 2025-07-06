from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
import uuid

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
        
        required_fields = ["email", "phone", "password", "first_name", "last_name"]
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
        
        user_data = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "phone": data["phone"],
            "password_hash": password_hash,
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "business_name": data.get("business_name", ""),
            "role": "Owner",
            "subscription_plan": "weekly",
            "subscription_status": "trial",
            "active": True
        }
        
        result = supabase.table("users").insert(user_data).execute()
        
        if result.data:
            user = result.data[0]
            access_token = create_access_token(identity=user["id"])
            
            return success_response(
                message="User registered successfully",
                data={
                    "access_token": access_token,
                    "user": {
                        "id": user["id"],
                        "email": user["email"],
                        "phone": user["phone"],
                        "first_name": user["first_name"],
                        "last_name": user["last_name"],
                        "business_name": user["business_name"],
                        "role": user["role"],
                        "subscription_plan": user["subscription_plan"],
                        "subscription_status": user["subscription_status"]
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
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "business_name": user["business_name"],
                    "role": user["role"],
                    "subscription_plan": user["subscription_plan"],
                    "subscription_status": user["subscription_status"]
                }
            }
        )
        
    except Exception as e:
        print(f"Login exception: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
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
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "business_name": user["business_name"],
                    "role": user["role"],
                    "subscription_plan": user["subscription_plan"],
                    "subscription_status": user["subscription_status"],
                    "referral_code": user["referral_code"],
                    "trial_ends_at": user["trial_ends_at"]
                }
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        
        user_result = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_result.data:
            return error_response("User not found", status_code=404)
        
        user = user_result.data[0]
        data = request.get_json()
        
        update_data = {"updated_at": datetime.now().isoformat()}
        
        if data.get("first_name"):
            update_data["first_name"] = data["first_name"]
        if data.get("last_name"):
            update_data["last_name"] = data["last_name"]
        if data.get("phone"):
            if data["phone"] != user["phone"]:
                existing_phone = supabase.table("users").select("*").eq("phone", data["phone"]).execute()
                if existing_phone.data:
                    return error_response(
                        error="Phone number already exists",
                        message="This phone number is already associated with another account.",
                        status_code=400
                    )
            update_data["phone"] = data["phone"]
        if data.get("business_name"):
            update_data["business_name"] = data["business_name"]
        
        if data.get("new_password"):
            if not data.get("current_password"):
                return error_response("Current password is required", status_code=400)
            
            if not check_password_hash(user["password_hash"], data["current_password"]):
                return error_response("Current password is incorrect", status_code=400)
            
            update_data["password_hash"] = generate_password_hash(data["new_password"])
        
        supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        updated_user_result = supabase.table("users").select("*").eq("id", user_id).execute()
        updated_user = updated_user_result.data[0]

        return success_response(
            message="Profile updated successfully",
            data={
                "user": {
                    "id": updated_user["id"],
                    "email": updated_user["email"],
                    "phone": updated_user["phone"],
                    "first_name": updated_user["first_name"],
                    "last_name": updated_user["last_name"],
                    "business_name": updated_user["business_name"],
                    "role": updated_user["role"],
                    "subscription_plan": updated_user["subscription_plan"],
                    "subscription_status": updated_user["subscription_status"],
                    "referral_code": updated_user["referral_code"],
                    "trial_ends_at": updated_user["trial_ends_at"]
                }
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        
        user_result = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_result.data:
            return error_response("User not found", status_code=404)
        
        user = user_result.data[0]
        data = request.get_json()
        
        if not data.get("current_password") or not data.get("new_password"):
            return error_response("Current password and new password are required", status_code=400)
        
        if not check_password_hash(user["password_hash"], data["current_password"]):
            return error_response("Current password is incorrect", status_code=400)
        
        supabase.table("users").update({
            "password_hash": generate_password_hash(data["new_password"]),
            "updated_at": datetime.now().isoformat()
        }).eq("id", user_id).execute()
        
        return success_response("Password changed successfully")
        
    except Exception as e:
        return error_response(str(e), status_code=500)




