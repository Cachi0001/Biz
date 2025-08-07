from abc import ABC, abstractmethod
from typing import Optional, List
from core.entities.sale_payment_entity import SalePaymentEntity

class SalePaymentRepositoryInterface(ABC):
    
    @abstractmethod
    async def create_sale_payment(self, sale_payment: SalePaymentEntity) -> SalePaymentEntity:
        """Create a new sale payment record"""
        pass
    
    @abstractmethod
    async def find_payments_by_sale_id(self, sale_id: str) -> List[SalePaymentEntity]:
        """Find all payments for a specific sale"""
        pass
    
    @abstractmethod
    async def find_payment_by_id(self, payment_id: str) -> Optional[SalePaymentEntity]:
        """Find a sale payment by ID"""
        pass
    
    @abstractmethod
    async def update_sale_payment(self, payment_id: str, updates: dict) -> Optional[SalePaymentEntity]:
        """Update a sale payment record"""
        pass
    
    @abstractmethod
    async def delete_sale_payment(self, payment_id: str) -> bool:
        """Delete a sale payment record"""
        pass
    
    @abstractmethod
    async def get_total_payments_for_sale(self, sale_id: str) -> float:
        """Get total amount paid for a sale"""
        pass
    
    @abstractmethod
    async def find_recent_payments(self, days: int = 7) -> List[SalePaymentEntity]:
        """Find recent sale payments"""
        pass