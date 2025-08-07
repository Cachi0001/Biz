import logging
from typing import Dict
from datetime import datetime
from decimal import Decimal
import uuid

from core.entities.payment_entity import PaymentEntity, TransactionType, PaymentStatus
from core.interfaces.repositories.payment_repository_interface import PaymentRepositoryInterface
from core.interfaces.repositories.payment_method_repository_interface import PaymentMethodRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException

logger = logging.getLogger(__name__)

class RecordPaymentUseCase:
    
    def __init__(self, 
                 payment_repository: PaymentRepositoryInterface,
                 payment_method_repository: PaymentMethodRepositoryInterface):
        self.payment_repository = payment_repository
        self.payment_method_repository = payment_method_repository
    
    async def execute(self, payment_data: Dict, owner_id: str) -> Dict:
        validation_errors = await self._validate_payment_data(payment_data)
        if validation_errors:
            raise ValidationException("Payment validation failed", validation_errors)
        
        payment_id = str(uuid.uuid4())
        current_time = datetime.now()
        
        # Get payment method to validate POS requirements
        payment_method = await self.payment_method_repository.find_by_id(
            payment_data['payment_method_id']
        )
        
        if not payment_method:
            raise ValidationException("Invalid payment method", 
                                    {"payment_method_id": "Payment method not found"})
        
        # Determine if this is a POS transaction
        is_pos_transaction = payment_method.is_pos or payment_data.get('is_pos_transaction', False)
        
        payment = PaymentEntity(
            id=payment_id,
            owner_id=owner_id,
            amount=Decimal(str(payment_data['amount'])),
            payment_method_id=payment_data['payment_method_id'],
            status=PaymentStatus.COMPLETED,  # Default to completed for manual entries
            created_at=current_time,
            updated_at=current_time,
            description=payment_data.get('description', '').strip() or None,
            reference_number=payment_data.get('reference_number'),
            is_pos_transaction=is_pos_transaction,
            pos_account_name=payment_data.get('pos_account_name'),
            transaction_type=TransactionType(payment_data.get('transaction_type', 'Sale')),
            pos_reference_number=payment_data.get('pos_reference_number'),
            metadata=payment_data.get('metadata', {})
        )
        
        # Validate POS-specific fields
        pos_validation_errors = payment.validate_pos_fields()
        if pos_validation_errors:
            raise ValidationException("POS validation failed", pos_validation_errors)
        
        try:
            created_payment = await self.payment_repository.create_payment(payment)
            logger.info(f"Successfully recorded payment: {created_payment.id} for amount {created_payment.amount}")
            
            return {
                "success": True,
                "message": "Payment recorded successfully",
                "payment_id": created_payment.id,
                "amount": float(created_payment.amount),
                "transaction_type": created_payment.transaction_type.value,
                "is_pos_transaction": created_payment.is_pos_transaction
            }
            
        except Exception as e:
            logger.error(f"Failed to record payment: {str(e)}")
            raise
    
    async def _validate_payment_data(self, data: Dict) -> Dict:
        errors = {}
        
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
        transaction_type = data.get('transaction_type', 'Sale')
        valid_types = [t.value for t in TransactionType]
        if transaction_type not in valid_types:
            errors['transaction_type'] = f"Transaction type must be one of: {', '.join(valid_types)}"
        
        # Validate POS fields if POS transaction
        if data.get('is_pos_transaction', False):
            if not data.get('pos_account_name'):
                errors['pos_account_name'] = "POS account name is required for POS transactions"
            
            if not data.get('pos_reference_number'):
                errors['pos_reference_number'] = "POS reference number is required for POS transactions"
        
        return errors