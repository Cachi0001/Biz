from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from decimal import Decimal
from enum import Enum

class TransactionType(Enum):
    SALE = "Sale"
    REFUND = "Refund"
    DEPOSIT = "Deposit"
    WITHDRAWAL = "Withdrawal"

@dataclass
class EnhancedPaymentEntity:
    id: str
    owner_id: str
    amount: Decimal
    payment_method_id: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_pos_transaction: bool = False
    pos_account_name: Optional[str] = None
    transaction_type: TransactionType = TransactionType.SALE
    pos_reference_number: Optional[str] = None
    invoice_id: Optional[str] = None
    sale_id: Optional[str] = None
    
    def is_money_in(self) -> bool:
        """Check if this transaction brings money in"""
        return self.transaction_type in [TransactionType.SALE, TransactionType.DEPOSIT]
    
    def is_money_out(self) -> bool:
        """Check if this transaction takes money out"""
        return self.transaction_type in [TransactionType.REFUND, TransactionType.WITHDRAWAL]
    
    def requires_pos_details(self) -> bool:
        """Check if this payment requires POS details"""
        return self.is_pos_transaction
    
    def validate_pos_details(self) -> bool:
        """Validate that required POS details are present"""
        if not self.is_pos_transaction:
            return True
        return bool(self.pos_account_name and self.pos_reference_number)
    
    def get_transaction_direction(self) -> str:
        """Get human-readable transaction direction"""
        return "Money In" if self.is_money_in() else "Money Out"
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'amount': float(self.amount),
            'payment_method_id': self.payment_method_id,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_pos_transaction': self.is_pos_transaction,
            'pos_account_name': self.pos_account_name,
            'transaction_type': self.transaction_type.value,
            'pos_reference_number': self.pos_reference_number,
            'invoice_id': self.invoice_id,
            'sale_id': self.sale_id,
            'transaction_direction': self.get_transaction_direction(),
            'is_money_in': self.is_money_in(),
            'is_money_out': self.is_money_out()
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'EnhancedPaymentEntity':
        return cls(
            id=data['id'],
            owner_id=data['owner_id'],
            amount=Decimal(str(data['amount'])),
            payment_method_id=data['payment_method_id'],
            description=data.get('description'),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            is_pos_transaction=data.get('is_pos_transaction', False),
            pos_account_name=data.get('pos_account_name'),
            transaction_type=TransactionType(data.get('transaction_type', TransactionType.SALE.value)),
            pos_reference_number=data.get('pos_reference_number'),
            invoice_id=data.get('invoice_id'),
            sale_id=data.get('sale_id')
        )