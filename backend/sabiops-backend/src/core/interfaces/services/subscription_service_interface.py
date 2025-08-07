from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from datetime import datetime
from core.entities.subscription_entity import SubscriptionEntity

class SubscriptionServiceInterface(ABC):
    
    @abstractmethod
    async def create_subscription(self, user_id: str, plan: str, payment_reference: str) -> SubscriptionEntity:
        """Create a new subscription for a user"""
        pass
    
    @abstractmethod
    async def get_user_subscription(self, user_id: str) -> Optional[SubscriptionEntity]:
        """Get the current subscription for a user"""
        pass
    
    @abstractmethod
    async def update_subscription_status(self, subscription_id: str, status: str) -> SubscriptionEntity:
        """Update subscription status"""
        pass
    
    @abstractmethod
    async def cancel_subscription(self, subscription_id: str, reason: str = None) -> SubscriptionEntity:
        """Cancel a subscription"""
        pass
    
    @abstractmethod
    async def renew_subscription(self, subscription_id: str, new_end_date: datetime) -> SubscriptionEntity:
        """Renew a subscription"""
        pass
    
    @abstractmethod
    async def get_expiring_subscriptions(self, days_ahead: int = 7) -> List[SubscriptionEntity]:
        """Get subscriptions expiring within specified days"""
        pass
    
    @abstractmethod
    async def process_subscription_payment(self, subscription_id: str, payment_data: Dict) -> Dict:
        """Process payment for subscription"""
        pass
    
    @abstractmethod
    async def get_subscription_analytics(self, start_date: datetime, end_date: datetime) -> Dict:
        """Get subscription analytics for date range"""
        pass
    
    @abstractmethod
    async def enforce_usage_limits(self, user_id: str, feature: str) -> Dict:
        """Check and enforce usage limits for a feature"""
        pass
    
    @abstractmethod
    async def log_subscription_change(self, user_id: str, action: str, old_plan: str = None, 
                                    new_plan: str = None, reason: str = None) -> str:
        """Log subscription changes for audit"""
        pass