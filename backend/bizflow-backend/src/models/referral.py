from src.models.user import db
from datetime import datetime

class ReferralWithdrawal(db.Model):
    __tablename__ = 'referral_withdrawals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Withdrawal Details
    amount = db.Column(db.Float, nullable=False)
    withdrawal_method = db.Column(db.String(50), nullable=False)  # bank_transfer, paystack, etc.
    account_details = db.Column(db.JSON)  # Store bank details or payment info
    
    # Status and Processing
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    reference_number = db.Column(db.String(100), unique=True)
    transaction_id = db.Column(db.String(100))  # External transaction ID
    
    # Admin Notes
    admin_notes = db.Column(db.Text)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    processed_at = db.Column(db.DateTime)
    
    # Timestamps
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    processor = db.relationship('User', foreign_keys=[processed_by], backref='processed_withdrawals')
    
    def generate_reference_number(self):
        """Generate unique reference number"""
        import secrets
        import string
        while True:
            ref = 'WD' + ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            if not ReferralWithdrawal.query.filter_by(reference_number=ref).first():
                return ref
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'withdrawal_method': self.withdrawal_method,
            'account_details': self.account_details,
            'status': self.status,
            'reference_number': self.reference_number,
            'transaction_id': self.transaction_id,
            'admin_notes': self.admin_notes,
            'processed_by': self.processed_by,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<ReferralWithdrawal {self.reference_number}: {self.amount}>'

class ReferralEarning(db.Model):
    __tablename__ = 'referral_earnings'
    
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    referred_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Earning Details
    earning_type = db.Column(db.String(50), nullable=False)  # signup, subscription, sale
    amount = db.Column(db.Float, nullable=False)
    commission_rate = db.Column(db.Float, nullable=False)  # Percentage used
    
    # Source Information
    source_id = db.Column(db.Integer)  # ID of the source (sale, subscription, etc.)
    source_type = db.Column(db.String(50))  # sale, subscription, etc.
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, paid
    
    # Timestamps
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    paid_at = db.Column(db.DateTime)
    
    # Relationships
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='earnings_made')
    referred_user = db.relationship('User', foreign_keys=[referred_user_id], backref='earnings_generated')
    
    def to_dict(self):
        return {
            'id': self.id,
            'referrer_id': self.referrer_id,
            'referred_user_id': self.referred_user_id,
            'earning_type': self.earning_type,
            'amount': self.amount,
            'commission_rate': self.commission_rate,
            'source_id': self.source_id,
            'source_type': self.source_type,
            'status': self.status,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'referrer': {
                'id': self.referrer.id,
                'first_name': self.referrer.first_name,
                'last_name': self.referrer.last_name,
                'email': self.referrer.email
            } if self.referrer else None,
            'referred_user': {
                'id': self.referred_user.id,
                'first_name': self.referred_user.first_name,
                'last_name': self.referred_user.last_name,
                'email': self.referred_user.email
            } if self.referred_user else None
        }
    
    def __repr__(self):
        return f'<ReferralEarning {self.earning_type}: {self.amount}>'