from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from supabase import create_client
import os
from datetime import datetime
import logging

try:
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
except Exception as e:
    logging.error(f"Failed to initialize Supabase client in search route: {e}")
    supabase = None

search_bp = Blueprint('search', __name__)
logger = logging.getLogger(__name__)

@search_bp.route('/test', methods=['GET'])
def search_test():
    """Test endpoint to verify search blueprint is working"""
    return jsonify({'message': 'Search blueprint is working', 'status': 'ok'})

@search_bp.route('/', methods=['GET', 'OPTIONS'])
def global_search():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    # Apply JWT requirement only for GET requests
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
            
        user_id = get_jwt_identity()
        query = request.args.get('q', '').strip()
        search_type = request.args.get('type', 'all')
        limit = int(request.args.get('limit', 10))
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        if len(query) < 2:
            return jsonify({'error': 'Search query must be at least 2 characters'}), 400
        
        # Get user role for filtering
        user_response = supabase.table('users').select('role, owner_id').eq('id', user_id).single().execute()
        if not user_response.data:
            return jsonify({'error': 'User not found'}), 404
        
        user_role = user_response.data['role']
        owner_id = user_response.data['owner_id'] or user_id
        
        results = {}
        
        # Search customers
        if search_type in ['all', 'customers']:
            results['customers'] = search_customers(query, owner_id, user_role, limit)
        
        # Search products
        if search_type in ['all', 'products']:
            results['products'] = search_products(query, owner_id, user_role, limit)
        
        # Search invoices
        if search_type in ['all', 'invoices']:
            results['invoices'] = search_invoices(query, owner_id, user_role, limit)
        
        # Search expenses (owners and admins only)
        if search_type in ['all', 'expenses'] and user_role in ['owner', 'admin']:
            results['expenses'] = search_expenses(query, owner_id, user_role, limit)
        
        # Log search activity
        log_search_activity(user_id, query, search_type, len(results))
        
        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'total_results': sum(len(v) for v in results.values())
        })
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': 'Search failed'}), 500

def search_customers(query, owner_id, user_role, limit):
    """Search customers with role-based filtering"""
    try:
        # Build search query with OR conditions using proper Supabase syntax
        search_condition = f'name.ilike.%{query}%,email.ilike.%{query}%,phone.ilike.%{query}%,address.ilike.%{query}%'
        response = supabase.table('customers')\
            .select('id, name, email, phone, address, created_at')\
            .eq('owner_id', owner_id)\
            .or_(search_condition)\
            .limit(limit)\
            .execute()
        return response.data or []
        
    except Exception as e:
        logger.error(f"Customer search error: {str(e)}")
        return []

def search_products(query, owner_id, user_role, limit):
    """Search products with role-based filtering"""
    try:
        # Build search query with OR conditions using proper Supabase syntax
        search_condition = f'name.ilike.%{query}%,description.ilike.%{query}%,sku.ilike.%{query}%'
        response = supabase.table('products')\
            .select('id, name, description, sku, price, quantity, category, created_at')\
            .eq('owner_id', owner_id)\
            .or_(search_condition)\
            .limit(limit)\
            .execute()
        return response.data or []
        
    except Exception as e:
        logger.error(f"Product search error: {str(e)}")
        return []

def search_invoices(query, owner_id, user_role, limit):
    """Search invoices with role-based filtering"""
    try:
        # Build search query with OR conditions using proper Supabase syntax
        search_condition = f'invoice_number.ilike.%{query}%,customer_name.ilike.%{query}%,status.ilike.%{query}%'
        response = supabase.table('invoices')\
            .select('id, invoice_number, customer_name, total_amount, status, due_date, created_at')\
            .eq('owner_id', owner_id)\
            .or_(search_condition)\
            .limit(limit)\
            .execute()
        return response.data or []
        
    except Exception as e:
        logger.error(f"Invoice search error: {str(e)}")
        return []

def search_expenses(query, owner_id, user_role, limit):
    """Search expenses (owners and admins only)"""
    try:
        # Build search query with OR conditions using proper Supabase syntax
        search_condition = f'description.ilike.%{query}%,category.ilike.%{query}%,payment_method.ilike.%{query}%'
        response = supabase.table('expenses')\
            .select('id, description, amount, category, date, payment_method, created_at')\
            .eq('owner_id', owner_id)\
            .or_(search_condition)\
            .limit(limit)\
            .execute()
        return response.data or []
        
    except Exception as e:
        logger.error(f"Expense search error: {str(e)}")
        return []

def log_search_activity(user_id, query, search_type, result_count):
    """Log search activity for analytics (optional - fails gracefully if table doesn't exist)"""
    try:
        # Try to log search activity - fail gracefully if search_logs table doesn't exist
        supabase.table('search_logs').insert({
            'user_id': user_id,
            'query': query,
            'search_type': search_type,
            'result_count': result_count,
            'created_at': datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Search logging error: {str(e)}")

@search_bp.route('/suggestions', methods=['GET', 'OPTIONS'])
def search_suggestions():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    # Apply JWT requirement only for GET requests
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': 'Authentication required'}), 401
    """Get search suggestions based on user's data"""
    try:
        user_id = get_jwt_identity()
        query = request.args.get('q', '').strip()
        
        if len(query) < 2:
            return jsonify({'suggestions': []})
        
        # Get user's owner_id
        user_response = supabase.table('users').select('owner_id').eq('id', user_id).single().execute()
        owner_id = user_response.data['owner_id'] or user_id
        
        suggestions = []
        
        # Get customer name suggestions
        customer_response = supabase.table('customers').select('name').eq('owner_id', owner_id).ilike('name', f'%{query}%').limit(5).execute()
        for customer in customer_response.data or []:
            suggestions.append({
                'text': customer['name'],
                'type': 'customer',
                'category': 'Customers'
            })
        
        # Get product name suggestions
        product_response = supabase.table('products').select('name').eq('owner_id', owner_id).ilike('name', f'%{query}%').limit(5).execute()
        for product in product_response.data or []:
            suggestions.append({
                'text': product['name'],
                'type': 'product',
                'category': 'Products'
            })
        
        return jsonify({'suggestions': suggestions[:10]})
        
    except Exception as e:
        logger.error(f"Search suggestions error: {str(e)}")
        return jsonify({'suggestions': []})

@search_bp.route('/recent', methods=['GET', 'OPTIONS'])
def recent_searches():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    # Apply JWT requirement only for GET requests
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': 'Authentication required'}), 401
    """Get user's recent searches"""
    try:
        user_id = get_jwt_identity()
        
        response = supabase.table('search_logs').select(
            'query, search_type, created_at'
        ).eq('user_id', user_id).order('created_at', desc=True).limit(10).execute()
        
        # Remove duplicates while preserving order
        seen = set()
        recent = []
        for search in response.data or []:
            if search['query'] not in seen:
                seen.add(search['query'])
                recent.append(search)
        
        return jsonify({'recent_searches': recent[:5]})
        
    except Exception as e:
        logger.error(f"Recent searches error: {str(e)}")
        return jsonify({'recent_searches': []})

