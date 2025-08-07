from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from datetime import datetime

class BaseServiceInterface(ABC):
    """Base interface for all services in the application"""
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the service with required dependencies"""
        pass
    
    @abstractmethod
    async def cleanup(self) -> None:
        """Clean up resources when service is destroyed"""
        pass
    
    @abstractmethod
    def get_service_name(self) -> str:
        """Return the name of the service for logging and identification"""
        pass
    
    @abstractmethod
    def get_service_version(self) -> str:
        """Return the version of the service"""
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check and return status"""
        pass

class CacheableServiceInterface(BaseServiceInterface):
    """Interface for services that support caching"""
    
    @abstractmethod
    async def clear_cache(self, key: Optional[str] = None) -> bool:
        """Clear cache for specific key or all cache"""
        pass
    
    @abstractmethod
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        pass

class AuditableServiceInterface(BaseServiceInterface):
    """Interface for services that require audit logging"""
    
    @abstractmethod
    async def log_action(self, action: str, user_id: str, details: Dict[str, Any]) -> None:
        """Log an action for audit purposes"""
        pass
    
    @abstractmethod
    async def get_audit_trail(self, entity_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit trail for an entity"""
        pass

class NotificationServiceInterface(BaseServiceInterface):
    """Interface for notification services"""
    
    @abstractmethod
    async def send_notification(self, recipient: str, message: str, notification_type: str, metadata: Dict[str, Any] = None) -> bool:
        """Send a notification"""
        pass
    
    @abstractmethod
    async def schedule_notification(self, recipient: str, message: str, scheduled_time: datetime, notification_type: str) -> str:
        """Schedule a notification for later delivery"""
        pass
    
    @abstractmethod
    async def cancel_scheduled_notification(self, notification_id: str) -> bool:
        """Cancel a scheduled notification"""
        pass

class PaymentServiceInterface(BaseServiceInterface):
    """Interface for payment processing services"""
    
    @abstractmethod
    async def process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a payment"""
        pass
    
    @abstractmethod
    async def verify_payment(self, payment_reference: str) -> Dict[str, Any]:
        """Verify a payment status"""
        pass
    
    @abstractmethod
    async def refund_payment(self, payment_id: str, amount: float, reason: str) -> Dict[str, Any]:
        """Process a refund"""
        pass

class AnalyticsServiceInterface(CacheableServiceInterface):
    """Interface for analytics services"""
    
    @abstractmethod
    async def calculate_metrics(self, metric_type: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate specific metrics"""
        pass
    
    @abstractmethod
    async def generate_report(self, report_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate analytics report"""
        pass
    
    @abstractmethod
    async def get_trends(self, entity_type: str, time_period: str) -> List[Dict[str, Any]]:
        """Get trend data for entity"""
        pass