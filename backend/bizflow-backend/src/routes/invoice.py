from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.invoice import Invoice, InvoiceItem
from src.models.customer import Customer
from src.models.product import Product
from src.models.user import db
from datetime import datetime, date

invoice_bp = Blueprint('invoice', __name__)

@invoice_bp.route('/', methods=['GET'])
@jwt_required()
def get_invoices():
    """Get all invoices for the current user"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', '')
        customer_id = request.args.get('customer_id', type=int)
        
        query = Invoice.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        if customer_id:
            query = query.filter_by(customer_id=customer_id)
        
        invoices = query.order_by(Invoice.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'invoices': [invoice.to_dict() for invoice in invoices.items],
            'total': invoices.total,
            'pages': invoices.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    """Get a specific invoice"""
    try:
        user_id = get_jwt_identity()
        invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
        
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
        
        return jsonify({'invoice': invoice.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/', methods=['POST'])
@jwt_required()
def create_invoice():
    """Create a new invoice"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('customer_id'):
            return jsonify({'error': 'Customer ID is required'}), 400
        
        # Verify customer belongs to user
        customer = Customer.query.filter_by(
            id=data['customer_id'], 
            user_id=user_id
        ).first()
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Create invoice
        invoice = Invoice(
            user_id=user_id,
            customer_id=data['customer_id'],
            issue_date=datetime.strptime(data['issue_date'], '%Y-%m-%d').date() if data.get('issue_date') else date.today(),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
            payment_terms=data.get('payment_terms', 'Net 30'),
            notes=data.get('notes'),
            terms_and_conditions=data.get('terms_and_conditions'),
            currency=data.get('currency', 'NGN'),
            discount_amount=data.get('discount_amount', 0)
        )
        
        db.session.add(invoice)
        db.session.flush()  # Get the invoice ID
        
        # Add invoice items
        if data.get('items'):
            for item_data in data['items']:
                if not item_data.get('description') or not item_data.get('quantity') or not item_data.get('unit_price'):
                    return jsonify({'error': 'Item description, quantity, and unit_price are required'}), 400
                
                item = InvoiceItem(
                    invoice_id=invoice.id,
                    product_id=item_data.get('product_id'),
                    description=item_data['description'],
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    tax_rate=item_data.get('tax_rate', 0),
                    discount_rate=item_data.get('discount_rate', 0)
                )
                
                db.session.add(item)
        
        # Calculate totals
        db.session.flush()
        invoice.calculate_totals()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice created successfully',
            'invoice': invoice.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/<int:invoice_id>', methods=['PUT'])
@jwt_required()
def update_invoice(invoice_id):
    """Update an invoice"""
    try:
        user_id = get_jwt_identity()
        invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
        
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
        
        if invoice.status == 'paid':
            return jsonify({'error': 'Cannot update paid invoice'}), 400
        
        data = request.get_json()
        
        # Update invoice fields
        allowed_fields = [
            'issue_date', 'due_date', 'payment_terms', 'notes', 
            'terms_and_conditions', 'currency', 'discount_amount'
        ]
        
        for field in allowed_fields:
            if field in data:
                if field in ['issue_date', 'due_date'] and data[field]:
                    setattr(invoice, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    setattr(invoice, field, data[field])
        
        # Update items if provided
        if 'items' in data:
            # Remove existing items
            InvoiceItem.query.filter_by(invoice_id=invoice.id).delete()
            
            # Add new items
            for item_data in data['items']:
                if not item_data.get('description') or not item_data.get('quantity') or not item_data.get('unit_price'):
                    return jsonify({'error': 'Item description, quantity, and unit_price are required'}), 400
                
                item = InvoiceItem(
                    invoice_id=invoice.id,
                    product_id=item_data.get('product_id'),
                    description=item_data['description'],
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    tax_rate=item_data.get('tax_rate', 0),
                    discount_rate=item_data.get('discount_rate', 0)
                )
                
                db.session.add(item)
        
        # Recalculate totals
        db.session.flush()
        invoice.calculate_totals()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice updated successfully',
            'invoice': invoice.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice(invoice_id):
    """Delete an invoice"""
    try:
        user_id = get_jwt_identity()
        invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
        
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
        
        if invoice.status == 'paid':
            return jsonify({'error': 'Cannot delete paid invoice'}), 400
        
        db.session.delete(invoice)
        db.session.commit()
        
        return jsonify({'message': 'Invoice deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/<int:invoice_id>/status', methods=['PUT'])
@jwt_required()
def update_invoice_status(invoice_id):
    """Update invoice status"""
    try:
        user_id = get_jwt_identity()
        invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
        
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['draft', 'sent', 'paid', 'overdue', 'cancelled']:
            return jsonify({'error': 'Invalid status'}), 400
        
        invoice.status = new_status
        
        if new_status == 'sent' and not invoice.sent_at:
            invoice.sent_at = datetime.utcnow()
        elif new_status == 'paid':
            invoice.mark_as_paid()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice status updated successfully',
            'invoice': invoice.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/<int:invoice_id>/send', methods=['POST'])
@jwt_required()
def send_invoice(invoice_id):
    """Send invoice to customer"""
    try:
        user_id = get_jwt_identity()
        invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
        
        if not invoice:
            return jsonify({'error': 'Invoice not found'}), 404
        
        if not invoice.customer.email:
            return jsonify({'error': 'Customer email is required to send invoice'}), 400
        
        # Update status and timestamp
        invoice.status = 'sent'
        invoice.sent_at = datetime.utcnow()
        
        db.session.commit()
        
        # TODO: Implement email sending logic here
        
        return jsonify({
            'message': 'Invoice sent successfully',
            'invoice': invoice.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_invoice_stats():
    """Get invoice statistics"""
    try:
        user_id = get_jwt_identity()
        
        total_invoices = Invoice.query.filter_by(user_id=user_id).count()
        draft_invoices = Invoice.query.filter_by(user_id=user_id, status='draft').count()
        sent_invoices = Invoice.query.filter_by(user_id=user_id, status='sent').count()
        paid_invoices = Invoice.query.filter_by(user_id=user_id, status='paid').count()
        overdue_invoices = Invoice.query.filter_by(user_id=user_id, status='overdue').count()
        
        # Calculate total amounts
        all_invoices = Invoice.query.filter_by(user_id=user_id).all()
        total_amount = sum(invoice.total_amount for invoice in all_invoices)
        paid_amount = sum(invoice.amount_paid for invoice in all_invoices)
        outstanding_amount = total_amount - paid_amount
        
        return jsonify({
            'total_invoices': total_invoices,
            'draft_invoices': draft_invoices,
            'sent_invoices': sent_invoices,
            'paid_invoices': paid_invoices,
            'overdue_invoices': overdue_invoices,
            'total_amount': float(total_amount),
            'paid_amount': float(paid_amount),
            'outstanding_amount': float(outstanding_amount)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@invoice_bp.route('/overdue', methods=['GET'])
@jwt_required()
def get_overdue_invoices():
    """Get overdue invoices"""
    try:
        user_id = get_jwt_identity()
        
        # Find invoices that are past due date and not paid
        overdue_invoices = Invoice.query.filter(
            Invoice.user_id == user_id,
            Invoice.status != 'paid',
            Invoice.due_date < date.today()
        ).all()
        
        # Update status to overdue if not already
        for invoice in overdue_invoices:
            if invoice.status != 'overdue':
                invoice.status = 'overdue'
        
        db.session.commit()
        
        return jsonify({
            'invoices': [invoice.to_dict() for invoice in overdue_invoices],
            'count': len(overdue_invoices)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

