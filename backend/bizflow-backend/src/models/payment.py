from src.models.user import db
from datetime import datetime
import uuid

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'))
    payment_reference = db.Column(db.String(100), unique=True, nullable=False)
    
    # Payment details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='NGN')
    payment_method = db.Column(db.String(50))  # card, bank_transfer, cash, etc.
    payment_gateway = db.Column(db.String(50))  # paystack, flutterwave, etc.
    
    # Payment status
    status = db.Column(db.String(20), default='pending')  # pending, successful, failed, cancelled
    gateway_reference = db.Column(db.String(100))  # Reference from payment gateway
    gateway_response = db.Column(db.Text)  # Full response from gateway
    
    # Customer details
    customer_email = db.Column(db.String(120))
    customer_name = db.Column(db.String(100))
    customer_phone = db.Column(db.String(20))
    
    # Additional fields
    description = db.Column(db.String(255))
    notes = db.Column(db.Text)
    fees = db.Column(db.Numeric(10, 2), default=0)  # Transaction fees
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<Payment {self.payment_reference}>'

    def __init__(self, **kwargs):
        super(Payment, self).__init__(**kwargs)
        if not self.payment_reference:
            self.payment_reference = self.generate_payment_reference()

    def generate_payment_reference(self):
        """Generate unique payment reference"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"PAY-{timestamp}-{unique_id}"

    def mark_as_successful(self, gateway_reference=None, gateway_response=None):
        """Mark payment as successful"""
        self.status = 'successful'
        self.paid_at = datetime.utcnow()
        if gateway_reference:
            self.gateway_reference = gateway_reference
        if gateway_response:
            self.gateway_response = gateway_response

    def mark_as_failed(self, gateway_response=None):
        """Mark payment as failed"""
        self.status = 'failed'
        if gateway_response:
            self.gateway_response = gateway_response

    def to_dict(self):
        """Convert payment object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'invoice_id': self.invoice_id,
            'payment_reference': self.payment_reference,
            'amount': float(self.amount) if self.amount else 0,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'payment_gateway': self.payment_gateway,
            'status': self.status,
            'gateway_reference': self.gateway_reference,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'description': self.description,
            'notes': self.notes,
            'fees': float(self.fees) if self.fees else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'invoice': self.invoice.to_dict() if self.invoice else None
        }

    @staticmethod
    def get_by_user(user_id, status=None):
        """Get payments by user ID and optionally by status"""
        query = Payment.query.filter_by(user_id=user_id)
        if status:
            query = query.filter_by(status=status)
        return query.order_by(Payment.created_at.desc()).all()

    @staticmethod
    def get_total_revenue(user_id, start_date=None, end_date=None):
        """Get total revenue for a user within date range"""
        query = Payment.query.filter_by(user_id=user_id, status='successful')
        if start_date:
            query = query.filter(Payment.paid_at >= start_date)
        if end_date:
            query = query.filter(Payment.paid_at <= end_date)
        
        payments = query.all()
        return sum(payment.amount for payment in payments)

