from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.utils.user_context import get_user_context
from datetime import datetime, date, timedelta
import uuid
import logging
from src.services.supabase_service import SupabaseService

expense_bp = Blueprint("expense", __name__)

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
    logging.error(f"[EXPENSE API ERROR] Status: {status_code}, Message: {message}, Error: {error}")
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

def get_nigerian_expense_categories():
    """Get Nigerian SME specific expense categories and subcategories"""
    return {
        "Inventory/Stock": {
            "description": "Goods purchased for resale",
            "subcategories": ["Raw Materials", "Finished Goods", "Packaging Materials", "Import Duties"]
        },
        "Rent": {
            "description": "Shop/office rent and related costs",
            "subcategories": ["Shop Rent", "Office Rent", "Warehouse Rent", "Equipment Rent"]
        },
        "Utilities": {
            "description": "Basic business utilities",
            "subcategories": ["Electricity", "Water", "Internet", "Phone", "Generator Fuel"]
        },
        "Transportation": {
            "description": "Business travel and logistics",
            "subcategories": ["Fuel", "Vehicle Maintenance", "Public Transport", "Delivery Costs", "Logistics"]
        },
        "Marketing": {
            "description": "Advertising and promotional expenses",
            "subcategories": ["Social Media Ads", "Print Materials", "Radio/TV Ads", "Promotional Items", "Website"]
        },
        "Staff Salaries": {
            "description": "Employee compensation and benefits",
            "subcategories": ["Basic Salary", "Overtime", "Bonuses", "Allowances", "Benefits"]
        },
        "Equipment": {
            "description": "Business equipment and tools",
            "subcategories": ["Computers", "Machinery", "Furniture", "Tools", "Software"]
        },
        "Professional Services": {
            "description": "External professional services",
            "subcategories": ["Accounting", "Legal", "Consulting", "IT Support", "Training"]
        },
        "Insurance": {
            "description": "Business insurance premiums",
            "subcategories": ["Business Insurance", "Vehicle Insurance", "Health Insurance", "Property Insurance"]
        },
        "Taxes": {
            "description": "Government taxes and levies",
            "subcategories": ["VAT", "Company Tax", "PAYE", "Local Government Levy", "Import Duty"]
        },
        "Bank Charges": {
            "description": "Banking and financial service fees",
            "subcategories": ["Transaction Fees", "Account Maintenance", "Transfer Charges", "POS Charges"]
        },
        "Other": {
            "description": "Miscellaneous business expenses",
            "subcategories": ["Miscellaneous", "Emergency Repairs", "Cleaning", "Security", "Stationery"]
        }
    }

def validate_expense_data(data):
    """Validate expense data with Nigerian SME context"""
    required_fields = ["category", "amount", "date"]
    for field in required_fields:
        if not data.get(field):
            return False, f"{field} is required"
    
    # Validate amount
    try:
        amount = float(data["amount"])
        if amount <= 0:
            return False, "Amount must be greater than 0"
    except (ValueError, TypeError):
        return False, "Invalid amount value"
    
    # Validate category
    valid_categories = get_nigerian_expense_categories().keys()
    if data["category"] not in valid_categories:
        return False, f"Invalid category. Must be one of: {', '.join(valid_categories)}"
    
    # Validate subcategory if provided
    if data.get("sub_category"):
        valid_subcategories = get_nigerian_expense_categories()[data["category"]]["subcategories"]
        if data["sub_category"] not in valid_subcategories:
            return False, f"Invalid subcategory for {data['category']}. Must be one of: {', '.join(valid_subcategories)}"
    
    # Validate date format
    try:
        datetime.fromisoformat(data["date"].replace('Z', '+00:00'))
    except ValueError:
        return False, "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
    
    return True, None

@expense_bp.route("/", methods=["GET"])
@jwt_required()
def get_expenses():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        
        # Build query with filters
        query = supabase.table("expenses").select("*").eq("owner_id", owner_id)
        
        category = request.args.get("category")
        sub_category = request.args.get("sub_category")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        payment_method = request.args.get("payment_method")
        
        if category:
            query = query.eq("category", category)
        
        if sub_category:
            query = query.eq("sub_category", sub_category)
        
        if start_date:
            query = query.gte("date", start_date)
        
        if end_date:
            query = query.lte("date", end_date)
        
        if payment_method:
            query = query.eq("payment_method", payment_method)
        
        expenses_result = query.order("date", desc=True).execute()
        
        if not expenses_result.data:
            return success_response(
                data={
                    "expenses": [],
                    "summary": {
                        "total_expenses": 0.0,
                        "total_count": 0,
                        "today_expenses": 0.0,
                        "this_month_expenses": 0.0
                    }
                }
            )
        
        # Format expenses data for response
        expenses_data = expenses_result.data
        formatted_expenses = []
        
        for expense in expenses_data:
            formatted_expense = {
                "id": expense.get("id"),
                "category": expense.get("category"),
                "sub_category": expense.get("sub_category", ""),
                "amount": float(expense.get("amount", 0)),
                "description": expense.get("description", ""),
                "receipt_url": expense.get("receipt_url", ""),
                "payment_method": expense.get("payment_method", "cash"),
                "date": expense.get("date"),
                "created_at": expense.get("created_at"),
                "updated_at": expense.get("updated_at")
            }
            formatted_expenses.append(formatted_expense)
        
        # Calculate summary statistics
        total_expenses = sum(float(expense.get("amount", 0)) for expense in expenses_data)
        total_count = len(expenses_data)
        
        # Calculate today's expenses
        today = datetime.now().date().isoformat()
        today_expenses = sum(
            float(expense.get("amount", 0)) 
            for expense in expenses_data 
            if expense.get("date", "").startswith(today)
        )
        
        # Calculate this month's expenses
        month_start = datetime.now().replace(day=1).date().isoformat()
        this_month_expenses = sum(
            float(expense.get("amount", 0)) 
            for expense in expenses_data 
            if expense.get("date", "") >= month_start
        )
        
        return success_response(
            data={
                "expenses": formatted_expenses,
                "summary": {
                    "total_expenses": total_expenses,
                    "total_count": total_count,
                    "today_expenses": today_expenses,
                    "this_month_expenses": this_month_expenses
                }
            }
        )
        
    except Exception as e:
        logging.error(f"Error fetching expenses: {str(e)}")
        return error_response(str(e), "Failed to fetch expenses", status_code=500)

@expense_bp.route("/", methods=["POST"])
@jwt_required()
def create_expense():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        data = request.get_json()
        
        logging.info(f"[EXPENSE CREATE] Owner ID: {owner_id}, Data received: {data}")
        
        # Validate expense data with Nigerian SME context
        is_valid, error_message = validate_expense_data(data)
        if not is_valid:
            return error_response(error_message, status_code=400)
        
        expense_id = str(uuid.uuid4())
        expense_data = {
            "id": expense_id,
            "owner_id": owner_id,
            "category": data["category"],
            "sub_category": data.get("sub_category", ""),
            "amount": float(data["amount"]),
            "description": data.get("description", ""),
            "receipt_url": data.get("receipt_url", ""),
            "payment_method": data.get("payment_method", "cash"),
            "date": data["date"],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Use business operations manager for data consistency
        from src.utils.business_operations import BusinessOperationsManager
        business_ops = BusinessOperationsManager(supabase)
        
        # Process the complete expense transaction with automatic transaction creation
        success, error_message, expense_record = business_ops.process_expense_transaction(data, owner_id)
        
        if not success:
            return error_response(error_message, status_code=400)
        
        logging.info(f"[EXPENSE CREATE SUCCESS] Expense created with ID: {expense_record['id']}")
        
        return success_response(
            message="Expense created successfully with automatic transaction record",
            data={
                "expense": expense_record
            },
            status_code=201
        )
        
    except Exception as e:
        logging.error(f"[EXPENSE CREATE EXCEPTION] {str(e)}")
        return error_response(str(e), "Failed to create expense", status_code=500)

@expense_bp.route("/<expense_id>", methods=["GET"])
@jwt_required()
def get_expense(expense_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        expense = supabase.table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
        if not expense.data:
            return error_response("Expense not found", status_code=404)
        
        return success_response(
            data={
                "expense": expense.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/<expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        data = request.get_json()
        
        # Check if expense exists
        expense_result = supabase.table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
        if not expense_result.data:
            return error_response("Expense not found", status_code=404)
        
        existing_expense = expense_result.data
        
        # Validate updated data if provided
        if data.get("amount"):
            try:
                amount = float(data["amount"])
                if amount <= 0:
                    return error_response("Amount must be greater than 0", status_code=400)
            except (ValueError, TypeError):
                return error_response("Invalid amount value", status_code=400)
        
        if data.get("category"):
            valid_categories = get_nigerian_expense_categories().keys()
            if data["category"] not in valid_categories:
                return error_response(f"Invalid category. Must be one of: {', '.join(valid_categories)}", status_code=400)
        
        if data.get("sub_category") and data.get("category"):
            valid_subcategories = get_nigerian_expense_categories()[data["category"]]["subcategories"]
            if data["sub_category"] not in valid_subcategories:
                return error_response(f"Invalid subcategory for {data['category']}", status_code=400)
        
        # Prepare update data
        update_data = {
            "updated_at": datetime.now().isoformat()
        }
        
        allowed_fields = ["category", "sub_category", "description", "amount", "receipt_url", "payment_method", "date"]
        for field in allowed_fields:
            if field in data:
                if field == "amount":
                    update_data[field] = float(data[field])
                else:
                    update_data[field] = data[field]
        
        # Update expense record
        result = supabase.table("expenses").update(update_data).eq("id", expense_id).execute()
        
        # Update related transaction record if it exists
        try:
            transaction_update_data = {}
            if "category" in update_data:
                transaction_update_data["category"] = update_data["category"]
            if "sub_category" in update_data:
                transaction_update_data["sub_category"] = update_data["sub_category"]
            if "amount" in update_data:
                transaction_update_data["amount"] = update_data["amount"]
            if "description" in update_data:
                transaction_update_data["description"] = update_data["description"]
            if "payment_method" in update_data:
                transaction_update_data["payment_method"] = update_data["payment_method"]
            if "date" in update_data:
                transaction_update_data["date"] = update_data["date"]
            
            if transaction_update_data:
                supabase.table("transactions").update(transaction_update_data).eq("reference_id", expense_id).eq("reference_type", "expense").execute()
                logging.info(f"[EXPENSE UPDATE] Transaction record updated for expense {expense_id}")
        except Exception as transaction_error:
            logging.warning(f"Failed to update transaction record: {str(transaction_error)}")
        
        return success_response(
            message="Expense updated successfully",
            data={"expense": result.data[0]}
        )
        
    except Exception as e:
        logging.error(f"Error updating expense {expense_id}: {str(e)}")
        return error_response(str(e), "Failed to update expense", status_code=500)

@expense_bp.route("/<expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        
        # Check if expense exists
        expense_result = supabase.table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
        if not expense_result.data:
            return error_response("Expense not found", status_code=404)
        
        # Delete related transaction record if exists
        try:
            supabase.table("transactions").delete().eq("reference_id", expense_id).eq("reference_type", "expense").execute()
            logging.info(f"[EXPENSE DELETE] Transaction record deleted for expense {expense_id}")
        except Exception as transaction_error:
            logging.warning(f"Failed to delete related transaction: {str(transaction_error)}")
        
        # Delete the expense
        supabase.table("expenses").delete().eq("id", expense_id).execute()
        
        return success_response(
            message="Expense deleted successfully"
        )
        
    except Exception as e:
        logging.error(f"Error deleting expense {expense_id}: {str(e)}")
        return error_response(str(e), "Failed to delete expense", status_code=500)

@expense_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_expense_categories():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        
        # Return Nigerian SME specific expense categories with subcategories
        nigerian_categories = get_nigerian_expense_categories()
        
        # Format for frontend consumption
        formatted_categories = []
        for category_name, category_info in nigerian_categories.items():
            formatted_categories.append({
                "name": category_name,
                "description": category_info["description"],
                "subcategories": category_info["subcategories"]
            })
        
        return success_response(
            data={
                "categories": formatted_categories,
                "total_categories": len(formatted_categories)
            }
        )
        
    except Exception as e:
        logging.error(f"Error fetching expense categories: {str(e)}")
        return error_response(str(e), "Failed to fetch expense categories", status_code=500)

@expense_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_expense_stats():
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        query = supabase.table("expenses").select("*").eq("owner_id", owner_id)
        
        if start_date:
            query = query.gte("date", start_date)
        
        if end_date:
            query = query.lte("date", end_date)
        
        expenses = query.execute().data
        
        total_expenses = sum(float(expense["amount"]) for expense in expenses)
        total_count = len(expenses)
        
        category_stats = {}
        for expense in expenses:
            category = expense["category"]
            if category not in category_stats:
                category_stats[category] = {"count": 0, "total": 0.0}
            category_stats[category]["count"] += 1
            category_stats[category]["total"] += float(expense["amount"])
        
        monthly_stats = {}
        for expense in expenses:
            month_key = datetime.fromisoformat(expense["date"]).strftime("%Y-%m")
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {"count": 0, "total": 0.0}
            monthly_stats[month_key]["count"] += 1
            monthly_stats[month_key]["total"] += float(expense["amount"])
        
        return success_response(
            data={
                "total_expenses": total_expenses,
                "total_count": total_count,
                "average_expense": total_expenses / total_count if total_count > 0 else 0,
                "category_breakdown": category_stats,
                "monthly_breakdown": monthly_stats
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/reports/daily", methods=["GET"])
@jwt_required()
def get_daily_expense_report():
    """Get daily expense report"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        
        target_date = request.args.get("date", datetime.now().date().isoformat())
        
        # Get expenses for the specific date
        expenses_result = supabase.table("expenses").select("*").eq("owner_id", owner_id).gte("date", target_date).lt("date", target_date + "T23:59:59").execute()
        
        expenses = expenses_result.data
        
        if not expenses:
            return success_response(
                data={
                    "date": target_date,
                    "total_expenses": 0.0,
                    "total_count": 0,
                    "expenses_by_category": {},
                    "top_categories": [],
                    "payment_methods": {}
                }
            )
        
        # Calculate daily statistics
        total_expenses = sum(float(expense.get("amount", 0)) for expense in expenses)
        total_count = len(expenses)
        
        # Expenses by category
        expenses_by_category = {}
        for expense in expenses:
            category = expense.get("category", "Other")
            if category not in expenses_by_category:
                expenses_by_category[category] = {"count": 0, "amount": 0.0}
            expenses_by_category[category]["count"] += 1
            expenses_by_category[category]["amount"] += float(expense.get("amount", 0))
        
        # Top categories for the day
        top_categories = sorted(expenses_by_category.items(), key=lambda x: x[1]["amount"], reverse=True)[:5]
        top_categories = [{"category": cat, **data} for cat, data in top_categories]
        
        # Payment methods breakdown
        payment_methods = {}
        for expense in expenses:
            method = expense.get("payment_method", "cash")
            if method not in payment_methods:
                payment_methods[method] = {"count": 0, "amount": 0.0}
            payment_methods[method]["count"] += 1
            payment_methods[method]["amount"] += float(expense.get("amount", 0))
        
        return success_response(
            data={
                "date": target_date,
                "total_expenses": total_expenses,
                "total_count": total_count,
                "expenses_by_category": expenses_by_category,
                "top_categories": top_categories,
                "payment_methods": payment_methods
            }
        )
        
    except Exception as e:
        logging.error(f"Error generating daily expense report: {str(e)}")
        return error_response(str(e), "Failed to generate daily expense report", status_code=500)

@expense_bp.route("/reports/summary", methods=["GET"])
@jwt_required()
def get_expense_summary():
    """Get comprehensive expense summary with various metrics"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except Exception as e:
            return error_response(str(e), "User context error", status_code=403)
        supabase = get_supabase()
        
        # Get all expenses
        expenses_result = supabase.table("expenses").select("*").eq("owner_id", owner_id).execute()
        
        if not expenses_result.data:
            return success_response(
                data={
                    "total_expenses": 0.0,
                    "total_count": 0,
                    "average_expense": 0.0,
                    "today_expenses": 0.0,
                    "this_week_expenses": 0.0,
                    "this_month_expenses": 0.0,
                    "growth_metrics": {
                        "daily_growth": 0.0,
                        "weekly_growth": 0.0,
                        "monthly_growth": 0.0
                    }
                }
            )
        
        expenses = expenses_result.data
        now = datetime.now()
        today = now.date().isoformat()
        week_start = (now - timedelta(days=now.weekday())).date().isoformat()
        month_start = now.replace(day=1).date().isoformat()
        
        # Calculate totals
        total_expenses = sum(float(expense.get("amount", 0)) for expense in expenses)
        total_count = len(expenses)
        average_expense = total_expenses / total_count if total_count > 0 else 0
        
        # Calculate period-specific expenses
        today_expenses = sum(
            float(expense.get("amount", 0)) 
            for expense in expenses 
            if expense.get("date", "").startswith(today)
        )
        
        this_week_expenses = sum(
            float(expense.get("amount", 0)) 
            for expense in expenses 
            if expense.get("date", "") >= week_start
        )
        
        this_month_expenses = sum(
            float(expense.get("amount", 0)) 
            for expense in expenses 
            if expense.get("date", "") >= month_start
        )
        
        # Calculate growth metrics (simplified - comparing with previous periods)
        yesterday = (now - timedelta(days=1)).date().isoformat()
        yesterday_expenses = sum(
            float(expense.get("amount", 0)) 
            for expense in expenses 
            if expense.get("date", "").startswith(yesterday)
        )
        
        daily_growth = ((today_expenses - yesterday_expenses) / yesterday_expenses * 100) if yesterday_expenses > 0 else 0
        
        return success_response(
            data={
                "total_expenses": total_expenses,
                "total_count": total_count,
                "average_expense": round(average_expense, 2),
                "today_expenses": today_expenses,
                "this_week_expenses": this_week_expenses,
                "this_month_expenses": this_month_expenses,
                "growth_metrics": {
                    "daily_growth": round(daily_growth, 2),
                    "weekly_growth": 0.0,  # Would need more complex calculation
                    "monthly_growth": 0.0  # Would need more complex calculation
                }
            }
        )
        
    except Exception as e:
        logging.error(f"Error generating expense summary: {str(e)}")
        return error_response(str(e), "Failed to generate expense summary", status_code=500)




