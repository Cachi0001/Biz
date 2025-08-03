"""
Notification Triggers API Routes
Provides endpoints to manually trigger and manage business notifications
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import asyncio

from src.services.notification_scheduler import get_scheduler
from src.services.triggers.low_stock_trigger import create_low_stock_monitor
from src.services.triggers.overdue_invoice_trigger import create_overdue_invoice_monitor

logger = logging.getLogger(__name__)

# Create blueprint
notification_triggers_bp = Blueprint('notification_triggers', __name__)

def get_supabase():
    """Get Supabase client from Flask app config"""
    return current_app.config.get('SUPABASE')

def success_response(data=None, message="Success", status_code=200):
    """Standard success response format"""
    return jsonify({
        "success": True,
        "data": data,
        "message": message
    }), status_code

def error_response(error, message="Error", status_code=400):
    """Standard error response format"""
    return jsonify({
        "success": False,
        "error": str(error),
        "message": message
    }), status_code

def run_async(coro):
    """Helper to run async functions in Flask routes"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)

# =============================================================================
# Manual Trigger Endpoints
# =============================================================================

@notification_triggers_bp.route('/trigger/low-stock', methods=['POST'])
@jwt_required()
def trigger_low_stock_check():
    """Manually trigger low stock check"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get optional product_id from request
        data = request.get_json() or {}
        product_id = data.get('product_id')
        
        monitor = create_low_stock_monitor(supabase)
        
        if product_id:
            # Check specific product
            result = run_async(monitor.check_specific_product(product_id))
        else:
            # Check all products
            result = run_async(monitor.check_all_products())
        
        return success_response(
            data=result,
            message="Low stock check completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error in manual low stock trigger: {str(e)}")
        return error_response(str(e), "Failed to run low stock check", 500)

@notification_triggers_bp.route('/trigger/overdue-invoices', methods=['POST'])
@jwt_required()
def trigger_overdue_invoice_check():
    """Manually trigger overdue invoice check"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        # Get optional invoice_id from request
        data = request.get_json() or {}
        invoice_id = data.get('invoice_id')
        
        monitor = create_overdue_invoice_monitor(supabase)
        
        if invoice_id:
            # Check specific invoice
            result = run_async(monitor.check_specific_invoice(invoice_id))
        else:
            # Check all overdue invoices
            result = run_async(monitor.check_all_overdue_invoices())
        
        return success_response(
            data=result,
            message="Overdue invoice check completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error in manual overdue invoice trigger: {str(e)}")
        return error_response(str(e), "Failed to run overdue invoice check", 500)

@notification_triggers_bp.route('/trigger/inventory-changes', methods=['POST'])
@jwt_required()
def trigger_inventory_monitoring():
    """Manually trigger inventory change monitoring"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        monitor = create_low_stock_monitor(supabase)
        result = run_async(monitor.monitor_inventory_changes())
        
        return success_response(
            data=result,
            message="Inventory change monitoring completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error in inventory monitoring trigger: {str(e)}")
        return error_response(str(e), "Failed to run inventory monitoring", 500)

@notification_triggers_bp.route('/trigger/all', methods=['POST'])
@jwt_required()
def trigger_all_checks():
    """Manually trigger all notification checks"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        scheduler = get_scheduler(supabase)
        result = scheduler.run_manual_check("all")
        
        return success_response(
            data=result,
            message="All notification checks completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error in manual all triggers: {str(e)}")
        return error_response(str(e), "Failed to run all checks", 500)

# =============================================================================
# Scheduler Management
# =============================================================================

@notification_triggers_bp.route('/scheduler/status', methods=['GET'])
@jwt_required()
def get_scheduler_status():
    """Get notification scheduler status"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        scheduler = get_scheduler(supabase)
        status = scheduler.get_schedule_status()
        
        return success_response(
            data=status,
            message="Scheduler status retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting scheduler status: {str(e)}")
        return error_response(str(e), "Failed to get scheduler status", 500)

@notification_triggers_bp.route('/scheduler/start', methods=['POST'])
@jwt_required()
def start_scheduler():
    """Start the notification scheduler"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        scheduler = get_scheduler(supabase)
        scheduler.start()
        
        return success_response(
            data={"status": "started"},
            message="Notification scheduler started successfully"
        )
        
    except Exception as e:
        logger.error(f"Error starting scheduler: {str(e)}")
        return error_response(str(e), "Failed to start scheduler", 500)

@notification_triggers_bp.route('/scheduler/stop', methods=['POST'])
@jwt_required()
def stop_scheduler():
    """Stop the notification scheduler"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        scheduler = get_scheduler(supabase)
        scheduler.stop()
        
        return success_response(
            data={"status": "stopped"},
            message="Notification scheduler stopped successfully"
        )
        
    except Exception as e:
        logger.error(f"Error stopping scheduler: {str(e)}")
        return error_response(str(e), "Failed to stop scheduler", 500)

# =============================================================================
# Analytics and Reporting
# =============================================================================

@notification_triggers_bp.route('/analytics/overdue-summary', methods=['GET'])
@jwt_required()
def get_overdue_summary():
    """Get overdue invoice summary"""
    try:
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        monitor = create_overdue_invoice_monitor(supabase)
        summary = run_async(monitor.get_overdue_summary())
        
        return success_response(
            data=summary,
            message="Overdue summary retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting overdue summary: {str(e)}")
        return error_response(str(e), "Failed to get overdue summary", 500)

@notification_triggers_bp.route('/analytics/overdue-report/<user_id>', methods=['POST'])
@jwt_required()
def send_overdue_report(user_id):
    """Send overdue invoice report to specific user"""
    try:
        current_user = get_jwt_identity()
        
        # Only allow users to get their own report or admin users
        if current_user != user_id:
            return error_response("Access denied", "Unauthorized", 403)
        
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        monitor = create_overdue_invoice_monitor(supabase)
        result = run_async(monitor.send_overdue_summary_report(user_id))
        
        return success_response(
            data=result,
            message="Overdue report sent successfully"
        )
        
    except Exception as e:
        logger.error(f"Error sending overdue report: {str(e)}")
        return error_response(str(e), "Failed to send overdue report", 500)

# =============================================================================
# Testing Endpoints
# =============================================================================

@notification_triggers_bp.route('/test/low-stock', methods=['POST'])
@jwt_required()
def test_low_stock_notification():
    """Send a test low stock notification"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Use test data or provided data
        product_name = data.get('product_name', 'Test Product')
        current_quantity = data.get('current_quantity', 2)
        threshold = data.get('threshold', 5)
        product_id = data.get('product_id', 'test-product-id')
        
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        from src.services.notification_service import NotificationService
        notification_service = NotificationService(supabase)
        
        success, notification_id = run_async(
            notification_service.send_low_stock_alert(
                user_id=user_id,
                product_name=product_name,
                current_quantity=current_quantity,
                threshold=threshold,
                product_id=product_id
            )
        )
        
        if success:
            return success_response(
                data={
                    "notification_id": notification_id,
                    "test_data": {
                        "product_name": product_name,
                        "current_quantity": current_quantity,
                        "threshold": threshold
                    }
                },
                message="Test low stock notification sent successfully"
            )
        else:
            return error_response("Failed to send test notification", status_code=500)
        
    except Exception as e:
        logger.error(f"Error sending test low stock notification: {str(e)}")
        return error_response(str(e), "Failed to send test notification", 500)

@notification_triggers_bp.route('/test/overdue-invoice', methods=['POST'])
@jwt_required()
def test_overdue_invoice_notification():
    """Send a test overdue invoice notification"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Use test data or provided data
        customer_name = data.get('customer_name', 'Test Customer')
        invoice_number = data.get('invoice_number', 'INV-TEST-001')
        amount = data.get('amount', 50000.00)
        days_overdue = data.get('days_overdue', 7)
        invoice_id = data.get('invoice_id', 'test-invoice-id')
        
        supabase = get_supabase()
        if not supabase:
            return error_response("Database connection not available", status_code=500)
        
        from src.services.notification_service import NotificationService
        notification_service = NotificationService(supabase)
        
        success, notification_id = run_async(
            notification_service.send_overdue_invoice_alert(
                user_id=user_id,
                customer_name=customer_name,
                invoice_number=invoice_number,
                amount=amount,
                days_overdue=days_overdue,
                invoice_id=invoice_id
            )
        )
        
        if success:
            return success_response(
                data={
                    "notification_id": notification_id,
                    "test_data": {
                        "customer_name": customer_name,
                        "invoice_number": invoice_number,
                        "amount": amount,
                        "days_overdue": days_overdue
                    }
                },
                message="Test overdue invoice notification sent successfully"
            )
        else:
            return error_response("Failed to send test notification", status_code=500)
        
    except Exception as e:
        logger.error(f"Error sending test overdue invoice notification: {str(e)}")
        return error_response(str(e), "Failed to send test notification", 500)

# =============================================================================
# Health Check
# =============================================================================

@notification_triggers_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for notification triggers"""
    try:
        supabase = get_supabase()
        
        return success_response({
            "status": "healthy",
            "database_connected": bool(supabase),
            "available_triggers": [
                "low_stock",
                "overdue_invoices", 
                "inventory_changes",
                "all"
            ],
            "scheduler_available": True
        }, "Notification triggers service is healthy")
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return error_response(str(e), "Health check failed", 500)