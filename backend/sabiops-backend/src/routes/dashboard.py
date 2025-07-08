from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import pytz

dashboard_bp = Blueprint("dashboard", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config["SUPABASE"]

def parse_supabase_datetime(datetime_str):
    """
    Parse datetime string from Supabase and ensure it's timezone-aware.
    Handles various formats that Supabase might return.
    """
    if not datetime_str:
        return None
    
    try:
        # Handle ISO format with 'Z' suffix (UTC)
        if datetime_str.endswith('Z'):
            datetime_str = datetime_str.replace('Z', '+00:00')
        
        # Parse the datetime string
        dt = datetime.fromisoformat(datetime_str)
        
        # If it's naive, assume UTC
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        
        return dt
    except (ValueError, TypeError) as e:
        print(f"Error parsing datetime '{datetime_str}': {e}")
        return None

def success_response(data=None, message="Success", status_code=200):
    return jsonify({"success": True, "data": data, "message": message}), status_code

def error_response(error, message="Error", status_code=400):
    return jsonify({"success": False, "error": error, "message": message}), status_code

@dashboard_bp.route("/overview", methods=["GET"])
@jwt_required()
def get_overview():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()

        owner_data = supabase.table("users").select("business_name").eq("id", owner_id).single().execute()
        if not owner_data.data:
            return error_response("Owner not found", status_code=404)

        invoices_result = supabase.table("invoices").select("total_amount", "status", "created_at").eq("owner_id", owner_id).execute()
        
        total_revenue = sum(inv["total_amount"] for inv in invoices_result.data if inv["status"] == "paid")
        outstanding_revenue = sum(inv["total_amount"] for inv in invoices_result.data if inv["status"] != "paid")

        # Use UTC timezone for consistent datetime comparisons
        utc = pytz.UTC
        current_month_start = datetime.now(utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        revenue_this_month = sum(
            inv["total_amount"] for inv in invoices_result.data
            if inv["status"] == "paid" and parse_supabase_datetime(inv["created_at"]) and parse_supabase_datetime(inv["created_at"]) >= current_month_start
        )

        customers_result = supabase.table("customers").select("id", "created_at").eq("owner_id", owner_id).execute()
        total_customers = len(customers_result.data)
        new_customers_this_month = sum(
            1 for cust in customers_result.data
            if parse_supabase_datetime(cust["created_at"]) and parse_supabase_datetime(cust["created_at"]) >= current_month_start
        )

        products_result = supabase.table("products").select("id", "quantity").eq("owner_id", owner_id).execute()
        total_products = len(products_result.data)
        low_stock_products = sum(1 for prod in products_result.data if prod["quantity"] < 10)

        overdue_invoices = sum(1 for inv in invoices_result.data if inv["status"] == "overdue")

        overview_data = {
            "revenue": {
                "total": total_revenue,
                "this_month": revenue_this_month,
                "outstanding": outstanding_revenue
            },
            "customers": {
                "total": total_customers,
                "new_this_month": new_customers_this_month
            },
            "products": {
                "total": total_products,
                "low_stock": low_stock_products
            },
            "invoices": {
                "overdue": overdue_invoices
            }
        }

        return success_response(data=overview_data)

    except Exception as e:
        print(f"Error fetching dashboard overview: {e}")
        return error_response(str(e), message="Failed to fetch dashboard overview", status_code=500)

@dashboard_bp.route("/revenue-chart", methods=["GET"])
@jwt_required()
def get_revenue_chart():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        period = request.args.get("period", "12months")

        owner_data = supabase.table("users").select("id").eq("id", owner_id).single().execute()
        if not owner_data.data:
            return error_response("Owner not found", status_code=404)

        invoices_result = supabase.table("invoices").select("total_amount", "created_at").eq("owner_id", owner_id).eq("status", "paid").execute()
        
        # Use UTC timezone for consistent datetime comparisons
        utc = pytz.UTC
        revenue_by_month = {}
        for i in range(12):
            month = (datetime.now(utc) - timedelta(days=30*i)).strftime("%Y-%m")
            revenue_by_month[month] = 0

        for inv in invoices_result.data:
            invoice_date = parse_supabase_datetime(inv["created_at"])
            if invoice_date:
                month_key = invoice_date.strftime("%Y-%m")
                if month_key in revenue_by_month:
                    revenue_by_month[month_key] += inv["total_amount"]

        chart_data = []
        for month_key in sorted(revenue_by_month.keys()):
            chart_data.append({"period": month_key, "revenue": revenue_by_month[month_key]})

        return success_response(data={"chart_data": chart_data})

    except Exception as e:
        print(f"Error fetching revenue chart: {e}")
        return error_response(str(e), message="Failed to fetch revenue chart data", status_code=500)

@dashboard_bp.route("/top-customers", methods=["GET"])
@jwt_required()
def get_top_customers():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        limit = int(request.args.get("limit", 5))

        owner_data = supabase.table("users").select("id").eq("id", owner_id).single().execute()
        if not owner_data.data:
            return error_response("Owner not found", status_code=404)

        # Fetch customers and their associated paid invoices
        # This requires a more complex query or a database view/function for efficiency
        # For now, we'll fetch all customers and invoices and process in Python
        customers_result = supabase.table("customers").select("id", "name").eq("owner_id", owner_id).execute()
        invoices_result = supabase.table("invoices").select("customer_id", "total_amount", "status").eq("owner_id", owner_id).eq("status", "paid").execute()

        customer_data = {}
        for customer in customers_result.data:
            customer_data[customer["id"]] = {
                "name": customer["name"],
                "total_revenue": 0,
                "invoice_count": 0
            }

        for invoice in invoices_result.data:
            customer_id = invoice["customer_id"]
            if customer_id in customer_data:
                customer_data[customer_id]["total_revenue"] += invoice["total_amount"]
                customer_data[customer_id]["invoice_count"] += 1

        top_customers_list = sorted(
            customer_data.values(),
            key=lambda x: x["total_revenue"], reverse=True
        )[:limit]

        return success_response(data={"top_customers": top_customers_list})

    except Exception as e:
        print(f"Error fetching top customers: {e}")
        return error_response(str(e), message="Failed to fetch top customers", status_code=500)

@dashboard_bp.route("/top-products", methods=["GET"])
@jwt_required()
def get_top_products():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        limit = int(request.args.get("limit", 5))

        owner_data = supabase.table("users").select("id").eq("id", owner_id).single().execute()
        if not owner_data.data:
            return error_response("Owner not found", status_code=404)

        # Fetch products and their associated invoice items from paid invoices
        products_result = supabase.table("products").select("id", "name").eq("owner_id", owner_id).execute()
        invoice_items_result = supabase.table("invoice_items").select("product_id", "quantity", "unit_price", "invoice_id").execute()
        invoices_result = supabase.table("invoices").select("id").eq("owner_id", owner_id).eq("status", "paid").execute()
        
        paid_invoice_ids = {inv["id"] for inv in invoices_result.data}

        product_sales = {}
        for item in invoice_items_result.data:
            if item["invoice_id"] in paid_invoice_ids:
                prod_id = item["product_id"]
                revenue = item["quantity"] * item["unit_price"]
                product_sales[prod_id] = product_sales.get(prod_id, {"total_revenue": 0, "total_quantity": 0})
                product_sales[prod_id]["total_revenue"] += revenue
                product_sales[prod_id]["total_quantity"] += item["quantity"]

        top_products_list = []
        for prod in products_result.data:
            prod_id = prod["id"]
            if prod_id in product_sales:
                top_products_list.append({
                    "id": prod_id,
                    "name": prod["name"],
                    "total_revenue": product_sales[prod_id]["total_revenue"],
                    "total_quantity": product_sales[prod_id]["total_quantity"]
                })
        
        top_products_list.sort(key=lambda x: x["total_revenue"], reverse=True)

        return success_response(data={"top_products": top_products_list[:limit]})

    except Exception as e:
        print(f"Error fetching top products: {e}")
        return error_response(str(e), message="Failed to fetch top products", status_code=500)

@dashboard_bp.route("/recent-activities", methods=["GET"])
@jwt_required()
def get_recent_activities():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        limit = int(request.args.get("limit", 10))

        owner_data = supabase.table("users").select("id").eq("id", owner_id).single().execute()
        if not owner_data.data:
            return error_response("Owner not found", status_code=404)

        # Fetch invoices and payments for recent activities
        invoices_result = supabase.table("invoices").select("id", "total_amount", "status", "created_at").eq("owner_id", owner_id).order("created_at", desc=True).limit(limit).execute()
        payments_result = supabase.table("payments").select("id", "amount", "status", "created_at").eq("owner_id", owner_id).order("created_at", desc=True).limit(limit).execute()
        customers_result = supabase.table("customers").select("id", "name", "created_at").eq("owner_id", owner_id).order("created_at", desc=True).limit(limit).execute()

        activities = []
        for inv in invoices_result.data:
            activities.append({
                "type": "invoice",
                "description": f"Invoice #{inv['id'][:8]} created",
                "date": inv["created_at"],
                "amount": inv["total_amount"],
                "status": inv["status"]
            })
        
        for pay in payments_result.data:
            activities.append({
                "type": "payment",
                "description": f"Payment of {pay['amount']} received",
                "date": pay["created_at"],
                "amount": pay["amount"],
                "status": pay["status"]
            })

        for cust in customers_result.data:
            activities.append({
                "type": "customer",
                "description": f"New customer {cust['name']} added",
                "date": cust["created_at"],
                "amount": 0, # No amount for customer activity
                "status": "active"
            })

        # Sort all activities by date and apply limit
        activities.sort(key=lambda x: x["date"], reverse=True)

        return success_response(data={"activities": activities[:limit]})

    except Exception as e:
        print(f"Error fetching recent activities: {e}")
        return error_response(str(e), message="Failed to fetch recent activities", status_code=500)



