from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services.supabase_service import supabase_instance
import logging

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['GET'])
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
        logging.debug(f"Searching customers for query: {query}")
        customers_response = supabase_instance.client.table('customers').select('*').or_(
            f'name.ilike.%{query}%,email.ilike.%{query}%,phone.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logging.debug(f"Customers search response: {customers_response.data}")
        customers = customers_response.data if customers_response.data else []
        
        # Search products
        logging.debug(f"Searching products for query: {query}")
        products_response = supabase_instance.client.table('products').select('*').or_(
            f'name.ilike.%{query}%,description.ilike.%{query}%,sku.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).eq('active', True).limit(limit).execute()
        logging.debug(f"Products search response: {products_response.data}")
        products = products_response.data if products_response.data else []
        
        # Search invoices
        logging.debug(f"Searching invoices for query: {query}")
        invoices_response = supabase_instance.client.table('invoices').select('*').or_(
            f'invoice_number.ilike.%{query}%,customer_name.ilike.%{query}%,status.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logging.debug(f"Invoices search response: {invoices_response.data}")
        invoices = invoices_response.data if invoices_response.data else []
        
        # Search transactions
        logging.debug(f"Searching transactions for query: {query}")
        transactions_response = supabase_instance.client.table('transactions').select('*').or_(
            f'description.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logging.debug(f"Transactions search response: {transactions_response.data}")
        transactions = transactions_response.data if transactions_response.data else []
        
        # Search expenses
        logging.debug(f"Searching expenses for query: {query}")
        expenses_response = supabase_instance.client.table('expenses').select('*').or_(
            f'description.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logging.debug(f"Expenses search response: {expenses_response.data}")
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

