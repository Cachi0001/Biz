import os
import sys
from datetime import datetime, timedelta
from functools import wraps
import traceback
import logging

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import route modules
from routes.auth import auth_bp
from routes.customer import customer_bp
from routes.invoice import invoice_bp
from routes.product import product_bp
from routes.sales import sales_bp
from routes.expense import expense_bp
from routes.team import team_bp
from routes.payment import payment_bp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
CORS(
    app,
    origins=["https://sabiops.vercel.app"],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)
jwt = JWTManager(app)

# Check for required environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

# Initialize Supabase client if credentials are available
supabase = None
if supabase_url and supabase_key and not (supabase_url.startswith('dummy') or supabase_key.startswith('dummy')):
    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        app.config['SUPABASE'] = supabase
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {e}")
        supabase = None
else:
    logger.info("Running in development mode without Supabase")

# Mock database for development/testing
if not supabase:
    app.config['MOCK_DB'] = {
        'users': [],
        'customers': [],
        'products': [],
        'invoices': [],
        'sales': [],
        'expenses': [],
        'team': [],
        'transactions': [],
        'payments': [],
        'settings': {}
    }

# Remove the insecure preflight handler for OPTIONS requests

@app.before_request
def load_user():
    """Load user information for authenticated requests"""
    g.user = None
    g.supabase = supabase
    g.mock_db = app.config.get('MOCK_DB')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled exception: {e}")
    logger.error(traceback.format_exc())
    return jsonify({'error': 'An unexpected error occurred'}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'supabase_connected': supabase is not None,
        'mode': 'production' if supabase else 'development'
    })

# API info endpoint
@app.route('/', methods=['GET'])
def api_info():
    return jsonify({
        'name': 'SabiOps API',
        'version': '1.0.0',
        'description': 'Business management API for Nigerian SMEs',
        'endpoints': {
            'auth': '/auth/*',
            'customers': '/customers/*',
            'products': '/products/*',
            'invoices': '/invoices/*',
            'sales': '/sales/*',
            'expenses': '/expenses/*',
            'team': '/team/*',
            'payments': '/payments/*'
        },
        'health': '/health'
    })

# Add a global OPTIONS handler for all routes (for Vercel compatibility)
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 204

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(customer_bp, url_prefix='/customers')
app.register_blueprint(invoice_bp, url_prefix='/invoices')
app.register_blueprint(product_bp, url_prefix='/products')
app.register_blueprint(sales_bp, url_prefix='/sales')
app.register_blueprint(expense_bp, url_prefix='/expenses')
app.register_blueprint(team_bp, url_prefix='/team')
app.register_blueprint(payment_bp, url_prefix='/payments')

# Vercel expects the Flask app to be exported as 'app'.
# Remove the '__main__' block for serverless compatibility.

