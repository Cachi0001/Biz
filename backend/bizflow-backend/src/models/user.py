from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets
import string

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    business_name = db.Column(db.String(100))
    business_type = db.Column(db.String(50))
    business_address = db.Column(db.Text)
    business_phone = db.Column(db.String(20))
    business_email = db.Column(db.String(120))
    
    # Trial and Subscription Management
    trial_start_date = db.Column(db.DateTime, default=datetime.utcnow)
    trial_end_date = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    is_trial_active = db.Column(db.Boolean, default=True)
    subscription_plan = db.Column(db.String(20), default='trial')  # trial, weekly, monthly, yearly
    subscription_status = db.Column(db.String(20), default='active')  # active, cancelled, expired
    subscription_start_date = db.Column(db.DateTime)
    subscription_end_date = db.Column(db.DateTime)
    
    # Referral System
    referral_code = db.Column(db.String(10), unique=True, nullable=False)
    referred_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    total_referrals = db.Column(db.Integer, default=0)
    referral_earnings = db.Column(db.Float, default=0.0)
    total_withdrawn = db.Column(db.Float, default=0.0)
    
    # Account Management
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(100))
    password_reset_token = db.Column(db.String(100))
    password_reset_expires = db.Column(db.DateTime)
    
    # Role and Team Management
    role = db.Column(db.String(20), default='owner')  # owner, salesperson
    team_owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    team_members = db.relationship('User', backref=db.backref('team_owner', remote_side=[id]))
    referrals = db.relationship('User', backref=db.backref('referrer', remote_side=[id]))
    customers = db.relationship('Customer', backref='user', lazy=True, cascade='all, delete-orphan')
    products = db.relationship('Product', backref='user', lazy=True, cascade='all, delete-orphan')
    invoices = db.relationship('Invoice', backref='user', lazy=True, cascade='all, delete-orphan')
    expenses = db.relationship('Expense', backref='user', lazy=True, cascade='all, delete-orphan')
    sales = db.relationship('Sale', backref='user', lazy=True, cascade='all, delete-orphan')
    withdrawals = db.relationship('ReferralWithdrawal', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.referral_code:
            self.referral_code = self.generate_referral_code()
        if not self.email_verification_token:
            self.email_verification_token = self.generate_verification_token()
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def generate_referral_code(self):
        """Generate unique referral code"""
        while True:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            if not User.query.filter_by(referral_code=code).first():
                return code
    
    def generate_verification_token(self):
        """Generate email verification token"""
        return secrets.token_urlsafe(32)
    
    def generate_password_reset_token(self):
        """Generate password reset token"""
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        return self.password_reset_token
    
    def is_trial_expired(self):
        """Check if trial period has expired"""
        return datetime.utcnow() > self.trial_end_date
    
    def is_subscription_active(self):
        """Check if subscription is active"""
        if self.subscription_status != 'active':
            return False
        if self.subscription_end_date and datetime.utcnow() > self.subscription_end_date:
            return False
        return True
    
    def can_access_feature(self, feature):
        """Check if user can access a specific feature based on plan"""
        if self.is_trial_active and not self.is_trial_expired():
            return True  # Trial users get full access
        
        if not self.is_subscription_active():
            return False  # No access if subscription is inactive
        
        # Define feature access by plan
        plan_features = {
            'weekly': ['basic_invoicing', 'basic_reporting', 'client_management'],
            'monthly': ['basic_invoicing', 'basic_reporting', 'client_management', 'expense_tracking', 'team_management'],
            'yearly': ['all_features']  # Full access
        }
        
        if self.subscription_plan == 'yearly':
            return True
        
        return feature in plan_features.get(self.subscription_plan, [])
    
    def add_referral_earning(self, amount):
        """Add referral earning"""
        self.referral_earnings += amount
        self.total_referrals += 1
    
    def withdraw_earnings(self, amount):
        """Withdraw referral earnings"""
        if amount <= self.referral_earnings:
            self.referral_earnings -= amount
            self.total_withdrawn += amount
            return True
        return False
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'business_name': self.business_name,
            'business_type': self.business_type,
            'business_address': self.business_address,
            'business_phone': self.business_phone,
            'business_email': self.business_email,
            'trial_start_date': self.trial_start_date.isoformat() if self.trial_start_date else None,
            'trial_end_date': self.trial_end_date.isoformat() if self.trial_end_date else None,
            'is_trial_active': self.is_trial_active,
            'trial_expired': self.is_trial_expired(),
            'subscription_plan': self.subscription_plan,
            'subscription_status': self.subscription_status,
            'subscription_active': self.is_subscription_active(),
            'referral_code': self.referral_code,
            'total_referrals': self.total_referrals,
            'referral_earnings': self.referral_earnings,
            'total_withdrawn': self.total_withdrawn,
            'role': self.role,
            'team_owner_id': self.team_owner_id,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'

