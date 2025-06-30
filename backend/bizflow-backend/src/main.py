import os
import sys
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Import database and models
from src.models.user import db
from src.models.customer import Customer
from src.models.product import Product
from src.models.invoice import Invoice, InvoiceItem
from src.models.payment import Payment
from src.models.expense import Expense, ExpenseCategory
from src.models.sale import Sale, SaleItem
from src.models.referral import ReferralWithdrawal, ReferralEarning

# Import routes
from src.routes.auth import auth_bp
from src.routes.user import user_bp
from src.routes.customer import customer_bp
from src.routes.product import product_bp
from src.routes.invoice import invoice_bp
from src.routes.payment import payment_bp
from src.routes.dashboard import dashboard_bp
from src.routes.expense import expense_bp
from src.routes.sale import sale_bp
from src.routes.referral import referral_bp

def create_app(config=None):
    """Application factory pattern for creating Flask app."""
    app = Flask(__name__)
    
    # Configuration
    if config:
        app.config.update(config)
    else:
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///bizflow.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
        app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
        app.config['MAIL_USE_TLS'] = True
        app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
        app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
        app.config['PAYSTACK_SECRET_KEY'] = os.getenv('PAYSTACK_SECRET_KEY')
        app.config['PAYSTACK_PUBLIC_KEY'] = os.getenv('PAYSTACK_PUBLIC_KEY')
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"])
    JWTManager(app)
    Mail(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(customer_bp, url_prefix='/api/customers')
    app.register_blueprint(product_bp, url_prefix='/api/products')
    app.register_blueprint(invoice_bp, url_prefix='/api/invoices')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(expense_bp, url_prefix='/api/expenses')
    app.register_blueprint(sale_bp, url_prefix='/api/sales')
    app.register_blueprint(referral_bp, url_prefix='/api/referrals')
    
    # Create tables
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Database initialization error: {e}")
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy', 
            'message': 'Bizflow SME Nigeria API is running',
            'version': '1.0.0'
        })
    
    # Root endpoint
    @app.route('/')
    def root():
        return jsonify({
            'message': 'Welcome to Bizflow SME Nigeria API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'customers': '/api/customers',
                'products': '/api/products',
                'invoices': '/api/invoices',
                'payments': '/api/payments',
                'dashboard': '/api/dashboard'
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

# Create app instance
app = create_app()

# For Vercel
def handler(request):
    return app(request.environ, request.start_response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=False)

