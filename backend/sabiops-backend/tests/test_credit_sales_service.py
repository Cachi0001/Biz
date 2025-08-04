#!/usr/bin/env python3
"""
Unit Tests for Credit Sales Management Service

Tests all functionality of the CreditSalesService including partial payments,
outstanding credit sales tracking, and accounts receivable management.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import pytest
import uuid
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date
from decimal import Decimal

from src.services.credit_sales_service import CreditSalesService
from src.utils.exceptions import ValidationError, NotFoundError, DatabaseError

class TestCreditSalesService:
    """Test cases for CreditSalesService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_supabase = Mock()
        self.mock_payment_method_service = Mock()
        
        self.service = CreditSalesService()
        self.service.supabase = self.mock_supabase
        self.service.payment_method_service = self.mock_payment_method_service
        
        # Sample sale data
        self.sample_credit_sale = {
            'id': str(uuid.uuid4()),
            'customer_id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'total_amount': 500.00,
            'amount_paid': 200.00,
            'amount_due': 300.00,
            'payment_status': 'Credit',
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.sample_payment_data = {
            'amount': '100.00',
            'payment_method_id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'description': 'Partial payment'
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
    
    def test_get_sale_by_id_success(self):
        """Test successful sale retrieval by ID"""
        sale_id = self.sample_credit_sale['id']
        
        mock_result = Mock()
        mock_result.data = [self.sample_credit_sale]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_sale_by_id(sale_id)
        
        assert result['id'] == sale_id
        assert result['payment_status'] == 'Credit'
        
        mock_query.eq.assert_called_with('id', sale_id)
    
    def test_get_sale_by_id_not_found(self):
        """Test error handling when sale not found"""
        sale_id = str(uuid.uuid4())
        
        mock_result = Mock()
        mock_result.data = []
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        with pytest.raises(NotFoundError) as exc_info:
            self.service.get_sale_by_id(sale_id)
        
        assert "not found" in str(exc_info.value)
    
    def test_get_sale_by_id_invalid_uuid(self):
        """Test error handling for invalid UUID format"""
        with pytest.raises(ValidationError) as exc_info:
            self.service.get_sale_by_id('invalid-uuid')
        
        assert "Invalid sale ID format" in str(exc_info.value)
    
    def test_record_partial_payment_success(self):
        """Test successful partial payment recording"""
        sale_id = self.sample_credit_sale['id']
        
        # Mock get_sale_by_id
        with patch.object(self.service, 'get_sale_by_id', return_value=self.sample_credit_sale):
            # Mock payment method validation
            validation_result = {
                'is_valid': True,
                'payment_method': self.sample_payment_method,
                'pos_data': {},
                'missing_fields': []
            }
            self.mock_payment_method_service.validate_payment_method_selection.return_value = validation_result
            
            # Mock sale_payments insert
            created_payment = {
                'id': str(uuid.uuid4()),
                'sale_id': sale_id,
                'amount': 100.00,
                'payment_date': datetime.utcnow().isoformat()
            }
            
            mock_payment_result = Mock()
            mock_payment_result.data = [created_payment]
            
            mock_payment_insert = Mock()
            mock_payment_insert.execute.return_value = mock_payment_result
            
            # Mock sales update
            updated_sale = self.sample_credit_sale.copy()
            updated_sale['amount_paid'] = 300.00  # 200 + 100
            updated_sale['amount_due'] = 200.00   # 300 - 100
            updated_sale['payment_status'] = 'Credit'  # Still credit since not fully paid
            
            mock_sale_result = Mock()
            mock_sale_result.data = [updated_sale]
            
            mock_sale_update = Mock()
            mock_sale_update.eq.return_value = mock_sale_update
            mock_sale_update.execute.return_value = mock_sale_result
            
            # Configure mock table calls
            def table_side_effect(table_name):
                if table_name == 'sale_payments':
                    mock_table = Mock()
                    mock_table.insert.return_value = mock_payment_insert
                    return mock_table
                elif table_name == 'sales':
                    mock_table = Mock()
                    mock_table.update.return_value = mock_sale_update
                    return mock_table
                return Mock()
            
            self.mock_supabase.table.side_effect = table_side_effect
            
            # Test partial payment recording
            result = self.service.record_partial_payment(sale_id, self.sample_payment_data)
            
            assert result['payment_amount'] == 100.00
            assert result['new_amount_paid'] == 300.00
            assert result['new_amount_due'] == 200.00
            assert result['new_payment_status'] == 'Credit'
            assert result['is_fully_paid'] is False
    
    def test_record_partial_payment_full_payment(self):
        """Test partial payment that fully pays off the sale"""
        sale_id = self.sample_credit_sale['id']
        
        # Payment that exactly matches amount due
        full_payment_data = self.sample_payment_data.copy()
        full_payment_data['amount'] = '300.00'  # Exactly the amount due
        
        # Mock get_sale_by_id
        with patch.object(self.service, 'get_sale_by_id', return_value=self.sample_credit_sale):
            # Mock payment method validation
            validation_result = {
                'is_valid': True,
                'payment_method': self.sample_payment_method,
                'pos_data': {},
                'missing_fields': []
            }
            self.mock_payment_method_service.validate_payment_method_selection.return_value = validation_result
            
            # Mock successful database operations
            mock_payment_result = Mock()
            mock_payment_result.data = [{'id': str(uuid.uuid4())}]
            
            mock_payment_insert = Mock()
            mock_payment_insert.execute.return_value = mock_payment_result
            
            updated_sale = self.sample_credit_sale.copy()
            updated_sale['amount_paid'] = 500.00  # 200 + 300
            updated_sale['amount_due'] = 0.00     # Fully paid
            updated_sale['payment_status'] = 'Paid'
            updated_sale['payment_method_id'] = self.sample_payment_method['id']
            
            mock_sale_result = Mock()
            mock_sale_result.data = [updated_sale]
            
            mock_sale_update = Mock()
            mock_sale_update.eq.return_value = mock_sale_update
            mock_sale_update.execute.return_value = mock_sale_result
            
            # Configure mock table calls
            def table_side_effect(table_name):
                if table_name == 'sale_payments':
                    mock_table = Mock()
                    mock_table.insert.return_value = mock_payment_insert
                    return mock_table
                elif table_name == 'sales':
                    mock_table = Mock()
                    mock_table.update.return_value = mock_sale_update
                    return mock_table
                return Mock()
            
            self.mock_supabase.table.side_effect = table_side_effect
            
            # Test full payment
            result = self.service.record_partial_payment(sale_id, full_payment_data)
            
            assert result['payment_amount'] == 300.00
            assert result['new_amount_paid'] == 500.00
            assert result['new_amount_due'] == 0.00
            assert result['new_payment_status'] == 'Paid'
            assert result['is_fully_paid'] is True
    
    def test_record_partial_payment_invalid_sale_status(self):
        """Test error handling for invalid sale payment status"""
        paid_sale = self.sample_credit_sale.copy()
        paid_sale['payment_status'] = 'Paid'
        
        with patch.object(self.service, 'get_sale_by_id', return_value=paid_sale):
            with pytest.raises(ValidationError) as exc_info:
                self.service.record_partial_payment(paid_sale['id'], self.sample_payment_data)
            
            assert "does not allow partial payments" in str(exc_info.value)
    
    def test_record_partial_payment_exceeds_balance(self):
        """Test error handling when payment exceeds outstanding balance"""
        excessive_payment_data = self.sample_payment_data.copy()
        excessive_payment_data['amount'] = '400.00'  # More than the 300.00 due
        
        with patch.object(self.service, 'get_sale_by_id', return_value=self.sample_credit_sale):
            with pytest.raises(ValidationError) as exc_info:
                self.service.record_partial_payment(
                    self.sample_credit_sale['id'], 
                    excessive_payment_data
                )
            
            assert "exceeds outstanding balance" in str(exc_info.value)
    
    def test_record_partial_payment_validation_failure(self):
        """Test error handling when payment method validation fails"""
        with patch.object(self.service, 'get_sale_by_id', return_value=self.sample_credit_sale):
            # Mock validation failure
            validation_result = {
                'is_valid': False,
                'payment_method': self.sample_payment_method,
                'pos_data': {},
                'missing_fields': ['pos_account_name']
            }
            self.mock_payment_method_service.validate_payment_method_selection.return_value = validation_result
            
            with pytest.raises(ValidationError) as exc_info:
                self.service.record_partial_payment(
                    self.sample_credit_sale['id'], 
                    self.sample_payment_data
                )
            
            assert "Missing required fields for payment method" in str(exc_info.value)
    
    def test_get_outstanding_credit_sales_success(self):
        """Test successful retrieval of outstanding credit sales"""
        outstanding_sales = [
            {
                'id': str(uuid.uuid4()),
                'payment_status': 'Credit',
                'amount_due': 300.00,
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'payment_status': 'Pending',
                'amount_due': 150.00,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        mock_result = Mock()
        mock_result.data = outstanding_sales
        
        mock_query = Mock()
        mock_query.in_.return_value = mock_query
        mock_query.gt.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        # Mock count query
        mock_count_result = Mock()
        mock_count_result.count = 2
        
        mock_count_query = Mock()
        mock_count_query.in_.return_value = mock_count_query
        mock_count_query.gt.return_value = mock_count_query
        mock_count_query.execute.return_value = mock_count_result
        
        def table_side_effect(table_name):
            mock_table = Mock()
            if hasattr(mock_table, 'select'):
                # First call is for main query, second is for count
                mock_table.select.side_effect = [mock_query, mock_count_query]
            return mock_table
        
        self.mock_supabase.table.side_effect = table_side_effect
        
        result = self.service.get_outstanding_credit_sales()
        
        assert len(result['outstanding_sales']) == 2
        assert result['total_outstanding_amount'] == 450.00  # 300 + 150
        assert result['payment_status_breakdown']['Credit'] == 1
        assert result['payment_status_breakdown']['Pending'] == 1
    
    def test_get_sale_payment_history_success(self):
        """Test successful retrieval of sale payment history"""
        sale_id = str(uuid.uuid4())
        payment_history = [
            {
                'id': str(uuid.uuid4()),
                'sale_id': sale_id,
                'amount': 100.00,
                'payment_date': datetime.utcnow().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'sale_id': sale_id,
                'amount': 50.00,
                'payment_date': datetime.utcnow().isoformat()
            }
        ]
        
        mock_result = Mock()
        mock_result.data = payment_history
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_sale_payment_history(sale_id)
        
        assert len(result) == 2
        assert all(payment['sale_id'] == sale_id for payment in result)
        
        mock_query.eq.assert_called_with('sale_id', sale_id)
        mock_query.order.assert_called_with('payment_date', desc=True)
    
    def test_get_customer_credit_summary_success(self):
        """Test successful customer credit summary calculation"""
        customer_id = str(uuid.uuid4())
        customer_sales = [
            {
                'id': str(uuid.uuid4()),
                'customer_id': customer_id,
                'total_amount': 500.00,
                'amount_paid': 500.00,
                'amount_due': 0.00,
                'payment_status': 'Paid'
            },
            {
                'id': str(uuid.uuid4()),
                'customer_id': customer_id,
                'total_amount': 300.00,
                'amount_paid': 100.00,
                'amount_due': 200.00,
                'payment_status': 'Credit'
            }
        ]
        
        mock_result = Mock()
        mock_result.data = customer_sales
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.in_.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_customer_credit_summary(customer_id)
        
        assert result['customer_id'] == customer_id
        assert result['total_credit_sales_amount'] == 800.00  # 500 + 300
        assert result['total_outstanding_amount'] == 200.00
        assert result['total_paid_amount'] == 500.00
        assert result['outstanding_sales_count'] == 1
        assert result['paid_sales_count'] == 1
        assert result['payment_completion_rate'] == 50.0  # 1/2 * 100
    
    def test_update_sale_payment_status_to_paid(self):
        """Test updating sale payment status to paid"""
        sale_id = self.sample_credit_sale['id']
        payment_method_id = str(uuid.uuid4())
        
        with patch.object(self.service, 'get_sale_by_id', return_value=self.sample_credit_sale):
            updated_sale = self.sample_credit_sale.copy()
            updated_sale['payment_status'] = 'Paid'
            updated_sale['amount_paid'] = 500.00
            updated_sale['amount_due'] = 0.00
            updated_sale['payment_method_id'] = payment_method_id
            
            mock_result = Mock()
            mock_result.data = [updated_sale]
            
            mock_update = Mock()
            mock_update.eq.return_value = mock_update
            mock_update.execute.return_value = mock_result
            
            self.mock_supabase.table.return_value.update.return_value = mock_update
            
            result = self.service.update_sale_payment_status(sale_id, 'Paid', payment_method_id)
            
            assert result['payment_status'] == 'Paid'
            assert result['amount_paid'] == 500.00
            assert result['amount_due'] == 0.00
            assert result['payment_method_id'] == payment_method_id
    
    def test_update_sale_payment_status_invalid_status(self):
        """Test error handling for invalid payment status"""
        sale_id = str(uuid.uuid4())
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.update_sale_payment_status(sale_id, 'InvalidStatus')
        
        assert "Invalid payment status" in str(exc_info.value)
    
    def test_update_sale_payment_status_paid_without_method(self):
        """Test error handling when marking as paid without payment method"""
        sale_id = str(uuid.uuid4())
        
        with patch.object(self.service, 'get_sale_by_id', return_value=self.sample_credit_sale):
            with pytest.raises(ValidationError) as exc_info:
                self.service.update_sale_payment_status(sale_id, 'Paid')
            
            assert "Payment method ID is required" in str(exc_info.value)
    
    def test_get_accounts_receivable_aging_success(self):
        """Test successful accounts receivable aging report generation"""
        current_date = datetime.utcnow()
        
        # Create sales with different ages
        outstanding_sales = [
            {
                'id': str(uuid.uuid4()),
                'amount_due': 100.00,
                'payment_status': 'Credit',
                'created_at': (current_date.replace(day=current_date.day-15)).isoformat()  # 15 days old
            },
            {
                'id': str(uuid.uuid4()),
                'amount_due': 200.00,
                'payment_status': 'Credit',
                'created_at': (current_date.replace(day=current_date.day-45)).isoformat()  # 45 days old
            },
            {
                'id': str(uuid.uuid4()),
                'amount_due': 300.00,
                'payment_status': 'Credit',
                'created_at': (current_date.replace(day=current_date.day-100)).isoformat()  # 100 days old
            }
        ]
        
        mock_result = Mock()
        mock_result.data = outstanding_sales
        
        mock_query = Mock()
        mock_query.in_.return_value = mock_query
        mock_query.gt.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_accounts_receivable_aging()
        
        assert result['total_outstanding_amount'] == 600.00  # 100 + 200 + 300
        assert result['total_outstanding_count'] == 3
        
        # Check aging buckets
        assert result['aging_buckets']['current']['count'] == 1  # 15 days
        assert result['aging_buckets']['current']['amount'] == 100.00
        
        assert result['aging_buckets']['30_days']['count'] == 1  # 45 days
        assert result['aging_buckets']['30_days']['amount'] == 200.00
        
        assert result['aging_buckets']['90_plus_days']['count'] == 1  # 100 days
        assert result['aging_buckets']['90_plus_days']['amount'] == 300.00
        
        # Check percentages
        assert result['aging_buckets']['current']['percentage'] == 16.67  # 100/600 * 100
        assert result['aging_buckets']['30_days']['percentage'] == 33.33  # 200/600 * 100
        assert result['aging_buckets']['90_plus_days']['percentage'] == 50.0  # 300/600 * 100
    
    def test_database_error_handling(self):
        """Test handling of database errors"""
        # Mock database exception
        self.mock_supabase.table.side_effect = Exception("Database connection failed")
        
        with pytest.raises(DatabaseError) as exc_info:
            self.service.get_outstanding_credit_sales()
        
        assert "Failed to retrieve outstanding credit sales" in str(exc_info.value)
    
    @patch('src.services.credit_sales_service.get_supabase_client')
    def test_initialization_failure(self, mock_get_client):
        """Test handling of initialization failure"""
        mock_get_client.return_value = None
        
        with pytest.raises(DatabaseError) as exc_info:
            CreditSalesService()
        
        assert "Failed to initialize Supabase client" in str(exc_info.value)