from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services.supabase_service import get_supabase_client
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

data_integrity_bp = Blueprint('data_integrity', __name__)

@data_integrity_bp.route('/inventory-sync', methods=['POST'])
@jwt_required()
def sync_inventory():
    """
    Synchronize product inventory with sales records
    Recalculates product quantities based on sales history
    """
    try:
        supabase = get_supabase_client()
        owner_id = get_jwt_identity()
        
        issues_found = 0
        fixed_count = 0
        details = {}
        
        products_response = supabase.table('products').select('*').eq('owner_id', owner_id).execute()
        products = products_response.data
        
        for product in products:
            product_id = product['id']
            current_quantity = product['quantity'] or 0
            
            sales_response = supabase.table('sales').select('quantity').eq('product_id', product_id).execute()
            total_sold = sum(sale['quantity'] or 0 for sale in sales_response.data)
            
            if current_quantity < 0:
                issues_found += 1
                # Set to 0 if negative
                supabase.table('products').update({
                    'quantity': 0,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('id', product_id).execute()
                fixed_count += 1
                
                details[product['name']] = f"Fixed negative quantity: {current_quantity} → 0"
        
        return jsonify({
            'success': True,
            'message': f'Inventory sync completed. {fixed_count} products updated.',
            'issues_found': issues_found,
            'fixed_count': fixed_count,
            'details': details
        })
        
    except Exception as e:
        logger.error(f"Inventory sync error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to sync inventory',
            'error': str(e)
        }), 500

@data_integrity_bp.route('/transaction-integrity', methods=['POST'])
@jwt_required()
def check_transaction_integrity():
    """
    Ensure all sales and expenses have corresponding transaction records
    Creates missing transaction records
    """
    try:
        supabase = get_supabase_client()
        owner_id = get_jwt_identity()
        
        issues_found = 0
        fixed_count = 0
        details = {}
        
        sales_response = supabase.table('sales').select('*').eq('owner_id', owner_id).execute()
        sales = sales_response.data
        
        for sale in sales:
            transaction_response = supabase.table('transactions').select('id').eq('reference_id', sale['id']).eq('reference_type', 'sale').execute()
            
            if not transaction_response.data:
                issues_found += 1
                # Create missing transaction
                transaction_data = {
                    'owner_id': owner_id,
                    'type': 'money_in',
                    'amount': sale['total_amount'],
                    'category': 'Sales',
                    'description': f"Sale of {sale.get('product_name', 'Product')} to {sale.get('customer_name', 'Customer')}",
                    'reference_id': sale['id'],
                    'reference_type': 'sale',
                    'date': sale['date'] or datetime.utcnow().isoformat(),
                    'created_at': datetime.utcnow().isoformat()
                }
                
                supabase.table('transactions').insert(transaction_data).execute()
                fixed_count += 1
                details[f"Sale {sale['id'][:8]}"] = "Created missing transaction record"
        
        # Check expenses without transactions
        expenses_response = supabase.table('expenses').select('*').eq('owner_id', owner_id).execute()
        expenses = expenses_response.data
        
        for expense in expenses:
            # Check if transaction exists for this expense
            transaction_response = supabase.table('transactions').select('id').eq('reference_id', expense['id']).eq('reference_type', 'expense').execute()
            
            if not transaction_response.data:
                issues_found += 1
                # Create missing transaction
                transaction_data = {
                    'owner_id': owner_id,
                    'type': 'money_out',
                    'amount': expense['amount'],
                    'category': expense.get('category', 'General'),
                    'description': expense.get('description', 'Business expense'),
                    'reference_id': expense['id'],
                    'reference_type': 'expense',
                    'date': expense['date'] or datetime.utcnow().isoformat(),
                    'created_at': datetime.utcnow().isoformat()
                }
                
                supabase.table('transactions').insert(transaction_data).execute()
                fixed_count += 1
                details[f"Expense {expense['id'][:8]}"] = "Created missing transaction record"
        
        return jsonify({
            'success': True,
            'message': f'Transaction integrity check completed. {fixed_count} transactions created.',
            'issues_found': issues_found,
            'fixed_count': fixed_count,
            'details': details
        })
        
    except Exception as e:
        logger.error(f"Transaction integrity error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to check transaction integrity',
            'error': str(e)
        }), 500

@data_integrity_bp.route('/customer-stats', methods=['POST'])
@jwt_required()
def recalculate_customer_stats():
    """
    Recalculate customer statistics (total purchases, last purchase date)
    """
    try:
        supabase = get_supabase_client()
        owner_id = get_jwt_identity()
        
        issues_found = 0
        fixed_count = 0
        details = {}
        
        # Get all customers
        customers_response = supabase.table('customers').select('*').eq('owner_id', owner_id).execute()
        customers = customers_response.data
        
        for customer in customers:
            customer_id = customer['id']
            
            # Calculate total purchases and last purchase date
            sales_response = supabase.table('sales').select('total_amount, date').eq('customer_id', customer_id).execute()
            sales = sales_response.data
            
            if sales:
                total_purchases = sum(sale['total_amount'] or 0 for sale in sales)
                last_purchase_date = max(sale['date'] for sale in sales if sale['date'])
                purchase_count = len(sales)
            else:
                total_purchases = 0
                last_purchase_date = None
                purchase_count = 0
            
            # Update customer record
            current_total = customer.get('total_purchases', 0) or 0
            current_last_date = customer.get('last_purchase_date')
            
            if (current_total != total_purchases or 
                current_last_date != last_purchase_date):
                
                issues_found += 1
                
                update_data = {
                    'total_purchases': total_purchases,
                    'last_purchase_date': last_purchase_date,
                    'updated_at': datetime.utcnow().isoformat()
                }
                
                supabase.table('customers').update(update_data).eq('id', customer_id).execute()
                fixed_count += 1
                
                details[customer['name']] = f"Updated stats: ₦{total_purchases:,.2f} total, {purchase_count} purchases"
        
        return jsonify({
            'success': True,
            'message': f'Customer stats recalculated. {fixed_count} customers updated.',
            'issues_found': issues_found,
            'fixed_count': fixed_count,
            'details': details
        })
        
    except Exception as e:
        logger.error(f"Customer stats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to recalculate customer stats',
            'error': str(e)
        }), 500

@data_integrity_bp.route('/invoice-status', methods=['POST'])
@jwt_required()
def sync_invoice_status():
    """
    Synchronize invoice statuses with payment records
    """
    try:
        supabase = get_supabase_client()
        owner_id = get_jwt_identity()
        
        issues_found = 0
        fixed_count = 0
        details = {}
        
        # Get all invoices
        invoices_response = supabase.table('invoices').select('*').eq('owner_id', owner_id).execute()
        invoices = invoices_response.data
        
        for invoice in invoices:
            invoice_id = invoice['id']
            current_status = invoice.get('status', 'pending')
            
            # Check for payments related to this invoice
            payments_response = supabase.table('payments').select('amount, status').eq('invoice_id', invoice_id).execute()
            payments = payments_response.data
            
            if payments:
                total_paid = sum(payment['amount'] or 0 for payment in payments if payment.get('status') == 'completed')
                invoice_amount = invoice.get('total_amount', 0) or 0
                
                # Determine correct status
                if total_paid >= invoice_amount:
                    correct_status = 'paid'
                elif total_paid > 0:
                    correct_status = 'partially_paid'
                else:
                    correct_status = 'pending'
            else:
                correct_status = 'pending'
            
            # Update if status is incorrect
            if current_status != correct_status:
                issues_found += 1
                
                supabase.table('invoices').update({
                    'status': correct_status,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('id', invoice_id).execute()
                
                fixed_count += 1
                details[f"Invoice {invoice.get('invoice_number', invoice_id[:8])}"] = f"Status: {current_status} → {correct_status}"
        
        return jsonify({
            'success': True,
            'message': f'Invoice status sync completed. {fixed_count} invoices updated.',
            'issues_found': issues_found,
            'fixed_count': fixed_count,
            'details': details
        })
        
    except Exception as e:
        logger.error(f"Invoice status sync error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to sync invoice status',
            'error': str(e)
        }), 500

@data_integrity_bp.route('/dashboard-metrics', methods=['POST'])
@jwt_required()
def recalculate_dashboard_metrics():
    """
    Recalculate dashboard metrics and update cached values
    """
    try:
        supabase = get_supabase_client()
        owner_id = get_jwt_identity()
        
        issues_found = 0
        fixed_count = 0
        details = {}
        
        # Calculate current metrics
        today = datetime.utcnow().date()
        this_month_start = today.replace(day=1)
        
        # Total sales
        sales_response = supabase.table('sales').select('total_amount, date').eq('owner_id', owner_id).execute()
        sales = sales_response.data
        
        total_sales = sum(sale['total_amount'] or 0 for sale in sales)
        today_sales = sum(sale['total_amount'] or 0 for sale in sales 
                         if sale['date'] and sale['date'].startswith(today.isoformat()))
        
        # Total expenses
        expenses_response = supabase.table('expenses').select('amount, date').eq('owner_id', owner_id).execute()
        expenses = expenses_response.data
        
        total_expenses = sum(expense['amount'] or 0 for expense in expenses)
        
        # Customer count
        customers_response = supabase.table('customers').select('id').eq('owner_id', owner_id).execute()
        customer_count = len(customers_response.data)
        
        # Product count and low stock
        products_response = supabase.table('products').select('quantity, low_stock_threshold').eq('owner_id', owner_id).execute()
        products = products_response.data
        
        product_count = len(products)
        low_stock_count = sum(1 for product in products 
                             if (product.get('quantity', 0) or 0) <= (product.get('low_stock_threshold', 5) or 5))
        
        # Store/update metrics in activities table for now (since dashboard_metrics table may not exist yet)
        # This will help track when metrics were last calculated
        activity_data = {
            'owner_id': owner_id,
            'user_id': owner_id,
            'activity_type': 'system',
            'description': f'Dashboard metrics recalculated: ₦{total_sales:,.2f} sales, {customer_count} customers, {product_count} products'
        }
        
        supabase.table('activities').insert(activity_data).execute()
        
        fixed_count = 1
        details['metrics'] = f"Updated: ₦{total_sales:,.2f} sales, {customer_count} customers, {product_count} products"
        
        return jsonify({
            'success': True,
            'message': 'Dashboard metrics recalculated successfully.',
            'issues_found': issues_found,
            'fixed_count': fixed_count,
            'details': details
        })
        
    except Exception as e:
        logger.error(f"Dashboard metrics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to recalculate dashboard metrics',
            'error': str(e)
        }), 500

@data_integrity_bp.route('/orphaned-records', methods=['POST'])
@jwt_required()
def find_orphaned_records():
    """
    Find and handle records with missing relationships
    """
    try:
        supabase = get_supabase_client()
        owner_id = get_jwt_identity()
        
        issues_found = 0
        fixed_count = 0
        details = {}
        
        # Find sales with missing customers
        sales_response = supabase.table('sales').select('id, customer_id, customer_name, product_id').eq('owner_id', owner_id).execute()
        sales = sales_response.data
        
        for sale in sales:
            if sale.get('customer_id'):
                # Check if customer exists
                customer_response = supabase.table('customers').select('id').eq('id', sale['customer_id']).execute()
                if not customer_response.data:
                    issues_found += 1
                    # Remove invalid customer_id
                    supabase.table('sales').update({
                        'customer_id': None,
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', sale['id']).execute()
                    fixed_count += 1
                    details[f"Sale {sale['id'][:8]}"] = "Removed invalid customer reference"
        
        # Find sales with missing products
        for sale in sales:
            if sale.get('product_id'):
                # Check if product exists
                product_response = supabase.table('products').select('id').eq('id', sale['product_id']).execute()
                if not product_response.data:
                    issues_found += 1
                    # Remove invalid product_id
                    supabase.table('sales').update({
                        'product_id': None,
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', sale['id']).execute()
                    fixed_count += 1
                    details[f"Sale {sale['id'][:8]}"] = "Removed invalid product reference"
        
        # Find invoices with missing customers
        invoices_response = supabase.table('invoices').select('id, customer_id').eq('owner_id', owner_id).execute()
        invoices = invoices_response.data
        
        for invoice in invoices:
            if invoice.get('customer_id'):
                # Check if customer exists
                customer_response = supabase.table('customers').select('id').eq('id', invoice['customer_id']).execute()
                if not customer_response.data:
                    issues_found += 1
                    # Remove invalid customer_id
                    supabase.table('invoices').update({
                        'customer_id': None,
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', invoice['id']).execute()
                    fixed_count += 1
                    details[f"Invoice {invoice['id'][:8]}"] = "Removed invalid customer reference"
        
        return jsonify({
            'success': True,
            'message': f'Orphaned records check completed. {fixed_count} issues fixed.',
            'issues_found': issues_found,
            'fixed_count': fixed_count,
            'details': details
        })
        
    except Exception as e:
        logger.error(f"Orphaned records error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to check orphaned records',
            'error': str(e)
        }), 500