import logging
from typing import Dict
from datetime import datetime, timedelta
import uuid
import secrets
import string
import re

from core.entities.user_entity import UserEntity, UserRole, SubscriptionPlan, SubscriptionStatus
from core.interfaces.repositories.user_repository_interface import UserRepositoryInterface
from core.interfaces.services.encryption_service_interface import EncryptionServiceInterface
from shared.exceptions.business_exceptions import ValidationException, DuplicateResourceException

logger = logging.getLogger(__name__)

class RegisterUserUseCase:
    
    def __init__(
        self, 
        user_repository: UserRepositoryInterface,
        encryption_service: EncryptionServiceInterface
    ):
        self.user_repository = user_repository
        self.encryption_service = encryption_service
    
    async def execute(self, registration_data: Dict) -> Dict:
        validation_errors = self._validate_registration_data(registration_data)
        if validation_errors:
            raise ValidationException("Registration validation failed", validation_errors)
        
        email = registration_data['email'].strip().lower()
        phone = registration_data.get('phone', '').strip()
        password = registration_data['password']
        full_name = registration_data['full_name'].strip()
        business_name = registration_data.get('business_name', '').strip()
        referral_code_used = registration_data.get('referral_code', '').strip()
        
        await self._check_existing_users(email, phone)
        
        referred_by_id = None
        if referral_code_used:
            referred_by_id = await self._process_referral_code(referral_code_used)
        
        user_id = str(uuid.uuid4())
        password_hash = self.encryption_service.hash_password(password)
        referral_code = self._generate_referral_code()
        verification_token = self.encryption_service.generate_secure_token(32)
        
        trial_start_date = datetime.now()
        trial_end_date = trial_start_date + timedelta(days=7)
        
        user = UserEntity(
            id=user_id,
            email=email,
            full_name=full_name,
            password_hash=password_hash,
            phone=phone if phone else None,
            business_name=business_name if business_name else None,
            role=UserRole.OWNER,
            subscription_plan=SubscriptionPlan.WEEKLY,
            subscription_status=SubscriptionStatus.TRIAL,
            created_at=trial_start_date,
            updated_at=trial_start_date,
            is_active=True,
            email_confirmed=False,
            trial_days_left=7,
            subscription_start_date=trial_start_date,
            subscription_end_date=trial_end_date,
            referral_code=referral_code,
            referred_by=referred_by_id
        )
        
        try:
            created_user = await self.user_repository.create_user(user)
            logger.info(f"Successfully registered new user: {email}")
            
            return {
                "success": True,
                "message": "Registration successful. Please check your email to confirm your account.",
                "user_id": created_user.id,
                "email": created_user.email,
                "verification_token": verification_token,
                "trial_days_left": created_user.trial_days_left,
                "referral_code": created_user.referral_code
            }
            
        except Exception as e:
            logger.error(f"Failed to register user {email}: {str(e)}")
            raise
    
    def _validate_registration_data(self, data: Dict) -> Dict:
        errors = {}
        
        required_fields = ['email', 'password', 'full_name']
        for field in required_fields:
            if not data.get(field) or not data.get(field).strip():
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        email = data.get('email', '').strip()
        if email and not self._is_valid_email(email):
            errors['email'] = "Invalid email format"
        
        password = data.get('password', '')
        if password:
            password_errors = self._validate_password_strength(password)
            if password_errors:
                errors['password'] = password_errors
        
        phone = data.get('phone', '').strip()
        if phone and not self._is_valid_phone(phone):
            errors['phone'] = "Invalid phone number format"
        
        full_name = data.get('full_name', '').strip()
        if full_name and len(full_name) < 2:
            errors['full_name'] = "Full name must be at least 2 characters long"
        
        business_name = data.get('business_name', '').strip()
        if business_name and len(business_name) < 2:
            errors['business_name'] = "Business name must be at least 2 characters long"
        
        return errors
    
    def _is_valid_email(self, email: str) -> bool:
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, email) is not None
    
    def _is_valid_phone(self, phone: str) -> bool:
        digits_only = re.sub(r'\D', '', phone)
        return len(digits_only) >= 10
    
    def _validate_password_strength(self, password: str) -> str:
        if len(password) < 8:
            return "Password must be at least 8 characters long"
        
        if not re.search(r'[A-Za-z]', password):
            return "Password must contain at least one letter"
        
        if not re.search(r'\d', password):
            return "Password must contain at least one number"
        
        return ""
    
    async def _check_existing_users(self, email: str, phone: str) -> None:
        existing_user = await self.user_repository.find_user_by_email(email)
        if existing_user:
            if existing_user.email_confirmed:
                raise DuplicateResourceException("User", "email", email)
            else:
                logger.info(f"User with email {email} exists but not confirmed")
        
        if phone:
            existing_phone_user = await self.user_repository.find_user_by_phone(phone)
            if existing_phone_user:
                raise DuplicateResourceException("User", "phone", phone)
    
    async def _process_referral_code(self, referral_code: str) -> str:
        try:
            referrer = await self.user_repository.find_user_by_referral_code(referral_code)
            if referrer and referrer.is_active:
                logger.info(f"Valid referral code used: {referral_code} from user {referrer.id}")
                return referrer.id
            else:
                logger.warning(f"Invalid or inactive referral code used: {referral_code}")
                return None
        except Exception as e:
            logger.error(f"Error processing referral code {referral_code}: {str(e)}")
            return None
    
    def _generate_referral_code(self) -> str:
        return "SABI" + ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))