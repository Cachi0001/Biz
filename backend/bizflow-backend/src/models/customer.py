from src.models.user import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(50))
    state = db.Column(db.String(50))
    country = db.Column(db.String(50), default='Nigeria')
    customer_type = db.Column(db.String(20), default='individual')  # individual, business
    company_name = db.Column(db.String(100))
    tax_id = db.Column(db.String(50))
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    invoices = db.relationship('Invoice', backref='customer', lazy=True)

    def __repr__(self):
        return f'<Customer {self.name}>'

    def to_dict(self):
        """Convert customer object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'customer_type': self.customer_type,
            'company_name': self.company_name,
            'tax_id': self.tax_id,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def get_full_address(self):
        """Get formatted full address"""
        address_parts = [self.address, self.city, self.state, self.country]
        return ', '.join([part for part in address_parts if part])

    @staticmethod
    def get_by_user(user_id, active_only=True):
        """Get customers by user ID"""
        query = Customer.query.filter_by(user_id=user_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.all()

