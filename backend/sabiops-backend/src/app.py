import os
import sys
from datetime import datetime, timedelta
from functools import wraps
import traceback
import logging

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
from .routes.auth import auth_bp
from .routes.customer import customer_bp
from .routes.invoice import invoice_bp
from .routes.product import product_bp
from .routes.sales import sales_bp
from .routes.expense import expense_bp
from .routes.team import team_bp
from .routes.user import user_bp
from .routes.payment import payment_bp
from .routes.dashboard import dashboard_bp
from .routes.notifications import notifications_bp
from .routes.search import search_bp
from .routes.data_integrity import data_integrity_bp
from .routes.transactions import transactions_bp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

    # Initialize extensions
    # Enable CORS for frontend and localhost
    CORS(
        app,
        origins=[
            "https://sabiops.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )
    print("[DEBUG] CORS initialized with origins: https://sabiops.vercel.app, http://localhost:3000, http://localhost:5173")
    jwt = JWTManager(app)

    # Check for required environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    print(f"[DEBUG] Supabase URL: {supabase_url}")
    print(f"[DEBUG] Supabase key available: {bool(supabase_key)}")
    print(f"[DEBUG] Supabase key starts with dummy: {supabase_key.startswith('dummy') if supabase_key else 'N/A'}")

    # Initialize Supabase client if credentials are available
    supabase = None
    if supabase_url and supabase_key and not (supabase_url.startswith('dummy') or supabase_key.startswith('dummy')):
        try:
            from supabase import create_client
            print(f"[DEBUG] Creating Supabase client with URL: {supabase_url}")
            supabase = create_client(supabase_url, supabase_key)
            app.config['SUPABASE'] = supabase
            print(f"[DEBUG] Supabase client created successfully")
            print(f"[DEBUG] Supabase client type: {type(supabase)}")
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize Supabase client: {e}")
            import traceback
            print(f"[ERROR] Supabase initialization traceback: {traceback.format_exc()}")
            logger.warning(f"Failed to initialize Supabase client: {e}")
            supabase = None
    else:
        print(f"[DEBUG] Running in development mode without Supabase")
        logger.info("Running in development mode without Supabase")

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

    @app.route('/routes', methods=['GET'])
    def list_routes():
        output = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods)
            output.append(f"{rule} [{methods}]")
        return '\n'.join(output), 200, {'Content-Type': 'text/plain'}

    @app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    def catch_all(path):
        return f"[DEBUG] You hit: /{path} with method {request.method}", 404

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
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(payment_bp, url_prefix='/payments')
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')
    app.register_blueprint(search_bp, url_prefix='/api')
    app.register_blueprint(data_integrity_bp, url_prefix='/api/data-integrity')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')

    @app.route('/debug', methods=['GET'])
    def debug():
        return 'Debug route is working!', 200

    @app.route('/debug/supabase', methods=['GET'])
    def debug_supabase():
        """Debug endpoint to test Supabase connection and table access"""
        try:
            if not supabase:
                return jsonify({
                    'error': 'Supabase not initialized',
                    'supabase_url': supabase_url,
                    'supabase_key_available': bool(supabase_key)
                }), 500
            
            # Test connection by trying to access the users table
            print(f"[DEBUG] Testing Supabase connection...")
            result = supabase.table("users").select("count", count="exact").execute()
            print(f"[DEBUG] Supabase test result: {result}")
            
            return jsonify({
                'status': 'success',
                'supabase_connected': True,
                'users_table_accessible': True,
                'user_count': result.count if hasattr(result, 'count') else 'unknown',
                'supabase_url': supabase_url,
                'client_type': str(type(supabase))
            }), 200
            
        except Exception as e:
            print(f"[ERROR] Supabase debug test failed: {e}")
            import traceback
            print(f"[ERROR] Supabase debug traceback: {traceback.format_exc()}")
            return jsonify({
                'error': 'Supabase test failed',
                'exception': str(e),
                'supabase_url': supabase_url,
                'supabase_key_available': bool(supabase_key)
            }), 500

    # Print all registered routes for debugging
    print('Registered routes:')
    for rule in app.url_map.iter_rules():
        print(rule)

    return app
