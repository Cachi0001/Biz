"""
Authentication Service Interface - Abstract interface for authentication operations
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict
from core.entities.user_entity import UserEntity

class AuthenticationServiceInterface(ABC):
    """Abstract interface for authentication service operations"""
    
    @abstractmethod
    async def authenticate_user(self, email: str, password: str) -> Dict:
        """Authenticate user with email and password"""
        pass
    
    @abstractmethod
    async def register_user(self, user_data: dict) -> Dict:
        """Register a new user"""
        pass
    
    @abstractmethod
    async def generate_access_token(self, user_id: str) -> str:
        """Generate JWT access token for user"""
        pass
    
    @abstractmethod
    async def verify_access_token(self, token: str) -> Optional[str]:
        """Verify JWT token and return user ID"""
        pass
    
    @abstractmethod
    async def hash_password(self, password: str) -> str:
        """Hash password securely"""
        pass
    
    @abstractmethod
    async def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        pass
    
    @abstractmethod
    async def send_verification_email(self, user: UserEntity) -> bool:
        """Send email verification"""
        pass
    
    @abstractmethod
    async def verify_email_token(self, token: str, email: str) -> bool:
        """Verify email verification token"""
        pass
    
    @abstractmethod
    async def request_password_reset(self, email: str) -> bool:
        """Request password reset"""
        pass
    
    @abstractmethod
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password with token"""
        pass