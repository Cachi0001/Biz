from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import pytz
from src.utils.user_context import get_user_context

transactions_bp = Blueprint('transactions', __name__)

def get_supabase():
    """Get Supabase client from app config"""
    return current_app.config.get('SUPABASE')

def get_team_members(supabase, owner_id, user_role, user_id):
    """Get list of team members for role-based filtering"""
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

def parse_supabase_datetime(datetime_str):
    """Parse datetime string from Supabase to datetime object"""
    if not datetime_str:
        return None
    try:
        # Try parsing with timezone
        return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
    except (ValueError, AttributeError) as e:
        current_app.logger.warning(f"Error parsing datetime '{datetime_str}': {e}")
        return None

@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    """
    Get transactions with role-based filtering
    Query params:
    - team_member_id: Filter by specific team member (optional)
    - start_date: Filter transactions after this date (optional)
    - end_date: Filter transactions before this date (optional)
    - type: Filter by transaction type (income/expense) (optional)
    - category: Filter by category (optional)
    - payment_method: Filter by payment method (optional)
    """
    try:
        user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(user_id)
        supabase = get_supabase()
        
        if not supabase:
            return jsonify({"error": "Database connection not available"}), 500

        # Get team members for role-based filtering
        team_members = get_team_members(supabase, owner_id, user_role, user_id)
        team_member_ids = [str(member['id']) for member in team_members]
        
        # Get query parameters
        team_member_id = request.args.get('team_member_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        transaction_type = request.args.get('type')
        category = request.args.get('category')
        payment_method = request.args.get('payment_method')

        # Validate team member access
        if team_member_id and team_member_id != 'all':
            if team_member_id not in team_member_ids:
                return jsonify({"error": "Unauthorized access to this team member"}), 403
            team_member_ids = [team_member_id]

        # Base query for transactions
        query = supabase.table('transactions')\
            .select('*')\
            .eq('owner_id', owner_id)\
            .order('created_at', desc=True)

        # Apply role-based filtering
        if user_role != 'Owner':
            query = query.in_('user_id', team_member_ids)

        # Apply filters
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
                query = query.gte('created_at', start.isoformat())
            except ValueError:
                return jsonify({"error": "Invalid start_date format. Use ISO format (YYYY-MM-DD)"}), 400

        if end_date:
            try:
                end = datetime.fromisoformat(end_date) + timedelta(days=1)  # Include the entire end day
                query = query.lte('created_at', end.isoformat())
            except ValueError:
                return jsonify({"error": "Invalid end_date format. Use ISO format (YYYY-MM-DD)"}), 400

        if transaction_type and transaction_type in ['income', 'expense']:
            query = query.eq('type', transaction_type)

        if category:
            query = query.eq('category', category)

        if payment_method:
            query = query.eq('payment_method', payment_method)

        # Execute query
        result = query.execute()
        
        # Process and format the response
        transactions = result.data or []
        
        return jsonify({
            "success": True,
            "data": {
                "transactions": transactions,
                "team_members": team_members,
                "current_user_role": user_role
            }
        })

    except Exception as e:
        current_app.logger.error(f"Error in get_transactions: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to fetch transactions"}), 500
