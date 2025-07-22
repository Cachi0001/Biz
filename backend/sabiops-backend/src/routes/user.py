from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from werkzeug.security import generate_password_hash
import secrets
import string

user_bp = Blueprint('user', __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

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

@user_bp.route('/team', methods=['GET'])
@jwt_required()
def get_team_members():
    """Get all team members for the current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get team members
        team_members = User.query.filter_by(team_owner_id=user_id, is_active=True).all()
        
        return jsonify({
            'team_members': [member.to_dict() for member in team_members],
            'total_members': len(team_members)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/team', methods=['POST'])
@jwt_required()
def create_team_member():
    """Create a new team member (salesperson)"""
    try:
        user_id = get_jwt_identity()
        owner = User.query.get(user_id)
        
        if not owner:
            return jsonify({'error': 'Owner not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'username']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email or username already exists
        existing_user = User.query.filter(
            (User.email == data['email']) | (User.username == data['username'])
        ).first()
        
        if existing_user:
            return jsonify({'error': 'Email or username already exists'}), 400
        
        # Generate a temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        
        # Create new team member
        team_member = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(temp_password),
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone', ''),
            role='salesperson',
            team_owner_id=user_id,
            is_active=True
        )
        
        db.session.add(team_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Team member created successfully',
            'team_member': team_member.to_dict(),
            'temporary_password': temp_password,
            'note': 'Please share the temporary password with the team member and ask them to change it on first login'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/team/<int:member_id>', methods=['GET'])
@jwt_required()
def get_team_member(member_id):
    """Get a specific team member"""
    try:
        user_id = get_jwt_identity()
        
        team_member = User.query.filter_by(
            id=member_id, 
            team_owner_id=user_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'Team member not found'}), 404
        
        return jsonify({'team_member': team_member.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/team/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_team_member(member_id):
    """Update a team member"""
    try:
        user_id = get_jwt_identity()
        
        team_member = User.query.filter_by(
            id=member_id, 
            team_owner_id=user_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'Team member not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['first_name', 'last_name', 'phone', 'is_active']
        
        for field in allowed_fields:
            if field in data:
                setattr(team_member, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Team member updated successfully',
            'team_member': team_member.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/team/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_team_member(member_id):
    """Delete (deactivate) a team member"""
    try:
        user_id = get_jwt_identity()
        
        team_member = User.query.filter_by(
            id=member_id, 
            team_owner_id=user_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'Team member not found'}), 404
        
        # Soft delete - deactivate the user
        team_member.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Team member deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/team/<int:member_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_team_member_password(member_id):
    """Reset password for a team member"""
    try:
        user_id = get_jwt_identity()
        
        team_member = User.query.filter_by(
            id=member_id, 
            team_owner_id=user_id
        ).first()
        
        if not team_member:
            return jsonify({'error': 'Team member not found'}), 404
        
        # Generate a new temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        team_member.password_hash = generate_password_hash(temp_password)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Password reset successfully',
            'temporary_password': temp_password,
            'note': 'Please share the new temporary password with the team member'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password for current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
        
        # Update password
        user.password_hash = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
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
        
        # Get team stats
        team_members = User.query.filter_by(team_owner_id=user_id, is_active=True).all()
        team_count = len(team_members)
        
        return jsonify({
            'user_info': user.to_public_dict(),
            'stats': {
                'customers': customer_count,
                'products': product_count,
                'invoices': invoice_count,
                'payments': payment_count,
                'team_members': team_count,
                'total_revenue': float(total_revenue)
            },
            'account_created': user.created_at.isoformat() if user.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/usage-status', methods=['GET'])
@jwt_required()
def get_usage_status():
    try:
        user_id = get_jwt_identity()
        # Dummy usage status for now; replace with real logic if needed
        usage_status = {
            'invoices_used': 10,
            'invoices_limit': 100,
            'expenses_used': 5,
            'expenses_limit': 100,
            'products_used': 20,
            'products_limit': 100,
            'status': 'ok'
        }
        return jsonify({'usage_status': usage_status}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

