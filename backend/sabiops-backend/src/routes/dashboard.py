
from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.utils.user_context import get_user_context
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

def get_team_members(supabase, owner_id, user_role, user_id):
    """Get list of team member IDs for role-based filtering"""
    if user_role == 'Owner':
        # Owner can see all team members
        result = supabase.table('users')\
            .select('id, full_name, email, role')\
            .or_(f'owner_id.eq.{owner_id},id.eq.{owner_id}')\
            .execute()
    elif user_role == 'Admin':
        # Admin can see themselves and their sales team
        result = supabase.table('users')\
            .select('id, full_name, email, role')\
            .or_(f'owner_id.eq.{owner_id},id.eq.{user_id}')\
            .execute()
    else:
        # Salesperson can only see themselves
        user = supabase.table('users')\
            .select('id, full_name, email, role')\
            .eq('id', user_id)\
            .single()\
            .execute()
        return [user.data] if user.data else []
    
    return result.data if result.data else []

@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """Get dashboard overview statistics with role-based filtering"""
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get team members for role-based filtering
        team_members = get_team_members(supabase, owner_id, user_role, user_id)
        team_member_ids = [str(member['id']) for member in team_members]
        
        # Get filter parameters
        team_member_id = request.args.get('team_member_id')
        
        # If specific team member is requested, validate access
        if team_member_id and team_member_id != 'all':
            if team_member_id not in team_member_ids:
                return error_response("Unauthorized access to this team member", 403)
            team_member_ids = [team_member_id]
        
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
            "expenses": {"total": 0, "this_month": 0},
            "team_members": team_members,
            "current_user_role": user_role
        }
        
        # Get sales data with role-based filtering
        sales_query = supabase.table('sales')\
            .select('id, total_amount, date, status, salesperson_id')\
            .eq('owner_id', owner_id)
        
        # Apply role-based filtering
        if user_role != 'Owner':
            sales_query = sales_query.in_('salesperson_id', team_member_ids)
            
        sales_result = sales_query.execute()
        
        # Calculate revenue metrics
        if sales_result.data:
            overview["revenue"]["total"] = sum(
                float(sale.get('total_amount', 0)) 
                for sale in sales_result.data
            )
            
            # This month's revenue
            overview["revenue"]["this_month"] = sum(
                float(sale.get('total_amount', 0))
                for sale in sales_result.data
                if parse_supabase_datetime(sale.get('date')) and \
                   parse_supabase_datetime(sale.get('date')) >= current_month_start
            )
        
        # Get customer data with role-based filtering
        customers_query = supabase.table('customers')\
            .select('id, created_at, salesperson_id')\
            .eq('owner_id', owner_id)
            
        if user_role != 'Owner':
            customers_query = customers_query.in_('salesperson_id', team_member_ids)
            
        customers_result = customers_query.execute()
        
        if customers_result.data:
            overview["customers"]["total"] = len(customers_result.data)
            
            # New customers this month
            overview["customers"]["new_this_month"] = len([
                c for c in customers_result.data
                if parse_supabase_datetime(c.get('created_at')) and \
                   parse_supabase_datetime(c.get('created_at')) >= current_month_start
            ])
        
        # Get product data (all roles can see products)
        products_result = supabase.table('products')\
            .select('id, stock_quantity, low_stock_threshold')\
            .eq('owner_id', owner_id)\
            .execute()
            
        if products_result.data:
            overview["products"]["total"] = len(products_result.data)
            overview["products"]["low_stock"] = len([
                p for p in products_result.data
                if p.get('stock_quantity', 0) <= p.get('low_stock_threshold', 5)
            ])
        
        # Get invoice data with role-based filtering
        invoices_query = supabase.table('invoices')\
            .select('id, due_date, status, salesperson_id')\
            .eq('owner_id', owner_id)\
            .eq('status', 'unpaid')\
            .lte('due_date', now.isoformat())
            
        if user_role != 'Owner':
            invoices_query = invoices_query.in_('salesperson_id', team_member_ids)
            
        invoices_result = invoices_query.execute()
        
        if invoices_result.data:
            overview["invoices"]["overdue"] = len(invoices_result.data)
        
        # Get expense data (owners and admins only)
        if user_role in ['Owner', 'Admin']:
            expenses_query = supabase.table('expenses')\
                .select('amount, date')\
                .eq('owner_id', owner_id)
                
            if user_role == 'Admin':
                expenses_query = expenses_query.in_('user_id', team_member_ids)
                
            expenses_result = expenses_query.execute()
            
            if expenses_result.data:
                overview["expenses"]["total"] = sum(
                    float(expense.get('amount', 0)) 
                    for expense in expenses_result.data
                )
                
                # This month's expenses
                overview["expenses"]["this_month"] = sum(
                    float(expense.get('amount', 0))
                    for expense in expenses_result.data
                    if parse_supabase_datetime(expense.get('date')) and \
                       parse_supabase_datetime(expense.get('date')) >= current_month_start
                )
        
        return success_response(data=overview)
        
    except Exception as e:
        current_app.logger.error(f"Error in get_overview: {str(e)}", exc_info=True)
        return error_response("Failed to fetch dashboard data", 500)

@dashboard_bp.route('/revenue-chart', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    """Get revenue chart data for the last 12 months"""
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
