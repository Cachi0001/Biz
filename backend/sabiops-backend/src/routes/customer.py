from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import uuid
import logging

customer_bp = Blueprint("customer", __name__)
logger = logging.getLogger(__name__)

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
    logger.error(f"[CUSTOMER API ERROR] Status: {status_code}, Message: {message}, Error: {error}")
    return jsonify({
        "success": False,
        "error": str(error),
        "message": message
    }), status_code

def calculate_customer_stats(supabase, customer_id, owner_id):
    """Calculate customer statistics from sales and invoices"""
    try:
        # Get sales data for this customer
        sales_result = supabase.table('sales').select('total_amount, date, created_at').eq('customer_id', customer_id).eq('owner_id', owner_id).execute()
        
        # Get paid invoices for this customer
        invoices_result = supabase.table('invoices').select('total_amount, paid_date, created_at').eq('customer_id', customer_id).eq('owner_id', owner_id).eq('status', 'paid').execute()
        
        total_spent = 0
        total_purchases = 0
        last_purchase_date = None
        
        # Process sales data
        if sales_result.data:
            for sale in sales_result.data:
                total_spent += float(sale.get('total_amount', 0))
                total_purchases += 1
                
                # Get the most recent purchase date
                sale_date = sale.get('date') or sale.get('created_at')
                if sale_date:
                    purchase_date = datetime.fromisoformat(sale_date.replace('Z', '+00:00'))
                    if not last_purchase_date or purchase_date > last_purchase_date:
                        last_purchase_date = purchase_date
        
        # Process invoice data
        if invoices_result.data:
            for invoice in invoices_result.data:
                total_spent += float(invoice.get('total_amount', 0))
                # Don't count invoices as separate purchases if we already have sales
                if not sales_result.data:
                    total_purchases += 1
                
                # Get the most recent payment date
                payment_date = invoice.get('paid_date') or invoice.get('created_at')
                if payment_date:
                    pay_date = datetime.fromisoformat(payment_date.replace('Z', '+00:00'))
                    if not last_purchase_date or pay_date > last_purchase_date:
                        last_purchase_date = pay_date
        
        return {
            'total_spent': total_spent,
            'total_purchases': total_purchases,
            'last_purchase_date': last_purchase_date.isoformat() if last_purchase_date else None
        }
    except Exception as e:
        logger.error(f"Error calculating customer stats: {e}")
        return {
            'total_spent': 0,
            'total_purchases': 0,
            'last_purchase_date': None
        }

@customer_bp.route("/", methods=["GET"])
@jwt_required()
def get_customers():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Fetch customers associated with the owner_id
        customers_result = supabase.table("customers").select("*").eq("owner_id", owner_id).order("created_at", desc=True).execute()
        
        if not customers_result.data:
            return success_response(
                data={
                    "customers": [],
                    "total_count": 0
                },
                message="No customers found"
            )
        
        # Calculate statistics for each customer
        customers_with_stats = []
        for customer in customers_result.data:
            customer_stats = calculate_customer_stats(supabase, customer['id'], owner_id)
            
            # Add calculated stats to customer data
            customer_data = {
                **customer,
                'total_spent': customer_stats['total_spent'],
                'total_purchases': customer_stats['total_purchases'],
                'last_purchase_date': customer_stats['last_purchase_date']
            }
            customers_with_stats.append(customer_data)
        
        return success_response(
            data={
                "customers": customers_with_stats,
                "total_count": len(customers_with_stats)
            },
            message="Customers retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        return error_response("Failed to fetch customers", status_code=500)

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
        
        # Validate required fields
        if not data:
            return error_response("No data provided", status_code=400)
            
        required_fields = ["name"]
        for field in required_fields:
            if not data.get(field) or not data.get(field).strip():
                print(f"[CUSTOMER CREATE ERROR] Missing required field: {field}")
                return error_response(f"{field} is required", status_code=400)
        
        # Validate email format if provided
        email = data.get("email", "").strip()
        if email and "@" not in email:
            return error_response("Invalid email format", status_code=400)
        
        customer_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "name": data["name"].strip(),
            "email": email,
            "phone": data.get("phone", "").strip(),
            "address": data.get("address", "").strip(),
            "business_name": data.get("business_name", "").strip(),
            "notes": data.get("notes", "").strip(),
            "purchase_history": [],
            "interactions": [],
            "total_purchases": 0,
            "total_spent": 0,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = get_supabase().table("customers").insert(customer_data).execute()
        
        if not result.data:
            return error_response("Failed to create customer", status_code=500)
        
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
        import traceback
        traceback.print_exc()
        return error_response("Failed to create customer. Please try again.", status_code=500)

@customer_bp.route("/<customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        if not data:
            return error_response("No data provided", status_code=400)
        
        # Check if customer exists and belongs to owner
        customer_result = supabase.table("customers").select("*").eq("id", customer_id).eq("owner_id", owner_id).execute()
        if not customer_result.data:
            return error_response("Customer not found", status_code=404)
        
        # Validate required fields
        if data.get("name") and not data["name"].strip():
            return error_response("Customer name cannot be empty", status_code=400)
        
        # Validate email format if provided
        email = data.get("email", "").strip()
        if email and "@" not in email:
            return error_response("Invalid email format", status_code=400)
        
        # Build update data
        update_data = {
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update fields if provided
        if data.get("name"):
            update_data["name"] = data["name"].strip()
        if "email" in data:
            update_data["email"] = email
        if "phone" in data:
            update_data["phone"] = data.get("phone", "").strip()
        if "address" in data:
            update_data["address"] = data.get("address", "").strip()
        if "business_name" in data:
            update_data["business_name"] = data.get("business_name", "").strip()
        if "notes" in data:
            update_data["notes"] = data.get("notes", "").strip()
        
        # Update customer
        result = supabase.table("customers").update(update_data).eq("id", customer_id).execute()
        
        if not result.data:
            return error_response("Failed to update customer", status_code=500)
        
        # Get updated customer with stats
        customer_stats = calculate_customer_stats(supabase, customer_id, owner_id)
        updated_customer = {
            **result.data[0],
            'total_spent': customer_stats['total_spent'],
            'total_purchases': customer_stats['total_purchases'],
            'last_purchase_date': customer_stats['last_purchase_date']
        }
        
        return success_response(
            data={
                "customer": updated_customer
            },
            message="Customer updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating customer: {str(e)}")
        return error_response("Failed to update customer", status_code=500)

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



