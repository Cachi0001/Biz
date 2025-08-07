from typing import Dict, Any, Optional

class ServiceException(Exception):
    """Base exception for all service-related errors"""
    
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code or "SERVICE_ERROR"
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details
        }

class ServiceInitializationException(ServiceException):
    """Exception raised when service fails to initialize"""
    
    def __init__(self, service_name: str, reason: str, details: Dict[str, Any] = None):
        message = f"Failed to initialize service '{service_name}': {reason}"
        super().__init__(message, "SERVICE_INIT_ERROR", details)
        self.service_name = service_name

class ServiceUnavailableException(ServiceException):
    """Exception raised when service is temporarily unavailable"""
    
    def __init__(self, service_name: str, reason: str = None):
        message = f"Service '{service_name}' is currently unavailable"
        if reason:
            message += f": {reason}"
        super().__init__(message, "SERVICE_UNAVAILABLE")
        self.service_name = service_name

class CacheException(ServiceException):
    """Exception raised for cache-related errors"""
    
    def __init__(self, operation: str, reason: str, cache_key: str = None):
        message = f"Cache {operation} failed: {reason}"
        details = {"cache_key": cache_key} if cache_key else {}
        super().__init__(message, "CACHE_ERROR", details)

class PaymentProcessingException(ServiceException):
    """Exception raised for payment processing errors"""
    
    def __init__(self, payment_reference: str, reason: str, gateway_error: str = None):
        message = f"Payment processing failed for {payment_reference}: {reason}"
        details = {"payment_reference": payment_reference}
        if gateway_error:
            details["gateway_error"] = gateway_error
        super().__init__(message, "PAYMENT_ERROR", details)

class NotificationException(ServiceException):
    """Exception raised for notification delivery errors"""
    
    def __init__(self, recipient: str, notification_type: str, reason: str):
        message = f"Failed to send {notification_type} notification to {recipient}: {reason}"
        details = {"recipient": recipient, "notification_type": notification_type}
        super().__init__(message, "NOTIFICATION_ERROR", details)

class AnalyticsException(ServiceException):
    """Exception raised for analytics calculation errors"""
    
    def __init__(self, metric_type: str, reason: str, filters: Dict[str, Any] = None):
        message = f"Analytics calculation failed for {metric_type}: {reason}"
        details = {"metric_type": metric_type, "filters": filters}
        super().__init__(message, "ANALYTICS_ERROR", details)

class SearchException(ServiceException):
    """Exception raised for search operation errors"""
    
    def __init__(self, query: str, reason: str, search_type: str = None):
        message = f"Search operation failed: {reason}"
        details = {"query": query, "search_type": search_type}
        super().__init__(message, "SEARCH_ERROR", details)

class SyncException(ServiceException):
    """Exception raised for data synchronization errors"""
    
    def __init__(self, entity_type: str, entity_id: str, reason: str):
        message = f"Sync failed for {entity_type} {entity_id}: {reason}"
        details = {"entity_type": entity_type, "entity_id": entity_id}
        super().__init__(message, "SYNC_ERROR", details)

class DataIntegrityException(ServiceException):
    """Exception raised for data integrity violations"""
    
    def __init__(self, entity_type: str, validation_error: str, entity_data: Dict[str, Any] = None):
        message = f"Data integrity violation in {entity_type}: {validation_error}"
        details = {"entity_type": entity_type, "entity_data": entity_data}
        super().__init__(message, "DATA_INTEGRITY_ERROR", details)

class ExternalServiceException(ServiceException):
    """Exception raised for external service integration errors"""
    
    def __init__(self, service_name: str, operation: str, reason: str, response_data: Dict[str, Any] = None):
        message = f"External service '{service_name}' {operation} failed: {reason}"
        details = {"service_name": service_name, "operation": operation, "response_data": response_data}
        super().__init__(message, "EXTERNAL_SERVICE_ERROR", details)

class ConfigurationException(ServiceException):
    """Exception raised for configuration-related errors"""
    
    def __init__(self, config_key: str, reason: str):
        message = f"Configuration error for '{config_key}': {reason}"
        details = {"config_key": config_key}
        super().__init__(message, "CONFIG_ERROR", details)

class RateLimitException(ServiceException):
    """Exception raised when rate limits are exceeded"""
    
    def __init__(self, service_name: str, limit: int, window: str, retry_after: Optional[int] = None):
        message = f"Rate limit exceeded for {service_name}: {limit} requests per {window}"
        details = {"service_name": service_name, "limit": limit, "window": window, "retry_after": retry_after}
        super().__init__(message, "RATE_LIMIT_ERROR", details)