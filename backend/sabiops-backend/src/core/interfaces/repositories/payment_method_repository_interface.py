from abc import ABC, abstractmethod
from typing import Optional, List
from core.entities.payment_method_entity import PaymentMethodEntity

class PaymentMethodRepositoryInterface(ABC):
    
    @abstractmethod
    async def find_all_active_methods(self) -> List[PaymentMethodEntity]:
        """Find all active payment methods"""
        pass
    
    @abstractmethod
    async def find_method_by_id(self, method_id: str) -> Optional[PaymentMethodEntity]:
        """Find a payment method by ID"""
        pass
    
    @abstractmethod
    async def find_method_by_name(self, name: str) -> Optional[PaymentMethodEntity]:
        """Find a payment method by name"""
        pass
    
    @abstractmethod
    async def find_pos_methods(self) -> List[PaymentMethodEntity]:
        """Find all POS payment methods"""
        pass
    
    @abstractmethod
    async def find_cash_methods(self) -> List[PaymentMethodEntity]:
        """Find all cash payment methods"""
        pass
    
    @abstractmethod
    async def find_digital_methods(self) -> List[PaymentMethodEntity]:
        """Find all digital payment methods"""
        pass
    
    @abstractmethod
    async def create_method(self, method: PaymentMethodEntity) -> PaymentMethodEntity:
        """Create a new payment method (admin only)"""
        pass
    
    @abstractmethod
    async def update_method(self, method_id: str, updates: dict) -> Optional[PaymentMethodEntity]:
        """Update a payment method (admin only)"""
        pass