from abc import ABC, abstractmethod
from typing import Dict, Any

class PaymentServiceInterface(ABC):
    
    @abstractmethod
    async def initialize_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize a payment transaction"""
        pass
    
    @abstractmethod
    async def verify_payment(self, reference: str) -> Dict[str, Any]:
        """Verify a payment transaction"""
        pass
    
    @abstractmethod
    async def process_refund(self, transaction_reference: str, amount: float = None, reason: str = None) -> Dict[str, Any]:
        """Process a refund for a transaction"""
        pass
    
    @abstractmethod
    async def get_payment_status(self, reference: str) -> str:
        """Get the current status of a payment"""
        pass
    
    @abstractmethod
    async def validate_webhook(self, payload: str, signature: str) -> bool:
        """Validate webhook signature"""
        pass
    
    @abstractmethod
    async def get_supported_banks(self, country: str = 'nigeria') -> Dict[str, Any]:
        """Get list of supported banks"""
        pass
    
    @abstractmethod
    async def resolve_account_number(self, account_number: str, bank_code: str) -> Dict[str, Any]:
        """Resolve account number to get account details"""
        pass
    
    @abstractmethod
    async def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a customer in the payment system"""
        pass