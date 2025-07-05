from src.models.base import db, GUID, get_id_column
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    # UUID primary key to match Supabase schema
    id = get_id_column()
    user_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(15, 2), nullable=False)  # Changed from unit_price to price
    cost_price = db.Column(db.Numeric(15, 2))
    quantity = db.Column(db.Integer, default=0)  # Changed from quantity_in_stock to quantity
    low_stock_threshold = db.Column(db.Integer, default=5)  # Changed from minimum_stock_level
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(500))  # Aligned with Supabase schema
    sku = db.Column(db.String(50))
    active = db.Column(db.Boolean, default=True)  # Changed from is_active to active
    
    # Timestamps - Aligned with Supabase schema
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    invoice_items = db.relationship('InvoiceItem', backref='product', lazy=True)

    def __repr__(self):
        return f'<Product {self.name}>'

    def to_dict(self):
        """Convert product object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'sku': self.sku,
            'category': self.category,
            'unit_price': float(self.unit_price) if self.unit_price else 0,
            'cost_price': float(self.cost_price) if self.cost_price else 0,
            'quantity_in_stock': self.quantity_in_stock,
            'minimum_stock_level': self.minimum_stock_level,
            'unit_of_measure': self.unit_of_measure,
            'tax_rate': float(self.tax_rate) if self.tax_rate else 0,
            'is_active': self.is_active,
            'is_service': self.is_service,
            'image_url': self.image_url,
            'image_public_id': self.image_public_id,
            'barcode': self.barcode,
            'supplier_info': self.supplier_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_low_stock(self):
        """Check if product is low on stock"""
        if self.is_service:
            return False
        return self.quantity_in_stock <= self.minimum_stock_level

    def update_stock(self, quantity_change):
        """Update stock quantity (positive for increase, negative for decrease)"""
        if not self.is_service:
            self.quantity_in_stock += quantity_change
            if self.quantity_in_stock < 0:
                self.quantity_in_stock = 0

    def calculate_profit_margin(self):
        """Calculate profit margin percentage"""
        if self.cost_price and self.unit_price and self.cost_price > 0:
            return ((self.unit_price - self.cost_price) / self.cost_price) * 100
        return 0

    @staticmethod
    def get_by_user(user_id, active_only=True):
        """Get products by user ID"""
        query = Product.query.filter_by(user_id=user_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.all()

    @staticmethod
    def get_low_stock_products(user_id):
        """Get products that are low on stock"""
        products = Product.get_by_user(user_id, active_only=True)
        return [product for product in products if product.is_low_stock()]

