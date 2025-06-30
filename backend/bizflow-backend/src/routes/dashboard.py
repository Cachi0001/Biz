from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.customer import Customer
from src.models.product import Product
from src.models.invoice import Invoice
from src.models.payment import Payment
from datetime import datetime, timedelta
from sqlalchemy import func, extract

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_dashboard_overview():
    """Get dashboard overview statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get date range (default to last 30 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Customer statistics
        total_customers = Customer.query.filter_by(user_id=user_id, is_active=True).count()
        new_customers_this_month = Customer.query.filter(
            Customer.user_id == user_id,
            Customer.is_active == True,
            Customer.created_at >= start_date
        ).count()
        
        # Product statistics
        total_products = Product.query.filter_by(user_id=user_id, is_active=True).count()
        low_stock_products = len(Product.get_low_stock_products(user_id))
        
        # Invoice statistics
        total_invoices = Invoice.query.filter_by(user_id=user_id).count()
        pending_invoices = Invoice.query.filter(
            Invoice.user_id == user_id,
            Invoice.status.in_(['draft', 'sent'])
        ).count()
        overdue_invoices = Invoice.query.filter(
            Invoice.user_id == user_id,
            Invoice.status == 'overdue'
        ).count()
        
        # Revenue statistics
        successful_payments = Payment.query.filter_by(user_id=user_id, status='successful').all()
        total_revenue = sum(payment.amount for payment in successful_payments)
        
        # Revenue this month
        monthly_payments = Payment.query.filter(
            Payment.user_id == user_id,
            Payment.status == 'successful',
            Payment.paid_at >= start_date
        ).all()
        monthly_revenue = sum(payment.amount for payment in monthly_payments)
        
        # Outstanding amount
        outstanding_invoices = Invoice.query.filter(
            Invoice.user_id == user_id,
            Invoice.status.in_(['sent', 'overdue'])
        ).all()
        outstanding_amount = sum(invoice.get_balance_due() for invoice in outstanding_invoices)
        
        return jsonify({
            'customers': {
                'total': total_customers,
                'new_this_month': new_customers_this_month
            },
            'products': {
                'total': total_products,
                'low_stock': low_stock_products
            },
            'invoices': {
                'total': total_invoices,
                'pending': pending_invoices,
                'overdue': overdue_invoices
            },
            'revenue': {
                'total': float(total_revenue),
                'this_month': float(monthly_revenue),
                'outstanding': float(outstanding_amount)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/revenue-chart', methods=['GET'])
@jwt_required()
def get_revenue_chart():
    """Get revenue chart data"""
    try:
        user_id = get_jwt_identity()
        
        # Get period (default to last 12 months)
        period = request.args.get('period', '12months')
        
        if period == '12months':
            # Get monthly revenue for last 12 months
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=365)
            
            # Query payments grouped by month
            monthly_revenue = db.session.query(
                extract('year', Payment.paid_at).label('year'),
                extract('month', Payment.paid_at).label('month'),
                func.sum(Payment.amount).label('total')
            ).filter(
                Payment.user_id == user_id,
                Payment.status == 'successful',
                Payment.paid_at >= start_date
            ).group_by(
                extract('year', Payment.paid_at),
                extract('month', Payment.paid_at)
            ).all()
            
            # Format data for chart
            chart_data = []
            for item in monthly_revenue:
                month_name = datetime(int(item.year), int(item.month), 1).strftime('%b %Y')
                chart_data.append({
                    'period': month_name,
                    'revenue': float(item.total)
                })
            
        elif period == '7days':
            # Get daily revenue for last 7 days
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=7)
            
            daily_revenue = db.session.query(
                func.date(Payment.paid_at).label('date'),
                func.sum(Payment.amount).label('total')
            ).filter(
                Payment.user_id == user_id,
                Payment.status == 'successful',
                Payment.paid_at >= start_date
            ).group_by(
                func.date(Payment.paid_at)
            ).all()
            
            chart_data = []
            for item in daily_revenue:
                chart_data.append({
                    'period': item.date.strftime('%Y-%m-%d'),
                    'revenue': float(item.total)
                })
        
        return jsonify({'chart_data': chart_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/top-customers', methods=['GET'])
@jwt_required()
def get_top_customers():
    """Get top customers by revenue"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 5, type=int)
        
        # Get customers with their total invoice amounts
        customer_revenue = db.session.query(
            Customer.id,
            Customer.name,
            Customer.email,
            func.sum(Invoice.total_amount).label('total_revenue'),
            func.count(Invoice.id).label('invoice_count')
        ).join(
            Invoice, Customer.id == Invoice.customer_id
        ).filter(
            Customer.user_id == user_id,
            Customer.is_active == True
        ).group_by(
            Customer.id, Customer.name, Customer.email
        ).order_by(
            func.sum(Invoice.total_amount).desc()
        ).limit(limit).all()
        
        top_customers = []
        for item in customer_revenue:
            top_customers.append({
                'id': item.id,
                'name': item.name,
                'email': item.email,
                'total_revenue': float(item.total_revenue),
                'invoice_count': item.invoice_count
            })
        
        return jsonify({'top_customers': top_customers}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    """Get top selling products"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 5, type=int)
        
        # Get products with their sales data from invoice items
        from src.models.invoice import InvoiceItem
        
        product_sales = db.session.query(
            Product.id,
            Product.name,
            Product.unit_price,
            func.sum(InvoiceItem.quantity).label('total_quantity'),
            func.sum(InvoiceItem.total_amount).label('total_revenue')
        ).join(
            InvoiceItem, Product.id == InvoiceItem.product_id
        ).join(
            Invoice, InvoiceItem.invoice_id == Invoice.id
        ).filter(
            Product.user_id == user_id,
            Product.is_active == True
        ).group_by(
            Product.id, Product.name, Product.unit_price
        ).order_by(
            func.sum(InvoiceItem.total_amount).desc()
        ).limit(limit).all()
        
        top_products = []
        for item in product_sales:
            top_products.append({
                'id': item.id,
                'name': item.name,
                'unit_price': float(item.unit_price),
                'total_quantity': float(item.total_quantity),
                'total_revenue': float(item.total_revenue)
            })
        
        return jsonify({'top_products': top_products}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/recent-activities', methods=['GET'])
@jwt_required()
def get_recent_activities():
    """Get recent business activities"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)
        
        activities = []
        
        # Recent invoices
        recent_invoices = Invoice.query.filter_by(user_id=user_id).order_by(
            Invoice.created_at.desc()
        ).limit(5).all()
        
        for invoice in recent_invoices:
            activities.append({
                'type': 'invoice',
                'description': f'Invoice {invoice.invoice_number} created for {invoice.customer.name}',
                'amount': float(invoice.total_amount),
                'date': invoice.created_at.isoformat(),
                'status': invoice.status
            })
        
        # Recent payments
        recent_payments = Payment.query.filter_by(user_id=user_id, status='successful').order_by(
            Payment.paid_at.desc()
        ).limit(5).all()
        
        for payment in recent_payments:
            activities.append({
                'type': 'payment',
                'description': f'Payment received from {payment.customer_name or payment.customer_email}',
                'amount': float(payment.amount),
                'date': payment.paid_at.isoformat(),
                'status': payment.status
            })
        
        # Recent customers
        recent_customers = Customer.query.filter_by(user_id=user_id, is_active=True).order_by(
            Customer.created_at.desc()
        ).limit(3).all()
        
        for customer in recent_customers:
            activities.append({
                'type': 'customer',
                'description': f'New customer {customer.name} added',
                'amount': 0,
                'date': customer.created_at.isoformat(),
                'status': 'active'
            })
        
        # Sort all activities by date and limit
        activities.sort(key=lambda x: x['date'], reverse=True)
        activities = activities[:limit]
        
        return jsonify({'activities': activities}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/financial-summary', methods=['GET'])
@jwt_required()
def get_financial_summary():
    """Get financial summary for a specific period"""
    try:
        user_id = get_jwt_identity()
        
        # Get date range from query params
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            # Default to current month
            now = datetime.utcnow()
            start_date = datetime(now.year, now.month, 1)
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1)
            else:
                end_date = datetime(now.year, now.month + 1, 1)
        
        # Revenue (successful payments)
        revenue_payments = Payment.query.filter(
            Payment.user_id == user_id,
            Payment.status == 'successful',
            Payment.paid_at >= start_date,
            Payment.paid_at < end_date
        ).all()
        
        total_revenue = sum(payment.amount for payment in revenue_payments)
        total_fees = sum(payment.fees for payment in revenue_payments)
        
        # Invoices created in period
        invoices_created = Invoice.query.filter(
            Invoice.user_id == user_id,
            Invoice.created_at >= start_date,
            Invoice.created_at < end_date
        ).all()
        
        invoices_amount = sum(invoice.total_amount for invoice in invoices_created)
        
        # Outstanding invoices
        outstanding_invoices = Invoice.query.filter(
            Invoice.user_id == user_id,
            Invoice.status.in_(['sent', 'overdue'])
        ).all()
        
        outstanding_amount = sum(invoice.get_balance_due() for invoice in outstanding_invoices)
        
        return jsonify({
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            },
            'revenue': {
                'total': float(total_revenue),
                'fees': float(total_fees),
                'net': float(total_revenue - total_fees)
            },
            'invoices': {
                'created_count': len(invoices_created),
                'created_amount': float(invoices_amount),
                'outstanding_amount': float(outstanding_amount)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

