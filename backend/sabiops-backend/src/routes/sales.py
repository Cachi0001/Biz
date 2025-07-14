from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import uuid

sales_bp = Blueprint("sales", __name__)

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
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@sales_bp.route("/", methods=["GET"])
@jwt_required()
def get_sales():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        query = get_supabase().table("sales").select("*, customers(*), products(*)").eq("owner_id", owner_id)
        
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        customer_id = request.args.get("customer_id")
        product_id = request.args.get("product_id")
        
        if start_date:
            query = query.gte("date", start_date)
        
        if end_date:
            query = query.lte("date", end_date)
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if product_id:
            query = query.eq("product_id", product_id)
        
        sales = query.order("date", desc=True).execute()
        
        return success_response(
            data={
                "sales": sales.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@sales_bp.route("/", methods=["POST"])
@jwt_required()
def create_sale():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["product_id", "quantity", "unit_price", "total_amount"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        # Get product details including cost_price
        product_result = get_supabase().table("products").select("*").eq("id", data["product_id"]).eq("owner_id", owner_id).single().execute()
        if not product_result.data:
            return error_response("Product not found", status_code=404)
        
        product = product_result.data
        if product["quantity"] < int(data["quantity"]):
            return error_response("Not enough stock for this product", status_code=400)
        
        # Calculate COGS and gross profit
        quantity = int(data["quantity"])
        unit_price = float(data["unit_price"])
        total_amount = float(data["total_amount"])
        cost_price = float(product.get("cost_price", 0))
        total_cogs = quantity * cost_price
        gross_profit = total_amount - total_cogs
        
        sale_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "product_id": data["product_id"],
            "product_name": product["name"],
            "customer_id": data.get("customer_id"),
            "customer_name": data.get("customer_name", ""),
            "quantity": quantity,
            "unit_price": unit_price,
            "total_amount": total_amount,
            "total_cogs": total_cogs,
            "gross_profit": gross_profit,
            "payment_method": data.get("payment_method", "cash"),
            "salesperson_id": data.get("salesperson_id"),
            "date": data.get("date", datetime.now().isoformat()),
            "created_at": datetime.now().isoformat()
        }
        
        result = get_supabase().table("sales").insert(sale_data).execute()
        
        # Update product stock
        new_quantity = product_result.data["quantity"] - int(data["quantity"])
        get_supabase().table("products").update({"quantity": new_quantity}).eq("id", data["product_id"]).execute()
        
        return success_response(
            message="Sale created successfully",
            data={
                "sale": result.data[0]
            },
            status_code=201
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@sales_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_sales_stats():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        query = get_supabase().table("sales").select("*").eq("owner_id", owner_id)
        
        if start_date:
            query = query.gte("date", start_date)
        
        if end_date:
            query = query.lte("date", end_date)
        
        sales = query.execute().data
        
        total_sales = sum(float(sale["total_price"]) for sale in sales)
        total_transactions = len(sales)
        
        product_sales = {}
        for sale in sales:
            product_id = sale["product_id"]
            if product_id not in product_sales:
                product_sales[product_id] = {"quantity": 0, "total_revenue": 0.0}
            product_sales[product_id]["quantity"] += int(sale["quantity"])
            product_sales[product_id]["total_revenue"] += float(sale["total_price"])
        
        # Fetch product names for better readability
        product_ids = list(product_sales.keys())
        products_result = get_supabase().table("products").select("id, name").in_("id", product_ids).execute().data
        product_map = {p["id"]: p["name"] for p in products_result}
        
        top_selling_products = sorted(
            [
                {"product_id": pid, "product_name": product_map.get(pid, "Unknown"), **data} 
                for pid, data in product_sales.items()
            ],
            key=lambda x: x["total_revenue"],
            reverse=True
        )[:5]
        
        return success_response(
            data={
                "total_sales": total_sales,
                "total_transactions": total_transactions,
                "average_sale_value": total_sales / total_transactions if total_transactions > 0 else 0,
                "top_selling_products": top_selling_products
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)




