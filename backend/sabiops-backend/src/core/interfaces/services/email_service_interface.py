from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

class EmailServiceInterface(ABC):
    
    @abstractmethod
    async def send_email(self, to_email: str, subject: str, body: str, 
                        is_html: bool = False, attachments: List[Dict] = None) -> Dict:
        """Send a single email"""
        pass
    
    @abstractmethod
    async def send_bulk_email(self, recipients: List[str], subject: str, body: str, 
                             is_html: bool = False) -> Dict:
        """Send email to multiple recipients"""
        pass
    
    @abstractmethod
    async def send_template_email(self, to_email: str, template_name: str, 
                                 template_data: Dict, attachments: List[Dict] = None) -> Dict:
        """Send email using a template"""
        pass
    
    @abstractmethod
    async def send_verification_email(self, to_email: str, verification_token: str, 
                                     user_name: str = None) -> Dict:
        """Send email verification email"""
        pass
    
    @abstractmethod
    async def send_password_reset_email(self, to_email: str, reset_token: str, 
                                       user_name: str = None) -> Dict:
        """Send password reset email"""
        pass
    
    @abstractmethod
    async def send_subscription_notification(self, to_email: str, notification_type: str, 
                                           subscription_data: Dict) -> Dict:
        """Send subscription-related notifications"""
        pass
    
    @abstractmethod
    async def send_invoice_email(self, to_email: str, invoice_data: Dict, 
                                pdf_attachment: bytes = None) -> Dict:
        """Send invoice via email"""
        pass
    
    @abstractmethod
    async def send_low_stock_alert(self, to_email: str, product_data: Dict) -> Dict:
        """Send low stock alert email"""
        pass
    
    @abstractmethod
    async def validate_email_address(self, email: str) -> bool:
        """Validate email address format and deliverability"""
        pass
    
    @abstractmethod
    async def get_email_status(self, message_id: str) -> Dict:
        """Get delivery status of sent email"""
        pass