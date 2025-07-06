from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import uuid

expense_bp = Blueprint("expense", __name__)

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

@expense_bp.route("/", methods=["GET"])
@jwt_required()
def get_expenses():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        
        query = supabase.table("expenses").select("*").eq("owner_id", owner_id)
        
        category = request.args.get("category")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        if category:
            query = query.eq("category", category)
        
        if start_date:
            query = query.gte("expense_date", start_date)
        
        if end_date:
            query = query.lte("expense_date", end_date)
        
        expenses = query.order("expense_date", desc=True).execute()
        
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
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["title", "amount", "category", "expense_date"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", status_code=400)
        
        expense_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "title": data["title"],
            "description": data.get("description", ""),
            "amount": float(data["amount"]),
            "category": data["category"],
            "payment_method": data.get("payment_method", ""),
            "is_tax_deductible": data.get("is_tax_deductible", False),
            "tax_category": data.get("tax_category", ""),
            "vendor_name": data.get("vendor_name", ""),
            "vendor_contact": data.get("vendor_contact", ""),
            "expense_date": data["expense_date"],
            "status": data.get("status", "pending"),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = supabase.table("expenses").insert(expense_data).execute()
        
        return success_response(
            message="Expense created successfully",
            data={
                "expense": result.data[0]
            },
            status_code=201
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/<expense_id>", methods=["GET"])
@jwt_required()
def get_expense(expense_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
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
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        expense = supabase.table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
        if not expense.data:
            return error_response("Expense not found", status_code=404)
        
        update_data = {
            "updated_at": datetime.now().isoformat()
        }
        
        if data.get("title"):
            update_data["title"] = data["title"]
        if data.get("description"):
            update_data["description"] = data["description"]
        if data.get("amount"):
            update_data["amount"] = float(data["amount"])
        if data.get("category"):
            update_data["category"] = data["category"]
        if data.get("payment_method"):
            update_data["payment_method"] = data["payment_method"]
        if data.get("is_tax_deductible") is not None:
            update_data["is_tax_deductible"] = data["is_tax_deductible"]
        if data.get("tax_category"):
            update_data["tax_category"] = data["tax_category"]
        if data.get("vendor_name"):
            update_data["vendor_name"] = data["vendor_name"]
        if data.get("vendor_contact"):
            update_data["vendor_contact"] = data["vendor_contact"]
        if data.get("expense_date"):
            update_data["expense_date"] = data["expense_date"]
        if data.get("status"):
            update_data["status"] = data["status"]
        
        supabase.table("expenses").update(update_data).eq("id", expense_id).execute()
        
        return success_response(
            message="Expense updated successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/<expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        expense = supabase.table("expenses").select("*").eq("id", expense_id).eq("owner_id", owner_id).single().execute()
        
        if not expense.data:
            return error_response("Expense not found", status_code=404)
        
        supabase.table("expenses").delete().eq("id", expense_id).execute()
        
        return success_response(
            message="Expense deleted successfully"
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

@expense_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_expense_categories():
    try:
        supabase = current_app.config["SUPABASE_CLIENT"]
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
        supabase = current_app.config["SUPABASE_CLIENT"]
        owner_id = get_jwt_identity()
        
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        query = supabase.table("expenses").select("*").eq("owner_id", owner_id)
        
        if start_date:
            query = query.gte("expense_date", start_date)
        
        if end_date:
            query = query.lte("expense_date", end_date)
        
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
            month_key = datetime.fromisoformat(expense["expense_date"]).strftime("%Y-%m")
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




