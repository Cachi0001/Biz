from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.sale import Sale, SaleItem
from src.models.customer import Customer
from src.models.product import Product
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_

sale_bp = Blueprint('sale', __name__)

@sale_bp.route('', methods=['GET'])
@jwt_required()
def get_sales():
    """Get all sales for the current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        payment_method = request.args.get('payment_method')
        payment_status = request.args.get('payment_status')
        salesperson_id = request.args.get('salesperson_id')
        
        query = Sale.query.filter_by(user_id=user_id)
        
        # Apply filters
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Sale.sale_date >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Sale.sale_date <= end_date)
        
        if payment_method:
            query = query.filter_by(payment_method=payment_method)
        
        if payment_status:
            query = query.filter_by(payment_status=payment_status)
        
        if salesperson_id:
            query = query.filter_by(salesperson_id=salesperson_id)
        
        sales = query.order_by(Sale.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'sales': [sale.to_dict() for sale in sales.items],
            'total': sales.total,
            'pages': sales.pages,
            'current_page': page,
            'per_page': per_page
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sale_bp.route('', methods=['POST'])
@jwt_required()
def create_sale():
    """Create a new sale"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['payment_method', 'sale_items']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        if not data['sale_items']:
            return jsonify({'error': 'At least one sale item is required'}), 400
        
        # Create sale
        sale = Sale(
            user_id=user_id,
            customer_id=data.get('customer_id'),
            salesperson_id=data.get('salesperson_id', user_id),
            payment_method=data['payment_method'],
            payment_status=data.get('payment_status', 'completed'),
            payment_reference=data.get('payment_reference'),
            discount_amount=float(data.get('discount_amount', 0)),
            tax_amount=float(data.get('tax_amount', 0)),
            notes=data.get('notes'),
            commission_rate=float(data.get('commission_rate', 0))
        )
        
        # Generate sale number
        sale.sale_number = sale.generate_sale_number()
        
        # Add sale items
        total_amount = 0
        for item_data in data['sale_items']:
            # Validate item data
            if 'product_name' not in item_data or 'quantity' not in item_data or 'unit_price' not in item_data:
                return jsonify({'error': 'Each sale item must have product_name, quantity, and unit_price'}), 400
            
            sale_item = SaleItem(
                product_id=item_data.get('product_id'),
                product_name=item_data['product_name'],
                product_sku=item_data.get('product_sku'),
                quantity=int(item_data['quantity']),
                unit_price=float(item_data['unit_price']),
                discount_percentage=float(item_data.get('discount_percentage', 0)),
                discount_amount=float(item_data.get('discount_amount', 0)),
                tax_percentage=float(item_data.get('tax_percentage', 0)),
                tax_amount=float(item_data.get('tax_amount', 0))
            )
            
            # Calculate item total
            sale_item.calculate_total()
            total_amount += sale_item.total_amount
            
            sale.sale_items.append(sale_item)
            
            # Update product stock if product_id is provided
            if item_data.get('product_id'):
                product = Product.query.get(item_data['product_id'])
                if product and product.user_id == user_id:
                    product.stock_quantity = max(0, product.stock_quantity - sale_item.quantity)
        
        # Calculate sale totals
        sale.total_amount = total_amount
        sale.net_amount = total_amount - sale.discount_amount + sale.tax_amount
        
        # Calculate commission
        if sale.commission_rate > 0:
            sale.commission_amount = sale.net_amount * (sale.commission_rate / 100)
        
        db.session.add(sale)
        db.session.commit()
        
        return jsonify({
            'message': 'Sale created successfully',
            'sale': sale.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({'error': 'Invalid numeric value provided'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sale_bp.route('/<int:sale_id>', methods=['GET'])
@jwt_required()
def get_sale(sale_id):
    """Get a specific sale"""
    try:
        user_id = get_jwt_identity()
        sale = Sale.query.filter_by(id=sale_id, user_id=user_id).first()
        
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        
        return jsonify({'sale': sale.to_dict()})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sale_bp.route('/<int:sale_id>', methods=['PUT'])
@jwt_required()
def update_sale(sale_id):
    """Update a sale"""
    try:
        user_id = get_jwt_identity()
        sale = Sale.query.filter_by(id=sale_id, user_id=user_id).first()
        
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'payment_status' in data:
            sale.payment_status = data['payment_status']
        if 'payment_reference' in data:
            sale.payment_reference = data['payment_reference']
        if 'notes' in data:
            sale.notes = data['notes']
        
        sale.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Sale updated successfully',
            'sale': sale.to_dict()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sale_bp.route('/daily-report', methods=['GET'])
@jwt_required()
def get_daily_sales_report():
    """Get daily sales report"""
    try:
        user_id = get_jwt_identity()
        report_date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # Parse date
        report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        
        # Get sales for the specific date
        sales = Sale.query.filter(
            and_(
                Sale.user_id == user_id,
                Sale.sale_date == report_date
            )
        ).all()
        
        # Calculate summary statistics
        total_sales = len(sales)
        total_amount = sum(sale.net_amount for sale in sales)
        total_quantity = sum(sum(item.quantity for item in sale.sale_items) for sale in sales)
        
        # Payment method breakdown
        payment_methods = {}
        for sale in sales:
            method = sale.payment_method
            if method not in payment_methods:
                payment_methods[method] = {'count': 0, 'total': 0}
            payment_methods[method]['count'] += 1
            payment_methods[method]['total'] += sale.net_amount
        
        # Top selling products
        product_sales = {}
        for sale in sales:
            for item in sale.sale_items:
                product_name = item.product_name
                if product_name not in product_sales:
                    product_sales[product_name] = {'quantity': 0, 'revenue': 0}
                product_sales[product_name]['quantity'] += item.quantity
                product_sales[product_name]['revenue'] += item.total_amount
        
        # Sort products by quantity sold
        top_products = sorted(
            product_sales.items(),
            key=lambda x: x[1]['quantity'],
            reverse=True
        )[:10]
        
        # Hourly breakdown
        hourly_sales = {}
        for sale in sales:
            hour = sale.sale_time.hour if sale.sale_time else 0
            if hour not in hourly_sales:
                hourly_sales[hour] = {'count': 0, 'total': 0}
            hourly_sales[hour]['count'] += 1
            hourly_sales[hour]['total'] += sale.net_amount
        
        return jsonify({
            'date': report_date.isoformat(),
            'summary': {
                'total_sales': total_sales,
                'total_amount': total_amount,
                'total_quantity': total_quantity,
                'average_sale': total_amount / total_sales if total_sales > 0 else 0
            },
            'payment_methods': payment_methods,
            'top_products': [
                {'product': product, 'stats': stats} 
                for product, stats in top_products
            ],
            'hourly_breakdown': hourly_sales,
            'sales': [sale.to_dict() for sale in sales]
        })
    
    except ValueError as e:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sale_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    """Get sales analytics and insights"""
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', '30')  # days
        
        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=int(period))
        
        # Get sales in the period
        sales = Sale.query.filter(
            and_(
                Sale.user_id == user_id,
                Sale.sale_date >= start_date,
                Sale.sale_date <= end_date
            )
        ).all()
        
        # Calculate metrics
        total_revenue = sum(sale.net_amount for sale in sales)
        total_sales = len(sales)
        total_items_sold = sum(sum(item.quantity for item in sale.sale_items) for sale in sales)
        
        # Daily revenue trend
        daily_revenue = {}
        current_date = start_date
        while current_date <= end_date:
            daily_revenue[current_date.isoformat()] = 0
            current_date += timedelta(days=1)
        
        for sale in sales:
            date_key = sale.sale_date.isoformat()
            daily_revenue[date_key] += sale.net_amount
        
        # Top customers by revenue
        customer_revenue = {}
        for sale in sales:
            if sale.customer_id:
                customer_id = sale.customer_id
                if customer_id not in customer_revenue:
                    customer_revenue[customer_id] = {
                        'customer': sale.customer.to_dict() if sale.customer else None,
                        'total_revenue': 0,
                        'total_orders': 0
                    }
                customer_revenue[customer_id]['total_revenue'] += sale.net_amount
                customer_revenue[customer_id]['total_orders'] += 1
        
        top_customers = sorted(
            customer_revenue.values(),
            key=lambda x: x['total_revenue'],
            reverse=True
        )[:10]
        
        # Sales by payment method
        payment_method_stats = {}
        for sale in sales:
            method = sale.payment_method
            if method not in payment_method_stats:
                payment_method_stats[method] = {'count': 0, 'revenue': 0}
            payment_method_stats[method]['count'] += 1
            payment_method_stats[method]['revenue'] += sale.net_amount
        
        return jsonify({
            'period': f'{period} days',
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'summary': {
                'total_revenue': total_revenue,
                'total_sales': total_sales,
                'total_items_sold': total_items_sold,
                'average_order_value': total_revenue / total_sales if total_sales > 0 else 0,
                'daily_average': total_revenue / int(period) if int(period) > 0 else 0
            },
            'daily_revenue': daily_revenue,
            'top_customers': top_customers,
            'payment_methods': payment_method_stats
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sale_bp.route('/team-performance', methods=['GET'])
@jwt_required()
def get_team_performance():
    """Get team sales performance"""
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', '30')  # days
        
        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=int(period))
        
        # Get team members
        team_members = User.query.filter_by(team_owner_id=user_id).all()
        team_member_ids = [member.id for member in team_members] + [user_id]
        
        # Get sales by team members
        sales = Sale.query.filter(
            and_(
                Sale.salesperson_id.in_(team_member_ids),
                Sale.sale_date >= start_date,
                Sale.sale_date <= end_date
            )
        ).all()
        
        # Calculate performance by salesperson
        performance = {}
        for sale in sales:
            salesperson_id = sale.salesperson_id
            if salesperson_id not in performance:
                salesperson = User.query.get(salesperson_id)
                performance[salesperson_id] = {
                    'salesperson': {
                        'id': salesperson.id,
                        'name': f"{salesperson.first_name} {salesperson.last_name}",
                        'email': salesperson.email
                    },
                    'total_sales': 0,
                    'total_revenue': 0,
                    'total_commission': 0,
                    'sales_count': 0
                }
            
            performance[salesperson_id]['total_revenue'] += sale.net_amount
            performance[salesperson_id]['total_commission'] += sale.commission_amount
            performance[salesperson_id]['sales_count'] += 1
        
        # Sort by revenue
        team_performance = sorted(
            performance.values(),
            key=lambda x: x['total_revenue'],
            reverse=True
        )
        
        return jsonify({
            'period': f'{period} days',
            'team_performance': team_performance,
            'team_summary': {
                'total_members': len(team_member_ids),
                'total_revenue': sum(p['total_revenue'] for p in performance.values()),
                'total_commission': sum(p['total_commission'] for p in performance.values()),
                'total_sales': sum(p['sales_count'] for p in performance.values())
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

