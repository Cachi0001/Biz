from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from decimal import Decimal

@dataclass
class SalePaymentEntity:
    id: str
    sale_id: str
    payment_id: Optional[str]
    amount_paid: Decimal
    payment_date: datetime
    payment_method_id: str
    notes: Optional[str]
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    def is_valid_amount(self) -> bool:
        """Check if the payment amount is valid"""
        return self.amount_paid > 0
    
    def has_notes(self) -> bool:
        """Check if payment has notes"""
        return bool(self.notes and self.notes.strip())
    
    def is_recent(self, days: int = 7) -> bool:
        """Check if payment was made recently"""
        from datetime import timedelta
        cutoff_date = datetime.now() - timedelta(days=days)
        return self.payment_date >= cutoff_date
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'sale_id': self.sale_id,
            'payment_id': self.payment_id,
            'amount_paid': float(self.amount_paid),
            'payment_date': self.payment_date.isoformat(),
            'payment_method_id': self.payment_method_id,
            'notes': self.notes,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'has_notes': self.has_notes(),
            'is_recent': self.is_recent()
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'SalePaymentEntity':
        return cls(
            id=data['id'],
            sale_id=data['sale_id'],
            payment_id=data.get('payment_id'),
            amount_paid=Decimal(str(data['amount_paid'])),
            payment_date=datetime.fromisoformat(data['payment_date']),
            payment_method_id=data['payment_method_id'],
            notes=data.get('notes'),
            created_by=data['created_by'],
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at'])
        )