class BusinessException(Exception):
    """Base exception for all business logic errors"""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code or self.__class__.__name__.upper()
        super().__init__(self.message)

class ValidationException(BusinessException):
    """Exception raised when input validation fails"""
    
    def __init__(self, message: str, field_errors: dict = None):
        super().__init__(message, "VALIDATION_ERROR")
        self.field_errors = field_errors or {}

class AuthenticationFailedException(BusinessException):
    """Exception raised when user authentication fails"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "AUTH_FAILED")

class AuthorizationFailedException(BusinessException):
    """Exception raised when user lacks required permissions"""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, "ACCESS_DENIED")

class ResourceNotFoundException(BusinessException):
    """Exception raised when a requested resource is not found"""
    
    def __init__(self, resource_type: str, identifier: str):
        message = f"{resource_type} with identifier '{identifier}' not found"
        super().__init__(message, "RESOURCE_NOT_FOUND")
        self.resource_type = resource_type
        self.identifier = identifier

class DuplicateResourceException(BusinessException):
    """Exception raised when attempting to create a resource that already exists"""
    
    def __init__(self, resource_type: str, field: str, value: str):
        message = f"{resource_type} with {field} '{value}' already exists"
        super().__init__(message, "DUPLICATE_RESOURCE")
        self.resource_type = resource_type
        self.field = field
        self.value = value

class DatabaseOperationException(BusinessException):
    """Exception raised when database operations fail"""
    
    def __init__(self, message: str):
        super().__init__(message, "DATABASE_ERROR")

class ExternalServiceException(BusinessException):    
    def __init__(self, service_name: str, message: str):
        super().__init__(f"{service_name}: {message}", "EXTERNAL_SERVICE_ERROR")
        self.service_name = service_name

class SubscriptionLimitExceededException(BusinessException):    
    def __init__(self, feature: str, limit: int, current_usage: int):
        message = f"Subscription limit exceeded for {feature}. Limit: {limit}, Current usage: {current_usage}"
        super().__init__(message, "SUBSCRIPTION_LIMIT_EXCEEDED")
        self.feature = feature
        self.limit = limit
        self.current_usage = current_usage

class InsufficientInventoryException(BusinessException):
    """Exception raised when there's insufficient inventory for a sale"""
    
    def __init__(self, product_name: str, available: int, requested: int):
        message = f"Insufficient inventory for {product_name}. Available: {available}, Requested: {requested}"
        super().__init__(message, "INSUFFICIENT_INVENTORY")
        self.product_name = product_name
        self.available = available
        self.requested = requested