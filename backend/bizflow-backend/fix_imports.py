#!/usr/bin/env python3
"""
Fix import issues and create missing files for Bizflow backend.
"""

import os

def create_missing_files():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(base_dir, 'src')
    
    print("🔧 Creating missing files and fixing imports...")
    
    # Create src directory if it doesn't exist
    os.makedirs(src_dir, exist_ok=True)
    
    # Create subdirectories
    subdirs = ['models', 'routes', 'services']
    for subdir in subdirs:
        subdir_path = os.path.join(src_dir, subdir)
        os.makedirs(subdir_path, exist_ok=True)
        print(f"✅ Created/verified {subdir} directory")
    
    # Create __init__.py files
    init_files = [
        os.path.join(src_dir, '__init__.py'),
        os.path.join(src_dir, 'models', '__init__.py'),
        os.path.join(src_dir, 'routes', '__init__.py'),
        os.path.join(src_dir, 'services', '__init__.py')
    ]
    
    for init_file in init_files:
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('# Bizflow SME Nigeria\n')
            print(f"✅ Created {init_file}")
    
    # Create basic models/__init__.py with database setup
    models_init = os.path.join(src_dir, 'models', '__init__.py')
    with open(models_init, 'w') as f:
        f.write('''# Bizflow SME Nigeria - Models
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
''')
    print("✅ Updated models/__init__.py")
    
    # Create basic user model if it doesn't exist
    user_model = os.path.join(src_dir, 'models', 'user.py')
    if not os.path.exists(user_model):
        with open(user_model, 'w') as f:
            f.write('''# User Model
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    subscription_plan = db.Column(db.String(20), default='weekly')
    subscription_status = db.Column(db.String(20), default='trial')
    is_trial_active = db.Column(db.Boolean, default=True)
    trial_start_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'username': self.username,
            'subscription_plan': self.subscription_plan,
            'subscription_status': self.subscription_status,
            'is_trial_active': self.is_trial_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
''')
        print("✅ Created user.py model")
    
    # Create other essential models
    models_to_create = {
        'customer.py': '''# Customer Model
from . import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
''',
        'product.py': '''# Product Model
from . import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    cost_price = db.Column(db.Float)
    stock_quantity = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(255))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'cost_price': self.cost_price,
            'stock_quantity': self.stock_quantity,
            'category': self.category,
            'image_url': self.image_url,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
''',
        'invoice.py': '''# Invoice Models
from . import db
from datetime import datetime

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    customer_name = db.Column(db.String(100))
    customer_email = db.Column(db.String(120))
    customer_phone = db.Column(db.String(20))
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='draft')
    due_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    items = db.relationship('InvoiceItem', backref='invoice', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'total_amount': self.total_amount,
            'status': self.status,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'notes': self.notes,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'items': [item.to_dict() for item in self.items]
        }

class InvoiceItem(db.Model):
    __tablename__ = 'invoice_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    product_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price
        }
''',
        'payment.py': '''# Payment Model
from . import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'))
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100))
    status = db.Column(db.String(20), default='pending')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'status': self.status,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
''',
        'expense.py': '''# Expense Model
from . import db
from datetime import datetime

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    receipt_url = db.Column(db.String(255))
    expense_date = db.Column(db.Date, default=datetime.utcnow().date)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'category': self.category,
            'receipt_url': self.receipt_url,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
''',
        'sale.py': '''# Sale Model
from . import db
from datetime import datetime

class Sale(db.Model):
    __tablename__ = 'sales'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'))
    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))
    status = db.Column(db.String(20), default='completed')
    sale_date = db.Column(db.Date, default=datetime.utcnow().date)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'total_amount': self.total_amount,
            'payment_method': self.payment_method,
            'status': self.status,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
''',
        'referral.py': '''# Referral Model
from . import db
from datetime import datetime

class ReferralWithdrawal(db.Model):
    __tablename__ = 'referral_withdrawals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    bank_details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'status': self.status,
            'bank_details': self.bank_details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
'''
    }
    
    for filename, content in models_to_create.items():
        filepath = os.path.join(src_dir, 'models', filename)
        if not os.path.exists(filepath):
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✅ Created {filename}")
    
    print("\n🎉 All missing files created successfully!")

if __name__ == "__main__":
    create_missing_files()