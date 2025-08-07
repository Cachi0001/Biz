from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from datetime import datetime, date
from core.entities.payment_entity import PaymentEntity

class PaymentRepositoryInterface(ABC):
    
    @abstractmethod
    async def create_payment(self, payment: PaymentEntity) -> PaymentEntity:
        pass
    
    @abstractmethod
    async def find_payment_by_id(self, payment_id: str, owner_id: str) -> Optional[PaymentEntity]:
        pass
    
    @abstractmethod
    async def find_payments_by_owner(self, owner_id: str, filters: Dict = None) -> List[PaymentEntity]:
        pass
    
    @abstractmethod
    async def update_payment(self, payment_id: str, updates: dict, owner_id: str) -> Optional[PaymentEntity]:
        pass
    
    @abstractmethod
    async def delete_payment(self, payment_id: str, owner_id: str) -> bool:
        pass
    
    @abstractmethod
    async def find_payments_by_invoice(self, invoice_id: str, owner_id: str) -> List[PaymentEntity]:
        pass
    
    @abstractmethod
    async def find_payments_by_sale(self, sale_id: str, owner_id: str) -> List[PaymentEntity]:
        pass
    
    @abstractmethod
    async def get_payment_statistics(self, owner_id: str, start_date: datetime = None, end_date: datetime = None) -> Dict:
        pass
    
    @abstractmethod
    async def get_daily_cash_summary(self, owner_id: str, target_date: date) -> Dict:
        pass