"""
Notifications routes for SabiOps backend
Handles notification management and push notifications
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import uuid
from src.services.firebase_service import send_push_notification

# Create blueprint
notifications_bp = Blueprint('notifications', __name__)

def get_supabase():
    """Get Supabase client from app config"""
    return current_app.config.get('SUPABASE')

def success_response(message="Success", data=None):
    """Standard success response format"""
    response = {
        "success": True,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return jsonify(response), 200

def error_response(message="An error occurred", status_code=400):
    """Standard error response format"""
    return jsonify({
        "success": False,
        "message": message
    }), status_code

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        
        # Build query
        query = supabase.table('notifications').select('*').eq('user_id', user_id)
        
        if unread_only:
            query = query.eq('read', False)
        
        # Execute query with ordering and limit
        result = query.order('created_at', desc=True).limit(limit).execute()
        
        if result.data is None:
            return error_response("Failed to fetch notifications", 500)
        
        notifications = result.data
        
        # Count unread notifications
        unread_result = supabase.table('notifications').select('id').eq('user_id', user_id).eq('read', False).execute()
        unread_count = len(unread_result.data) if unread_result.data else 0
        
        return success_response("Notifications fetched successfully", {
            "notifications": notifications,
            "unread_count": unread_count
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching notifications: {str(e)}")
        return error_response("Failed to fetch notifications", 500)

@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Update notification
        result = supabase.table('notifications').update({
            'read': True,
            'read_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', notification_id).eq('user_id', user_id).execute()
        
        if not result.data:
            return error_response("Notification not found", 404)
        
        return success_response("Notification marked as read")
        
    except Exception as e:
        current_app.logger.error(f"Error marking notification as read: {str(e)}")
        return error_response("Failed to mark notification as read", 500)

@notifications_bp.route('/send', methods=['POST'])
@jwt_required()
def send_notification():
    """Send a test notification (for testing purposes)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return error_response("No data provided", 400)
        
        title = data.get('title', 'Test Notification')
        message = data.get('message', 'This is a test notification')
        notification_type = data.get('type', 'info')
        
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Create notification
        notification_data = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'title': title,
            'message': message,
            'type': notification_type,
            'read': False,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table('notifications').insert(notification_data).execute()
        
        if not result.data:
            return error_response("Failed to create notification", 500)
        
        return success_response("Test notification sent successfully", result.data[0])
        
    except Exception as e:
        current_app.logger.error(f"Error sending notification: {str(e)}")
        return error_response("Failed to send notification", 500)

@notifications_bp.route('/push/subscribe', methods=['POST'])
@jwt_required()
def subscribe_push():
    """Subscribe to push notifications"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return error_response("No subscription data provided", 400)
        
        endpoint = data.get('endpoint')
        keys = data.get('keys', {})
        
        if not endpoint:
            return error_response("Endpoint is required", 400)
        
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Store push subscription
        subscription_data = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'endpoint': endpoint,
            'p256dh_key': keys.get('p256dh'),
            'auth_key': keys.get('auth'),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'active': True
        }
        
        # Check if subscription already exists
        existing = supabase.table('push_subscriptions').select('id').eq('user_id', user_id).eq('endpoint', endpoint).execute()
        
        if existing.data:
            # Update existing subscription
            result = supabase.table('push_subscriptions').update({
                'p256dh_key': keys.get('p256dh'),
                'auth_key': keys.get('auth'),
                'active': True,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', existing.data[0]['id']).execute()
        else:
            # Create new subscription
            result = supabase.table('push_subscriptions').insert(subscription_data).execute()
        
        return success_response("Push subscription saved successfully")
        
    except Exception as e:
        current_app.logger.error(f"Error subscribing to push notifications: {str(e)}")
        return error_response("Failed to subscribe to push notifications", 500)

@notifications_bp.route('/push/unsubscribe', methods=['POST'])
@jwt_required()
def unsubscribe_push():
    """Unsubscribe from push notifications"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Deactivate all push subscriptions for user
        result = supabase.table('push_subscriptions').update({
            'active': False,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('user_id', user_id).execute()
        
        return success_response("Push notifications unsubscribed successfully")
        
    except Exception as e:
        current_app.logger.error(f"Error unsubscribing from push notifications: {str(e)}")
        return error_response("Failed to unsubscribe from push notifications", 500)

@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", 500)
        
        # Update all unread notifications
        result = supabase.table('notifications').update({
            'read': True,
            'read_at': datetime.now(timezone.utc).isoformat()
        }).eq('user_id', user_id).eq('read', False).execute()
        
        return success_response("All notifications marked as read")
        
    except Exception as e:
        current_app.logger.error(f"Error marking all notifications as read: {str(e)}")
        return error_response("Failed to mark all notifications as read", 500)

@notifications_bp.route('/test-push', methods=['POST'])
@jwt_required()
def test_push():
    data = request.get_json()
    token = data.get('token')
    title = data.get('title', 'SabiOps Test Notification')
    body = data.get('body', 'This is a test push notification from SabiOps backend.')
    extra = data.get('data', {})
    if not token:
        return jsonify({'success': False, 'error': 'No device token provided'}), 400
    try:
        response = send_push_notification(token, title, body, extra)
        return jsonify({'success': True, 'response': response})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

