from src.models.base import db, GUID, get_id_column
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    __table_args__ = {'extend_existing': True}
    
    # UUID primary key to match Supabase schema
    id = get_id_column()
    owner_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)  # Changed from user_id to owner_id
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(15, 2), nullable=False)  # Aligned with Supabase schema
    cost_price = db.Column(db.Numeric(15, 2))
    quantity = db.Column(db.Integer, default=0)  # Aligned with Supabase schema
    low_stock_threshold = db.Column(db.Integer, default=5)  # Aligned with Supabase schema
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(500))  # Aligned with Supabase schema
    sku = db.Column(db.String(50))
    active = db.Column(db.Boolean, default=True)  # Aligned with Supabase schema
    
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
            'id': str(self.id),
            'owner_id': str(self.owner_id),
            'name': self.name,
            'description': self.description,
            'sku': self.sku,
            'category': self.category,
            'price': float(self.price) if self.price else 0,
            'cost_price': float(self.cost_price) if self.cost_price else 0,
            'quantity': self.quantity,
            'low_stock_threshold': self.low_stock_threshold,
            'active': self.active,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_low_stock(self):
        """Check if product is low on stock"""
        return self.quantity <= self.low_stock_threshold

    def update_stock(self, quantity_change):
        """Update stock quantity (positive for increase, negative for decrease)"""
        self.quantity += quantity_change
        if self.quantity < 0:
            self.quantity = 0

    def calculate_profit_margin(self):
        """Calculate profit margin percentage"""
        if self.cost_price and self.price and self.cost_price > 0:
            return ((self.price - self.cost_price) / self.cost_price) * 100
        return 0

    @staticmethod
    def get_by_owner(owner_id, active_only=True):
        """Get products by owner ID"""
        query = Product.query.filter_by(owner_id=owner_id)
        if active_only:
            query = query.filter_by(active=True)
        return query.all()

    @staticmethod
    def get_low_stock_products(owner_id):
        """Get products that are low on stock"""
        products = Product.get_by_owner(owner_id, active_only=True)
        return [product for product in products if product.is_low_stock()]

