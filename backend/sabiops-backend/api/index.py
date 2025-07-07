import logging
import sys
import os

# Configure logging for Vercel (no file logging in serverless environment)
logging.basicConfig(level=logging.ERROR, 
                    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s")

from flask import Flask, request, jsonify, current_app
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client

from datetime import datetime, timedelta
import uuid
from decimal import Decimal
import json

# Add current directory to Python path for module imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

# Import blueprints
from src.routes.auth import auth_bp
from src.routes.customer import customer_bp
from src.routes.product import product_bp
from src.routes.sale import sale_bp
from src.routes.expense import expense_bp
from src.routes.invoice import invoice_bp
from src.routes.payment import payment_bp
from src.routes.dashboard import dashboard_bp
from src.routes.notifications import notifications_bp
# Temporarily disabled routes that depend on missing models:
# from src.routes.referral import referral_bp
# from src.routes.subscription import subscription_bp
# from src.routes.withdrawal import withdrawal_bp
# from src.routes.user import user_bp
# from src.routes.subscription_upgrade import subscription_upgrade_bp



app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

# Configure CORS to allow requests from your frontend origin
CORS(app, 
     resources={r"/api/*": {"origins": ["https://sabiops.vercel.app", "http://localhost:3000", "http://localhost:5173"]}},
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True
)
jwt = JWTManager(app)

# Check for required environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required environment variables. Please set them in your Vercel project settings.")

# Initialize Supabase client
try:
    supabase = create_client(supabase_url, supabase_key)
    # Make supabase client available to all routes
    app.config['SUPABASE'] = supabase
except Exception as e:
    raise RuntimeError(f"Failed to initialize Supabase client: {e}")

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        response.headers.add('Access-Control-Allow-Credentials', "true")
        return response

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ["https://sabiops.vercel.app", "http://localhost:3000", "http://localhost:5173"]:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Health check endpoint
@app.route('/api/health')
def health_check():
    try:
        # Test Supabase connection
        supabase = current_app.config.get('SUPABASE')
        if not supabase:
            return jsonify({
                "status": "unhealthy",
                "message": "Supabase client not initialized",
                "timestamp": datetime.utcnow().isoformat()
            }), 500
            
        result = supabase.table("users").select("count", count="exact").limit(1).execute()
        return jsonify({
            "status": "healthy",
            "message": "Backend is running",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        current_app.logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy", 
            "message": f"Database connection failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }), 500

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(customer_bp, url_prefix="/api/customers")
app.register_blueprint(product_bp, url_prefix="/api/products")
app.register_blueprint(sale_bp, url_prefix="/api/sales")
app.register_blueprint(expense_bp, url_prefix="/api/expenses")
app.register_blueprint(invoice_bp, url_prefix="/api/invoices")
app.register_blueprint(payment_bp, url_prefix="/api/payments")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
# Temporarily disabled blueprint registrations:
# app.register_blueprint(referral_bp, url_prefix="/api/referrals")
# app.register_blueprint(subscription_bp, url_prefix="/api/subscriptions")
# app.register_blueprint(withdrawal_bp, url_prefix="/api/withdrawals")
# app.register_blueprint(user_bp, url_prefix="/api/users")
# app.register_blueprint(subscription_upgrade_bp, url_prefix="/api/subscription-upgrade")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

