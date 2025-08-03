"""
Consolidated Notifications API Routes
Replaces both push_notifications.py and notifications.py with unified functionality
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import logging
import uuid
import asyncio
from typing import Dict, Any, List

from src.services.notification_service import NotificationService, NotificationType, NotificationData

logger = logging.getLogger(__name__)

# Create blueprint
notifications_bp = Blueprint('notifications', __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config.get('SUPABASE')

def get_notification_service():
    """Get NotificationService instance"""
    supabase = get_supabase()
    if not supabase:
        raise ValueError("Supabase client not available")
    return NotificationService(supabase)

def success_response(data=None, message="Success", status_code=200):
    """Standard success response format"""
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    """Standard error response format"""
    return jsonify({
        "success": False,
        "error": str(error),
        "message": message
    }), status_code

def run_async(coro):
    """Helper to run async functions in Flask routes"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)

# =============================================================================
# Core Notification Management
# =============================================================================

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        notification_service = get_notification_service()
        
        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = min(int(request.args.get('limit', 50)), 100)  # Max 100 per request
        
        # Get notifications
        notifications = run_async(notification_service.get_user_notifications(
            user_id, unread_only, limit
        ))
        
        # Get unread count
        unread_count = run_async(notification_service.get_unread_count(user_id))
        
        return success_response({
            "notifications": notifications,
            "unread_count": unread_count,
            "total_returned": len(notifications)
        }, "Notifications retrieved successfully")
        
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        return error_response(str(e), "Failed to get notifications", 500)

@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a specific notification as read"""
    try:
        user_id = get_jwt_identity()
        notification_service = get_notification_service()
        
        success = run_async(notification_service.mark_notification_read(notification_id, user_id))
        
        if success:
            return success_response(
                {"notification_id": notification_id},
                "Notification marked as read"
            )
        else:
            return error_response("Notification not found or access denied", status_code=404)
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return error_response(str(e), "Failed to mark notification as read", 500)

@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        notification_service = get_notification_service()
        
        success = run_async(notification_service.mark_all_notifications_read(user_id))
        
        if success:
            return success_response(
                {"user_id": user_id},
                "All notifications marked as read"
            )
        else:
            return error_response("Failed to mark notifications as read", status_code=500)
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return error_response(str(e), "Failed to mark all notifications as read", 500)

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a specific notification"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Delete notification (only if it belongs to the user)
        result = supabase.table('notifications').delete().eq(
            'id', notification_id
        ).eq('user_id', user_id).execute()
        
        if result.data:
            return success_response(
                {"notification_id": notification_id},
                "Notification deleted successfully"
            )
        else:
            return error_response("Notification not found or access denied", status_code=404)
        
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        return error_response(str(e), "Failed to delete notification", 500)

# =============================================================================
# Push Subscription Management
# =============================================================================

@notifications_bp.route('/push/register', methods=['POST'])
@jwt_required()
def register_fcm_token():
    """Register or update FCM token for push notifications"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('fcm_token'):
            return error_response("FCM token is required", "Missing required field", 400)
        
        fcm_token = data['fcm_token'].strip()
        device_type = data.get('device_type', 'web')
        device_info = data.get('device_info', {})
        
        # Validate device type
        valid_device_types = ['web', 'android', 'ios', 'desktop']
        if device_type not in valid_device_types:
            return error_response(
                f"Invalid device type. Must be one of: {', '.join(valid_device_types)}", 
                "Invalid device type", 
                400
            )
        
        # Check if token already exists
        existing_token = supabase.table('push_subscriptions').select('*').eq(
            'fcm_token', fcm_token
        ).execute()
        
        if existing_token.data:
            # Update existing token
            updated_token = supabase.table('push_subscriptions').update({
                'user_id': user_id,
                'device_type': device_type,
                'device_info': device_info,
                'active': True,
                'last_used_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('fcm_token', fcm_token).execute()
            
            if not updated_token.data:
                return error_response("Failed to update FCM token", status_code=500)
            
            return success_response(
                {
                    "subscription": updated_token.data[0],
                    "action": "updated"
                },
                "FCM token updated successfully"
            )
        else:
            # Create new token
            new_token = supabase.table('push_subscriptions').insert({
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'fcm_token': fcm_token,
                'device_type': device_type,
                'device_info': device_info,
                'active': True,
                'last_used_at': datetime.now(timezone.utc).isoformat(),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).execute()
            
            if not new_token.data:
                return error_response("Failed to register FCM token", status_code=500)
            
            return success_response(
                {
                    "subscription": new_token.data[0],
                    "action": "created"
                },
                "FCM token registered successfully",
                status_code=201
            )
            
    except Exception as e:
        logger.error(f"Error registering FCM token: {str(e)}")
        return error_response(str(e), "Failed to register FCM token", 500)

@notifications_bp.route('/push/tokens', methods=['GET'])
@jwt_required()
def get_user_fcm_tokens():
    """Get all FCM tokens for the current user"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get user's FCM tokens
        tokens = supabase.table('push_subscriptions').select('*').eq(
            'user_id', user_id
        ).eq('active', True).order('created_at', desc=True).execute()
        
        return success_response(
            {
                "tokens": tokens.data or [],
                "total_count": len(tokens.data or [])
            },
            "FCM tokens retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting FCM tokens: {str(e)}")
        return error_response(str(e), "Failed to get FCM tokens", 500)

@notifications_bp.route('/push/tokens/<token_id>', methods=['DELETE'])
@jwt_required()
def remove_fcm_token(token_id):
    """Remove a specific FCM token"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Check if token belongs to user and deactivate it
        result = supabase.table('push_subscriptions').update({
            'active': False,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', token_id).eq('user_id', user_id).execute()
        
        if result.data:
            return success_response(
                {"token_id": token_id},
                "FCM token removed successfully"
            )
        else:
            return error_response("FCM token not found or access denied", status_code=404)
        
    except Exception as e:
        logger.error(f"Error removing FCM token: {str(e)}")
        return error_response(str(e), "Failed to remove FCM token", 500)

# =============================================================================
# Notification Preferences Management
# =============================================================================

@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Get user's notification preferences"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get user preferences
        preferences = supabase.table('user_notification_preferences').select('*').eq(
            'user_id', user_id
        ).execute()
        
        # If no preferences exist, create defaults
        if not preferences.data:
            default_preferences = [
                {"notification_type": "low_stock_alert", "enabled": True, "push_enabled": True},
                {"notification_type": "overdue_invoice", "enabled": True, "push_enabled": True},
                {"notification_type": "usage_limit_warning", "enabled": True, "push_enabled": True},
                {"notification_type": "subscription_expiry", "enabled": True, "push_enabled": True},
                {"notification_type": "profit_alert", "enabled": True, "push_enabled": True},
                {"notification_type": "payment_received", "enabled": True, "push_enabled": False},
                {"notification_type": "system_update", "enabled": True, "push_enabled": True},
                {"notification_type": "invoice_created", "enabled": False, "push_enabled": False},
                {"notification_type": "sale_completed", "enabled": False, "push_enabled": False},
                {"notification_type": "team_activity", "enabled": False, "push_enabled": False}
            ]
            
            return success_response(
                {
                    "preferences": default_preferences,
                    "total_count": len(default_preferences),
                    "note": "Default preferences - not yet saved to database"
                },
                "Default notification preferences retrieved"
            )
        
        return success_response(
            {
                "preferences": preferences.data,
                "total_count": len(preferences.data)
            },
            "Notification preferences retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting notification preferences: {str(e)}")
        return error_response(str(e), "Failed to get notification preferences", 500)

@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_notification_preferences():
    """Update user's notification preferences"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        data = request.get_json()
        
        if not data or 'preferences' not in data:
            return error_response("Preferences data is required", "Missing required field", 400)
        
        preferences = data['preferences']
        
        if not isinstance(preferences, list):
            return error_response("Preferences must be a list", "Invalid data format", 400)
        
        # Update or insert each preference
        updated_preferences = []
        for pref in preferences:
            if not isinstance(pref, dict) or 'notification_type' not in pref:
                continue
            
            pref_data = {
                'user_id': user_id,
                'notification_type': pref['notification_type'],
                'enabled': pref.get('enabled', True),
                'push_enabled': pref.get('push_enabled', True),
                'quiet_hours_start': pref.get('quiet_hours_start'),
                'quiet_hours_end': pref.get('quiet_hours_end'),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Upsert preference
            result = supabase.table('user_notification_preferences').upsert(
                pref_data, 
                on_conflict='user_id,notification_type'
            ).execute()
            
            if result.data:
                updated_preferences.extend(result.data)
        
        return success_response(
            {
                "updated_preferences": updated_preferences,
                "total_updated": len(updated_preferences)
            },
            "Notification preferences updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating notification preferences: {str(e)}")
        return error_response(str(e), "Failed to update notification preferences", 500)

# =============================================================================
# Testing and Admin Functions
# =============================================================================

@notifications_bp.route('/test', methods=['POST'])
@jwt_required()
def send_test_notification():
    """Send a test notification"""
    try:
        user_id = get_jwt_identity()
        notification_service = get_notification_service()
        
        data = request.get_json() or {}
        
        # Create test notification
        notification_data = NotificationData(
            title=data.get('title', 'Test Notification'),
            message=data.get('message', 'This is a test notification from SabiOps!'),
            type=NotificationType.SYSTEM_UPDATE,
            data={'test': True},
            navigation_url=data.get('navigation_url', '/dashboard'),
            priority=data.get('priority', 'low')
        )
        
        success, notification_id = run_async(
            notification_service.create_notification(user_id, notification_data)
        )
        
        if success:
            return success_response(
                {
                    "notification_id": notification_id,
                    "sent": True
                },
                "Test notification sent successfully"
            )
        else:
            return error_response(
                "Failed to send test notification",
                "Test notification failed",
                500
            )
            
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        return error_response(str(e), "Failed to send test notification", 500)

@notifications_bp.route('/cleanup', methods=['POST'])
@jwt_required()
def cleanup_old_notifications():
    """Clean up old notifications (admin function)"""
    try:
        user_id = get_jwt_identity()
        notification_service = get_notification_service()
        
        # Get days parameter (default 30 days)
        days_old = int(request.args.get('days', 30))
        
        # For now, only allow users to clean their own notifications
        # In production, this might be an admin-only function
        
        cleaned_count = run_async(notification_service.cleanup_old_notifications(days_old))
        
        return success_response(
            {
                "cleaned_count": cleaned_count,
                "days_old": days_old
            },
            f"Cleaned up {cleaned_count} old notifications"
        )
        
    except Exception as e:
        logger.error(f"Error cleaning up notifications: {str(e)}")
        return error_response(str(e), "Failed to clean up notifications", 500)

# =============================================================================
# Business Logic Notification Endpoints (for manual triggers)
# =============================================================================

@notifications_bp.route('/business/low-stock', methods=['POST'])
@jwt_required()
def send_low_stock_notification():
    """Manually send a low stock notification"""
    try:
        user_id = get_jwt_identity()
        notification_service = get_notification_service()
        
        data = request.get_json()
        
        if not data:
            return error_response("Request data is required", status_code=400)
        
        required_fields = ['product_name', 'current_quantity', 'threshold']
        for field in required_fields:
            if field not in data:
                return error_response(f"Field '{field}' is required", status_code=400)
        
        success, notification_id = run_async(
            notification_service.send_low_stock_alert(
                user_id=user_id,
                product_name=data['product_name'],
                current_quantity=data['current_quantity'],
                threshold=data['threshold'],
                product_id=data.get('product_id')
            )
        )
        
        if success:
            return success_response(
                {"notification_id": notification_id},
                "Low stock notification sent successfully"
            )
        else:
            return error_response("Failed to send low stock notification", status_code=500)
        
    except Exception as e:
        logger.error(f"Error sending low stock notification: {str(e)}")
        return error_response(str(e), "Failed to send low stock notification", 500)

@notifications_bp.route('/business/overdue-invoice', methods=['POST'])
@jwt_required()
def send_overdue_invoice_notification():
    """Manually send an overdue invoice notification"""
    try:
        user_id = get_jwt_identity()
        notification_service = get_notification_service()
        
        data = request.get_json()
        
        if not data:
            return error_response("Request data is required", status_code=400)
        
        required_fields = ['customer_name', 'invoice_number', 'amount', 'days_overdue']
        for field in required_fields:
            if field not in data:
                return error_response(f"Field '{field}' is required", status_code=400)
        
        success, notification_id = run_async(
            notification_service.send_overdue_invoice_alert(
                user_id=user_id,
                customer_name=data['customer_name'],
                invoice_number=data['invoice_number'],
                amount=float(data['amount']),
                days_overdue=int(data['days_overdue']),
                invoice_id=data.get('invoice_id')
            )
        )
        
        if success:
            return success_response(
                {"notification_id": notification_id},
                "Overdue invoice notification sent successfully"
            )
        else:
            return error_response("Failed to send overdue invoice notification", status_code=500)
        
    except Exception as e:
        logger.error(f"Error sending overdue invoice notification: {str(e)}")
        return error_response(str(e), "Failed to send overdue invoice notification", 500)

# =============================================================================
# Health Check and Status
# =============================================================================

@notifications_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        supabase = get_supabase()
        firebase_available = current_app.config.get('FIREBASE_AVAILABLE', False)
        
        return success_response({
            "status": "healthy",
            "database_connected": bool(supabase),
            "firebase_available": firebase_available,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, "Notification service is healthy")
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return error_response(str(e), "Health check failed", 500)

# =============================================================================
# Error Handlers
# =============================================================================

@notifications_bp.errorhandler(404)
def not_found(error):
    return error_response("Endpoint not found", "Not Found", 404)

@notifications_bp.errorhandler(405)
def method_not_allowed(error):
    return error_response("Method not allowed", "Method Not Allowed", 405)

@notifications_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return error_response("Internal server error", "Internal Server Error", 500)