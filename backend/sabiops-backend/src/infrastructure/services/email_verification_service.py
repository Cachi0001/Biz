from datetime import datetime, timezone, timedelta
import secrets
import string
from typing import Dict, Optional
import logging

from services.email_service import email_service

logger = logging.getLogger(__name__)

class EmailVerificationService:
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def generate_verification_token(self) -> str:
        return "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    def create_verification_token(self, user_id: str) -> Dict:
        try:
            self.supabase.table("email_verification_tokens").update({"used": True}).eq("user_id", user_id).execute()
            
            token = self.generate_verification_token()
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
            
            token_data = {
                "user_id": user_id,
                "token": token,
                "expires_at": expires_at,
                "used": False
            }
            
            result = self.supabase.table("email_verification_tokens").insert(token_data).execute()
            
            if not result.data:
                raise Exception("Failed to create verification token")
            
            return {
                "token": token,
                "expires_at": expires_at,
                "token_id": result.data[0]["id"]
            }
            
        except Exception as e:
            logger.error(f"Error creating verification token: {str(e)}")
            raise
    
    def verify_token(self, token: str, email: str) -> Dict:
        try:
            token_result = self.supabase.table("email_verification_tokens").select("*").eq("token", token).eq("used", False).execute()
            
            if not token_result.data:
                used_token_result = self.supabase.table("email_verification_tokens").select("*").eq("token", token).eq("used", True).execute()
                if used_token_result.data:
                    return {"success": False, "message": "Token has already been used"}
                return {"success": False, "message": "Invalid verification token"}
            
            token_data = token_result.data[0]
            user_id = token_data["user_id"]
            
            expires_at = datetime.fromisoformat(token_data["expires_at"]).replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                return {"success": False, "message": "Verification token has expired"}
            
            user_result = self.supabase.table("users").select("*").eq("id", user_id).execute()
            if not user_result.data:
                return {"success": False, "message": "User not found"}
            
            user = user_result.data[0]
            if user["email"] != email:
                return {"success": False, "message": "Email does not match token"}
            
            self.supabase.table("email_verification_tokens").update({"used": True}).eq("id", token_data["id"]).execute()
            
            self.supabase.table("users").update({
                "email_confirmed": True,
                "updated_at": datetime.now().isoformat()
            }).eq("id", user_id).execute()
            
            return {
                "success": True,
                "message": "Email verified successfully",
                "user_id": user_id
            }
            
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return {"success": False, "message": "Token verification failed"}
    
    def send_verification_email(self, user_email: str, user_name: str, token: str) -> bool:
        """Send verification email to user"""
        try:
            confirm_link = f"https://okpqkuxnzibrjmniihhu.supabase.co/functions/v1/smooth-api/verify-email?token={token}&email={user_email}"
            
            subject = "SabiOps Email Confirmation"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ padding: 30px; background-color: #f9f9f9; }}
                    .footer {{ padding: 20px; text-align: center; color: #666; background-color: #f1f1f1; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; padding: 15px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
                    .button:hover {{ background-color: #16a34a; }}
                    .warning {{ background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to SabiOps!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello {user_name}!</h2>
                        <p>Thank you for registering with SabiOps, your comprehensive business management platform for Nigerian SMEs.</p>
                        <p>To complete your registration and start managing your business, please confirm your email address by clicking the button below:</p>
                        <div style="text-align: center;">
                            <a href="{confirm_link}" class="button">Confirm Email Address</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">{confirm_link}</p>
                        <div class="warning">
                            <p><strong>Important:</strong> This verification link will expire in 30 minutes for security reasons.</p>
                        </div>
                        <p>Once verified, you'll have access to:</p>
                        <ul>
                            <li>Customer and inventory management</li>
                            <li>Professional invoice creation</li>
                            <li>Secure payment processing with Paystack</li>
                            <li>Business analytics and reporting</li>
                            <li>Team collaboration tools</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>If you didn't create an account with SabiOps, please ignore this email.</p>
                        <p><strong>SabiOps Team</strong><br>
                        Your Business Management Partner</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            Welcome to SabiOps!
            
            Hello {user_name}!
            
            Thank you for registering with SabiOps, your comprehensive business management platform for Nigerian SMEs.
            
            To complete your registration, please confirm your email address by clicking the link below:
            {confirm_link}
            
            This verification link will expire in 30 minutes for security reasons.
            
            Once verified, you'll have access to customer management, invoice creation, payment processing, and business analytics.
            
            If you didn't create an account with SabiOps, please ignore this email.
            
            Best regards,
            SabiOps Team
            """
            
            return email_service.send_email(
                to_email=user_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
        except Exception as e:
            logger.error(f"Error sending verification email: {str(e)}")
            return False
    
    def resend_verification_email(self, email: str) -> Dict:
        """Resend verification email for unconfirmed users"""
        try:
            # Find user by email
            user_result = self.supabase.table("users").select("*").eq("email", email).execute()
            if not user_result.data:
                return {"success": False, "message": "User not found"}
            
            user = user_result.data[0]
            
            if user.get("email_confirmed", False):
                return {"success": False, "message": "Email already confirmed"}
            
            # Create new verification token
            token_data = self.create_verification_token(user["id"])
            
            # Send verification email
            email_sent = self.send_verification_email(
                user_email=user["email"],
                user_name=user["full_name"],
                token=token_data["token"]
            )
            
            if email_sent:
                return {
                    "success": True,
                    "message": "Verification email has been resent. Please check your email to confirm your account."
                }
            else:
                return {"success": False, "message": "Failed to send verification email"}
                
        except Exception as e:
            logger.error(f"Error resending verification email: {str(e)}")
            return {"success": False, "message": "Failed to resend verification email"}