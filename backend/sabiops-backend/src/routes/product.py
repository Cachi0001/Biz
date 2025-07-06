from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

product_bp = Blueprint("product", __name__)

def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    print(f"API Error: {message} - {error}") # Added detailed error logging
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@product_bp.route("/", methods=["GET"])
@jwt_required()
def get_products():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        
        query = supabase.table("products").select("*").eq("owner_id", owner_id)
        
        category = request.args.get("category")
        search = request.args.get("search")
        active_only = request.args.get("active_only", "true").lower() == "true"
        
        if active_only:
            query = query.eq("active", True)
        
        if category:
            query = query.eq("category", category)
        
        if search:
            query = query.ilike("name", f"%{search}%").ilike("sku", f"%{search}%")
        
        products = query.order("created_at", desc=True).execute()
        
        return success_response(
            data={
                "products": products.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@product_bp.route("/<product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        
        if not product.data:
            return error_response("Product not found", status_code=404)
        
        return success_response(
            data={
                "product": product.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@product_bp.route("/", methods=["POST"])
@jwt_required()
def create_product():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        # Required fields based on Bizflow SME Nigeria Product Creation Fields
        required_fields = ["name", "price", "quantity"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        product_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "name": data["name"],
            "description": data.get("description", ""),
            "price": float(data["price"]),
            "cost_price": float(data.get("cost_price", 0)),
            "quantity": int(data["quantity"]),
            "low_stock_threshold": int(data.get("low_stock_threshold", 5)),
            "category": data.get("category", ""),
            "sku": data.get("sku", ""),
            "image_url": data.get("image_url", ""), # Added image_url
            "active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = supabase.table("products").insert(product_data).execute()
        
        return success_response(
            message="Product created successfully",
            data={
                "product": result.data[0]
            },
            status_code=201
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@product_bp.route("/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        if not product.data:
            return error_response("Product not found", status_code=404)
        
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
        if data.get("image_url") is not None: # Added image_url
            update_data["image_url"] = data["image_url"]
        if data.get("active") is not None:
            update_data["active"] = data["active"]
        
        supabase.table("products").update(update_data).eq("id", product_id).execute()
        
        return success_response(
            message="Product updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@product_bp.route("/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        
        product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        if not product.data:
            return error_response("Product not found", status_code=404)
        
        supabase.table("products").update({
            "active": False,
            "updated_at": datetime.now().isoformat()
        }).eq("id", product_id).execute()
        
        return success_response(
            message="Product deleted successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@product_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        
        products = supabase.table("products").select("category").eq("owner_id", owner_id).eq("active", True).execute()
        
        categories = list(set([p["category"] for p in products.data if p["category"]]))
        
        return success_response(
            data={
                "categories": categories
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@product_bp.route("/low-stock", methods=["GET"])
@jwt_required()
def get_low_stock_products():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        
        products = supabase.table("products").select("*").eq("owner_id", owner_id).eq("active", True).execute()
        
        low_stock_products = [p for p in products.data if p["quantity"] <= p["low_stock_threshold"]]
        
        return success_response(
            data={
                "low_stock_products": low_stock_products
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@product_bp.route("/<product_id>/stock", methods=["PUT"])
@jwt_required()
def update_stock(product_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        
        product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        if not product.data:
            return error_response("Product not found", status_code=404)
        
        data = request.get_json()
        
        if "quantity_change" not in data:
            return error_response("quantity_change is required", status_code=400)
        
        quantity_change = int(data["quantity_change"])
        new_quantity = product.data["quantity"] + quantity_change
        
        supabase.table("products").update({"quantity": new_quantity, "updated_at": datetime.now().isoformat()}).eq("id", product_id).execute()
        
        return success_response(
            message="Stock updated successfully",
            data={
                "product": {"id": product_id, "quantity": new_quantity}
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)




