import logging
from typing import Dict
from datetime import datetime
from decimal import Decimal
import uuid

from core.entities.enhanced_payment_entity import EnhancedPaymentEntity, TransactionType
from core.interfaces.repositories.enhanced_payment_repository_interface import EnhancedPaymentRepositoryInterface
from core.interfaces.repositories.payment_method_repository_interface import PaymentMethodRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException, BusinessException

logger = logging.getLogger(__name__)

class RecordEnhancedPaymentUseCase:
    
    def __init__(
        self, 
        payment_repository: EnhancedPaymentRepositoryInterface,
        payment_method_repository: PaymentMethodRepositoryInterface
    ):
        self.payment_repository = payment_repository
        self.payment_method_repository = payment_method_repository
    
    async def execute(self, payment_data: Dict, owner_id: str) -> Dict:
        """Record an enhanced payment with POS integration support"""
        
        # Validate input data
        validation_errors = await self._validate_payment_data(payment_data)
        if validation_errors:
            raise ValidationException("Payment validation failed", validation_errors)
        
        # Verify payment method exists
        payment_method = await self.payment_method_repository.find_method_by_id(
            payment_data['payment_method_id']
        )
        if not payment_method:
            raise BusinessException("Invalid payment method selected")
        
        # Create payment entity
        payment_id = str(uuid.uuid4())
        current_time = datetime.now()
        
        payment = EnhancedPaymentEntity(
            id=payment_id,
            owner_id=owner_id,
            amount=Decimal(str(payment_data['amount'])),
            payment_method_id=payment_data['payment_method_id'],
            description=payment_data.get('description', '').strip() or None,
            created_at=current_time,
            updated_at=current_time,
            is_pos_transaction=payment_data.get('is_pos_transaction', False),
            pos_account_name=payment_data.get('pos_account_name', '').strip() or None,
            transaction_type=TransactionType(payment_data.get('transaction_type', TransactionType.SALE.value)),
            pos_reference_number=payment_data.get('pos_reference_number', '').strip() or None,
            invoice_id=payment_data.get('invoice_id'),
            sale_id=payment_data.get('sale_id')
        )
        
        # Validate POS details if required
        if payment.is_pos_transaction and not payment.validate_pos_details():
            raise ValidationException("POS transaction requires account name and reference number")
        
        try:
            created_payment = await self.payment_repository.create_payment(payment)
            logger.info(f"Successfully recorded enhanced payment: {created_payment.id}")
            
            return {
                "success": True,
                "message": "Payment recorded successfully",
                "payment_id": created_payment.id,
                "amount": float(created_payment.amount),
                "transaction_type": created_payment.transaction_type.value,
                "is_pos_transaction": created_payment.is_pos_transaction,
                "transaction_direction": created_payment.get_transaction_direction()
            }
            
        except Exception as e:
            logger.error(f"Failed to record enhanced payment: {str(e)}")
            raise BusinessException(f"Failed to record payment: {str(e)}")
    
    async def _validate_payment_data(self, data: Dict) -> Dict:
        """Validate payment data"""
        errors = {}
        
        # Required fields
        required_fields = ['amount', 'payment_method_id']
        for field in required_fields:
            if not data.get(field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        # Validate amount
        try:
            amount = float(data.get('amount', 0))
            if amount <= 0:
                errors['amount'] = "Amount must be greater than 0"
        except (ValueError, TypeError):
            errors['amount'] = "Amount must be a valid number"
        
        # Validate transaction type
        transaction_type = data.get('transaction_type', TransactionType.SALE.value)
        try:
            TransactionType(transaction_type)
        except ValueError:
            errors['transaction_type'] = "Invalid transaction type"
        
        # Validate POS transaction requirements
        is_pos = data.get('is_pos_transaction', False)
        if is_pos:
            if not data.get('pos_account_name', '').strip():
                errors['pos_account_name'] = "POS account name is required for POS transactions"
            if not data.get('pos_reference_number', '').strip():
                errors['pos_reference_number'] = "POS reference number is required for POS transactions"
        
        return errors