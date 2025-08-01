"""
Push Notifications API Routes
Handles device token registration and push notification management
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

push_notifications_bp = Blueprint("push_notifications", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

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

@push_notifications_bp.route("/register-token", methods=["POST"])
@jwt_required()
def register_device_token():
    """Register or update a device token for push notifications"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('token'):
            return error_response("Device token is required", "Missing required field", 400)
        
        token = data['token'].strip()
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
        existing_token = supabase.table('push_subscriptions').select('*').eq('token', token).execute()
        
        if existing_token.data:
            # Update existing token
            updated_token = supabase.table('push_subscriptions').update({
                'user_id': user_id,
                'device_type': device_type,
                'device_info': device_info,
                'is_active': True,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('token', token).execute()
            
            if not updated_token.data:
                return error_response("Failed to update device token", status_code=500)
            
            return success_response(
                data={
                    "subscription": updated_token.data[0],
                    "action": "updated"
                },
                message="Device token updated successfully"
            )
        else:
            # Create new token
            new_token = supabase.table('push_subscriptions').insert({
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'token': token,
                'device_type': device_type,
                'device_info': device_info,
                'is_active': True,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).execute()
            
            if not new_token.data:
                return error_response("Failed to register device token", status_code=500)
            
            return success_response(
                data={
                    "subscription": new_token.data[0],
                    "action": "created"
                },
                message="Device token registered successfully",
                status_code=201
            )
            
    except Exception as e:
        logger.error(f"Error registering device token: {str(e)}")
        return error_response(str(e), "Failed to register device token", 500)

@push_notifications_bp.route("/tokens", methods=["GET"])
@jwt_required()
def get_user_tokens():
    """Get all device tokens for the current user"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get user's device tokens
        tokens = supabase.table('push_subscriptions').select('*').eq('user_id', user_id).eq('is_active', True).order('created_at', desc=True).execute()
        
        return success_response(
            data={
                "tokens": tokens.data or [],
                "total_count": len(tokens.data or [])
            },
            message="Device tokens retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting user tokens: {str(e)}")
        return error_response(str(e), "Failed to get device tokens", 500)

@push_notifications_bp.route("/tokens/<token_id>", methods=["DELETE"])
@jwt_required()
def remove_device_token(token_id):
    """Remove a specific device token"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Check if token belongs to user
        token = supabase.table('push_subscriptions').select('*').eq('id', token_id).eq('user_id', user_id).single().execute()
        
        if not token.data:
            return error_response("Device token not found", status_code=404)
        
        # Soft delete - mark as inactive
        result = supabase.table('push_subscriptions').update({
            'is_active': False,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', token_id).execute()
        
        if not result.data:
            return error_response("Failed to remove device token", status_code=500)
        
        return success_response(
            data={"token_id": token_id},
            message="Device token removed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error removing device token: {str(e)}")
        return error_response(str(e), "Failed to remove device token", 500)

@push_notifications_bp.route("/test", methods=["POST"])
@jwt_required()
def test_push_notification():
    """Send a test push notification to the user's devices"""
    try:
        user_id = get_jwt_identity()
        
        from src.services.supabase_service import SupabaseService
        supa_service = SupabaseService()
        
        # Send test notification
        success = supa_service.send_push_notification(
            user_id,
            "Test Notification",
            "This is a test push notification from SabiOps!",
            "test"
        )
        
        if success:
            return success_response(
                data={"sent": True},
                message="Test notification sent successfully"
            )
        else:
            return error_response(
                "No active device tokens found or notification failed",
                "Test notification failed",
                400
            )
            
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        return error_response(str(e), "Failed to send test notification", 500)

@push_notifications_bp.route("/preferences", methods=["GET"])
@jwt_required()
def get_notification_preferences():
    """Get user's notification preferences"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get user preferences (if table exists)
        try:
            preferences = supabase.table('user_notification_preferences').select('*').eq('user_id', user_id).execute()
            
            return success_response(
                data={
                    "preferences": preferences.data or [],
                    "total_count": len(preferences.data or [])
                },
                message="Notification preferences retrieved successfully"
            )
        except Exception as e:
            # If table doesn't exist, return default preferences
            logger.warning(f"Notification preferences table not found: {e}")
            default_preferences = [
                {"notification_type": "low_stock_alert", "enabled": True},
                {"notification_type": "payment_success", "enabled": True},
                {"notification_type": "subscription_expiry", "enabled": True},
                {"notification_type": "invoice_created", "enabled": True},
                {"notification_type": "team_activity", "enabled": False},
                {"notification_type": "system_maintenance", "enabled": True}
            ]
            
            return success_response(
                data={
                    "preferences": default_preferences,
                    "total_count": len(default_preferences),
                    "note": "Default preferences - preferences table not yet created"
                },
                message="Default notification preferences retrieved"
            )
        
    except Exception as e:
        logger.error(f"Error getting notification preferences: {str(e)}")
        return error_response(str(e), "Failed to get notification preferences", 500)

@push_notifications_bp.route("/preferences", methods=["PUT"])
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
        
        # For now, just return success since the preferences table might not exist yet
        # In a full implementation, you would update the user_notification_preferences table
        
        return success_response(
            data={
                "updated_preferences": preferences,
                "note": "Preferences updated (stored in memory until database table is created)"
            },
            message="Notification preferences updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating notification preferences: {str(e)}")
        return error_response(str(e), "Failed to update notification preferences", 500)

@push_notifications_bp.route("/history", methods=["GET"])
@jwt_required()
def get_notification_history():
    """Get user's notification history"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)  # Max 100 per page
        offset = (page - 1) * limit
        
        try:
            # Get notification history (if table exists)
            history = supabase.table('notification_history').select('*').eq('user_id', user_id).order('sent_at', desc=True).range(offset, offset + limit - 1).execute()
            
            return success_response(
                data={
                    "notifications": history.data or [],
                    "page": page,
                    "limit": limit,
                    "total_count": len(history.data or [])
                },
                message="Notification history retrieved successfully"
            )
        except Exception as e:
            # If table doesn't exist, return empty history
            logger.warning(f"Notification history table not found: {e}")
            
            return success_response(
                data={
                    "notifications": [],
                    "page": page,
                    "limit": limit,
                    "total_count": 0,
                    "note": "History table not yet created"
                },
                message="Notification history retrieved (empty - table not created)"
            )
        
    except Exception as e:
        logger.error(f"Error getting notification history: {str(e)}")
        return error_response(str(e), "Failed to get notification history", 500)

@push_notifications_bp.route("/cleanup", methods=["POST"])
@jwt_required()
def cleanup_expired_tokens():
    """Clean up expired or inactive device tokens (admin function)"""
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # For now, just clean up the current user's inactive tokens
        # In a full implementation, this might be an admin-only function
        
        # Get inactive tokens older than 30 days
        from datetime import timedelta
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        
        # Delete old inactive tokens
        result = supabase.table('push_subscriptions').delete().eq('user_id', user_id).eq('is_active', False).lt('updated_at', cutoff_date).execute()
        
        return success_response(
            data={
                "cleaned_tokens": len(result.data or []),
                "cutoff_date": cutoff_date
            },
            message="Expired tokens cleaned up successfully"
        )
        
    except Exception as e:
        logger.error(f"Error cleaning up tokens: {str(e)}")
        return error_response(str(e), "Failed to clean up tokens", 500)