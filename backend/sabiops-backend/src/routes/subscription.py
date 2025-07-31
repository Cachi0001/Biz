"""
Subscription Routes
Handles subscription-related API endpoints including payment verification and status checks
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging

from src.services.subscription_service import SubscriptionService
from src.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)

subscription_bp = Blueprint("subscription", __name__)

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
        "error": error,
        "message": message
    }), status_code

@subscription_bp.route("/status", methods=["GET"])
@jwt_required()
def get_subscription_status():
    """Get current user's subscription status"""
    try:
        user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        status = subscription_service.get_user_subscription_status(user_id)
        
        return success_response(
            data=status,
            message="Subscription status retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        return error_response(str(e), "Failed to get subscription status", 500)

@subscription_bp.route("/verify-payment", methods=["POST"])
@jwt_required()
def verify_payment():
    """Verify Paystack payment and upgrade subscription"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["reference", "plan_id"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", "Missing required field", 400)
        
        reference = data["reference"]
        plan_id = data["plan_id"]
        
        subscription_service = SubscriptionService()
        
        # Verify payment with Paystack
        logger.info(f"Verifying payment {reference} for user {user_id}")
        paystack_result = subscription_service.verify_paystack_payment(reference)
        
        if not paystack_result.get('success'):
            return error_response(
                paystack_result.get('error', 'Payment verification failed'),
                "Payment verification failed",
                400
            )
        
        # Upgrade subscription
        logger.info(f"Upgrading user {user_id} to plan {plan_id}")
        upgrade_result = subscription_service.upgrade_subscription(
            user_id, plan_id, reference, paystack_result
        )
        
        # Notify user of successful upgrade
        try:
            supa_service = SupabaseService()
            plan_name = upgrade_result['plan_config']['name']
            supa_service.notify_user(
                user_id,
                "Subscription Upgraded!",
                f"Your subscription has been upgraded to {plan_name}. Enjoy your new features!",
                "success"
            )
        except Exception as e:
            logger.warning(f"Failed to send upgrade notification: {str(e)}")
        
        return success_response(
            data={
                "subscription": upgrade_result['subscription'],
                "plan_config": upgrade_result['plan_config'],
                "usage_reset": upgrade_result['usage_reset'],
                "paystack_data": {
                    "reference": paystack_result['reference'],
                    "amount": paystack_result['amount'],
                    "channel": paystack_result['channel']
                }
            },
            message=upgrade_result['message']
        )
        
    except ValueError as e:
        logger.error(f"Validation error in payment verification: {str(e)}")
        return error_response(str(e), "Invalid request data", 400)
    except Exception as e:
        logger.error(f"Payment verification failed: {str(e)}")
        return error_response(str(e), "Payment verification failed", 500)

@subscription_bp.route("/upgrade", methods=["POST"])
@jwt_required()
def upgrade_subscription():
    """Direct subscription upgrade endpoint (for manual upgrades)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ["plan_id", "payment_reference"]
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", "Missing required field", 400)
        
        plan_id = data["plan_id"]
        payment_reference = data["payment_reference"]
        
        subscription_service = SubscriptionService()
        
        # Create mock paystack data for manual upgrades
        paystack_data = {
            "reference": payment_reference,
            "amount": data.get("amount", 0),
            "channel": "manual",
            "customer_email": data.get("customer_email", ""),
            "paid_at": datetime.now().isoformat()
        }
        
        upgrade_result = subscription_service.upgrade_subscription(
            user_id, plan_id, payment_reference, paystack_data
        )
        
        return success_response(
            data=upgrade_result,
            message="Subscription upgraded successfully"
        )
        
    except Exception as e:
        logger.error(f"Manual subscription upgrade failed: {str(e)}")
        return error_response(str(e), "Subscription upgrade failed", 500)

@subscription_bp.route("/usage-status", methods=["GET"])
@jwt_required()
def get_usage_status():
    """Get current usage status for all features"""
    try:
        user_id = get_jwt_identity()
        supabase = current_app.config['SUPABASE']
        
        # Get current usage from feature_usage table
        usage_result = supabase.table('feature_usage').select('*').eq('user_id', user_id).execute()
        
        # Get subscription status
        subscription_service = SubscriptionService()
        subscription_status = subscription_service.get_user_subscription_status(user_id)
        
        # Format usage data
        current_usage = {}
        for usage in usage_result.data:
            feature_type = usage['feature_type']
            current_usage[feature_type] = {
                'current': usage['current_count'],
                'limit': usage['limit_count'],
                'percentage': round((usage['current_count'] / usage['limit_count']) * 100, 1) if usage['limit_count'] > 0 else 0,
                'period_start': usage['period_start'],
                'period_end': usage['period_end']
            }
        
        # Ensure all feature types are present
        plan_config = subscription_status['plan_config']
        for feature_type, limit in plan_config['features'].items():
            if feature_type not in current_usage:
                current_usage[feature_type] = {
                    'current': 0,
                    'limit': limit,
                    'percentage': 0,
                    'period_start': None,
                    'period_end': None
                }
        
        return success_response(
            data={
                "current_usage": current_usage,
                "subscription": {
                    "plan": subscription_status['subscription_plan'],
                    "status": subscription_status['subscription_status'],
                    "days_remaining": subscription_status['remaining_days'],
                    "is_trial": subscription_status['is_trial'],
                    "is_active": subscription_status['is_active']
                },
                "plan_config": plan_config
            },
            message="Usage status retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting usage status: {str(e)}")
        return error_response(str(e), "Failed to get usage status", 500)

@subscription_bp.route("/activate-trial", methods=["POST"])
@jwt_required()
def activate_trial():
    """Activate 7-day free trial for new users"""
    try:
        user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        # Check if user already has an active subscription or trial
        current_status = subscription_service.get_user_subscription_status(user_id)
        
        if current_status['subscription_plan'] != 'free' or current_status['is_active']:
            return error_response(
                "User already has an active subscription or trial",
                "Trial activation not allowed",
                400
            )
        
        result = subscription_service.activate_trial(user_id)
        
        return success_response(
            data=result,
            message="Free trial activated successfully"
        )
        
    except Exception as e:
        logger.error(f"Trial activation failed: {str(e)}")
        return error_response(str(e), "Trial activation failed", 500)

@subscription_bp.route("/team-status/<team_member_id>", methods=["GET"])
@jwt_required()
def get_team_member_subscription_status(team_member_id):
    """Get subscription status for team member (inherits from owner)"""
    try:
        current_user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        # Check if current user is authorized to view this team member's status
        supabase = current_app.config['SUPABASE']
        user_result = supabase.table('users').select('*').eq('id', team_member_id).single().execute()
        
        if not user_result.data:
            return error_response("Team member not found", "Not found", 404)
        
        user_data = user_result.data
        owner_id = user_data.get('owner_id')
        
        # If user has no owner_id, they are the owner themselves
        if not owner_id:
            # Return their own subscription status
            status = subscription_service.get_user_subscription_status(team_member_id)
            return success_response(
                data=status,
                message="User subscription status retrieved successfully"
            )
        
        # Only business owner or the team member themselves can view status
        if current_user_id != owner_id and current_user_id != team_member_id:
            return error_response("Unauthorized", "Access denied", 403)
        
        # Get owner's subscription status (team members inherit)
        owner_status = subscription_service.get_user_subscription_status(owner_id)
        
        # Add team member specific information
        owner_status['is_team_member'] = True
        owner_status['business_owner_id'] = owner_id
        owner_status['team_member_id'] = team_member_id
        
        return success_response(
            data=owner_status,
            message="Team member subscription status retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting team member subscription status: {str(e)}")
        return error_response(str(e), "Failed to get team member status", 500)

@subscription_bp.route("/check-expired", methods=["POST"])
def check_expired_subscriptions():
    """Check and downgrade expired subscriptions (internal endpoint)"""
    try:
        # This endpoint should be called by a cron job or internal service
        # Add authentication check for internal services if needed
        
        subscription_service = SubscriptionService()
        count = subscription_service.check_and_update_expired_subscriptions()
        
        return success_response(
            data={"expired_count": count},
            message=f"Processed {count} expired subscriptions"
        )
        
    except Exception as e:
        logger.error(f"Error checking expired subscriptions: {str(e)}")
        return error_response(str(e), "Failed to check expired subscriptions", 500)

@subscription_bp.route("/unified-status", methods=["GET"])
@jwt_required()
def get_unified_subscription_status():
    """Get unified subscription status - single source of truth"""
    try:
        user_id = get_jwt_identity()
        
        # Get user data directly from database
        user_result = supabase.table('users').select('*').eq('id', user_id).single().execute()
        
        if not user_result.data:
            return error_response("User not found", "User not found", 404)
        
        user = user_result.data
        
        # Calculate remaining days
        remaining_days = 0
        is_trial = user.get('subscription_status') == 'trial'
        is_active = user.get('subscription_status') == 'active'
        
        if is_trial and user.get('trial_ends_at'):
            from datetime import datetime
            trial_end = datetime.fromisoformat(user['trial_ends_at'].replace('Z', '+00:00'))
            remaining_days = max(0, (trial_end - datetime.now()).days)
        elif is_active and user.get('subscription_end_date'):
            from datetime import datetime
            sub_end = datetime.fromisoformat(user['subscription_end_date'].replace('Z', '+00:00'))
            remaining_days = max(0, (sub_end - datetime.now()).days)
        
        # Build response
        status = {
            'subscription_plan': user.get('subscription_plan', 'free'),
            'subscription_status': user.get('subscription_status', 'inactive'),
            'unified_status': user.get('subscription_status', 'inactive'),
            'remaining_days': remaining_days,
            'trial_days_left': user.get('trial_days_left', 0),
            'is_trial': is_trial,
            'is_active': is_active or is_trial,
            'plan_config': {
                'name': f"{user.get('subscription_plan', 'free').title()} Plan",
                'features': {
                    'invoices': 100 if user.get('subscription_plan') == 'weekly' else 450 if user.get('subscription_plan') == 'monthly' else 6000 if user.get('subscription_plan') == 'yearly' else 5,
                    'expenses': 100 if user.get('subscription_plan') == 'weekly' else 500 if user.get('subscription_plan') == 'monthly' else 2000 if user.get('subscription_plan') == 'yearly' else 20,
                    'sales': 250 if user.get('subscription_plan') == 'weekly' else 1500 if user.get('subscription_plan') == 'monthly' else 18000 if user.get('subscription_plan') == 'yearly' else 50,
                    'products': 100 if user.get('subscription_plan') == 'weekly' else 500 if user.get('subscription_plan') == 'monthly' else 2000 if user.get('subscription_plan') == 'yearly' else 20
                }
            }
        }
        
        return success_response(
            data=status,
            message="Unified subscription status retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting unified subscription status: {str(e)}")
        return error_response(str(e), "Failed to get unified subscription status", 500)

@subscription_bp.route("/accurate-usage", methods=["GET"])
@jwt_required()
def get_accurate_usage():
    """Get accurate usage counts directly from database"""
    try:
        user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        usage_data = subscription_service.get_accurate_usage_counts(user_id)
        
        return success_response(
            data=usage_data,
            message="Accurate usage counts retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting accurate usage: {str(e)}")
        return error_response(str(e), "Failed to get accurate usage", 500)

@subscription_bp.route("/sync-usage", methods=["POST"])
@jwt_required()
def sync_usage_counts():
    """Sync usage counts with database reality"""
    try:
        user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        sync_result = subscription_service.sync_usage_counts(user_id)
        
        return success_response(
            data=sync_result,
            message="Usage counts synchronized successfully"
        )
        
    except Exception as e:
        logger.error(f"Error syncing usage counts: {str(e)}")
        return error_response(str(e), "Failed to sync usage counts", 500)

@subscription_bp.route("/validate-consistency", methods=["GET"])
@jwt_required()
def validate_usage_consistency():
    """Validate usage count consistency"""
    try:
        user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        validation_result = subscription_service.validate_usage_consistency(user_id)
        
        return success_response(
            data=validation_result,
            message="Usage consistency validation completed"
        )
        
    except Exception as e:
        logger.error(f"Error validating usage consistency: {str(e)}")
        return error_response(str(e), "Failed to validate usage consistency", 500)

@subscription_bp.route("/plans", methods=["GET"])
def get_available_plans():
    """Get all available subscription plans"""
    try:
        subscription_service = SubscriptionService()
        
        return success_response(
            data={
                "plans": subscription_service.PLAN_CONFIGS
            },
            message="Available plans retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting available plans: {str(e)}")
        return error_response(str(e), "Failed to get available plans", 500)

@subscription_bp.route("/upgrade-notifications", methods=["GET"])
@jwt_required()
def get_upgrade_notifications():
    """Get upgrade notifications and suggestions for the current user"""
    try:
        user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        # Get current subscription status
        status = subscription_service.get_unified_subscription_status(user_id)
        
        # Generate notifications based on usage and status
        notifications = []
        
        # Check if user is near limits
        if status.get('plan_config', {}).get('features'):
            for feature_type, limit in status['plan_config']['features'].items():
                current_usage = status.get('current_usage', {}).get(feature_type, 0)
                usage_percentage = (current_usage / limit * 100) if limit > 0 else 0
                
                if usage_percentage > 80:
                    notifications.append({
                        'id': f'usage_warning_{feature_type}',
                        'type': 'usage_warning',
                        'title': f'High {feature_type} usage',
                        'message': f'You\'ve used {usage_percentage:.1f}% of your {feature_type} limit',
                        'read': False,
                        'created_at': datetime.now().isoformat()
                    })
                
                if usage_percentage > 95:
                    notifications.append({
                        'id': f'upgrade_suggestion_{feature_type}',
                        'type': 'upgrade_suggestion',
                        'title': 'Upgrade Recommended',
                        'message': f'You\'re almost at your {feature_type} limit. Consider upgrading for more capacity.',
                        'read': False,
                        'created_at': datetime.now().isoformat()
                    })
        
        # Check trial status
        if status.get('is_trial') and status.get('trial_days_left', 0) <= 2:
            notifications.append({
                'id': 'trial_ending',
                'type': 'trial_ending',
                'title': 'Trial Ending Soon',
                'message': f'Your trial ends in {status.get("trial_days_left", 0)} days. Upgrade to continue using premium features.',
                'read': False,
                'created_at': datetime.now().isoformat()
            })
        
        # Check if subscription is expired
        if status.get('is_expired'):
            notifications.append({
                'id': 'subscription_expired',
                'type': 'subscription_expired',
                'title': 'Subscription Expired',
                'message': 'Your subscription has expired. Reactivate to continue using premium features.',
                'read': False,
                'created_at': datetime.now().isoformat()
            })
        
        return success_response(
            data={
                'notifications': notifications,
                'total': len(notifications),
                'unread': len([n for n in notifications if not n.get('read', False)]),
                'suggestions': len([n for n in notifications if n.get('type') == 'upgrade_suggestion'])
            },
            message="Upgrade notifications retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting upgrade notifications: {str(e)}")
        return error_response(str(e), "Failed to get upgrade notifications", 500)

@subscription_bp.route("/notifications/<notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        # In a real implementation, you would store this in the database
        # For now, we'll just return success
        return success_response(
            data={'notification_id': notification_id, 'read': True},
            message="Notification marked as read"
        )
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return error_response(str(e), "Failed to mark notification as read", 500)

@subscription_bp.route("/notifications/<notification_id>", methods=["DELETE"])
@jwt_required()
def dismiss_notification(notification_id):
    """Dismiss a notification"""
    try:
        # In a real implementation, you would remove this from the database
        # For now, we'll just return success
        return success_response(
            data={'notification_id': notification_id, 'dismissed': True},
            message="Notification dismissed"
        )
        
    except Exception as e:
        logger.error(f"Error dismissing notification: {str(e)}")
        return error_response(str(e), "Failed to dismiss notification", 500)

@subscription_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_subscription_analytics():
    """Get subscription analytics and usage insights"""
    try:
        user_id = get_jwt_identity()
        subscription_service = SubscriptionService()
        
        # Get current status
        status = subscription_service.get_unified_subscription_status(user_id)
        
        # Get usage data
        usage_data = subscription_service.get_accurate_usage_counts(user_id)
        
        # Generate analytics
        analytics = {
            'usage': {},
            'trends': {},
            'recommendations': {
                'upgrade': []
            }
        }
        
        # Process usage data
        if usage_data.get('usage_counts'):
            for feature_type, data in usage_data['usage_counts'].items():
                percentage = data.get('percentage_used', 0)
                analytics['usage'][feature_type] = {
                    'current': data.get('current_count', 0),
                    'limit': data.get('limit_count', 0),
                    'remaining': data.get('remaining', 0),
                    'percentage': percentage
                }
                
                # Generate recommendations
                if percentage > 80:
                    analytics['recommendations']['upgrade'].append({
                        'type': 'high_usage',
                        'feature': feature_type,
                        'percentage': percentage,
                        'message': f'Consider upgrading for more {feature_type} capacity'
                    })
        
        # Add trial recommendations
        if status.get('is_trial') and status.get('trial_days_left', 0) <= 3:
            analytics['recommendations']['upgrade'].append({
                'type': 'trial_ending',
                'message': 'Your trial is ending soon. Upgrade to continue using premium features.',
                'urgency': 'high'
            })
        
        return success_response(
            data=analytics,
            message="Subscription analytics retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting subscription analytics: {str(e)}")
        return error_response(str(e), "Failed to get subscription analytics", 500)