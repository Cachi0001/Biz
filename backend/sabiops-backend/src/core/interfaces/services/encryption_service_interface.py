from abc import ABC, abstractmethod
from typing import Dict, Optional
from datetime import timedelta

class EncryptionServiceInterface(ABC):
    """Interface for encryption and password handling services"""
    
    @abstractmethod
    def hash_password(self, password: str) -> str:
        """Hash a password using secure hashing algorithm"""
        pass
    
    @abstractmethod
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against its hash"""
        pass
    
    @abstractmethod
    def generate_jwt_token(self, user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        """Generate JWT access token for user"""
        pass
    
    @abstractmethod
    def verify_jwt_token(self, token: str) -> Optional[Dict]:
        """Verify and decode JWT token"""
        pass
    
    @abstractmethod
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure random token"""
        pass