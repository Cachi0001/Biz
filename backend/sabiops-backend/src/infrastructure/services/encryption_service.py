from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, decode_token
from datetime import timedelta
import secrets
import string
import logging
from typing import Dict, Optional

from core.interfaces.services.encryption_service_interface import EncryptionServiceInterface

logger = logging.getLogger(__name__)

class EncryptionService(EncryptionServiceInterface):
    """Concrete implementation of encryption service using Werkzeug and Flask-JWT-Extended"""
    
    def __init__(self):
        self.password_hash_method = 'pbkdf2:sha256'
        self.password_salt_length = 16
    
    def hash_password(self, password: str) -> str:
        """Hash a password using PBKDF2 with SHA256"""
        if not password:
            raise ValueError("Password cannot be empty")
        
        return generate_password_hash(
            password,
            method=self.password_hash_method,
            salt_length=self.password_salt_length
        )
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against its hash"""
        if not password or not password_hash:
            return False
        
        try:
            return check_password_hash(password_hash, password)
        except Exception as e:
            logger.error(f"Password verification error: {str(e)}")
            return False
    
    def generate_jwt_token(self, user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        """Generate JWT access token for user"""
        if not user_id:
            raise ValueError("User ID cannot be empty")
        
        if expires_delta is None:
            expires_delta = timedelta(hours=24)
        
        try:
            return create_access_token(
                identity=user_id,
                expires_delta=expires_delta
            )
        except Exception as e:
            logger.error(f"JWT token generation error: {str(e)}")
            raise
    
    def verify_jwt_token(self, token: str) -> Optional[Dict]:
        """Verify and decode JWT token"""
        if not token:
            return None
        
        try:
            decoded_token = decode_token(token)
            return {
                'user_id': decoded_token.get('sub'),
                'expires_at': decoded_token.get('exp'),
                'issued_at': decoded_token.get('iat')
            }
        except Exception as e:
            logger.error(f"JWT token verification error: {str(e)}")
            return None
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure random token"""
        if length <= 0:
            raise ValueError("Token length must be positive")
        
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))