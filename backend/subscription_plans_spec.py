# Backend Subscription Plans Specification
# This should match the frontend exactly

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
            'expenses_per_month': 5
        }
    },
    'weekly': {
        'name': '7-Day Free Trial',
        'price': 0,  # Trial is free, actual price is ₦1,400
        'actual_price': 1400,  # Price after trial
        'currency': 'NGN',
        'duration': '7 days',
        'features': [
            'All Free plan features',
            '100 invoices per week',
            '100 expenses per week',
            'Advanced reporting',
            'Team management',
            'Priority support'
        ],
        'referral_earning': 0,
        'popular': True,
        'note': 'No referral earnings during trial',
        'limits': {
            'invoices_per_week': 100,
            'expenses_per_week': 100
        }
    },
    'monthly': {
        'name': 'Monthly Plan',
        'price': 4500,
        'currency': 'NGN',
        'duration': '30 days',
        'features': [
            'All Free plan features',
            '450 invoices per month',
            '450 expenses per month',
            'Advanced reporting',
            'Team management',
            'Priority support',
            'Referral earnings (10% for 3 months)'
        ],
        'referral_earning': 450,  # 10% of ₦4,500
        'popular': False,
        'limits': {
            'invoices_per_month': 450,
            'expenses_per_month': 450
        }
    },
    'yearly': {
        'name': 'Yearly Plan',
        'price': 50000,
        'currency': 'NGN',
        'duration': '365 days',
        'features': [
            'All Free plan features',
            '6000 invoices per year',
            '6000 expenses per year',
            'Advanced reporting',
            'Team management',
            'Priority support',
            'Referral earnings (10% for 3 months)'
        ],
        'referral_earning': 5000,  # 10% of ₦50,000
        'popular': False,
        'savings': '₦4,000 saved vs monthly',
        'limits': {
            'invoices_per_year': 6000,
            'expenses_per_year': 6000
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

def get_subscription_plans():
    """
    API endpoint to return subscription plans
    Should match frontend UpgradeModal exactly
    """
    return {
        'success': True,
        'message': 'Subscription plans fetched successfully',
        'data': {
            'plans': SUBSCRIPTION_PLANS,
            'referral_info': REFERRAL_CONFIG
        },
        'status_code': 200
    }

def calculate_referral_earnings(referrer_id, referee_id, plan_id, payment_amount):
    """
    Calculate referral earnings with 3-month limit per user
    
    Args:
        referrer_id: ID of the person who referred
        referee_id: ID of the person who was referred  
        plan_id: The subscription plan (monthly/yearly only)
        payment_amount: Amount paid by referee
        
    Returns:
        dict: Earning calculation result
    """
    
    # Check if plan is eligible for referral earnings
    if plan_id not in REFERRAL_CONFIG['earning_plans']:
        return {
            'eligible': False,
            'reason': f'Plan {plan_id} not eligible for referral earnings',
            'earning_amount': 0
        }
    
    # Check if this referee has already generated 3 months of earnings
    # This would require database query to check payment history
    months_earned = get_months_earned_from_referee(referrer_id, referee_id)
    
    if months_earned >= REFERRAL_CONFIG['earning_duration_months']:
        return {
            'eligible': False,
            'reason': f'Maximum earning period (3 months) reached for this referee',
            'earning_amount': 0,
            'months_earned': months_earned
        }
    
    # Calculate earning amount
    commission_rate = REFERRAL_CONFIG['commission_rate']
    earning_amount = payment_amount * commission_rate
    
    return {
        'eligible': True,
        'earning_amount': earning_amount,
        'commission_rate': commission_rate,
        'months_earned': months_earned,
        'remaining_months': REFERRAL_CONFIG['earning_duration_months'] - months_earned
    }

def get_months_earned_from_referee(referrer_id, referee_id):
    """
    Get number of months referrer has already earned from this specific referee
    This should query the database for payment history
    """
    # Database query would go here
    # SELECT COUNT(*) FROM referral_earnings 
    # WHERE referrer_id = ? AND referee_id = ? 
    # AND created_at >= referee_first_payment_date
    pass

def process_referral_payment(referrer_id, referee_id, plan_id, payment_amount):
    """
    Process referral payment and update earnings
    Only for first 3 months per referee
    """
    
    earning_result = calculate_referral_earnings(
        referrer_id, referee_id, plan_id, payment_amount
    )
    
    if not earning_result['eligible']:
        return earning_result
    
    # Record the earning in database
    # INSERT INTO referral_earnings (referrer_id, referee_id, amount, plan_id, created_at)
    # VALUES (?, ?, ?, ?, NOW())
    
    # Update referrer's total earnings
    # UPDATE users SET referral_earnings = referral_earnings + ? WHERE id = ?
    
    return {
        'success': True,
        'earning_recorded': True,
        'amount': earning_result['earning_amount'],
        'remaining_months': earning_result['remaining_months']
    }

# Database Schema Requirements
"""
-- Referral earnings tracking table
CREATE TABLE referral_earnings (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id),
    referee_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    plan_id VARCHAR(20) NOT NULL,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_referrer_referee (referrer_id, referee_id),
    INDEX idx_created_at (created_at)
);

-- Add referral fields to users table
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN referred_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN total_referral_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN referral_earnings_withdrawn DECIMAL(10,2) DEFAULT 0;
"""