"""
Unit tests for Payment Method Service
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pytest
from src.services.payment_method_service import PaymentMethodService

class TestPaymentMethodService(unittest.TestCase):
    """Test cases for PaymentMethodService"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_supabase = Mock()
        
        # Mock Flask current_app
        self.app_context_patcher = patch('src.services.payment_method_service.current_app')
        self.mock_current_app = self.app_context_patcher.start()
        self.mock_current_app.config = {'SUPABASE': self.mock_supabase}
        
        self.service = PaymentMethodService()
        
        # Sample payment method data
        self.sample_payment_method = {
            'id': 'test-id-123',
            'name': 'Cash',
            'type': 'Cash',
            'is_pos': False,
            'requires_reference': False,
            'description': 'Physical cash payments',
            'is_active': True
        }
        
        self.sample_pos_method = {
            'id': 'pos-id-123',
            'name': 'POS - Card',
            'type': 'Digital',
            'is_pos': True,
            'requires_reference': True,
            'description': 'Card payments via POS terminal',
            'is_active': True
        }
    
    def tearDown(self):
        """Clean up after tests"""
        self.app_context_patcher.stop()
    
    def test_init_without_supabase_raises_error(self):
        """Test that initialization without Supabase raises ValueError"""
        with patch('src.services.payment_method_service.current_app') as mock_app:
            mock_app.config = {}
            with self.assertRaises(ValueError):
                PaymentMethodService()
    
    def test_get_all_payment_methods_success(self):
        """Test successful retrieval of all payment methods"""
        # Mock Supabase response
        mock_result = Mock()
        mock_result.data = [self.sample_payment_method, self.sample_pos_method]
        
        mock_query = Mock()
        mock_query.order.return_value.execute.return_value = mock_result
        mock_query.eq.return_value = mock_query
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        # Test
        result = self.service.get_all_payment_methods()
        
        # Assertions
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['name'], 'Cash')
        self.assertEqual(result[1]['name'], 'POS - Card')
        
        # Verify Supabase calls
        self.mock_supabase.table.assert_called_with('payment_methods')
        mock_query.eq.assert_called_with('is_active', True)
    
    def test_get_all_payment_methods_include_inactive(self):
        """Test retrieval of all payment methods including inactive ones"""
        mock_result = Mock()
        mock_result.data = [self.sample_payment_method]
        
        mock_query = Mock()
        mock_query.order.return_value.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        # Test with include_inactive=True
        result = self.service.get_all_payment_methods(include_inactive=True)
        
        # Should not filter by is_active
        mock_query.eq.assert_not_called()
    
    def test_get_payment_methods_by_type_success(self):
        """Test successful retrieval of payment methods by type"""
        mock_result = Mock()
        mock_result.data = [self.sample_payment_method]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        # Test
        result = self.service.get_payment_methods_by_type('Cash')
        
        # Assertions
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['type'], 'Cash')
    
    def test_get_payment_methods_by_type_invalid_type(self):
        """Test error handling for invalid payment type"""
        with self.assertRaises(ValueError) as context:
            self.service.get_payment_methods_by_type('InvalidType')
        
        self.assertIn('Invalid payment type', str(context.exception))
    
    def test_get_payment_method_by_id_success(self):
        """Test successful retrieval of payment method by ID"""
        mock_result = Mock()
        mock_result.data = self.sample_payment_method
        
        mock_query = Mock()
        mock_query.eq.return_value.single.return_value.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        # Test
        result = self.service.get_payment_method_by_id('test-id-123')
        
        # Assertions
        self.assertEqual(result['id'], 'test-id-123')
        self.assertEqual(result['name'], 'Cash')
    
    def test_get_payment_method_by_id_not_found(self):
        """Test handling when payment method is not found"""
        mock_result = Mock()
        mock_result.data = None
        
        mock_query = Mock()
        mock_query.eq.return_value.single.return_value.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        # Test
        result = self.service.get_payment_method_by_id('nonexistent-id')
        
        # Assertions
        self.assertIsNone(result)
    
    def test_validate_payment_method_selection_cash_success(self):
        """Test successful validation for cash payment method"""
        # Mock get_payment_method_by_id
        with patch.object(self.service, 'get_payment_method_by_id', 
                         return_value=self.sample_payment_method):
            result = self.service.validate_payment_method_selection('test-id-123')
            
            self.assertTrue(result['valid'])
            self.assertEqual(result['method']['name'], 'Cash')
            self.assertEqual(len(result['missing_fields']), 0)
    
    def test_validate_payment_method_selection_pos_missing_fields(self):
        """Test validation failure for POS method with missing fields"""
        with patch.object(self.service, 'get_payment_method_by_id', 
                         return_value=self.sample_pos_method):
            result = self.service.validate_payment_method_selection('pos-id-123')
            
            self.assertFalse(result['valid'])
            self.assertIn('pos_account_name', result['missing_fields'])
            self.assertIn('transaction_type', result['missing_fields'])
            self.assertIn('reference_number', result['missing_fields'])
    
    def test_validate_payment_method_selection_pos_success(self):
        """Test successful validation for POS method with all required fields"""
        pos_data = {
            'pos_account_name': 'Moniepoint POS',
            'transaction_type': 'Sale',
            'reference_number': 'REF123456'
        }
        
        with patch.object(self.service, 'get_payment_method_by_id', 
                         return_value=self.sample_pos_method):
            result = self.service.validate_payment_method_selection('pos-id-123', pos_data)
            
            self.assertTrue(result['valid'])
            self.assertEqual(len(result['missing_fields']), 0)
    
    def test_validate_payment_method_selection_invalid_transaction_type(self):
        """Test validation failure for invalid transaction type"""
        pos_data = {
            'pos_account_name': 'Moniepoint POS',
            'transaction_type': 'InvalidType',
            'reference_number': 'REF123456'
        }
        
        with patch.object(self.service, 'get_payment_method_by_id', 
                         return_value=self.sample_pos_method):
            result = self.service.validate_payment_method_selection('pos-id-123', pos_data)
            
            self.assertFalse(result['valid'])
            self.assertIn('Invalid transaction type', result['error'])
    
    def test_create_payment_method_success(self):
        """Test successful creation of payment method"""
        method_data = {
            'name': 'New Payment Method',
            'type': 'Digital',
            'description': 'Test payment method'
        }
        
        mock_result = Mock()
        mock_result.data = [{**method_data, 'id': 'new-id-123'}]
        
        self.mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result
        
        # Test
        result = self.service.create_payment_method(method_data)
        
        # Assertions
        self.assertEqual(result['name'], 'New Payment Method')
        self.assertEqual(result['type'], 'Digital')
        self.assertEqual(result['id'], 'new-id-123')
    
    def test_create_payment_method_missing_required_field(self):
        """Test error handling for missing required fields"""
        method_data = {
            'type': 'Digital'  # Missing 'name'
        }
        
        with self.assertRaises(ValueError) as context:
            self.service.create_payment_method(method_data)
        
        self.assertIn('Missing required field: name', str(context.exception))
    
    def test_create_payment_method_invalid_type(self):
        """Test error handling for invalid payment method type"""
        method_data = {
            'name': 'Test Method',
            'type': 'InvalidType'
        }
        
        with self.assertRaises(ValueError) as context:
            self.service.create_payment_method(method_data)
        
        self.assertIn('Invalid payment method type', str(context.exception))
    
    def test_update_payment_method_success(self):
        """Test successful update of payment method"""
        update_data = {'description': 'Updated description'}
        
        mock_result = Mock()
        mock_result.data = [{**self.sample_payment_method, **update_data}]
        
        mock_query = Mock()
        mock_query.eq.return_value.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.update.return_value = mock_query
        
        # Test
        result = self.service.update_payment_method('test-id-123', update_data)
        
        # Assertions
        self.assertEqual(result['description'], 'Updated description')
    
    def test_deactivate_payment_method_success(self):
        """Test successful deactivation of payment method"""
        mock_result = Mock()
        mock_result.data = [{'id': 'test-id-123', 'is_active': False}]
        
        mock_query = Mock()
        mock_query.eq.return_value.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.update.return_value = mock_query
        
        # Test
        result = self.service.deactivate_payment_method('test-id-123')
        
        # Assertions
        self.assertTrue(result)
    
    def test_get_payment_method_display_info(self):
        """Test getting payment method with display information"""
        with patch.object(self.service, 'get_payment_method_by_id', 
                         return_value=self.sample_pos_method):
            result = self.service.get_payment_method_display_info('pos-id-123')
            
            self.assertIn('display_name', result)
            self.assertIn('requirements', result)
            self.assertIn('POS Account Name', result['requirements'])
            self.assertIn('Transaction Type', result['requirements'])
            self.assertIn('Reference Number', result['requirements'])
            self.assertTrue(result['has_requirements'])
    
    def test_get_payment_methods_for_dropdown(self):
        """Test getting payment methods formatted for dropdown"""
        with patch.object(self.service, 'get_all_payment_methods', 
                         return_value=[self.sample_payment_method, self.sample_pos_method]):
            with patch.object(self.service, 'get_payment_method_display_info') as mock_display:
                mock_display.side_effect = [
                    {**self.sample_payment_method, 'display_name': 'Cash', 'requirements': []},
                    {**self.sample_pos_method, 'display_name': 'POS - Card (Requires: POS Account Name, Transaction Type, Reference Number)', 'requirements': ['POS Account Name', 'Transaction Type', 'Reference Number']}
                ]
                
                result = self.service.get_payment_methods_for_dropdown()
                
                self.assertEqual(len(result), 2)
                self.assertEqual(result[0]['value'], 'test-id-123')
                self.assertEqual(result[0]['label'], 'Cash')
                self.assertEqual(result[1]['value'], 'pos-id-123')
                self.assertIn('Requires:', result[1]['label'])

if __name__ == '__main__':
    unittest.main()