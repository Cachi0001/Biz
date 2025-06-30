from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db

user_bp = Blueprint('user', __name__)

@user_bp.route('/', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current authenticated user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = [
            'first_name', 'last_name', 'phone', 'business_name',
            'business_address', 'business_phone', 'business_email'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/business-info', methods=['GET'])
@jwt_required()
def get_business_info():
    """Get business information for current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        business_info = {
            'business_name': user.business_name,
            'business_address': user.business_address,
            'business_phone': user.business_phone,
            'business_email': user.business_email,
            'owner_name': f"{user.first_name} {user.last_name}",
            'owner_email': user.email,
            'owner_phone': user.phone
        }
        
        return jsonify({'business_info': business_info}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/business-info', methods=['PUT'])
@jwt_required()
def update_business_info():
    """Update business information for current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update business fields
        business_fields = ['business_name', 'business_address', 'business_phone', 'business_email']
        
        for field in business_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Business information updated successfully',
            'business_info': {
                'business_name': user.business_name,
                'business_address': user.business_address,
                'business_phone': user.business_phone,
                'business_email': user.business_email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/deactivate', methods=['POST'])
@jwt_required()
def deactivate_account():
    """Deactivate current user account"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Verify password before deactivation
        if not data.get('password'):
            return jsonify({'error': 'Password is required for account deactivation'}), 400
        
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid password'}), 401
        
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Account deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user account statistics"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get counts of related entities
        customer_count = len(user.customers)
        product_count = len(user.products)
        invoice_count = len(user.invoices)
        payment_count = len(user.payments)
        
        # Calculate total revenue
        successful_payments = [p for p in user.payments if p.status == 'successful']
        total_revenue = sum(payment.amount for payment in successful_payments)
        
        return jsonify({
            'user_info': user.to_public_dict(),
            'stats': {
                'customers': customer_count,
                'products': product_count,
                'invoices': invoice_count,
                'payments': payment_count,
                'total_revenue': float(total_revenue)
            },
            'account_created': user.created_at.isoformat() if user.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

