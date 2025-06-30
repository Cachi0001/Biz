from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.product import Product
from src.models.user import db

product_bp = Blueprint('product', __name__)

@product_bp.route('/', methods=['GET'])
@jwt_required()
def get_products():
    """Get all products for the current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        low_stock_only = request.args.get('low_stock_only', 'false').lower() == 'true'
        
        query = Product.query.filter_by(user_id=user_id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                (Product.name.contains(search)) |
                (Product.description.contains(search)) |
                (Product.sku.contains(search))
            )
        
        products = query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        product_list = [product.to_dict() for product in products.items]
        
        # Filter for low stock if requested
        if low_stock_only:
            product_list = [p for p in product_list if Product.query.get(p['id']).is_low_stock()]
        
        return jsonify({
            'products': product_list,
            'total': products.total,
            'pages': products.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """Get a specific product"""
    try:
        user_id = get_jwt_identity()
        product = Product.query.filter_by(id=product_id, user_id=user_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'product': product.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Product name is required'}), 400
        
        if not data.get('unit_price'):
            return jsonify({'error': 'Unit price is required'}), 400
        
        # Check if product with same SKU exists for this user
        if data.get('sku'):
            existing_product = Product.query.filter_by(
                user_id=user_id, 
                sku=data['sku']
            ).first()
            if existing_product:
                return jsonify({'error': 'Product with this SKU already exists'}), 400
        
        product = Product(
            user_id=user_id,
            name=data['name'],
            description=data.get('description'),
            sku=data.get('sku'),
            category=data.get('category'),
            unit_price=data['unit_price'],
            cost_price=data.get('cost_price'),
            quantity_in_stock=data.get('quantity_in_stock', 0),
            minimum_stock_level=data.get('minimum_stock_level', 0),
            unit_of_measure=data.get('unit_of_measure', 'piece'),
            tax_rate=data.get('tax_rate', 0),
            is_service=data.get('is_service', False),
            image_url=data.get('image_url'),
            barcode=data.get('barcode'),
            supplier_info=data.get('supplier_info')
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update a product"""
    try:
        user_id = get_jwt_identity()
        product = Product.query.filter_by(id=product_id, user_id=user_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.get_json()
        
        # Check if SKU is being changed and if it conflicts
        if data.get('sku') and data['sku'] != product.sku:
            existing_product = Product.query.filter_by(
                user_id=user_id, 
                sku=data['sku']
            ).first()
            if existing_product:
                return jsonify({'error': 'Product with this SKU already exists'}), 400
        
        # Update allowed fields
        allowed_fields = [
            'name', 'description', 'sku', 'category', 'unit_price', 'cost_price',
            'quantity_in_stock', 'minimum_stock_level', 'unit_of_measure', 'tax_rate',
            'is_active', 'is_service', 'image_url', 'barcode', 'supplier_info'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(product, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete (deactivate) a product"""
    try:
        user_id = get_jwt_identity()
        product = Product.query.filter_by(id=product_id, user_id=user_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Soft delete by setting is_active to False
        product.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/<int:product_id>/stock', methods=['PUT'])
@jwt_required()
def update_stock(product_id):
    """Update product stock"""
    try:
        user_id = get_jwt_identity()
        product = Product.query.filter_by(id=product_id, user_id=user_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if product.is_service:
            return jsonify({'error': 'Cannot update stock for services'}), 400
        
        data = request.get_json()
        
        if 'quantity_change' not in data:
            return jsonify({'error': 'quantity_change is required'}), 400
        
        quantity_change = data['quantity_change']
        product.update_stock(quantity_change)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Stock updated successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all product categories for the current user"""
    try:
        user_id = get_jwt_identity()
        
        categories = db.session.query(Product.category).filter_by(
            user_id=user_id, 
            is_active=True
        ).distinct().all()
        
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return jsonify({'categories': category_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock_products():
    """Get products that are low on stock"""
    try:
        user_id = get_jwt_identity()
        
        low_stock_products = Product.get_low_stock_products(user_id)
        
        return jsonify({
            'products': [product.to_dict() for product in low_stock_products],
            'count': len(low_stock_products)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_product_stats():
    """Get product statistics"""
    try:
        user_id = get_jwt_identity()
        
        total_products = Product.query.filter_by(user_id=user_id, is_active=True).count()
        services = Product.query.filter_by(
            user_id=user_id, 
            is_active=True, 
            is_service=True
        ).count()
        physical_products = total_products - services
        
        low_stock_count = len(Product.get_low_stock_products(user_id))
        
        # Calculate total inventory value
        products = Product.query.filter_by(user_id=user_id, is_active=True, is_service=False).all()
        total_inventory_value = sum(
            (product.quantity_in_stock * product.cost_price) 
            for product in products 
            if product.cost_price
        )
        
        return jsonify({
            'total_products': total_products,
            'physical_products': physical_products,
            'services': services,
            'low_stock_count': low_stock_count,
            'total_inventory_value': float(total_inventory_value)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

