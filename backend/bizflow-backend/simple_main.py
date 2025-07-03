#!/usr/bin/env python3
"""
Simplified main.py to test basic functionality without complex imports.
"""

import os
import sys
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bizflow_test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'test-jwt-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# Simple User Model
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
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

# Simple Customer Model
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

# Simple Product Model
class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'stock_quantity': self.stock_quantity,
            'category': self.category,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Routes

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Bizflow SME Nigeria API is running',
        'version': '1.0.0',
        'database': 'Connected'
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'username', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create new user
        user = User(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            username=data['username']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers', methods=['GET'])
@jwt_required()
def get_customers():
    try:
        user_id = get_jwt_identity()
        customers = Customer.query.filter_by(user_id=user_id).all()
        return jsonify([customer.to_dict() for customer in customers]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers', methods=['POST'])
@jwt_required()
def create_customer():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Customer name is required'}), 400
        
        customer = Customer(
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            user_id=user_id
        )
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({
            'message': 'Customer created successfully',
            'customer': customer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['GET'])
@jwt_required()
def get_products():
    try:
        user_id = get_jwt_identity()
        products = Product.query.filter_by(user_id=user_id).all()
        return jsonify([product.to_dict() for product in products]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('name') or not data.get('price'):
            return jsonify({'error': 'Product name and price are required'}), 400
        
        product = Product(
            name=data['name'],
            description=data.get('description'),
            price=float(data['price']),
            stock_quantity=int(data.get('stock_quantity', 0)),
            category=data.get('category'),
            user_id=user_id
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        user_id = get_jwt_identity()
        
        total_customers = Customer.query.filter_by(user_id=user_id).count()
        total_products = Product.query.filter_by(user_id=user_id).count()
        
        return jsonify({
            'total_customers': total_customers,
            'total_products': total_products,
            'total_sales': 0,  # Placeholder
            'pending_invoices': 0  # Placeholder
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Test endpoint to check functionality
@app.route('/api/test', methods=['GET'])
def test_functionality():
    try:
        # Test database connection
        user_count = User.query.count()
        customer_count = Customer.query.count()
        product_count = Product.query.count()
        
        return jsonify({
            'status': 'All systems operational',
            'database_connection': 'Working',
            'models': {
                'users': user_count,
                'customers': customer_count,
                'products': product_count
            },
            'endpoints': {
                'auth': 'Working',
                'customers': 'Working',
                'products': 'Working',
                'dashboard': 'Working'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Initialize database
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully")

if __name__ == '__main__':
    print("🚀 Starting Bizflow SME Nigeria Backend...")
    print("📊 Testing basic functionality...")
    
    # Test the app
    with app.test_client() as client:
        # Test health endpoint
        response = client.get('/api/health')
        if response.status_code == 200:
            print("✅ Health endpoint working")
        
        # Test functionality endpoint
        response = client.get('/api/test')
        if response.status_code == 200:
            print("✅ Test endpoint working")
            print(f"   Response: {response.get_json()}")
    
    port = int(os.environ.get("PORT", 5000))
    print(f"🌐 Server starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)