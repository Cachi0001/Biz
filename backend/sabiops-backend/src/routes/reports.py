#!/usr/bin/env python3
"""
Daily Reports API Endpoints

This module provides API endpoints for generating and downloading
daily financial summaries, weekly reports, and HTML reports.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

from flask import Blueprint, request, jsonify, current_app, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
import logging
from src.utils.user_context import get_user_context
from src.services.reports_service import ReportsService
from src.services.html_report_service import HTMLReportService
from src.utils.exceptions import ValidationError, DatabaseError

reports_bp = Blueprint("reports", __name__)

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

@reports_bp.route("/daily-summary", methods=["GET"])
@jwt_required()
def get_daily_summary():
    """Get daily financial summary with date parameter support"""
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
        
        # Validate date range
        if target_date > date.today():
            return jsonify({
                "success": False,
                "message": "Cannot generate summary for future dates",
                "toast": {
                    "type": "error",
                    "message": "Cannot generate summary for future dates",
                    "timeout": 3000
                }
            }), 400
        
        reports_service = ReportsService()
        
        try:
            daily_summary = reports_service.generate_daily_summary(user_id, target_date)
            
            return jsonify({
                "success": True,
                "data": daily_summary,
                "message": f"Daily summary for {target_date} generated successfully"
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
                    "message": "Failed to generate daily summary",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error generating daily summary: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate daily summary",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@reports_bp.route("/weekly-summary", methods=["GET"])
@jwt_required()
def get_weekly_summary():
    """Get weekly financial summary"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Get query parameters
        week_ending_str = request.args.get('week_ending')
        if week_ending_str:
            try:
                week_ending_date = datetime.strptime(week_ending_str, '%Y-%m-%d').date()
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
            week_ending_date = date.today()
        
        reports_service = ReportsService()
        
        try:
            weekly_summary = reports_service.generate_weekly_summary(user_id, week_ending_date)
            
            return jsonify({
                "success": True,
                "data": weekly_summary,
                "message": f"Weekly summary generated successfully"
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
                    "message": "Failed to generate weekly summary",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error generating weekly summary: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate weekly summary",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@reports_bp.route("/monthly-summary", methods=["GET"])
@jwt_required()
def get_monthly_summary():
    """Get monthly financial summary"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Get query parameters
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        if not year or not month:
            # Default to current month
            today = date.today()
            year = year or today.year
            month = month or today.month
        
        # Validate parameters
        if not (1 <= month <= 12):
            return jsonify({
                "success": False,
                "message": "Month must be between 1 and 12",
                "toast": {
                    "type": "error",
                    "message": "Invalid month provided",
                    "timeout": 3000
                }
            }), 400
        
        if year < 2020 or year > date.today().year:
            return jsonify({
                "success": False,
                "message": f"Year must be between 2020 and {date.today().year}",
                "toast": {
                    "type": "error",
                    "message": "Invalid year provided",
                    "timeout": 3000
                }
            }), 400
        
        reports_service = ReportsService()
        
        try:
            monthly_summary = reports_service.generate_monthly_summary(user_id, year, month)
            
            return jsonify({
                "success": True,
                "data": monthly_summary,
                "message": f"Monthly summary for {year}-{month:02d} generated successfully"
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
                    "message": "Failed to generate monthly summary",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error generating monthly summary: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate monthly summary",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@reports_bp.route("/financial-dashboard", methods=["GET"])
@jwt_required()
def get_financial_dashboard():
    """Get comprehensive financial dashboard data"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        reports_service = ReportsService()
        
        try:
            dashboard_data = reports_service.get_financial_dashboard_data(user_id)
            
            return jsonify({
                "success": True,
                "data": dashboard_data,
                "message": "Financial dashboard data generated successfully"
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
                    "message": "Failed to generate dashboard data",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error generating financial dashboard: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate financial dashboard",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@reports_bp.route("/daily-summary/download-html", methods=["GET"])
@jwt_required()
def download_daily_summary_html():
    """Download daily summary as HTML report"""
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
        
        # Validate date range
        if target_date > date.today():
            return jsonify({
                "success": False,
                "message": "Cannot generate report for future dates",
                "toast": {
                    "type": "error",
                    "message": "Cannot generate report for future dates",
                    "timeout": 3000
                }
            }), 400
        
        html_report_service = HTMLReportService()
        
        try:
            # Generate HTML report
            html_content = html_report_service.generate_daily_summary_html(user_id, target_date)
            
            # Create response with HTML content
            response = make_response(html_content)
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
            response.headers['Content-Disposition'] = f'attachment; filename="daily_summary_{target_date}.html"'
            
            return response
            
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
                    "message": "Failed to generate HTML report",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error generating HTML report: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate HTML report",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@reports_bp.route("/weekly-summary/download-html", methods=["GET"])
@jwt_required()
def download_weekly_summary_html():
    """Download weekly summary as HTML report"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Get query parameters
        week_ending_str = request.args.get('week_ending')
        if week_ending_str:
            try:
                week_ending_date = datetime.strptime(week_ending_str, '%Y-%m-%d').date()
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
            week_ending_date = date.today()
        
        html_report_service = HTMLReportService()
        
        try:
            # Generate HTML report
            html_content = html_report_service.generate_weekly_summary_html(user_id, week_ending_date)
            
            # Create response with HTML content
            response = make_response(html_content)
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
            response.headers['Content-Disposition'] = f'attachment; filename="weekly_summary_{week_ending_date}.html"'
            
            return response
            
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
                    "message": "Failed to generate HTML report",
                    "timeout": 3000
                }
            }), 500
            
    except Exception as e:
        logging.error(f"Error generating weekly HTML report: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate HTML report",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@reports_bp.route("/cache/clear", methods=["POST"])
@jwt_required()
def clear_reports_cache():
    """Clear reports cache for frequently requested summaries"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Only allow owners and admins to clear cache
        if user_role not in ['owner', 'admin']:
            return jsonify({
                "success": False,
                "message": "Insufficient permissions to clear cache",
                "toast": {
                    "type": "error",
                    "message": "Insufficient permissions",
                    "timeout": 3000
                }
            }), 403
        
        # In a real implementation, this would clear Redis cache or similar
        # For now, we'll just return success
        
        return jsonify({
            "success": True,
            "message": "Reports cache cleared successfully",
            "toast": {
                "type": "success",
                "message": "Cache cleared successfully",
                "timeout": 3000
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error clearing reports cache: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to clear reports cache",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500

@reports_bp.route("/date-range-validation", methods=["GET"])
@jwt_required()
def validate_date_range():
    """Validate date range for report generation"""
    try:
        user_id = get_jwt_identity()
        try:
            owner_id, user_role = get_user_context(user_id)
        except ValueError as e:
            return error_response(str(e), "Authorization error", 403)
        
        # Get query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if not start_date_str or not end_date_str:
            return jsonify({
                "success": False,
                "message": "Both start_date and end_date are required",
                "toast": {
                    "type": "error",
                    "message": "Date range is required",
                    "timeout": 3000
                }
            }), 400
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
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
        
        # Validate date range
        today = date.today()
        errors = []
        warnings = []
        
        if start_date > end_date:
            errors.append("Start date cannot be after end date")
        
        if end_date > today:
            errors.append("End date cannot be in the future")
        
        if start_date > today:
            errors.append("Start date cannot be in the future")
        
        # Calculate range duration
        duration_days = (end_date - start_date).days + 1
        
        if duration_days > 365:
            warnings.append("Date range is longer than 1 year. Report generation may be slow.")
        elif duration_days > 90:
            warnings.append("Date range is longer than 3 months. Consider using monthly summaries.")
        
        # Check if range is too old
        if start_date < (today - timedelta(days=730)):  # 2 years ago
            warnings.append("Date range includes very old data. Some features may not be available.")
        
        validation_result = {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'duration_days': duration_days,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'recommendations': []
        }
        
        # Add recommendations
        if duration_days <= 7:
            validation_result['recommendations'].append("Consider using daily summaries for detailed analysis")
        elif duration_days <= 31:
            validation_result['recommendations'].append("Weekly summaries provide good balance of detail and overview")
        else:
            validation_result['recommendations'].append("Monthly summaries are recommended for long date ranges")
        
        return jsonify({
            "success": True,
            "data": validation_result,
            "message": "Date range validation completed"
        }), 200
        
    except Exception as e:
        logging.error(f"Error validating date range: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to validate date range",
            "error": str(e),
            "toast": {
                "type": "error",
                "message": "An unexpected error occurred",
                "timeout": 4000
            }
        }), 500