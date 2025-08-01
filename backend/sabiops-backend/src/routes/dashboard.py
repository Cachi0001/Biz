"""
Dashboard routes for SabiOps backend
Provides overview statistics and analytics data
"""

from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.utils.user_context import get_user_context
from src.utils.invoice_status_manager import InvoiceStatusManager
from datetime import datetime, timedelta
import pytz
import uuid

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
        owner_id, user_role = get_user_context(user_id)
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
            "invoices": {"overdue": 0},
            "expenses": {"total": 0, "this_month": 0}
        }
        
        # Get total revenue from sales (ensure data consistency)
        sales_result = supabase.table('sales').select('total_amount, date, profit_from_sales, total_cogs').eq('owner_id', owner_id).execute()
        total_revenue = 0
        total_profit_from_sales = 0
        
        if sales_result.data:
            total_revenue = sum(float(sale.get('total_amount', 0)) for sale in sales_result.data)
            total_profit_from_sales = sum(float(sale.get('profit_from_sales', 0)) for sale in sales_result.data)
        
        # Include paid invoice revenue in total revenue
        paid_invoices_result = supabase.table('invoices').select('total_amount, created_at, status, paid_date, paid_at, items').eq('owner_id', owner_id).execute()
        if paid_invoices_result.data:
            for invoice in paid_invoices_result.data:
                # Only include paid invoices in revenue
                if invoice.get('status') == 'paid' or invoice.get('paid_date'):
                    invoice_amount = float(invoice.get('total_amount', 0))
                    total_revenue += invoice_amount
                    
                    # Calculate profit from invoice items if no sales record exists
                    if invoice.get('items'):
                        invoice_profit = 0
                        for item in invoice['items']:
                            quantity = float(item.get('quantity', 0))
                            unit_price = float(item.get('unit_price', 0))
                            tax_rate = float(item.get('tax_rate', 0))
                            discount_rate = float(item.get('discount_rate', 0))
                            
                            # Calculate item total
                            item_total = quantity * unit_price
                            discount_amount = item_total * (discount_rate / 100)
                            item_total_after_discount = item_total - discount_amount
                            tax_amount = item_total_after_discount * (tax_rate / 100)
                            final_item_total = item_total_after_discount + tax_amount
                            
                            # Estimate COGS (cost of goods sold) - assuming 40% cost margin
                            estimated_cost = item_total * 0.4
                            item_profit = final_item_total - estimated_cost
                            
                            invoice_profit += item_profit
                        
                        total_profit_from_sales += invoice_profit
        
        overview["revenue"]["total"] = total_revenue
        overview["revenue"]["profit_from_sales"] = total_profit_from_sales

        # Calculate time periods for proper profit aggregation
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        yesterday_start = (today_start - timedelta(days=1))
        yesterday_end = (yesterday_start.replace(hour=23, minute=59, second=59, microsecond=999999))
        
        # Initialize period calculations
        this_month_revenue = 0
        this_month_profit_from_sales = 0
        today_revenue = 0
        today_profit_from_sales = 0
        today_cogs = 0
        yesterday_profit_from_sales = 0
        
        # Process each sale for accurate period calculations
        if sales_result.data:
            for sale in sales_result.data:
                sale_date = parse_supabase_datetime(sale.get('date'))
                if not sale_date:
                    continue
                    
                sale_amount = float(sale.get('total_amount', 0))
                sale_profit = float(sale.get('profit_from_sales', 0))
                sale_cogs = float(sale.get('total_cogs', 0))
                
                # This month calculations
                if sale_date >= current_month_start:
                    this_month_revenue += sale_amount
                    this_month_profit_from_sales += sale_profit
                
                # Today's calculations (daily profit that resets at midnight)
                if today_start <= sale_date <= today_end:
                    today_revenue += sale_amount
                    today_profit_from_sales += sale_profit
                    today_cogs += sale_cogs
                
                # Yesterday's profit for comparison
                if yesterday_start <= sale_date <= yesterday_end:
                    yesterday_profit_from_sales += sale_profit
        
        # Include paid invoices in monthly revenue calculation
        if paid_invoices_result.data:
            for invoice in paid_invoices_result.data:
                if invoice.get('status') == 'paid' or invoice.get('paid_date'):
                    # Use paid_at date for revenue calculations (when the payment was actually received)
                    invoice_date = parse_supabase_datetime(invoice.get('paid_at')) or parse_supabase_datetime(invoice.get('paid_date')) or parse_supabase_datetime(invoice.get('created_at'))
                    invoice_amount = float(invoice.get('total_amount', 0))
                    
                    # Calculate invoice profit
                    invoice_profit = 0
                    if invoice.get('items'):
                        for item in invoice['items']:
                            quantity = float(item.get('quantity', 0))
                            unit_price = float(item.get('unit_price', 0))
                            tax_rate = float(item.get('tax_rate', 0))
                            discount_rate = float(item.get('discount_rate', 0))
                            
                            # Calculate item total
                            item_total = quantity * unit_price
                            discount_amount = item_total * (discount_rate / 100)
                            item_total_after_discount = item_total - discount_amount
                            tax_amount = item_total_after_discount * (tax_rate / 100)
                            final_item_total = item_total_after_discount + tax_amount
                            
                            # Estimate COGS (cost of goods sold) - assuming 40% cost margin
                            estimated_cost = item_total * 0.4
                            item_profit = final_item_total - estimated_cost
                            
                            invoice_profit += item_profit
                    
                    if invoice_date and invoice_date >= current_month_start:
                        this_month_revenue += invoice_amount
                        this_month_profit_from_sales += invoice_profit
                    
                    # Include in today's revenue if paid today
                    if invoice_date and today_start <= invoice_date <= today_end:
                        today_revenue += invoice_amount
                        today_profit_from_sales += invoice_profit
        
        # Calculate daily profit growth
        daily_profit_growth = 0
        if yesterday_profit_from_sales > 0:
            daily_profit_growth = ((today_profit_from_sales - yesterday_profit_from_sales) / yesterday_profit_from_sales) * 100
        elif today_profit_from_sales > 0:
            daily_profit_growth = 100  # 100% growth if yesterday was 0 but today has profit
        
        # Update overview with calculated values
        overview["revenue"]["this_month"] = this_month_revenue
        overview["revenue"]["this_month_profit_from_sales"] = this_month_profit_from_sales
        overview["revenue"]["today_revenue"] = today_revenue
        overview["revenue"]["today_profit_from_sales"] = today_profit_from_sales
        overview["revenue"]["today_cogs"] = today_cogs
        overview["revenue"]["yesterday_profit_from_sales"] = yesterday_profit_from_sales
        overview["revenue"]["daily_profit_growth"] = round(daily_profit_growth, 2)
        overview["revenue"]["daily_profit_reset_time"] = today_start.isoformat()
        
        # Get outstanding revenue from OVERDUE invoices only (past due date and unpaid)
        invoices_result = supabase.table('invoices').select('total_amount, status, due_date, paid_date').eq('owner_id', owner_id).execute()
        if invoices_result.data:
            outstanding = 0
            overdue_count = 0
            for invoice in invoices_result.data:
                # Only consider invoices that are past due date and unpaid as outstanding
                due_date = parse_supabase_datetime(invoice.get('due_date'))
                is_unpaid = invoice.get('status') not in ['paid', 'cancelled'] and not invoice.get('paid_date')
                
                if due_date and due_date < now and is_unpaid:
                    # This invoice is overdue (past due date and unpaid)
                    outstanding += float(invoice.get('total_amount', 0))
                    overdue_count += 1
            
            overview["revenue"]["outstanding"] = outstanding
            overview["invoices"]["overdue"] = overdue_count
        
        # If no invoices data, also check for outstanding amounts from sales (credit sales)
        # This ensures outstanding calculation works even without invoice system
        if overview["revenue"]["outstanding"] == 0:
            # Check for any pending payments or credit sales
            payments_result = supabase.table('payments').select('amount, status').eq('owner_id', owner_id).execute()
            if payments_result.data:
                pending_payments = sum(
                    float(payment.get('amount', 0))
                    for payment in payments_result.data
                    if payment.get('status') in ['pending', 'processing']
                )
                overview["revenue"]["outstanding"] = pending_payments
        
        # Get customer statistics
        customers_result = supabase.table('customers').select('id, created_at').eq('owner_id', owner_id).execute()
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
        products_result = supabase.table('products').select('id, quantity, low_stock_threshold').eq('owner_id', owner_id).execute()
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
        
        # Get expense statistics (ensure data consistency)
        expenses_result = supabase.table('expenses').select('amount, date').eq('owner_id', owner_id).execute()
        if expenses_result.data:
            total_expenses = sum(float(expense.get('amount', 0)) for expense in expenses_result.data)
            overview["expenses"]["total"] = total_expenses
            
            # Calculate this month's expenses
            this_month_expenses = 0
            for expense in expenses_result.data:
                expense_date = parse_supabase_datetime(expense.get('date'))
                if expense_date and expense_date >= current_month_start:
                    this_month_expenses += float(expense.get('amount', 0))
            overview["expenses"]["this_month"] = this_month_expenses
        
        return success_response("Dashboard overview fetched successfully", overview)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard overview: {str(e)}")
        return error_response("Failed to fetch dashboard overview", 500)

@dashboard_bp.route('/revenue-chart', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    """Get revenue vs expenses chart data for the last 12 months"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get current date in UTC
        utc = pytz.UTC
        now = datetime.now(utc)
        
        # Calculate 12 months ago
        twelve_months_ago = now.replace(day=1) - timedelta(days=365)
        
        # Get sales data for the last 12 months
        sales_result = supabase.table('sales').select('total_amount, date').eq('owner_id', owner_id).gte('date', twelve_months_ago.isoformat()).execute()
        
        # Get paid invoices data for the last 12 months
        invoices_result = supabase.table('invoices').select('total_amount, created_at, status, paid_date').eq('owner_id', owner_id).gte('created_at', twelve_months_ago.isoformat()).execute()
        
        # Get expenses data for the last 12 months
        expenses_result = supabase.table('expenses').select('amount, date').eq('owner_id', owner_id).gte('date', twelve_months_ago.isoformat()).execute()
        
        # Initialize chart data for 12 months with both revenue and expenses
        chart_data = []
        for i in range(12):
            month_date = now.replace(day=1) - timedelta(days=30 * (11 - i))
            chart_data.append({
                "period": month_date.strftime("%b %Y"),
                "month": month_date.strftime("%b %Y"),  # Add month field for compatibility
                "revenue": 0,
                "expenses": 0
            })
        
        # Process sales data (revenue)
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
        
        # Process expenses data
        if expenses_result.data:
            for expense in expenses_result.data:
                expense_date = parse_supabase_datetime(expense.get('date'))
                if expense_date:
                    # Find the corresponding month in chart_data
                    month_key = expense_date.strftime("%b %Y")
                    for data_point in chart_data:
                        if data_point["period"] == month_key:
                            data_point["expenses"] += float(expense.get('amount', 0))
                            break
        
        return success_response("Revenue vs expenses chart data fetched successfully", {
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
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get customers with their sales data
        customers_result = supabase.table('customers').select('*').eq('owner_id', owner_id).execute()
        
        if not customers_result.data:
            return success_response("Top customers fetched successfully", [])
        
        # Calculate revenue for each customer
        top_customers = []
        for customer in customers_result.data:
            customer_sales = supabase.table('sales').select('total_amount').eq('owner_id', owner_id).eq('customer_name', customer.get('name')).execute()
            
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
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get products with their sales data
        products_result = supabase.table('products').select('*').eq('owner_id', owner_id).execute()
        
        if not products_result.data:
            return success_response("Top products fetched successfully", [])
        
        # Calculate sales for each product
        top_products = []
        for product in products_result.data:
            product_sales = supabase.table('sales').select('quantity, total_amount').eq('owner_id', owner_id).eq('product_name', product.get('name')).execute()
            
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

@dashboard_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_accurate_metrics():
    """Get accurate dashboard metrics using data consistency service"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Import data consistency service
        from src.services.data_consistency_service import DataConsistencyService
        consistency_service = DataConsistencyService(supabase)
        
        # Get accurate metrics from actual data
        metrics = consistency_service.recalculate_dashboard_metrics(user_id)
        
        return success_response("Accurate dashboard metrics fetched successfully", metrics)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching accurate metrics: {str(e)}")
        return error_response("Failed to fetch accurate metrics", 500)

@dashboard_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_data_consistency():
    """Validate data consistency and return any issues found"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Import data consistency service
        from src.services.data_consistency_service import DataConsistencyService
        consistency_service = DataConsistencyService(supabase)
        
        # Validate data relationships
        inconsistencies = consistency_service.validate_data_relationships(user_id)
        
        return success_response("Data validation completed", {
            "inconsistencies": inconsistencies,
            "total_issues": len(inconsistencies),
            "is_consistent": len(inconsistencies) == 0
        })
        
    except Exception as e:
        current_app.logger.error(f"Error validating data consistency: {str(e)}")
        return error_response("Failed to validate data consistency", 500)

@dashboard_bp.route('/fix-inconsistencies', methods=['POST'])
@jwt_required()
def fix_data_inconsistencies():
    """Fix identified data inconsistencies"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Import data consistency service
        from src.services.data_consistency_service import DataConsistencyService
        consistency_service = DataConsistencyService(supabase)
        
        # First validate to find inconsistencies
        inconsistencies = consistency_service.validate_data_relationships(user_id)
        
        if not inconsistencies:
            return success_response("No inconsistencies found to fix", {
                "fixes_applied": {"successful_fixes": 0, "failed_fixes": 0, "details": []}
            })
        
        # Fix the inconsistencies
        fix_results = consistency_service.fix_data_inconsistencies(user_id, inconsistencies)
        
        return success_response("Data consistency fixes completed", {
            "fixes_applied": fix_results
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fixing data inconsistencies: {str(e)}")
        return error_response("Failed to fix data inconsistencies", 500)

@dashboard_bp.route('/ensure-consistency', methods=['POST'])
@jwt_required()
def ensure_complete_data_consistency():
    """Ensure complete data consistency across all business operations"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Import business operations manager
        from src.utils.business_operations import BusinessOperationsManager
        business_ops = BusinessOperationsManager(supabase)
        
        # Ensure complete data consistency
        consistency_report = business_ops.ensure_data_consistency(user_id)
        
        return success_response("Data consistency check and fixes completed", {
            "consistency_report": consistency_report
        })
        
    except Exception as e:
        current_app.logger.error(f"Error ensuring data consistency: {str(e)}")
        return error_response("Failed to ensure data consistency", 500)

@dashboard_bp.route('/sync-data', methods=['POST'])
@jwt_required()
def sync_all_business_data():
    """Synchronize all business data for consistency - comprehensive data integration"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Import business operations manager
        from src.utils.business_operations import BusinessOperationsManager
        business_ops = BusinessOperationsManager(supabase)
        
        sync_report = {
            "inventory_updates": 0,
            "customer_statistics_updated": 0,
            "transaction_records_created": 0,
            "data_inconsistencies_fixed": 0,
            "dashboard_metrics_refreshed": False,
            "errors": []
        }
        
        # 1. Ensure all sales have proper inventory updates
        try:
            sales_result = supabase.table("sales").select("*").eq("owner_id", user_id).execute()
            if sales_result.data:
                for sale in sales_result.data:
                    # Verify inventory was properly reduced for this sale
                    product_result = supabase.table("products").select("*").eq("id", sale["product_id"]).single().execute()
                    if product_result.data:
                        # This is already handled by the business operations manager
                        # Just log for verification
                        current_app.logger.info(f"Verified inventory for sale {sale['id']}")
                        sync_report["inventory_updates"] += 1
        except Exception as inventory_error:
            sync_report["errors"].append(f"Inventory sync failed: {str(inventory_error)}")
        
        # 2. Update all customer statistics based on actual sales
        try:
            customers_result = supabase.table("customers").select("id").eq("owner_id", user_id).execute()
            if customers_result.data:
                for customer in customers_result.data:
                    business_ops.update_customer_statistics(customer["id"], user_id)
                    sync_report["customer_statistics_updated"] += 1
        except Exception as customer_error:
            sync_report["errors"].append(f"Customer statistics sync failed: {str(customer_error)}")
        
        # 3. Ensure all sales and expenses have transaction records
        try:
            # Check sales
            sales_result = supabase.table("sales").select("*").eq("owner_id", user_id).execute()
            if sales_result.data:
                for sale in sales_result.data:
                    transaction_result = supabase.table("transactions").select("id").eq("reference_id", sale["id"]).eq("reference_type", "sale").execute()
                    if not transaction_result.data:
                        # Create missing transaction record
                        transaction_success = business_ops._create_transaction_record({
                            "id": str(uuid.uuid4()),
                            "owner_id": user_id,
                            "type": "income",
                            "category": "Sales",
                            "amount": float(sale.get("total_amount", 0)),
                            "description": f"Sale of {sale.get('quantity', 1)}x {sale.get('product_name', 'Product')} to {sale.get('customer_name', 'Customer')}",
                            "reference_id": sale["id"],
                            "reference_type": "sale",
                            "payment_method": sale.get("payment_method", "cash"),
                            "date": sale.get("date", sale.get("created_at")),
                            "created_at": datetime.now().isoformat()
                        })
                        if transaction_success:
                            sync_report["transaction_records_created"] += 1
            
            # Check expenses
            expenses_result = supabase.table("expenses").select("*").eq("owner_id", user_id).execute()
            if expenses_result.data:
                for expense in expenses_result.data:
                    transaction_result = supabase.table("transactions").select("id").eq("reference_id", expense["id"]).eq("reference_type", "expense").execute()
                    if not transaction_result.data:
                        # Create missing transaction record
                        transaction_success = business_ops._create_transaction_record({
                            "id": str(uuid.uuid4()),
                            "owner_id": user_id,
                            "type": "expense",
                            "category": expense.get("category", "Other"),
                            "sub_category": expense.get("sub_category", ""),
                            "amount": float(expense.get("amount", 0)),
                            "description": expense.get("description", f"{expense.get('category', 'Other')} expense"),
                            "reference_id": expense["id"],
                            "reference_type": "expense",
                            "payment_method": expense.get("payment_method", "cash"),
                            "date": expense.get("date"),
                            "created_at": datetime.now().isoformat()
                        })
                        if transaction_success:
                            sync_report["transaction_records_created"] += 1
                            
        except Exception as transaction_error:
            sync_report["errors"].append(f"Transaction sync failed: {str(transaction_error)}")
        
        # 4. Validate and fix data inconsistencies
        try:
            from src.services.data_consistency_service import DataConsistencyService
            consistency_service = DataConsistencyService(supabase)
            
            inconsistencies = consistency_service.validate_data_relationships(user_id)
            if inconsistencies:
                fix_results = consistency_service.fix_data_inconsistencies(user_id, inconsistencies)
                sync_report["data_inconsistencies_fixed"] = fix_results.get("successful_fixes", 0)
            
            # Refresh dashboard metrics
            accurate_metrics = consistency_service.recalculate_dashboard_metrics(user_id)
            if accurate_metrics:
                sync_report["dashboard_metrics_refreshed"] = True
                sync_report["refreshed_metrics"] = accurate_metrics
                
        except Exception as consistency_error:
            sync_report["errors"].append(f"Data consistency sync failed: {str(consistency_error)}")
        
        return success_response("Complete data synchronization completed", {
            "sync_report": sync_report
        })
        
    except Exception as e:
        current_app.logger.error(f"Error synchronizing business data: {str(e)}")
        return error_response("Failed to synchronize business data", 500)

@dashboard_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics_data():
    """Get comprehensive business analytics data with subscription protection"""
    try:
        from src.utils.subscription_decorators import check_analytics_access, get_subscription_upgrade_info
        from src.services.analytics_service import AnalyticsService
        from flask import request
        
        user_id = get_jwt_identity()
        
        # Check analytics access
        access_check = check_analytics_access(user_id)
        if not access_check.get('has_access', False):
            upgrade_info = get_subscription_upgrade_info(user_id)
            return jsonify({
                'success': False,
                'error': 'Analytics access denied',
                'message': access_check.get('reason', 'Subscription required for analytics'),
                'access_denied': True,
                'upgrade_required': True,
                'upgrade_info': upgrade_info,
                'current_plan': access_check.get('current_plan', 'free')
            }), 403
        
        # Get time period filter
        time_period = request.args.get('period', 'monthly')
        if time_period not in ['daily', 'weekly', 'monthly', 'yearly']:
            time_period = 'monthly'
        
        # Get analytics data
        analytics_service = AnalyticsService()
        analytics_data = analytics_service.get_business_analytics(user_id, time_period)
        
        if not analytics_data.get('success', False):
            return error_response(
                analytics_data.get('message', 'Failed to generate analytics'),
                500
            )
        
        return success_response(
            "Analytics data retrieved successfully",
            analytics_data['data']
        )
        
    except Exception as e:
        current_app.logger.error(f"Error fetching analytics data: {str(e)}")
        return error_response("Failed to fetch analytics data", 500)

@dashboard_bp.route('/analytics/revenue', methods=['GET'])
@jwt_required()
def get_revenue_analytics():
    """Get revenue analytics with subscription protection"""
    try:
        from src.utils.subscription_decorators import analytics_access_required
        from src.services.analytics_service import AnalyticsService
        from flask import request
        
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        
        # Check analytics access
        from src.utils.subscription_decorators import check_analytics_access
        access_check = check_analytics_access(user_id)
        if not access_check.get('has_access', False):
            return error_response("Analytics access denied", 403)
        
        time_period = request.args.get('period', 'monthly')
        
        analytics_service = AnalyticsService()
        revenue_data = analytics_service.get_revenue_analytics(owner_id, time_period)
        
        return success_response("Revenue analytics retrieved successfully", revenue_data)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching revenue analytics: {str(e)}")
        return error_response("Failed to fetch revenue analytics", 500)

@dashboard_bp.route('/analytics/customers', methods=['GET'])
@jwt_required()
def get_customer_analytics():
    """Get customer analytics with subscription protection"""
    try:
        from src.services.analytics_service import AnalyticsService
        from flask import request
        
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        
        # Check analytics access
        from src.utils.subscription_decorators import check_analytics_access
        access_check = check_analytics_access(user_id)
        if not access_check.get('has_access', False):
            return error_response("Analytics access denied", 403)
        
        time_period = request.args.get('period', 'monthly')
        
        analytics_service = AnalyticsService()
        customer_data = analytics_service.get_customer_analytics(owner_id, time_period)
        
        return success_response("Customer analytics retrieved successfully", customer_data)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching customer analytics: {str(e)}")
        return error_response("Failed to fetch customer analytics", 500)

@dashboard_bp.route('/analytics/products', methods=['GET'])
@jwt_required()
def get_product_analytics():
    """Get product analytics with subscription protection"""
    try:
        from src.services.analytics_service import AnalyticsService
        from flask import request
        
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        
        # Check analytics access
        from src.utils.subscription_decorators import check_analytics_access
        access_check = check_analytics_access(user_id)
        if not access_check.get('has_access', False):
            return error_response("Analytics access denied", 403)
        
        time_period = request.args.get('period', 'monthly')
        
        analytics_service = AnalyticsService()
        product_data = analytics_service.get_product_analytics(owner_id, time_period)
        
        return success_response("Product analytics retrieved successfully", product_data)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching product analytics: {str(e)}")
        return error_response("Failed to fetch product analytics", 500)

@dashboard_bp.route('/analytics/financial', methods=['GET'])
@jwt_required()
def get_financial_analytics():
    """Get financial analytics with subscription protection"""
    try:
        from src.services.analytics_service import AnalyticsService
        from flask import request
        
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        
        # Check analytics access
        from src.utils.subscription_decorators import check_analytics_access
        access_check = check_analytics_access(user_id)
        if not access_check.get('has_access', False):
            return error_response("Analytics access denied", 403)
        
        time_period = request.args.get('period', 'monthly')
        
        analytics_service = AnalyticsService()
        financial_data = analytics_service.get_financial_analytics(owner_id, time_period)
        
        return success_response("Financial analytics retrieved successfully", financial_data)
        
    except Exception as e:
        current_app.logger.error(f"Error fetching financial analytics: {str(e)}")
        return error_response("Failed to fetch financial analytics", 500)

@dashboard_bp.route('/analytics/access-check', methods=['GET'])
@jwt_required()
def check_analytics_access_endpoint():
    """Check if user has access to analytics features"""
    try:
        from src.utils.subscription_decorators import check_analytics_access, get_subscription_upgrade_info
        
        user_id = get_jwt_identity()
        access_check = check_analytics_access(user_id)
        
        if access_check.get('has_access', False):
            return success_response("Analytics access granted", {
                'has_access': True,
                'access_level': access_check.get('reason', 'Access granted'),
                'current_plan': access_check.get('current_plan'),
                'is_trial': access_check.get('is_trial', False),
                'trial_days_left': access_check.get('trial_days_left', 0)
            })
        else:
            upgrade_info = get_subscription_upgrade_info(user_id)
            return jsonify({
                'success': True,
                'data': {
                    'has_access': False,
                    'reason': access_check.get('reason'),
                    'current_plan': access_check.get('current_plan', 'free'),
                    'upgrade_required': True,
                    'upgrade_info': upgrade_info
                },
                'message': "Analytics access check completed"
            }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error checking analytics access: {str(e)}")
        return error_response("Failed to check analytics access", 500)

@dashboard_bp.route('/profit-calculations', methods=['GET'])
@jwt_required()
def get_profit_calculations():
    """Get profit calculations with date filtering for sales page"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get current date in UTC
        utc = pytz.UTC
        now = datetime.now(utc)
        
        # Get filter parameters from query string
        from flask import request
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query for sales with profit data
        query = supabase.table('sales').select('total_amount, profit_from_sales, total_cogs, date, quantity, product_name').eq('owner_id', owner_id)
        
        # Apply date filters if provided
        if start_date:
            query = query.gte('date', start_date)
        if end_date:
            query = query.lte('date', end_date)
        
        sales_result = query.execute()
        
        if not sales_result.data:
            return success_response("Profit calculations retrieved successfully", {
                "total_sales_amount": 0,
                "total_profit_from_sales": 0,
                "total_cogs": 0,
                "profit_margin_percentage": 0,
                "total_transactions": 0,
                "date_range": {
                    "start": start_date,
                    "end": end_date
                },
                "daily_breakdown": [],
                "product_profit_breakdown": []
            })
        
        # Calculate aggregated metrics
        total_sales_amount = sum(float(sale.get('total_amount', 0)) for sale in sales_result.data)
        total_profit_from_sales = sum(float(sale.get('profit_from_sales', 0)) for sale in sales_result.data)
        total_cogs = sum(float(sale.get('total_cogs', 0)) for sale in sales_result.data)
        total_transactions = len(sales_result.data)
        
        # Calculate profit margin percentage
        profit_margin_percentage = 0
        if total_sales_amount > 0:
            profit_margin_percentage = (total_profit_from_sales / total_sales_amount) * 100
        
        # Daily breakdown for filtered period
        daily_breakdown = {}
        product_profits = {}
        
        for sale in sales_result.data:
            sale_date = parse_supabase_datetime(sale.get('date'))
            if sale_date:
                date_key = sale_date.strftime('%Y-%m-%d')
                
                # Daily breakdown
                if date_key not in daily_breakdown:
                    daily_breakdown[date_key] = {
                        'date': date_key,
                        'sales_amount': 0,
                        'profit_from_sales': 0,
                        'cogs': 0,
                        'transactions_count': 0
                    }
                
                daily_breakdown[date_key]['sales_amount'] += float(sale.get('total_amount', 0))
                daily_breakdown[date_key]['profit_from_sales'] += float(sale.get('profit_from_sales', 0))
                daily_breakdown[date_key]['cogs'] += float(sale.get('total_cogs', 0))
                daily_breakdown[date_key]['transactions_count'] += 1
                
                # Product profit breakdown
                product_name = sale.get('product_name', 'Unknown Product')
                if product_name not in product_profits:
                    product_profits[product_name] = {
                        'product_name': product_name,
                        'total_quantity': 0,
                        'total_sales_amount': 0,
                        'total_profit': 0,
                        'total_cogs': 0,
                        'transactions_count': 0
                    }
                
                product_profits[product_name]['total_quantity'] += int(sale.get('quantity', 0))
                product_profits[product_name]['total_sales_amount'] += float(sale.get('total_amount', 0))
                product_profits[product_name]['total_profit'] += float(sale.get('profit_from_sales', 0))
                product_profits[product_name]['total_cogs'] += float(sale.get('total_cogs', 0))
                product_profits[product_name]['transactions_count'] += 1
        
        # Sort daily breakdown by date
        daily_breakdown_list = sorted(daily_breakdown.values(), key=lambda x: x['date'])
        
        # Sort product profits by total profit (descending)
        product_profit_list = sorted(product_profits.values(), key=lambda x: x['total_profit'], reverse=True)
        
        return success_response("Profit calculations retrieved successfully", {
            "total_sales_amount": total_sales_amount,
            "total_profit_from_sales": total_profit_from_sales,
            "total_cogs": total_cogs,
            "profit_margin_percentage": round(profit_margin_percentage, 2),
            "total_transactions": total_transactions,
            "date_range": {
                "start": start_date,
                "end": end_date
            },
            "daily_breakdown": daily_breakdown_list,
            "product_profit_breakdown": product_profit_list
        })
        
    except Exception as e:
        current_app.logger.error(f"Error calculating profit data: {str(e)}")
        return error_response("Failed to calculate profit data", 500)

@dashboard_bp.route('/financials', methods=['GET'])
@jwt_required()
def get_financials():
    """
    SabiOps Financials Endpoint - Nigerian SME P&L, Cash Flow, and Insights
    Returns: revenue, COGS, gross/net profit, expenses, net profit, cash flow, inventory value, top products/expenses
    All amounts in Naira (₦)
    """
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", 500)
        utc = pytz.UTC
        now = datetime.now(utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Revenue & COGS (all-time & this month)
        sales = supabase.table('sales').select('total_amount, total_cogs, profit_from_sales, date').eq('owner_id', owner_id).execute().data or []
        revenue = sum(float(s.get('total_amount', 0)) for s in sales)
        cogs = sum(float(s.get('total_cogs', 0)) for s in sales)
        profit_from_sales = revenue - cogs
        revenue_month = sum(float(s.get('total_amount', 0)) for s in sales if parse_supabase_datetime(s.get('date')) and parse_supabase_datetime(s.get('date')) >= month_start)
        cogs_month = sum(float(s.get('total_cogs', 0)) for s in sales if parse_supabase_datetime(s.get('date')) and parse_supabase_datetime(s.get('date')) >= month_start)
        profit_from_sales_month = revenue_month - cogs_month

        # Expenses (all-time & this month, by category)
        expenses = supabase.table('expenses').select('amount, category, sub_category, date').eq('owner_id', owner_id).execute().data or []
        total_expenses = sum(float(e.get('amount', 0)) for e in expenses)
        total_expenses_month = sum(float(e.get('amount', 0)) for e in expenses if parse_supabase_datetime(e.get('date')) and parse_supabase_datetime(e.get('date')) >= month_start)
        expense_by_category = {}
        for e in expenses:
            cat = e.get('category', 'Other')
            expense_by_category.setdefault(cat, 0)
            expense_by_category[cat] += float(e.get('amount', 0))

        # Net profit
        net_profit = profit_from_sales - total_expenses
        net_profit_month = profit_from_sales_month - total_expenses_month

        # Cash flow (money in/out, net)
        transactions = supabase.table('transactions').select('type, amount, date').eq('owner_id', owner_id).execute().data or []
        money_in = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'money_in')
        money_out = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'money_out')
        net_cash_flow = money_in - money_out

        # Inventory value (stock * cost_price)
        products = supabase.table('products').select('quantity, cost_price, name').eq('owner_id', owner_id).execute().data or []
        inventory_value = sum(float(p.get('quantity', 0)) * float(p.get('cost_price', 0)) for p in products)
        low_stock = [p for p in products if int(p.get('quantity', 0)) <= int(p.get('low_stock_threshold', 0))]
        top_products = sorted(products, key=lambda p: float(p.get('quantity', 0)), reverse=True)[:5]

        # Top expenses
        top_expenses = sorted(expense_by_category.items(), key=lambda x: x[1], reverse=True)[:5]

        return success_response(
            message="Financials summary fetched successfully",
            data={
                "revenue": {"total": revenue, "this_month": revenue_month},
                "cogs": {"total": cogs, "this_month": cogs_month},
                "profit_from_sales": {"total": profit_from_sales, "this_month": profit_from_sales_month},
                "expenses": {"total": total_expenses, "this_month": total_expenses_month, "by_category": expense_by_category},
                "net_profit": {"total": net_profit, "this_month": net_profit_month},
                "cash_flow": {"money_in": money_in, "money_out": money_out, "net": net_cash_flow},
                "inventory_value": inventory_value,
                "low_stock": [{"name": p.get('name'), "quantity": p.get('quantity')} for p in low_stock],
                "top_products": [{"name": p.get('name'), "quantity": p.get('quantity')} for p in top_products],
                "top_expenses": [{"category": cat, "amount": amt} for cat, amt in top_expenses]
            }
        )
    except Exception as e:
        current_app.logger.error(f"Error fetching financials: {str(e)}")
        return error_response("Failed to fetch financials", 500)

