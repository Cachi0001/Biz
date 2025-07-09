from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

customer_bp = Blueprint("customer", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    print(f"[CUSTOMER API ERROR] Status: {status_code}, Message: {message}, Error: {error}")
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@customer_bp.route("/", methods=["GET"])
@jwt_required()
def get_customers():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        # Fetch customers associated with the owner_id
        customers = get_supabase().table("customers").select("*").eq("owner_id", owner_id).execute()
        
        return success_response(
            data={
                "customers": customers.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@customer_bp.route("/<customer_id>", methods=["GET"])
@jwt_required()
def get_customer_by_id(customer_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        customer = get_supabase().table("customers").select("*").eq("id", customer_id).eq("owner_id", owner_id).execute()
        
        if not customer.data:
            return error_response("Customer not found", status_code=404)
        
        return success_response(
            data={
                "customer": customer.data[0]
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@customer_bp.route("/", methods=["POST"])
@jwt_required()
def create_customer():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"[CUSTOMER CREATE] Owner ID: {owner_id}, Data received: {data}")
        
        required_fields = ["name"]
        for field in required_fields:
            if not data.get(field):
                print(f"[CUSTOMER CREATE ERROR] Missing required field: {field}")
                return error_response(f"{field} is required", status_code=400)
        
        customer_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "name": data["name"],
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "address": data.get("address", ""),
            "business_name": data.get("business_name", ""),  # Added business_name
            "purchase_history": [],
            "interactions": [],
            "total_purchases": 0,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = get_supabase().table("customers").insert(customer_data).execute()
        
        print(f"[CUSTOMER CREATE SUCCESS] Customer created with ID: {result.data[0]['id']}")
        
        return success_response(
            message="Customer created successfully",
            data={
                "customer": result.data[0]
            },
            status_code=201
        )
        
    except Exception as e:
        print(f"[CUSTOMER CREATE EXCEPTION] {str(e)}")
        return error_response(str(e), status_code=500)

@customer_bp.route("/<customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        customer = get_supabase().table("customers").select("*").eq("id", customer_id).eq("owner_id", owner_id).execute()
        if not customer.data:
            return error_response("Customer not found", status_code=404)
        
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
        if data.get("business_name"):
            update_data["business_name"] = data["business_name"]
        
        get_supabase().table("customers").update(update_data).eq("id", customer_id).execute()
        
        return success_response(
            message="Customer updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@customer_bp.route("/<customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        customer = get_supabase().table("customers").select("*").eq("id", customer_id).eq("owner_id", owner_id).execute()
        if not customer.data:
            return error_response("Customer not found", status_code=404)
        
        get_supabase().table("customers").delete().eq("id", customer_id).execute()
        
        return success_response(
            message="Customer deleted successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)



