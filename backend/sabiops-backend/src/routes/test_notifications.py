"""
Test Notifications Routes
Temporary routes for testing notification functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import asyncio

from src.services.triggers.low_stock_trigger import create_low_stock_monitor
from src.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# Create blueprint
test_notifications_bp = Blueprint('test_notifications', __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config.get('SUPABASE')

def run_async(coro):
    """Helper to run async functions in Flask routes"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)

@test_notifications_bp.route('/test-low-stock', methods=['POST'])
@jwt_required()
def test_low_stock_notifications():
    """Test low stock notification system"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return jsonify({
                "success": False,
                "error": "Database connection not available"
            }), 500
        
        # Create low stock monitor
        monitor = create_low_stock_monitor(supabase)
        
        # Run low stock check
        result = run_async(monitor.check_all_products())
        
        return jsonify({
            "success": True,
            "message": "Low stock check completed",
            "data": result
        }), 200
        
    except Exception as e:
        logger.error(f"Error testing low stock notifications: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@test_notifications_bp.route('/test-notification-create', methods=['POST'])
@jwt_required()
def test_notification_create():
    """Test creating a notification directly"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return jsonify({
                "success": False,
                "error": "Database connection not available"
            }), 500
        
        # Create notification service
        notification_service = NotificationService(supabase)
        
        # Send a test low stock alert
        success, notification_id = run_async(
            notification_service.send_low_stock_alert(
                user_id=user_id,
                product_name="Test Product",
                current_quantity=2,
                threshold=5,
                product_id="test-product-id"
            )
        )
        
        return jsonify({
            "success": success,
            "message": "Test notification created" if success else "Failed to create notification",
            "notification_id": notification_id
        }), 200 if success else 500
        
    except Exception as e:
        logger.error(f"Error creating test notification: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@test_notifications_bp.route('/check-products', methods=['GET'])
@jwt_required()
def check_products():
    """Check current products and their stock levels"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return jsonify({
                "success": False,
                "error": "Database connection not available"
            }), 500
        
        # Get user's products
        products_result = supabase.table('products').select(
            'id, name, quantity, low_stock_threshold, reorder_level, active'
        ).eq('owner_id', user_id).eq('active', True).execute()
        
        products = products_result.data or []
        
        # Analyze stock levels
        low_stock_products = []
        for product in products:
            quantity = product['quantity']
            threshold = product.get('low_stock_threshold', 5)
            
            if quantity <= threshold:
                low_stock_products.append({
                    'id': product['id'],
                    'name': product['name'],
                    'quantity': quantity,
                    'threshold': threshold,
                    'status': 'out_of_stock' if quantity <= 0 else 'low_stock'
                })
        
        return jsonify({
            "success": True,
            "data": {
                "total_products": len(products),
                "low_stock_products": low_stock_products,
                "products": products
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking products: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@test_notifications_bp.route('/check-notifications', methods=['GET'])
@jwt_required()
def check_notifications():
    """Check current notifications for the user"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return jsonify({
                "success": False,
                "error": "Database connection not available"
            }), 500
        
        # Get user's notifications
        notifications_result = supabase.table('notifications').select(
            'id, title, message, type, data, read, created_at'
        ).eq('user_id', user_id).order('created_at', desc=True).limit(20).execute()
        
        notifications = notifications_result.data or []
        
        # Count unread notifications
        unread_count = len([n for n in notifications if not n['read']])
        
        return jsonify({
            "success": True,
            "data": {
                "total_notifications": len(notifications),
                "unread_count": unread_count,
                "notifications": notifications
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking notifications: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500