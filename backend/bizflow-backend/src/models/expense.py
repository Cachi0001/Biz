from src.models.user import db
from datetime import datetime

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Expense Details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # office_supplies, travel, utilities, etc.
    payment_method = db.Column(db.String(50))  # cash, bank_transfer, card, etc.
    
    # Receipt Management
    receipt_filename = db.Column(db.String(255))
    receipt_url = db.Column(db.String(500))
    
    # Tax and Business
    is_tax_deductible = db.Column(db.Boolean, default=False)
    tax_category = db.Column(db.String(50))
    vendor_name = db.Column(db.String(100))
    vendor_contact = db.Column(db.String(100))
    
    # Date and Status
    expense_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date())
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'amount': self.amount,
            'category': self.category,
            'payment_method': self.payment_method,
            'receipt_filename': self.receipt_filename,
            'receipt_url': self.receipt_url,
            'is_tax_deductible': self.is_tax_deductible,
            'tax_category': self.tax_category,
            'vendor_name': self.vendor_name,
            'vendor_contact': self.vendor_contact,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Expense {self.title}: {self.amount}>'

class ExpenseCategory(db.Model):
    __tablename__ = 'expense_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<ExpenseCategory {self.name}>'

