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
import string # Added for secrets.choice
import time # Added for time.sleep

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
                    print(f"[DEBUG] Registration failed: Email already exists and is confirmed for {email}")
                    return error_response("Email already exists", status_code=400)
                else:
                    # User exists but not confirmed, resend verification
                    print(f"[DEBUG] User exists but not confirmed, resending verification for: {email}")
                    user_id = existing_user["id"]

                    # Generate new token
                    token = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
                    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()

                    # Mark old tokens as used
                    supabase.table("email_verification_tokens").update({"used": True}).eq("user_id", user_id).execute()

                    # Insert new token
                    print(f"[DEBUG] Re-registration: Creating new token for user_id: {user_id}")
                    token_result = supabase.table("email_verification_tokens").insert({
                        "user_id": user_id,
                        "token": token,
                        "expires_at": expires_at,
                        "used": False
                    }).execute()

                    if not token_result.data:
                        print(f"[ERROR] Re-registration: Failed to create verification token for user_id: {user_id}")
                        return error_response("Failed to generate verification token", status_code=500)

                    print(f"[DEBUG] Re-registration: Token created successfully - token_id: {token_result.data[0].get('id')}")

                    # Send verification email
                    confirm_link = f"https://okpqkuxnzibrjmniihhu.supabase.co/functions/v1/smooth-api/verify-email?token={token}&email={email}"
                    print(f"[DEBUG] Re-registration: Sending verification email to {email} with token: {token[:10]}...")
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
                    try:
                        email_service.send_email(
                            to_email=email,
                            subject=subject,
                            text_content=body,
                            html_content=html_body
                        )
                        print(f"[DEBUG] Re-registration: Email sent successfully to {email}")
                    except Exception as e:
                        print(f"[ERROR] Re-registration: Failed to send email: {e}")
                        return error_response("Failed to send verification email", status_code=500)

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
            print(f"[DEBUG] User data to insert: {user_data}")
            try:
            user_result = supabase.table("users").insert(user_data).execute()
                print(f"[DEBUG] User insert result: {user_result}")
                print(f"[DEBUG] User insert data: {user_result.data}")
                # Check if there's an error in the response
                if hasattr(user_result, 'error') and user_result.error:
                    print(f"[DEBUG] User insert error: {user_result.error}")
                else:
                    print(f"[DEBUG] User insert successful - no errors")
            except Exception as e:
                print(f"[ERROR] User insert exception: {e}")
                import traceback
                print(f"[ERROR] User insert traceback: {traceback.format_exc()}")
                return error_response("Failed to create user", status_code=500)

            if not user_result.data:
                print(f"[ERROR] Failed to create user - no data returned")
                return error_response("Failed to create user", status_code=500)

            created_user = user_result.data[0]
            actual_user_id = created_user["id"]
            print(f"[DEBUG] User created successfully with ID: {actual_user_id}")

            # Verify user exists before creating token
            print(f"[DEBUG] Verifying user exists after creation - ID: {actual_user_id}")
            try:
            verify_result = supabase.table("users").select("id").eq("id", actual_user_id).execute()
                print(f"[DEBUG] User verification result: {verify_result}")
                print(f"[DEBUG] User verification data: {verify_result.data}")
                # Check if there's an error in the response
                if hasattr(verify_result, 'error') and verify_result.error:
                    print(f"[DEBUG] User verification error: {verify_result.error}")
                else:
                    print(f"[DEBUG] User verification successful - no errors")
            except Exception as e:
                print(f"[ERROR] User verification exception: {e}")
                import traceback
                print(f"[ERROR] User verification traceback: {traceback.format_exc()}")
                return error_response("User verification failed", status_code=500)
                
            if not verify_result.data:
                print(f"[ERROR] User verification failed after creation - no data returned")
                return error_response("User verification failed", status_code=500)

            print(f"[DEBUG] User verified, creating token for user ID: {actual_user_id}")

            # Generate verification token
            token = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()

            # Insert verification token with a small delay to ensure user is committed
            time.sleep(0.1)  # 100ms delay to ensure user is committed

            token_data = {
                "user_id": actual_user_id,
                "token": token,
                "expires_at": expires_at,
                "used": False
            }

            print(f"[DEBUG] New user: Inserting token for user ID: {actual_user_id}")
            token_result = supabase.table("email_verification_tokens").insert(token_data).execute()

            if not token_result.data:
                print(f"[ERROR] New user: Failed to create verification token, rolling back user")
                # Rollback: delete the user
                supabase.table("users").delete().eq("id", actual_user_id).execute()
                return error_response("Failed to generate verification token", status_code=500)

            print(f"[DEBUG] New user: Token created successfully - token_id: {token_result.data[0].get('id')}")

            # Send verification email
            confirm_link = f"https://okpqkuxnzibrjmniihhu.supabase.co/functions/v1/smooth-api/verify-email?token={token}&email={email}"
            print(f"[DEBUG] New user: Sending verification email to {email} with token: {token[:10]}...")
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
            try:
                email_service.send_email(
                    to_email=email,
                    subject=subject,
                    text_content=body,
                    html_content=html_body
                )
                print(f"[DEBUG] New user: Email sent successfully to {email}")
            except Exception as e:
                print(f"[ERROR] New user: Failed to send email: {e}")
                # Rollback: delete the user and token
                supabase.table("users").delete().eq("id", actual_user_id).execute()
                supabase.table("email_verification_tokens").delete().eq("user_id", actual_user_id).execute()
                return error_response("Failed to send verification email", status_code=500)

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

                token = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
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

            token = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()

            mock_db.setdefault("email_verification_tokens", []).append({
                "user_id": user_id,
                "token": token,
                "expires_at": expires_at,
                "used": False
            })

            confirm_link = f"https://okpqkuxnzibrjmniihhu.supabase.co/functions/v1/smooth-api/verify-email?token={token}&email={email}"
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



@auth_bp.route("/resend-verification-email", methods=["POST"])
def resend_verification_email():
    """Resend verification email for unconfirmed users."""
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        email = data.get("email")

        if not email:
            return error_response("Email is required", status_code=400)

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
            return error_response("User not found", status_code=404)

        if user.get("email_confirmed", False):
            return error_response("Email already confirmed", status_code=400)

        user_id = user["id"]

        # Generate new verification token
        token = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()

        # Store token in email_verification_tokens
        if supabase:
            # Mark old tokens as used
            supabase.table("email_verification_tokens").update({"used": True}).eq("user_id", user_id).execute()
            # Insert new token
            supabase.table("email_verification_tokens").insert({
                "user_id": user_id,
                "token": token,
                "expires_at": expires_at,
                "used": False
            }).execute()
        else:
            # Mark old tokens as used
            for t in mock_db.get("email_verification_tokens", []):
                if t["user_id"] == user_id:
                    t["used"] = True
            # Insert new token
            mock_db.setdefault("email_verification_tokens", []).append({
                "user_id": user_id,
                "token": token,
                "expires_at": expires_at,
                "used": False
            })

        # Send verification email
        confirm_link = f"https://okpqkuxnzibrjmniihhu.supabase.co/functions/v1/smooth-api/verify-email?token={token}&email={email}"
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

        return success_response(message="Verification email has been resent. Please check your email to confirm your account.")

    except Exception as e:
        return error_response(str(e), status_code=500)

@auth_bp.route("/register/confirmed", methods=["POST"])
def register_confirmed():
    """Confirm email: verify token, mark user as confirmed, return JWT."""
    from datetime import datetime, timezone
    import time
    print(f"[DEBUG] Email verification request received")
    data = request.get_json()
    token = data.get("token")
    email = data.get("email")
    print(f"[DEBUG] Request data - token: {token[:10] if token else 'None'}..., email: {email}")
    
    if not token or not email:
        print(f"[DEBUG] Missing required fields - token: {bool(token)}, email: {bool(email)}")
        return error_response("Missing token or email", status_code=400)
    
    supabase = g.supabase
    mock_db = g.mock_db
    print(f"[DEBUG] Database mode - supabase: {bool(supabase)}, mock_db: {bool(mock_db)}")
    
    # 1. Check token validity and get user_id
    if supabase:
        print(f"[DEBUG] Starting Supabase token lookup for token: {token[:10]}...")
        try:
            # First try to find unused token
            token_result = supabase.table("email_verification_tokens").select("*").eq("token", token).eq("used", False).execute()
            print(f"[DEBUG] Supabase query executed successfully")
            print(f"[DEBUG] Unused token lookup result: {len(token_result.data) if token_result.data else 0} tokens found")
            
            # If no unused token found, check if token exists but is used (might be from Supabase Edge Function)
            if not token_result.data:
                print(f"[DEBUG] No unused tokens found for token: {token[:10]}..., checking for used tokens")
                used_token_result = supabase.table("email_verification_tokens").select("*").eq("token", token).eq("used", True).execute()
                print(f"[DEBUG] Used token lookup result: {len(used_token_result.data) if used_token_result.data else 0} tokens found")
                
                if used_token_result.data:
                    print(f"[DEBUG] Found used token - likely already processed by Supabase Edge Function")
                    token_row = used_token_result.data[0]
                    user_id = token_row["user_id"]
                    # Always try to find user by user_id only
                    user_by_id_result = supabase.table("users").select("*").eq("id", user_id).execute()
                    print(f"[DEBUG] User lookup by id only: {len(user_by_id_result.data) if user_by_id_result.data else 0} users found")
                    if user_by_id_result.data:
                        user = user_by_id_result.data[0]
                        print(f"[DEBUG] User found by ID has email: {user.get('email')}, email_confirmed: {user.get('email_confirmed', False)}")
                        if not user.get("email_confirmed", False):
                            print(f"[DEBUG] User not confirmed, forcing email_confirmed=True")
                            supabase.table("users").update({"email_confirmed": True}).eq("id", user_id).execute()
                            user["email_confirmed"] = True
                        access_token = create_access_token(identity=user["id"])
                        print(f"[DEBUG] JWT generated successfully")
                        response_data = {
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
                                "trial_ends_at": user.get("trial_ends_at"),
                                "email_confirmed": user.get("email_confirmed", False)
                            }
                        }
                        print(f"[DEBUG] Email verification completed successfully - email_confirmed: {user.get('email_confirmed', False)}")
                        return success_response(
                            message="Email confirmed and user logged in.",
                            data=response_data
                        )
                    else:
                        print(f"[DEBUG] No user found by id only, retrying after 200ms...")
                        time.sleep(0.2)
                        user_by_id_result_retry = supabase.table("users").select("*").eq("id", user_id).execute()
                        print(f"[DEBUG] Retry user lookup by id only: {len(user_by_id_result_retry.data) if user_by_id_result_retry.data else 0} users found")
                        if user_by_id_result_retry.data:
                            user = user_by_id_result_retry.data[0]
                            print(f"[DEBUG] [RETRY] User found by ID has email: {user.get('email')}, email_confirmed: {user.get('email_confirmed', False)}")
                            if not user.get("email_confirmed", False):
                                print(f"[DEBUG] [RETRY] User not confirmed, forcing email_confirmed=True")
                                supabase.table("users").update({"email_confirmed": True}).eq("id", user_id).execute()
                                user["email_confirmed"] = True
                            access_token = create_access_token(identity=user["id"])
                            print(f"[DEBUG] [RETRY] JWT generated successfully")
                            response_data = {
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
                                    "trial_ends_at": user.get("trial_ends_at"),
                                    "email_confirmed": user.get("email_confirmed", False)
                                }
                            }
                            print(f"[DEBUG] [RETRY] Email verification completed successfully - email_confirmed: {user.get('email_confirmed', False)}")
                            return success_response(
                                message="Email confirmed and user logged in.",
                                data=response_data
                            )
                        else:
                            print(f"[DEBUG] [RETRY] No user found by id only after retry. user_id: {user_id}, token: {token}")
                            return error_response("User not found after retry", status_code=404)
                # If we get here, token doesn't exist at all
                all_tokens_result = supabase.table("email_verification_tokens").select("*").eq("token", token).execute()
                print(f"[DEBUG] All tokens with this value (any used status): {len(all_tokens_result.data) if all_tokens_result.data else 0}")
                if all_tokens_result.data:
                    print(f"[DEBUG] All matching tokens: {[{k: v for k, v in t.items() if k != 'token'} for t in all_tokens_result.data]}")
                return error_response("Invalid or expired token", status_code=400)
            
            # Found unused token - proceed with normal verification flow
            if token_result.data:
                print(f"[DEBUG] Found unused tokens: {[{k: v for k, v in t.items() if k != 'token'} for t in token_result.data]}")
            
            token_row = token_result.data[0]
            print(f"[DEBUG] Found token - ID: {token_row.get('id')}, user_id: {token_row.get('user_id')}, expires_at: {token_row.get('expires_at')}, used: {token_row.get('used')}")
            
            # Check expiry
            expires_at = datetime.fromisoformat(token_row["expires_at"]).replace(tzinfo=timezone.utc)
            current_time = datetime.now(timezone.utc)
            print(f"[DEBUG] Time check - expires_at: {expires_at}, current_time: {current_time}, is_expired: {expires_at < current_time}")
            
            if expires_at < current_time:
                print(f"[DEBUG] Token expired: {token_row['expires_at']}")
                return error_response("Invalid or expired token", status_code=400)
            
            user_id = token_row["user_id"]
            print(f"[DEBUG] Token valid for user_id: {user_id}")
            
            # Mark token as used
            print(f"[DEBUG] Marking token as used - token ID: {token_row['id']}")
            update_token_result = supabase.table("email_verification_tokens").update({"used": True}).eq("id", token_row["id"]).execute()
            print(f"[DEBUG] Token update result: {len(update_token_result.data) if update_token_result.data else 0} rows updated")
            
            # Mark user as confirmed
            print(f"[DEBUG] Looking up user - user_id: {user_id}, email: {email}")
            user_result = supabase.table("users").select("*").eq("id", user_id).eq("email", email).execute()
            print(f"[DEBUG] User lookup result: {len(user_result.data) if user_result.data else 0} users found")
            
            if not user_result.data:
                print(f"[DEBUG] User not found for id: {user_id}, email: {email}")
                user_by_id_result = supabase.table("users").select("*").eq("id", user_id).execute()
                print(f"[DEBUG] User by ID only: {len(user_by_id_result.data) if user_by_id_result.data else 0} users found")
                if user_by_id_result.data:
                    print(f"[DEBUG] User found by ID has email: {user_by_id_result.data[0].get('email')}")
                return error_response("User not found", status_code=404)
            
            user = user_result.data[0]
            print(f"[DEBUG] Found user - ID: {user.get('id')}, email: {user.get('email')}, current email_confirmed: {user.get('email_confirmed', False)}")
            
            print(f"[DEBUG] Updating user email_confirmed to True for user_id: {user_id}")
            update_user_result = supabase.table("users").update({"email_confirmed": True}).eq("id", user_id).execute()
            print(f"[DEBUG] User update result: {len(update_user_result.data) if update_user_result.data else 0} rows updated")
            
            print(f"[DEBUG] Refreshing user data to verify update")
            user_result = supabase.table("users").select("*").eq("id", user_id).execute()
            if user_result.data:
                user = user_result.data[0]
                print(f"[DEBUG] Refreshed user - email_confirmed: {user.get('email_confirmed', False)}")
            else:
                print(f"[DEBUG] Failed to refresh user data")
                
        except Exception as e:
            print(f"[ERROR] Supabase operation failed: {str(e)}")
            return error_response("Database error during verification", status_code=500)
    else:
        print(f"[DEBUG] Using mock database for token lookup")
        token_row = next((t for t in mock_db.get("email_verification_tokens", []) if t["token"] == token and not t["used"]), None)
        print(f"[DEBUG] Mock DB token lookup result: {'Found' if token_row else 'Not found'}")
        
        if not token_row:
            print(f"[DEBUG] No unused tokens found in mock DB for token: {token[:10]}...")
            return error_response("Invalid or expired token", status_code=400)
        
        # Check expiry
        expires_at = datetime.fromisoformat(token_row["expires_at"]).replace(tzinfo=timezone.utc)
        current_time = datetime.now(timezone.utc)
        print(f"[DEBUG] Mock DB time check - expires_at: {expires_at}, current_time: {current_time}")
        
        if expires_at < current_time:
            print(f"[DEBUG] Mock DB token expired: {token_row['expires_at']}")
            return error_response("Invalid or expired token", status_code=400)
        
        user_id = token_row["user_id"]
        print(f"[DEBUG] Mock DB token valid for user_id: {user_id}")
        token_row["used"] = True
        
        user = next((u for u in mock_db["users"] if u["id"] == user_id and u["email"] == email), None)
        if not user:
            print(f"[DEBUG] Mock DB user not found for id: {user_id}, email: {email}")
            return error_response("User not found", status_code=404)
        
        print(f"[DEBUG] Mock DB found user, updating email_confirmed")
        user["email_confirmed"] = True
    
    # Generate JWT and return user info
    print(f"[DEBUG] Generating JWT for user_id: {user['id']}")
    access_token = create_access_token(identity=user["id"])
    print(f"[DEBUG] JWT generated successfully")
    
    response_data = {
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
            "trial_ends_at": user.get("trial_ends_at"),
            "email_confirmed": user.get("email_confirmed", False)
        }
    }
    
    print(f"[DEBUG] Email verification completed successfully - email_confirmed: {user.get('email_confirmed', False)}")
    return success_response(
        message="Email confirmed and user logged in.",
        data=response_data
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    print("[DEBUG] ===== LOGIN ENDPOINT CALLED =====")
    print(f"[DEBUG] Request method: {request.method}")
    print(f"[DEBUG] Request headers: {dict(request.headers)}")
    print(f"[DEBUG] Request content type: {request.content_type}")

    try:
        supabase = g.supabase
        mock_db = g.mock_db
        
        print(f"[DEBUG] Supabase client available: {supabase is not None}")
        print(f"[DEBUG] Mock DB available: {mock_db is not None}")
        
        if supabase:
            print(f"[DEBUG] Supabase URL: {supabase.supabase_url}")
            print(f"[DEBUG] Supabase key type: {type(supabase.supabase_key)}")
        
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
        
        print(f"[DEBUG] Login field: {login_field}")
        print(f"[DEBUG] Is email: {'@' in login_field}")

        user = None
        if supabase:
            print(f"[DEBUG] Using Supabase for user lookup")
            try:
            if "@" in login_field:
                    print(f"[DEBUG] Looking up user by email: {login_field}")
                user_result = supabase.table("users").select("*").eq("email", login_field).execute()
                    print(f"[DEBUG] Email lookup result: {user_result}")
                    print(f"[DEBUG] Email lookup data: {user_result.data}")
                    # Check if there's an error in the response
                    if hasattr(user_result, 'error') and user_result.error:
                        print(f"[DEBUG] Email lookup error: {user_result.error}")
            else:
                        print(f"[DEBUG] Email lookup successful - no errors")
                else:
                    print(f"[DEBUG] Looking up user by phone: {login_field}")
                user_result = supabase.table("users").select("*").eq("phone", login_field).execute()
                    print(f"[DEBUG] Phone lookup result: {user_result}")
                    print(f"[DEBUG] Phone lookup data: {user_result.data}")
                    # Check if there's an error in the response
                    if hasattr(user_result, 'error') and user_result.error:
                        print(f"[DEBUG] Phone lookup error: {user_result.error}")
                    else:
                        print(f"[DEBUG] Phone lookup successful - no errors")

            if user_result.data and len(user_result.data) > 0:
                user = user_result.data[0]
                    print(f"[DEBUG] Found user in Supabase: {user.get('id')} - {user.get('email')}")
        else:
                    print(f"[DEBUG] No user found in Supabase")
                    
            except Exception as e:
                print(f"[ERROR] Supabase lookup failed: {e}")
                print(f"[ERROR] Exception type: {type(e)}")
                import traceback
                print(f"[ERROR] Traceback: {traceback.format_exc()}")
        else:
            print(f"[DEBUG] Using Mock DB for user lookup")
            # Mock DB lookup
            for u in mock_db["users"]:
                if ("@" in login_field and u["email"] == login_field) or \
                   ("@" not in login_field and u["phone"] == login_field):
                    user = u
                    print(f"[DEBUG] Found user in Mock DB: {user.get('id')} - {user.get('email')}")
                    break
            if not user:
                print(f"[DEBUG] No user found in Mock DB")

        if not user:
            print(f"[DEBUG] No user found - returning 401")
            return error_response(
                error="Invalid credentials",
                message="No account found with this email or phone number. Please check your credentials or sign up for a new account.",
                status_code=401
            )

        print(f"[DEBUG] User found - checking password")
        print(f"[DEBUG] User has password_hash: {'password_hash' in user}")
        print(f"[DEBUG] User active: {user.get('active', True)}")
        print(f"[DEBUG] User email_confirmed: {user.get('email_confirmed', False)}")

        if not check_password_hash(user["password_hash"], password):
            print(f"[DEBUG] Password verification failed")
            return error_response(
                error="Invalid credentials",
                message="Incorrect password. Please check your password and try again.",
                status_code=401
            )
        
        print(f"[DEBUG] Password verification successful")

        if not user.get("active", True):
            print(f"[DEBUG] User account is deactivated")
            return error_response(
                error="Account deactivated",
                message="Your account has been deactivated. Please contact support for assistance.",
                status_code=401
            )

        if not user.get("email_confirmed", False):
            print(f"[DEBUG] User email not confirmed")
            return error_response(
                error="Email not confirmed",
                message="Please confirm your email before logging in.",
                status_code=403
            )
        
        print(f"[DEBUG] All user checks passed - proceeding with login")

        # Update last login time
        print(f"[DEBUG] Updating last login time for user: {user['id']}")
        if supabase:
            try:
                update_result = supabase.table("users").update({"last_login": datetime.now(timezone.utc).isoformat()}).eq("id", user["id"]).execute()
                print(f"[DEBUG] Last login update result: {update_result}")
            except Exception as e:
                print(f"[WARNING] Failed to update last login time: {e}")
        else:
            for i, u in enumerate(mock_db["users"]):
                if u["id"] == user["id"]:
                    mock_db["users"][i]["last_login"] = pytz.UTC.localize(datetime.utcnow()).isoformat()
                    break

        print(f"[DEBUG] Creating access token for user: {user['id']}")
        access_token = create_access_token(identity=user["id"])
        print(f"[DEBUG] Access token created successfully")

        response_data = {
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
        
        print(f"[DEBUG] Login successful - returning response with user: {user['email']}")
        print(f"[DEBUG] ===== LOGIN ENDPOINT COMPLETED =====")
        
        return success_response(
            message="Login successful",
            data=response_data
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
@limiter.limit("5 per hour", key_func=lambda: request.json.get('email') if request.json else request.form.get('email') or request.args.get('email', ''))
def forgot_password():
    """Request a password reset link via email (JWT-based, Owner only)."""
    import jwt
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        email = data.get("email")
        if not email:
            return error_response("Email is required", message="Please enter your email address.", status_code=400)
        # Find user
        user = None
        if supabase:
            user_result = supabase.table("users").select("id, email, email_confirmed, role").eq("email", email).execute()
            if user_result.data:
                user = user_result.data[0]
        else:
            for u in mock_db["users"]:
                if u["email"] == email:
                    user = u
                    break
        if not user:
            return error_response("Email not found", message="No account with this email.", status_code=404)
        if not user.get("email_confirmed", False):
            return error_response(
                error="Email not confirmed",
                message="Please confirm your email before requesting a password reset.",
                status_code=403
            )
        if user.get("role", "").lower() != "owner":
            return error_response(
                error="Not allowed",
                message="Only Owners can reset their password via this method.",
                status_code=403
            )
        # Generate JWT token (15 min exp)
        import os
        from datetime import datetime, timedelta, timezone
        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET") or os.environ.get("JWT_SECRET_KEY")
        if not jwt_secret:
            return error_response("JWT secret not configured", status_code=500)
        payload = {
            "sub": user["id"],
            "email": user["email"],
            "type": "reset",
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=15)).timestamp())
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")
        # Build reset URL
        reset_url = f"https://sabiops.vercel.app/reset-password?token={token}"
        # Send email
        subject = "Reset your SabiOps password"
        html_body = f"""
<!doctype html>
<html>
  <body style=\"margin:0;font-family:Arial,Helvetica,sans-serif;\">
    <div style=\"max-width:600px;margin:auto;padding:40px 20px;\">
      <h2>Reset your password</h2>
      <p>You requested a password reset. Click the button below to choose a new password.</p>
      <a href=\"{reset_url}\" style=\"background:#00c853;color:white;padding:14px 24px;border-radius:4px;text-decoration:none;display:inline-block;font-size:16px;\">
        Reset Password
      </a>
      <p style=\"font-size:12px;color:#666;\">If you did not request this, please ignore.</p>
    </div>
  </body>
</html>
"""
        text_body = f"You requested a password reset. Use this link to reset your password: {reset_url}\nIf you did not request this, please ignore."
        from src.services.email_service import email_service
        result = email_service.send_email(
            to_email=user["email"],
            subject=subject,
            html_content=html_body,
            text_content=text_body
        )
        if not result:
            import logging
            logging.error(f"[ERROR] Failed to send password reset email to {user['email']}")
            return error_response("Failed to send password reset email. Please contact support if this persists.", status_code=500)
        return success_response(message="A password reset link has been sent to your email.")
    except Exception as e:
        import logging
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
            user_result = supabase.table("users").select("id, email_confirmed").eq("email", email).execute()
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
    """Reset password using JWT token (Owner only)."""
    import jwt
    try:
        supabase = g.supabase
        mock_db = g.mock_db
        data = request.get_json()
        token = data.get("token")
        new_password = data.get("password")
        if not token or not new_password:
            return error_response("Token and new password are required", status_code=400)
        import os
        from datetime import datetime, timezone
        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET") or os.environ.get("JWT_SECRET_KEY")
        if not jwt_secret:
            return error_response("JWT secret not configured", status_code=500)
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return error_response("Reset link expired. Please request a new one.", status_code=400)
        except jwt.InvalidTokenError:
            return error_response("Invalid reset link.", status_code=400)
        user_id = payload.get("sub")
        email = payload.get("email")
        if payload.get("type") != "reset":
            return error_response("Invalid reset token type.", status_code=400)
        # Find user and check role
        user = None
        if supabase:
            user_result = supabase.table("users").select("id, role").eq("id", user_id).single().execute()
            if user_result.data:
                user = user_result.data
        else:
            for u in mock_db["users"]:
                if u["id"] == user_id:
                    user = u
                    break
        if not user:
            return error_response("User not found", status_code=404)
        if user.get("role", "").lower() != "owner":
            return error_response("Only Owners can reset their password via this method.", status_code=403)
        # Update password in Supabase Auth
        try:
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
        # Mark all old tokens as used (idempotency)
        if supabase:
            supabase.table("password_reset_tokens").update({"used": True}).eq("user_id", user_id).execute()
        else:
            for t in mock_db.get("password_reset_tokens", []):
                if t["user_id"] == user_id:
                    t["used"] = True
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



