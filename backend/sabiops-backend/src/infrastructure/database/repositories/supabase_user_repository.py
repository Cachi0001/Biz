import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
import hashlib

from core.entities.user_entity import UserEntity, UserRole, SubscriptionPlan, SubscriptionStatus
from core.interfaces.repositories.user_repository_interface import UserRepositoryInterface
from shared.exceptions.business_exceptions import (
    ResourceNotFoundException, 
    DuplicateResourceException,
    DatabaseOperationException
)

logger = logging.getLogger(__name__)

class SupabaseUserRepository(UserRepositoryInterface):    
    def __init__(self, supabase_client, cache_ttl_seconds: int = 300):
        self.supabase = supabase_client
        self.table_name = "users"
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = cache_ttl_seconds
    
    def _generate_cache_key(self, prefix: str, value: str) -> str:
        return f"{prefix}:{hashlib.md5(value.encode()).hexdigest()}"
    
    def _is_cache_valid(self, cache_entry: Dict[str, Any]) -> bool:
        if not cache_entry:
            return False
        cache_time = datetime.fromisoformat(cache_entry['cached_at'])
        return datetime.now() - cache_time < timedelta(seconds=self.cache_ttl)
    
    def _set_cache(self, key: str, data: Dict[str, Any]) -> None:
        self.cache[key] = {
            'data': data,
            'cached_at': datetime.now().isoformat()
        }
    
    def _get_cache(self, key: str) -> Optional[Dict[str, Any]]:
        cache_entry = self.cache.get(key)
        if cache_entry and self._is_cache_valid(cache_entry):
            return cache_entry['data']
        elif cache_entry:
            del self.cache[key]
        return None
    
    def _invalidate_user_cache(self, user_id: str, email: str = None, phone: str = None) -> None:
        keys_to_remove = [
            self._generate_cache_key("user_id", user_id)
        ]
        if email:
            keys_to_remove.append(self._generate_cache_key("email", email))
        if phone:
            keys_to_remove.append(self._generate_cache_key("phone", phone))
        
        for key in keys_to_remove:
            self.cache.pop(key, None)
    
    async def create_user(self, user: UserEntity) -> UserEntity:
        try:
            user_data = user.to_dict(include_password_hash=True)
            
            user_data['created_at'] = user.created_at.isoformat()
            user_data['updated_at'] = user.updated_at.isoformat()
            if user.subscription_start_date:
                user_data['subscription_start_date'] = user.subscription_start_date.isoformat()
            if user.subscription_end_date:
                user_data['subscription_end_date'] = user.subscription_end_date.isoformat()
            
            user_data['active'] = user_data.pop('is_active')
            
            result = self.supabase.table(self.table_name).insert(user_data).execute()
            
            if not result.data:
                raise DatabaseOperationException("Failed to create user")
            
            created_user_data = result.data[0]
            created_user_data['is_active'] = created_user_data.pop('active')
            
            return UserEntity.from_dict(created_user_data)
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                if "email" in str(e).lower():
                    raise DuplicateResourceException("User", "email", user.email)
                elif "phone" in str(e).lower():
                    raise DuplicateResourceException("User", "phone", user.phone)
            raise DatabaseOperationException(f"Failed to create user: {str(e)}")
    
    async def find_user_by_id(self, user_id: str) -> Optional[UserEntity]:
        cache_key = self._generate_cache_key("user_id", user_id)
        cached_data = self._get_cache(cache_key)
        
        if cached_data:
            return UserEntity.from_dict(cached_data)
        
        try:
            result = self.supabase.table(self.table_name).select("*").eq("id", user_id).execute()
            
            if not result.data:
                return None
            
            user_data = result.data[0]
            user_data['is_active'] = user_data.pop('active', True)
            
            self._set_cache(cache_key, user_data)
            return UserEntity.from_dict(user_data)
            
        except Exception as e:
            logger.error(f"Error finding user by ID {user_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find user: {str(e)}")
    
    async def find_user_by_email(self, email: str) -> Optional[UserEntity]:
        normalized_email = email.lower().strip()
        cache_key = self._generate_cache_key("email", normalized_email)
        cached_data = self._get_cache(cache_key)
        
        if cached_data:
            return UserEntity.from_dict(cached_data)
        
        try:
            result = self.supabase.table(self.table_name).select("*").eq("email", normalized_email).execute()
            
            if not result.data:
                return None
            
            user_data = result.data[0]
            user_data['is_active'] = user_data.pop('active', True)
            
            self._set_cache(cache_key, user_data)
            return UserEntity.from_dict(user_data)
            
        except Exception as e:
            logger.error(f"Error finding user by email {email}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find user: {str(e)}")
    
    async def find_user_by_phone(self, phone: str) -> Optional[UserEntity]:
        try:
            result = self.supabase.table(self.table_name).select("*").eq("phone", phone.strip()).execute()
            
            if not result.data:
                return None
            
            user_data = result.data[0]
            user_data['is_active'] = user_data.pop('active', True)
            
            return UserEntity.from_dict(user_data)
            
        except Exception as e:
            logger.error(f"Error finding user by phone {phone}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find user: {str(e)}")
    
    async def find_user_by_referral_code(self, referral_code: str) -> Optional[UserEntity]:
        try:
            result = self.supabase.table(self.table_name).select("*").eq("referral_code", referral_code).execute()
            
            if not result.data:
                return None
            
            user_data = result.data[0]
            user_data['is_active'] = user_data.pop('active', True)
            
            return UserEntity.from_dict(user_data)
            
        except Exception as e:
            logger.error(f"Error finding user by referral code {referral_code}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find user: {str(e)}")
    
    async def update_user(self, user_id: str, updates: dict) -> Optional[UserEntity]:
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            if 'is_active' in updates:
                updates['active'] = updates.pop('is_active')
            
            result = self.supabase.table(self.table_name).update(updates).eq("id", user_id).execute()
            
            if not result.data:
                raise ResourceNotFoundException("User", user_id)
            
            updated_user_data = result.data[0]
            updated_user_data['is_active'] = updated_user_data.pop('active', True)
            
            self._invalidate_user_cache(
                user_id, 
                updated_user_data.get('email'), 
                updated_user_data.get('phone')
            )
            
            return UserEntity.from_dict(updated_user_data)
            
        except ResourceNotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to update user: {str(e)}")
    
    async def delete_user(self, user_id: str) -> bool:
        try:
            result = self.supabase.table(self.table_name).update({
                'active': False,
                'updated_at': datetime.now().isoformat()
            }).eq("id", user_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to delete user: {str(e)}")
    
    async def find_users_by_owner(self, owner_id: str) -> List[UserEntity]:
        try:
            result = self.supabase.table(self.table_name).select("*").eq("owner_id", owner_id).eq("active", True).execute()
            
            users = []
            for user_data in result.data:
                user_data['is_active'] = user_data.pop('active', True)
                users.append(UserEntity.from_dict(user_data))
            
            return users
            
        except Exception as e:
            logger.error(f"Error finding users by owner {owner_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find users: {str(e)}")
    
    async def update_subscription_status(self, user_id: str, status: str, plan: str) -> bool:
        try:
            updates = {
                'subscription_status': status,
                'subscription_plan': plan,
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table(self.table_name).update(updates).eq("id", user_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error updating subscription for user {user_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to update subscription: {str(e)}")
    
    async def verify_email(self, user_id: str) -> bool:
        try:
            updates = {
                'email_confirmed': True,
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table(self.table_name).update(updates).eq("id", user_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error verifying email for user {user_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to verify email: {str(e)}")
    
    async def update_last_login(self, user_id: str) -> bool:
        try:
            updates = {
                'last_login': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table(self.table_name).update(updates).eq("id", user_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error updating last login for user {user_id}: {str(e)}")
            return False