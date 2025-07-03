"""
Notification routes for Bizflow SME Nigeria
Handles both toast and push notifications
"""
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

logger = logging.getLogger(__name__)

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications"""
    try:
        user_id = get_jwt_identity()
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Try Supabase first, fallback to mock data
        if current_app.supabase_service.is_enabled():
            notifications = current_app.supabase_service.get_notifications(user_id, unread_only)
        else:
            # Mock notifications for development
            notifications = [
                {
                    "id": "1",
                    "title": "New Sale Recorded",
                    "message": "A new sale of ₦15,000 has been recorded",
                    "type": "success",
                    "read": False,
                    "created_at": "2025-01-16T10:30:00Z"
                },
                {
                    "id": "2", 
                    "title": "Low Stock Alert",
                    "message": "Product 'Office Chair' is running low (2 items left)",
                    "type": "warning",
                    "read": False,
                    "created_at": "2025-01-16T09:15:00Z"
                },
                {
                    "id": "3",
                    "title": "Payment Received",
                    "message": "Payment received for Invoice #INV-001",
                    "type": "success", 
                    "read": True,
                    "created_at": "2025-01-16T08:45:00Z"
                }
            ]
            
            if unread_only:
                notifications = [n for n in notifications if not n['read']]
        
        return jsonify({
            "notifications": notifications,
            "unread_count": len([n for n in notifications if not n.get('read', False)])
        }), 200
        
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        return jsonify({'error': 'Failed to fetch notifications'}), 500

@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        user_id = get_jwt_identity()
        
        if current_app.supabase_service.is_enabled():
            success = current_app.supabase_service.mark_notification_read(notification_id)
            if not success:
                return jsonify({'error': 'Failed to mark notification as read'}), 500
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        logger.error(f"Mark notification read error: {e}")
        return jsonify({'error': 'Failed to mark notification as read'}), 500

@notifications_bp.route('/send', methods=['POST'])
@jwt_required()
def send_notification():
    """Send notification to user (for testing)"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        title = data.get('title', 'Test Notification')
        message = data.get('message', 'This is a test notification')
        notification_type = data.get('type', 'info')
        
        if current_app.supabase_service.is_enabled():
            success = current_app.supabase_service.send_notification(
                user_id, title, message, notification_type
            )
            if not success:
                return jsonify({'error': 'Failed to send notification'}), 500
        
        return jsonify({'message': 'Notification sent successfully'}), 200
        
    except Exception as e:
        logger.error(f"Send notification error: {e}")
        return jsonify({'error': 'Failed to send notification'}), 500

@notifications_bp.route('/push/subscribe', methods=['POST'])
@jwt_required()
def subscribe_push():
    """Subscribe to push notifications"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Store push subscription details
        subscription = {
            "user_id": user_id,
            "endpoint": data.get('endpoint'),
            "keys": data.get('keys', {}),
            "active": True
        }
        
        if current_app.supabase_service.is_enabled():
            current_app.supabase_service.insert("push_subscriptions", subscription)
        
        return jsonify({'message': 'Push subscription saved'}), 200
        
    except Exception as e:
        logger.error(f"Push subscribe error: {e}")
        return jsonify({'error': 'Failed to subscribe to push notifications'}), 500

@notifications_bp.route('/push/unsubscribe', methods=['POST'])
@jwt_required()
def unsubscribe_push():
    """Unsubscribe from push notifications"""
    try:
        user_id = get_jwt_identity()
        
        if current_app.supabase_service.is_enabled():
            current_app.supabase_service.update(
                "push_subscriptions", 
                {"active": False}, 
                {"user_id": user_id}
            )
        
        return jsonify({'message': 'Push subscription removed'}), 200
        
    except Exception as e:
        logger.error(f"Push unsubscribe error: {e}")
        return jsonify({'error': 'Failed to unsubscribe from push notifications'}), 500