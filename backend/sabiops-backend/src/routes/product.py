from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import uuid
import logging
from src.services.supabase_service import SupabaseService

product_bp = Blueprint("product", __name__)
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
    logger.error(f"[PRODUCT API ERROR] Status: {status_code}, Message: {message}, Error: {error}")
    return jsonify({
        "success": False,
        "error": str(error),
        "message": message
    }), status_code

def get_business_categories():
    """Get standard Nigerian business product categories"""
    return [
        'Electronics & Technology',
        'Fashion & Clothing',
        'Food & Beverages',
        'Health & Beauty',
        'Home & Garden',
        'Automotive',
        'Sports & Outdoors',
        'Books & Media',
        'Office Supplies',
        'Agriculture',
        'Construction Materials',
        'Jewelry & Accessories',
        'Toys & Games',
        'Art & Crafts',
        'Other'
    ]

@product_bp.route("/", methods=["GET"])
@jwt_required()
def get_products():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Build query
        query = supabase.table("products").select("*").eq("owner_id", owner_id)
        
        # Apply filters
        category = request.args.get("category")
        search = request.args.get("search")
        active_only = request.args.get("active_only", "true").lower() == "true"
        
        if active_only:
            query = query.eq("active", True)
        
        if category and category != "all":
            query = query.eq("category", category)
        
        if search:
            query = query.or_(f"name.ilike.%{search}%,sku.ilike.%{search}%")
        
        # Execute query
        products_result = query.order("created_at", desc=True).execute()
        
        if not products_result.data:
            return success_response(
                data={
                    "products": [],
                    "categories": get_business_categories(),
                    "low_stock_count": 0,
                    "total_count": 0
                },
                message="No products found"
            )
        
        # Calculate statistics
        products_with_stats = []
        low_stock_count = 0
        
        for product in products_result.data:
            # Add stock status
            quantity = int(product.get('quantity', 0))
            threshold = int(product.get('low_stock_threshold', 5))
            is_low_stock = quantity <= threshold
            
            if is_low_stock:
                low_stock_count += 1
            
            # Enhanced product data
            product_data = {
                **product,
                'is_low_stock': is_low_stock,
                'stock_status': 'out_of_stock' if quantity == 0 else ('low_stock' if is_low_stock else 'in_stock')
            }
            products_with_stats.append(product_data)
        
        # Get unique categories from products
        used_categories = list(set([p.get('category') for p in products_result.data if p.get('category')]))
        all_categories = get_business_categories()
        
        return success_response(
            data={
                "products": products_with_stats,
                "categories": all_categories,
                "used_categories": used_categories,
                "low_stock_count": low_stock_count,
                "total_count": len(products_with_stats)
            },
            message="Products retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        return error_response("Failed to fetch products", status_code=500)

@product_bp.route("/<product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        product = get_supabase().table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        
        if not product.data:
            return error_response("Product not found", status_code=404)
        
        return success_response(
            data={
                "product": product.data
            }
        )
        
    except Exception as e:
        return error_response(str(e), status_code=500)

def validate_product_data(data, is_update=False):
    """Comprehensive product data validation"""
    errors = []
    
    # Required fields validation (only for create)
    if not is_update:
        required_fields = ["name", "price", "quantity"]
        for field in required_fields:
            if not data.get(field) or (isinstance(data.get(field), str) and not data.get(field).strip()):
                errors.append(f"{field.replace('_', ' ').title()} is required")
    
    # Name validation
    if data.get("name"):
        name = data["name"].strip()
        if len(name) < 2:
            errors.append("Product name must be at least 2 characters long")
        elif len(name) > 100:
            errors.append("Product name cannot exceed 100 characters")
    
    # Price validation
    if data.get("price") is not None:
        try:
            price = float(data["price"])
            if price <= 0:
                errors.append("Price must be greater than 0")
            elif price > 10000000:  # 10 million Naira limit
                errors.append("Price cannot exceed ₦10,000,000")
        except (ValueError, TypeError):
            errors.append("Invalid price format - must be a valid number")
    
    # Cost price validation
    if data.get("cost_price") is not None and data.get("cost_price") != "":
        try:
            cost_price = float(data["cost_price"])
            if cost_price < 0:
                errors.append("Cost price cannot be negative")
            elif cost_price > 10000000:
                errors.append("Cost price cannot exceed ₦10,000,000")
            # Check if cost price is higher than selling price
            if data.get("price") and cost_price > float(data["price"]):
                errors.append("Cost price should not be higher than selling price")
        except (ValueError, TypeError):
            errors.append("Invalid cost price format - must be a valid number")
    
    # Quantity validation
    if data.get("quantity") is not None:
        try:
            quantity = int(data["quantity"])
            if quantity < 0:
                errors.append("Quantity cannot be negative")
            elif quantity > 1000000:  # 1 million units limit
                errors.append("Quantity cannot exceed 1,000,000 units")
        except (ValueError, TypeError):
            errors.append("Invalid quantity format - must be a whole number")
    
    # Low stock threshold validation
    if data.get("low_stock_threshold") is not None and data.get("low_stock_threshold") != "":
        try:
            threshold = int(data["low_stock_threshold"])
            if threshold < 0:
                errors.append("Low stock threshold cannot be negative")
            elif threshold > 10000:
                errors.append("Low stock threshold cannot exceed 10,000")
        except (ValueError, TypeError):
            errors.append("Invalid low stock threshold format - must be a whole number")
    
    # SKU validation
    if data.get("sku"):
        sku = data["sku"].strip()
        if len(sku) > 50:
            errors.append("SKU cannot exceed 50 characters")
    
    # Category validation
    if data.get("category"):
        category = data["category"].strip()
        valid_categories = get_business_categories()
        if category not in valid_categories:
            errors.append(f"Invalid category. Must be one of: {', '.join(valid_categories)}")
    
    # Description validation
    if data.get("description") and len(data["description"]) > 1000:
        errors.append("Description cannot exceed 1000 characters")
    
    # Image URL validation
    if data.get("image_url"):
        image_url = data["image_url"].strip()
        if len(image_url) > 500:
            errors.append("Image URL cannot exceed 500 characters")
        elif not (image_url.startswith("http://") or image_url.startswith("https://")):
            errors.append("Image URL must be a valid HTTP/HTTPS URL")
    
    return errors

@product_bp.route("/", methods=["POST"])
@jwt_required()
def create_product():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        if not data:
            return error_response("No data provided", status_code=400)
        
        # Comprehensive validation
        validation_errors = validate_product_data(data, is_update=False)
        if validation_errors:
            return error_response("; ".join(validation_errors), "Validation failed", status_code=400)
        
        # Check for duplicate SKU if provided
        if data.get("sku") and data["sku"].strip():
            existing_sku = supabase.table("products").select("id").eq("owner_id", owner_id).eq("sku", data["sku"].strip()).eq("active", True).execute()
            if existing_sku.data:
                return error_response("A product with this SKU already exists", status_code=400)
        
        # Process validated data
        price = float(data["price"])
        quantity = int(data["quantity"])
        cost_price = float(data.get("cost_price", 0)) if data.get("cost_price") else 0
        low_stock_threshold = int(data.get("low_stock_threshold", 5)) if data.get("low_stock_threshold") else 5
        
        # Generate SKU if not provided
        sku = data.get("sku", "").strip()
        if not sku:
            # Generate SKU from product name and timestamp
            name_part = "".join([c.upper() for c in data["name"][:3] if c.isalnum()])
            timestamp_part = str(int(datetime.now().timestamp()))[-4:]
            sku = f"{name_part}-{timestamp_part}"
        
        product_data = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "name": data["name"].strip(),
            "description": data.get("description", "").strip(),
            "price": price,
            "cost_price": cost_price,
            "quantity": quantity,
            "low_stock_threshold": low_stock_threshold,
            "category": data.get("category", "Other").strip(),
            "sku": sku,
            "image_url": data.get("image_url", "").strip(),
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table("products").insert(product_data).execute()
        
        if not result.data:
            return error_response("Failed to create product", status_code=500)
        
        # Add stock status to response
        created_product = result.data[0]
        created_product['is_low_stock'] = quantity <= low_stock_threshold
        created_product['stock_status'] = 'out_of_stock' if quantity == 0 else ('low_stock' if quantity <= low_stock_threshold else 'in_stock')
        
        # Send low stock alert if product is created with low stock
        if quantity <= low_stock_threshold:
            try:
                supa_service = SupabaseService()
                supa_service.notify_user(
                    str(owner_id),
                    "Low Stock Alert!",
                    f"Product '{created_product['name']}' was created with low stock (Qty: {quantity}). Consider restocking soon.",
                    "warning"
                )
            except Exception as e:
                logger.warning(f"Failed to send low stock notification: {e}")
        
        return success_response(
            message="Product created successfully",
            data={
                "product": created_product
            },
            status_code=201
        )
        
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        return error_response("Failed to create product", status_code=500)

@product_bp.route("/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        if not data:
            return error_response("No data provided", status_code=400)
        
        # Get existing product
        product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        if not product.data:
            return error_response("Product not found", status_code=404)
        
        existing_product = product.data
        
        # Comprehensive validation for update
        validation_errors = validate_product_data(data, is_update=True)
        if validation_errors:
            return error_response("; ".join(validation_errors), "Validation failed", status_code=400)
        
        # Check for duplicate SKU if SKU is being updated
        if data.get("sku") and data["sku"].strip() != existing_product.get("sku"):
            existing_sku = supabase.table("products").select("id").eq("owner_id", owner_id).eq("sku", data["sku"].strip()).eq("active", True).execute()
            if existing_sku.data:
                return error_response("A product with this SKU already exists", status_code=400)
        
        # Build update data with validation
        update_data = {
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Track if quantity changed for low stock notification
        old_quantity = existing_product.get("quantity", 0)
        new_quantity = old_quantity
        
        if data.get("name"):
            update_data["name"] = data["name"].strip()
        if data.get("description") is not None:
            update_data["description"] = data["description"].strip()
        if data.get("price") is not None:
            update_data["price"] = float(data["price"])
        if data.get("cost_price") is not None:
            update_data["cost_price"] = float(data["cost_price"]) if data["cost_price"] else 0
        if data.get("quantity") is not None:
            new_quantity = int(data["quantity"])
            update_data["quantity"] = new_quantity
        if data.get("low_stock_threshold") is not None:
            update_data["low_stock_threshold"] = int(data["low_stock_threshold"]) if data["low_stock_threshold"] else 5
        if data.get("category"):
            update_data["category"] = data["category"].strip()
        if data.get("sku"):
            update_data["sku"] = data["sku"].strip()
        if data.get("image_url") is not None:
            update_data["image_url"] = data["image_url"].strip()
        if data.get("active") is not None:
            update_data["active"] = data["active"]
        
        # Update the product
        result = supabase.table("products").update(update_data).eq("id", product_id).execute()
        
        if not result.data:
            return error_response("Failed to update product", status_code=500)
        
        updated_product = result.data[0]
        
        # Add stock status to response
        threshold = updated_product.get("low_stock_threshold", 5)
        updated_product['is_low_stock'] = new_quantity <= threshold
        updated_product['stock_status'] = 'out_of_stock' if new_quantity == 0 else ('low_stock' if new_quantity <= threshold else 'in_stock')
        
        # Send low stock notification if quantity decreased to low stock level
        if new_quantity <= threshold and (old_quantity > threshold or new_quantity < old_quantity):
            try:
                supa_service = SupabaseService()
                supa_service.notify_user(
                    str(owner_id),
                    "Low Stock Alert!",
                    f"Product '{updated_product['name']}' is now low on stock (Qty: {new_quantity}). Please restock soon.",
                    "warning"
                )
            except Exception as e:
                logger.warning(f"Failed to send low stock notification: {e}")
        
        return success_response(
            message="Product updated successfully",
            data={
                "product": updated_product
            }
        )
        
    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        return error_response("Failed to update product", status_code=500)

@product_bp.route("/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get product to check if it exists and get name for logging
        product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        if not product.data:
            return error_response("Product not found", status_code=404)
        
        product_name = product.data.get("name", "Unknown Product")
        
        # Check if product is referenced in any sales or invoices
        # This is a soft check - we'll still allow deletion but warn
        try:
            # Check for sales references (if sales table exists)
            sales_check = supabase.table("sales").select("id").eq("product_id", product_id).limit(1).execute()
            has_sales = len(sales_check.data) > 0 if sales_check.data else False
            
            # Check for invoice items references (if invoice_items table exists)
            invoice_items_check = supabase.table("invoice_items").select("id").eq("product_id", product_id).limit(1).execute()
            has_invoice_items = len(invoice_items_check.data) > 0 if invoice_items_check.data else False
            
            warning_message = ""
            if has_sales or has_invoice_items:
                warning_message = " Note: This product has transaction history that will be preserved."
        except Exception as e:
            # If tables don't exist or query fails, continue with deletion
            logger.warning(f"Could not check product references: {e}")
            warning_message = ""
        
        # Soft delete the product
        result = supabase.table("products").update({
            "active": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", product_id).execute()
        
        if not result.data:
            return error_response("Failed to delete product", status_code=500)
        
        logger.info(f"Product '{product_name}' (ID: {product_id}) soft deleted by user {owner_id}")
        
        return success_response(
            message=f"Product '{product_name}' deleted successfully.{warning_message}",
            data={
                "product_id": product_id,
                "product_name": product_name
            }
        )
        
    except Exception as e:
        logger.error(f"Error deleting product: {str(e)}")
        return error_response("Failed to delete product", status_code=500)

@product_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_categories():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get all available categories
        all_categories = get_business_categories()
        
        # Get categories actually used by the user's products
        products = supabase.table("products").select("category").eq("owner_id", owner_id).eq("active", True).execute()
        
        used_categories = list(set([p["category"] for p in products.data if p.get("category")]))
        
        # Get category statistics
        category_stats = {}
        for product in products.data:
            category = product.get("category", "Other")
            if category in category_stats:
                category_stats[category] += 1
            else:
                category_stats[category] = 1
        
        return success_response(
            data={
                "all_categories": all_categories,
                "used_categories": used_categories,
                "category_stats": category_stats,
                "total_categories": len(used_categories)
            },
            message="Categories retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return error_response("Failed to fetch categories", status_code=500)

@product_bp.route("/low-stock", methods=["GET"])
@jwt_required()
def get_low_stock_products():
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        products = supabase.table("products").select("*").eq("owner_id", owner_id).eq("active", True).execute()
        
        if not products.data:
            return success_response(
                data={
                    "low_stock_products": [],
                    "out_of_stock_products": [],
                    "low_stock_count": 0,
                    "out_of_stock_count": 0
                },
                message="No products found"
            )
        
        low_stock_products = []
        out_of_stock_products = []
        
        for product in products.data:
            quantity = int(product.get("quantity", 0))
            threshold = int(product.get("low_stock_threshold", 5))
            
            # Add stock status
            product['is_low_stock'] = quantity <= threshold
            product['stock_status'] = 'out_of_stock' if quantity == 0 else ('low_stock' if quantity <= threshold else 'in_stock')
            
            if quantity == 0:
                out_of_stock_products.append(product)
            elif quantity <= threshold:
                low_stock_products.append(product)
        
        return success_response(
            data={
                "low_stock_products": low_stock_products,
                "out_of_stock_products": out_of_stock_products,
                "low_stock_count": len(low_stock_products),
                "out_of_stock_count": len(out_of_stock_products),
                "total_alerts": len(low_stock_products) + len(out_of_stock_products)
            },
            message="Low stock products retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error fetching low stock products: {str(e)}")
        return error_response("Failed to fetch low stock products", status_code=500)

@product_bp.route("/<product_id>/stock", methods=["PUT"])
@jwt_required()
def update_stock(product_id):
    """Update product stock quantity with proper validation and notifications"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        if not data:
            return error_response("No data provided", status_code=400)
        
        # Get existing product
        product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
        if not product.data:
            return error_response("Product not found", status_code=404)
        
        existing_product = product.data
        
        # Validate quantity_change
        if "quantity_change" not in data:
            return error_response("quantity_change is required", status_code=400)
        
        try:
            quantity_change = int(data["quantity_change"])
        except (ValueError, TypeError):
            return error_response("quantity_change must be a valid integer", status_code=400)
        
        # Calculate new quantity
        current_quantity = int(existing_product.get("quantity", 0))
        new_quantity = current_quantity + quantity_change
        
        # Validate new quantity
        if new_quantity < 0:
            return error_response(f"Cannot reduce stock by {abs(quantity_change)}. Current stock is only {current_quantity}", status_code=400)
        
        if new_quantity > 1000000:
            return error_response("Stock quantity cannot exceed 1,000,000 units", status_code=400)
        
        # Update stock
        result = supabase.table("products").update({
            "quantity": new_quantity, 
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", product_id).execute()
        
        if not result.data:
            return error_response("Failed to update stock", status_code=500)
        
        updated_product = result.data[0]
        threshold = int(existing_product.get("low_stock_threshold", 5))
        
        # Add stock status
        updated_product['is_low_stock'] = new_quantity <= threshold
        updated_product['stock_status'] = 'out_of_stock' if new_quantity == 0 else ('low_stock' if new_quantity <= threshold else 'in_stock')
        
        # Send notifications based on stock level changes
        try:
            supa_service = SupabaseService()
            
            # Low stock notification
            if new_quantity <= threshold and current_quantity > threshold:
                supa_service.notify_user(
                    str(owner_id),
                    "Low Stock Alert!",
                    f"Product '{existing_product['name']}' is now low on stock (Qty: {new_quantity}). Please restock soon.",
                    "warning"
                )
            # Out of stock notification
            elif new_quantity == 0 and current_quantity > 0:
                supa_service.notify_user(
                    str(owner_id),
                    "Out of Stock Alert!",
                    f"Product '{existing_product['name']}' is now out of stock. Immediate restocking required.",
                    "error"
                )
            # Stock replenished notification
            elif new_quantity > threshold and current_quantity <= threshold:
                supa_service.notify_user(
                    str(owner_id),
                    "Stock Replenished",
                    f"Product '{existing_product['name']}' stock has been replenished (Qty: {new_quantity}).",
                    "success"
                )
        except Exception as e:
            logger.warning(f"Failed to send stock notification: {e}")
        
        # Log the stock change
        change_type = "increased" if quantity_change > 0 else "decreased"
        logger.info(f"Stock {change_type} for product '{existing_product['name']}' (ID: {product_id}) by {abs(quantity_change)} units. New quantity: {new_quantity}")
        
        return success_response(
            message=f"Stock updated successfully. {change_type.title()} by {abs(quantity_change)} units.",
            data={
                "product": updated_product,
                "stock_change": {
                    "previous_quantity": current_quantity,
                    "quantity_change": quantity_change,
                    "new_quantity": new_quantity
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Error updating stock: {str(e)}")
        return error_response("Failed to update stock", status_code=500)

@product_bp.route("/bulk-update", methods=["PUT"])
@jwt_required()
def bulk_update_products():
    """Bulk update multiple products"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        data = request.get_json()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        if not data or not data.get("products"):
            return error_response("No products data provided", status_code=400)
        
        products_to_update = data["products"]
        if not isinstance(products_to_update, list):
            return error_response("Products must be a list", status_code=400)
        
        updated_products = []
        errors = []
        
        for product_update in products_to_update:
            try:
                product_id = product_update.get("id")
                if not product_id:
                    errors.append("Product ID is required for each product")
                    continue
                
                # Get existing product
                product = supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
                if not product.data:
                    errors.append(f"Product with ID {product_id} not found")
                    continue
                
                # Validate update data
                update_fields = {k: v for k, v in product_update.items() if k != "id"}
                validation_errors = validate_product_data(update_fields, is_update=True)
                if validation_errors:
                    errors.append(f"Product {product_id}: {'; '.join(validation_errors)}")
                    continue
                
                # Build update data
                update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
                
                for field, value in update_fields.items():
                    if field in ["name", "description", "category", "sku", "image_url"]:
                        update_data[field] = str(value).strip() if value else ""
                    elif field in ["price", "cost_price"]:
                        update_data[field] = float(value) if value is not None else 0
                    elif field in ["quantity", "low_stock_threshold"]:
                        update_data[field] = int(value) if value is not None else 0
                    elif field == "active":
                        update_data[field] = bool(value)
                
                # Update product
                result = supabase.table("products").update(update_data).eq("id", product_id).execute()
                if result.data:
                    updated_products.append(result.data[0])
                
            except Exception as e:
                errors.append(f"Product {product_id}: {str(e)}")
        
        if errors and not updated_products:
            return error_response("; ".join(errors), "Bulk update failed", status_code=400)
        
        response_data = {
            "updated_products": updated_products,
            "updated_count": len(updated_products),
            "total_requested": len(products_to_update)
        }
        
        if errors:
            response_data["errors"] = errors
            response_data["error_count"] = len(errors)
        
        message = f"Successfully updated {len(updated_products)} out of {len(products_to_update)} products"
        if errors:
            message += f" ({len(errors)} errors)"
        
        return success_response(
            message=message,
            data=response_data
        )
        
    except Exception as e:
        logger.error(f"Error in bulk update: {str(e)}")
        return error_response("Failed to perform bulk update", status_code=500)

@product_bp.route("/inventory-summary", methods=["GET"])
@jwt_required()
def get_inventory_summary():
    """Get comprehensive inventory summary and statistics"""
    try:
        supabase = get_supabase()
        owner_id = get_jwt_identity()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get all active products
        products = supabase.table("products").select("*").eq("owner_id", owner_id).eq("active", True).execute()
        
        if not products.data:
            return success_response(
                data={
                    "total_products": 0,
                    "total_inventory_value": 0,
                    "total_cost_value": 0,
                    "low_stock_count": 0,
                    "out_of_stock_count": 0,
                    "categories_summary": {},
                    "stock_status_summary": {
                        "in_stock": 0,
                        "low_stock": 0,
                        "out_of_stock": 0
                    }
                },
                message="No products found"
            )
        
        # Calculate summary statistics
        total_products = len(products.data)
        total_inventory_value = 0
        total_cost_value = 0
        low_stock_count = 0
        out_of_stock_count = 0
        categories_summary = {}
        stock_status_summary = {"in_stock": 0, "low_stock": 0, "out_of_stock": 0}
        
        for product in products.data:
            quantity = int(product.get("quantity", 0))
            price = float(product.get("price", 0))
            cost_price = float(product.get("cost_price", 0))
            threshold = int(product.get("low_stock_threshold", 5))
            category = product.get("category", "Other")
            
            # Calculate values
            total_inventory_value += quantity * price
            total_cost_value += quantity * cost_price
            
            # Stock status
            if quantity == 0:
                out_of_stock_count += 1
                stock_status_summary["out_of_stock"] += 1
            elif quantity <= threshold:
                low_stock_count += 1
                stock_status_summary["low_stock"] += 1
            else:
                stock_status_summary["in_stock"] += 1
            
            # Category summary
            if category not in categories_summary:
                categories_summary[category] = {
                    "count": 0,
                    "total_quantity": 0,
                    "total_value": 0,
                    "low_stock_count": 0
                }
            
            categories_summary[category]["count"] += 1
            categories_summary[category]["total_quantity"] += quantity
            categories_summary[category]["total_value"] += quantity * price
            if quantity <= threshold:
                categories_summary[category]["low_stock_count"] += 1
        
        return success_response(
            data={
                "total_products": total_products,
                "total_inventory_value": round(total_inventory_value, 2),
                "total_cost_value": round(total_cost_value, 2),
                "potential_profit": round(total_inventory_value - total_cost_value, 2),
                "low_stock_count": low_stock_count,
                "out_of_stock_count": out_of_stock_count,
                "categories_summary": categories_summary,
                "stock_status_summary": stock_status_summary,
                "alerts": {
                    "total_alerts": low_stock_count + out_of_stock_count,
                    "critical_alerts": out_of_stock_count,
                    "warning_alerts": low_stock_count
                }
            },
            message="Inventory summary retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting inventory summary: {str(e)}")
        return error_response("Failed to get inventory summary", status_code=500)




