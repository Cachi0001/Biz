from src.models.base import db, GUID, get_id_column
from datetime import datetime

class Sale(db.Model):
    __tablename__ = 'sales'
    __table_args__ = {'extend_existing': True}
    
    # UUID primary key to match Supabase schema
    id = get_id_column()
    owner_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)  # Changed from user_id to owner_id
    customer_id = db.Column(GUID(), db.ForeignKey('customers.id'))
    customer_name = db.Column(db.String(100))  # Added as per database schema
    product_id = db.Column(GUID(), db.ForeignKey('products.id'))
    product_name = db.Column(db.String(100), nullable=False)  # Added as per database schema
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)
    payment_method = db.Column(db.String(50), default='cash')
    salesperson_id = db.Column(GUID(), db.ForeignKey('users.id'))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Timestamps - Aligned with Supabase schema
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = db.relationship('Customer', backref='sales', lazy=True)
    product = db.relationship('Product', backref='sales', lazy=True)
    salesperson = db.relationship('User', foreign_keys=[salesperson_id], backref='sales_made')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'owner_id': str(self.owner_id),
            'customer_id': str(self.customer_id) if self.customer_id else None,
            'customer_name': self.customer_name,
            'product_id': str(self.product_id) if self.product_id else None,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_amount': float(self.total_amount),
            'payment_method': self.payment_method,
            'salesperson_id': str(self.salesperson_id) if self.salesperson_id else None,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_by_owner(owner_id):
        """Get sales by owner ID"""
        return Sale.query.filter_by(owner_id=owner_id).all()
    
    def __repr__(self):
        return f'<Sale {self.product_name}: {self.total_amount}>'

