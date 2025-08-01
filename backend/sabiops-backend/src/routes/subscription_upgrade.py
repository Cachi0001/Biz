"""
Subscription Upgrade Routes - Updated to match frontend specifications exactly
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid

subscription_bp = Blueprint('subscription', __name__)

# Subscription Plans - Must match frontend exactly
SUBSCRIPTION_PLANS = {
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
        'popular': False,
        'limits': {
            'invoices_per_month': 5,
            'expenses_per_month': 20,
            'sales_per_month': 50,
            'products_per_month': 20
        }
    },
    'weekly': {
        'name': 'Silver Weekly (7-Day Free Trial)',
        'price': 1400,  # ₦1,400 after trial
        'trial_price': 0,  # Free trial
        'currency': 'NGN',
        'duration': '7 days',
        'trial_duration': 7,
        'features': [
            '7-day free trial',
            '100 invoices per week',
            '100 expenses per week',
            '250 sales per week',
            '100 products per week',
            'Advanced reporting',
            'Team management',
            'All other features unlimited'
        ],
        'referral_earning': 0,
        'popular': True,
        'note': 'No referral earnings during trial',
        'limits': {
            'invoices_per_week': 100,
            'expenses_per_week': 100,
            'sales_per_week': 250,
            'products_per_week': 100
        }
    },
    'monthly': {
        'name': 'Silver Monthly',
        'price': 4500,
        'currency': 'NGN',
        'duration': '30 days',
        'features': [
            '450 invoices per month',
            '500 expenses per month',
            '1,500 sales per month',
            '500 products per month',
            'Advanced reporting',
            'Team management',
            'Referral earnings (10% for 3 months)',
            'All other features unlimited'
        ],
        'referral_earning': 500,
        'popular': False,
        'limits': {
            'invoices_per_month': 450,
            'expenses_per_month': 500,
            'sales_per_month': 1500,
            'products_per_month': 500
        }
    },
    'yearly': {
        'name': 'Silver Yearly',
        'price': 50000,
        'currency': 'NGN',
        'duration': '365 days',
        'features': [
            '6,000 invoices per year',
            '2,000 expenses per year',
            '18,000 sales per year',
            '2,000 products per year',
            'Advanced reporting',
            'Team management',
            'Referral earnings (10% for 3 payments)',
            'All other features unlimited'
        ],
        'referral_earning': 5000,
        'popular': False,
        'limits': {
            'invoices_per_year': 6000,
            'expenses_per_year': 2000,
            'sales_per_year': 18000,
            'products_per_year': 2000
        }
    }
}

REFERRAL_CONFIG = {
    'minimum_withdrawal': 3000,
    'earning_duration_months': 3,  # Only earn for first 3 months per referee
    'earning_plans': ['monthly', 'yearly'],
    'no_earning_plans': ['free', 'weekly'],
    'commission_rate': 0.10,  # 10%
    'note': 'Referral earnings only apply to Monthly and Yearly paid subscriptions for the first 3 months per user'
}

@subscription_bp.route('/plans', methods=['GET'])
def get_subscription_plans():
    """
    Get all subscription plans
    Must match frontend UpgradeModal exactly
    """
    try:
        return jsonify({
            'success': True,
            'message': 'Subscription plans fetched successfully',
            'data': {
                'plans': SUBSCRIPTION_PLANS,
                'referral_info': REFERRAL_CONFIG
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch subscription plans',
            'error': str(e)
        }), 500

@subscription_bp.route('/upgrade', methods=['POST'])
def upgrade_subscription():
    """
    Process subscription upgrade after successful payment
    """
    try:
        data = request.get_json()
        user_id = get_current_user_id()  # Implement this function
        
        plan_id = data.get('plan_id')
        payment_reference = data.get('payment_reference')
        transaction_id = data.get('transaction_id')
        amount = data.get('amount')
        
        if not all([plan_id, payment_reference, amount]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Validate plan exists
        if plan_id not in SUBSCRIPTION_PLANS:
            return jsonify({
                'success': False,
                'message': 'Invalid subscription plan'
            }), 400
        
        plan = SUBSCRIPTION_PLANS[plan_id]
        
        # Calculate subscription end date
        if plan_id == 'weekly':
            # Weekly plan starts with 7-day trial, then charges ₦1,400/week
            end_date = datetime.now() + timedelta(days=7)
            status = 'trial'
        elif plan_id == 'monthly':
            end_date = datetime.now() + timedelta(days=30)
            status = 'active'
        elif plan_id == 'yearly':
            end_date = datetime.now() + timedelta(days=365)
            status = 'active'
        
        # Update user subscription in database
        update_user_subscription(
            user_id=user_id,
            plan_id=plan_id,
            status=status,
            end_date=end_date,
            payment_reference=payment_reference,
            amount_paid=amount
        )
        
        # Process referral earnings if applicable
        referrer_id = get_user_referrer(user_id)
        if referrer_id and plan_id in REFERRAL_CONFIG['earning_plans']:
            process_referral_earning(
                referrer_id=referrer_id,
                referee_id=user_id,
                plan_id=plan_id,
                amount=amount
            )
        
        return jsonify({
            'success': True,
            'message': f'Successfully upgraded to {plan["name"]}',
            'data': {
                'plan_id': plan_id,
                'plan_name': plan['name'],
                'status': status,
                'end_date': end_date.isoformat(),
                'next_billing_date': end_date.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Subscription upgrade failed',
            'error': str(e)
        }), 500

def process_referral_earning(referrer_id, referee_id, plan_id, amount):
    """
    Process referral earnings with 3-month limit per user
    """
    try:
        # Check if referrer has already earned from this referee for 3 months
        months_earned = get_months_earned_from_referee(referrer_id, referee_id)
        
        if months_earned >= REFERRAL_CONFIG['earning_duration_months']:
            return  # No more earnings from this referee
        
        # Calculate earning amount
        commission_rate = REFERRAL_CONFIG['commission_rate']
        earning_amount = amount * commission_rate
        
        # Record the earning
        record_referral_earning(
            referrer_id=referrer_id,
            referee_id=referee_id,
            amount=earning_amount,
            plan_id=plan_id
        )
        
        # Update referrer's total earnings
        update_referrer_earnings(referrer_id, earning_amount)
        
    except Exception as e:
        print(f"Error processing referral earning: {e}")

def get_months_earned_from_referee(referrer_id, referee_id):
    """
    Get number of months referrer has already earned from this specific referee
    """
    # Database query to count months of earnings from this specific referee
    # SELECT COUNT(*) FROM referral_earnings 
    # WHERE referrer_id = ? AND referee_id = ?
    # AND created_at >= (SELECT MIN(created_at) FROM referral_earnings WHERE referee_id = ?)
    pass

def record_referral_earning(referrer_id, referee_id, amount, plan_id):
    """
    Record referral earning in database
    """
    # INSERT INTO referral_earnings (referrer_id, referee_id, amount, plan_id, created_at)
    # VALUES (?, ?, ?, ?, NOW())
    pass

def update_referrer_earnings(referrer_id, earning_amount):
    """
    Update referrer's total earnings
    """
    # UPDATE users SET total_referral_earnings = total_referral_earnings + ? WHERE id = ?
    pass

def update_user_subscription(user_id, plan_id, status, end_date, payment_reference, amount_paid):
    """
    Update user's subscription in database
    """
    # UPDATE users SET 
    # subscription_plan = ?, 
    # subscription_status = ?, 
    # subscription_end_date = ?,
    # last_payment_reference = ?,
    # last_payment_amount = ?
    # WHERE id = ?
    pass

def get_current_user_id():
    """
    Get current authenticated user ID from JWT token
    """
    # Implement JWT token validation and user ID extraction
    pass

def get_user_referrer(user_id):
    """
    Get the ID of the user who referred this user
    """
    # SELECT referred_by FROM users WHERE id = ?
    pass

# Referral System Routes
@subscription_bp.route('/referrals/dashboard', methods=['GET'])
def get_referral_dashboard():
    """
    Get referral dashboard data for the current user
    """
    try:
        user_id = get_current_user_id()
        
        # Get referral data from database
        referral_data = {
            'referral_code': get_user_referral_code(user_id),
            'total_earnings': get_total_referral_earnings(user_id),
            'available_earnings': get_available_referral_earnings(user_id),
            'referrals': get_active_referrals(user_id)
        }
        
        return jsonify({
            'success': True,
            'data': referral_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch referral data',
            'error': str(e)
        }), 500

@subscription_bp.route('/referrals/withdraw', methods=['POST'])
def request_referral_withdrawal():
    """
    Request referral earnings withdrawal
    """
    try:
        user_id = get_current_user_id()
        available_earnings = get_available_referral_earnings(user_id)
        
        if available_earnings < REFERRAL_CONFIG['minimum_withdrawal']:
            return jsonify({
                'success': False,
                'message': f'Minimum withdrawal amount is ₦{REFERRAL_CONFIG["minimum_withdrawal"]}'
            }), 400
        
        # Process withdrawal request
        withdrawal_id = process_withdrawal_request(user_id, available_earnings)
        
        return jsonify({
            'success': True,
            'message': 'Withdrawal request submitted successfully',
            'data': {
                'withdrawal_id': withdrawal_id,
                'amount': available_earnings
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Withdrawal request failed',
            'error': str(e)
        }), 500

def get_user_referral_code(user_id):
    """Generate or get existing referral code for user"""
    # SELECT referral_code FROM users WHERE id = ?
    # If not exists, generate new code and update
    pass

def get_total_referral_earnings(user_id):
    """Get total referral earnings for user"""
    # SELECT COALESCE(SUM(amount), 0) FROM referral_earnings WHERE referrer_id = ?
    pass

def get_available_referral_earnings(user_id):
    """Get available referral earnings (not yet withdrawn)"""
    # SELECT total_referral_earnings - referral_earnings_withdrawn FROM users WHERE id = ?
    pass

def get_active_referrals(user_id):
    """Get list of active referrals (still earning)"""
    # Complex query to get referrals that haven't reached 3-month limit
    pass

def process_withdrawal_request(user_id, amount):
    """Process withdrawal request"""
    # INSERT INTO withdrawal_requests (user_id, amount, status, created_at)
    # VALUES (?, ?, 'pending', NOW())
    pass