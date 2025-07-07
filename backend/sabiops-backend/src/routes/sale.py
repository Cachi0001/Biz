from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
import uuid
from collections import defaultdict

sale_bp = Blueprint("sale", __name__)

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

@sale_bp.route("/", methods=["GET"])
@jwt_required()
def get_sales():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        
        query = get_supabase().table("sales").select("*").eq("user_id", user_id)
        
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        payment_method = request.args.get("payment_method")
        payment_status = request.args.get("payment_status")
        salesperson_id = request.args.get("salesperson_id")
        
        if start_date:
            query = query.gte("sale_date", start_date)
        
        if end_date:
            query = query.lte("sale_date", end_date)
        
        if payment_method:
            query = query.eq("payment_method", payment_method)
        
        if payment_status:
            query = query.eq("payment_status", payment_status)
        
        if salesperson_id:
            query = query.eq("salesperson_id", salesperson_id)
        
        sales = query.order("created_at", desc=True).execute()
        
        return success_response(
            data={
                "sales": sales.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@sale_bp.route("/", methods=["POST"])
@jwt_required()
def create_sale():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["payment_method", "sale_items"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        if not data["sale_items"]:
            return error_response("At least one sale item is required", status_code=400)
        
        total_amount = 0
        sale_items_processed = []
        for item_data in data["sale_items"]:
            if "product_name" not in item_data or "quantity" not in item_data or "unit_price" not in item_data:
                return error_response("Each sale item must have product_name, quantity, and unit_price", status_code=400)
            
            quantity = int(item_data["quantity"])
            unit_price = float(item_data["unit_price"])
            
            item_total = quantity * unit_price
            
            sale_items_processed.append({
                "product_id": item_data.get("product_id"),
                "product_name": item_data["product_name"],
                "product_sku": item_data.get("product_sku"),
                "quantity": quantity,
                "unit_price": unit_price,
                "discount_percentage": float(item_data.get("discount_percentage", 0)),
                "discount_amount": float(item_data.get("discount_amount", 0)),
                "tax_percentage": float(item_data.get("tax_percentage", 0)),
                "tax_amount": float(item_data.get("tax_amount", 0)),
                "total_amount": item_total
            })
            total_amount += item_total
            
            if item_data.get("product_id"):
                product_result = get_supabase().table("products").select("*").eq("id", item_data["product_id"]).single().execute()
                if product_result.data:
                    current_quantity = product_result.data["quantity"]
                    new_quantity = max(0, current_quantity - quantity)
                    get_supabase().table("products").update({"quantity": new_quantity, "updated_at": datetime.now().isoformat()}).eq("id", item_data["product_id"]).execute()
        
        sale_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "customer_id": data.get("customer_id"),
            "salesperson_id": data.get("salesperson_id", user_id),
            "payment_method": data["payment_method"],
            "payment_status": data.get("payment_status", "completed"),
            "payment_reference": data.get("payment_reference"),
            "discount_amount": float(data.get("discount_amount", 0)),
            "tax_amount": float(data.get("tax_amount", 0)),
            "notes": data.get("notes"),
            "commission_rate": float(data.get("commission_rate", 0)),
            "total_amount": total_amount,
            "net_amount": total_amount - float(data.get("discount_amount", 0)) + float(data.get("tax_amount", 0)),
            "sale_items": sale_items_processed,
            "sale_date": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        
        if sale_data["commission_rate"] > 0:
            sale_data["commission_amount"] = sale_data["net_amount"] * (sale_data["commission_rate"] / 100)
        else:
            sale_data["commission_amount"] = 0
        
        result = get_supabase().table("sales").insert(sale_data).execute()
        
        return success_response(
            message="Sale created successfully",
            data={
                "sale": result.data[0]
            },
            status_code=201
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@sale_bp.route("/<sale_id>", methods=["GET"])
@jwt_required()
def get_sale(sale_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        sale = get_supabase().table("sales").select("*").eq("id", sale_id).eq("user_id", user_id).single().execute()
        
        if not sale.data:
            return error_response("Sale not found", status_code=404)
        
        return success_response(
            data={
                "sale": sale.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@sale_bp.route("/<sale_id>", methods=["PUT"])
@jwt_required()
def update_sale(sale_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        sale = get_supabase().table("sales").select("*").eq("id", sale_id).eq("user_id", user_id).single().execute()
        
        if not sale.data:
            return error_response("Sale not found", status_code=404)
        
        data = request.get_json()
        
        update_data = {"updated_at": datetime.now().isoformat()}
        
        if "payment_status" in data:
            update_data["payment_status"] = data["payment_status"]
        if "payment_reference" in data:
            update_data["payment_reference"] = data["payment_reference"]
        if "notes" in data:
            update_data["notes"] = data["notes"]
        
        get_supabase().table("sales").update(update_data).eq("id", sale_id).execute()
        
        return success_response(
            message="Sale updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@sale_bp.route("/daily-report", methods=["GET"])
@jwt_required()
def get_daily_sales_report():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        report_date_str = request.args.get("date", datetime.now().strftime("%Y-%m-%d"))
        
        report_date = datetime.strptime(report_date_str, "%Y-%m-%d").date()
        
        sales_result = get_supabase().table("sales").select("*").eq("user_id", user_id).gte("sale_date", report_date.isoformat()).lte("sale_date", (report_date + timedelta(days=1)).isoformat()).execute()
        sales = sales_result.data
        
        total_sales = len(sales)
        total_amount = sum(float(sale["net_amount"]) for sale in sales)
        total_quantity = sum(sum(item["quantity"] for item in sale["sale_items"]) for sale in sales)
        
        payment_methods = defaultdict(lambda: {"count": 0, "total": 0.0})
        for sale in sales:
            method = sale["payment_method"]
            payment_methods[method]["count"] += 1
            payment_methods[method]["total"] += float(sale["net_amount"])
        
        product_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0.0})
        for sale in sales:
            for item in sale["sale_items"]:
                product_name = item["product_name"]
                product_sales[product_name]["quantity"] += item["quantity"]
                product_sales[product_name]["revenue"] += float(item["total_amount"])
        
        top_products = sorted(
            product_sales.items(),
            key=lambda x: x[1]["quantity"],
            reverse=True
        )[:10]
        
        hourly_sales = defaultdict(lambda: {"count": 0, "total": 0.0})
        for sale in sales:
            sale_dt = datetime.fromisoformat(sale["sale_date"])
            hour = sale_dt.hour
            hourly_sales[hour]["count"] += 1
            hourly_sales[hour]["total"] += float(sale["net_amount"])
        
        return success_response({
            "date": report_date.isoformat(),
            "summary": {
                "total_sales": total_sales,
                "total_amount": total_amount,
                "total_quantity": total_quantity,
                "average_sale": total_amount / total_sales if total_sales > 0 else 0
            },
            "payment_methods": dict(payment_methods),
            "top_products": [
                {"product": product, "stats": stats} 
                for product, stats in top_products
            ],
            "hourly_breakdown": dict(hourly_sales),
            "sales": sales
        })
    
    except ValueError as e:
        return error_response("Invalid date format. Use YYYY-MM-DD", status_code=400)
    except Exception as e:
        return error_response(str(e), status_code=500)

@sale_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_sales_analytics():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        period = request.args.get("period", "30")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=int(period))
        
        sales_result = get_supabase().table("sales").select("*").eq("user_id", user_id).gte("sale_date", start_date.isoformat()).lte("sale_date", end_date.isoformat()).execute()
        sales = sales_result.data
        
        total_revenue = sum(float(sale["net_amount"]) for sale in sales)
        total_sales = len(sales)
        total_items_sold = sum(sum(item["quantity"] for item in sale["sale_items"]) for sale in sales)
        
        daily_revenue = defaultdict(float)
        current_date = start_date
        while current_date <= end_date:
            daily_revenue[current_date.isoformat()] = 0.0
            current_date += timedelta(days=1)
        
        for sale in sales:
            sale_dt = datetime.fromisoformat(sale["sale_date"])
            date_key = sale_dt.date().isoformat()
            daily_revenue[date_key] += float(sale["net_amount"])
        
        customer_revenue = defaultdict(lambda: {"customer": None, "total_revenue": 0.0, "total_orders": 0})
        for sale in sales:
            if sale.get("customer_id"):
                customer_id = sale["customer_id"]
                if customer_revenue[customer_id]["customer"] is None:
                    customer_result = get_supabase().table("customers").select("*").eq("id", customer_id).single().execute()
                    if customer_result.data:
                        customer_revenue[customer_id]["customer"] = customer_result.data
                customer_revenue[customer_id]["total_revenue"] += float(sale["net_amount"])
                customer_revenue[customer_id]["total_orders"] += 1
        
        top_customers = sorted(
            [val for val in customer_revenue.values() if val["customer"] is not None],
            key=lambda x: x["total_revenue"],
            reverse=True
        )[:10]
        
        payment_method_stats = defaultdict(lambda: {"count": 0, "revenue": 0.0})
        for sale in sales:
            method = sale["payment_method"]
            payment_method_stats[method]["count"] += 1
            payment_method_stats[method]["revenue"] += float(sale["net_amount"])
        
        return success_response({
            "period": f"{period} days",
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_revenue": total_revenue,
                "total_sales": total_sales,
                "total_items_sold": total_items_sold,
                "average_order_value": total_revenue / total_sales if total_sales > 0 else 0,
                "daily_average": total_revenue / int(period) if int(period) > 0 else 0
            },
            "daily_revenue": dict(daily_revenue),
            "top_customers": top_customers,
            "payment_methods": dict(payment_method_stats)
        })
    
    except Exception as e:
        return error_response(str(e), status_code=500)

@sale_bp.route("/team-performance", methods=["GET"])
@jwt_required()
def get_team_performance():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        user_id = get_jwt_identity()
        period = request.args.get("period", "30")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=int(period))
        
        team_members_result = get_supabase().table("salespeople").select("salesperson_user_id").eq("user_id", user_id).execute()
        team_member_ids = [member["salesperson_user_id"] for member in team_members_result.data] + [user_id]
        
        sales_result = get_supabase().table("sales").select("*").in_("salesperson_id", team_member_ids).gte("sale_date", start_date.isoformat()).lte("sale_date", end_date.isoformat()).execute()
        sales = sales_result.data
        
        performance = defaultdict(lambda: {
            "salesperson": None,
            "total_sales": 0,
            "total_revenue": 0.0,
            "total_commission": 0.0,
            "sales_count": 0
        })
        
        for sale in sales:
            salesperson_id = sale["salesperson_id"]
            if performance[salesperson_id]["salesperson"] is None:
                salesperson_user_result = get_supabase().table("users").select("id", "first_name", "last_name", "email").eq("id", salesperson_id).single().execute()
                if salesperson_user_result.data:
                    performance[salesperson_id]["salesperson"] = {
                        "id": salesperson_user_result.data["id"],
                        "name": f"{salesperson_user_result.data['first_name']} {salesperson_user_result.data['last_name']}",
                        "email": salesperson_user_result.data["email"]
                    }
            
            performance[salesperson_id]["total_revenue"] += float(sale["net_amount"])
            performance[salesperson_id]["total_commission"] += float(sale.get("commission_amount", 0))
            performance[salesperson_id]["sales_count"] += 1
        
        team_performance = sorted(
            [val for val in performance.values() if val["salesperson"] is not None],
            key=lambda x: x["total_revenue"],
            reverse=True
        )
        
        team_summary_total_revenue = sum(p["total_revenue"] for p in team_performance)
        team_summary_total_commission = sum(p["total_commission"] for p in team_performance)
        team_summary_total_sales = sum(p["sales_count"] for p in team_performance)

        return success_response({
            "period": f"{period} days",
            "team_performance": team_performance,
            "team_summary": {
                "total_members": len(team_member_ids),
                "total_revenue": team_summary_total_revenue,
                "total_commission": team_summary_total_commission,
                "total_sales": team_summary_total_sales
            }
        })
    
    except Exception as e:
        return error_response(str(e), status_code=500)


