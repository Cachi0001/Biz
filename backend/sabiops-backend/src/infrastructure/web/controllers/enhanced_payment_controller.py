import logging
from flask import Blueprint, request, jsonify
from functools import wraps

from core.use_cases.payment.record_enhanced_payment_use_case import RecordEnhancedPaymentUseCase
from core.use_cases.payment.get_payment_methods_use_case import GetPaymentMethodsUseCase
from core.use_cases.analytics.get_enhanced_daily_summary_use_case import GetEnhancedDailySummaryUseCase
from infrastructure.config.dependency_injection import get_container
from infrastructure.web.middleware.auth_middleware import require_auth
from shared.exceptions.business_exceptions import ValidationException, BusinessException
from shared.utils.response_utils import success_response, error_response
from utils.html_templates import HTMLTemplateGenerator

logger = logging.getLogger(__name__)

enhanced_payment_bp = Blueprint('enhanced_payment', __name__, url_prefix='/api/enhanced-payments')

def get_use_cases():
    """Get use cases from dependency injection container"""
    container = get_container()
    return {
        'record_payment': container.get('RecordEnhancedPaymentUseCase'),
        'get_payment_methods': container.get('GetPaymentMethodsUseCase'),
        'get_daily_summary': container.get('GetEnhancedDailySummaryUseCase')
    }

@enhanced_payment_bp.route('/methods', methods=['GET'])
@require_auth
def get_payment_methods():
    """Get all available payment methods"""
    try:
        use_cases = get_use_cases()
        
        # Get query parameters for filtering
        filters = {}
        if request.args.get('type'):
            filters['type'] = request.args.get('type')
        if request.args.get('is_pos'):
            filters['is_pos'] = request.args.get('is_pos').lower() == 'true'
        if request.args.get('requires_reference'):
            filters['requires_reference'] = request.args.get('requires_reference').lower() == 'true'
        
        result = await use_cases['get_payment_methods'].execute(filters)
        
        return success_response(
            data=result,
            message="Payment methods retrieved successfully"
        )
        
    except BusinessException as e:
        logger.error(f"Business error in get_payment_methods: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Unexpected error in get_payment_methods: {str(e)}")
        return error_response("Internal server error", 500)

@enhanced_payment_bp.route('/methods/pos', methods=['GET'])
@require_auth
def get_pos_methods():
    """Get only POS payment methods"""
    try:
        use_cases = get_use_cases()
        result = await use_cases['get_payment_methods'].get_pos_methods()
        
        return success_response(
            data=result,
            message="POS payment methods retrieved successfully"
        )
        
    except BusinessException as e:
        logger.error(f"Business error in get_pos_methods: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Unexpected error in get_pos_methods: {str(e)}")
        return error_response("Internal server error", 500)

@enhanced_payment_bp.route('/methods/cash', methods=['GET'])
@require_auth
def get_cash_methods():
    """Get only cash payment methods"""
    try:
        use_cases = get_use_cases()
        result = await use_cases['get_payment_methods'].get_cash_methods()
        
        return success_response(
            data=result,
            message="Cash payment methods retrieved successfully"
        )
        
    except BusinessException as e:
        logger.error(f"Business error in get_cash_methods: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Unexpected error in get_cash_methods: {str(e)}")
        return error_response("Internal server error", 500)

@enhanced_payment_bp.route('/', methods=['POST'])
@require_auth
def record_payment():
    """Record a new enhanced payment"""
    try:
        use_cases = get_use_cases()
        
        # Get user ID from auth middleware
        user_id = request.current_user['id']
        
        # Get payment data from request
        payment_data = request.get_json()
        
        if not payment_data:
            return error_response("Payment data is required", 400)
        
        result = await use_cases['record_payment'].execute(payment_data, user_id)
        
        return success_response(
            data=result,
            message="Payment recorded successfully",
            status_code=201
        )
        
    except ValidationException as e:
        logger.error(f"Validation error in record_payment: {str(e)}")
        return error_response(str(e), 400, e.errors)
    except BusinessException as e:
        logger.error(f"Business error in record_payment: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Unexpected error in record_payment: {str(e)}")
        return error_response("Internal server error", 500)

@enhanced_payment_bp.route('/daily-summary', methods=['GET'])
@require_auth
def get_daily_summary():
    """Get enhanced daily summary with cash at hand, POS totals, and category sales"""
    try:
        use_cases = get_use_cases()
        
        # Get user ID from auth middleware
        user_id = request.current_user['id']
        
        # Get target date from query parameters
        target_date = request.args.get('date')  # Format: YYYY-MM-DD
        
        result = await use_cases['get_daily_summary'].execute(user_id, target_date)
        
        return success_response(
            data=result,
            message="Daily summary retrieved successfully"
        )
        
    except BusinessException as e:
        logger.error(f"Business error in get_daily_summary: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Unexpected error in get_daily_summary: {str(e)}")
        return error_response("Internal server error", 500)

@enhanced_payment_bp.route('/daily-summary/download', methods=['GET'])
@require_auth
def download_daily_summary():
    """Download daily summary in HTML format"""
    try:
        use_cases = get_use_cases()
        
        # Get user ID from auth middleware
        user_id = request.current_user['id']
        
        # Get target date from query parameters
        target_date = request.args.get('date')  # Format: YYYY-MM-DD
        
        # Get the daily summary data
        summary_result = await use_cases['get_daily_summary'].execute(user_id, target_date)
        
        if not summary_result['success']:
            return error_response("Failed to generate daily summary", 400)
        
        # Generate HTML report using the template utility
        html_content = HTMLTemplateGenerator.generate_daily_summary_html(summary_result)
        
        # Return HTML file for download
        from flask import Response
        return Response(
            html_content,
            mimetype='text/html',
            headers={
                'Content-Disposition': f'attachment; filename="daily_summary_{target_date or "today"}.html"'
            }
        )
        
    except BusinessException as e:
        logger.error(f"Business error in download_daily_summary: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Unexpected error in download_daily_summary: {str(e)}")
        return error_response("Internal server error", 500)

