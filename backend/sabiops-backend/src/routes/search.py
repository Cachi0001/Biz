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

@search_bp.route('/test', methods=['GET'], strict_slashes=False)
@jwt_required(optional=True)
def search_test():
    """Test endpoint to verify search blueprint is working"""
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'message': 'Search blueprint is working', 'status': 'ok', 'authenticated': False})
    
    try:
        # Get user info
        user_response = supabase.table('users').select('role, owner_id').eq('id', user_id).single().execute()
        if not user_response.data:
            return jsonify({'error': 'User not found'}), 404
        
        owner_id = user_response.data['owner_id'] or user_id
        
        # Count products and customers
        products_count = len(supabase.table('products').select('id').eq('owner_id', owner_id).execute().data or [])
        customers_count = len(supabase.table('customers').select('id').eq('owner_id', owner_id).execute().data or [])
        
        return jsonify({
            'message': 'Search blueprint is working', 
            'status': 'ok',
            'authenticated': True,
            'user_id': user_id,
            'owner_id': owner_id,
            'products_count': products_count,
            'customers_count': customers_count
        })
    except Exception as e:
        return jsonify({
            'message': 'Search blueprint is working', 
            'status': 'ok',
            'authenticated': True,
            'error': str(e)
        })

@search_bp.route('/', methods=['GET', 'OPTIONS'], strict_slashes=False)
@jwt_required(optional=True)
def global_search():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
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
        
        logger.info(f"Search request - user_id: {user_id}, owner_id: {owner_id}, role: {user_role}, query: {query}")
        
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
        # Search customers using multiple queries since or_ might not be available
        logger.info(f"Searching customers with query: {query}, owner_id: {owner_id}")
        
        results = []
        search_pattern = f'%{query}%'
        
        # Search by name
        name_results = supabase.table('customers')\
            .select('id, name, email, phone, address, created_at')\
            .eq('owner_id', owner_id)\
            .ilike('name', search_pattern)\
            .limit(limit)\
            .execute()
        
        if name_results.data:
            results.extend(name_results.data)
        
        # Search by email (if not already found by name)
        if len(results) < limit:
            email_results = supabase.table('customers')\
                .select('id, name, email, phone, address, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('email', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if email_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in email_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        # Search by phone (if not already found)
        if len(results) < limit:
            phone_results = supabase.table('customers')\
                .select('id, name, email, phone, address, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('phone', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if phone_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in phone_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        response = type('Response', (), {'data': results[:limit]})()  # Mock response object
        
        logger.info(f"Customer search response: {len(response.data or [])} results")
        return response.data or []
        
    except Exception as e:
        logger.error(f"Customer search error: {str(e)}")
        return []

def search_products(query, owner_id, user_role, limit):
    """Search products with role-based filtering"""
    try:
        # Search products using multiple queries
        logger.info(f"Searching products with query: {query}, owner_id: {owner_id}")
        
        results = []
        search_pattern = f'%{query}%'
        
        # Search by name
        name_results = supabase.table('products')\
            .select('id, name, description, sku, price, quantity, category, created_at')\
            .eq('owner_id', owner_id)\
            .ilike('name', search_pattern)\
            .limit(limit)\
            .execute()
        
        if name_results.data:
            results.extend(name_results.data)
        
        # Search by description (if not already found by name)
        if len(results) < limit:
            desc_results = supabase.table('products')\
                .select('id, name, description, sku, price, quantity, category, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('description', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if desc_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in desc_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        # Search by SKU (if not already found)
        if len(results) < limit and query:  # Only search SKU if query is not empty
            sku_results = supabase.table('products')\
                .select('id, name, description, sku, price, quantity, category, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('sku', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if sku_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in sku_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        response = type('Response', (), {'data': results[:limit]})()  # Mock response object
        
        logger.info(f"Product search response: {len(response.data or [])} results")
        return response.data or []
        
    except Exception as e:
        logger.error(f"Product search error: {str(e)}")
        return []

def search_invoices(query, owner_id, user_role, limit):
    """Search invoices with role-based filtering"""
    try:
        # Search invoices using multiple queries
        logger.info(f"Searching invoices with query: {query}, owner_id: {owner_id}")
        
        results = []
        search_pattern = f'%{query}%'
        
        # Search by invoice number
        invoice_results = supabase.table('invoices')\
            .select('id, invoice_number, customer_name, total_amount, status, due_date, created_at')\
            .eq('owner_id', owner_id)\
            .ilike('invoice_number', search_pattern)\
            .limit(limit)\
            .execute()
        
        if invoice_results.data:
            results.extend(invoice_results.data)
        
        # Search by customer name (if not already found)
        if len(results) < limit:
            customer_results = supabase.table('invoices')\
                .select('id, invoice_number, customer_name, total_amount, status, due_date, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('customer_name', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if customer_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in customer_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        # Search by status (if not already found)
        if len(results) < limit:
            status_results = supabase.table('invoices')\
                .select('id, invoice_number, customer_name, total_amount, status, due_date, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('status', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if status_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in status_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        response = type('Response', (), {'data': results[:limit]})()  # Mock response object
        return response.data or []
        
    except Exception as e:
        logger.error(f"Invoice search error: {str(e)}")
        return []

def search_expenses(query, owner_id, user_role, limit):
    """Search expenses (owners and admins only)"""
    try:
        # Search expenses using multiple queries
        logger.info(f"Searching expenses with query: {query}, owner_id: {owner_id}")
        
        results = []
        search_pattern = f'%{query}%'
        
        # Search by description
        desc_results = supabase.table('expenses')\
            .select('id, description, amount, category, date, payment_method, created_at')\
            .eq('owner_id', owner_id)\
            .ilike('description', search_pattern)\
            .limit(limit)\
            .execute()
        
        if desc_results.data:
            results.extend(desc_results.data)
        
        # Search by category (if not already found)
        if len(results) < limit:
            category_results = supabase.table('expenses')\
                .select('id, description, amount, category, date, payment_method, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('category', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if category_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in category_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        # Search by payment method (if not already found)
        if len(results) < limit:
            payment_results = supabase.table('expenses')\
                .select('id, description, amount, category, date, payment_method, created_at')\
                .eq('owner_id', owner_id)\
                .ilike('payment_method', search_pattern)\
                .limit(limit - len(results))\
                .execute()
            
            if payment_results.data:
                # Avoid duplicates
                existing_ids = {r['id'] for r in results}
                for result in payment_results.data:
                    if result['id'] not in existing_ids:
                        results.append(result)
        
        response = type('Response', (), {'data': results[:limit]})()  # Mock response object
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

@search_bp.route('/suggestions', methods=['GET', 'OPTIONS'], strict_slashes=False)
@jwt_required(optional=True)
def search_suggestions():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check if user is authenticated for GET requests
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    """Get search suggestions based on user's data"""
    try:
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

@search_bp.route('/recent', methods=['GET', 'OPTIONS'], strict_slashes=False)
@jwt_required(optional=True)
def recent_searches():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check if user is authenticated for GET requests
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    """Get user's recent searches"""
    try:
        
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

