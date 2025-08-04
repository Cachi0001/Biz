"""
Payment Method Management Service

This service handles CRUD operations for payment methods and provides
validation logic for payment method selection and POS field requirements.
"""

import logging
from typing import List, Dict, Any, Optional
from flask import current_app

logger = logging.getLogger(__name__)

class PaymentMethodService:
    """Service for managing payment methods"""
    
    def __init__(self):
        self.supabase = current_app.config.get('SUPABASE')
        if not self.supabase:
            raise ValueError("Supabase client not configured")
    
    def get_all_payment_methods(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        Get all payment methods
        
        Args:
            include_inactive: Whether to include inactive payment methods
            
        Returns:
            List of payment method dictionaries
        """
        try:
            query = self.supabase.table('payment_methods').select('*')
            
            if not include_inactive:
                query = query.eq('is_active', True)
            
            result = query.order('type, name').execute()
            
            logger.info(f"Retrieved {len(result.data)} payment methods")
            return result.data
            
        except Exception as e:
            logger.error(f"Error retrieving payment methods: {str(e)}")
            raise
    
    def get_payment_methods_by_type(self, payment_type: str) -> List[Dict[str, Any]]:
        """
        Get payment methods by type (Cash, Digital, Credit)
        
        Args:
            payment_type: Type of payment method to filter by
            
        Returns:
            List of payment method dictionaries
        """
        try:
            if payment_type not in ['Cash', 'Digital', 'Credit']:
                raise ValueError(f"Invalid payment type: {payment_type}")
            
            result = self.supabase.table('payment_methods').select('*').eq(
                'type', payment_type
            ).eq('is_active', True).order('name').execute()
            
            logger.info(f"Retrieved {len(result.data)} {payment_type} payment methods")
            return result.data
            
        except Exception as e:
            logger.error(f"Error retrieving {payment_type} payment methods: {str(e)}")
            raise
    
    def get_payment_method_by_id(self, method_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific payment method by ID
        
        Args:
            method_id: UUID of the payment method
            
        Returns:
            Payment method dictionary or None if not found
        """
        try:
            result = self.supabase.table('payment_methods').select('*').eq(
                'id', method_id
            ).single().execute()
            
            if result.data:
                logger.info(f"Retrieved payment method: {result.data['name']}")
                return result.data
            else:
                logger.warning(f"Payment method not found: {method_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving payment method {method_id}: {str(e)}")
            raise
    
    def get_payment_method_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific payment method by name
        
        Args:
            name: Name of the payment method
            
        Returns:
            Payment method dictionary or None if not found
        """
        try:
            result = self.supabase.table('payment_methods').select('*').eq(
                'name', name
            ).single().execute()
            
            if result.data:
                logger.info(f"Retrieved payment method by name: {name}")
                return result.data
            else:
                logger.warning(f"Payment method not found by name: {name}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving payment method by name {name}: {str(e)}")
            raise
    
    def get_pos_payment_methods(self) -> List[Dict[str, Any]]:
        """
        Get all POS payment methods
        
        Returns:
            List of POS payment method dictionaries
        """
        try:
            result = self.supabase.table('payment_methods').select('*').eq(
                'is_pos', True
            ).eq('is_active', True).order('name').execute()
            
            logger.info(f"Retrieved {len(result.data)} POS payment methods")
            return result.data
            
        except Exception as e:
            logger.error(f"Error retrieving POS payment methods: {str(e)}")
            raise
    
    def validate_payment_method_selection(self, method_id: str, 
                                        pos_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Validate payment method selection and required fields
        
        Args:
            method_id: UUID of the selected payment method
            pos_data: Dictionary containing POS-specific data if applicable
            
        Returns:
            Dictionary with validation results
        """
        try:
            # Get payment method details
            method = self.get_payment_method_by_id(method_id)
            if not method:
                return {
                    'valid': False,
                    'error': 'Invalid payment method ID',
                    'missing_fields': []
                }
            
            if not method['is_active']:
                return {
                    'valid': False,
                    'error': 'Payment method is not active',
                    'missing_fields': []
                }
            
            missing_fields = []
            
            # Check POS-specific requirements
            if method['is_pos']:
                if not pos_data:
                    missing_fields.extend(['pos_account_name', 'transaction_type'])
                else:
                    if not pos_data.get('pos_account_name'):
                        missing_fields.append('pos_account_name')
                    if not pos_data.get('transaction_type'):
                        missing_fields.append('transaction_type')
                    
                    # Validate transaction type
                    valid_types = ['Sale', 'Refund', 'Deposit', 'Withdrawal']
                    if pos_data.get('transaction_type') not in valid_types:
                        return {
                            'valid': False,
                            'error': f'Invalid transaction type. Must be one of: {valid_types}',
                            'missing_fields': missing_fields
                        }
            
            # Check reference requirements
            if method['requires_reference']:
                if not pos_data or not pos_data.get('reference_number'):
                    missing_fields.append('reference_number')
            
            is_valid = len(missing_fields) == 0
            
            result = {
                'valid': is_valid,
                'method': method,
                'missing_fields': missing_fields
            }
            
            if not is_valid:
                result['error'] = f"Missing required fields: {', '.join(missing_fields)}"
            
            logger.info(f"Payment method validation for {method['name']}: {'valid' if is_valid else 'invalid'}")
            return result
            
        except Exception as e:
            logger.error(f"Error validating payment method selection: {str(e)}")
            raise
    
    def create_payment_method(self, method_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new payment method
        
        Args:
            method_data: Dictionary containing payment method data
            
        Returns:
            Created payment method dictionary
        """
        try:
            # Validate required fields
            required_fields = ['name', 'type']
            for field in required_fields:
                if not method_data.get(field):
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate type
            if method_data['type'] not in ['Cash', 'Digital', 'Credit']:
                raise ValueError(f"Invalid payment method type: {method_data['type']}")
            
            # Set defaults
            method_data.setdefault('is_pos', False)
            method_data.setdefault('requires_reference', False)
            method_data.setdefault('is_active', True)
            
            result = self.supabase.table('payment_methods').insert(method_data).execute()
            
            if result.data:
                created_method = result.data[0]
                logger.info(f"Created payment method: {created_method['name']}")
                return created_method
            else:
                raise Exception("Failed to create payment method")
                
        except Exception as e:
            logger.error(f"Error creating payment method: {str(e)}")
            raise
    
    def update_payment_method(self, method_id: str, 
                            update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing payment method
        
        Args:
            method_id: UUID of the payment method to update
            update_data: Dictionary containing fields to update
            
        Returns:
            Updated payment method dictionary
        """
        try:
            # Validate type if provided
            if 'type' in update_data and update_data['type'] not in ['Cash', 'Digital', 'Credit']:
                raise ValueError(f"Invalid payment method type: {update_data['type']}")
            
            result = self.supabase.table('payment_methods').update(
                update_data
            ).eq('id', method_id).execute()
            
            if result.data:
                updated_method = result.data[0]
                logger.info(f"Updated payment method: {updated_method['name']}")
                return updated_method
            else:
                raise Exception("Payment method not found or update failed")
                
        except Exception as e:
            logger.error(f"Error updating payment method {method_id}: {str(e)}")
            raise
    
    def deactivate_payment_method(self, method_id: str) -> bool:
        """
        Deactivate a payment method (soft delete)
        
        Args:
            method_id: UUID of the payment method to deactivate
            
        Returns:
            True if successful
        """
        try:
            result = self.supabase.table('payment_methods').update({
                'is_active': False
            }).eq('id', method_id).execute()
            
            if result.data:
                logger.info(f"Deactivated payment method: {method_id}")
                return True
            else:
                logger.warning(f"Payment method not found for deactivation: {method_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error deactivating payment method {method_id}: {str(e)}")
            raise
    
    def get_payment_method_display_info(self, method_id: str) -> Dict[str, Any]:
        """
        Get payment method with display-friendly information
        
        Args:
            method_id: UUID of the payment method
            
        Returns:
            Payment method with display information
        """
        try:
            method = self.get_payment_method_by_id(method_id)
            if not method:
                return None
            
            # Add display-friendly information
            display_name = method['name']
            requirements = []
            
            if method['is_pos']:
                requirements.append('POS Account Name')
                requirements.append('Transaction Type')
            
            if method['requires_reference']:
                requirements.append('Reference Number')
            
            if requirements:
                display_name += f" (Requires: {', '.join(requirements)})"
            
            return {
                **method,
                'display_name': display_name,
                'requirements': requirements,
                'has_requirements': len(requirements) > 0
            }
            
        except Exception as e:
            logger.error(f"Error getting payment method display info: {str(e)}")
            raise
    
    def get_payment_methods_for_dropdown(self) -> List[Dict[str, Any]]:
        """
        Get payment methods formatted for dropdown/select components
        
        Returns:
            List of payment methods with value/label format
        """
        try:
            methods = self.get_all_payment_methods()
            
            dropdown_options = []
            for method in methods:
                display_info = self.get_payment_method_display_info(method['id'])
                dropdown_options.append({
                    'value': method['id'],
                    'label': display_info['display_name'],
                    'type': method['type'],
                    'is_pos': method['is_pos'],
                    'requires_reference': method['requires_reference'],
                    'requirements': display_info['requirements']
                })
            
            logger.info(f"Generated {len(dropdown_options)} dropdown options")
            return dropdown_options
            
        except Exception as e:
            logger.error(f"Error generating dropdown options: {str(e)}")
            raise