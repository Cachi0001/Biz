from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from src.models.product import Product
from src.models.user import db
from src.services.cloudinary_service import CloudinaryService

product_bp = Blueprint("product_bp", __name__)

@product_bp.route("/", methods=["GET"])
@jwt_required()
def get_products():
    """Get all products for the authenticated user"""
    user_id = get_jwt_identity()
    
    # Get query parameters for filtering
    category = request.args.get('category')
    search = request.args.get('search')
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    
    query = Product.query.filter_by(user_id=user_id)
    
    if active_only:
        query = query.filter_by(is_active=True)
    
    if category:
        query = query.filter_by(category=category)
    
    if search:
        query = query.filter(Product.name.contains(search) | Product.sku.contains(search))
    
    products = query.order_by(Product.created_at.desc()).all()
    return jsonify([product.to_dict() for product in products])

@product_bp.route("/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    """Get a specific product by ID"""
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    return jsonify(product.to_dict())

@product_bp.route("/", methods=["POST"])
@jwt_required()
def create_product():
    """Create a new product"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'unit_price']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field} is required"}), 400
    
    try:
        product = Product(
            user_id=user_id,
            name=data['name'],
            description=data.get('description', ''),
            sku=data.get('sku', ''),
            category=data.get('category', ''),
            unit_price=float(data['unit_price']),
            cost_price=float(data.get('cost_price', 0)),
            quantity_in_stock=int(data.get('quantity_in_stock', 0)),
            minimum_stock_level=int(data.get('minimum_stock_level', 0)),
            unit_of_measure=data.get('unit_of_measure', 'piece'),
            tax_rate=float(data.get('tax_rate', 0)),
            is_service=data.get('is_service', False),
            barcode=data.get('barcode', ''),
            supplier_info=data.get('supplier_info', '')
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify(product.to_dict()), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "SKU already exists"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create product: {str(e)}"}), 500

@product_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    """Update an existing product"""
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    data = request.get_json()
    
    try:
        # Update fields if provided
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'sku' in data:
            product.sku = data['sku']
        if 'category' in data:
            product.category = data['category']
        if 'unit_price' in data:
            product.unit_price = float(data['unit_price'])
        if 'cost_price' in data:
            product.cost_price = float(data['cost_price'])
        if 'quantity_in_stock' in data:
            product.quantity_in_stock = int(data['quantity_in_stock'])
        if 'minimum_stock_level' in data:
            product.minimum_stock_level = int(data['minimum_stock_level'])
        if 'unit_of_measure' in data:
            product.unit_of_measure = data['unit_of_measure']
        if 'tax_rate' in data:
            product.tax_rate = float(data['tax_rate'])
        if 'is_service' in data:
            product.is_service = data['is_service']
        if 'is_active' in data:
            product.is_active = data['is_active']
        if 'barcode' in data:
            product.barcode = data['barcode']
        if 'supplier_info' in data:
            product.supplier_info = data['supplier_info']
        
        db.session.commit()
        return jsonify(product.to_dict())
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "SKU already exists"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update product: {str(e)}"}), 500

@product_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    """Delete a product (soft delete by setting is_active to False)"""
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    try:
        # Soft delete - set is_active to False
        product.is_active = False
        db.session.commit()
        
        return jsonify({"message": "Product deleted successfully"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete product: {str(e)}"}), 500

@product_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    """Get all unique categories for the user's products"""
    user_id = get_jwt_identity()
    
    categories = db.session.query(Product.category).filter_by(
        user_id=user_id, 
        is_active=True
    ).distinct().all()
    
    # Extract category names and filter out empty ones
    category_list = [cat[0] for cat in categories if cat[0]]
    
    return jsonify(category_list)

@product_bp.route("/low-stock", methods=["GET"])
@jwt_required()
def get_low_stock_products():
    """Get products that are low on stock"""
    user_id = get_jwt_identity()
    
    products = Product.query.filter_by(user_id=user_id, is_active=True).all()
    low_stock_products = [product for product in products if product.is_low_stock()]
    
    return jsonify([product.to_dict() for product in low_stock_products])

@product_bp.route("/<int:product_id>/stock", methods=["PUT"])
@jwt_required()
def update_stock(product_id):
    """Update product stock quantity"""
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    if product.is_service:
        return jsonify({"error": "Cannot update stock for services"}), 400
    
    data = request.get_json()
    
    if 'quantity_change' not in data:
        return jsonify({"error": "quantity_change is required"}), 400
    
    try:
        quantity_change = int(data['quantity_change'])
        product.update_stock(quantity_change)
        db.session.commit()
        
        return jsonify({
            "message": "Stock updated successfully",
            "product": product.to_dict()
        })
        
    except ValueError:
        return jsonify({"error": "Invalid quantity_change value"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update stock: {str(e)}"}), 500

@product_bp.route("/<int:product_id>/upload-image", methods=["POST"])
@jwt_required()
def upload_product_image(product_id):
    """Upload product image to Cloudinary"""
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        # Delete old image if exists
        if product.image_public_id:
            CloudinaryService.delete_image(product.image_public_id)
        
        upload_result = CloudinaryService.upload_image(file, folder="product_images")
        product.image_url = upload_result["secure_url"]
        product.image_public_id = upload_result["public_id"]
        db.session.commit()
        
        return jsonify(product.to_dict())
        
    except Exception as e:
        return jsonify({"error": f"Failed to upload image: {str(e)}"}), 500

@product_bp.route("/<int:product_id>/remove-image", methods=["DELETE"])
@jwt_required()
def remove_product_image(product_id):
    """Remove product image"""
    user_id = get_jwt_identity()
    product = Product.query.filter_by(id=product_id, user_id=user_id).first()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    try:
        # Delete image from Cloudinary if exists
        if product.image_public_id:
            CloudinaryService.delete_image(product.image_public_id)
        
        product.image_url = None
        product.image_public_id = None
        db.session.commit()
        
        return jsonify({"message": "Image removed successfully"})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to remove image: {str(e)}"}), 500


