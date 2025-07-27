from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.utils.user_context import get_user_context
from datetime import datetime, date, timedelta
import uuid
from collections import defaultdict
from src.services.supabase_service import SupabaseService

def validate_sale_data(data):
    current_app.logger.info("Starting sale data validation")
    
    # Required top-level fields
    required_fields = ["payment_method", "sale_items", "owner_id", "created_by"]
    for field in required_fields:
        if field not in data or data[field] is None:
            error_msg = f"'{field}' is a required field"
            current_app.logger.warning(f"Validation failed: {error_msg}")
            return False, error_msg
    
    valid_payment_methods = ["cash", "card", "bank_transfer", "credit", "other"]
    if data["payment_method"] not in valid_payment_methods:
        error_msg = f"Invalid payment method. Must be one of: {', '.join(valid_payment_methods)}"
        current_app.logger.warning(f"Validation failed: {error_msg}")
        return False, error_msg
    
    # Sale items validation
    if not isinstance(data["sale_items"], list) or not data["sale_items"]:
        error_msg = "At least one sale item is required"
        current_app.logger.warning(f"Validation failed: {error_msg}")
        return False, error_msg

    for i, item in enumerate(data["sale_items"], 1):
        required_item_fields = ["product_id", "product_name", "quantity", "unit_price", "cost_price"]
        for field in required_item_fields:
            if field not in item:
                error_msg = f"Item {i}: '{field}' is required"
                current_app.logger.warning(f"Validation failed: {error_msg}")
                return False, error_msg
        
        # Product ID validation
        try:
            product_id = str(item["product_id"])
            if not product_id or len(product_id) != 36:  # Basic UUID validation
                raise ValueError("Invalid product ID format")
        except (ValueError, TypeError) as e:
            error_msg = f"Item {i}: Invalid product ID format. Must be a valid UUID."
            current_app.logger.warning(f"Validation failed: {error_msg}")
            return False, error_msg
        
        # Quantity validation
        try:
            quantity = int(item["quantity"])
            if quantity <= 0:
                error_msg = f"Item {i}: Quantity must be a positive integer"
                current_app.logger.warning(f"Validation failed: {error_msg}")
                return False, error_msg
            if quantity > 10000:  # Reasonable upper limit
                error_msg = f"Item {i}: Quantity exceeds maximum allowed (10,000)"
                current_app.logger.warning(f"Validation failed: {error_msg}")
                return False, error_msg
        except (ValueError, TypeError):
            error_msg = f"Item {i}: Quantity must be a valid integer"
            current_app.logger.warning(f"Validation failed: {error_msg}")
            return False, error_msg
        
        # Price validation
        try:
            unit_price = float(item["unit_price"])
            cost_price = float(item["cost_price"])
            
            if unit_price < 0 or cost_price < 0:
                error_msg = f"Item {i}: Prices cannot be negative"
                current_app.logger.warning(f"Validation failed: {error_msg}")
                return False, error_msg
                
            if unit_price > 1000000:  # $1M upper limit
                error_msg = f"Item {i}: Unit price exceeds maximum allowed"
                current_app.logger.warning(f"Validation failed: {error_msg}")
                return False, error_msg
                
            # Validate that selling price is not below cost (optional business rule)
            if unit_price < cost_price:
                current_app.logger.warning(
                    f"Warning: Item {i} is being sold below cost. "
                    f"Cost: {cost_price}, Selling price: {unit_price}"
                )
                
        except (ValueError, TypeError):
            error_msg = f"Item {i}: Invalid price format. Must be a valid number"
            current_app.logger.warning(f"Validation failed: {error_msg}")
            return False, error_msg
    
    current_app.logger.info("Sale data validation successful")
    return True, ""

sale_bp = Blueprint("sale", __name__)

def get_supabase():
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
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
            
        supabase = get_supabase()
        
        # Base query - show sales where user is owner or creator
        query = supabase.table("sales").select("*").or_(f"owner_id.eq.{owner_id},created_by.eq.{user_id}")
        
        # Add filters
        start_date = request.args.get("start_date")
        if start_date:
            query = query.gte("date", start_date)
        
        end_date = request.args.get("end_date")
        if end_date:
            query = query.lte("date", end_date)
        
        payment_method = request.args.get("payment_method")
        if payment_method:
            query = query.eq("payment_method", payment_method)
        
        payment_status = request.args.get("payment_status")
        if payment_status:
            query = query.eq("payment_status", payment_status)
        
        salesperson_id = request.args.get("salesperson_id")
        if salesperson_id:
            query = query.eq("salesperson_id", salesperson_id)
        
        # Execute query
        result = query.order("created_at", desc=True).execute()
        
        return success_response(
            data={
                "sales": result.data if hasattr(result, 'data') else []
            }
        )
        
    except Exception as e:
        current_app.logger.error(f"Error in get_sales: {str(e)}", exc_info=True)
        return error_response(str(e), "Failed to retrieve sales", 500)

@sale_bp.route("/", methods=["POST"])
@jwt_required()
def create_sale():
    """
    Create a new sale transaction.
    
    This endpoint handles the creation of a sale with all its items in a single transaction.
    It validates the input data, calculates totals, and updates product stock levels.
    """
    current_app.logger.info("Starting sale creation process")
    
    try:
        # Authenticate and authorize user
        user_id = get_jwt_identity()
        current_app.logger.debug(f"Authenticated user ID: {user_id}")
        
        try:
            owner_id, user_role = get_user_context(user_id)
            current_app.debug(f"User context - Owner ID: {owner_id}, Role: {user_role}")
        except ValueError as e:
            current_app.logger.error(f"Authorization failed for user {user_id}: {str(e)}")
            return error_response("Not authorized to perform this action", "Authorization error", 403)
            
        # Get request data
        data = request.get_json()
        current_app.logger.debug(f"Received sale data: {data}")
        
        # Basic input validation
        if not data:
            current_app.logger.warning("No data provided in request")
            return error_response("No data provided", "Validation failed", 400)

        # Set context data
        data['owner_id'] = str(owner_id)
        data['created_by'] = str(user_id)
        
        # Validate sale data
        current_app.logger.info("Validating sale data")
        is_valid, error_message = validate_sale_data(data)
        if not is_valid:
            current_app.logger.warning(f"Validation failed: {error_message}")
            return error_response(error_message, "Validation failed", 400)

        try:
            # Calculate financials
            current_app.logger.debug("Calculating sale totals")
            sale_items = data.get('sale_items', [])
            
            # Calculate total amount from items
            total_amount = sum(
                float(item.get('quantity', 0)) * float(item.get('unit_price', 0)) 
                for item in sale_items
            )
            
            # Apply discounts and taxes
            discount_amount = max(0, float(data.get('discount_amount', 0)))
            tax_amount = max(0, float(data.get('tax_amount', 0)))
            net_amount = max(0, total_amount - discount_amount + tax_amount)
            
            # Calculate total cost of goods sold
            total_cogs = sum(
                float(item.get('cost_price', 0)) * float(item.get('quantity', 0)) 
                for item in sale_items
            )
            
            # Calculate profit
            profit = max(0, total_amount - total_cogs)

            # Prepare the payload for the database function
            sale_payload = {
                'owner_id': str(owner_id),
                'created_by': str(user_id),
                'customer_id': data.get('customer_id') if data.get('customer_id') else None,
                'salesperson_id': str(user_id),
                'payment_method': data.get('payment_method', 'cash'),
                'payment_status': data.get('payment_status', 'completed'),
                'total_amount': total_amount,
                'discount_amount': discount_amount,
                'tax_amount': tax_amount,
                'net_amount': net_amount,
                'total_cogs': total_cogs,
                'profit_from_sales': profit,
                'sale_items': sale_items,
                'notes': data.get('notes'),
                'date': data.get('date') or datetime.utcnow().date().isoformat()
            }
            
            current_app.logger.debug(f"Prepared sale payload: {sale_payload}")

            # Call the transactional function
            supabase = get_supabase()
            current_app.logger.info("Calling database transaction")
            
            try:
                result = supabase.rpc('create_sale_transaction', {'sale_payload': sale_payload}).execute()
                current_app.logger.debug(f"Database response: {result}")
                
                # Check for database errors
                if hasattr(result, 'error') and result.error:
                    error_msg = f"Database error: {result.error}"
                    current_app.logger.error(error_msg)
                    return error_response("Failed to process sale", "Database error", 500)
                
                # Process successful response
                if hasattr(result, 'data') and isinstance(result.data, dict):
                    if result.data.get('success') is True:
                        sale_id = result.data.get('sale_id')
                        current_app.logger.info(f"Successfully created sale with ID: {sale_id}")
                        return success_response(
                            data={
                                'sale_id': sale_id,
                                'amount': net_amount,
                                'items': len(sale_items)
                            },
                            message="Sale completed successfully",
                            status_code=201
                        )
                    else:
                        error_message = result.data.get('message', 'Failed to create sale')
                        current_app.logger.error(f"Sale creation failed: {error_message}")
                        return error_response(error_message, "Sale processing failed", 400)
                
                # Handle unexpected response format
                error_msg = "Unexpected response format from database"
                current_app.logger.error(f"{error_msg}: {result}")
                return error_response("Failed to process sale", "System error", 500)
                
            except Exception as db_error:
                current_app.logger.error(f"Database operation failed: {str(db_error)}", exc_info=True)
                return error_response("Failed to process sale", "Database error", 500)

        except (ValueError, TypeError) as e:
            current_app.logger.error(f"Data processing error: {str(e)}", exc_info=True)
            return error_response(f"Invalid data format: {str(e)}", "Data processing error", 400)
            
        except Exception as e:
            current_app.logger.error(f"Unexpected error in create_sale: {str(e)}", exc_info=True)
            return error_response(str(e), "An unexpected error occurred", 500)
            
    except Exception as e:
        current_app.logger.error(f"Error in create_sale endpoint: {str(e)}", exc_info=True)
        return error_response(str(e), "Internal server error", 500)

@sale_bp.route("/<sale_id>", methods=["GET"])
@jwt_required()
def get_sale(sale_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
            
        supabase = get_supabase()
        
        # Check if user has access to this sale
        result = supabase.table("sales")\
            .select("*")\
            .eq("id", sale_id)\
            .or_(f"owner_id.eq.{owner_id},created_by.eq.{user_id}")\
            .single()\
            .execute()
            
        if not result.data:
            return error_response("Sale not found or access denied", status_code=404)
            
        return success_response(
            data={
                "sale": result.data
            }
        )
        
    except Exception as e:
        current_app.logger.error(f"Error in get_sale: {str(e)}", exc_info=True)
        return error_response(str(e), "Failed to retrieve sale", 500)

@sale_bp.route("/<sale_id>", methods=["PUT"])
@jwt_required()
def update_sale(sale_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        sale = get_supabase().table("sales").select("*").eq("id", sale_id).eq("owner_id", owner_id).single().execute()
        
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
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        report_date_str = request.args.get("date", datetime.now().strftime("%Y-%m-%d"))
        
        report_date = datetime.strptime(report_date_str, "%Y-%m-%d").date()
        
        sales_result = get_supabase().table("sales").select("*").eq("owner_id", owner_id).gte("date", report_date.isoformat()).lte("date", (report_date + timedelta(days=1)).isoformat()).execute()
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
            sale_dt = datetime.fromisoformat(sale["date"])
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
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        period = request.args.get("period", "30")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=int(period))
        
        sales_result = get_supabase().table("sales").select("*").eq("owner_id", owner_id).gte("date", start_date.isoformat()).lte("date", end_date.isoformat()).execute()
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
            sale_dt = datetime.fromisoformat(sale["date"])
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
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        supabase = get_supabase()
        period = request.args.get("period", "30")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=int(period))
        
        team_members_result = get_supabase().table("users").select("id").eq("owner_id", owner_id).execute()
        team_member_ids = [member["id"] for member in team_members_result.data] + [owner_id]
        
        sales_result = get_supabase().table("sales").select("*").in_("salesperson_id", team_member_ids).gte("date", start_date.isoformat()).lte("date", end_date.isoformat()).execute()
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


