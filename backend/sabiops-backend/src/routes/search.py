from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.utils.user_context import get_user_context
import logging

search_bp = Blueprint('search', __name__)
logger = logging.getLogger(__name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

def success_response(data=None, message="Search completed successfully", status_code=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    }), status_code

def error_response(error, message="Error performing search", status_code=400):
    logger.error(f"[SEARCH ERROR] {message}: {str(error)}", exc_info=True)
    return jsonify({
        "success": False,
        "message": message,
        "error": str(error)
    }), status_code

@search_bp.route('', methods=['GET'])
@jwt_required()
def global_search():
    """
    Global search across customers, products, invoices, transactions, and expenses
    with role-based access control and team member filtering
    """
    try:
        current_user_id = get_jwt_identity()
        owner_id, user_role = get_user_context(current_user_id)
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", "Database error", 500)
        
        # Get search parameters
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 5))
        team_member_id = request.args.get('team_member_id')
        
        # Get team members for role-based filtering
        from .dashboard import get_team_members
        team_members = get_team_members(supabase, owner_id, user_role, current_user_id)
        team_member_ids = [str(member['id']) for member in team_members]
        
        # If specific team member is requested, validate access
        if team_member_id and team_member_id != 'all':
            if team_member_id not in team_member_ids:
                return error_response("Unauthorized access to this team member", "Access denied", 403)
            team_member_ids = [team_member_id]
        
        if not query:
            return success_response(
                data={
                    'customers': [],
                    'products': [],
                    'invoices': [],
                    'transactions': [],
                    'expenses': [],
                    'team_members': team_members,
                    'current_user_role': user_role
                }
            )
        
        # Helper function to apply role-based filtering
        def apply_role_filter(query_builder, table_name):
            """Apply role-based filtering to queries"""
            if user_role != 'Owner':
                if table_name in ['customers', 'invoices', 'sales']:
                    return query_builder.in_('salesperson_id', team_member_ids)
                elif table_name == 'expenses':
                    return query_builder.in_('user_id', team_member_ids)
            return query_builder
        
        search_results = {}
        
        try:
            # Search customers with role-based filtering
            logger.debug(f"Searching customers for: {query}")
            customers_query = supabase.table('customers')\
                .select('*')\
                .or_(f'name.ilike.%{query}%,email.ilike.%{query}%,phone.ilike.%{query}%,company_name.ilike.%{query}%')\
                .eq('owner_id', owner_id)\
                .limit(limit)
                
            customers_query = apply_role_filter(customers_query, 'customers')
            customers_result = customers_query.execute()
            search_results['customers'] = customers_result.data or []
            
            # Search products (all roles can see products)
            logger.debug(f"Searching products for: {query}")
            products_result = supabase.table('products')\
                .select('*')\
                .or_(f'name.ilike.%{query}%,description.ilike.%{query}%,sku.ilike.%{query}%,category.ilike.%{query}%')\
                .eq('owner_id', owner_id)\
                .eq('active', True)\
                .limit(limit)\
                .execute()
            search_results['products'] = products_result.data or []
            
            # Search invoices with role-based filtering
            logger.debug(f"Searching invoices for: {query}")
            invoices_query = supabase.table('invoices')\
                .select('*')\
                .or_(f'invoice_number.ilike.%{query}%,customer_name.ilike.%{query}%,status.ilike.%{query}%')\
                .eq('owner_id', owner_id)\
                .limit(limit)
                
            invoices_query = apply_role_filter(invoices_query, 'invoices')
            invoices_result = invoices_query.execute()
            search_results['invoices'] = invoices_result.data or []
            
            # Search transactions with role-based filtering
            logger.debug(f"Searching transactions for: {query}")
            transactions_query = supabase.table('transactions')\
                .select('*')\
                .or_(f'description.ilike.%{query}%,category.ilike.%{query}%,reference.ilike.%{query}%')\
                .eq('owner_id', owner_id)\
                .limit(limit)
                
            transactions_query = apply_role_filter(transactions_query, 'transactions')
            transactions_result = transactions_query.execute()
            search_results['transactions'] = transactions_result.data or []
            
            # Search expenses (owners and admins only) with role-based filtering
            search_results['expenses'] = []
            if user_role in ['Owner', 'Admin']:
                logger.debug(f"Searching expenses for: {query}")
                expenses_query = supabase.table('expenses')\
                    .select('*')\
                    .or_(f'description.ilike.%{query}%,category.ilike.%{query}%,reference.ilike.%{query}%')\
                    .eq('owner_id', owner_id)\
                    .limit(limit)
                    
                expenses_query = apply_role_filter(expenses_query, 'expenses')
                expenses_result = expenses_query.execute()
                search_results['expenses'] = expenses_result.data or []
            
            # Add metadata to response
            search_results['team_members'] = team_members
            search_results['current_user_role'] = user_role
            
            # Log the search for analytics
            try:
                log_activity(
                    supabase=supabase,
                    user_id=current_user_id,
                    activity_type='search',
                    entity_type='global',
                    details={'query': query, 'results_count': sum(len(v) for v in search_results.values())},
                    owner_id=owner_id,
                    user_role=user_role
                )
            except Exception as e:
                logger.error(f"Failed to log search activity: {str(e)}", exc_info=True)
            
            return success_response(data=search_results)
            
        except Exception as e:
            logger.error(f"Error during search execution: {str(e)}", exc_info=True)
            return error_response(e, "Error executing search query", 500)
            
    except Exception as e:
        logger.error(f"Unexpected error in global_search: {str(e)}", exc_info=True)
        return error_response(e, "An unexpected error occurred", 500)

def log_activity(supabase, user_id, activity_type, entity_type, details, owner_id, user_role):
    """Log user activity for analytics"""
    try:
        activity_data = {
            'user_id': user_id,
            'activity_type': activity_type,
            'entity_type': entity_type,
            'details': details,
            'owner_id': owner_id,
            'role': user_role,
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', '')
        }
        
        result = supabase.table('activities').insert(activity_data).execute()
        if hasattr(result, 'error') and result.error:
            logger.error(f"Failed to log activity: {result.error}")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error in log_activity: {str(e)}", exc_info=True)
        return False
