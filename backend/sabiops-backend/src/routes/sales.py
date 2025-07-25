from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import uuid
import logging
from src.utils.user_context import get_user_context

sales_bp = Blueprint("sales", __name__)

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

@sales_bp.route("/", methods=["GET"])
@jwt_required()
def get_sales():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        if not supabase:
            print("[ERROR] Supabase connection not available in get_sales")
            return error_response("Database connection not available", 500)
        query = supabase.table("sales").select("*").eq("owner_id", owner_id)
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
        try:
            sales_result = query.order("date", desc=True).execute()
        except Exception as db_exc:
            print(f"[ERROR] Supabase DB error in get_sales: {db_exc}")
            return error_response("Database error: " + str(db_exc), 500)
        if not sales_result.data:
            return success_response(
                data={
                    "sales": [],
                    "summary": {
                        "total_sales": 0.0,
                        "total_transactions": 0,
                        "today_sales": 0.0
                    }
                }
            )
        # Calculate summary statistics
        sales_data = sales_result.data
        try:
            total_sales = sum(float(sale.get("total_amount", 0)) for sale in sales_data)
            total_transactions = len(sales_data)
            total_profit_from_sales = sum(float(sale.get("profit_from_sales", 0)) for sale in sales_data)
            total_cogs = sum(float(sale.get("total_cogs", 0)) for sale in sales_data)
            profit_margin = (total_profit_from_sales / total_sales * 100) if total_sales > 0 else 0
            
            today = datetime.now().date().isoformat()
            today_sales = sum(
                float(sale.get("total_amount", 0)) 
                for sale in sales_data 
                if sale.get("date", "").startswith(today)
            )
            today_profit = sum(
                float(sale.get("profit_from_sales", 0)) 
                for sale in sales_data 
                if sale.get("date", "").startswith(today)
            )
        except Exception as calc_exc:
            print(f"[ERROR] Calculation error in get_sales: {calc_exc}")
            return error_response("Calculation error: " + str(calc_exc), 500)
        formatted_sales = []
        for sale in sales_data:
            formatted_sale = {
                "id": sale.get("id"),
                "customer_id": sale.get("customer_id"),
                "customer_name": sale.get("customer_name", "Walk-in Customer"),
                "product_id": sale.get("product_id"),
                "product_name": sale.get("product_name"),
                "quantity": sale.get("quantity"),
                "unit_price": float(sale.get("unit_price", 0)),
                "total_amount": float(sale.get("total_amount", 0)),
                "total_cogs": float(sale.get("total_cogs", 0)),
                "gross_profit": float(sale.get("gross_profit", 0)),
                "profit_from_sales": float(sale.get("profit_from_sales", 0)),
                "payment_method": sale.get("payment_method", "cash"),
                "date": sale.get("date"),
                "salesperson_id": sale.get("salesperson_id"),
                "created_at": sale.get("created_at")
            }
            formatted_sales.append(formatted_sale)
        return success_response(
            data={
                "sales": formatted_sales,
                "summary": {
                    "total_sales": total_sales,
                    "total_transactions": total_transactions,
                    "today_sales": today_sales,
                    "total_profit_from_sales": total_profit_from_sales,
                    "total_cogs": total_cogs,
                    "profit_margin": round(profit_margin, 2),
                    "today_profit": today_profit
                }
            }
        )
    except Exception as e:
        print(f"[ERROR] Unhandled exception in get_sales: {e}")
        import traceback
        print(traceback.format_exc())
        return error_response(str(e), "Failed to fetch sales", status_code=500)

@sales_bp.route("/", methods=["POST"])
@jwt_required()
def create_sale():
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return jsonify({
                "success": False,
                "message": "Database connection not available",
                "toast": {
                    "type": "error",
                    "message": "Database connection error. Please try again.",
                    "timeout": 4000
                }
            }), 500
        
        # Get user's role and owner_id
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            current_app.logger.error(f"Error getting user context: {str(e)}")
            return jsonify({
                "success": False,
                "message": str(e) or "Authorization error",
                "toast": {
                    "type": "error",
                    "message": "Authorization error. Please log in again.",
                    "timeout": 3000
                }
            }), 403
            
        data = request.get_json()
        
        # Enhanced validation for required fields with better error messages
        if not data.get("items") or not isinstance(data.get("items"), list) or len(data["items"]) == 0:
            return jsonify({
                "success": False,
                "message": "At least one item is required",
                "field": "items",
                "toast": {
                    "type": "error",
                    "message": "Please add at least one item to the sale",
                    "timeout": 3000
                }
            }), 400
        
        # Check if customer exists if provided
        customer_id = data.get("customer_id")
        customer_name = "Walk-in Customer"
        
        if customer_id:
            try:
                customer = supabase.table("customers").select("*").eq("id", customer_id).eq("owner_id", owner_id).execute()
                if customer.data:
                    customer_name = customer.data[0].get("name", "Walk-in Customer")
                else:
                    return jsonify({
                        "success": False,
                        "message": "Customer not found",
                        "field": "customer_id",
                        "toast": {
                            "type": "error",
                            "message": "The selected customer was not found",
                            "timeout": 4000
                        }
                    }), 404
            except Exception as e:
                current_app.logger.error(f"Error fetching customer: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": "Error validating customer information",
                    "field": "customer_id",
                    "toast": {
                        "type": "error",
                        "message": "Error validating customer information",
                        "timeout": 3000
                    }
                }), 500
        
        # Process and validate items
        processed_items = []
        subtotal = 0
        
        for index, item in enumerate(data["items"], 1):
            # Validate required item fields
            if not item.get("product_id"):
                return jsonify({
                    "success": False,
                    "message": f"Product is required for item {index}",
                    "field": f"items.{index-1}.product_id",
                    "toast": {
                        "type": "error",
                        "message": f"Please select a product for item {index}",
                        "timeout": 3000
                    }
                }), 400
                
            if not item.get("quantity") or float(item.get("quantity", 0)) <= 0:
                return jsonify({
                    "success": False,
                    "message": f"Invalid quantity for item {index}",
                    "field": f"items.{index-1}.quantity",
                    "toast": {
                        "type": "error",
                        "message": f"Please enter a valid quantity for item {index}",
                        "timeout": 3000
                    }
                }), 400
                
            if not item.get("unit_price") or float(item.get("unit_price", 0)) < 0:
                return jsonify({
                    "success": False,
                    "message": f"Invalid unit price for item {index}",
                    "field": f"items.{index-1}.unit_price",
                    "toast": {
                        "type": "error",
                        "message": f"Please enter a valid unit price for item {index}",
                        "timeout": 3000
                    }
                }), 400
            
            quantity = float(item["quantity"])
            unit_price = float(item["unit_price"])
            item_total = quantity * unit_price
            
            try:
                product = supabase.table("products")\
                    .select("name, stock_quantity, track_inventory")\
                    .eq("id", item["product_id"])\
                    .eq("owner_id", owner_id)\
                    .single()\
                    .execute()
                    
                if product.data:
                    if product.data.get("track_inventory", False):
                        available_stock = product.data.get("stock_quantity", 0)
                        if quantity > available_stock:
                            return jsonify({
                                "success": False,
                                "message": f"Insufficient stock for {product.data.get('name')}",
                                "toast": {
                                    "type": "error",
                                    "message": f"Not enough stock available for {product.data.get('name')}. Available: {available_stock}",
                                    "timeout": 4000
                                }
                            }), 400
            except Exception as e:
                current_app.logger.error(f"Error checking product stock: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": "Error validating product information",
                    "toast": {
                        "type": "error",
                        "message": "Error validating product information",
                        "timeout": 3000
                    }
                }), 500
            
            processed_item = {
                "product_id": item["product_id"],
                "quantity": quantity,
                "unit_price": unit_price,
                "total": item_total
            }
            
            if "description" in item:
                processed_item["description"] = item["description"]
            
            processed_items.append(processed_item)
            subtotal += item_total
        
        # Calculate tax and total
        tax_amount = float(data.get("tax_amount", 0))
        discount_amount = float(data.get("discount_amount", 0))
        total_amount = subtotal + tax_amount - discount_amount
        
        # Prepare sale data
        sale_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "user_id": user_id,  # Track which user created the sale
            "customer_id": customer_id,  # This can be None
            "customer_name": customer_name,
            "sale_number": f"SALE-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "status": "completed",
            "payment_method": data.get("payment_method", "cash"),
            "notes": data.get("notes", ""),
            "sale_date": data.get("sale_date") or datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Use a transaction to ensure data consistency
        try:
            with supabase.rpc('begin').execute():
                # Create the sale
                sale_result = supabase.table("sales").insert(sale_data).execute()
                
                if not sale_result.data:
                    raise Exception("Failed to create sale record")
                
                sale_id = sale_result.data[0]["id"]
                
                # Create sale items
                for item in processed_items:
                    item["sale_id"] = sale_id
                    item["id"] = str(uuid.uuid4())
                    
                    # Update product quantities if tracking inventory
                    if item.get("product_id"):
                        supabase.rpc('decrement_product_stock', {
                            'product_id': item["product_id"],
                            'amount': item["quantity"]
                        }).execute()
                
                # Insert all sale items
                items_result = supabase.table("sale_items").insert(processed_items).execute()
                if not items_result.data:
                    raise Exception("Failed to add sale items")
                
                # Create a transaction record
                transaction_data = {
                    "id": str(uuid.uuid4()),
                    "owner_id": owner_id,
                    "type": "sale",
                    "amount": total_amount,
                    "date": datetime.utcnow().isoformat(),
                    "reference_id": sale_id,
                    "reference_type": "sale",
                    "description": f"Sale to {customer_name}",
                    "payment_method": data.get("payment_method", "cash"),
                    "status": "completed",
                    "created_at": datetime.utcnow().isoformat()
                }
                
                transaction_result = supabase.table("transactions").insert(transaction_data).execute()
                if not transaction_result.data:
                    raise Exception("Failed to create transaction record")
                
                # Commit the transaction
                supabase.rpc('commit').execute()
                
                # Get the complete sale with items
                complete_sale = supabase.table("sales")\
                    .select("*, sale_items(*, products(name, sku, barcode))")\
                    .eq("id", sale_id)\
                    .single()\
                    .execute()
                
                return jsonify({
                    "success": True,
                    "message": "Sale recorded successfully",
                    "data": {
                        "sale": complete_sale.data
                    },
                    "toast": {
                        "type": "success",
                        "message": "Sale recorded successfully!",
                        "timeout": 3000
                    }
                }), 201
                
        except Exception as e:
            # Rollback on error
            supabase.rpc('rollback').execute()
            current_app.logger.error(f"Error processing sale: {str(e)}", exc_info=True)
            return jsonify({
                "success": False,
                "message": "Failed to process sale",
                "error": str(e),
                "toast": {
                    "type": "error",
                    "message": "An error occurred while processing the sale. Please try again.",
                    "timeout": 4000
                }
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Unexpected error in create_sale: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred",
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred. Please try again later.",
                "timeout": 4000
            }
        }), 500

@sales_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_sales_stats():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        query = supabase.table("sales").select("*").eq("owner_id", owner_id)
        
        if start_date:
            query = query.gte("date", start_date)
        
        if end_date:
            query = query.lte("date", end_date)
        
        sales_result = query.execute()
        
        if not sales_result.data:
            return success_response(
                data={
                    "total_sales": 0.0,
                    "total_transactions": 0,
                    "average_sale_value": 0.0,
                    "total_gross_profit": 0.0,
                    "total_profit_from_sales": 0.0,
                    "top_selling_products": [],
                    "sales_by_payment_method": {},
                    "monthly_sales": []
                }
            )
        
        sales = sales_result.data
        
        # Calculate basic statistics
        total_sales = sum(float(sale.get("total_amount", 0)) for sale in sales)
        total_transactions = len(sales)
        total_gross_profit = sum(float(sale.get("gross_profit", 0)) for sale in sales)
        total_profit_from_sales = sum(float(sale.get("profit_from_sales", 0)) for sale in sales)
        average_sale_value = total_sales / total_transactions if total_transactions > 0 else 0
        
        # Calculate product sales statistics
        product_sales = {}
        for sale in sales:
            product_id = sale.get("product_id")
            if product_id and product_id not in product_sales:
                product_sales[product_id] = {
                    "product_name": sale.get("product_name", "Unknown"),
                    "quantity": 0, 
                    "total_revenue": 0.0,
                    "total_profit": 0.0,
                    "total_profit_from_sales": 0.0
                }
            if product_id:
                product_sales[product_id]["quantity"] += int(sale.get("quantity", 0))
                product_sales[product_id]["total_revenue"] += float(sale.get("total_amount", 0))
                product_sales[product_id]["total_profit"] += float(sale.get("gross_profit", 0))
                product_sales[product_id]["total_profit_from_sales"] += float(sale.get("profit_from_sales", 0))
        
        # Get top selling products by revenue
        top_selling_products = sorted(
            [
                {"product_id": pid, **data} 
                for pid, data in product_sales.items()
            ],
            key=lambda x: x["total_revenue"],
            reverse=True
        )[:5]
        
        # Calculate sales by payment method
        sales_by_payment_method = {}
        for sale in sales:
            payment_method = sale.get("payment_method", "cash")
            if payment_method not in sales_by_payment_method:
                sales_by_payment_method[payment_method] = {
                    "count": 0,
                    "total_amount": 0.0
                }
            sales_by_payment_method[payment_method]["count"] += 1
            sales_by_payment_method[payment_method]["total_amount"] += float(sale.get("total_amount", 0))
        
        # Calculate monthly sales (last 12 months)
        monthly_sales = {}
        for sale in sales:
            sale_date = sale.get("date", "")
            if sale_date:
                try:
                    month_key = sale_date[:7]  # YYYY-MM format
                    if month_key not in monthly_sales:
                        monthly_sales[month_key] = {
                            "month": month_key,
                            "total_sales": 0.0,
                            "transaction_count": 0,
                            "gross_profit": 0.0,
                            "profit_from_sales": 0.0
                        }
                    monthly_sales[month_key]["total_sales"] += float(sale.get("total_amount", 0))
                    monthly_sales[month_key]["transaction_count"] += 1
                    monthly_sales[month_key]["gross_profit"] += float(sale.get("gross_profit", 0))
                    monthly_sales[month_key]["profit_from_sales"] += float(sale.get("profit_from_sales", 0))
                except:
                    continue
        
        # Sort monthly sales by month
        monthly_sales_list = sorted(monthly_sales.values(), key=lambda x: x["month"], reverse=True)[:12]
        
        return success_response(
            data={
                "total_sales": total_sales,
                "total_transactions": total_transactions,
                "average_sale_value": round(average_sale_value, 2),
                "total_gross_profit": total_gross_profit,
                "total_profit_from_sales": total_profit_from_sales,
                "top_selling_products": top_selling_products,
                "sales_by_payment_method": sales_by_payment_method,
                "monthly_sales": monthly_sales_list
            }
        )
        
    except Exception as e:
        logging.error(f"Error fetching sales stats: {str(e)}")
        return error_response(str(e), "Failed to fetch sales statistics", status_code=500)




@sales_bp.route("/<sale_id>", methods=["GET"])
@jwt_required()
def get_sale_by_id(sale_id):
    """Get a specific sale by ID"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        sale_result = supabase.table("sales").select("*").eq("id", sale_id).eq("owner_id", owner_id).single().execute()
        
        if not sale_result.data:
            return error_response("Sale not found", status_code=404)
        
        sale = sale_result.data
        formatted_sale = {
            "id": sale.get("id"),
            "customer_id": sale.get("customer_id"),
            "customer_name": sale.get("customer_name", "Walk-in Customer"),
            "product_id": sale.get("product_id"),
            "product_name": sale.get("product_name"),
            "quantity": sale.get("quantity"),
            "unit_price": float(sale.get("unit_price", 0)),
            "total_amount": float(sale.get("total_amount", 0)),
            "total_cogs": float(sale.get("total_cogs", 0)),
            "gross_profit": float(sale.get("gross_profit", 0)),
            "profit_from_sales": float(sale.get("profit_from_sales", 0)),
            "payment_method": sale.get("payment_method", "cash"),
            "date": sale.get("date"),
            "salesperson_id": sale.get("salesperson_id"),
            "created_at": sale.get("created_at")
        }
        
        return success_response(
            data={"sale": formatted_sale}
        )
        
    except Exception as e:
        logging.error(f"Error fetching sale {sale_id}: {str(e)}")
        return error_response(str(e), "Failed to fetch sale", status_code=500)

@sales_bp.route("/<sale_id>", methods=["PUT"])
@jwt_required()
def update_sale(sale_id):
    """Update a sale record"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if sale exists
        existing_sale_result = supabase.table("sales").select("*").eq("id", sale_id).eq("owner_id", owner_id).single().execute()
        if not existing_sale_result.data:
            return error_response("Sale not found", status_code=404)
        
        existing_sale = existing_sale_result.data
        
        # Validate numeric fields if provided
        if "quantity" in data:
            try:
                quantity = int(data["quantity"])
                if quantity <= 0:
                    return error_response("Quantity must be greater than 0", status_code=400)
            except (ValueError, TypeError):
                return error_response("Invalid quantity value", status_code=400)
        
        if "unit_price" in data:
            try:
                unit_price = float(data["unit_price"])
                if unit_price < 0:
                    return error_response("Unit price cannot be negative", status_code=400)
            except (ValueError, TypeError):
                return error_response("Invalid unit price value", status_code=400)
        
        if "total_amount" in data:
            try:
                total_amount = float(data["total_amount"])
                if total_amount < 0:
                    return error_response("Total amount cannot be negative", status_code=400)
            except (ValueError, TypeError):
                return error_response("Invalid total amount value", status_code=400)
        
        # Prepare update data
        update_data = {}
        allowed_fields = ["customer_id", "customer_name", "quantity", "unit_price", "total_amount", "payment_method", "date"]
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # If quantity or unit_price changed, recalculate totals
        if "quantity" in update_data or "unit_price" in update_data:
            # Get product details for cost calculation
            product_result = supabase.table("products").select("cost_price").eq("id", existing_sale["product_id"]).single().execute()
            cost_price = float(product_result.data.get("cost_price", 0)) if product_result.data else 0
            
            new_quantity = update_data.get("quantity", existing_sale["quantity"])
            new_unit_price = update_data.get("unit_price", existing_sale["unit_price"])
            new_total_amount = update_data.get("total_amount", new_quantity * new_unit_price)
            
            new_total_cogs = new_quantity * cost_price
            new_gross_profit = new_total_amount - new_total_cogs
            new_profit_from_sales = new_total_amount - new_total_cogs  # Same as gross_profit
            
            update_data.update({
                "total_amount": new_total_amount,
                "total_cogs": new_total_cogs,
                "gross_profit": new_gross_profit,
                "profit_from_sales": new_profit_from_sales
            })
        
        # Update the sale
        result = supabase.table("sales").update(update_data).eq("id", sale_id).execute()
        
        return success_response(
            message="Sale updated successfully",
            data={"sale": result.data[0]}
        )
        
    except Exception as e:
        logging.error(f"Error updating sale {sale_id}: {str(e)}")
        return error_response(str(e), "Failed to update sale", status_code=500)

@sales_bp.route("/<sale_id>", methods=["DELETE"])
@jwt_required()
def delete_sale(sale_id):
    """Delete a sale record and restore inventory using business operations manager"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        # Use business operations manager for data consistency
        from src.utils.business_operations import BusinessOperationsManager
        business_ops = BusinessOperationsManager(supabase)
        
        # Reverse the complete sale transaction with automatic inventory restoration
        success, error_message = business_ops.reverse_sale_transaction(sale_id, owner_id)
        
        if not success:
            return error_response(error_message, status_code=404 if "not found" in error_message.lower() else 400)
        
        return success_response(
            message="Sale deleted successfully with automatic inventory restoration and transaction cleanup"
        )
        
    except Exception as e:
        logging.error(f"Error deleting sale {sale_id}: {str(e)}")
        return error_response(str(e), "Failed to delete sale", status_code=500)

@sales_bp.route("/reports/daily", methods=["GET"])
@jwt_required()
def get_daily_sales_report():
    """Get daily sales report"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        target_date = request.args.get("date", datetime.now().date().isoformat())
        
        # Get sales for the specific date
        sales_result = supabase.table("sales").select("*").eq("owner_id", owner_id).gte("date", target_date).lt("date", target_date + "T23:59:59").execute()
        
        sales = sales_result.data
        
        if not sales:
            return success_response(
                data={
                    "date": target_date,
                    "total_sales": 0.0,
                    "total_transactions": 0,
                    "total_gross_profit": 0.0,
                    "sales_by_hour": {},
                    "top_products": [],
                    "payment_methods": {}
                }
            )
        
        # Calculate daily statistics
        total_sales = sum(float(sale.get("total_amount", 0)) for sale in sales)
        total_transactions = len(sales)
        total_gross_profit = sum(float(sale.get("gross_profit", 0)) for sale in sales)
        
        # Sales by hour
        sales_by_hour = {}
        for sale in sales:
            try:
                hour = datetime.fromisoformat(sale.get("date", "")).hour
                if hour not in sales_by_hour:
                    sales_by_hour[hour] = {"count": 0, "amount": 0.0}
                sales_by_hour[hour]["count"] += 1
                sales_by_hour[hour]["amount"] += float(sale.get("total_amount", 0))
            except:
                continue
        
        # Top products for the day
        product_sales = {}
        for sale in sales:
            product_id = sale.get("product_id")
            if product_id:
                if product_id not in product_sales:
                    product_sales[product_id] = {
                        "product_name": sale.get("product_name", "Unknown"),
                        "quantity": 0,
                        "revenue": 0.0
                    }
                product_sales[product_id]["quantity"] += int(sale.get("quantity", 0))
                product_sales[product_id]["revenue"] += float(sale.get("total_amount", 0))
        
        top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:5]
        
        # Payment methods breakdown
        payment_methods = {}
        for sale in sales:
            method = sale.get("payment_method", "cash")
            if method not in payment_methods:
                payment_methods[method] = {"count": 0, "amount": 0.0}
            payment_methods[method]["count"] += 1
            payment_methods[method]["amount"] += float(sale.get("total_amount", 0))
        
        return success_response(
            data={
                "date": target_date,
                "total_sales": total_sales,
                "total_transactions": total_transactions,
                "total_gross_profit": total_gross_profit,
                "sales_by_hour": sales_by_hour,
                "top_products": top_products,
                "payment_methods": payment_methods
            }
        )
        
    except Exception as e:
        logging.error(f"Error generating daily sales report: {str(e)}")
        return error_response(str(e), "Failed to generate daily sales report", status_code=500)

@sales_bp.route("/reports/summary", methods=["GET"])
@jwt_required()
def get_sales_summary():
    """Get comprehensive sales summary with various metrics"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        # Get all sales
        sales_result = supabase.table("sales").select("*").eq("owner_id", owner_id).execute()
        
        if not sales_result.data:
            return success_response(
                data={
                    "total_sales": 0.0,
                    "total_transactions": 0,
                    "total_gross_profit": 0.0,
                    "average_sale_value": 0.0,
                    "today_sales": 0.0,
                    "this_week_sales": 0.0,
                    "this_month_sales": 0.0,
                    "growth_metrics": {
                        "daily_growth": 0.0,
                        "weekly_growth": 0.0,
                        "monthly_growth": 0.0
                    }
                }
            )
        
        sales = sales_result.data
        now = datetime.now()
        today = now.date().isoformat()
        week_start = (now - datetime.timedelta(days=now.weekday())).date().isoformat()
        month_start = now.replace(day=1).date().isoformat()
        
        # Calculate totals
        total_sales = sum(float(sale.get("total_amount", 0)) for sale in sales)
        total_transactions = len(sales)
        total_gross_profit = sum(float(sale.get("gross_profit", 0)) for sale in sales)
        average_sale_value = total_sales / total_transactions if total_transactions > 0 else 0
        
        # Calculate period-specific sales
        today_sales = sum(
            float(sale.get("total_amount", 0)) 
            for sale in sales 
            if sale.get("date", "").startswith(today)
        )
        
        this_week_sales = sum(
            float(sale.get("total_amount", 0)) 
            for sale in sales 
            if sale.get("date", "") >= week_start
        )
        
        this_month_sales = sum(
            float(sale.get("total_amount", 0)) 
            for sale in sales 
            if sale.get("date", "") >= month_start
        )
        
        # Calculate growth metrics (simplified - comparing with previous periods)
        yesterday = (now - datetime.timedelta(days=1)).date().isoformat()
        yesterday_sales = sum(
            float(sale.get("total_amount", 0)) 
            for sale in sales 
            if sale.get("date", "").startswith(yesterday)
        )
        
        daily_growth = ((today_sales - yesterday_sales) / yesterday_sales * 100) if yesterday_sales > 0 else 0
        
        return success_response(
            data={
                "total_sales": total_sales,
                "total_transactions": total_transactions,
                "total_gross_profit": total_gross_profit,
                "average_sale_value": round(average_sale_value, 2),
                "today_sales": today_sales,
                "this_week_sales": this_week_sales,
                "this_month_sales": this_month_sales,
                "growth_metrics": {
                    "daily_growth": round(daily_growth, 2),
                    "weekly_growth": 0.0,  # Would need more complex calculation
                    "monthly_growth": 0.0  # Would need more complex calculation
                }
            }
        )
        
    except Exception as e:
        logging.error(f"Error generating sales summary: {str(e)}")
        return error_response(str(e), "Failed to generate sales summary", status_code=500)