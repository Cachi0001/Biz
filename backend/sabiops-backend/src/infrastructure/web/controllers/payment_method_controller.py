import logging
from flask import Blueprint, request, jsonify
from typing import Dict, Any

from core.use_cases.payment.get_payment_methods_use_case import GetPaymentMethodsUseCase
from infrastructure.config.dependency_injection import get_container
from shared.utils.response_utils import success_response, error_response
from infrastructure.web.middleware.auth_middleware import require_auth

logger = logging.getLogger(__name__)

payment_method_bp = Blueprint('payment_methods', __name__)

@payment_method_bp.route('/methods', methods=['GET'])
@require_auth
def get_payment_methods():
    """Get all active payment methods with optional filtering"""
    try:
        container = get_container()
        use_case = container.get(GetPaymentMethodsUseCase)
        
        # Get query parameters
        payment_type = request.args.get('type')
        pos_only = request.args.get('pos_only', 'false').lower() == 'true'
        
        result = await use_case.execute(payment_type=payment_type, pos_only=pos_only)
        
        if result['success']:
            return success_response(
                data={
                    'payment_methods': result['payment_methods'],
                    'grouped_methods': result['grouped_methods'],
                    'total_count': result['total_count']
                },
                message="Payment methods retrieved successfully"
            )
        else:
            return error_response(
                message=result.get('error', 'Failed to retrieve payment methods'),
                status_code=500
            )
            
    except Exception as e:
        logger.error(f"Error in get_payment_methods: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )

@payment_method_bp.route('/methods/<payment_method_id>', methods=['GET'])
@require_auth
def get_payment_method_by_id(payment_method_id: str):
    """Get a specific payment method by ID"""
    try:
        container = get_container()
        use_case = container.get(GetPaymentMethodsUseCase)
        
        result = await use_case.get_payment_method_by_id(payment_method_id)
        
        if result['success']:
            return success_response(
                data={'payment_method': result['payment_method']},
                message="Payment method retrieved successfully"
            )
        else:
            return error_response(
                message=result.get('error', 'Payment method not found'),
                status_code=404
            )
            
    except Exception as e:
        logger.error(f"Error in get_payment_method_by_id: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )

@payment_method_bp.route('/methods/<payment_method_id>/validate', methods=['POST'])
@require_auth
def validate_payment_method():
    """Validate payment method for transaction with required fields"""
    try:
        data = request.get_json()
        payment_method_id = data.get('payment_method_id')
        pos_account_name = data.get('pos_account_name')
        pos_reference = data.get('pos_reference')
        
        if not payment_method_id:
            return error_response(
                message="Payment method ID is required",
                status_code=400
            )
        
        container = get_container()
        use_case = container.get(GetPaymentMethodsUseCase)
        
        result = await use_case.validate_payment_method_for_transaction(
            payment_method_id=payment_method_id,
            pos_account_name=pos_account_name,
            pos_reference=pos_reference
        )
        
        if result['success']:
            return success_response(
                data={
                    'payment_method': result['payment_method'],
                    'is_valid': True
                },
                message="Payment method validation successful"
            )
        else:
            return error_response(
                message=result.get('error', 'Validation failed'),
                data={'validation_errors': result.get('validation_errors', {})},
                status_code=400
            )
            
    except Exception as e:
        logger.error(f"Error in validate_payment_method: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )