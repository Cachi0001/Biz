from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from datetime import datetime
from core.entities.subscription_entity import SubscriptionEntity

class SubscriptionRepositoryInterface(ABC):
    
    @abstractmethod
    async def create_subscription(self, subscription: SubscriptionEntity) -> SubscriptionEntity:
        pass
    
    @abstractmethod
    async def find_subscription_by_id(self, subscription_id: str) -> Optional[SubscriptionEntity]:
        pass
    
    @abstractmethod
    async def find_active_subscription_by_user(self, user_id: str) -> Optional[SubscriptionEntity]:
        pass
    
    @abstractmethod
    async def find_subscriptions_by_user(self, user_id: str) -> List[SubscriptionEntity]:
        pass
    
    @abstractmethod
    async def update_subscription(self, subscription_id: str, updates: dict) -> Optional[SubscriptionEntity]:
        pass
    
    @abstractmethod
    async def cancel_subscription(self, subscription_id: str) -> bool:
        pass
    
    @abstractmethod
    async def get_expiring_subscriptions(self, days_ahead: int = 7) -> List[SubscriptionEntity]:
        pass
    
    @abstractmethod
    async def get_subscription_statistics(self, start_date: datetime = None, end_date: datetime = None) -> Dict:
        pass