from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional
from enum import Enum
from decimal import Decimal

class ExpenseCategory(Enum):
    OFFICE_SUPPLIES = "Office Supplies"
    MARKETING = "Marketing"
    UTILITIES = "Utilities"
    RENT = "Rent"
    TRANSPORTATION = "Transportation"
    MEALS = "Meals & Entertainment"
    EQUIPMENT = "Equipment"
    SOFTWARE = "Software & Subscriptions"
    PROFESSIONAL_SERVICES = "Professional Services"
    INSURANCE = "Insurance"
    TAXES = "Taxes"
    OTHER = "Other"

class ExpenseStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

@dataclass
class ExpenseEntity:
    id: str
    owner_id: str
    category: ExpenseCategory
    amount: Decimal
    description: str
    expense_date: date
    status: ExpenseStatus
    created_at: datetime
    updated_at: datetime
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    
    def is_approved(self) -> bool:
        return self.status == ExpenseStatus.APPROVED
    
    def is_pending(self) -> bool:
        return self.status == ExpenseStatus.PENDING
    
    def approve(self) -> None:
        self.status = ExpenseStatus.APPROVED
        self.updated_at = datetime.now()
    
    def reject(self) -> None:
        self.status = ExpenseStatus.REJECTED
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'category': self.category.value,
            'amount': float(self.amount),
            'description': self.description,
            'expense_date': self.expense_date.isoformat(),
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'receipt_url': self.receipt_url,
            'notes': self.notes
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ExpenseEntity':
        return cls(
            id=data['id'],
            owner_id=data['owner_id'],
            category=ExpenseCategory(data['category']),
            amount=Decimal(str(data['amount'])),
            description=data['description'],
            expense_date=date.fromisoformat(data['expense_date']),
            status=ExpenseStatus(data['status']),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            receipt_url=data.get('receipt_url'),
            notes=data.get('notes')
        )