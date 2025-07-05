from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.customer import Customer
from src.models.user import db

customer_bp = Blueprint('customer', __name__)

@customer_bp.route('/', methods=['GET'])
@jwt_required()
def get_customers():
    """Get all customers for the current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        query = Customer.query.filter_by(user_id=user_id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        if search:
            query = query.filter(
                (Customer.name.contains(search)) |
                (Customer.email.contains(search)) |
                (Customer.phone.contains(search))
            )
        
        customers = query.order_by(Customer.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'customers': [customer.to_dict() for customer in customers.items],
            'total': customers.total,
            'pages': customers.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    """Get a specific customer"""
    try:
        user_id = get_jwt_identity()
        customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        return jsonify({'customer': customer.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/', methods=['POST'])
@jwt_required()
def create_customer():
    """Create a new customer"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Customer name is required'}), 400
        
        # Check if customer with same email exists for this user
        if data.get('email'):
            existing_customer = Customer.query.filter_by(
                user_id=user_id, 
                email=data['email']
            ).first()
            if existing_customer:
                return jsonify({'error': 'Customer with this email already exists'}), 400
        
        customer = Customer(
            user_id=user_id,
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            country=data.get('country', 'Nigeria'),
            customer_type=data.get('customer_type', 'individual'),
            company_name=data.get('company_name'),
            tax_id=data.get('tax_id'),
            notes=data.get('notes')
        )
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({
            'message': 'Customer created successfully',
            'customer': customer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """Update a customer"""
    try:
        user_id = get_jwt_identity()
        customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        data = request.get_json()
        
        # Check if email is being changed and if it conflicts
        if data.get('email') and data['email'] != customer.email:
            existing_customer = Customer.query.filter_by(
                user_id=user_id, 
                email=data['email']
            ).first()
            if existing_customer:
                return jsonify({'error': 'Customer with this email already exists'}), 400
        
        # Update allowed fields
        allowed_fields = [
            'name', 'email', 'phone', 'address', 'city', 'state', 'country',
            'customer_type', 'company_name', 'tax_id', 'notes', 'is_active'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(customer, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Customer updated successfully',
            'customer': customer.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """Delete (deactivate) a customer"""
    try:
        user_id = get_jwt_identity()
        customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Soft delete by setting is_active to False
        customer.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Customer deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/<int:customer_id>/invoices', methods=['GET'])
@jwt_required()
def get_customer_invoices(customer_id):
    """Get all invoices for a specific customer"""
    try:
        user_id = get_jwt_identity()
        customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        invoices = [invoice.to_dict() for invoice in customer.invoices]
        
        return jsonify({
            'customer': customer.to_dict(),
            'invoices': invoices
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_customer_stats():
    """Get customer statistics"""
    try:
        user_id = get_jwt_identity()
        
        total_customers = Customer.query.filter_by(user_id=user_id, is_active=True).count()
        individual_customers = Customer.query.filter_by(
            user_id=user_id, 
            is_active=True, 
            customer_type='individual'
        ).count()
        business_customers = Customer.query.filter_by(
            user_id=user_id, 
            is_active=True, 
            customer_type='business'
        ).count()
        
        return jsonify({
            'total_customers': total_customers,
            'individual_customers': individual_customers,
            'business_customers': business_customers
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

