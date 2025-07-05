from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid

load_dotenv()

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

CORS(app)
jwt = JWTManager(app)

# Initialize Supabase client
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# ============================================================================
# HEALTH & TEST ENDPOINTS
# ============================================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "message": "SabiOps SME Nigeria API is running",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route("/api/test-db", methods=["GET"])
def test_database():
    try:
        result = supabase.table("users").select("*").limit(1).execute()
        return jsonify({
            "status": "success",
            "message": "Database connection working!",
            "tables_accessible": True
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/test-env", methods=["GET"])
def test_env():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY")
    
    return jsonify({
        "SUPABASE_URL": supabase_url if supabase_url else "Not Set",
        "SUPABASE_SERVICE_KEY": "Set" if supabase_service_key else "Not Set",
        "JWT_SECRET_KEY": "Set" if jwt_secret_key else "Not Set"
    }), 200

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        
        # Make business_name optional - only require essential fields
        required_fields = ["email", "phone", "password", "first_name", "last_name"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Check if user already exists
        existing_user_email = supabase.table("users").select("*").eq("email", data["email"]).execute()
        existing_user_phone = supabase.table("users").select("*").eq("phone", data["phone"]).execute()
        
        if existing_user_email.data:
            return jsonify({
                "error": "Email already exists",
                "message": "An account with this email already exists. Please use a different email or try logging in.",
                "field": "email"
            }), 400
            
        if existing_user_phone.data:
            return jsonify({
                "error": "Phone number already exists", 
                "message": "An account with this phone number already exists. Please use a different phone number or try logging in.",
                "field": "phone"
            }), 400
        
        password_hash = generate_password_hash(data["password"])
        
        user_data = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "phone": data["phone"],
            "password_hash": password_hash,
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "business_name": data.get("business_name", ""),  # Optional field with default empty string
            "role": "Owner",
            "subscription_plan": "weekly",
            "subscription_status": "trial",
            "active": True
        }
        
        result = supabase.table("users").insert(user_data).execute()
        
        if result.data:
            user = result.data[0]
            access_token = create_access_token(identity=user["id"])
            
            return jsonify({
                "message": "User registered successfully",
                "access_token": access_token,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "phone": user["phone"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "business_name": user["business_name"],
                    "role": user["role"],
                    "subscription_plan": user["subscription_plan"],
                    "subscription_status": user["subscription_status"]
                }
            }), 201
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        
        if not data.get("login") or not data.get("password"):
            return jsonify({
                "error": "Login credentials required",
                "message": "Email/Phone and password are required",
                "field": "login"
            }), 400
        
        login_field = data["login"]
        password = data["password"]
        
        # Check if login is email or phone
        if "@" in login_field:
            user_result = supabase.table("users").select("*").eq("email", login_field).execute()
        else:
            user_result = supabase.table("users").select("*").eq("phone", login_field).execute()
        
        if not user_result.data:
            return jsonify({
                "error": "Invalid credentials",
                "message": "No account found with this email or phone number. Please check your credentials or sign up for a new account.",
                "field": "login"
            }), 401
        
        user = user_result.data[0]
        
        if not check_password_hash(user["password_hash"], password):
            return jsonify({
                "error": "Invalid credentials",
                "message": "Incorrect password. Please check your password and try again.",
                "field": "password"
            }), 401
        
        if not user.get("active", True):
            return jsonify({
                "error": "Account deactivated",
                "message": "Your account has been deactivated. Please contact support for assistance.",
                "field": "account"
            }), 401
        
        # Update last login
        supabase.table("users").update({"last_login": datetime.now().isoformat()}).eq("id", user["id"]).execute()
        
        access_token = create_access_token(identity=user["id"])
        
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "phone": user["phone"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "business_name": user["business_name"],
                "role": user["role"],
                "subscription_plan": user["subscription_plan"],
                "subscription_status": user["subscription_status"]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Login failed",
            "message": f"An error occurred during login: {str(e)}"
        }), 500

@app.route("/api/auth/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user_result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not user_result.data:
            return jsonify({"error": "User not found"}), 404
        
        user = user_result.data[0]
        
        return jsonify({
            "user": {
                "id": user["id"],
                "email": user["email"],
                "phone": user["phone"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "business_name": user["business_name"],
                "role": user["role"],
                "subscription_plan": user["subscription_plan"],
                "subscription_status": user["subscription_status"],
                "referral_code": user["referral_code"],
                "trial_ends_at": user["trial_ends_at"]
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# TEAM MANAGEMENT ENDPOINTS
# ============================================================================

@app.route("/api/team", methods=["GET"])
@jwt_required()
def get_team_members():
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check if they're an owner
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        if user["role"] != "Owner":
            return jsonify({"error": "Only owners can view team members"}), 403
        
        # Get team members (salespeople created by this owner)
        team_members = supabase.table("salespeople").select("*, salesperson_user_id(*)").eq("user_id", user_id).execute()
        
        return jsonify({
            "team_members": team_members.data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/team", methods=["POST"])
@jwt_required()
def create_team_member():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get current user to check if they're an owner
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        if user["role"] != "Owner":
            return jsonify({"error": "Only owners can create team members"}), 403
        
        # Validate required fields
        required_fields = ["first_name", "last_name", "email", "password"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Check if email already exists
        existing_user = supabase.table("users").select("*").eq("email", data["email"]).execute()
        if existing_user.data:
            return jsonify({"error": "Email already exists"}), 400
        
        # Create user account for the team member
        password_hash = generate_password_hash(data["password"])
        
        team_member_data = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "phone": data.get("phone", ""),
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "business_name": user["business_name"],  # Inherit from owner
            "role": data.get("role", "Salesperson"),
            "subscription_plan": "team_member",
            "subscription_status": "active",
            "password_hash": password_hash,
            "active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Create user account
        user_result = supabase.table("users").insert(team_member_data).execute()
        if not user_result.data:
            return jsonify({"error": "Failed to create user account"}), 500
        
        team_member_user = user_result.data[0]
        
        # Create salespeople record
        salesperson_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,  # Owner's ID
            "salesperson_user_id": team_member_user["id"],  # Team member's user ID
            "name": f"{data['first_name']} {data['last_name']}",
            "email": data["email"],
            "phone": data.get("phone", ""),
            "active": True,
            "permissions": {
                "can_create_sales": True,
                "can_view_reports": data.get("role") == "Admin"
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        salesperson_result = supabase.table("salespeople").insert(salesperson_data).execute()
        
        return jsonify({
            "message": "Team member created successfully",
            "team_member": salesperson_result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/team/<team_member_id>", methods=["PUT"])
@jwt_required()
def update_team_member(team_member_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get current user to check if they're an owner
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        if user["role"] != "Owner":
            return jsonify({"error": "Only owners can update team members"}), 403
        
        # Get the salesperson record
        salesperson = supabase.table("salespeople").select("*").eq("id", team_member_id).eq("user_id", user_id).execute()
        if not salesperson.data:
            return jsonify({"error": "Team member not found"}), 404
        
        salesperson_data = salesperson.data[0]
        
        # Update user account if needed
        user_updates = {}
        if data.get("first_name"):
            user_updates["first_name"] = data["first_name"]
        if data.get("last_name"):
            user_updates["last_name"] = data["last_name"]
        if data.get("phone"):
            user_updates["phone"] = data["phone"]
        if data.get("role"):
            user_updates["role"] = data["role"]
        if data.get("password"):
            user_updates["password_hash"] = generate_password_hash(data["password"])
        
        if user_updates:
            user_updates["updated_at"] = datetime.now().isoformat()
            supabase.table("users").update(user_updates).eq("id", salesperson_data["salesperson_user_id"]).execute()
        
        # Update salesperson record
        salesperson_updates = {}
        if data.get("first_name") or data.get("last_name"):
            salesperson_updates["name"] = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        if data.get("phone"):
            salesperson_updates["phone"] = data["phone"]
        if data.get("role"):
            salesperson_updates["permissions"] = {
                "can_create_sales": True,
                "can_view_reports": data["role"] == "Admin"
            }
        
        if salesperson_updates:
            salesperson_updates["updated_at"] = datetime.now().isoformat()
            supabase.table("salespeople").update(salesperson_updates).eq("id", team_member_id).execute()
        
        return jsonify({
            "message": "Team member updated successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/team/<team_member_id>", methods=["DELETE"])
@jwt_required()
def delete_team_member(team_member_id):
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check if they're an owner
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        if user["role"] != "Owner":
            return jsonify({"error": "Only owners can delete team members"}), 403
        
        # Get the salesperson record
        salesperson = supabase.table("salespeople").select("*").eq("id", team_member_id).eq("user_id", user_id).execute()
        if not salesperson.data:
            return jsonify({"error": "Team member not found"}), 404
        
        salesperson_data = salesperson.data[0]
        
        # Deactivate the user account instead of deleting
        supabase.table("users").update({
            "active": False,
            "updated_at": datetime.now().isoformat()
        }).eq("id", salesperson_data["salesperson_user_id"]).execute()
        
        # Deactivate the salesperson record
        supabase.table("salespeople").update({
            "active": False,
            "updated_at": datetime.now().isoformat()
        }).eq("id", team_member_id).execute()
        
        return jsonify({
            "message": "Team member deactivated successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/team/<team_member_id>/reset-password", methods=["POST"])
@jwt_required()
def reset_team_member_password(team_member_id):
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check if they're an owner
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        if user["role"] != "Owner":
            return jsonify({"error": "Only owners can reset team member passwords"}), 403
        
        # Get the salesperson record
        salesperson = supabase.table("salespeople").select("*").eq("id", team_member_id).eq("user_id", user_id).execute()
        if not salesperson.data:
            return jsonify({"error": "Team member not found"}), 404
        
        salesperson_data = salesperson.data[0]
        
        # Generate temporary password
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        password_hash = generate_password_hash(temp_password)
        
        # Update user password
        supabase.table("users").update({
            "password_hash": password_hash,
            "updated_at": datetime.now().isoformat()
        }).eq("id", salesperson_data["salesperson_user_id"]).execute()
        
        return jsonify({
            "message": "Password reset successfully",
            "temporary_password": temp_password
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# CUSTOMERS ENDPOINTS
# ============================================================================

@app.route("/api/customers", methods=["GET"])
@jwt_required()
def get_customers():
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check role
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        
        # Role-based access: Owners see all customers, Salespeople see customers they created
        if user["role"] == "Owner":
            customers = supabase.table("customers").select("*").eq("user_id", user_id).execute()
        else:
            customers = supabase.table("customers").select("*").eq("user_id", user_id).execute()
        
        return jsonify({
            "customers": customers.data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/customers", methods=["POST"])
@jwt_required()
def create_customer():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["name"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        customer_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": data["name"],
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "address": data.get("address", ""),
            "purchase_history": [],
            "interactions": [],
            "total_purchases": 0,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = supabase.table("customers").insert(customer_data).execute()
        
        return jsonify({
            "message": "Customer created successfully",
            "customer": result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/customers/<customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if customer exists and belongs to user
        customer = supabase.table("customers").select("*").eq("id", customer_id).eq("user_id", user_id).execute()
        if not customer.data:
            return jsonify({"error": "Customer not found"}), 404
        
        update_data = {
            "updated_at": datetime.now().isoformat()
        }
        
        if data.get("name"):
            update_data["name"] = data["name"]
        if data.get("email"):
            update_data["email"] = data["email"]
        if data.get("phone"):
            update_data["phone"] = data["phone"]
        if data.get("address"):
            update_data["address"] = data["address"]
        
        supabase.table("customers").update(update_data).eq("id", customer_id).execute()
        
        return jsonify({
            "message": "Customer updated successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/customers/<customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    try:
        user_id = get_jwt_identity()
        
        # Check if customer exists and belongs to user
        customer = supabase.table("customers").select("*").eq("id", customer_id).eq("user_id", user_id).execute()
        if not customer.data:
            return jsonify({"error": "Customer not found"}), 404
        
        supabase.table("customers").delete().eq("id", customer_id).execute()
        
        return jsonify({
            "message": "Customer deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# PRODUCTS ENDPOINTS
# ============================================================================

@app.route("/api/products", methods=["GET"])
@jwt_required()
def get_products():
    try:
        user_id = get_jwt_identity()
        
        products = supabase.table("products").select("*").eq("user_id", user_id).execute()
        
        return jsonify({
            "products": products.data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/products", methods=["POST"])
@jwt_required()
def create_product():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["name", "price"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        product_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": data["name"],
            "description": data.get("description", ""),
            "price": float(data["price"]),
            "cost_price": float(data.get("cost_price", 0)),
            "quantity": int(data.get("quantity", 0)),
            "low_stock_threshold": int(data.get("low_stock_threshold", 5)),
            "category": data.get("category", ""),
            "sku": data.get("sku", ""),
            "active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = supabase.table("products").insert(product_data).execute()
        
        return jsonify({
            "message": "Product created successfully",
            "product": result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/products/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if product exists and belongs to user
        product = supabase.table("products").select("*").eq("id", product_id).eq("user_id", user_id).execute()
        if not product.data:
            return jsonify({"error": "Product not found"}), 404
        
        update_data = {
            "updated_at": datetime.now().isoformat()
        }
        
        if data.get("name"):
            update_data["name"] = data["name"]
        if data.get("description"):
            update_data["description"] = data["description"]
        if data.get("price"):
            update_data["price"] = float(data["price"])
        if data.get("cost_price"):
            update_data["cost_price"] = float(data["cost_price"])
        if data.get("quantity"):
            update_data["quantity"] = int(data["quantity"])
        if data.get("category"):
            update_data["category"] = data["category"]
        if data.get("sku"):
            update_data["sku"] = data["sku"]
        
        supabase.table("products").update(update_data).eq("id", product_id).execute()
        
        return jsonify({
            "message": "Product updated successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/products/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        user_id = get_jwt_identity()
        
        # Check if product exists and belongs to user
        product = supabase.table("products").select("*").eq("id", product_id).eq("user_id", user_id).execute()
        if not product.data:
            return jsonify({"error": "Product not found"}), 404
        
        # Soft delete by setting active to false
        supabase.table("products").update({
            "active": False,
            "updated_at": datetime.now().isoformat()
        }).eq("id", product_id).execute()
        
        return jsonify({
            "message": "Product deleted successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# SALES ENDPOINTS
# ============================================================================

@app.route("/api/sales", methods=["GET"])
@jwt_required()
def get_sales():
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check role
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        
        # Role-based access: Owners see all sales, Salespeople see only their sales
        if user["role"] == "Owner":
            sales = supabase.table("sales").select("*").eq("user_id", user_id).execute()
        else:
            sales = supabase.table("sales").select("*").eq("salesperson_id", user_id).execute()
        
        return jsonify({
            "sales": sales.data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/sales", methods=["POST"])
@jwt_required()
def create_sale():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get current user to check role
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        
        # Validate required fields
        required_fields = ["product_name", "quantity", "unit_price"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        quantity = int(data["quantity"])
        unit_price = float(data["unit_price"])
        total_amount = quantity * unit_price
        
        # Determine the business owner (for salespeople, find their owner)
        business_owner_id = user_id
        if user["role"] == "Salesperson":
            # Find the owner who created this salesperson
            salesperson_record = supabase.table("salespeople").select("*").eq("salesperson_user_id", user_id).execute()
            if salesperson_record.data:
                business_owner_id = salesperson_record.data[0]["user_id"]
        
        sale_data = {
            "id": str(uuid.uuid4()),
            "user_id": business_owner_id,  # Business owner's ID
            "customer_id": data.get("customer_id"),
            "customer_name": data.get("customer_name", "Walk-in Customer"),
            "product_id": data.get("product_id"),
            "product_name": data["product_name"],
            "quantity": quantity,
            "unit_price": unit_price,
            "total_amount": total_amount,
            "payment_method": data.get("payment_method", "cash"),
            "salesperson_id": user_id,  # Who made the sale
            "date": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        
        result = supabase.table("sales").insert(sale_data).execute()
        
        # Update product quantity if product_id is provided
        if data.get("product_id"):
            product = supabase.table("products").select("*").eq("id", data["product_id"]).execute()
            if product.data:
                current_quantity = product.data[0]["quantity"]
                new_quantity = max(0, current_quantity - quantity)
                supabase.table("products").update({
                    "quantity": new_quantity,
                    "updated_at": datetime.now().isoformat()
                }).eq("id", data["product_id"]).execute()
        
        return jsonify({
            "message": "Sale created successfully",
            "sale": result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# EXPENSES ENDPOINTS
# ============================================================================

@app.route("/api/expenses", methods=["GET"])
@jwt_required()
def get_expenses():
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check role
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        
        # Only owners can view expenses
        if user["role"] != "Owner":
            return jsonify({"error": "Only owners can view expenses"}), 403
        
        expenses = supabase.table("expenses").select("*").eq("user_id", user_id).execute()
        
        return jsonify({
            "expenses": expenses.data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/expenses", methods=["POST"])
@jwt_required()
def create_expense():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get current user to check role
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        
        # Only owners can create expenses
        if user["role"] != "Owner":
            return jsonify({"error": "Only owners can create expenses"}), 403
        
        # Validate required fields
        required_fields = ["category", "amount"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        expense_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "category": data["category"],
            "amount": float(data["amount"]),
            "description": data.get("description", ""),
            "payment_method": data.get("payment_method", "cash"),
            "date": data.get("date", datetime.now().isoformat()),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = supabase.table("expenses").insert(expense_data).execute()
        
        return jsonify({
            "message": "Expense created successfully",
            "expense": result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# DASHBOARD ENDPOINTS
# ============================================================================

@app.route("/api/dashboard/overview", methods=["GET"])
@jwt_required()
def get_dashboard_overview():
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check role
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        
        # Get sales data based on role
        if user["role"] == "Owner":
            sales = supabase.table("sales").select("*").eq("user_id", user_id).execute()
            expenses = supabase.table("expenses").select("*").eq("user_id", user_id).execute()
        else:
            sales = supabase.table("sales").select("*").eq("salesperson_id", user_id).execute()
            expenses = {"data": []}  # Salespeople can't see expenses
        
        # Calculate totals
        total_sales = sum(float(sale["total_amount"]) for sale in sales.data)
        total_expenses = sum(float(expense["amount"]) for expense in expenses.data) if expenses.data else 0
        net_profit = total_sales - total_expenses
        
        # Get product count
        products = supabase.table("products").select("*").eq("user_id", user_id if user["role"] == "Owner" else user_id).execute()
        
        # Get customer count
        customers = supabase.table("customers").select("*").eq("user_id", user_id if user["role"] == "Owner" else user_id).execute()
        
        return jsonify({
            "total_sales": total_sales,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "total_products": len(products.data),
            "total_customers": len(customers.data),
            "recent_sales": sales.data[-5:] if sales.data else []
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/dashboard/revenue-chart", methods=["GET"])
@jwt_required()
def get_revenue_chart():
    try:
        user_id = get_jwt_identity()
        
        # Get current user to check role
        current_user = supabase.table("users").select("*").eq("id", user_id).execute()
        if not current_user.data:
            return jsonify({"error": "User not found"}), 404
        
        user = current_user.data[0]
        
        # Get sales data based on role
        if user["role"] == "Owner":
            sales = supabase.table("sales").select("*").eq("user_id", user_id).execute()
        else:
            sales = supabase.table("sales").select("*").eq("salesperson_id", user_id).execute()
        
        # Group sales by date for chart
        from collections import defaultdict
        daily_sales = defaultdict(float)
        
        for sale in sales.data:
            sale_date = sale["date"][:10]  # Get just the date part
            daily_sales[sale_date] += float(sale["total_amount"])
        
        chart_data = [
            {"date": date, "revenue": amount}
            for date, amount in sorted(daily_sales.items())
        ]
        
        return jsonify({
            "chart_data": chart_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
