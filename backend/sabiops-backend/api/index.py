from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, SupabaseException
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid
from decimal import Decimal
import json

# Add current directory to Python path for module imports
import sys
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
from src.routes.referral import referral_bp
from src.routes.notifications import notifications_bp
from src.routes.subscription import subscription_bp
from src.routes.withdrawal import withdrawal_bp
from src.routes.user import user_bp
from src.routes.subscription_upgrade import subscription_upgrade_bp

load_dotenv()

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

# Configure CORS to allow requests from your frontend origin
CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True}})
jwt = JWTManager(app)

# Check for required environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required environment variables. Please set them in your Vercel project settings.")

# Initialize Supabase client
try:
    supabase = create_client(supabase_url, supabase_key)
except SupabaseException as e:
    raise RuntimeError(f"Failed to initialize Supabase client: {e}")

# Pass supabase client to blueprints
app.config["SUPABASE_CLIENT"] = supabase

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)

app.json_encoder = DecimalEncoder

def success_response(data=None, message="Success", status_code=200):
    response = jsonify({
        "success": True,
        "data": data,
        "message": message
    })
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response, status_code

def error_response(error, message="Error", status_code=400):
    response = jsonify({
        "success": False,
        "error": error,
        "message": message
    })
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response, status_code

# ============================================================================
# HEALTH & TEST ENDPOINTS
# ============================================================================

@app.route("/api/health", methods=["GET"])
def health():
    return success_response(
        message="SabiOps SME Nigeria API is running",
        data={
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    )

@app.route("/api/test-db", methods=["GET"])
def test_database():
    try:
        result = supabase.table("users").select("*").limit(1).execute()
        return success_response(
            message="Database connection working!",
            data={
                "tables_accessible": True
            }
        )
    except Exception as e:
        return error_response(
            error=str(e),
            message="Database connection failed",
            status_code=500
        )

@app.route("/api/test-env", methods=["GET"])
def test_env():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY")
    
    return success_response(
        data={
            "SUPABASE_URL": supabase_url if supabase_url else "Not Set",
            "SUPABASE_SERVICE_KEY": "Set" if supabase_service_key else "Not Set",
            "JWT_SECRET_KEY": "Set" if jwt_secret_key else "Not Set"
        }
    )

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(customer_bp, url_prefix="/api/customers")
app.register_blueprint(product_bp, url_prefix="/api/products")
app.register_blueprint(sale_bp, url_prefix="/api/sales")
app.register_blueprint(expense_bp, url_prefix="/api/expenses")
app.register_blueprint(invoice_bp, url_prefix="/api/invoices")
app.register_blueprint(payment_bp, url_prefix="/api/payments")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(referral_bp, url_prefix="/api/referrals")
app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
app.register_blueprint(subscription_bp, url_prefix="/api/subscriptions")
app.register_blueprint(withdrawal_bp, url_prefix="/api/withdrawals")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(subscription_upgrade_bp, url_prefix="/api/subscription-upgrade")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

@app.before_request
def handle_options_requests():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers
        headers["Access-Control-Allow-Origin"] = "*"
        headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, PATCH, DELETE"
        headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response


