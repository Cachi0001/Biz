import os
import sys
from datetime import timedelta
from dotenv import load_dotenv

# Add the current directory to Python path to enable imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

# Set base directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
print(f"Base Directory: {BASE_DIR}")

# Import database and models
from src.models.user import db, User
from src.models.customer import Customer
from src.models.product import Product
from src.models.invoice import Invoice, InvoiceItem
from src.models.payment import Payment
from src.models.expense import Expense
from src.models.sale import Sale
from src.models.referral import ReferralWithdrawal

# Import services
from src.services.paystack_service import PaystackService
from src.services.email_service import EmailService
from src.services.pdf_service import PDFService
from src.services.excel_service import ExcelService
from src.services.cloudinary_service import CloudinaryService
from src.services.supabase_service import SupabaseService

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
from src.routes.subscription import subscription_bp
from src.routes.notifications import notifications_bp
from src.routes.withdrawal import withdrawal_bp

def create_app():
    app = Flask(__name__)

    # Configuration - Support both Supabase and SQLite
    supabase_url = os.getenv("SUPABASE_URL")
    
    if supabase_url and supabase_url != "your_supabase_project_url_here":
        # Use Supabase PostgreSQL for production
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        if not supabase_service_key:
            print("ERROR: SUPABASE_SERVICE_KEY not found in environment variables")
            supabase_service_key = os.getenv("SUPABASE_KEY", "")
        
        # Extract project reference from Supabase URL
        try:
            project_ref = supabase_url.split('//')[1].split('.')[0]
            # Use direct connection to Supabase PostgreSQL
            db_path = f"postgresql://postgres.{project_ref}:{supabase_service_key}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
            print(f"Using Supabase PostgreSQL: {project_ref}")
        except Exception as e:
            print(f"Error parsing Supabase URL: {e}")
            print("Falling back to SQLite")
            instance_dir = os.path.join(BASE_DIR, "instance")
            os.makedirs(instance_dir, exist_ok=True)
            db_path = f"sqlite:///{os.path.join(instance_dir, 'bizflow_sme.db')}"
    else:
        # Use SQLite for local development
        instance_dir = os.path.join(BASE_DIR, "instance")
        os.makedirs(instance_dir, exist_ok=True)
        db_path = f"sqlite:///{os.path.join(instance_dir, 'bizflow_sme.db')}"
        print(f"Using SQLite for development: {db_path}")
    
    app.config["SQLALCHEMY_DATABASE_URI"] = db_path
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Configure CORS for development and production
    CORS(app, 
         origins=["http://localhost:5173", "http://localhost:3000", "https://*.vercel.app", "https://bizflow-sme-nigeria.vercel.app"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         supports_credentials=True)

    # Initialize services with app context
    app.paystack_service = PaystackService()
    app.email_service = EmailService()  # Already uses os.getenv, no app context needed here
    app.pdf_service = PDFService()
    app.excel_service = ExcelService()
    app.cloudinary_service = CloudinaryService()
    app.supabase_service = SupabaseService()

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(customer_bp, url_prefix="/api/customers")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(invoice_bp, url_prefix="/api/invoices")
    app.register_blueprint(payment_bp, url_prefix="/api/payments")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(expense_bp, url_prefix="/api/expenses")
    app.register_blueprint(sale_bp, url_prefix="/api/sales")
    app.register_blueprint(referral_bp, url_prefix="/api/referrals")
    app.register_blueprint(subscription_bp, url_prefix="/api/subscription")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(withdrawal_bp, url_prefix="/api/withdrawals")

    with app.app_context():
        db.create_all()

    @app.route("/api/health")
    def health_check():
        db_type = "Supabase PostgreSQL" if supabase_url and supabase_url != "your_supabase_project_url_here" else "SQLite"
        supabase_status = "Connected" if app.supabase_service.is_enabled() else "Disabled"
        
        return jsonify({
            "status": "healthy", 
            "database": db_type,
            "supabase": supabase_status,
            "file_storage": "Cloudinary",
            "notifications": "Enabled",
            "version": "1.0.0"
        })

    # @app.route("/api/test-email")
    # def test_email():
    #     app.email_service._create_message("test@example.com", "Test Subject", html_content="<h1>Test</h1>")
    #     return jsonify({"message": "Email creation test"})

    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)