from flask import Blueprint, request, jsonify, current_app, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime, timezone
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pytz
import secrets
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from threading import Lock
import requests
import os
import string

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
    """Register user: create user with email_confirmed=False, send verification email."""
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        email = data.get("email")
        phone = data.get("phone")
        password = data.get("password")
        full_name = data.get("full_name")
        business_name = data.get("business_name")
        
        # Validate required fields
        if not email or not phone or not password or not full_name:
            return error_response("Missing required fields", status_code=400)
        
        if supabase:
            print(f"[DEBUG] Starting registration for email: {email}")
            
            # Check if user already exists
            existing_user_result = supabase.table("users").select("*").eq("email", email).execute()
            existing_user = existing_user_result.data[0] if existing_user_result.data else None
            
            if existing_user:
                if existing_user.get("email_confirmed", False):
                    return error_response("Email already exists", status_code=400)
                else:
                    # User exists but not confirmed, resend verification
                    print(f"[DEBUG] User exists but not confirmed, resending verification for: {email}")
                    user_id = existing_user["id"]
                    
                    # Generate new token
                    token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
                    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
                    
                    # Mark old tokens as used
                    supabase.table("email_verification_tokens").update({"used": True}).eq("user_id", user_id).execute()
                    
                    # Insert new token
                    token_result = supabase.table("email_verification_tokens").insert({
                        "user_id": user_id,
                        "token": token,
                        "expires_at": expires_at,
                        "used": False
                    }).execute()
                    
                    if not token_result.data:
                        return error_response("Failed to generate verification token", status_code=500)
                    
                    # Send verification email
                    confirm_link = f"https://sabiops.vercel.app/email-verified?token={token}&email={email}"
                    subject = "SabiOps Email Confirmation"
                    body = f"Welcome to SabiOps! Please confirm your email by clicking the link below:\n\n{confirm_link}\n\nIf you did not register, please ignore this email."
                    html_body = f"""
<html>
  <body style=\"font-family: Arial, sans-serif; color: #222;\">
    <h2>Welcome to SabiOps!</h2>
    <p>Please confirm your email by clicking the button below:</p>
    <a href=\"{confirm_link}\" style=\"display:inline-block;padding:12px 24px;background-color:#22c55e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Confirm Email</a>
    <p style=\"margin-top:24px;font-size:13px;color:#888;\">If you did not register, please ignore this email.</p>
  </body>
</html>
"""
                    from src.services.email_service import email_service
                    email_service.send_email(
                        to_email=email,
                        subject=subject,
                        text_content=body,
                        html_content=html_body
                    )
                    
                    return success_response(message="A new verification email has been sent. Please check your email to confirm your account.")
            
            # Check if phone already exists
            existing_phone_result = supabase.table("users").select("id").eq("phone", phone).execute()
            if existing_phone_result.data:
                return error_response("Phone already exists", status_code=400)
            
            # Create new user - NO RPC FUNCTION, direct table operations
            print(f"[DEBUG] Creating new user for email: {email}")
            
            # Generate user data
            user_id = str(uuid.uuid4())
            password_hash = generate_password_hash(password)
            
            user_data = {
                "id": user_id,
                "email": email,
                "phone": phone,
                "password_hash": password_hash,
                "full_name": full_name,
                "business_name": business_name or "",
                "role": "Owner",
                "subscription_plan": "weekly",
                "subscription_status": "trial",
                "active": True,
                "email_confirmed": False
            }
            
            # Insert user first
            print(f"[DEBUG] Inserting user with ID: {user_id}")
            user_result = supabase.table("users").insert(user_data).execute()
            
            if not user_result.data:
                print(f"[ERROR] Failed to create user")
                return error_response("Failed to create user", status_code=500)
            
            created_user = user_result.data[0]
            actual_user_id = created_user["id"]
            print(f"[DEBUG] User created successfully with ID: {actual_user_id}")
            
            # Verify user exists before creating token
            verify_result = supabase.table("users").select("id").eq("id", actual_user_id).execute()
            if not verify_result.data:
                print(f"[ERROR] User verification failed after creation")
                return error_response("User verification failed", status_code=500)
            
            print(f"[DEBUG] User verified, creating token for user ID: {actual_user_id}")
            
            # Generate verification token
            token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
            
            # Insert verification token with a small delay to ensure user is committed
            import time
            time.sleep(0.1)  # 100ms delay to ensure user is committed
            
            token_data = {
                "user_id": actual_user_id,
                "token": token,
                "expires_at": expires_at,
                "used": False
            }
            
            print(f"[DEBUG] Inserting token for user ID: {actual_user_id}")
            token_result = supabase.table("email_verification_tokens").insert(token_data).execute()
            
            if not token_result.data:
                print(f"[ERROR] Failed to create verification token, rolling back user")
                # Rollback: delete the user
                supabase.table("users").delete().eq("id", actual_user_id).execute()
                return error_response("Failed to generate verification token", status_code=500)
            
            print(f"[DEBUG] Token created successfully")
            
            # Send verification email
            confirm_link = f"https://sabiops.vercel.app/email-verified?token={token}&email={email}"
            subject = "SabiOps Email Confirmation"
            body = f"Welcome to SabiOps! Please confirm your email by clicking the link below:\n\n{confirm_link}\n\nIf you did not register, please ignore this email."
            html_body = f"""
<html>
  <body style=\"font-family: Arial, sans-serif; color: #222;\">
    <h2>Welcome to SabiOps!</h2>
    <p>Please confirm your email by clicking the button below:</p>
    <a href=\"{confirm_link}\" style=\"display:inline-block;padding:12px 24px;background-color:#22c55e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Confirm Email</a>
    <p style=\"margin-top:24px;font-size:13px;color:#888;\">If you did not register, please ignore this email.</p>
  </body>
</html>
"""
            from src.services.email_service import email_service
            email_service.send_email(
                to_email=email,
                subject=subject,
                text_content=body,
                html_content=html_body
            )
            
            return success_response(message="Registration successful. Please check your email to confirm your account.")
        
        else:
            # Mock DB logic for local testing only
            existing_user = None
            for u in mock_db["users"]:
                if u["email"] == email:
                    existing_user = u
                    break
            if not existing_user:
                for u in mock_db["users"]:
                    if u["phone"] == phone:
                        return error_response("Phone already exists", status_code=400)
            
            if existing_user and existing_user.get("email_confirmed", False):
                return error_response("Email already exists", status_code=400)
            
            if existing_user and not existing_user.get("email_confirmed", False):
                user_id = existing_user["id"]
                
                import secrets
                import string
                from datetime import datetime, timedelta, timezone
                token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
                expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
                
                for t in mock_db.get("email_verification_tokens", []):
                    if t["user_id"] == user_id:
                        t["used"] = True
                mock_db.setdefault("email_verification_tokens", []).append({
                    "user_id": user_id,
                    "token": token,
                    "expires_at": expires_at,
                    "used": False
                })
                
                confirm_link = f"https://sabiops.vercel.app/email-verified?token={token}&email={email}"
                subject = "SabiOps Email Confirmation"
                body = f"Welcome to SabiOps! Please confirm your email by clicking the link below:\n\n{confirm_link}\n\nIf you did not register, please ignore this email."
                html_body = f"""
<html>
  <body style=\"font-family: Arial, sans-serif; color: #222;\">
    <h2>Welcome to SabiOps!</h2>
    <p>Please confirm your email by clicking the button below:</p>
    <a href=\"{confirm_link}\" style=\"display:inline-block;padding:12px 24px;background-color:#22c55e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Confirm Email</a>
    <p style=\"margin-top:24px;font-size:13px;color:#888;\">If you did not register, please ignore this email.</p>
  </body>
</html>
"""
                from src.services.email_service import email_service
                email_service.send_email(
                    to_email=email,
                    subject=subject,
                    text_content=body,
                    html_content=html_body
                )
                
                return success_response(message="A new verification email has been sent. Please check your email to confirm your account.")
            
            user_data = {
                "email": email,
                "phone": phone,
                "password_hash": generate_password_hash(password),
                "full_name": full_name,
                "business_name": business_name or "",
                "role": "Owner",
                "subscription_plan": "weekly",
                "subscription_status": "trial",
                "active": True,
                "email_confirmed": False
            }
            
            user_id = str(uuid.uuid4())
            user_data["id"] = user_id
            mock_db["users"].append(user_data)
            
            import secrets
            import string
            from datetime import datetime, timedelta, timezone
            token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
            
            mock_db.setdefault("email_verification_tokens", []).append({
                "user_id": user_id,
                "token": token,
                "expires_at": expires_at,
                "used": False
            })
            
            confirm_link = f"https://sabiops.vercel.app/email-verified?token={token}&email={email}"
            subject = "SabiOps Email Confirmation"
            body = f"Welcome to SabiOps! Please confirm your email by clicking the link below:\n\n{confirm_link}\n\nIf you did not register, please ignore this email."
            html_body = f"""
<html>
  <body style=\"font-family: Arial, sans-serif; color: #222;\">
    <h2>Welcome to SabiOps!</h2>
    <p>Please confirm your email by clicking the button below:</p>
    <a href=\"{confirm_link}\" style=\"display:inline-block;padding:12px 24px;background-color:#22c55e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Confirm Email</a>
    <p style=\"margin-top:24px;font-size:13px;color:#888;\">If you did not register, please ignore this email.</p>
  </body>
</html>
"""
            from src.services.email_service import email_service
            email_service.send_email(
                to_email=email,
                subject=subject,
                text_content=body,
                html_content=html_body
            )
            
            return success_response(message="Registration successful. Please check your email to confirm your account.")
            
    except Exception as e:
        print(f"[ERROR] Registration exception: {str(e)}")
        return error_response(str(e), status_code=500)

