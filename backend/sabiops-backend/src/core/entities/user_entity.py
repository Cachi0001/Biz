"""
Remember to add password hash
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(Enum):
    """Enumeration of user roles in the system"""
    OWNER = "owner"
    ADMIN = "admin"
    STAFF = "staff"


class SubscriptionPlan(Enum):
    """Enumeration of subscription plans available"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(Enum):
    """Enumeration of subscription statuses"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class UserEntity:
    """Core entity representing a user in the system following clean architecture principles"""
    
    def __init__(self, id: str, email: str, first_name: str, last_name: str, 
                 business_name: str, role: UserRole, subscription_plan: SubscriptionPlan, 
                 subscription_status: SubscriptionStatus, created_at: datetime,
                 password_hash: Optional[str] = None, business_address: Optional[str] = None,
                 phone: Optional[str] = None, subscription_start_date: Optional[datetime] = None,
                 subscription_end_date: Optional[datetime] = None, updated_at: Optional[datetime] = None,
                 last_login: Optional[datetime] = None, is_email_verified: bool = False,
                 referral_code: Optional[str] = None, referred_by: Optional[str] = None):
        """
        Initialize a UserEntity
        
        Args:
            id: Unique identifier for the user
            email: User's email address
            first_name: User's first name
            last_name: User's last name
            business_name: Name of the user's business
            role: UserRole enum value
            subscription_plan: SubscriptionPlan enum value
            subscription_status: SubscriptionStatus enum value
            created_at: Datetime when user was created
            password_hash: Optional hashed password
            business_address: Optional business address
            phone: Optional phone number
            subscription_start_date: Optional subscription start date
            subscription_end_date: Optional subscription end date
            updated_at: Optional last update datetime
            last_login: Optional last login datetime
            is_email_verified: Boolean indicating if email is verified
            referral_code: Optional user's referral code
            referred_by: Optional ID of user who referred this user
        """
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.business_name = business_name
        self.business_address = business_address
        self.phone = phone
        self.role = role
        self.subscription_plan = subscription_plan
        self.subscription_status = subscription_status
        self.subscription_start_date = subscription_start_date
        self.subscription_end_date = subscription_end_date
        self.created_at = created_at
        self.updated_at = updated_at
        self.last_login = last_login
        self.is_email_verified = is_email_verified
        self.referral_code = referral_code
        self.referred_by = referred_by
    
    def is_owner(self) -> bool:
        """
        Check if user has owner role
        
        Returns:
            bool: True if user is an owner, False otherwise
        """
        return self.role == UserRole.OWNER
    
    def is_admin(self) -> bool:
        """
        Check if user has admin role
        
        Returns:
            bool: True if user is an admin, False otherwise
        """
        return self.role == UserRole.ADMIN
    
    def is_staff(self) -> bool:
        """
        Check if user has staff role
        
        Returns:
            bool: True if user is staff, False otherwise
        """
        return self.role == UserRole.STAFF
    
    def is_trial_active(self) -> bool:
        """
        Check if user's trial period is still active
        
        Returns:
            bool: True if trial is active, False otherwise
        """
        if not self.subscription_end_date:
            return False
        return datetime.utcnow() < self.subscription_end_date
    
    def is_subscription_active(self) -> bool:
        """
        Check if user's subscription is active
        
        Returns:
            bool: True if subscription is active, False otherwise
        """
        return self.subscription_status == SubscriptionStatus.ACTIVE
    
    def can_access_feature(self, feature: str) -> bool:
        """
        Check if user can access a specific feature based on their subscription plan
        
        Args:
            feature: Name of the feature to check access for
            
        Returns:
            bool: True if user can access the feature, False otherwise
        """
        from shared.constants import free_features
        
        if self.subscription_plan == SubscriptionPlan.FREE:
            return feature in free_features
        
        if self.is_trial_active() or self.is_subscription_active():
            return True
            
        return False
    
    def get_owner_id(self) -> str:
        """
        Get the owner ID for this user. For owners, returns their own ID.
        
        Returns:
            str: Owner ID for this user
        """
        if self.is_owner():
            return self.id
        # For non-owners, the referred_by field should contain the owner's ID
        return self.referred_by or self.id
    
    def to_dict(self, include_password_hash: bool = False) -> Dict[str, Any]:
        """
        Convert UserEntity to dictionary representation
        
        Args:
            include_password_hash: Whether to include password hash in the output
            
        Returns:
            Dict[str, Any]: Dictionary representation of the user entity
        """
        result = {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'business_name': self.business_name,
            'business_address': self.business_address,
            'phone': self.phone,
            'role': self.role.value,
            'subscription_plan': self.subscription_plan.value,
            'subscription_status': self.subscription_status.value,
            'subscription_start_date': self.subscription_start_date.isoformat() if self.subscription_start_date else None,
            'subscription_end_date': self.subscription_end_date.isoformat() if self.subscription_end_date else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_email_verified': self.is_email_verified,
            'referral_code': self.referral_code,
            'referred_by': self.referred_by
        }
        
        if include_password_hash and self.password_hash:
            result['password_hash'] = self.password_hash
            
        return result
    
    @classmethod
    def from_dict(cls, data: dict) -> 'UserEntity':
        """Create entity from dictionary"""
        return cls(
            id=data['id'],
            email=data['email'],
            full_name=data['full_name'],
            password_hash=data['password_hash'],
            phone=data.get('phone'),
            business_name=data.get('business_name'),
            role=UserRole(data['role']),
            subscription_plan=SubscriptionPlan(data['subscription_plan']),
            subscription_status=SubscriptionStatus(data['subscription_status']),
            created_at=datetime.fromisoformat(data['created_at']) if data.get('created_at') else datetime.now(),
            updated_at=datetime.fromisoformat(data['updated_at']) if data.get('updated_at') else datetime.now(),
            is_active=data.get('is_active', True),
            email_confirmed=data.get('email_confirmed', False),
            trial_days_left=data.get('trial_days_left'),
            subscription_start_date=datetime.fromisoformat(data['subscription_start_date']) if data.get('subscription_start_date') else None,
            subscription_end_date=datetime.fromisoformat(data['subscription_end_date']) if data.get('subscription_end_date') else None,
            owner_id=data.get('owner_id'),
            referral_code=data.get('referral_code'),
            referred_by=data.get('referred_by')
        )