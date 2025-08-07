from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from decimal import Decimal

class PaystackServiceInterface(ABC):
    
    @abstractmethod
    async def initialize_payment(self, email: str, amount: Decimal, 
                               reference: str = None, callback_url: str = None,
                               metadata: Dict = None) -> Dict:
        """Initialize a payment transaction"""
        pass
    
    @abstractmethod
    async def verify_payment(self, reference: str) -> Dict:
        """Verify a payment transaction"""
        pass
    
    @abstractmethod
    async def charge_authorization(self, authorization_code: str, email: str, 
                                 amount: Decimal, reference: str = None) -> Dict:
        """Charge a saved authorization"""
        pass
    
    @abstractmethod
    async def create_customer(self, email: str, first_name: str = None, 
                            last_name: str = None, phone: str = None) -> Dict:
        """Create a customer on Paystack"""
        pass
    
    @abstractmethod
    async def get_customer(self, customer_code: str) -> Dict:
        """Get customer details"""
        pass
    
    @abstractmethod
    async def list_transactions(self, customer_id: str = None, status: str = None,
                              from_date: str = None, to_date: str = None,
                              page: int = 1, per_page: int = 50) -> Dict:
        """List transactions with filters"""
        pass
    
    @abstractmethod
    async def create_plan(self, name: str, amount: Decimal, interval: str,
                         description: str = None, currency: str = "NGN") -> Dict:
        """Create a subscription plan"""
        pass
    
    @abstractmethod
    async def create_subscription(self, customer_code: str, plan_code: str,
                                authorization_code: str = None) -> Dict:
        """Create a subscription"""
        pass
    
    @abstractmethod
    async def cancel_subscription(self, subscription_code: str, token: str) -> Dict:
        """Cancel a subscription"""
        pass
    
    @abstractmethod
    async def get_subscription(self, subscription_code: str) -> Dict:
        """Get subscription details"""
        pass
    
    @abstractmethod
    async def create_transfer_recipient(self, account_number: str, bank_code: str,
                                      name: str, currency: str = "NGN") -> Dict:
        """Create a transfer recipient"""
        pass
    
    @abstractmethod
    async def initiate_transfer(self, recipient_code: str, amount: Decimal,
                              reason: str = None, reference: str = None) -> Dict:
        """Initiate a transfer"""
        pass
    
    @abstractmethod
    async def verify_account_number(self, account_number: str, bank_code: str) -> Dict:
        """Verify bank account number"""
        pass
    
    @abstractmethod
    async def get_banks(self) -> List[Dict]:
        """Get list of supported banks"""
        pass
    
    @abstractmethod
    async def handle_webhook(self, payload: Dict, signature: str) -> Dict:
        """Handle Paystack webhook events"""
        pass