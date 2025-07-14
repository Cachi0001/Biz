from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.supabase_service import supabase
import logging

search_bp = Blueprint('search', __name__)

@search_bp.route('/search', methods=['GET'])
@jwt_required()
def global_search():
    """
    Global search across customers, products, invoices, transactions, and expenses
    """
    try:
        current_user_id = get_jwt_identity()
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 5))
        
        if not query:
            return jsonify({
                'success': True,
                'data': {
                    'customers': [],
                    'products': [],
                    'invoices': [],
                    'transactions': [],
                    'expenses': []
                }
            }), 200
        
        # Search customers
        customers_response = supabase.table('customers').select('*').or_(
            f'name.ilike.%{query}%,email.ilike.%{query}%,phone.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        
        customers = customers_response.data if customers_response.data else []
        
        # Search products
        products_response = supabase.table('products').select('*').or_(
            f'name.ilike.%{query}%,description.ilike.%{query}%,sku.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).eq('active', True).limit(limit).execute()
        
        products = products_response.data if products_response.data else []
        
        # Search invoices
        invoices_response = supabase.table('invoices').select('*').or_(
            f'invoice_number.ilike.%{query}%,customer_name.ilike.%{query}%,status.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        
        invoices = invoices_response.data if invoices_response.data else []
        
        # Search transactions
        transactions_response = supabase.table('transactions').select('*').or_(
            f'description.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        
        transactions = transactions_response.data if transactions_response.data else []
        
        # Search expenses
        expenses_response = supabase.table('expenses').select('*').or_(
            f'description.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        
        expenses = expenses_response.data if expenses_response.data else []
        
        return jsonify({
            'success': True,
            'data': {
                'customers': customers,
                'products': products,
                'invoices': invoices,
                'transactions': transactions,
                'expenses': expenses
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Global search error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to perform search'
        }), 500

