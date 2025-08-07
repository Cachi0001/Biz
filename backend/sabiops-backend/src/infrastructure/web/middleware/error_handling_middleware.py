import logging
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException
from typing import Dict, Any

from shared.exceptions.business_exceptions import (
    BusinessException,
    ValidationException,
    AuthenticationFailedException,
    AuthorizationFailedException,
    ResourceNotFoundException,
    DuplicateResourceException,
    DatabaseOperationException,
    ExternalServiceException,
    SubscriptionLimitExceededException,
    InsufficientInventoryException
)

logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware:
    """Middleware for handling application errors and exceptions"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize error handling for Flask application"""
        self.app = app
        self._register_error_handlers()
    
    def _register_error_handlers(self):
        """Register all error handlers with Flask"""
        
        # Business exceptions
        self.app.register_error_handler(ValidationException, self._handle_validation_exception)
        self.app.register_error_handler(AuthenticationFailedException, self._handle_authentication_exception)
        self.app.register_error_handler(AuthorizationFailedException, self._handle_authorization_exception)
        self.app.register_error_handler(ResourceNotFoundException, self._handle_not_found_exception)
        self.app.register_error_handler(DuplicateResourceException, self._handle_duplicate_resource_exception)
        self.app.register_error_handler(DatabaseOperationException, self._handle_database_exception)
        self.app.register_error_handler(ExternalServiceException, self._handle_external_service_exception)
        self.app.register_error_handler(SubscriptionLimitExceededException, self._handle_subscription_limit_exception)
        self.app.register_error_handler(InsufficientInventoryException, self._handle_inventory_exception)
        self.app.register_error_handler(BusinessException, self._handle_business_exception)
        
        # HTTP exceptions
        self.app.register_error_handler(400, self._handle_bad_request)
        self.app.register_error_handler(401, self._handle_unauthorized)
        self.app.register_error_handler(403, self._handle_forbidden)
        self.app.register_error_handler(404, self._handle_not_found)
        self.app.register_error_handler(405, self._handle_method_not_allowed)
        self.app.register_error_handler(429, self._handle_rate_limit_exceeded)
        self.app.register_error_handler(500, self._handle_internal_server_error)
        
        # Generic exception handler
        self.app.register_error_handler(Exception, self._handle_generic_exception)
    
    def _handle_validation_exception(self, error: ValidationException):
        """Handle validation errors"""
        logger.warning(f"Validation error: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "validation_error"
            }
        }
        
        if error.field_errors:
            response["error"]["field_errors"] = error.field_errors
        
        return jsonify(response), 422
    
    def _handle_authentication_exception(self, error: AuthenticationFailedException):
        """Handle authentication errors"""
        logger.warning(f"Authentication error: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "authentication_error"
            }
        }
        
        return jsonify(response), 401
    
    def _handle_authorization_exception(self, error: AuthorizationFailedException):
        """Handle authorization errors"""
        logger.warning(f"Authorization error: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "authorization_error"
            }
        }
        
        return jsonify(response), 403
    
    def _handle_not_found_exception(self, error: ResourceNotFoundException):
        """Handle resource not found errors"""
        logger.info(f"Resource not found: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "not_found_error",
                "resource_type": error.resource_type,
                "identifier": error.identifier
            }
        }
        
        return jsonify(response), 404
    
    def _handle_duplicate_resource_exception(self, error: DuplicateResourceException):
        """Handle duplicate resource errors"""
        logger.warning(f"Duplicate resource error: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "duplicate_resource_error",
                "resource_type": error.resource_type,
                "field": error.field,
                "value": error.value
            }
        }
        
        return jsonify(response), 409
    
    def _handle_database_exception(self, error: DatabaseOperationException):
        """Handle database operation errors"""
        logger.error(f"Database error: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": "A database error occurred. Please try again later.",
                "type": "database_error"
            }
        }
        
        return jsonify(response), 500
    
    def _handle_external_service_exception(self, error: ExternalServiceException):
        """Handle external service errors"""
        logger.error(f"External service error: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": f"External service temporarily unavailable: {error.service_name}",
                "type": "external_service_error",
                "service": error.service_name
            }
        }
        
        return jsonify(response), 503
    
    def _handle_subscription_limit_exception(self, error: SubscriptionLimitExceededException):
        """Handle subscription limit exceeded errors"""
        logger.info(f"Subscription limit exceeded: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "subscription_limit_error",
                "feature": error.feature,
                "limit": error.limit,
                "current_usage": error.current_usage
            }
        }
        
        return jsonify(response), 402
    
    def _handle_inventory_exception(self, error: InsufficientInventoryException):
        """Handle insufficient inventory errors"""
        logger.warning(f"Insufficient inventory: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "inventory_error",
                "product": error.product_name,
                "available": error.available,
                "requested": error.requested
            }
        }
        
        return jsonify(response), 400
    
    def _handle_business_exception(self, error: BusinessException):
        """Handle generic business exceptions"""
        logger.warning(f"Business error: {error.message}")
        
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "type": "business_error"
            }
        }
        
        return jsonify(response), 400
    
    def _handle_bad_request(self, error: HTTPException):
        """Handle 400 Bad Request errors"""
        logger.warning(f"Bad request: {error.description}")
        
        response = {
            "success": False,
            "error": {
                "code": "BAD_REQUEST",
                "message": error.description or "Bad request",
                "type": "http_error"
            }
        }
        
        return jsonify(response), 400
    
    def _handle_unauthorized(self, error: HTTPException):
        """Handle 401 Unauthorized errors"""
        logger.warning(f"Unauthorized access attempt from {request.remote_addr}")
        
        response = {
            "success": False,
            "error": {
                "code": "UNAUTHORIZED",
                "message": "Authentication required",
                "type": "http_error"
            }
        }
        
        return jsonify(response), 401
    
    def _handle_forbidden(self, error: HTTPException):
        """Handle 403 Forbidden errors"""
        logger.warning(f"Forbidden access attempt from {request.remote_addr}")
        
        response = {
            "success": False,
            "error": {
                "code": "FORBIDDEN",
                "message": "Access denied",
                "type": "http_error"
            }
        }
        
        return jsonify(response), 403
    
    def _handle_not_found(self, error: HTTPException):
        """Handle 404 Not Found errors"""
        logger.info(f"Not found: {request.url}")
        
        response = {
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested resource was not found",
                "type": "http_error"
            }
        }
        
        return jsonify(response), 404
    
    def _handle_method_not_allowed(self, error: HTTPException):
        """Handle 405 Method Not Allowed errors"""
        logger.warning(f"Method not allowed: {request.method} {request.url}")
        
        response = {
            "success": False,
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": f"Method {request.method} not allowed for this endpoint",
                "type": "http_error"
            }
        }
        
        return jsonify(response), 405
    
    def _handle_rate_limit_exceeded(self, error: HTTPException):
        """Handle 429 Rate Limit Exceeded errors"""
        logger.warning(f"Rate limit exceeded from {request.remote_addr}")
        
        response = {
            "success": False,
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please try again later.",
                "type": "http_error"
            }
        }
        
        return jsonify(response), 429
    
    def _handle_internal_server_error(self, error: HTTPException):
        """Handle 500 Internal Server Error"""
        logger.error(f"Internal server error: {str(error)}")
        
        response = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred. Please try again later.",
                "type": "http_error"
            }
        }
        
        return jsonify(response), 500
    
    def _handle_generic_exception(self, error: Exception):
        """Handle any unhandled exceptions"""
        logger.error(f"Unhandled exception: {str(error)}", exc_info=True)
        
        response = {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "type": "system_error"
            }
        }
        
        return jsonify(response), 500