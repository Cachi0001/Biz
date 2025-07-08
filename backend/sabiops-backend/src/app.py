from flask import Flask, g
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from decouple import config
from .routes.auth import auth_bp
from .services.supabase_service import SupabaseService # Corrected import
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    # Restrict CORS to only allow the production frontend domain
    CORS(app, resources={r"/*": {"origins": ["https://sabiops.vercel.app"]}})

    app.config["JWT_SECRET_KEY"] = config("JWT_SECRET_KEY", default="super-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    jwt = JWTManager(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/auth")

    @app.before_request
    def before_request():
        g.supabase = SupabaseService() # Instantiate SupabaseService
        g.mock_db = {"users": [], "referrals": []} # Initialize mock_db for testing

    @app.route("/health")
    def health_check():
        return "OK", 200

    @app.route("/test-db")
    def test_db():
        try:
            if g.supabase and g.supabase.is_enabled(): # Check if Supabase is enabled
                # Attempt to fetch a small amount of data to test connection
                response = g.supabase.client.table("users").select("id").limit(1).execute()
                if response.data is not None:
                    return "Supabase DB connection successful!", 200
                else:
                    return f"Supabase DB connection failed: {response.error}", 500
            else:
                return "Running in mock DB mode.", 200
        except Exception as e:
            return f"Database connection error: {e}", 500

    return app


