from src.models.user import db
from datetime import datetime, timedelta
import uuid

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), default='draft')  # draft, sent, paid, overdue, cancelled
    issue_date = db.Column(db.Date, default=datetime.utcnow().date)
    due_date = db.Column(db.Date)
    payment_terms = db.Column(db.String(50), default='Net 30')  # Net 30, Net 15, Due on receipt, etc.
    
    # Financial fields
    subtotal = db.Column(db.Numeric(10, 2), default=0)
    tax_amount = db.Column(db.Numeric(10, 2), default=0)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), default=0)
    amount_paid = db.Column(db.Numeric(10, 2), default=0)
    
    # Additional fields
    notes = db.Column(db.Text)
    terms_and_conditions = db.Column(db.Text)
    currency = db.Column(db.String(3), default='NGN')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sent_at = db.Column(db.DateTime)
    paid_at = db.Column(db.DateTime)
    
    # Relationships
    items = db.relationship('InvoiceItem', backref='invoice', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='invoice', lazy=True)

    def __repr__(self):
        return f'<Invoice {self.invoice_number}>'

    def __init__(self, **kwargs):
        super(Invoice, self).__init__(**kwargs)
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        if not self.due_date and self.issue_date:
            self.due_date = self.issue_date + timedelta(days=30)

    def generate_invoice_number(self):
        """Generate unique invoice number"""
        timestamp = datetime.now().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"INV-{timestamp}-{unique_id}"

    def calculate_totals(self):
        """Calculate invoice totals based on items"""
        self.subtotal = sum(item.total_amount for item in self.items)
        self.tax_amount = sum(item.tax_amount for item in self.items)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount

    def get_balance_due(self):
        """Get remaining balance due"""
        return self.total_amount - self.amount_paid

    def is_overdue(self):
        """Check if invoice is overdue"""
        if self.status == 'paid':
            return False
        return self.due_date and self.due_date < datetime.utcnow().date()

    def mark_as_paid(self):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_at = datetime.utcnow()
        self.amount_paid = self.total_amount

    def to_dict(self):
        """Convert invoice object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'customer_id': self.customer_id,
            'invoice_number': self.invoice_number,
            'status': self.status,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'payment_terms': self.payment_terms,
            'subtotal': float(self.subtotal) if self.subtotal else 0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0,
            'discount_amount': float(self.discount_amount) if self.discount_amount else 0,
            'total_amount': float(self.total_amount) if self.total_amount else 0,
            'amount_paid': float(self.amount_paid) if self.amount_paid else 0,
            'balance_due': float(self.get_balance_due()),
            'notes': self.notes,
            'terms_and_conditions': self.terms_and_conditions,
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'is_overdue': self.is_overdue(),
            'items': [item.to_dict() for item in self.items],
            'customer': self.customer.to_dict() if self.customer else None
        }

class InvoiceItem(db.Model):
    __tablename__ = 'invoice_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    tax_rate = db.Column(db.Numeric(5, 2), default=0)
    discount_rate = db.Column(db.Numeric(5, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2))
    tax_amount = db.Column(db.Numeric(10, 2))
    
    def __repr__(self):
        return f'<InvoiceItem {self.description}>'

    def __init__(self, **kwargs):
        super(InvoiceItem, self).__init__(**kwargs)
        self.calculate_amounts()

    def calculate_amounts(self):
        """Calculate line item amounts"""
        line_total = self.quantity * self.unit_price
        discount_amount = line_total * (self.discount_rate / 100) if self.discount_rate else 0
        discounted_total = line_total - discount_amount
        self.tax_amount = discounted_total * (self.tax_rate / 100) if self.tax_rate else 0
        self.total_amount = discounted_total

    def to_dict(self):
        """Convert invoice item object to dictionary"""
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'product_id': self.product_id,
            'description': self.description,
            'quantity': float(self.quantity) if self.quantity else 0,
            'unit_price': float(self.unit_price) if self.unit_price else 0,
            'tax_rate': float(self.tax_rate) if self.tax_rate else 0,
            'discount_rate': float(self.discount_rate) if self.discount_rate else 0,
            'total_amount': float(self.total_amount) if self.total_amount else 0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0,
            'product': self.product.to_dict() if self.product else None
        }

