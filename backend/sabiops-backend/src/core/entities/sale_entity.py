from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from enum import Enum

class PaymentMethod(Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"
    MOBILE_MONEY = "mobile_money"
    CREDIT = "credit"

class PaymentStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    CREDIT = "credit"

class SaleStatus(Enum):
    COMPLETED = "completed"
    PENDING = "pending"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

@dataclass
class SaleItemEntity:
    product_id: str
    product_name: str
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal
    total_price: Decimal
    total_cost: Decimal
    profit: Decimal
    
    def calculate_totals(self) -> None:
        """Calculate total price, cost, and profit"""
        self.total_price = Decimal(str(self.quantity)) * self.unit_price
        self.total_cost = Decimal(str(self.quantity)) * self.unit_cost
        self.profit = self.total_price - self.total_cost

@dataclass
class SaleEntity:
    id: str
    owner_id: str
    customer_id: Optional[str]
    customer_name: str
    items: List[SaleItemEntity]
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    total_cogs: Decimal
    profit_from_sales: Decimal
    payment_method: PaymentMethod
    status: SaleStatus
    sale_date: date
    created_at: datetime
    updated_at: datetime
    # Payment tracking fields
    payment_status: PaymentStatus
    amount_paid: Decimal
    amount_due: Decimal
    salesperson_id: Optional[str] = None
    customer_email: Optional[str] = None
    currency: str = "NGN"
    description: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    
    def calculate_totals(self) -> None:
        """Calculate all totals from items"""
        self.subtotal = sum(item.total_price for item in self.items)
        self.total_cogs = sum(item.total_cost for item in self.items)
        self.total_amount = self.subtotal - self.discount_amount + self.tax_amount
        self.profit_from_sales = self.total_amount - self.total_cogs
        # Initialize payment tracking fields if not already set
        if not hasattr(self, 'payment_status') or self.payment_status is None:
            self.payment_status = PaymentStatus.COMPLETED
        if not hasattr(self, 'amount_paid') or self.amount_paid is None:
            self.amount_paid = self.total_amount
        if not hasattr(self, 'amount_due') or self.amount_due is None:
            self.amount_due = Decimal('0')
    
    def add_item(self, item: SaleItemEntity) -> None:
        """Add item to sale and recalculate totals"""
        item.calculate_totals()
        self.items.append(item)
        self.calculate_totals()
        self.updated_at = datetime.now()
    
    def remove_item(self, product_id: str) -> bool:
        """Remove item from sale and recalculate totals"""
        original_count = len(self.items)
        self.items = [item for item in self.items if item.product_id != product_id]
        
        if len(self.items) < original_count:
            self.calculate_totals()
            self.updated_at = datetime.now()
            return True
        return False
    
    def apply_discount(self, discount_amount: Decimal) -> None:
        """Apply discount to sale"""
        self.discount_amount = discount_amount
        self.calculate_totals()
        self.updated_at = datetime.now()
    
    def get_profit_margin(self) -> Decimal:
        """Calculate profit margin percentage"""
        if self.total_amount == 0:
            return Decimal('0')
        return (self.profit_from_sales / self.total_amount) * Decimal('100')
    
    def is_profitable(self) -> bool:
        """Check if sale is profitable"""
        return self.profit_from_sales > 0
    
    def to_dict(self) -> dict:
        """Convert entity to dictionary"""
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'items': [
                {
                    'product_id': item.product_id,
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'unit_cost': float(item.unit_cost),
                    'total_price': float(item.total_price),
                    'total_cost': float(item.total_cost),
                    'profit': float(item.profit)
                }
                for item in self.items
            ],
            'subtotal': float(self.subtotal),
            'discount_amount': float(self.discount_amount),
            'tax_amount': float(self.tax_amount),
            'total_amount': float(self.total_amount),
            'total_cogs': float(self.total_cogs),
            'profit_from_sales': float(self.profit_from_sales),
            'payment_method': self.payment_method.value,
            'payment_status': self.payment_status.value,
            'status': self.status.value,
            'date': self.sale_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'amount_paid': float(self.amount_paid),
            'amount_due': float(self.amount_due),
            'salesperson_id': self.salesperson_id,
            'customer_email': self.customer_email,
            'currency': self.currency,
            'description': self.description,
            'reference_id': self.reference_id,
            'notes': self.notes,
            'reference_number': self.reference_number,
            'profit_margin': float(self.get_profit_margin())
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'SaleEntity':
        """Create entity from dictionary"""
        items = []
        for item_data in data.get('items', []):
            items.append(SaleItemEntity(
                product_id=item_data['product_id'],
                product_name=item_data['product_name'],
                quantity=item_data['quantity'],
                unit_price=Decimal(str(item_data['unit_price'])),
                unit_cost=Decimal(str(item_data['unit_cost'])),
                total_price=Decimal(str(item_data['total_price'])),
                total_cost=Decimal(str(item_data['total_cost'])),
                profit=Decimal(str(item_data['profit']))
            ))
        
        return cls(
            id=data['id'],
            owner_id=data['owner_id'],
            customer_id=data.get('customer_id'),
            customer_name=data['customer_name'],
            items=items,
            subtotal=Decimal(str(data['subtotal'])),
            discount_amount=Decimal(str(data.get('discount_amount', 0))),
            tax_amount=Decimal(str(data.get('tax_amount', 0))),
            total_amount=Decimal(str(data['total_amount'])),
            total_cogs=Decimal(str(data['total_cogs'])),
            profit_from_sales=Decimal(str(data['profit_from_sales'])),
            payment_method=PaymentMethod(data['payment_method']),
            payment_status=PaymentStatus(data.get('payment_status', 'completed')),
            status=SaleStatus(data.get('status', 'completed')),
            sale_date=datetime.fromisoformat(data['date']).date() if isinstance(data['date'], str) else data['date'],
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at'],
            updated_at=datetime.fromisoformat(data['updated_at']) if isinstance(data['updated_at'], str) else data['updated_at'],
            amount_paid=Decimal(str(data.get('amount_paid', data['total_amount']))),
            amount_due=Decimal(str(data.get('amount_due', 0))),
            salesperson_id=data.get('salesperson_id'),
            customer_email=data.get('customer_email'),
            currency=data.get('currency', 'NGN'),
            description=data.get('description'),
            reference_id=data.get('reference_id'),
            notes=data.get('notes'),
            reference_number=data.get('reference_number')
        )