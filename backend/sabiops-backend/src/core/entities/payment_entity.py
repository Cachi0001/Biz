from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum
from decimal import Decimal

class PaymentStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class TransactionType(Enum):
    SALE = "Sale"
    REFUND = "Refund"
    DEPOSIT = "Deposit"
    WITHDRAWAL = "Withdrawal"

@dataclass
class PaymentEntity:
    id: str
    owner_id: str
    amount: Decimal
    status: PaymentStatus
    payment_method: str
    created_at: datetime
    updated_at: datetime
    currency: str = "NGN"
    invoice_id: Optional[str] = None
    sale_id: Optional[str] = None
    payment_reference: Optional[str] = None
    paid_at: Optional[datetime] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    phone: Optional[str] = None
    customer_phone: Optional[str] = None
    payment_method_id: Optional[str] = None
    is_pos_transaction: bool = False
    pos_account_name: Optional[str] = None
    transaction_type: str = "Sale"
    pos_reference_number: Optional[str] = None
    
    def is_completed(self) -> bool:
        return self.status == PaymentStatus.COMPLETED
    
    def is_pending(self) -> bool:
        return self.status == PaymentStatus.PENDING
    
    def is_failed(self) -> bool:
        return self.status == PaymentStatus.FAILED
    
    def is_pos_payment(self) -> bool:
        return self.is_pos_transaction
    
    def is_cash_payment(self) -> bool:
        return self.payment_method.lower() == 'cash'
    
    def complete_payment(self) -> None:
        if self.status == PaymentStatus.PENDING:
            self.status = PaymentStatus.COMPLETED
            self.paid_at = datetime.now()
            self.updated_at = datetime.now()
    
    def fail_payment(self) -> None:
        if self.status == PaymentStatus.PENDING:
            self.status = PaymentStatus.FAILED
            self.updated_at = datetime.now()
    
    def cancel_payment(self) -> None:
        if self.status in [PaymentStatus.PENDING, PaymentStatus.FAILED]:
            self.status = PaymentStatus.CANCELLED
            self.updated_at = datetime.now()
    
    def refund_payment(self) -> None:
        if self.status == PaymentStatus.COMPLETED:
            self.status = PaymentStatus.REFUNDED
            self.updated_at = datetime.now()
    
    def get_transaction_type_enum(self) -> TransactionType:
        try:
            return TransactionType(self.transaction_type)
        except ValueError:
            return TransactionType.SALE
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'invoice_id': self.invoice_id,
            'sale_id': self.sale_id,
            'amount': float(self.amount),
            'status': self.status.value,
            'payment_reference': self.payment_reference,
            'payment_method': self.payment_method,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'currency': self.currency,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'description': self.description,
            'notes': self.notes,
            'reference_number': self.reference_number,
            'phone': self.phone,
            'customer_phone': self.customer_phone,
            'payment_method_id': self.payment_method_id,
            'is_pos_transaction': self.is_pos_transaction,
            'pos_account_name': self.pos_account_name,
            'transaction_type': self.transaction_type,
            'pos_reference_number': self.pos_reference_number
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'PaymentEntity':
        return cls(
            id=data['id'],
            owner_id=data['owner_id'],
            invoice_id=data.get('invoice_id'),
            sale_id=data.get('sale_id'),
            amount=Decimal(str(data['amount'])),
            status=PaymentStatus(data.get('status', 'pending')),
            payment_reference=data.get('payment_reference'),
            payment_method=data.get('payment_method', 'cash'),
            paid_at=datetime.fromisoformat(data['paid_at']) if data.get('paid_at') else None,
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            currency=data.get('currency', 'NGN'),
            customer_email=data.get('customer_email'),
            customer_name=data.get('customer_name'),
            description=data.get('description'),
            notes=data.get('notes'),
            reference_number=data.get('reference_number'),
            phone=data.get('phone'),
            customer_phone=data.get('customer_phone'),
            payment_method_id=data.get('payment_method_id'),
            is_pos_transaction=data.get('is_pos_transaction', False),
            pos_account_name=data.get('pos_account_name'),
            transaction_type=data.get('transaction_type', 'Sale'),
            pos_reference_number=data.get('pos_reference_number')
        )