from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.payment import Payment
from src.models.invoice import Invoice
from src.models.user import db
import os
import requests
from datetime import datetime

payment_bp = Blueprint('payment', __name__)

PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
PAYSTACK_BASE_URL = 'https://api.paystack.co'

@payment_bp.route('/', methods=['GET'])
@jwt_required()
def get_payments():
    """Get all payments for the current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', '')
        
        query = Payment.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        payments = query.order_by(Payment.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'payments': [payment.to_dict() for payment in payments.items],
            'total': payments.total,
            'pages': payments.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get a specific payment"""
    try:
        user_id = get_jwt_identity()
        payment = Payment.query.filter_by(id=payment_id, user_id=user_id).first()
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        return jsonify({'payment': payment.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/initialize', methods=['POST'])
@jwt_required()
def initialize_payment():
    """Initialize payment with Paystack"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify invoice if provided
        invoice = None
        if data.get('invoice_id'):
            invoice = Invoice.query.filter_by(
                id=data['invoice_id'], 
                user_id=user_id
            ).first()
            if not invoice:
                return jsonify({'error': 'Invoice not found'}), 404
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            invoice_id=data.get('invoice_id'),
            amount=data['amount'],
            currency=data.get('currency', 'NGN'),
            customer_email=data['email'],
            customer_name=data.get('customer_name'),
            customer_phone=data.get('customer_phone'),
            description=data.get('description', 'Payment for services'),
            payment_gateway='paystack'
        )
        
        db.session.add(payment)
        db.session.commit()
        
        # Initialize payment with Paystack
        paystack_data = {
            'email': data['email'],
            'amount': int(float(data['amount']) * 100),  # Convert to kobo
            'currency': data.get('currency', 'NGN'),
            'reference': payment.payment_reference,
            'callback_url': data.get('callback_url'),
            'metadata': {
                'payment_id': payment.id,
                'user_id': user_id,
                'invoice_id': data.get('invoice_id')
            }
        }
        
        headers = {
            'Authorization': f'Bearer {PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{PAYSTACK_BASE_URL}/transaction/initialize',
            json=paystack_data,
            headers=headers
        )
        
        if response.status_code == 200:
            paystack_response = response.json()
            
            if paystack_response['status']:
                return jsonify({
                    'message': 'Payment initialized successfully',
                    'payment': payment.to_dict(),
                    'authorization_url': paystack_response['data']['authorization_url'],
                    'access_code': paystack_response['data']['access_code'],
                    'reference': paystack_response['data']['reference']
                }), 200
            else:
                return jsonify({'error': paystack_response['message']}), 400
        else:
            return jsonify({'error': 'Failed to initialize payment with Paystack'}), 500
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/verify/<reference>', methods=['GET'])
@jwt_required()
def verify_payment(reference):
    """Verify payment with Paystack"""
    try:
        user_id = get_jwt_identity()
        
        # Find payment by reference
        payment = Payment.query.filter_by(
            payment_reference=reference,
            user_id=user_id
        ).first()
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Verify with Paystack
        headers = {
            'Authorization': f'Bearer {PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'{PAYSTACK_BASE_URL}/transaction/verify/{reference}',
            headers=headers
        )
        
        if response.status_code == 200:
            paystack_response = response.json()
            
            if paystack_response['status'] and paystack_response['data']['status'] == 'success':
                # Update payment status
                payment.mark_as_successful(
                    gateway_reference=paystack_response['data']['reference'],
                    gateway_response=str(paystack_response['data'])
                )
                
                # Update payment method and fees
                payment.payment_method = paystack_response['data']['channel']
                payment.fees = paystack_response['data']['fees'] / 100  # Convert from kobo
                
                # Update invoice if associated
                if payment.invoice:
                    payment.invoice.amount_paid += payment.amount
                    if payment.invoice.amount_paid >= payment.invoice.total_amount:
                        payment.invoice.mark_as_paid()
                
                db.session.commit()
                
                return jsonify({
                    'message': 'Payment verified successfully',
                    'payment': payment.to_dict(),
                    'paystack_data': paystack_response['data']
                }), 200
            else:
                payment.mark_as_failed(gateway_response=str(paystack_response['data']))
                db.session.commit()
                
                return jsonify({
                    'error': 'Payment verification failed',
                    'payment': payment.to_dict()
                }), 400
        else:
            return jsonify({'error': 'Failed to verify payment with Paystack'}), 500
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/webhook', methods=['POST'])
def paystack_webhook():
    """Handle Paystack webhook"""
    try:
        # Verify webhook signature (recommended for production)
        # signature = request.headers.get('X-Paystack-Signature')
        
        data = request.get_json()
        
        if data['event'] == 'charge.success':
            reference = data['data']['reference']
            
            # Find payment by reference
            payment = Payment.query.filter_by(payment_reference=reference).first()
            
            if payment and payment.status == 'pending':
                # Update payment status
                payment.mark_as_successful(
                    gateway_reference=data['data']['reference'],
                    gateway_response=str(data['data'])
                )
                
                # Update payment method and fees
                payment.payment_method = data['data']['channel']
                payment.fees = data['data']['fees'] / 100  # Convert from kobo
                
                # Update invoice if associated
                if payment.invoice:
                    payment.invoice.amount_paid += payment.amount
                    if payment.invoice.amount_paid >= payment.invoice.total_amount:
                        payment.invoice.mark_as_paid()
                
                db.session.commit()
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/manual', methods=['POST'])
@jwt_required()
def record_manual_payment():
    """Record a manual payment (cash, bank transfer, etc.)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'payment_method']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify invoice if provided
        invoice = None
        if data.get('invoice_id'):
            invoice = Invoice.query.filter_by(
                id=data['invoice_id'], 
                user_id=user_id
            ).first()
            if not invoice:
                return jsonify({'error': 'Invoice not found'}), 404
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            invoice_id=data.get('invoice_id'),
            amount=data['amount'],
            currency=data.get('currency', 'NGN'),
            payment_method=data['payment_method'],
            customer_email=data.get('customer_email'),
            customer_name=data.get('customer_name'),
            customer_phone=data.get('customer_phone'),
            description=data.get('description', 'Manual payment'),
            notes=data.get('notes'),
            status='successful'
        )
        payment.paid_at = datetime.utcnow()
        
        # Update invoice if associated
        if invoice:
            invoice.amount_paid += payment.amount
            if invoice.amount_paid >= invoice.total_amount:
                invoice.mark_as_paid()
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Manual payment recorded successfully',
            'payment': payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_payment_stats():
    """Get payment statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get payment counts by status
        total_payments = Payment.query.filter_by(user_id=user_id).count()
        successful_payments = Payment.query.filter_by(user_id=user_id, status='successful').count()
        pending_payments = Payment.query.filter_by(user_id=user_id, status='pending').count()
        failed_payments = Payment.query.filter_by(user_id=user_id, status='failed').count()
        
        # Calculate total amounts
        successful_payment_records = Payment.query.filter_by(user_id=user_id, status='successful').all()
        total_revenue = sum(payment.amount for payment in successful_payment_records)
        total_fees = sum(payment.fees for payment in successful_payment_records)
        
        # Get recent payments
        recent_payments = Payment.query.filter_by(user_id=user_id).order_by(
            Payment.created_at.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_payments': total_payments,
            'successful_payments': successful_payments,
            'pending_payments': pending_payments,
            'failed_payments': failed_payments,
            'total_revenue': float(total_revenue),
            'total_fees': float(total_fees),
            'net_revenue': float(total_revenue - total_fees),
            'recent_payments': [payment.to_dict() for payment in recent_payments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

