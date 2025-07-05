"""
Subscription upgrade routes with referral earning processing
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from src.services.referral_service import ReferralService
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

subscription_upgrade_bp = Blueprint('subscription_upgrade', __name__)

@subscription_upgrade_bp.route('/upgrade', methods=['POST'])
@jwt_required()
def upgrade_subscription():
    """
    Upgrade user subscription and process referral earnings
    Only Monthly and Yearly plans generate referral earnings
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        new_plan = data.get('plan')  # 'monthly' or 'yearly'
        payment_reference = data.get('payment_reference')
        
        if not new_plan or new_plan not in ['monthly', 'yearly']:
            return jsonify({'error': 'Invalid subscription plan. Only monthly and yearly plans available.'}), 400
        
        if not payment_reference:
            return jsonify({'error': 'Payment reference is required'}), 400
        
        # Verify payment with Paystack (implement actual verification)
        # For now, we'll assume payment is verified
        
        # Update user subscription
        old_plan = user.subscription_plan
        old_status = user.subscription_status
        
        user.subscription_plan = new_plan
        user.subscription_status = 'active'
        user.subscription_start_date = datetime.utcnow()
        
        # Set subscription end date
        if new_plan == 'monthly':
            user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
        elif new_plan == 'yearly':
            user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
        
        # End trial period
        user.is_trial_active = False
        
        # Process referral earning (only for monthly and yearly)
        referral_processed = False
        if user.referred_by and new_plan in ['monthly', 'yearly']:
            referral_processed = ReferralService.process_referral_earning(
                user_id, new_plan, 'active'
            )
        
        db.session.commit()
        
        # Send notifications
        if hasattr(current_app, 'supabase_service') and current_app.supabase_service.is_enabled():
            # Notify user of successful upgrade
            plan_name = "Monthly" if new_plan == 'monthly' else "Yearly"
            current_app.supabase_service.send_notification(
                str(user_id),
                f"Subscription Upgraded!",
                f"Welcome to the {plan_name} plan! You now have access to all premium features.",
                "success"
            )
        
        response_data = {
            'message': 'Subscription upgraded successfully',
            'user': user.to_dict(),
            'referral_processed': referral_processed
        }
        
        if referral_processed:
            earning_amount = ReferralService.calculate_referral_earning(new_plan)
            response_data['referral_earning'] = f"₦{earning_amount:,.0f} referral bonus processed"
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error upgrading subscription: {e}")
        return jsonify({'error': 'Failed to upgrade subscription'}), 500

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
        
        return jsonify({
            'plans': plans,
            'referral_info': {
                'minimum_withdrawal': 3000,
                'earning_plans': ['monthly', 'yearly'],
                'no_earning_plans': ['free', 'weekly'],
                'note': 'Referral earnings only apply to Monthly and Yearly paid subscriptions'
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching subscription plans: {e}")
        return jsonify({'error': 'Failed to fetch subscription plans'}), 500