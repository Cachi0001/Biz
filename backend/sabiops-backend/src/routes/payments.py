#!/usr/bin/env python3
"""
Payment Management API Endpoints

This module provides API endpoints for payment management including
standardized payment methods, POS transactions, and daily summaries.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import logging
from src.utils.user_context import get_user_context
from src.services.payment_service import PaymentService
from src.services.payment_method_service import PaymentMethodService
from src.utils.exceptions import ValidationError, NotFoundError, DatabaseError

payments_bp = Blueprint("payments", __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config['SUPABASE']

def success_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    return jsonify({
        "success": False,
        "error": error,
        "message": message
    }), status_code

@payments_bp.route("/methods", methods=["GET"])
@jwt_required()
def get_payment_methods():
    """Get standardized payment methods"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Get query parameters
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        payment_type = request.args.get('type')  # Cash, Digital, Credit
        pos_only = request.args.get('pos_only', 'false').lower() == 'true'
        dropdown_format = request.args.get('dropdown', 'false').lower() == 'true'
        
        payment_method_service = PaymentMethodService()
        
        try:
            if dropdown_format:
                # Return in dropdown-friendly format
                methods = payment_method_service.get_payment_methods_for_dropdown(active_only)
            elif pos_only:
                # Return only POS methods
                methods = payment_method_service.get_pos_payment_methods(active_only)
            elif payment_type:
                # Return methods by type
                methods = payment_method_service.get_payment_methods_by_type(payment_type, active_only)
            else:
                # Return all methods
                methods = payment_method_service.get_all_payment_methods(active_only)
            
            return jsonify({
                "success": True,
                "data": {
                    "payment_methods": methods,
                    "count": len(methods)
                },
                "message": "Payment methods retrieved successfully"
            }), 200
            
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "toast": {
                    "type": "error",
                    "message": str(e),
                    "timeout": 3000
                }
            }), 400
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": "Database error occurred",
                "error": str(e),
                "toast": {
                    "type": "error",
                    "message": "Failed to retrieve payment methods",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error retrieving payment methods: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to retrieve payment methods",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@payments_bp.route("/record", methods=["POST"])
@jwt_required()
def record_payment():
    """Record a new payment with POS transaction support"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'payment_method_id']
        for field in required_fields:
            if not data or field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "message": f"{field} is required",
                    "toast": {
                        "type": "error",
                        "message": f"{field} is required",
                        "timeout": 3000
                    }
                }), 400
        
        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({
                    "success": False,
                    "message": "Payment amount must be greater than 0",
                    "toast": {
                        "type": "error",
                        "message": "Payment amount must be greater than 0",
                        "timeout": 3000
                    }
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "Invalid payment amount format",
                "toast": {
                    "type": "error",
                    "message": "Invalid payment amount provided",
                    "timeout": 3000
                }
            }), 400
        
        # Prepare payment data
        payment_data = {
            'amount': amount,
            'payment_method_id': data['payment_method_id'],
            'user_id': user_id,
            'description': data.get('description', ''),
            'pos_account_name': data.get('pos_account_name', ''),
            'transaction_type': data.get('transaction_type', 'Sale'),
            'pos_reference_number': data.get('pos_reference_number', ''),
            'reference_number': data.get('reference_number', '')
        }
        
        payment_service = PaymentService()
        
        try:
            # Record the payment
            payment_record = payment_service.record_payment(payment_data)
            
            return jsonify({
                "success": True,
                "message": f"Payment of ₦{amount:,.2f} recorded successfully",
                "data": {
                    "payment": payment_record
                },
                "toast": {
                    "type": "success",
                    "message": f"Payment of ₦{amount:,.2f} recorded",
                    "timeout": 3000
                }
            }), 201
            
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "toast": {
                    "type": "error",
                    "message": str(e),
                    "timeout": 3000
                }
            }), 400
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": "Database error occurred",
                "error": str(e),
                "toast": {
                    "type": "error",
                    "message": "Failed to record payment",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error recording payment: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to record payment",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@payments_bp.route("/daily-summary", methods=["GET"])
@jwt_required()
def get_daily_payment_summary():
    """Get daily payment summary with method breakdowns"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Get query parameters
        target_date_str = request.args.get('date')
        if target_date_str:
            try:
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "Invalid date format. Use YYYY-MM-DD",
                    "toast": {
                        "type": "error",
                        "message": "Invalid date format",
                        "timeout": 3000
                    }
                }), 400
        else:
            target_date = date.today()
        
        payment_service = PaymentService()
        
        try:
            # Get cash summary
            cash_summary = payment_service.get_daily_cash_summary(target_date, user_id)
            
            # Get POS summary
            pos_summary = payment_service.get_pos_summary(target_date, user_id)
            
            # Get payment method breakdown
            payment_breakdown = payment_service.get_payment_method_breakdown(target_date, user_id)
            
            summary_data = {
                'date': target_date.isoformat(),
                'cash_summary': cash_summary,
                'pos_summary': pos_summary,
                'payment_method_breakdown': payment_breakdown,
                'totals': {
                    'total_cash_flow': cash_summary['cash_at_hand'] + pos_summary['net_flow'],
                    'total_transactions': cash_summary['transaction_count'] + pos_summary['total_transactions'],
                    'total_amount': payment_breakdown['total_amount']
                }
            }
            
            return jsonify({
                "success": True,
                "data": summary_data,
                "message": f"Daily payment summary for {target_date} retrieved successfully"
            }), 200
            
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": "Database error occurred",
                "error": str(e),
                "toast": {
                    "type": "error",
                    "message": "Failed to retrieve payment summary",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error retrieving daily payment summary: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to retrieve daily payment summary",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@payments_bp.route("/<payment_id>", methods=["GET"])
@jwt_required()
def get_payment_by_id(payment_id):
    """Get a specific payment by ID"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        payment_service = PaymentService()
        
        try:
            payment = payment_service.get_payment_by_id(payment_id)
            
            # Verify payment belongs to user (basic security check)
            if payment.get('user_id') != user_id:
                return jsonify({
                    "success": False,
                    "message": "Payment not found",
                    "toast": {
                        "type": "error",
                        "message": "Payment not found",
                        "timeout": 3000
                    }
                }), 404
            
            return jsonify({
                "success": True,
                "data": {"payment": payment},
                "message": "Payment retrieved successfully"
            }), 200
            
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "toast": {
                    "type": "error",
                    "message": str(e),
                    "timeout": 3000
                }
            }), 400
        except NotFoundError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "toast": {
                    "type": "error",
                    "message": "Payment not found",
                    "timeout": 3000
                }
            }), 404
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": "Database error occurred",
                "error": str(e),
                "toast": {
                    "type": "error",
                    "message": "Failed to retrieve payment",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error retrieving payment {payment_id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to retrieve payment",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@payments_bp.route("/search", methods=["GET"])
@jwt_required()
def search_payments_by_reference():
    """Search payments by reference number"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Get query parameters
        reference_number = request.args.get('reference')
        is_pos = request.args.get('is_pos', 'false').lower() == 'true'
        
        if not reference_number:
            return jsonify({
                "success": False,
                "message": "Reference number is required",
                "toast": {
                    "type": "error",
                    "message": "Reference number is required",
                    "timeout": 3000
                }
            }), 400
        
        payment_service = PaymentService()
        
        try:
            payment = payment_service.get_payment_by_reference(reference_number, is_pos)
            
            if payment:
                # Verify payment belongs to user (basic security check)
                if payment.get('user_id') != user_id:
                    payment = None
            
            return jsonify({
                "success": True,
                "data": {
                    "payment": payment,
                    "found": payment is not None
                },
                "message": "Payment search completed"
            }), 200
            
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "toast": {
                    "type": "error",
                    "message": str(e),
                    "timeout": 3000
                }
            }), 400
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": "Database error occurred",
                "error": str(e),
                "toast": {
                    "type": "error",
                    "message": "Failed to search payments",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error searching payments: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to search payments",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@payments_bp.route("/<payment_id>/status", methods=["PUT"])
@jwt_required()
def update_payment_status(payment_id):
    """Update payment status (for refunds, cancellations, etc.)"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        data = request.get_json()
        
        # Validate required fields
        if not data or 'status' not in data:
            return jsonify({
                "success": False,
                "message": "Payment status is required",
                "toast": {
                    "type": "error",
                    "message": "Payment status is required",
                    "timeout": 3000
                }
            }), 400
        
        new_status = data['status']
        notes = data.get('notes', '')
        
        payment_service = PaymentService()
        
        try:
            # First verify payment belongs to user
            payment = payment_service.get_payment_by_id(payment_id)
            if payment.get('user_id') != user_id:
                return jsonify({
                    "success": False,
                    "message": "Payment not found",
                    "toast": {
                        "type": "error",
                        "message": "Payment not found",
                        "timeout": 3000
                    }
                }), 404
            
            # Update payment status
            updated_payment = payment_service.update_payment_status(payment_id, new_status, notes)
            
            return jsonify({
                "success": True,
                "message": f"Payment status updated to {new_status}",
                "data": {"payment": updated_payment},
                "toast": {
                    "type": "success",
                    "message": f"Payment marked as {new_status.lower()}",
                    "timeout": 3000
                }
            }), 200
            
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "toast": {
                    "type": "error",
                    "message": str(e),
                    "timeout": 3000
                }
            }), 400
        except NotFoundError as e:
            return jsonify({
                "success": False,
                "message": str(e),
                "toast": {
                    "type": "error",
                    "message": "Payment not found",
                    "timeout": 3000
                }
            }), 404
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": "Database error occurred",
                "error": str(e),
                "toast": {
                    "type": "error",
                    "message": "Failed to update payment status",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error updating payment status {payment_id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to update payment status",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500