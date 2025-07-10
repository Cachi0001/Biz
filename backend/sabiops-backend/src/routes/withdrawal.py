"""
Withdrawal routes for referral earnings with Paystack integration
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from src.models.referral import ReferralWithdrawal, ReferralEarning
import requests
import logging
from src.services.paystack_service import PaystackService

logger = logging.getLogger(__name__)

withdrawal_bp = Blueprint('withdrawal', __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

# Nigerian banks supported by Paystack
NIGERIAN_BANKS = {
    "044": "Access Bank",
    "014": "Afribank Nigeria Plc",
    "023": "Citibank Nigeria Limited",
    "050": "Ecobank Nigeria Plc",
    "040": "Equitorial Trust Bank Limited",
    "011": "First Bank of Nigeria Limited",
    "214": "First City Monument Bank Limited",
    "070": "Fidelity Bank Plc",
    "076": "Skye Bank Plc",
    "058": "Guaranty Trust Bank Plc",
    "030": "Heritage Banking Company Limited",
    "082": "Keystone Bank Limited",
    "221": "Stanbic IBTC Bank Plc",
    "068": "Standard Chartered Bank Nigeria Limited",
    "232": "Sterling Bank Plc",
    "032": "Union Bank of Nigeria Plc",
    "033": "United Bank for Africa Plc",
    "215": "Unity Bank Plc",
    "035": "Wema Bank Plc",
    "057": "Zenith Bank Plc",
    "101": "Providus Bank",
    "301490": "Opay",
    "566817": "PalmPay",
    "559186": "Moniepoint",
    "526389": "Kuda",
    "000": "Other"
}

@withdrawal_bp.route('/banks', methods=['GET'])
@jwt_required()
def get_supported_banks():
    """Get list of supported Nigerian banks"""
    try:
        # Get banks from Paystack API
        paystack_secret = current_app.config.get('PAYSTACK_SECRET_KEY')
        if not paystack_secret:
            # Return static list if Paystack not configured
            return jsonify({
                'banks': [{'code': code, 'name': name} for code, name in NIGERIAN_BANKS.items()]
            })
        
        headers = {
            'Authorization': f'Bearer {paystack_secret}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get('https://api.paystack.co/bank', headers=headers)
        
        if response.status_code == 200:
            banks_data = response.json()
            return jsonify({
                'banks': banks_data.get('data', [])
            })
        else:
            # Fallback to static list
            return jsonify({
                'banks': [{'code': code, 'name': name} for code, name in NIGERIAN_BANKS.items()]
            })
            
    except Exception as e:
        logger.error(f"Error fetching banks: {e}")
        return jsonify({
            'banks': [{'code': code, 'name': name} for code, name in NIGERIAN_BANKS.items()]
        })

@withdrawal_bp.route('/verify-account', methods=['POST'])
@jwt_required()
def verify_bank_account():
    """Verify bank account details with Paystack"""
    try:
        data = request.get_json()
        account_number = data.get('account_number')
        bank_code = data.get('bank_code')
        
        if not account_number or not bank_code:
            return jsonify({'error': 'Account number and bank code are required'}), 400
        
        paystack_secret = current_app.config.get('PAYSTACK_SECRET_KEY')
        if not paystack_secret:
            return jsonify({'error': 'Payment service not configured'}), 500
        
        headers = {
            'Authorization': f'Bearer {paystack_secret}',
            'Content-Type': 'application/json'
        }
        
        # Verify account with Paystack
        verify_url = f'https://api.paystack.co/bank/resolve?account_number={account_number}&bank_code={bank_code}'
        response = requests.get(verify_url, headers=headers)
        
        if response.status_code == 200:
            account_data = response.json()
            if account_data.get('status'):
                return jsonify({
                    'valid': True,
                    'account_name': account_data['data']['account_name'],
                    'account_number': account_data['data']['account_number']
                })
        
        return jsonify({'valid': False, 'error': 'Invalid account details'}), 400
        
    except Exception as e:
        logger.error(f"Error verifying account: {e}")
        return jsonify({'error': 'Account verification failed'}), 500

@withdrawal_bp.route('/request', methods=['POST'])
@jwt_required()
def request_withdrawal():
    """Request withdrawal of referral earnings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'bank_name', 'account_number', 'account_name', 'bank_code']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        amount = float(data['amount'])
        
        # Check minimum withdrawal amount (₦3,000 as per requirements)
        if amount < 3000:
            return jsonify({'error': 'Minimum withdrawal amount is ₦3,000'}), 400
        
        # Check if user has sufficient balance
        if user.referral_earnings < amount:
            return jsonify({
                'error': f'Insufficient balance. Available: ₦{user.referral_earnings:,.2f}'
            }), 400
        
        # Check for pending withdrawals
        pending_withdrawal = ReferralWithdrawal.query.filter_by(
            user_id=user_id,
            status='pending'
        ).first()
        
        if pending_withdrawal:
            return jsonify({
                'error': 'You have a pending withdrawal request. Please wait for it to be processed.'
            }), 400
        
        # Create withdrawal request
        withdrawal = ReferralWithdrawal(
            user_id=user_id,
            amount=amount,
            bank_name=data['bank_name'],
            account_number=data['account_number'],
            account_name=data['account_name'],
            bank_code=data['bank_code'],
            withdrawal_method='bank_transfer',
            status='pending'
        )
        
        # Generate reference number
        withdrawal.reference_number = withdrawal.generate_reference_number()
        
        # Deduct amount from user's earnings (hold it)
        user.referral_earnings -= amount
        
        db.session.add(withdrawal)
        db.session.commit()
        
        # Send notification
        if hasattr(current_app, 'supabase_service') and current_app.supabase_service.is_enabled():
            current_app.supabase_service.send_notification(
                str(user_id),
                "Withdrawal Request Submitted",
                f"Your withdrawal request of ₦{amount:,.2f} has been submitted and is being processed.",
                "info"
            )
        
        return jsonify({
            'message': 'Withdrawal request submitted successfully',
            'withdrawal': withdrawal.to_dict()
        }), 201
        
    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error requesting withdrawal: {e}")
        return jsonify({'error': 'Failed to process withdrawal request'}), 500

@withdrawal_bp.route('/history', methods=['GET'])
@jwt_required()
def get_withdrawal_history():
    """Get user's withdrawal history"""
    try:
        user_id = get_jwt_identity()
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        withdrawals = ReferralWithdrawal.query.filter_by(user_id=user_id)\
            .order_by(ReferralWithdrawal.requested_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'withdrawals': [w.to_dict() for w in withdrawals.items],
            'total': withdrawals.total,
            'pages': withdrawals.pages,
            'current_page': page
        })
        
    except Exception as e:
        logger.error(f"Error fetching withdrawal history: {e}")
        return jsonify({'error': 'Failed to fetch withdrawal history'}), 500

@withdrawal_bp.route('/earnings', methods=['GET'])
@jwt_required()
def get_referral_earnings():
    """Get user's referral earnings breakdown"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get detailed earnings
        earnings = ReferralEarning.query.filter_by(referrer_id=user_id)\
            .order_by(ReferralEarning.earned_at.desc())\
            .limit(50).all()
        
        # Calculate totals
        total_earned = sum(e.amount for e in earnings)
        total_withdrawn = user.total_withdrawn
        available_balance = user.referral_earnings
        
        return jsonify({
            'summary': {
                'total_earned': total_earned,
                'total_withdrawn': total_withdrawn,
                'available_balance': available_balance,
                'total_referrals': user.total_referrals
            },
            'recent_earnings': [e.to_dict() for e in earnings[:10]],
            'can_withdraw': available_balance >= 3000  # Minimum withdrawal amount
        })
        
    except Exception as e:
        logger.error(f"Error fetching earnings: {e}")
        return jsonify({'error': 'Failed to fetch earnings'}), 500

# Admin routes for processing withdrawals
@withdrawal_bp.route('/admin/pending', methods=['GET'])
@jwt_required()
def admin_get_pending_withdrawals():
    """Get pending withdrawals (Admin/Owner only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check if user has admin privileges
        if not user or user.role not in ['Owner', 'Admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        withdrawals = ReferralWithdrawal.query.filter_by(status='pending')\
            .order_by(ReferralWithdrawal.requested_at.asc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'withdrawals': [w.to_dict() for w in withdrawals.items],
            'total': withdrawals.total,
            'pages': withdrawals.pages,
            'current_page': page
        })
        
    except Exception as e:
        logger.error(f"Error fetching pending withdrawals: {e}")
        return jsonify({'error': 'Failed to fetch withdrawals'}), 500

@withdrawal_bp.route('/admin/process/<withdrawal_id>', methods=['POST'])
@jwt_required()
def admin_process_withdrawal(withdrawal_id):
    """Process a withdrawal request (Admin/Owner only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        # Check if user has admin privileges
        if not user or user.role not in ['Owner', 'Admin']:
            return jsonify({'error': 'Admin access required'}), 403
        withdrawal = ReferralWithdrawal.query.get(withdrawal_id)
        if not withdrawal:
            return jsonify({'error': 'Withdrawal not found'}), 404
        if withdrawal.status != 'pending':
            return jsonify({'error': 'Withdrawal already processed'}), 400
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        admin_notes = data.get('admin_notes', '')
        if action == 'approve':
            # --- Paystack Integration Start ---
            paystack = PaystackService()
            try:
                # 1. Resolve account number
                resolve_resp = paystack.resolve_account_number(
                    withdrawal.account_number, withdrawal.bank_code)
                if not resolve_resp.get('status') or not resolve_resp.get('data'):
                    raise Exception('Failed to resolve account number with Paystack')
                account_name = resolve_resp['data']['account_name']
                # 2. Create transfer recipient
                recipient_resp = paystack.create_transfer_recipient(
                    type='nuban',
                    name=withdrawal.account_name or account_name,
                    account_number=withdrawal.account_number,
                    bank_code=withdrawal.bank_code,
                    currency='NGN'
                )
                if not recipient_resp.get('status') or not recipient_resp.get('data'):
                    raise Exception('Failed to create transfer recipient with Paystack')
                recipient_code = recipient_resp['data']['recipient_code']
                withdrawal.recipient_code = recipient_code
                # 3. Initiate transfer
                transfer_resp = paystack.initiate_transfer(
                    source='balance',
                    amount=int(float(withdrawal.amount) * 100),  # Paystack expects kobo
                    recipient=recipient_code,
                    reason=f'Referral withdrawal for {withdrawal.account_name}',
                    reference=withdrawal.reference_number
                )
                if not transfer_resp.get('status') or not transfer_resp.get('data'):
                    raise Exception('Failed to initiate transfer with Paystack')
                transaction_id = transfer_resp['data']['id']
                withdrawal.transaction_id = str(transaction_id)
                withdrawal.status = 'processing'  # Mark as processing until webhook confirms
            withdrawal.processed_by = user_id
            withdrawal.processed_at = db.func.now()
            withdrawal.admin_notes = admin_notes
            # Update user's total withdrawn
            withdrawal_user = User.query.get(withdrawal.user_id)
            withdrawal_user.total_withdrawn += withdrawal.amount
            # Send notification
            if hasattr(current_app, 'supabase_service') and current_app.supabase_service.is_enabled():
                current_app.supabase_service.send_notification(
                    str(withdrawal.user_id),
                        "Withdrawal Processing",
                        f"Your withdrawal of ₦{withdrawal.amount:,.2f} is being processed. You will be notified once completed.",
                        "info"
                    )
            except Exception as paystack_error:
                withdrawal.status = 'failed'
                withdrawal.admin_notes = f"Paystack error: {paystack_error}"
                # Refund amount to user's earnings
                withdrawal_user = User.query.get(withdrawal.user_id)
                withdrawal_user.referral_earnings += withdrawal.amount
                if hasattr(current_app, 'supabase_service') and current_app.supabase_service.is_enabled():
                    current_app.supabase_service.send_notification(
                        str(withdrawal.user_id),
                        "Withdrawal Failed",
                        f"Your withdrawal request of ₦{withdrawal.amount:,.2f} failed due to a payment error. Amount refunded to your balance.",
                        "warning"
                    )
                db.session.commit()
                return jsonify({'error': f'Failed to process withdrawal: {paystack_error}'}), 500
            # --- Paystack Integration End ---
        elif action == 'reject':
            withdrawal.status = 'failed'
            withdrawal.processed_by = user_id
            withdrawal.processed_at = db.func.now()
            withdrawal.admin_notes = admin_notes
            # Refund amount to user's earnings
            withdrawal_user = User.query.get(withdrawal.user_id)
            withdrawal_user.referral_earnings += withdrawal.amount
            # Send notification
            if hasattr(current_app, 'supabase_service') and current_app.supabase_service.is_enabled():
                current_app.supabase_service.send_notification(
                    str(withdrawal.user_id),
                    "Withdrawal Rejected",
                    f"Your withdrawal request of ₦{withdrawal.amount:,.2f} was rejected. Amount refunded to your balance.",
                    "warning"
                )
        else:
            return jsonify({'error': 'Invalid action. Use "approve" or "reject"'}), 400
        db.session.commit()
        return jsonify({
            'message': f'Withdrawal {action}d successfully',
            'withdrawal': withdrawal.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error processing withdrawal: {e}")
        return jsonify({'error': 'Failed to process withdrawal'}), 500