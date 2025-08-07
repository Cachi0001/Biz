"""
User Repository Interface - Abstract interface for user data operations
"""
from abc import ABC, abstractmethod
from typing import Optional, List
from core.entities.user_entity import UserEntity

class UserRepositoryInterface(ABC):
    """Abstract interface for user repository operations"""
    
    @abstractmethod
    async def create_user(self, user: UserEntity) -> UserEntity:
        """Create a new user"""
        pass
    
    @abstractmethod
    async def find_user_by_id(self, user_id: str) -> Optional[UserEntity]:
        """Find user by ID"""
        pass
    
    @abstractmethod
    async def find_user_by_email(self, email: str) -> Optional[UserEntity]:
        """Find user by email"""
        pass
    
    @abstractmethod
    async def find_user_by_phone(self, phone: str) -> Optional[UserEntity]:
        """Find user by phone number"""
        pass
    
    @abstractmethod
    async def update_user(self, user_id: str, updates: dict) -> Optional[UserEntity]:
        """Update user information"""
        pass
    
    @abstractmethod
    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        pass
    
    @abstractmethod
    async def find_users_by_owner(self, owner_id: str) -> List[UserEntity]:
        """Find all users belonging to an owner"""
        pass
    
    @abstractmethod
    async def update_subscription_status(self, user_id: str, status: str, plan: str) -> bool:
        """Update user subscription status"""
        pass
    
    @abstractmethod
    async def verify_email(self, user_id: str) -> bool:
        """Mark user email as verified"""
        pass
    
    @abstractmethod
    async def find_user_by_referral_code(self, referral_code: str) -> Optional[UserEntity]:
        """Find user by referral code"""
        pass
    
    @abstractmethod
    async def update_last_login(self, user_id: str) -> bool:
        """Update user's last login timestamp"""
        pass