"""
Test Subscription Tracking Routes
Test endpoints for verifying subscription day tracking and real-time updates
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, timedelta
import logging

from src.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)

test_subscription_bp = Blueprint("test_subscription", __name__)

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

@test_subscription_bp.route("/create-test-subscription", methods=["POST"])
@jwt_required()
def create_test_subscription():
    """Create a test subscription for testing day countdown"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        plan_id = data.get('plan_id', 'weekly')
        days_from_now = data.get('days_from_now', 7)
        
        # Calculate end date
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=days_from_now)
        
        # Update user subscription data directly
        supabase = current_app.config['SUPABASE']
        
        update_data = {
            'subscription_plan': plan_id,
            'subscription_status': 'active',
            'subscription_end_date': end_date.isoformat(),
            'trial_days_left': 0,
            'updated_at': start_date.isoformat()
        }
        
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        if not result.data:
            return error_response("Failed to create test subscription", status_code=500)
        
        # Get the updated subscription status
        subscription_service = SubscriptionService()
        status = subscription_service.get_unified_subscription_status(user_id)
        
        return success_response(
            data={
                'test_subscription': {
                    'plan_id': plan_id,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days_from_now': days_from_now
                },
                'current_status': status
            },
            message=f"Test subscription created with {days_from_now} days remaining"
        )
        
    except Exception as e:
        logger.error(f"Error creating test subscription: {str(e)}")
        return error_response(str(e), "Failed to create test subscription", 500)

@test_subscription_bp.route("/simulate-day-passage", methods=["POST"])
@jwt_required()
def simulate_day_passage():
    """Simulate the passage of days by moving subscription end date"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        days_to_subtract = data.get('days_to_subtract', 1)
        
        supabase = current_app.config['SUPABASE']
        
        # Get current user data
        user_result = supabase.table('users').select('*').eq('id', user_id).single().execute()
        
        if not user_result.data:
            return error_response("User not found", status_code=404)
        
        user = user_result.data
        current_end_date = user.get('subscription_end_date')
        
        if not current_end_date:
            return error_response("No active subscription found", status_code=400)
        
        # Parse current end date and subtract days
        end_date = datetime.fromisoformat(current_end_date.replace('Z', '+00:00'))
        new_end_date = end_date - timedelta(days=days_to_subtract)
        
        # Update the subscription end date
        update_data = {
            'subscription_end_date': new_end_date.isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        if not result.data:
            return error_response("Failed to update subscription", status_code=500)
        
        # Get updated status
        subscription_service = SubscriptionService()
        status = subscription_service.get_unified_subscription_status(user_id)
        
        return success_response(
            data={
                'simulation': {
                    'days_subtracted': days_to_subtract,
                    'old_end_date': current_end_date,
                    'new_end_date': new_end_date.isoformat(),
                    'days_remaining': status['remaining_days']
                },
                'current_status': status
            },
            message=f"Simulated {days_to_subtract} days passage"
        )
        
    except Exception as e:
        logger.error(f"Error simulating day passage: {str(e)}")
        return error_response(str(e), "Failed to simulate day passage", 500)

@test_subscription_bp.route("/test-expiration", methods=["POST"])
@jwt_required()
def test_expiration():
    """Test subscription expiration by setting end date to past"""
    try:
        user_id = get_jwt_identity()
        
        supabase = current_app.config['SUPABASE']
        
        # Set subscription end date to yesterday
        past_date = datetime.now(timezone.utc) - timedelta(days=1)
        
        update_data = {
            'subscription_end_date': past_date.isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        if not result.data:
            return error_response("Failed to update subscription", status_code=500)
        
        # Get updated status (should trigger expiration)
        subscription_service = SubscriptionService()
        status = subscription_service.get_unified_subscription_status(user_id)
        
        return success_response(
            data={
                'expiration_test': {
                    'end_date_set_to': past_date.isoformat(),
                    'should_be_expired': True
                },
                'current_status': status
            },
            message="Subscription expiration test completed"
        )
        
    except Exception as e:
        logger.error(f"Error testing expiration: {str(e)}")
        return error_response(str(e), "Failed to test expiration", 500)

@test_subscription_bp.route("/test-trial", methods=["POST"])
@jwt_required()
def test_trial():
    """Test trial subscription with countdown"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        trial_days = data.get('trial_days', 7)
        
        supabase = current_app.config['SUPABASE']
        
        # Set up trial subscription
        now = datetime.now(timezone.utc)
        end_date = now + timedelta(days=trial_days)
        
        update_data = {
            'subscription_plan': 'weekly',
            'subscription_status': 'trial',
            'subscription_end_date': end_date.isoformat(),
            'trial_days_left': trial_days,
            'updated_at': now.isoformat()
        }
        
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        if not result.data:
            return error_response("Failed to create trial", status_code=500)
        
        # Get updated status
        subscription_service = SubscriptionService()
        status = subscription_service.get_unified_subscription_status(user_id)
        
        return success_response(
            data={
                'trial_setup': {
                    'trial_days': trial_days,
                    'end_date': end_date.isoformat(),
                    'should_be_trial': True
                },
                'current_status': status
            },
            message=f"Trial subscription created with {trial_days} days"
        )
        
    except Exception as e:
        logger.error(f"Error creating trial: {str(e)}")
        return error_response(str(e), "Failed to create trial", 500)

@test_subscription_bp.route("/reset-to-free", methods=["POST"])
@jwt_required()
def reset_to_free():
    """Reset user to free plan"""
    try:
        user_id = get_jwt_identity()
        
        supabase = current_app.config['SUPABASE']
        
        # Reset to free plan
        update_data = {
            'subscription_plan': 'free',
            'subscription_status': 'inactive',
            'subscription_end_date': None,
            'trial_days_left': 0,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        if not result.data:
            return error_response("Failed to reset to free", status_code=500)
        
        # Get updated status
        subscription_service = SubscriptionService()
        status = subscription_service.get_unified_subscription_status(user_id)
        
        return success_response(
            data={
                'reset': {
                    'plan': 'free',
                    'status': 'inactive'
                },
                'current_status': status
            },
            message="User reset to free plan"
        )
        
    except Exception as e:
        logger.error(f"Error resetting to free: {str(e)}")
        return error_response(str(e), "Failed to reset to free", 500)

@test_subscription_bp.route("/status-comparison", methods=["GET"])
@jwt_required()
def status_comparison():
    """Compare different status endpoints for consistency"""
    try:
        user_id = get_jwt_identity()
        
        subscription_service = SubscriptionService()
        
        # Get status from different methods
        unified_status = subscription_service.get_unified_subscription_status(user_id)
        
        # Get direct database data
        supabase = current_app.config['SUPABASE']
        user_result = supabase.table('users').select('*').eq('id', user_id).single().execute()
        
        comparison = {
            'unified_status': unified_status,
            'raw_database': user_result.data if user_result.data else None,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Check for inconsistencies
        inconsistencies = []
        
        if user_result.data:
            db_plan = user_result.data.get('subscription_plan')
            unified_plan = unified_status.get('subscription_plan')
            
            if db_plan != unified_plan:
                inconsistencies.append(f"Plan mismatch: DB={db_plan}, Unified={unified_plan}")
            
            db_status = user_result.data.get('subscription_status')
            unified_unified_status = unified_status.get('unified_status')
            
            if db_status != unified_unified_status:
                inconsistencies.append(f"Status mismatch: DB={db_status}, Unified={unified_unified_status}")
        
        comparison['inconsistencies'] = inconsistencies
        comparison['is_consistent'] = len(inconsistencies) == 0
        
        return success_response(
            data=comparison,
            message="Status comparison completed"
        )
        
    except Exception as e:
        logger.error(f"Error in status comparison: {str(e)}")
        return error_response(str(e), "Failed to compare status", 500)

@test_subscription_bp.route("/test-real-time-updates", methods=["GET"])
@jwt_required()
def test_real_time_updates():
    """Test real-time subscription updates over multiple calls"""
    try:
        user_id = get_jwt_identity()
        
        subscription_service = SubscriptionService()
        
        # Make multiple calls to see if data is consistent
        calls = []
        for i in range(5):
            status = subscription_service.get_unified_subscription_status(user_id)
            calls.append({
                'call_number': i + 1,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'days_remaining': status.get('remaining_days'),
                'unified_status': status.get('unified_status'),
                'plan': status.get('subscription_plan')
            })
        
        # Check consistency
        first_call = calls[0]
        is_consistent = all(
            call['days_remaining'] == first_call['days_remaining'] and
            call['unified_status'] == first_call['unified_status'] and
            call['plan'] == first_call['plan']
            for call in calls
        )
        
        return success_response(
            data={
                'calls': calls,
                'is_consistent': is_consistent,
                'test_passed': is_consistent
            },
            message="Real-time updates test completed"
        )
        
    except Exception as e:
        logger.error(f"Error testing real-time updates: {str(e)}")
        return error_response(str(e), "Failed to test real-time updates", 500)