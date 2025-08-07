from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum
from decimal import Decimal

class ProductStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"

class StockStatus(Enum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"

@dataclass
class ProductEntity:
    id: str
    owner_id: str
    name: str
    sku: str
    category: str
    description: Optional[str]
    unit_price: Decimal
    cost_price: Decimal
    quantity: int
    low_stock_threshold: int
    status: ProductStatus
    created_at: datetime
    updated_at: datetime
    image_url: Optional[str] = None
    barcode: Optional[str] = None
    unit_of_measure: str = "piece"
    
    def get_stock_status(self) -> StockStatus:
        if self.quantity == 0:
            return StockStatus.OUT_OF_STOCK
        elif self.quantity <= self.low_stock_threshold:
            return StockStatus.LOW_STOCK
        return StockStatus.IN_STOCK
    
    def is_low_stock(self) -> bool:
        return self.quantity <= self.low_stock_threshold
    
    def is_out_of_stock(self) -> bool:
        return self.quantity == 0
    
    def calculate_profit_margin(self) -> Decimal:
        if self.unit_price == 0:
            return Decimal('0')
        return ((self.unit_price - self.cost_price) / self.unit_price) * 100
    
    def calculate_inventory_value(self) -> Decimal:
        return self.cost_price * Decimal(str(self.quantity))
    
    def reduce_stock(self, quantity: int) -> bool:
        if quantity <= 0:
            return False
        if self.quantity < quantity:
            return False
        
        self.quantity -= quantity
        self.updated_at = datetime.now()
        return True
    
    def increase_stock(self, quantity: int) -> bool:
        if quantity <= 0:
            return False
        
        self.quantity += quantity
        self.updated_at = datetime.now()
        return True
    
    def update_pricing(self, unit_price: Decimal, cost_price: Decimal) -> None:
        self.unit_price = unit_price
        self.cost_price = cost_price
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'sku': self.sku,
            'category': self.category,
            'description': self.description,
            'unit_price': float(self.unit_price),
            'cost_price': float(self.cost_price),
            'quantity': self.quantity,
            'low_stock_threshold': self.low_stock_threshold,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'image_url': self.image_url,
            'barcode': self.barcode,
            'unit_of_measure': self.unit_of_measure,
            'stock_status': self.get_stock_status().value,
            'is_low_stock': self.is_low_stock(),
            'profit_margin': float(self.calculate_profit_margin()),
            'inventory_value': float(self.calculate_inventory_value())
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ProductEntity':
        return cls(
            id=data['id'],
            owner_id=data['owner_id'],
            name=data['name'],
            sku=data['sku'],
            category=data['category'],
            description=data.get('description'),
            unit_price=Decimal(str(data['unit_price'])),
            cost_price=Decimal(str(data['cost_price'])),
            quantity=data['quantity'],
            low_stock_threshold=data['low_stock_threshold'],
            status=ProductStatus(data['status']),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            image_url=data.get('image_url'),
            barcode=data.get('barcode'),
            unit_of_measure=data.get('unit_of_measure', 'piece')
        )