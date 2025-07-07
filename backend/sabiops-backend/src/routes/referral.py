from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.referral import ReferralWithdrawal, ReferralEarning
from src.services.referral_service import ReferralService
from datetime import datetime
from sqlalchemy import func

referral_bp = Blueprint('referral', __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

@referral_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_referral_stats():
    """Get referral statistics for the current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Use the referral service to get comprehensive stats
        referral_summary = ReferralService.get_referral_summary(user_id)
        
        if referral_summary:
            return jsonify(referral_summary), 200
        
        # Get referred users
        referred_users = User.query.filter_by(referred_by=user_id).all()
        
        # Get earnings
        earnings = ReferralEarning.query.filter_by(referrer_id=user_id).all()
        
        # Calculate statistics
        total_referrals = len(referred_users)
        total_earnings = sum(earning.amount for earning in earnings)
        pending_earnings = sum(earning.amount for earning in earnings if earning.status == 'pending')
        confirmed_earnings = sum(earning.amount for earning in earnings if earning.status == 'confirmed')
        
        # Get withdrawal history
        withdrawals = ReferralWithdrawal.query.filter_by(user_id=user_id).order_by(
            ReferralWithdrawal.requested_at.desc()
        ).limit(10).all()
        
        return jsonify({
            'referral_code': user.referral_code,
            'total_referrals': total_referrals,
            'total_earnings': user.referral_earnings,
            'total_withdrawn': user.total_withdrawn,
            'available_balance': user.referral_earnings,
            'pending_earnings': pending_earnings,
            'confirmed_earnings': confirmed_earnings,
            'referred_users': [
                {
                    'id': ref_user.id,
                    'name': f"{ref_user.first_name} {ref_user.last_name}",
                    'email': ref_user.email,
                    'joined_date': ref_user.created_at.isoformat() if ref_user.created_at else None,
                    'subscription_plan': ref_user.subscription_plan
                }
                for ref_user in referred_users
            ],
            'recent_withdrawals': [withdrawal.to_dict() for withdrawal in withdrawals]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referral_bp.route('/earnings', methods=['GET'])
@jwt_required()
def get_referral_earnings():
    """Get detailed referral earnings"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = ReferralEarning.query.filter_by(referrer_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        earnings = query.order_by(ReferralEarning.earned_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'earnings': [earning.to_dict() for earning in earnings.items],
            'total': earnings.total,
            'pages': earnings.pages,
            'current_page': page,
            'per_page': per_page
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referral_bp.route('/withdraw', methods=['POST'])
@jwt_required()
def request_withdrawal():
    """Request a withdrawal of referral earnings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'withdrawal_method', 'account_details']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        amount = float(data['amount'])
        
        # Validate withdrawal amount
        if amount <= 0:
            return jsonify({'error': 'Withdrawal amount must be greater than 0'}), 400
        
        if amount > user.referral_earnings:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        # Minimum withdrawal amount (e.g., 1000 NGN)
        min_withdrawal = 1000.0
        if amount < min_withdrawal:
            return jsonify({'error': f'Minimum withdrawal amount is ₦{min_withdrawal}'}), 400
        
        # Create withdrawal request
        withdrawal = ReferralWithdrawal(
            user_id=user_id,
            amount=amount,
            withdrawal_method=data['withdrawal_method'],
            account_details=data['account_details'],
            status='pending'
        )
        
        withdrawal.reference_number = withdrawal.generate_reference_number()
        
        # Deduct from user's available balance (pending approval)
        user.referral_earnings -= amount
        
        db.session.add(withdrawal)
        db.session.commit()
        
        return jsonify({
            'message': 'Withdrawal request submitted successfully',
            'withdrawal': withdrawal.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({'error': 'Invalid amount provided'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referral_bp.route('/withdrawals', methods=['GET'])
@jwt_required()
def get_withdrawals():
    """Get withdrawal history"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = ReferralWithdrawal.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        withdrawals = query.order_by(ReferralWithdrawal.requested_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'withdrawals': [withdrawal.to_dict() for withdrawal in withdrawals.items],
            'total': withdrawals.total,
            'pages': withdrawals.pages,
            'current_page': page,
            'per_page': per_page
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referral_bp.route('/generate-link', methods=['POST'])
@jwt_required()
def generate_referral_link():
    """Generate a referral link"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get base URL from request or environment
        base_url = request.host_url.rstrip('/')
        referral_link = f"{base_url}/register?ref={user.referral_code}"
        
        return jsonify({
            'referral_code': user.referral_code,
            'referral_link': referral_link,
            'message': 'Share this link to earn referral commissions!'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referral_bp.route('/validate-code/<code>', methods=['GET'])
def validate_referral_code(code):
    """Validate a referral code"""
    try:
        user = User.query.filter_by(referral_code=code).first()
        
        if not user:
            return jsonify({'valid': False, 'message': 'Invalid referral code'}), 404
        
        return jsonify({
            'valid': True,
            'referrer': {
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}",
                'business_name': user.business_name
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin routes for managing referral system
@referral_bp.route('/admin/withdrawals', methods=['GET'])
@jwt_required()
def admin_get_withdrawals():
    """Get all withdrawal requests (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check if user is admin (you can implement your own admin check)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = ReferralWithdrawal.query
        
        if status:
            query = query.filter_by(status=status)
        
        withdrawals = query.order_by(ReferralWithdrawal.requested_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'withdrawals': [withdrawal.to_dict() for withdrawal in withdrawals.items],
            'total': withdrawals.total,
            'pages': withdrawals.pages,
            'current_page': page,
            'per_page': per_page
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referral_bp.route('/admin/withdrawals/<int:withdrawal_id>/process', methods=['PUT'])
@jwt_required()
def admin_process_withdrawal(withdrawal_id):
    """Process a withdrawal request (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check if user is admin
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        withdrawal = ReferralWithdrawal.query.get(withdrawal_id)
        if not withdrawal:
            return jsonify({'error': 'Withdrawal not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        admin_notes = data.get('admin_notes')
        transaction_id = data.get('transaction_id')
        
        if new_status not in ['processing', 'completed', 'failed']:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Update withdrawal
        withdrawal.status = new_status
        withdrawal.admin_notes = admin_notes
        withdrawal.transaction_id = transaction_id
        withdrawal.processed_by = user_id
        withdrawal.processed_at = datetime.utcnow()
        
        # If withdrawal failed, refund the amount to user
        if new_status == 'failed':
            withdrawal_user = User.query.get(withdrawal.user_id)
            if withdrawal_user:
                withdrawal_user.referral_earnings += withdrawal.amount
        
        db.session.commit()
        
        return jsonify({
            'message': f'Withdrawal {new_status} successfully',
            'withdrawal': withdrawal.to_dict()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_referral_earning(referrer_id, referred_user_id, earning_type, amount, commission_rate, source_id=None, source_type=None):
    """Helper function to create referral earnings"""
    try:
        earning = ReferralEarning(
            referrer_id=referrer_id,
            referred_user_id=referred_user_id,
            earning_type=earning_type,
            amount=amount,
            commission_rate=commission_rate,
            source_id=source_id,
            source_type=source_type,
            status='confirmed'  # Auto-confirm for now
        )
        
        # Add to referrer's balance
        referrer = User.query.get(referrer_id)
        if referrer:
            referrer.add_referral_earning(amount)
        
        db.session.add(earning)
        db.session.commit()
        
        return earning
    
    except Exception as e:
        print(f"Error creating referral earning: {e}")
        return None

