import os
import sys
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Import database and models
from src.models.user import db
from src.models.customer import Customer
from src.models.product import Product
from src.models.invoice import Invoice, InvoiceItem
from src.models.payment import Payment

# Import routes
from src.routes.auth import auth_bp
from src.routes.user import user_bp
from src.routes.customer import customer_bp
from src.routes.product import product_bp
from src.routes.invoice import invoice_bp
from src.routes.payment import payment_bp
from src.routes.dashboard import dashboard_bp

def create_app(config=None):
    """Application factory pattern for creating Flask app."""
    app = Flask(__name__)
    
    # Configuration
    if config:
        app.config.update(config)
    else:
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///bizflow.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
        app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
        app.config['MAIL_USE_TLS'] = True
        app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
        app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
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
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Bizflow API is running'}
    
    # Serve React app in production
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

