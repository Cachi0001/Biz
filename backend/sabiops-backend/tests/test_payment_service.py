#!/usr/bin/env python3
"""
Unit Tests for Enhanced Payment Service

Tests all functionality of the PaymentService including POS integration,
daily summaries, and payment method breakdown calculations.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import pytest
import uuid
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date
from decimal import Decimal

from src.services.payment_service import PaymentService
from src.utils.exceptions import ValidationError, NotFoundError, DatabaseError

class TestPaymentService:
    """Test cases for PaymentService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_supabase = Mock()
        self.mock_payment_method_service = Mock()
        
        self.service = PaymentService()
        self.service.supabase = self.mock_supabase
        self.service.payment_method_service = self.mock_payment_method_service
        
        # Sample payment data
        self.sample_payment_data = {
            'amount': '100.00',
            'payment_method_id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'description': 'Test payment'
        }
        
        self.sample_pos_data = {
            'amount': '150.00',
            'payment_method_id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'pos_account_name': 'Moniepoint POS',
            'transaction_type': 'Sale',
            'pos_reference_number': 'REF123456',
            'description': 'POS sale'
        }
        
        # Sample payment method
        self.sample_payment_method = {
            'id': str(uuid.uuid4()),
            'name': 'Cash',
            'type': 'Cash',
            'is_pos': False,
            'requires_reference': False,
            'is_active': True
        }
        
        self.sample_pos_method = {
            'id': str(uuid.uuid4()),
            'name': 'POS - Card',
            'type': 'Digital',
            'is_pos': True,
            'requires_reference': True,
            'is_active': True
        }
    
    def test_record_payment_success(self):
        """Test successful payment recording"""
        # Mock payment method validation
        validation_result = {
            'is_valid': True,
            'payment_method': self.sample_payment_method,
            'pos_data': {},
            'missing_fields': []
        }
        self.mock_payment_method_service.validate_payment_method_selection.return_value = validation_result
        
        # Mock database insert
        created_payment = self.sample_payment_data.copy()
        created_payment['id'] = str(uuid.uuid4())
        created_payment['status'] = 'completed'
        created_payment['created_at'] = datetime.utcnow().isoformat()
        
        mock_result = Mock()
        mock_result.data = [created_payment]
        
        mock_insert = Mock()
        mock_insert.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.insert.return_value = mock_insert
        
        # Test payment recording
        result = self.service.record_payment(self.sample_payment_data)
        
        assert result['id'] == created_payment['id']
        assert result['status'] == 'completed'
        assert 'created_at' in result
        
        # Verify method calls
        self.mock_payment_method_service.validate_payment_method_selection.assert_called_once()
        self.mock_supabase.table.assert_called_with('payments')
    
    def test_record_payment_missing_required_fields(self):
        """Test error handling for missing required fields"""
        incomplete_data = {
            'amount': '100.00',
            'user_id': str(uuid.uuid4())
            # Missing payment_method_id
        }
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.record_payment(incomplete_data)
        
        assert "Missing required field: payment_method_id" in str(exc_info.value)
    
    def test_record_payment_invalid_amount(self):
        """Test error handling for invalid amount"""
        invalid_data = self.sample_payment_data.copy()
        invalid_data['amount'] = '-50.00'
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.record_payment(invalid_data)
        
        assert "Amount must be greater than 0" in str(exc_info.value)
    
    def test_record_payment_validation_failure(self):
        """Test error handling when payment method validation fails"""
        # Mock validation failure
        validation_result = {
            'is_valid': False,
            'payment_method': self.sample_pos_method,
            'pos_data': {},
            'missing_fields': ['pos_account_name', 'transaction_type']
        }
        self.mock_payment_method_service.validate_payment_method_selection.return_value = validation_result
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.record_payment(self.sample_payment_data)
        
        assert "Missing required fields for payment method" in str(exc_info.value)
        assert "pos_account_name" in str(exc_info.value)
    
    def test_record_pos_payment_success(self):
        """Test successful POS payment recording"""
        # Mock payment method validation for POS
        validation_result = {
            'is_valid': True,
            'payment_method': self.sample_pos_method,
            'pos_data': {
                'pos_account_name': 'Moniepoint POS',
                'transaction_type': 'Sale',
                'pos_reference_number': 'REF123456'
            },
            'missing_fields': []
        }
        self.mock_payment_method_service.validate_payment_method_selection.return_value = validation_result
        
        # Mock database insert
        created_payment = self.sample_pos_data.copy()
        created_payment['id'] = str(uuid.uuid4())
        created_payment['status'] = 'completed'
        created_payment['is_pos_transaction'] = True
        
        mock_result = Mock()
        mock_result.data = [created_payment]
        
        mock_insert = Mock()
        mock_insert.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.insert.return_value = mock_insert
        
        # Test POS payment recording
        result = self.service.record_payment(self.sample_pos_data)
        
        assert result['is_pos_transaction'] is True
        assert 'pos_account_name' in result
        assert 'transaction_type' in result
    
    def test_get_payment_by_id_success(self):
        """Test successful payment retrieval by ID"""
        payment_id = str(uuid.uuid4())
        payment_record = {
            'id': payment_id,
            'amount': 100.00,
            'status': 'completed'
        }
        
        mock_result = Mock()
        mock_result.data = [payment_record]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_payment_by_id(payment_id)
        
        assert result['id'] == payment_id
        assert result['amount'] == 100.00
        
        mock_query.eq.assert_called_with('id', payment_id)
    
    def test_get_payment_by_id_not_found(self):
        """Test error handling when payment not found"""
        payment_id = str(uuid.uuid4())
        
        mock_result = Mock()
        mock_result.data = []
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        with pytest.raises(NotFoundError) as exc_info:
            self.service.get_payment_by_id(payment_id)
        
        assert "not found" in str(exc_info.value)
    
    def test_get_payment_by_id_invalid_uuid(self):
        """Test error handling for invalid UUID format"""
        with pytest.raises(ValidationError) as exc_info:
            self.service.get_payment_by_id('invalid-uuid')
        
        assert "Invalid payment ID format" in str(exc_info.value)
    
    def test_get_payments_by_user_success(self):
        """Test successful retrieval of user payments"""
        user_id = str(uuid.uuid4())
        payments = [
            {'id': str(uuid.uuid4()), 'amount': 100.00, 'user_id': user_id},
            {'id': str(uuid.uuid4()), 'amount': 200.00, 'user_id': user_id}
        ]
        
        mock_result = Mock()
        mock_result.data = payments
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_payments_by_user(user_id)
        
        assert len(result) == 2
        assert all(payment['user_id'] == user_id for payment in result)
        
        mock_query.eq.assert_called_with('user_id', user_id)
        mock_query.order.assert_called_with('created_at', desc=True)
    
    def test_get_daily_cash_summary_success(self):
        """Test successful daily cash summary calculation"""
        target_date = date(2025, 1, 15)
        
        # Mock cash payment method
        cash_method = {'id': str(uuid.uuid4()), 'name': 'Cash'}
        self.mock_payment_method_service.get_payment_method_by_name.return_value = cash_method
        
        # Mock cash transactions
        cash_transactions = [
            {'amount': 100.00, 'transaction_type': 'Sale'},
            {'amount': 50.00, 'transaction_type': 'Sale'},
            {'amount': 20.00, 'transaction_type': 'Refund'}
        ]
        
        mock_result = Mock()
        mock_result.data = cash_transactions
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lt.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_daily_cash_summary(target_date)
        
        assert result['date'] == target_date.isoformat()
        assert result['cash_in'] == 150.00  # 100 + 50
        assert result['cash_out'] == 20.00   # 20 refund
        assert result['cash_at_hand'] == 130.00  # 150 - 20
        assert result['transaction_count'] == 3
    
    def test_get_daily_cash_summary_no_cash_method(self):
        """Test cash summary when cash payment method doesn't exist"""
        target_date = date(2025, 1, 15)
        
        # Mock no cash payment method found
        self.mock_payment_method_service.get_payment_method_by_name.return_value = None
        
        result = self.service.get_daily_cash_summary(target_date)
        
        assert result['date'] == target_date.isoformat()
        assert result['cash_in'] == 0
        assert result['cash_out'] == 0
        assert result['cash_at_hand'] == 0
        assert result['transaction_count'] == 0
    
    def test_get_pos_summary_success(self):
        """Test successful POS summary calculation"""
        target_date = date(2025, 1, 15)
        
        # Mock POS transactions
        pos_transactions = [
            {
                'amount': 200.00,
                'transaction_type': 'Sale',
                'pos_account_name': 'Moniepoint POS'
            },
            {
                'amount': 100.00,
                'transaction_type': 'Sale',
                'pos_account_name': 'Opay POS'
            },
            {
                'amount': 50.00,
                'transaction_type': 'Withdrawal',
                'pos_account_name': 'Moniepoint POS'
            }
        ]
        
        mock_result = Mock()
        mock_result.data = pos_transactions
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lt.return_value = mock_query
        mock_query.not_.is_.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_pos_summary(target_date)
        
        assert result['date'] == target_date.isoformat()
        assert result['total_deposits'] == 300.00  # 200 + 100
        assert result['total_withdrawals'] == 50.00
        assert result['net_flow'] == 250.00  # 300 - 50
        assert result['total_transactions'] == 3
        assert len(result['pos_accounts']) == 2
        
        # Check individual POS accounts
        moniepoint_account = next(acc for acc in result['pos_accounts'] if acc['account_name'] == 'Moniepoint POS')
        assert moniepoint_account['deposits'] == 200.00
        assert moniepoint_account['withdrawals'] == 50.00
        assert moniepoint_account['net_flow'] == 150.00
    
    def test_get_payment_method_breakdown_success(self):
        """Test successful payment method breakdown calculation"""
        target_date = date(2025, 1, 15)
        
        # Mock payment methods
        payment_methods = [
            {'id': 'cash-id', 'name': 'Cash', 'type': 'Cash'},
            {'id': 'card-id', 'name': 'Card', 'type': 'Digital'}
        ]
        self.mock_payment_method_service.get_all_payment_methods.return_value = payment_methods
        
        # Mock payments
        payments = [
            {'amount': 100.00, 'payment_method_id': 'cash-id', 'transaction_type': 'Sale'},
            {'amount': 200.00, 'payment_method_id': 'card-id', 'transaction_type': 'Sale'},
            {'amount': 50.00, 'payment_method_id': 'cash-id', 'transaction_type': 'Sale'}
        ]
        
        mock_result = Mock()
        mock_result.data = payments
        
        mock_query = Mock()
        mock_query.gte.return_value = mock_query
        mock_query.lt.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_payment_method_breakdown(target_date)
        
        assert result['date'] == target_date.isoformat()
        assert result['total_amount'] == 350.00  # 100 + 200 + 50
        assert result['total_transactions'] == 3
        assert len(result['payment_methods']) == 2
        
        # Check cash method breakdown
        cash_method = next(pm for pm in result['payment_methods'] if pm['payment_method_name'] == 'Cash')
        assert cash_method['total_amount'] == 150.00  # 100 + 50
        assert cash_method['transaction_count'] == 2
        assert cash_method['percentage'] == 42.86  # 150/350 * 100
    
    def test_record_pos_transaction_success(self):
        """Test successful POS transaction recording"""
        pos_transaction_data = {
            'amount': '100.00',
            'payment_method_id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'pos_account_name': 'Moniepoint POS',
            'transaction_type': 'Sale',
            'pos_reference_number': 'REF123'
        }
        
        # Mock the main record_payment method
        expected_result = {'id': str(uuid.uuid4()), 'status': 'completed'}
        
        with patch.object(self.service, 'record_payment', return_value=expected_result) as mock_record:
            result = self.service.record_pos_transaction(pos_transaction_data)
            
            assert result == expected_result
            
            # Verify that is_pos_transaction was added
            call_args = mock_record.call_args[0][0]
            assert call_args['is_pos_transaction'] is True
    
    def test_record_pos_transaction_missing_fields(self):
        """Test error handling for missing POS fields"""
        incomplete_data = {
            'amount': '100.00',
            'payment_method_id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'pos_account_name': 'Moniepoint POS'
            # Missing transaction_type
        }
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.record_pos_transaction(incomplete_data)
        
        assert "Missing required POS field: transaction_type" in str(exc_info.value)
    
    def test_record_pos_transaction_invalid_type(self):
        """Test error handling for invalid transaction type"""
        invalid_data = {
            'amount': '100.00',
            'payment_method_id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'pos_account_name': 'Moniepoint POS',
            'transaction_type': 'InvalidType'
        }
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.record_pos_transaction(invalid_data)
        
        assert "Invalid transaction type" in str(exc_info.value)
    
    def test_get_payment_by_reference_success(self):
        """Test successful payment retrieval by reference"""
        reference_number = 'REF123456'
        payment_record = {
            'id': str(uuid.uuid4()),
            'reference_number': reference_number,
            'amount': 100.00
        }
        
        mock_result = Mock()
        mock_result.data = [payment_record]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_payment_by_reference(reference_number)
        
        assert result is not None
        assert result['reference_number'] == reference_number
        
        mock_query.eq.assert_called_with('reference_number', reference_number)
    
    def test_get_payment_by_reference_pos_success(self):
        """Test successful POS payment retrieval by reference"""
        pos_reference = 'POS123456'
        payment_record = {
            'id': str(uuid.uuid4()),
            'pos_reference_number': pos_reference,
            'is_pos_transaction': True,
            'amount': 100.00
        }
        
        mock_result = Mock()
        mock_result.data = [payment_record]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_payment_by_reference(pos_reference, is_pos=True)
        
        assert result is not None
        assert result['pos_reference_number'] == pos_reference
        
        # Verify correct field was searched and POS filter applied
        calls = mock_query.eq.call_args_list
        assert ('pos_reference_number', pos_reference) in [call[0] for call in calls]
        assert ('is_pos_transaction', True) in [call[0] for call in calls]
    
    def test_get_payment_by_reference_not_found(self):
        """Test handling when payment reference not found"""
        mock_result = Mock()
        mock_result.data = []
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_payment_by_reference('NONEXISTENT')
        
        assert result is None
    
    def test_update_payment_status_success(self):
        """Test successful payment status update"""
        payment_id = str(uuid.uuid4())
        existing_payment = {
            'id': payment_id,
            'status': 'completed',
            'amount': 100.00
        }
        
        updated_payment = existing_payment.copy()
        updated_payment['status'] = 'refunded'
        updated_payment['notes'] = 'Customer refund'
        
        # Mock get_payment_by_id
        with patch.object(self.service, 'get_payment_by_id', return_value=existing_payment):
            # Mock update query
            mock_result = Mock()
            mock_result.data = [updated_payment]
            
            mock_update = Mock()
            mock_update.eq.return_value = mock_update
            mock_update.execute.return_value = mock_result
            
            self.mock_supabase.table.return_value.update.return_value = mock_update
            
            result = self.service.update_payment_status(payment_id, 'refunded', 'Customer refund')
            
            assert result['status'] == 'refunded'
            assert result['notes'] == 'Customer refund'
            
            mock_update.eq.assert_called_with('id', payment_id)
    
    def test_update_payment_status_invalid_status(self):
        """Test error handling for invalid payment status"""
        payment_id = str(uuid.uuid4())
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.update_payment_status(payment_id, 'invalid_status')
        
        assert "Invalid status" in str(exc_info.value)
    
    def test_update_payment_status_payment_not_found(self):
        """Test error handling when payment not found for status update"""
        payment_id = str(uuid.uuid4())
        
        # Mock get_payment_by_id to raise NotFoundError
        with patch.object(self.service, 'get_payment_by_id', side_effect=NotFoundError("Payment not found")):
            with pytest.raises(NotFoundError):
                self.service.update_payment_status(payment_id, 'refunded')
    
    def test_database_error_handling(self):
        """Test handling of database errors"""
        # Mock database exception
        self.mock_supabase.table.side_effect = Exception("Database connection failed")
        
        with pytest.raises(DatabaseError) as exc_info:
            self.service.record_payment(self.sample_payment_data)
        
        assert "Failed to record payment" in str(exc_info.value)
    
    @patch('src.services.payment_service.get_supabase_client')
    def test_initialization_failure(self, mock_get_client):
        """Test handling of initialization failure"""
        mock_get_client.return_value = None
        
        with pytest.raises(DatabaseError) as exc_info:
            PaymentService()
        
        assert "Failed to initialize Supabase client" in str(exc_info.value)