import logging
from typing import Dict
from datetime import timedelta

from core.interfaces.repositories.user_repository_interface import UserRepositoryInterface
from core.interfaces.services.encryption_service_interface import EncryptionServiceInterface
from shared.exceptions.business_exceptions import (
    AuthenticationFailedException, 
    ValidationException,
    ResourceNotFoundException
)

logger = logging.getLogger(__name__)

class AuthenticateUserUseCase:
    """Use case for authenticating users with email and password"""
    
    def __init__(
        self, 
        user_repository: UserRepositoryInterface,
        encryption_service: EncryptionServiceInterface
    ):
        self.user_repository = user_repository
        self.encryption_service = encryption_service
    
    async def execute(self, email: str, password: str) -> Dict:
        """
        Authenticate a user with email and password
        
        Args:
            email: User's email address
            password: User's plain text password
            
        Returns:
            Dict containing access token and user information
            
        Raises:
            ValidationException: If input validation fails
            AuthenticationFailedException: If authentication fails
        """
        # Input validation
        validation_errors = {}
        
        if not email or not email.strip():
            validation_errors['email'] = "Email is required"
        elif not self._is_valid_email(email):
            validation_errors['email'] = "Invalid email format"
            
        if not password or not password.strip():
            validation_errors['password'] = "Password is required"
            
        if validation_errors:
            raise ValidationException("Validation failed", validation_errors)
        
        # Normalize email
        email = email.strip().lower()
        
        try:
            # Find user by email
            user = await self.user_repository.find_user_by_email(email)
            if not user:
                logger.warning(f"Authentication attempt with non-existent email: {email}")
                raise AuthenticationFailedException("Invalid email or password")
            
            # Check if user account is active
            if not user.is_active:
                logger.warning(f"Authentication attempt with deactivated account: {email}")
                raise AuthenticationFailedException("Account is deactivated. Please contact support.")
            
            # Check if email is confirmed
            if not user.email_confirmed:
                logger.warning(f"Authentication attempt with unconfirmed email: {email}")
                raise AuthenticationFailedException("Please verify your email before logging in")
            
            # Verify password
            if not self.encryption_service.verify_password(password, user.password_hash):
                logger.warning(f"Failed password verification for user: {email}")
                raise AuthenticationFailedException("Invalid email or password")
            
            # Generate access token
            access_token = self.encryption_service.generate_jwt_token(
                user.id, 
                expires_delta=timedelta(hours=24)
            )
            
            # Update last login timestamp
            try:
                await self.user_repository.update_last_login(user.id)
            except Exception as e:
                logger.warning(f"Failed to update last login for user {user.id}: {str(e)}")
                # Don't fail authentication if last login update fails
            
            logger.info(f"Successful authentication for user: {email}")
            
            # Return authentication result
            return {
                "access_token": access_token,
                "token_type": "Bearer",
                "expires_in": 86400,  # 24 hours in seconds
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "business_name": user.business_name,
                    "phone": user.phone,
                    "role": user.role.value,
                    "subscription_plan": user.subscription_plan.value,
                    "subscription_status": user.subscription_status.value,
                    "trial_days_left": user.trial_days_left,
                    "email_confirmed": user.email_confirmed,
                    "is_trial_active": user.is_trial_active(),
                    "is_subscription_active": user.is_subscription_active(),
                    "effective_owner_id": user.get_effective_owner_id()
                }
            }
            
        except (ValidationException, AuthenticationFailedException):
            raise
        except Exception as e:
            logger.error(f"Unexpected error during authentication for {email}: {str(e)}")
            raise AuthenticationFailedException("Authentication failed due to system error")
    
    def _is_valid_email(self, email: str) -> bool:
        """Basic email validation"""
        if not email or '@' not in email:
            return False
        
        parts = email.split('@')
        if len(parts) != 2:
            return False
        
        local, domain = parts
        if not local or not domain:
            return False
        
        if '.' not in domain:
            return False
            
        return True