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
# CUSTOMER MANAGEMENT ENDPOINTS
# ============================================================================

@app.route("/api/customers", methods=["GET"])
@jwt_required()
def get_customers():
    try:
        user_id = get_jwt_identity()
        result = supabase.table("customers").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return jsonify({
            "customers": result.data,
            "total": len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/customers", methods=["POST"])
@jwt_required()
def create_customer():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get("name"):
            return jsonify({"error": "Customer name is required"}), 400
        
        customer_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "business_id": user_id,
            "name": data["name"],
            "email": data.get("email"),
            "phone": data.get("phone"),
            "address": data.get("address")
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
        
        update_data = {}
        if data.get("name"):
            update_data["name"] = data["name"]
        if data.get("email"):
            update_data["email"] = data["email"]
        if data.get("phone"):
            update_data["phone"] = data["phone"]
        if data.get("address"):
            update_data["address"] = data["address"]
        
        result = supabase.table("customers").update(update_data).eq("id", customer_id).eq("user_id", user_id).execute()
        
        return jsonify({
            "message": "Customer updated successfully",
            "customer": result.data[0] if result.data else None
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/customers/<customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    try:
        user_id = get_jwt_identity()
        
        result = supabase.table("customers").delete().eq("id", customer_id).eq("user_id", user_id).execute()
        
        return jsonify({"message": "Customer deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# PRODUCT MANAGEMENT ENDPOINTS
# ============================================================================

@app.route("/api/products", methods=["GET"])
@jwt_required()
def get_products():
    try:
        user_id = get_jwt_identity()
        result = supabase.table("products").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return jsonify({
            "products": result.data,
            "total": len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/products", methods=["POST"])
@jwt_required()
def create_product():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["name", "price"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        product_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "business_id": user_id,
            "name": data["name"],
            "description": data.get("description"),
            "price": float(data["price"]),
            "quantity": int(data.get("quantity", 0)),
            "active": True
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
        
        update_data = {}
        if data.get("name"):
            update_data["name"] = data["name"]
        if data.get("description"):
            update_data["description"] = data["description"]
        if data.get("price"):
            update_data["price"] = float(data["price"])
        if data.get("quantity") is not None:
            update_data["quantity"] = int(data["quantity"])
        if data.get("active") is not None:
            update_data["active"] = data["active"]
        
        result = supabase.table("products").update(update_data).eq("id", product_id).eq("user_id", user_id).execute()
        
        return jsonify({
            "message": "Product updated successfully",
            "product": result.data[0] if result.data else None
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/products/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        user_id = get_jwt_identity()
        
        result = supabase.table("products").delete().eq("id", product_id).eq("user_id", user_id).execute()
        
        return jsonify({"message": "Product deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# INVOICE MANAGEMENT ENDPOINTS
# ============================================================================

@app.route("/api/invoices", methods=["GET"])
@jwt_required()
def get_invoices():
    try:
        user_id = get_jwt_identity()
        result = supabase.table("invoices").select("*, customers(name)").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return jsonify({
            "invoices": result.data,
            "total": len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/invoices", methods=["POST"])
@jwt_required()
def create_invoice():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["customer_id", "items"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Calculate totals
        subtotal = sum(float(item["price"]) * int(item["quantity"]) for item in data["items"])
        tax_amount = subtotal * 0.075  # 7.5% VAT
        total_amount = subtotal + tax_amount
        
        invoice_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "business_id": user_id,
            "customer_id": data["customer_id"],
            "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "status": "pending",
            "due_date": data.get("due_date"),
            "notes": data.get("notes")
        }
        
        invoice_result = supabase.table("invoices").insert(invoice_data).execute()
        
        if invoice_result.data:
            invoice_id = invoice_result.data[0]["id"]
            
            # Create invoice items
            for item in data["items"]:
                item_data = {
                    "id": str(uuid.uuid4()),
                    "invoice_id": invoice_id,
                    "product_id": item.get("product_id"),
                    "description": item["description"],
                    "quantity": int(item["quantity"]),
                    "price": float(item["price"]),
                    "total": float(item["price"]) * int(item["quantity"])
                }
                supabase.table("invoice_items").insert(item_data).execute()
            
            return jsonify({
                "message": "Invoice created successfully",
                "invoice": invoice_result.data[0]
            }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/invoices/<invoice_id>/status", methods=["PUT"])
@jwt_required()
def update_invoice_status(invoice_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get("status"):
            return jsonify({"error": "Status is required"}), 400
        
        update_data = {"status": data["status"]}
        if data["status"] == "paid":
            update_data["paid_at"] = datetime.now().isoformat()
        
        result = supabase.table("invoices").update(update_data).eq("id", invoice_id).eq("user_id", user_id).execute()
        
        return jsonify({
            "message": "Invoice status updated successfully",
            "invoice": result.data[0] if result.data else None
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# EXPENSE MANAGEMENT ENDPOINTS
# ============================================================================

@app.route("/api/expenses", methods=["GET"])
@jwt_required()
def get_expenses():
    try:
        user_id = get_jwt_identity()
        result = supabase.table("expenses").select("*").eq("user_id", user_id).order("expense_date", desc=True).execute()
        
        return jsonify({
            "expenses": result.data,
            "total": len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/expenses", methods=["POST"])
@jwt_required()
def create_expense():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["description", "amount", "category"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        expense_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "business_id": user_id,
            "description": data["description"],
            "amount": float(data["amount"]),
            "category": data["category"],
            "expense_date": data.get("expense_date", datetime.now().isoformat()),
            "receipt_url": data.get("receipt_url"),
            "notes": data.get("notes")
        }
        
        result = supabase.table("expenses").insert(expense_data).execute()
        
        return jsonify({
            "message": "Expense created successfully",
            "expense": result.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# DASHBOARD STATS ENDPOINT
# ============================================================================

@app.route("/api/dashboard/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    try:
        user_id = get_jwt_identity()
        
        # Get counts
        customers_result = supabase.table("customers").select("*").eq("user_id", user_id).execute()
        products_result = supabase.table("products").select("*").eq("user_id", user_id).execute()
        invoices_result = supabase.table("invoices").select("*").eq("user_id", user_id).execute()
        
        # Calculate totals
        products = supabase.table("products").select("price, quantity").eq("user_id", user_id).execute()
        total_inventory_value = sum(float(p["price"]) * int(p["quantity"]) for p in products.data)
        
        # Monthly revenue
        current_month = datetime.now().strftime("%Y-%m")
        monthly_invoices = supabase.table("invoices").select("total_amount").eq("user_id", user_id).gte("created_at", f"{current_month}-01").execute()
        monthly_revenue = sum(float(inv["total_amount"]) for inv in monthly_invoices.data)
        
        # Pending invoices
        pending_invoices = supabase.table("invoices").select("*").eq("user_id", user_id).eq("status", "pending").execute()
        
        return jsonify({
            "stats": {
                "total_customers": customers_result.count,
                "total_products": products_result.count,
                "total_invoices": invoices_result.count,
                "total_inventory_value": total_inventory_value,
                "pending_invoices": pending_invoices.count,
                "monthly_revenue": monthly_revenue
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# PAYMENT PROCESSING ENDPOINTS
# ============================================================================

@app.route("/api/payments/initialize", methods=["POST"])
@jwt_required()
def initialize_payment():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["amount", "email", "reference"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Here you would integrate with Paystack
        # For now, return a mock response
        
        payment_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "amount": float(data["amount"]),
            "email": data["email"],
            "reference": data["reference"],
            "status": "pending",
            "payment_method": "paystack",
            "invoice_id": data.get("invoice_id")
        }
        
        result = supabase.table("payments").insert(payment_data).execute()
        
        return jsonify({
            "message": "Payment initialized successfully",
            "payment": result.data[0],
            "authorization_url": f"https://checkout.paystack.com/{data['reference']}"  # Mock URL
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/payments/verify/<reference>", methods=["GET"])
@jwt_required()
def verify_payment(reference):
    try:
        user_id = get_jwt_identity()
        
        # Here you would verify with Paystack
        # For now, return a mock verification
        
        payment_result = supabase.table("payments").select("*").eq("reference", reference).eq("user_id", user_id).execute()
        
        if not payment_result.data:
            return jsonify({"error": "Payment not found"}), 404
        
        # Update payment status
        supabase.table("payments").update({"status": "completed", "verified_at": datetime.now().isoformat()}).eq("reference", reference).execute()
        
        return jsonify({
            "message": "Payment verified successfully",
            "status": "completed"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
