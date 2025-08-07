import logging
from typing import Dict
from datetime import datetime
from decimal import Decimal
import uuid

from core.entities.sale_payment_entity import SalePaymentEntity
from core.entities.sale_entity import PaymentStatus
from core.interfaces.repositories.sales_repository_interface import SalesRepositoryInterface
from core.interfaces.repositories.sale_payment_repository_interface import SalePaymentRepositoryInterface
from core.interfaces.repositories.payment_method_repository_interface import PaymentMethodRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException, BusinessException

logger = logging.getLogger(__name__)

class ProcessPartialPaymentUseCase:
    
    def __init__(
        self,
        sales_repository: SalesRepositoryInterface,
        sale_payment_repository: SalePaymentRepositoryInterface,
        payment_method_repository: PaymentMethodRepositoryInterface
    ):
        self.sales_repository = sales_repository
        self.sale_payment_repository = sale_payment_repository
        self.payment_method_repository = payment_method_repository
    
    async def execute(self, payment_data: Dict, user_id: str) -> Dict:
        """Process a partial payment for a credit sale"""
        
        # Validate input data
        validation_errors = await self._validate_payment_data(payment_data)
        if validation_errors:
            raise ValidationException("Partial payment validation failed", validation_errors)
        
        # Get the sale
        sale = await self.sales_repository.find_sale_by_id(
            payment_data['sale_id'], user_id
        )
        if not sale:
            raise BusinessException("Sale not found")
        
        # Check if sale allows partial payments
        if not sale.allows_partial_payments():
            raise BusinessException("This sale does not allow partial payments")
        
        # Verify payment method exists
        payment_method = await self.payment_method_repository.find_method_by_id(
            payment_data['payment_method_id']
        )
        if not payment_method:
            raise BusinessException("Invalid payment method selected")
        
        # Validate payment amount
        payment_amount = Decimal(str(payment_data['amount_paid']))
        if payment_amount > sale.amount_due:
            raise BusinessException(f"Payment amount (₦{payment_amount}) cannot exceed amount due (₦{sale.amount_due})")
        
        try:
            # Create sale payment record
            payment_id = str(uuid.uuid4())
            current_time = datetime.now()
            
            sale_payment = SalePaymentEntity(
                id=payment_id,
                sale_id=sale.id,
                payment_id=None,  # This could link to a main payment record if needed
                amount_paid=payment_amount,
                payment_date=current_time,
                payment_method_id=payment_data['payment_method_id'],
                notes=payment_data.get('notes', '').strip() or None,
                created_by=user_id,
                created_at=current_time,
                updated_at=current_time
            )
            
            # Save the payment record
            created_payment = await self.sale_payment_repository.create_sale_payment(sale_payment)
            
            # Update the sale amounts
            new_amount_paid = sale.amount_paid + payment_amount
            new_amount_due = sale.amount_due - payment_amount
            
            # Determine new payment status
            if new_amount_due <= 0:
                new_payment_status = PaymentStatus.PAID
            elif new_amount_paid > 0:
                new_payment_status = PaymentStatus.PARTIALLY_PAID
            else:
                new_payment_status = sale.payment_status
            
            # Update the sale
            sale_updates = {
                'amount_paid': float(new_amount_paid),
                'amount_due': float(new_amount_due),
                'payment_status': new_payment_status.value,
                'payment_method_id': payment_data['payment_method_id']  # Update to latest payment method
            }
            
            updated_sale = await self.sales_repository.update_sale(
                sale.id, sale_updates, user_id
            )
            
            if not updated_sale:
                raise BusinessException("Failed to update sale after payment")
            
            logger.info(f"Processed partial payment: ₦{payment_amount} for sale {sale.id}")
            
            return {
                "success": True,
                "message": "Partial payment processed successfully",
                "payment_id": created_payment.id,
                "sale_id": sale.id,
                "amount_paid": float(payment_amount),
                "new_amount_paid": float(new_amount_paid),
                "new_amount_due": float(new_amount_due),
                "new_payment_status": new_payment_status.value,
                "is_fully_paid": new_payment_status == PaymentStatus.PAID
            }
            
        except Exception as e:
            logger.error(f"Failed to process partial payment: {str(e)}")
            raise BusinessException(f"Failed to process payment: {str(e)}")
    
    async def _validate_payment_data(self, data: Dict) -> Dict:
        """Validate partial payment data"""
        errors = {}
        
        # Required fields
        required_fields = ['sale_id', 'amount_paid', 'payment_method_id']
        for field in required_fields:
            if not data.get(field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        # Validate amount
        try:
            amount = float(data.get('amount_paid', 0))
            if amount <= 0:
                errors['amount_paid'] = "Payment amount must be greater than 0"
        except (ValueError, TypeError):
            errors['amount_paid'] = "Payment amount must be a valid number"
        
        return errors