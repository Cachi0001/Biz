from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import JSON
from src.models.base import db, GUID, get_id_column, get_foreign_key_column
import os

class Customer(db.Model):
    __tablename__ = 'customers'
    __table_args__ = {'extend_existing': True}
    
    id = get_id_column()
    owner_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)  # Changed from user_id to owner_id
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    
    # JSON fields that work with both SQLite and PostgreSQL - aligned with database schema
    purchase_history = db.Column(JSONB if os.getenv("SUPABASE_URL") else JSON, default=lambda: [])
    interactions = db.Column(JSONB if os.getenv("SUPABASE_URL") else JSON, default=lambda: [])
    total_purchases = db.Column(db.Numeric(15,2), default=0)
    last_purchase_date = db.Column(db.DateTime)
    
    # Timestamps - aligned with database schema
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    invoices = db.relationship('Invoice', backref='customer', lazy=True)

    def __repr__(self):
        return f'<Customer {self.name}>'

    def to_dict(self):
        """Convert customer object to dictionary"""
        return {
            'id': str(self.id),
            'owner_id': str(self.owner_id),
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'purchase_history': self.purchase_history,
            'interactions': self.interactions,
            'total_purchases': float(self.total_purchases) if self.total_purchases else 0,
            'last_purchase_date': self.last_purchase_date.isoformat() if self.last_purchase_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def get_by_owner(owner_id):
        """Get customers by owner ID"""
        return Customer.query.filter_by(owner_id=owner_id).all()

    def add_purchase(self, amount, description=None):
        """Add a purchase to customer's history"""
        purchase = {
            'amount': float(amount),
            'date': datetime.utcnow().isoformat(),
            'description': description
        }
        if self.purchase_history is None:
            self.purchase_history = []
        self.purchase_history.append(purchase)
        self.total_purchases = (self.total_purchases or 0) + amount
        self.last_purchase_date = datetime.utcnow()

    def add_interaction(self, interaction_type, notes=None):
        """Add an interaction to customer's history"""
        interaction = {
            'type': interaction_type,
            'date': datetime.utcnow().isoformat(),
            'notes': notes
        }
        if self.interactions is None:
            self.interactions = []
        self.interactions.append(interaction)

