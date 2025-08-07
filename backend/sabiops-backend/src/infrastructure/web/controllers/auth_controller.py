import logging
from flask import request, jsonify
from typing import Dict, Any

from core.use_cases.user.authenticate_user_use_case import AuthenticateUserUseCase
from core.use_cases.user.register_user_use_case import RegisterUserUseCase
from shared.exceptions.business_exceptions import (
    ValidationException, 
    AuthenticationFailedException,
    DuplicateResourceException,
    BusinessException
)
from infrastructure.config.dependency_injection import get_container

logger = logging.getLogger(__name__)

class AuthController:
    
    def __init__(self):
        self.container = get_container()
    
    async def login(self) -> Dict[str, Any]:
        try:
            data = request.get_json()
            if not data:
                return self._error_response("Request body is required", 400)
            
            email = data.get('email', '').strip()
            password = data.get('password', '')
            
            # Execute authentication use case
            authenticate_use_case = self.container.get(AuthenticateUserUseCase)
            result = await authenticate_use_case.execute(email, password)
            
            return self._success_response("Login successful", result)
            
        except ValidationException as e:
            logger.warning(f"Login validation error: {e.message}")
            return self._validation_error_response(e.message, e.field_errors)
            
        except AuthenticationFailedException as e:
            logger.warning(f"Authentication failed: {e.message}")
            return self._error_response(e.message, 401)
            
        except Exception as e:
            logger.error(f"Unexpected error during login: {str(e)}")
            return self._error_response("Login failed due to system error", 500)
    
    async def register(self) -> Dict[str, Any]:
        """Handle user registration request"""
        try:
            # Get request data
            data = request.get_json()
            if not data:
                return self._error_response("Request body is required", 400)
            
            # Execute registration use case
            register_use_case = self.container.get(RegisterUserUseCase)
            result = await register_use_case.execute(data)
            
            return self._success_response("Registration successful", result, 201)
            
        except ValidationException as e:
            logger.warning(f"Registration validation error: {e.message}")
            return self._validation_error_response(e.message, e.field_errors)
            
        except DuplicateResourceException as e:
            logger.warning(f"Duplicate resource error: {e.message}")
            return self._error_response(e.message, 409)
            
        except Exception as e:
            logger.error(f"Unexpected error during registration: {str(e)}")
            return self._error_response("Registration failed due to system error", 500)
    
    async def refresh_token(self) -> Dict[str, Any]:
        """Handle token refresh request"""
        try:
            # Get current user from JWT token
            # This would require JWT middleware to extract user info
            # For now, return not implemented
            return self._error_response("Token refresh not implemented yet", 501)
            
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {str(e)}")
            return self._error_response("Token refresh failed", 500)
    
    async def logout(self) -> Dict[str, Any]:
        """Handle user logout request"""
        try:
            # For JWT-based auth, logout is typically handled client-side
            # Server-side logout would require token blacklisting
            return self._success_response("Logout successful", {})
            
        except Exception as e:
            logger.error(f"Unexpected error during logout: {str(e)}")
            return self._error_response("Logout failed", 500)
    
    async def verify_email(self) -> Dict[str, Any]:
        """Handle email verification request"""
        try:
            # Get request data
            data = request.get_json()
            if not data:
                return self._error_response("Request body is required", 400)
            
            token = data.get('token', '').strip()
            email = data.get('email', '').strip()
            
            if not token or not email:
                return self._error_response("Token and email are required", 400)
            
            # This would require an email verification use case
            # For now, return not implemented
            return self._error_response("Email verification not implemented yet", 501)
            
        except Exception as e:
            logger.error(f"Unexpected error during email verification: {str(e)}")
            return self._error_response("Email verification failed", 500)
    
    async def resend_verification(self) -> Dict[str, Any]:
        """Handle resend verification email request"""
        try:
            # Get request data
            data = request.get_json()
            if not data:
                return self._error_response("Request body is required", 400)
            
            email = data.get('email', '').strip()
            
            if not email:
                return self._error_response("Email is required", 400)
            
            # This would require a resend verification use case
            # For now, return not implemented
            return self._error_response("Resend verification not implemented yet", 501)
            
        except Exception as e:
            logger.error(f"Unexpected error during resend verification: {str(e)}")
            return self._error_response("Resend verification failed", 500)
    
    def _success_response(self, message: str, data: Dict = None, status_code: int = 200) -> Dict[str, Any]:
        """Create a success response"""
        response = {
            "success": True,
            "message": message
        }
        
        if data:
            response["data"] = data
        
        return response, status_code
    
    def _error_response(self, message: str, status_code: int = 400) -> Dict[str, Any]:
        """Create an error response"""
        return {
            "success": False,
            "error": {
                "message": message,
                "code": "ERROR"
            }
        }, status_code
    
    def _validation_error_response(self, message: str, field_errors: Dict = None) -> Dict[str, Any]:
        """Create a validation error response"""
        response = {
            "success": False,
            "error": {
                "message": message,
                "code": "VALIDATION_ERROR"
            }
        }
        
        if field_errors:
            response["error"]["field_errors"] = field_errors
        
        return response, 422