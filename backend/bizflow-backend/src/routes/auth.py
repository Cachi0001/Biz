from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from src.models.user import User, db
from datetime import timedelta, datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields - removed username, made phone required
        required_fields = ['email', 'phone', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists by email
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({
                'error': 'Email already exists',
                'message': 'An account with this email already exists. Please use a different email or try logging in.',
                'field': 'email'
            }), 400
        
        # Check if user already exists by phone
        existing_phone = User.query.filter_by(phone=data['phone']).first()
        if existing_phone:
            return jsonify({
                'error': 'Phone number already exists',
                'message': 'An account with this phone number already exists. Please use a different phone number or try logging in.',
                'field': 'phone'
            }), 400
        
        # Create new user - removed username field
        user = User(
            email=data['email'],
            phone=data['phone'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            business_name=data.get('business_name')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user using email or phone"""
    try:
        data = request.get_json()
        
        # Validate required fields - changed to accept email_or_phone
        if not data.get('email_or_phone') or not data.get('password'):
            return jsonify({'error': 'Email/Phone and password are required'}), 400
        
        # Find user by email or phone
        identifier = data['email_or_phone']
        user = User.query.filter(
            (User.email == identifier) | 
            (User.phone == identifier)
        ).first()
        
        if not user:
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'No account found with this email or phone number. Please check your credentials or sign up for a new account.',
                'field': 'email_or_phone'
            }), 401
            
        if not user.check_password(data['password']):
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'Incorrect password. Please check your password and try again.',
                'field': 'password'
            }), 401
        
        if not user.active:  # Changed from is_active to active to match Supabase schema
            return jsonify({
                'error': 'Account deactivated',
                'message': 'Your account has been deactivated. Please contact support for assistance.',
                'field': 'account'
            }), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields - removed username-related fields
        allowed_fields = [
            'first_name', 'last_name', 'phone', 'business_name'
        ]
        
        for field in allowed_fields:
            if field in data:
                # Check for phone uniqueness if updating phone
                if field == 'phone' and data[field] != user.phone:
                    existing_phone = User.query.filter_by(phone=data[field]).first()
                    if existing_phone:
                        return jsonify({
                            'error': 'Phone number already exists',
                            'message': 'This phone number is already associated with another account.',
                            'field': 'phone'
                        }), 400
                
                setattr(user, field, data[field])
        
        # Handle password change
        if data.get('new_password'):
            if not data.get('current_password'):
                return jsonify({'error': 'Current password is required'}), 400
            
            if not user.check_password(data['current_password']):
                return jsonify({'error': 'Current password is incorrect'}), 400
            
            user.set_password(data['new_password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
