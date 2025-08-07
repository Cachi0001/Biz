import logging
from typing import Dict
from datetime import datetime
from decimal import Decimal

from core.entities.sale_entity import PaymentStatus
from core.interfaces.repositories.sales_repository_interface import SalesRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException, BusinessException

logger = logging.getLogger(__name__)

class UpdateSalePaymentStatusUseCase:
    
    def __init__(self, sales_repository: SalesRepositoryInterface):
        self.sales_repository = sales_repository
    
    async def execute(self, sale_id: str, payment_data: Dict, owner_id: str) -> Dict:
        validation_errors = self._validate_payment_data(payment_data)
        if validation_errors:
            raise ValidationException("Payment validation failed", validation_errors)
        
        # Get current sale
        sale = await self.sales_repository.find_sale_by_id(sale_id, owner_id)
        if not sale:
            raise BusinessException("Sale not found")
        
        # Check if sale can be updated
        if sale.payment_status == PaymentStatus.PAID:
            raise BusinessException("Cannot update payment for already paid sale")
        
        amount_paid = Decimal(str(payment_data['amount_paid']))
        
        # Validate payment amount
        if amount_paid <= 0:
            raise ValidationException("Payment amount must be greater than 0")
        
        if amount_paid > sale.amount_due:
            raise ValidationException("Payment amount cannot exceed amount due")
        
        try:
            updated_sale = await self.sales_repository.update_payment_status(
                sale_id, 
                payment_data.get('payment_status', 'partially_paid'),
                float(amount_paid),
                owner_id
            )
            
            if not updated_sale:
                raise BusinessException("Failed to update sale payment status")
            
            logger.info(f"Successfully updated payment status for sale: {sale_id}")
            
            return {
                "success": True,
                "message": "Payment status updated successfully",
                "sale_id": updated_sale.id,
                "payment_status": updated_sale.payment_status.value,
                "amount_paid": float(updated_sale.amount_paid),
                "amount_due": float(updated_sale.amount_due),
                "is_fully_paid": updated_sale.payment_status == PaymentStatus.PAID
            }
            
        except Exception as e:
            logger.error(f"Failed to update sale payment status: {str(e)}")
            raise
    
    def _validate_payment_data(self, data: Dict) -> Dict:
        errors = {}
        
        if not data.get('amount_paid'):
            errors['amount_paid'] = "Payment amount is required"
        else:
            try:
                amount = float(data['amount_paid'])
                if amount <= 0:
                    errors['amount_paid'] = "Payment amount must be greater than 0"
            except (ValueError, TypeError):
                errors['amount_paid'] = "Payment amount must be a valid number"
        
        return errors