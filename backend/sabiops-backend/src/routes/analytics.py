from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services.supabase_service import get_supabase
from src.utils.user_context import get_user_context
import logging

logger = logging.getLogger(__name__)

analytics_bp = Blueprint("analytics", __name__)

def success_response(data=None, message="Success", status_code=200):
    """Standard success response format"""
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    """Standard error response format"""
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@analytics_bp.route("/chart-data", methods=["GET"])
@jwt_required()
def get_chart_data():
    """Get analytics data for charts including revenue and expenses"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        supabase = get_supabase()
        period_days = request.args.get('period_days', 30, type=int)
        
        # Call the database function to get analytics data
        result = supabase.rpc('get_analytics_data', {
            'user_id': owner_id,
            'period_days': period_days
        }).execute()
        
        if result.data:
            analytics_data = result.data
            return success_response(
                data={
                    "revenue": analytics_data.get('revenue', []),
                    "expenses": analytics_data.get('expenses', []),
                    "period_days": period_days
                },
                message="Analytics data retrieved successfully"
            )
        else:
            # Fallback to manual queries if function doesn't exist
            return get_chart_data_fallback(owner_id, period_days)
            
    except Exception as e:
        logger.error(f"Error getting chart data: {str(e)}")
        return error_response(str(e), "Failed to get chart data", 500)

@analytics_bp.route("/revenue-expenses", methods=["GET"])
@jwt_required()
def get_revenue_expenses_chart():
    """Get revenue vs expenses chart data for advanced analytics"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        supabase = get_supabase()
        period = request.args.get('period', 'monthly')
        
        # Get time range based on period
        from datetime import datetime, timedelta
        now = datetime.now()
        
        if period == 'daily':
            start_date = now - timedelta(days=30)
            date_format = '%Y-%m-%d'
        elif period == 'weekly':
            start_date = now - timedelta(weeks=12)
            date_format = '%Y-W%U'
        elif period == 'yearly':
            start_date = now - timedelta(days=365*3)
            date_format = '%Y'
        else:  # monthly
            start_date = now - timedelta(days=365)
            date_format = '%Y-%m'
        
        # Get sales data (revenue)
        sales_result = supabase.table('sales').select(
            'total_amount, date'
        ).eq('owner_id', owner_id).gte('date', start_date.isoformat()).execute()
        
        # Get expenses data
        expenses_result = supabase.table('expenses').select(
            'amount, date'
        ).eq('owner_id', owner_id).gte('date', start_date.isoformat()).execute()
        
        # Group data by time period
        revenue_by_period = {}
        expenses_by_period = {}
        
        # Process sales data
        for sale in sales_result.data or []:
            sale_date = datetime.fromisoformat(sale['date'].replace('Z', '+00:00'))
            if period == 'weekly':
                week_start = sale_date - timedelta(days=sale_date.weekday())
                period_key = week_start.strftime('%b %d')
            elif period == 'daily':
                period_key = sale_date.strftime('%b %d')
            elif period == 'yearly':
                period_key = sale_date.strftime('%Y')
            else:  # monthly
                period_key = sale_date.strftime('%b %Y')
            
            revenue_by_period[period_key] = revenue_by_period.get(period_key, 0) + float(sale.get('total_amount', 0))
        
        # Process expenses data
        for expense in expenses_result.data or []:
            expense_date = datetime.fromisoformat(expense['date'].replace('Z', '+00:00'))
            if period == 'weekly':
                week_start = expense_date - timedelta(days=expense_date.weekday())
                period_key = week_start.strftime('%b %d')
            elif period == 'daily':
                period_key = expense_date.strftime('%b %d')
            elif period == 'yearly':
                period_key = expense_date.strftime('%Y')
            else:  # monthly
                period_key = expense_date.strftime('%b %Y')
            
            expenses_by_period[period_key] = expenses_by_period.get(period_key, 0) + float(expense.get('amount', 0))
        
        # Create combined chart data
        all_periods = set(list(revenue_by_period.keys()) + list(expenses_by_period.keys()))
        chart_data = []
        
        for period_key in sorted(all_periods):
            chart_data.append({
                'period': period_key,
                'revenue': revenue_by_period.get(period_key, 0),
                'expenses': expenses_by_period.get(period_key, 0)
            })
        
        return success_response(
            data={
                'trends': chart_data,
                'period': period,
                'summary': {
                    'total_revenue': sum(revenue_by_period.values()),
                    'total_expenses': sum(expenses_by_period.values()),
                    'net_profit': sum(revenue_by_period.values()) - sum(expenses_by_period.values())
                }
            },
            message="Revenue vs expenses data retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting revenue vs expenses data: {str(e)}")
        return error_response(str(e), "Failed to get revenue vs expenses data", 500)

def get_chart_data_fallback(owner_id, period_days=30):
    """Fallback method to get chart data using direct queries"""
    try:
        supabase = get_supabase()
        
        # Get revenue data (sales + paid invoices)
        from datetime import datetime, timedelta
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()
        
        # Sales revenue
        sales_result = supabase.table('sales').select('created_at, total_amount').eq('owner_id', owner_id).gte('created_at', start_date).execute()
        
        # Invoice revenue (paid invoices only)
        invoices_result = supabase.table('invoices').select('paid_at, total_amount').eq('owner_id', owner_id).eq('status', 'paid').gte('paid_at', start_date).execute()
        
        # Expenses
        expenses_result = supabase.table('expenses').select('created_at, amount').eq('owner_id', owner_id).gte('created_at', start_date).execute()
        
        # Process revenue data
        revenue_by_day = {}
        
        # Add sales
        for sale in sales_result.data:
            day = sale['created_at'][:10]  # Get date part
            revenue_by_day[day] = revenue_by_day.get(day, 0) + float(sale.get('total_amount', 0))
        
        # Add paid invoices
        for invoice in invoices_result.data:
            if invoice.get('paid_at'):
                day = invoice['paid_at'][:10]  # Get date part
                revenue_by_day[day] = revenue_by_day.get(day, 0) + float(invoice.get('total_amount', 0))
        
        # Process expense data
        expense_by_day = {}
        for expense in expenses_result.data:
            day = expense['created_at'][:10]  # Get date part
            expense_by_day[day] = expense_by_day.get(day, 0) + float(expense.get('amount', 0))
        
        # Convert to chart format
        revenue_data = [
            {"label": day, "value": amount}
            for day, amount in sorted(revenue_by_day.items())
        ]
        
        expense_data = [
            {"label": day, "value": amount}
            for day, amount in sorted(expense_by_day.items())
        ]
        
        return success_response(
            data={
                "revenue": revenue_data,
                "expenses": expense_data,
                "period_days": period_days
            },
            message="Analytics data retrieved successfully (fallback)"
        )
        
    except Exception as e:
        logger.error(f"Error in fallback chart data: {str(e)}")
        return error_response(str(e), "Failed to get chart data", 500)