"""
Dashboard routes for SabiOps backend
Provides overview statistics and analytics data
"""

from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import pytz

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__)

def get_supabase():
    """Get Supabase client from app config"""
    return current_app.config.get('SUPABASE')

def success_response(message="Success", data=None):
    """Standard success response format"""
    response = {
        "success": True,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return jsonify(response), 200

def error_response(message="An error occurred", status_code=400):
    """Standard error response format"""
    return jsonify({
        "success": False,
        "message": message
    }), status_code

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

@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """Get dashboard overview statistics"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get current date in UTC
        utc = pytz.UTC
        now = datetime.now(utc)
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Initialize overview data
        overview = {
            "revenue": {"total": 0, "this_month": 0, "outstanding": 0},
            "customers": {"total": 0, "new_this_month": 0},
            "products": {"total": 0, "low_stock": 0},
            "invoices": {"overdue": 0}
        }
        
        # Get total revenue from sales
        sales_result = supabase.table('sales').select('total_amount, date').eq('owner_id', user_id).execute()
        if sales_result.data:
            total_revenue = sum(float(sale.get('total_amount', 0)) for sale in sales_result.data)
            overview["revenue"]["total"] = total_revenue
            
            # Calculate this month's revenue
            this_month_revenue = 0
            for sale in sales_result.data:
                sale_date = parse_supabase_datetime(sale.get('date'))
                if sale_date and sale_date >= current_month_start:
                    this_month_revenue += float(sale.get('total_amount', 0))
            overview["revenue"]["this_month"] = this_month_revenue
        
        # Get outstanding revenue from invoices
        invoices_result = supabase.table('invoices').select('total_amount, status, due_date').eq('owner_id', user_id).execute()
        if invoices_result.data:
            outstanding = 0
            overdue_count = 0
            for invoice in invoices_result.data:
                if invoice.get('status') in ['sent', 'pending']:
                    outstanding += float(invoice.get('total_amount', 0))
                    
                    # Check if overdue
                    due_date = parse_supabase_datetime(invoice.get('due_date'))
                    if due_date and due_date < now:
                        overdue_count += 1
            
            overview["revenue"]["outstanding"] = outstanding
            overview["invoices"]["overdue"] = overdue_count
        
        # Get customer statistics
        customers_result = supabase.table('customers').select('id, created_at').eq('owner_id', user_id).execute()
        if customers_result.data:
            overview["customers"]["total"] = len(customers_result.data)
            
            # Count new customers this month
            new_this_month = 0
            for customer in customers_result.data:
                created_date = parse_supabase_datetime(customer.get('created_at'))
                if created_date and created_date >= current_month_start:
                    new_this_month += 1
            overview["customers"]["new_this_month"] = new_this_month
        
        # Get product statistics
        products_result = supabase.table('products').select('id, quantity, low_stock_threshold').eq('owner_id', user_id).execute()
        if products_result.data:
            overview["products"]["total"] = len(products_result.data)
            
            # Count low stock products
            low_stock_count = 0
            for product in products_result.data:
                quantity = int(product.get('quantity', 0))
                threshold = int(product.get('low_stock_threshold', 0))
                if quantity <= threshold:
                    low_stock_count += 1
            overview["products"]["low_stock"] = low_stock_count
        
        return success_response("Dashboard overview fetched successfully", overview)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard overview: {str(e)}")
        return error_response("Failed to fetch dashboard overview", 500)

@dashboard_bp.route('/revenue-chart', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    """Get revenue chart data for the last 12 months"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get current date in UTC
        utc = pytz.UTC
        now = datetime.now(utc)
        
        # Calculate 12 months ago
        twelve_months_ago = now.replace(day=1) - timedelta(days=365)
        
        # Get sales data for the last 12 months
        sales_result = supabase.table('sales').select('total_amount, date').eq('owner_id', user_id).gte('date', twelve_months_ago.isoformat()).execute()
        
        # Initialize chart data for 12 months
        chart_data = []
        for i in range(12):
            month_date = now.replace(day=1) - timedelta(days=30 * (11 - i))
            chart_data.append({
                "period": month_date.strftime("%b %Y"),
                "revenue": 0
            })
        
        # Process sales data
        if sales_result.data:
            for sale in sales_result.data:
                sale_date = parse_supabase_datetime(sale.get('date'))
                if sale_date:
                    # Find the corresponding month in chart_data
                    month_key = sale_date.strftime("%b %Y")
                    for data_point in chart_data:
                        if data_point["period"] == month_key:
                            data_point["revenue"] += float(sale.get('total_amount', 0))
                            break
        
        return success_response("Revenue chart data fetched successfully", {
            "chart_data": chart_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching revenue chart: {str(e)}")
        return error_response("Failed to fetch revenue chart data", 500)

@dashboard_bp.route('/top-customers', methods=['GET'])
@jwt_required()
def get_top_customers():
    """Get top customers by revenue"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get customers with their sales data
        customers_result = supabase.table('customers').select('*').eq('owner_id', user_id).execute()
        
        if not customers_result.data:
            return success_response("Top customers fetched successfully", [])
        
        # Calculate revenue for each customer
        top_customers = []
        for customer in customers_result.data:
            customer_sales = supabase.table('sales').select('total_amount').eq('owner_id', user_id).eq('customer_name', customer.get('name')).execute()
            
            total_revenue = 0
            invoice_count = 0
            if customer_sales.data:
                total_revenue = sum(float(sale.get('total_amount', 0)) for sale in customer_sales.data)
                invoice_count = len(customer_sales.data)
            
            top_customers.append({
                "id": customer.get('id'),
                "name": customer.get('name'),
                "email": customer.get('email'),
                "total_revenue": total_revenue,
                "invoice_count": invoice_count
            })
        
        # Sort by revenue and get top 10
        top_customers.sort(key=lambda x: x['total_revenue'], reverse=True)
        top_customers = top_customers[:10]
        
        return success_response("Top customers fetched successfully", top_customers)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching top customers: {str(e)}")
        return error_response("Failed to fetch top customers", 500)

@dashboard_bp.route('/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    """Get top products by sales"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get products with their sales data
        products_result = supabase.table('products').select('*').eq('owner_id', user_id).execute()
        
        if not products_result.data:
            return success_response("Top products fetched successfully", [])
        
        # Calculate sales for each product
        top_products = []
        for product in products_result.data:
            product_sales = supabase.table('sales').select('quantity, total_amount').eq('owner_id', user_id).eq('product_name', product.get('name')).execute()
            
            total_quantity = 0
            total_revenue = 0
            if product_sales.data:
                total_quantity = sum(int(sale.get('quantity', 0)) for sale in product_sales.data)
                total_revenue = sum(float(sale.get('total_amount', 0)) for sale in product_sales.data)
            
            top_products.append({
                "id": product.get('id'),
                "name": product.get('name'),
                "price": float(product.get('price', 0)),
                "total_quantity": total_quantity,
                "total_revenue": total_revenue
            })
        
        # Sort by revenue and get top 10
        top_products.sort(key=lambda x: x['total_revenue'], reverse=True)
        top_products = top_products[:10]
        
        return success_response("Top products fetched successfully", top_products)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching top products: {str(e)}")
        return error_response("Failed to fetch top products", 500)

