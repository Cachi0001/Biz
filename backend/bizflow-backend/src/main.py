import os
import sys
from datetime import timedelta
from dotenv import load_dotenv

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

def create_app():
    app = Flask(__name__)

    # Configuration
    db_path = os.getenv("DATABASE_URL", os.path.join(BASE_DIR, "src/instance/bizflow_sme.db"))
    print(f"Database URL: {db_path}")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_path
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app)

    # Initialize services with app context
    app.paystack_service = PaystackService()
    app.email_service = EmailService()  # Already uses os.getenv, no app context needed here
    app.pdf_service = PDFService()
    app.excel_service = ExcelService()
    app.cloudinary_service = CloudinaryService()

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

    with app.app_context():
        db.create_all()

    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "healthy", "database": "SQLite", "file_storage": "Cloudinary"})

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