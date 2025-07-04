from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets
import string
import uuid
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import JSON
from src.models.base import db, GUID, get_id_column, get_foreign_key_column
import os

class User(db.Model):
    __tablename__ = 'users'
    
    # UUID primary key to match Supabase schema
    id = get_id_column()
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)  # Nullable as per Supabase
    phone = db.Column(db.String(20), unique=True, nullable=False)  # Required and unique as per Supabase
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    business_name = db.Column(db.String(100))
    password_hash = db.Column(db.String(255), nullable=True)  # Add this field to Supabase if needed
    
    # Trial and Subscription Management - Aligned with Supabase schema
    role = db.Column(db.String(20), default='Owner')  # 'Owner', 'Salesperson', 'Admin'
    subscription_plan = db.Column(db.String(20), default='weekly')  # 'free', 'weekly', 'monthly', 'yearly'
    subscription_status = db.Column(db.String(20), default='trial')  # 'trial', 'active', 'expired', 'cancelled'
    trial_ends_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    
    # Referral System - Aligned with Supabase schema
    referral_code = db.Column(db.String(20), unique=True, nullable=False)
    referred_by = db.Column(GUID(), db.ForeignKey('users.id'))
    
    # Account Management - Aligned with Supabase schema
    active = db.Column(db.Boolean, default=True)  # Changed from is_active to active
    
    # Timestamps - Aligned with Supabase schema
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - Simplified for Supabase compatibility
    referrals = db.relationship('User', backref=db.backref('referrer', remote_side=[id]), foreign_keys=[referred_by])
    customers = db.relationship('Customer', backref='user', lazy=True, cascade='all, delete-orphan')
    products = db.relationship('Product', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.referral_code:
            self.referral_code = self.generate_referral_code()
        if not self.email_verification_token:
            self.email_verification_token = self.generate_verification_token()
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_referral_code(self):
        while True:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            if not User.query.filter_by(referral_code=code).first():
                return code
    
    def generate_verification_token(self):
        return secrets.token_urlsafe(32)
    
    def generate_password_reset_token(self):
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        return self.password_reset_token
    
    def is_trial_expired(self):
        return datetime.utcnow() > self.trial_end_date
    
    def is_subscription_active(self):
        if self.subscription_status != 'active':
            return False
        if self.subscription_end_date and datetime.utcnow() > self.subscription_end_date:
            return False
        return True
    
    def can_access_feature(self, feature):
        # During 7-day trial, user gets weekly plan features
        if self.is_trial_active and not self.is_trial_expired():
            weekly_features = ['invoicing', 'expense_tracking', 'reporting', 'client_management', 'team_management', 'sales_reports']
            return feature in weekly_features
        
        if not self.is_subscription_active() and self.subscription_plan == 'free':
            free_features = ['basic_invoicing', 'basic_reporting']
            return feature in free_features
        
        plan_features = {
            'free': ['basic_invoicing', 'basic_reporting'],  # 5 invoices, 5 expenses
            'weekly': ['invoicing', 'expense_tracking', 'reporting', 'client_management', 'team_management', 'sales_reports'],
            'monthly': ['invoicing', 'expense_tracking', 'reporting', 'client_management', 'team_management', 'sales_reports', 'referral_rewards'],
            'yearly': ['all_features', 'priority_support', 'advanced_team_management']
        }
        
        if self.subscription_plan == 'yearly':
            return True
        
        return feature in plan_features.get(self.subscription_plan, [])
    
    def add_referral_earning(self, amount):
        self.referral_earnings += amount
        self.total_referrals += 1
    
    def withdraw_earnings(self, amount):
        if amount <= self.referral_earnings:
            self.referral_earnings -= amount
            self.total_withdrawn += amount
            return True
        return False
    
    def to_dict(self):
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