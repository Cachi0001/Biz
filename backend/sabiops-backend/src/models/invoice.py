from src.models.base import db, GUID, get_id_column
from datetime import datetime, timedelta
import uuid

class Invoice(db.Model):
    __tablename__ = 'invoices'
    __table_args__ = {'extend_existing': True}
    
    # UUID primary key to match Supabase schema
    id = get_id_column()
    owner_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)  # Changed from user_id to owner_id
    customer_id = db.Column(GUID(), db.ForeignKey('customers.id'))
    customer_name = db.Column(db.String(100))  # Added as per database schema
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)
    status = db.Column(db.String(20), default='draft')  # draft, sent, paid, overdue, cancelled
    due_date = db.Column(db.DateTime)
    paid_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    items = db.Column(db.JSON, default=lambda: [])  # JSONB field for invoice items
    
    # Timestamps - Aligned with Supabase schema
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = db.relationship('Customer', backref='invoices', lazy=True)

    def __repr__(self):
        return f'<Invoice {self.invoice_number}>'

    def __init__(self, **kwargs):
        super(Invoice, self).__init__(**kwargs)
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()

    def generate_invoice_number(self):
        """Generate unique invoice number"""
        timestamp = datetime.now().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"INV-{timestamp}-{unique_id}"

    def is_overdue(self):
        """Check if invoice is overdue"""
        if self.status == 'paid':
            return False
        return self.due_date and self.due_date < datetime.utcnow()

    def mark_as_paid(self):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_date = datetime.utcnow()

    def to_dict(self):
        """Convert invoice object to dictionary"""
        return {
            'id': str(self.id),
            'owner_id': str(self.owner_id),
            'customer_id': str(self.customer_id) if self.customer_id else None,
            'customer_name': self.customer_name,
            'invoice_number': self.invoice_number,
            'amount': float(self.amount),
            'tax_amount': float(self.tax_amount),
            'total_amount': float(self.total_amount),
            'status': self.status,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'notes': self.notes,
            'items': self.items,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_overdue': self.is_overdue()
        }

    @staticmethod
    def get_by_owner(owner_id):
        """Get invoices by owner ID"""
        return Invoice.query.filter_by(owner_id=owner_id).all()

