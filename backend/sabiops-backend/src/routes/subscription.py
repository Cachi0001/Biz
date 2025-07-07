from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from datetime import datetime, timedelta

subscription_bp = Blueprint('subscription', __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

@subscription_bp.route('/status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Get user subscription status"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        subscription_data = {
            'subscription_plan': user.subscription_plan,
            'subscription_status': user.subscription_status,
            'is_trial_active': user.is_trial_active,
            'trial_end_date': user.trial_end_date.isoformat() if user.trial_end_date else None,
            'subscription_start_date': user.subscription_start_date.isoformat() if user.subscription_start_date else None,
            'subscription_end_date': user.subscription_end_date.isoformat() if user.subscription_end_date else None,
            'trial_expired': user.is_trial_expired(),
            'subscription_active': user.is_subscription_active()
        }
        
        return jsonify(subscription_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/plans', methods=['GET'])
def get_subscription_plans():
    """Get available subscription plans"""
    try:
        plans = {
            'free': {
                'name': 'Free Plan',
                'price': 0,
                'currency': 'NGN',
                'billing_cycle': 'monthly',
                'features': {
                    'invoices_per_month': 5,
                    'expenses_per_month': 5,
                    'basic_reporting': True,
                    'advanced_reporting': False,
                    'team_management': False,
                    'referral_rewards': 0
                }
            },
            'weekly': {
                'name': 'Silver Weekly',
                'price': 1400,
                'currency': 'NGN',
                'billing_cycle': 'weekly',
                'features': {
                    'invoices_per_week': 100,
                    'expenses_per_week': 100,
                    'unlimited_clients': True,
                    'advanced_reporting': True,
                    'sales_report_downloads': True,
                    'team_management': True,
                    'referral_rewards': 0
                }
            },
            'monthly': {
                'name': 'Silver Monthly',
                'price': 4500,
                'currency': 'NGN',
                'billing_cycle': 'monthly',
                'features': {
                    'invoices_per_month': 450,
                    'expenses_per_month': 450,
                    'unlimited_clients': True,
                    'advanced_reporting': True,
                    'sales_report_downloads': True,
                    'team_management': True,
                    'referral_rewards': 500
                }
            },
            'yearly': {
                'name': 'Silver Yearly',
                'price': 50000,
                'currency': 'NGN',
                'billing_cycle': 'yearly',
                'features': {
                    'invoices_per_year': 6000,
                    'expenses_per_year': 6000,
                    'unlimited_clients': True,
                    'advanced_reporting': True,
                    'sales_report_downloads': True,
                    'team_management': True,
                    'priority_support': True,
                    'referral_rewards': 5000
                }
            }
        }
        
        return jsonify({'plans': plans}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/upgrade', methods=['POST'])
@jwt_required()
def upgrade_subscription():
    """Upgrade user subscription"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        plan = data.get('plan')
        
        if plan not in ['weekly', 'monthly', 'yearly']:
            return jsonify({'error': 'Invalid subscription plan'}), 400
        
        # Update user subscription
        user.subscription_plan = plan
        user.subscription_status = 'active'
        user.subscription_start_date = datetime.utcnow()
        user.is_trial_active = False
        
        # Set subscription end date based on plan
        if plan == 'weekly':
            user.subscription_end_date = datetime.utcnow() + timedelta(weeks=1)
        elif plan == 'monthly':
            user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
        elif plan == 'yearly':
            user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully upgraded to {plan} plan',
            'subscription': {
                'plan': user.subscription_plan,
                'status': user.subscription_status,
                'start_date': user.subscription_start_date.isoformat(),
                'end_date': user.subscription_end_date.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscription_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancel user subscription"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Cancel subscription but keep access until end date
        user.subscription_status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription cancelled successfully',
            'access_until': user.subscription_end_date.isoformat() if user.subscription_end_date else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500