"""
Subscription upgrade routes with referral earning processing
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import logging
import os
import requests

logger = logging.getLogger(__name__)

subscription_upgrade_bp = Blueprint('subscription_upgrade', __name__)

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
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

def verify_paystack_payment(reference):
    """Verify payment with Paystack"""
    try:
        PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
        PAYSTACK_BASE_URL = "https://api.paystack.co"

        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers=headers
        )
        
        if response.status_code == 200:
            paystack_response = response.json()
            return paystack_response["status"] and paystack_response["data"]["status"] == "success"
        
        return False
    except Exception as e:
        logger.error(f"Error verifying Paystack payment: {e}")
        return False

@subscription_upgrade_bp.route('/upgrade', methods=['POST'])
@jwt_required()
def upgrade_subscription():
    """
    Upgrade user subscription and process referral earnings
    Only Monthly and Yearly plans generate referral earnings
    """
    try:
        user_id = get_jwt_identity()
        supabase = get_supabase()
        
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        data = request.get_json()
        new_plan = data.get('plan')  # 'monthly' or 'yearly'
        payment_reference = data.get('payment_reference')
        
        if not new_plan or new_plan not in ['monthly', 'yearly']:
            return error_response("Invalid subscription plan. Only monthly and yearly plans available.", status_code=400)
        
        if not payment_reference:
            return error_response("Payment reference is required", status_code=400)
        
        # Get user from Supabase
        user_result = supabase.table("users").select("*").eq("id", user_id).single().execute()
        if not user_result.data:
            return error_response("User not found", status_code=404)
        
        user = user_result.data
        
        # Verify payment with Paystack
        if not verify_paystack_payment(payment_reference):
            return error_response("Payment verification failed", status_code=400)
        
        # Calculate subscription end date
        now = datetime.now()
        if new_plan == 'monthly':
            subscription_end = now + timedelta(days=30)
        elif new_plan == 'yearly':
            subscription_end = now + timedelta(days=365)
        
        # Update user subscription
        update_data = {
            "subscription_plan": new_plan,
            "subscription_status": "active",
            "trial_ends_at": None,  # End trial
            "subscription_start_date": now.isoformat(),
            "subscription_end_date": subscription_end.isoformat(),
            "updated_at": now.isoformat()
        }
        
        supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        # Process referral earning (only for monthly and yearly)
        referral_processed = False
        if user.get("referred_by") and new_plan in ['monthly', 'yearly']:
            # Calculate referral earning
            earning_amount = 500 if new_plan == 'monthly' else 5000
            
            # Create referral earning record
            earning_data = {
                "referrer_id": user["referred_by"],
                "referred_user_id": user_id,
                "earning_type": new_plan,
                "amount": earning_amount,
                "commission_rate": 10.0,
                "source_id": user_id,
                "source_type": "subscription",
                "status": "confirmed",
                "earned_at": now.isoformat(),
                "confirmed_at": now.isoformat()
            }
            
            supabase.table("referral_earnings").insert(earning_data).execute()
            
            # Update referrer's balance
            referrer_result = supabase.table("users").select("referral_earnings").eq("id", user["referred_by"]).single().execute()
            if referrer_result.data:
                current_balance = referrer_result.data.get("referral_earnings", 0) or 0
                new_balance = current_balance + earning_amount
                supabase.table("users").update({"referral_earnings": new_balance}).eq("id", user["referred_by"]).execute()
                referral_processed = True
        
        # Create payment record
        payment_data = {
            "user_id": user_id,
            "amount": 4500 if new_plan == 'monthly' else 50000,
            "currency": "NGN",
            "description": f"Subscription upgrade to {new_plan} plan",
            "payment_gateway": "paystack",
            "gateway_reference": payment_reference,
            "status": "successful",
            "payment_method": "card",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        supabase.table("payments").insert(payment_data).execute()
        
        response_data = {
            'message': 'Subscription upgraded successfully',
            'subscription': {
                'plan': new_plan,
                'status': 'active',
                'start_date': now.isoformat(),
                'end_date': subscription_end.isoformat()
            },
            'referral_processed': referral_processed
        }
        
        if referral_processed:
            response_data['referral_earning'] = f"₦{earning_amount:,.0f} referral bonus processed"
        
        return success_response(
            message="Subscription upgraded successfully",
            data=response_data,
            status_code=200
        )
        
    except Exception as e:
        logger.error(f"Error upgrading subscription: {e}")
        return error_response("Failed to upgrade subscription", status_code=500)

@subscription_upgrade_bp.route('/plans', methods=['GET'])
def get_subscription_plans():
    """Get available subscription plans with referral earning info"""
    try:
        plans = {
            'free': {
                'name': 'Free Plan',
                'price': 0,
                'currency': 'NGN',
                'duration': 'Forever',
                'features': [
                    '5 invoices per month',
                    '5 expenses per month',
                    'Basic reporting',
                    'Email support'
                ],
                'referral_earning': 0,
                'popular': False
            },
            'weekly': {
                'name': '7-Day Free Trial',
                'price': 0,
                'currency': 'NGN',
                'duration': '7 days',
                'features': [
                    'All Monthly plan features',
                    'Unlimited invoices',
                    'Unlimited expenses',
                    'Advanced reporting',
                    'Team management',
                    'Priority support'
                ],
                'referral_earning': 0,
                'popular': True,
                'note': 'No referral earnings during trial'
            },
            'monthly': {
                'name': 'Monthly Plan',
                'price': 4500,
                'currency': 'NGN',
                'duration': '30 days',
                'features': [
                    'Unlimited invoices',
                    'Unlimited expenses',
                    'Advanced reporting',
                    'Team management',
                    'Customer management',
                    'Sales analytics',
                    'Priority support'
                ],
                'referral_earning': 500,
                'popular': False
            },
            'yearly': {
                'name': 'Yearly Plan',
                'price': 50000,
                'currency': 'NGN',
                'duration': '365 days',
                'features': [
                    'All Monthly plan features',
                    'Advanced team management',
                    'Priority support',
                    'Custom integrations',
                    'Advanced analytics',
                    'Data export',
                    'API access'
                ],
                'referral_earning': 5000,
                'popular': False,
                'savings': '₦4,000 saved vs monthly'
            }
        }
        
        return success_response(
            message="Subscription plans fetched successfully",
            data={
            'plans': plans,
            'referral_info': {
                'minimum_withdrawal': 3000,
                'earning_plans': ['monthly', 'yearly'],
                'no_earning_plans': ['free', 'weekly'],
                'note': 'Referral earnings only apply to Monthly and Yearly paid subscriptions'
            }
            },
            status_code=200
        )
        
    except Exception as e:
        logger.error(f"Error fetching subscription plans: {e}")
        return error_response("Failed to fetch subscription plans", status_code=500)