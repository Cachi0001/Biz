from src.models.base import db, GUID, get_id_column
from datetime import datetime

class Expense(db.Model):
    __tablename__ = 'expenses'
    __table_args__ = {'extend_existing': True}
    
    # UUID primary key to match Supabase schema
    id = get_id_column()
    owner_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)  # Changed from user_id to owner_id
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    description = db.Column(db.Text)
    receipt_url = db.Column(db.String(500))
    payment_method = db.Column(db.String(50), default='cash')
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Timestamps - Aligned with Supabase schema
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'owner_id': str(self.owner_id),
            'category': self.category,
            'amount': float(self.amount),
            'description': self.description,
            'receipt_url': self.receipt_url,
            'payment_method': self.payment_method,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_by_owner(owner_id):
        """Get expenses by owner ID"""
        return Expense.query.filter_by(owner_id=owner_id).all()
    
    def __repr__(self):
        return f'<Expense {self.category}: {self.amount}>'

