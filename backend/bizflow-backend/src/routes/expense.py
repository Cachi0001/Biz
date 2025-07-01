from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.expense import Expense, ExpenseCategory
from datetime import datetime, date
import os
from werkzeug.utils import secure_filename

expense_bp = Blueprint('expense', __name__)

# Allowed file extensions for receipts
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@expense_bp.route('', methods=['GET'])
@jwt_required()
def get_expenses():
    """Get all expenses for the current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Expense.query.filter_by(user_id=user_id)
        
        # Apply filters
        if category:
            query = query.filter_by(category=category)
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Expense.expense_date >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Expense.expense_date <= end_date)
        
        expenses = query.order_by(Expense.expense_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'expenses': [expense.to_dict() for expense in expenses.items],
            'total': expenses.total,
            'pages': expenses.pages,
            'current_page': page,
            'per_page': per_page
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('', methods=['POST'])
@jwt_required()
def create_expense():
    """Create a new expense"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'amount', 'category', 'expense_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse expense date
        expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()
        
        expense = Expense(
            user_id=user_id,
            title=data['title'],
            description=data.get('description'),
            amount=float(data['amount']),
            category=data['category'],
            payment_method=data.get('payment_method'),
            is_tax_deductible=data.get('is_tax_deductible', False),
            tax_category=data.get('tax_category'),
            vendor_name=data.get('vendor_name'),
            vendor_contact=data.get('vendor_contact'),
            expense_date=expense_date,
            status=data.get('status', 'pending')
        )
        
        db.session.add(expense)
        db.session.commit()
        
        return jsonify({
            'message': 'Expense created successfully',
            'expense': expense.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_expense(expense_id):
    """Get a specific expense"""
    try:
        user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        return jsonify({'expense': expense.to_dict()})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update an expense"""
    try:
        user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            expense.title = data['title']
        if 'description' in data:
            expense.description = data['description']
        if 'amount' in data:
            expense.amount = float(data['amount'])
        if 'category' in data:
            expense.category = data['category']
        if 'payment_method' in data:
            expense.payment_method = data['payment_method']
        if 'is_tax_deductible' in data:
            expense.is_tax_deductible = data['is_tax_deductible']
        if 'tax_category' in data:
            expense.tax_category = data['tax_category']
        if 'vendor_name' in data:
            expense.vendor_name = data['vendor_name']
        if 'vendor_contact' in data:
            expense.vendor_contact = data['vendor_contact']
        if 'expense_date' in data:
            expense.expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()
        if 'status' in data:
            expense.status = data['status']
        
        expense.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Expense updated successfully',
            'expense': expense.to_dict()
        })
    
    except ValueError as e:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense"""
    try:
        user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'Expense deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/upload-receipt/<int:expense_id>', methods=['POST'])
@jwt_required()
def upload_receipt(expense_id):
    """Upload receipt for an expense using Cloudinary"""
    try:
        user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        if 'receipt' not in request.files:
            return jsonify({'error': 'No receipt file provided'}), 400
        
        file = request.files['receipt']
        
        # Import Cloudinary service
        from src.services.cloudinary_service import CloudinaryService, RECEIPT_EXTENSIONS
        
        # Validate file
        validation = CloudinaryService.validate_file(
            file, 
            allowed_extensions=RECEIPT_EXTENSIONS,
            max_size_mb=16
        )
        
        if not validation['valid']:
            return jsonify({'error': validation['error']}), 400
        
        # Upload to Cloudinary
        upload_result = CloudinaryService.upload_receipt(file, user_id, expense_id)
        
        if not upload_result['success']:
            return jsonify({'error': f'Upload failed: {upload_result["error"]}'}), 500
        
        # Update expense with receipt info
        expense.receipt_filename = upload_result['original_filename']
        expense.receipt_url = upload_result['url']
        expense.receipt_public_id = upload_result['public_id']
        expense.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Receipt uploaded successfully',
            'receipt_url': expense.receipt_url,
            'receipt_filename': expense.receipt_filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_expense_categories():
    """Get expense categories"""
    try:
        user_id = get_jwt_identity()
        
        # Get user-specific categories
        user_categories = ExpenseCategory.query.filter_by(user_id=user_id).all()
        
        # Get default categories
        default_categories = ExpenseCategory.query.filter_by(is_default=True).all()
        
        # Combine and return
        all_categories = user_categories + default_categories
        
        return jsonify({
            'categories': [category.to_dict() for category in all_categories]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expense_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_expense_stats():
    """Get expense statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Expense.query.filter_by(user_id=user_id)
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Expense.expense_date >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Expense.expense_date <= end_date)
        
        expenses = query.all()
        
        # Calculate statistics
        total_expenses = sum(expense.amount for expense in expenses)
        total_count = len(expenses)
        
        # Group by category
        category_stats = {}
        for expense in expenses:
            if expense.category not in category_stats:
                category_stats[expense.category] = {'count': 0, 'total': 0}
            category_stats[expense.category]['count'] += 1
            category_stats[expense.category]['total'] += expense.amount
        
        # Group by month
        monthly_stats = {}
        for expense in expenses:
            month_key = expense.expense_date.strftime('%Y-%m')
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {'count': 0, 'total': 0}
            monthly_stats[month_key]['count'] += 1
            monthly_stats[month_key]['total'] += expense.amount
        
        return jsonify({
            'total_expenses': total_expenses,
            'total_count': total_count,
            'average_expense': total_expenses / total_count if total_count > 0 else 0,
            'category_breakdown': category_stats,
            'monthly_breakdown': monthly_stats
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

