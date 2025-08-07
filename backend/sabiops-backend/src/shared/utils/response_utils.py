from typing import Dict, Any, Optional
from flask import jsonify

class ResponseUtils:
    """Utility class for creating consistent API responses"""
    
    @staticmethod
    def success_response(
        message: str, 
        data: Optional[Dict[str, Any]] = None, 
        status_code: int = 200
    ) -> tuple:
        """
        Create a success response
        
        Args:
            message: Success message
            data: Optional data to include in response
            status_code: HTTP status code (default: 200)
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        response = {
            "success": True,
            "message": message
        }
        
        if data is not None:
            response["data"] = data
        
        return jsonify(response), status_code
    
    @staticmethod
    def error_response(
        message: str, 
        error_code: str = "ERROR",
        status_code: int = 400,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> tuple:
        """
        Create an error response
        
        Args:
            message: Error message
            error_code: Error code identifier
            status_code: HTTP status code (default: 400)
            additional_data: Optional additional error data
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        response = {
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "type": "error"
            }
        }
        
        if additional_data:
            response["error"].update(additional_data)
        
        return jsonify(response), status_code
    
    @staticmethod
    def validation_error_response(
        message: str, 
        field_errors: Optional[Dict[str, str]] = None,
        status_code: int = 422
    ) -> tuple:
        """
        Create a validation error response
        
        Args:
            message: Validation error message
            field_errors: Optional field-specific errors
            status_code: HTTP status code (default: 422)
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        response = {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "type": "validation_error"
            }
        }
        
        if field_errors:
            response["error"]["field_errors"] = field_errors
        
        return jsonify(response), status_code
    
    @staticmethod
    def authentication_error_response(
        message: str = "Authentication failed",
        status_code: int = 401
    ) -> tuple:
        """
        Create an authentication error response
        
        Args:
            message: Authentication error message
            status_code: HTTP status code (default: 401)
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        response = {
            "success": False,
            "error": {
                "code": "AUTH_FAILED",
                "message": message,
                "type": "authentication_error"
            }
        }
        
        return jsonify(response), status_code
    
    @staticmethod
    def authorization_error_response(
        message: str = "Access denied",
        status_code: int = 403
    ) -> tuple:
        """
        Create an authorization error response
        
        Args:
            message: Authorization error message
            status_code: HTTP status code (default: 403)
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        response = {
            "success": False,
            "error": {
                "code": "ACCESS_DENIED",
                "message": message,
                "type": "authorization_error"
            }
        }
        
        return jsonify(response), status_code
    
    @staticmethod
    def not_found_response(
        resource_type: str,
        identifier: str,
        status_code: int = 404
    ) -> tuple:
        """
        Create a not found error response
        
        Args:
            resource_type: Type of resource that was not found
            identifier: Identifier of the resource
            status_code: HTTP status code (default: 404)
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        message = f"{resource_type} with identifier '{identifier}' not found"
        
        response = {
            "success": False,
            "error": {
                "code": "RESOURCE_NOT_FOUND",
                "message": message,
                "type": "not_found_error",
                "resource_type": resource_type,
                "identifier": identifier
            }
        }
        
        return jsonify(response), status_code
    
    @staticmethod
    def duplicate_resource_response(
        resource_type: str,
        field: str,
        value: str,
        status_code: int = 409
    ) -> tuple:
        """
        Create a duplicate resource error response
        
        Args:
            resource_type: Type of resource that already exists
            field: Field that has the duplicate value
            value: The duplicate value
            status_code: HTTP status code (default: 409)
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        message = f"{resource_type} with {field} '{value}' already exists"
        
        response = {
            "success": False,
            "error": {
                "code": "DUPLICATE_RESOURCE",
                "message": message,
                "type": "duplicate_resource_error",
                "resource_type": resource_type,
                "field": field,
                "value": value
            }
        }
        
        return jsonify(response), status_code
    
    @staticmethod
    def paginated_response(
        data: list,
        page: int,
        per_page: int,
        total: int,
        message: str = "Data retrieved successfully"
    ) -> tuple:
        """
        Create a paginated response
        
        Args:
            data: List of data items
            page: Current page number
            per_page: Items per page
            total: Total number of items
            message: Success message
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        total_pages = (total + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        response = {
            "success": True,
            "message": message,
            "data": data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            }
        }
        
        return jsonify(response), 200