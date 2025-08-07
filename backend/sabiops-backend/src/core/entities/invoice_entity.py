from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from enum import Enum
from decimal import Decimal

class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

@dataclass
class InvoiceItemEntity:
    product_id: str
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    description: Optional[str] = None
    
    def calculate_total(self) -> Decimal:
        return Decimal(str(self.quantity)) * self.unit_price

@dataclass
class InvoiceEntity:
    id: str
    owner_id: str
    customer_id: str
    customer_name: str
    invoice_number: str
    status: InvoiceStatus
    items: List[InvoiceItemEntity]
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    
    def calculate_subtotal(self) -> Decimal:
        return sum(item.calculate_total() for item in self.items)
    
    def calculate_total(self) -> Decimal:
        subtotal = self.calculate_subtotal()
        return subtotal + self.tax_amount - self.discount_amount
    
    def is_overdue(self) -> bool:
        if not self.due_date or self.status == InvoiceStatus.PAID:
            return False
        return datetime.now() > self.due_date
    
    def mark_as_paid(self, paid_date: Optional[datetime] = None) -> None:
        self.status = InvoiceStatus.PAID
        self.paid_date = paid_date or datetime.now()
        self.updated_at = datetime.now()
    
    def add_item(self, item: InvoiceItemEntity) -> None:
        self.items.append(item)
        self.subtotal = self.calculate_subtotal()
        self.total_amount = self.calculate_total()
        self.updated_at = datetime.now()
    
    def remove_item(self, product_id: str) -> bool:
        original_count = len(self.items)
        self.items = [item for item in self.items if item.product_id != product_id]
        
        if len(self.items) < original_count:
            self.subtotal = self.calculate_subtotal()
            self.total_amount = self.calculate_total()
            self.updated_at = datetime.now()
            return True
        return False
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'invoice_number': self.invoice_number,
            'status': self.status.value,
            'items': [
                {
                    'product_id': item.product_id,
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                    'description': item.description
                }
                for item in self.items
            ],
            'subtotal': float(self.subtotal),
            'tax_amount': float(self.tax_amount),
            'discount_amount': float(self.discount_amount),
            'total_amount': float(self.total_amount),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'notes': self.notes,
            'payment_terms': self.payment_terms
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'InvoiceEntity':
        items = []
        for item_data in data.get('items', []):
            items.append(InvoiceItemEntity(
                product_id=item_data['product_id'],
                product_name=item_data['product_name'],
                quantity=item_data['quantity'],
                unit_price=Decimal(str(item_data['unit_price'])),
                total_price=Decimal(str(item_data['total_price'])),
                description=item_data.get('description')
            ))
        
        return cls(
            id=data['id'],
            owner_id=data['owner_id'],
            customer_id=data['customer_id'],
            customer_name=data['customer_name'],
            invoice_number=data['invoice_number'],
            status=InvoiceStatus(data['status']),
            items=items,
            subtotal=Decimal(str(data['subtotal'])),
            tax_amount=Decimal(str(data['tax_amount'])),
            discount_amount=Decimal(str(data['discount_amount'])),
            total_amount=Decimal(str(data['total_amount'])),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
            paid_date=datetime.fromisoformat(data['paid_date']) if data.get('paid_date') else None,
            notes=data.get('notes'),
            payment_terms=data.get('payment_terms')
        )