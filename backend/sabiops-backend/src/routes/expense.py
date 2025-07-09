from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import uuid

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
    print(f"[EXPENSE API ERROR] Status: {status_code}, Message: {message}, Error: {error}")
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@expense_bp.route("/", methods=["GET"])
@jwt_required()
def get_expenses():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        query = get_supabase().table("expenses").select("*").eq("owner_id", owner_id)
        
        category = request.args.get("category")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        if category:
            query = query.eq("category", category)
        
        if start_date:
            query = query.gte("date", start_date)
        
        if end_date:
            query = query.lte("date", end_date)
        
        expenses = query.order("date", desc=True).execute()
        
        return success_response(
            data={
                "expenses": expenses.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/", methods=["POST"])
@jwt_required()
def create_expense():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"[EXPENSE CREATE] Owner ID: {owner_id}, Data received: {data}")
        
        required_fields = ["category", "amount", "date"]
        for field in required_fields:
            if not data.get(field):
                print(f"[EXPENSE CREATE ERROR] Missing required field: {field}")
                return error_response(f"{field} is required", status_code=400)
        
        expense_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "category": data["category"],
            "amount": float(data["amount"]),
            "description": data.get("description", ""),
            "receipt_url": data.get("receipt_url", ""),
            "payment_method": data.get("payment_method", "cash"),
            "date": data["date"],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = get_supabase().table("expenses").insert(expense_data).execute()
        
        print(f"[EXPENSE CREATE SUCCESS] Expense created with ID: {result.data[0]['id']}")
        
        return success_response(
            message="Expense created successfully",
            data={
                "expense": result.data[0]
            },
            status_code=201
        )
        
    except Exception as e:
        print(f"[EXPENSE CREATE EXCEPTION] {str(e)}")
        return error_response(str(e), status_code=500)

@expense_bp.route("/<expense_id>", methods=["GET"])
@jwt_required()
def get_expense(expense_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        expense = get_supabase().table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
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
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        expense = get_supabase().table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
        if not expense.data:
            return error_response("Expense not found", status_code=404)
        
        update_data = {
            "updated_at": datetime.now().isoformat()
        }
        
        if data.get("category"):
            update_data["category"] = data["category"]
        if data.get("description"):
            update_data["description"] = data["description"]
        if data.get("amount"):
            update_data["amount"] = float(data["amount"])
        if data.get("receipt_url"):
            update_data["receipt_url"] = data["receipt_url"]
        if data.get("payment_method"):
            update_data["payment_method"] = data["payment_method"]
        if data.get("date"):
            update_data["date"] = data["date"]
        
        get_supabase().table("expenses").update(update_data).eq("id", expense_id).execute()
        
        return success_response(
            message="Expense updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/<expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        expense = get_supabase().table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
        if not expense.data:
            return error_response("Expense not found", status_code=404)
        
        get_supabase().table("expenses").delete().eq("id", expense_id).execute()
        
        return success_response(
            message="Expense deleted successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_expense_categories():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        # For simplicity, returning a static list of common categories.
        # In a real app, these might be stored in a Supabase table.
        categories = [
            {"name": "Rent", "description": "Monthly rent for office or business space"},
            {"name": "Utilities", "description": "Electricity, water, internet bills"},
            {"name": "Salaries", "description": "Employee salaries and wages"},
            {"name": "Marketing", "description": "Advertising and promotional expenses"},
            {"name": "Supplies", "description": "Office or operational supplies"},
            {"name": "Travel", "description": "Business travel expenses"},
            {"name": "Maintenance", "description": "Repairs and maintenance"},
            {"name": "Other", "description": "Miscellaneous expenses"}
        ]
        
        return success_response(
            data={
                "categories": categories
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_expense_stats():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        query = get_supabase().table("expenses").select("*").eq("owner_id", owner_id)
        
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




