from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import logging

from core.use_cases.sales.create_sale_use_case import CreateSaleUseCase
from utils.user_context import get_user_context
from utils.subscription_decorators import protected_sales_creation, get_usage_status_for_response
from shared.utils.response_utils import (
    success_response, error_response, validation_error_response,
    internal_server_error_response, not_found_response
)

logger = logging.getLogger(__name__)
sales_bp = Blueprint("sales", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

class SalesService:
    """Service for sales operations"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def get_sales_with_filters(self, owner_id: str, filters: dict) -> dict:
        """Get sales with optional filters"""
        try:
            # Build query with filters
            query = self.supabase.table("sales").select("*").eq("owner_id", owner_id)
            
            if filters.get("start_date"):
                query = query.gte("date", filters["start_date"])
            if filters.get("end_date"):
                query = query.lte("date", filters["end_date"])
            if filters.get("customer_id"):
                query = query.eq("customer_id", filters["customer_id"])
            if filters.get("product_id"):
                query = query.eq("product_id", filters["product_id"])
            
            sales_result = query.order("date", desc=True).execute()
            
            if not sales_result.data:
                return {
                    "sales": [],
                    "summary": {
                        "total_sales": 0.0,
                        "total_transactions": 0,
                        "today_sales": 0.0,
                        "total_profit": 0.0,
                        "profit_margin": 0.0
                    }
                }
            
            # Calculate summary statistics
            sales_data = sales_result.data
            total_sales = sum(float(sale.get("total_amount", 0)) for sale in sales_data)
            total_transactions = len(sales_data)
            total_profit = sum(float(sale.get("profit_from_sales", 0)) for sale in sales_data)
            profit_margin = (total_profit / total_sales * 100) if total_sales > 0 else 0
            
            # Today's sales
            today = datetime.now().date().isoformat()
            today_sales = sum(
                float(sale.get("total_amount", 0)) 
                for sale in sales_data 
                if sale.get("date") and str(sale.get("date", "")).startswith(today)
            )
            
            return {
                "sales": sales_data,
                "summary": {
                    "total_sales": total_sales,
                    "total_transactions": total_transactions,
                    "today_sales": today_sales,
                    "total_profit": total_profit,
                    "profit_margin": round(profit_margin, 2)
                }
            }
            
        except Exception as e:
            logerror(f"Error getting sales: {str(e)}")
            raise
    
    def get_sale_by_id(self, sale_id: str, owner_id: str) -> dict:
        """Get single sale by ID"""
        try:
            result = self.supabase.table("sales").select("*").eq("id", sale_id).eq("owner_id", owner_id).execute()
            
            if not result.data:
                return None
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error getting sale by ID: {str(e)}")
            raise

@sales_bp.route("/", methods=["GET"])
@jwt_required()
def get_sales():
    """Get sales with optional filters"""
    try:
        supabase = get_supabase()
        if not supabase:
            return internal_server_error_response("Database connection not available")
        
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response("AUTHORIZATION_ERROR", str(e), 403)
        
        # Get filters from query parameters
        filters = {
            "start_date": request.args.get("start_date"),
            "end_date": request.args.get("end_date"),
            "customer_id": request.args.get("customer_id"),
            "product_id": request.args.get("product_id")
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        sales_service = SalesService(supabase)
        result = sales_service.get_sales_with_filters(owner_id, filters)
        
        return success_response(
            data=result,
            message="Sales retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Get sales error: {str(e)}")
        return internal_server_error_response(f"Failed to get sales: {str(e)}")

@sales_bp.route("/<sale_id>", methods=["GET"])
@jwt_required()
def get_sale(sale_id):
    """Get single sale by ID"""
    try:
        supabase = get_supabase()
        if not supabase:
            return internal_server_error_response("Database connection not available")
        
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response("AUTHORIZATION_ERROR", str(e), 403)
        
        sales_service = SalesService(supabase)
        sale = sales_service.get_sale_by_id(sale_id, owner_id)
        
        if not sale:
            return not_found_response("Sale", sale_id)
        
        return success_response(
            data=sale,
            message="Sale retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Get sale error: {str(e)}")
        return internal_server_error_response(f"Failed to get sale: {str(e)}")

@sales_bp.route("/", methods=["POST"])
@jwt_required()
@protected_sales_creation
def create_sale():
    """Create a new sale with inventory management"""
    try:
        supabase = get_supabase()
        if not supabase:
            return internal_server_error_response("Database connection not available")
        
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response("AUTHORIZATION_ERROR", str(e), 403)
        
        data = request.get_json()
        if not data:
            return validation_error_response("Request body is required")
        
        # Create sale using use case
        create_sale_use_case = CreateSaleUseCase(supabase)
        result = create_sale_use_case.execute(data, owner_id)
        
        if result["success"]:
            # Add usage status to response
            response_data = result["data"]
            usage_status = get_usage_status_for_response(user_id)
            if usage_status:
                response_data["usage_status"] = usage_status
            
            return success_response(
                data=response_data,
                message=result["message"]
            )
        else:
            if result.get("errors"):
                return validation_error_response(result["message"], result["errors"])
            else:
                return error_response("SALE_CREATION_FAILED", result["message"], 400)
        
    except Exception as e:
        logger.error(f"Create sale error: {str(e)}")
        return internal_server_error_response(f"Failed to create sale: {str(e)}")

@sales_bp.route("/<sale_id>", methods=["PUT"])
@jwt_required()
def update_sale(sale_id):
    """Update an existing sale"""
    try:
        supabase = get_supabase()
        if not supabase:
            return internal_server_error_response("Database connection not available")
        
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response("AUTHORIZATION_ERROR", str(e), 403)
        
        data = request.get_json()
        if not data:
            return validation_error_response("Request body is required")
        
        # Check if sale exists
        sales_service = SalesService(supabase)
        existing_sale = sales_service.get_sale_by_id(sale_id, owner_id)
        
        if not existing_sale:
            return not_found_response("Sale", sale_id)
        
        # Update allowed fields
        allowed_fields = ['customer_name', 'customer_id', 'notes', 'payment_method']
        updates = {k: v for k, v in data.items() if k in allowed_fields and v is not None}
        
        if not updates:
            return validation_error_response("No valid fields to update")
        
        updates['updated_at'] = datetime.now().isoformat()
        
        result = supabase.table("sales").update(updates).eq("id", sale_id).eq("owner_id", owner_id).execute()
        
        if result.data:
            return success_response(
                data=result.data[0],
                message="Sale updated successfully"
            )
        else:
            return error_response("UPDATE_FAILED", "Failed to update sale", 400)
        
    except Exception as e:
        logger.error(f"Update sale error: {str(e)}")
        return internal_server_error_response(f"Failed to update sale: {str(e)}")

@sales_bp.route("/<sale_id>", methods=["DELETE"])
@jwt_required()
def delete_sale(sale_id):
    """Delete a sale (soft delete)"""
    try:
        supabase = get_supabase()
        if not supabase:
            return internal_server_error_response("Database connection not available")
        
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response("AUTHORIZATION_ERROR", str(e), 403)
        
        # Check if sale exists
        sales_service = SalesService(supabase)
        existing_sale = sales_service.get_sale_by_id(sale_id, owner_id)
        
        if not existing_sale:
            return not_found_response("Sale", sale_id)
        
        # Soft delete by updating status
        result = supabase.table("sales").update({
            "status": "cancelled",
            "updated_at": datetime.now().isoformat()
        }).eq("id", sale_id).eq("owner_id", owner_id).execute()
        
        if result.data:
            return success_response(message="Sale deleted successfully")
        else:
            return error_response("DELETE_FAILED", "Failed to delete sale", 400)
        
    except Exception as e:
        logger.error(f"Delete sale error: {str(e)}")
        return internal_server_error_response(f"Failed to delete sale: {str(e)}")

@sales_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_sales_summary():
    """Get sales summary statistics"""
    try:
        supabase = get_supabase()
        if not supabase:
            return internal_server_error_response("Database connection not available")
        
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response("AUTHORIZATION_ERROR", str(e), 403)
        
        # Get date range from query parameters
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        filters = {}
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date
        
        sales_service = SalesService(supabase)
        result = sales_service.get_sales_with_filters(owner_id, filters)
        
        return success_response(
            data=result["summary"],
            message="Sales summary retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Get sales summary error: {str(e)}")
        return internal_server_error_response(f"Failed to get sales summary: {str(e)}")