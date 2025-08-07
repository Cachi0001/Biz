from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from datetime import datetime, date
from core.entities.enhanced_payment_entity import EnhancedPaymentEntity

class EnhancedPaymentRepositoryInterface(ABC):
    
    @abstractmethod
    async def create_payment(self, payment: EnhancedPaymentEntity) -> EnhancedPaymentEntity:
        """Create a new enhanced payment record"""
        pass
    
    @abstractmethod
    async def find_payment_by_id(self, payment_id: str, owner_id: str) -> Optional[EnhancedPaymentEntity]:
        """Find a payment by ID for a specific owner"""
        pass
    
    @abstractmethod
    async def find_payments_by_owner(self, owner_id: str, filters: Dict = None) -> List[EnhancedPaymentEntity]:
        """Find all payments for an owner with optional filters"""
        pass
    
    @abstractmethod
    async def find_payments_by_date_range(self, owner_id: str, start_date: date, end_date: date) -> List[EnhancedPaymentEntity]:
        """Find payments within a date range"""
        pass
    
    @abstractmethod
    async def find_pos_payments_by_date(self, owner_id: str, target_date: date) -> List[EnhancedPaymentEntity]:
        """Find all POS payments for a specific date"""
        pass
    
    @abstractmethod
    async def find_cash_payments_by_date(self, owner_id: str, target_date: date) -> List[EnhancedPaymentEntity]:
        """Find all cash payments for a specific date"""
        pass
    
    @abstractmethod
    async def update_payment(self, payment_id: str, updates: dict, owner_id: str) -> Optional[EnhancedPaymentEntity]:
        """Update a payment record"""
        pass
    
    @abstractmethod
    async def delete_payment(self, payment_id: str, owner_id: str) -> bool:
        """Delete a payment record"""
        pass
    
    @abstractmethod
    async def get_daily_payment_summary(self, owner_id: str, target_date: date) -> Dict:
        """Get daily payment summary with cash at hand and POS totals"""
        pass
    
    @abstractmethod
    async def get_payment_method_totals(self, owner_id: str, start_date: date, end_date: date) -> Dict:
        """Get payment totals grouped by payment method"""
        pass