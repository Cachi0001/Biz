from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

search_bp = Blueprint('search', __name__)
logger = logging.getLogger(__name__)

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
    logger.error(f"[SEARCH API ERROR] Status: {status_code}, Message: {message}, Error: {error}")
    return jsonify({
        "success": False,
        "error": str(error),
        "message": message
    }), status_code

@search_bp.route('', methods=['GET'])
@jwt_required()
def global_search():
    """
    Global search across customers, products, invoices, transactions, and expenses
    """
    try:
        supabase = get_supabase()
        current_user_id = get_jwt_identity()
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 5))
        
        if not query:
            return success_response(
                data={
                    'customers': [],
                    'products': [],
                    'invoices': [],
                    'transactions': [],
                    'expenses': []
                }
            )
        
        # Search customers
        logger.debug(f"Searching customers for query: {query}")
        customers_response = supabase.table('customers').select('*').or_(
            f'name.ilike.%{query}%,email.ilike.%{query}%,phone.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logger.debug(f"Customers search response: {customers_response.data}")
        customers = customers_response.data if customers_response.data else []
        
        # Search products
        logger.debug(f"Searching products for query: {query}")
        products_response = supabase.table('products').select('*').or_(
            f'name.ilike.%{query}%,description.ilike.%{query}%,sku.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).eq('active', True).limit(limit).execute()
        logger.debug(f"Products search response: {products_response.data}")
        products = products_response.data if products_response.data else []
        
        # Search invoices
        logger.debug(f"Searching invoices for query: {query}")
        invoices_response = supabase.table('invoices').select('*').or_(
            f'invoice_number.ilike.%{query}%,customer_name.ilike.%{query}%,status.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logger.debug(f"Invoices search response: {invoices_response.data}")
        invoices = invoices_response.data if invoices_response.data else []
        
        # Search transactions
        logger.debug(f"Searching transactions for query: {query}")
        transactions_response = supabase.table('transactions').select('*').or_(
            f'description.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logger.debug(f"Transactions search response: {transactions_response.data}")
        transactions = transactions_response.data if transactions_response.data else []
        
        # Search expenses
        logger.debug(f"Searching expenses for query: {query}")
        expenses_response = supabase.table('expenses').select('*').or_(
            f'description.ilike.%{query}%,category.ilike.%{query}%'
        ).eq('owner_id', current_user_id).limit(limit).execute()
        logger.debug(f"Expenses search response: {expenses_response.data}")
        expenses = expenses_response.data if expenses_response.data else []
        
        return success_response(
            data={
                'customers': customers,
                'products': products,
                'invoices': invoices,
                'transactions': transactions,
                'expenses': expenses
            }
        )
        
    except Exception as e:
        logger.error(f"Global search error: {str(e)}")
        return error_response("Failed to perform search", status_code=500)

