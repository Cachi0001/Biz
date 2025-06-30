from src.models.user import db
from datetime import datetime

class Sale(db.Model):
    __tablename__ = 'sales'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'))
    salesperson_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # For team sales tracking
    
    # Sale Details
    sale_number = db.Column(db.String(50), unique=True, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    discount_amount = db.Column(db.Float, default=0.0)
    tax_amount = db.Column(db.Float, default=0.0)
    net_amount = db.Column(db.Float, nullable=False)
    
    # Payment Information
    payment_method = db.Column(db.String(50), nullable=False)  # cash, card, bank_transfer, paystack
    payment_status = db.Column(db.String(20), default='completed')  # pending, completed, failed, refunded
    payment_reference = db.Column(db.String(100))
    
    # Sale Metadata
    sale_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date())
    sale_time = db.Column(db.Time, nullable=False, default=datetime.utcnow().time())
    notes = db.Column(db.Text)
    
    # Commission and Referral
    commission_rate = db.Column(db.Float, default=0.0)  # For salespeople
    commission_amount = db.Column(db.Float, default=0.0)
    referral_commission = db.Column(db.Float, default=0.0)  # For referral system
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sale_items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')
    salesperson = db.relationship('User', foreign_keys=[salesperson_id], backref='sales_made')
    
    def generate_sale_number(self):
        """Generate unique sale number"""
        from datetime import datetime
        today = datetime.now()
        prefix = f"SAL{today.strftime('%Y%m%d')}"
        
        # Get the last sale number for today
        last_sale = Sale.query.filter(
            Sale.sale_number.like(f"{prefix}%")
        ).order_by(Sale.sale_number.desc()).first()
        
        if last_sale:
            last_number = int(last_sale.sale_number[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
        
        return f"{prefix}{new_number:04d}"
    
    def calculate_totals(self):
        """Calculate total amounts from sale items"""
        subtotal = sum(item.total_amount for item in self.sale_items)
        self.total_amount = subtotal
        self.net_amount = subtotal - self.discount_amount + self.tax_amount
        
        # Calculate commission
        if self.commission_rate > 0:
            self.commission_amount = self.net_amount * (self.commission_rate / 100)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'customer_id': self.customer_id,
            'invoice_id': self.invoice_id,
            'salesperson_id': self.salesperson_id,
            'sale_number': self.sale_number,
            'total_amount': self.total_amount,
            'discount_amount': self.discount_amount,
            'tax_amount': self.tax_amount,
            'net_amount': self.net_amount,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'payment_reference': self.payment_reference,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'sale_time': self.sale_time.isoformat() if self.sale_time else None,
            'notes': self.notes,
            'commission_rate': self.commission_rate,
            'commission_amount': self.commission_amount,
            'referral_commission': self.referral_commission,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'sale_items': [item.to_dict() for item in self.sale_items],
            'customer': self.customer.to_dict() if self.customer else None,
            'salesperson': {
                'id': self.salesperson.id,
                'first_name': self.salesperson.first_name,
                'last_name': self.salesperson.last_name
            } if self.salesperson else None
        }
    
    def __repr__(self):
        return f'<Sale {self.sale_number}: {self.net_amount}>'

class SaleItem(db.Model):
    __tablename__ = 'sale_items'
    
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    
    # Item Details
    product_name = db.Column(db.String(200), nullable=False)
    product_sku = db.Column(db.String(50))
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    
    # Discount and Tax
    discount_percentage = db.Column(db.Float, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    tax_percentage = db.Column(db.Float, default=0.0)
    tax_amount = db.Column(db.Float, default=0.0)
    
    def calculate_total(self):
        """Calculate total amount for this item"""
        subtotal = self.quantity * self.unit_price
        self.total_amount = subtotal - self.discount_amount + self.tax_amount
    
    def to_dict(self):
        return {
            'id': self.id,
            'sale_id': self.sale_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_amount': self.total_amount,
            'discount_percentage': self.discount_percentage,
            'discount_amount': self.discount_amount,
            'tax_percentage': self.tax_percentage,
            'tax_amount': self.tax_amount
        }
    
    def __repr__(self):
        return f'<SaleItem {self.product_name}: {self.quantity} x {self.unit_price}>'

