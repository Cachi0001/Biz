#!/usr/bin/env python3
"""
Unit Tests for Enhanced Sales Service

Tests all functionality of the SalesService including enhanced sales creation,
payment method integration, and revenue recognition logic.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import pytest
import uuid
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date
from decimal import Decimal

from src.services.sales_service import SalesService
from src.utils.exceptions import ValidationError, NotFoundError, DatabaseError

class TestSalesService:
    """Test cases for SalesService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_supabase = Mock()
        self.mock_payment_method_service = Mock()
        
        self.service = SalesService()
        self.service.supabase = self.mock_supabase
        self.service.payment_method_service = self.mock_payment_method_service
        
        # Sample data
        self.sample_product = {
            'id': str(uuid.uuid4()),
            'name': 'Test Product',
            'cost_price': 50.00,
            'category_id': str(uuid.uuid4())
        }
        
        self.sample_payment_method = {
            'id': str(uuid.uuid4()),
            'name': 'Cash',
            'type': 'Cash',
            'is_pos': False,
            'requires_reference': False,
            'is_active': True
        }
        
        self.sample_sale_data = {
            'product_id': self.sample_product['id'],
            'quantity': 2,
            'unit_price': 75.00,
            'total_amount': 150.00,
            'payment_method_id': self.sample_payment_method['id'],
            'user_id': str(uuid.uuid4()),
            'customer_name': 'Test Customer'
        }
        
        self.sample_credit_sale_data = {
            'product_id': self.sample_product['id'],
            'quantity': 1,
            'unit_price': 100.00,
            'total_amount': 100.00,
            'payment_method_id': self.sample_payment_method['id'],
            'user_id': str(uuid.uuid4()),
            'payment_status': 'Credit',
            'customer_name': 'Credit Customer'
        }
    
    def test_create_sale_success_paid(self):
        """Test successful creation of a paid sale"""
        # Mock product lookup
        mock_product_result = Mock()
        mock_product_result.data = [self.sample_product]
        
        # Mock payment method validation
        self.mock_payment_method_service.get_payment_method_by_id.return_value = self.sample_payment_method
        
        # Mock sale creation
        created_sale = {
            'id': str(uuid.uuid4()),
            'product_id': self.sample_product['id'],
            'quantity': 2,
            'unit_price': 75.00,
            'total_amount': 150.00,
            'total_cogs': 100.00,  # 2 * 50.00
            'gross_profit': 50.00,  # 150.00 - 100.00
            'payment_status': 'Paid',
            'amount_paid': 150.00,
            'amount_due': 0.00,
            'payment_method_id': self.sample_payment_method['id']
        }
        
        mock_sale_result = Mock()
        mock_sale_result.data = [created_sale]
        
        # Configure mock table calls
        def table_side_effect(table_name):
            if table_name == 'products':
                mock_table = Mock()
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_product_result
                return mock_table
            elif table_name == 'sales':
                mock_table = Mock()
                mock_table.insert.return_value.execute.return_value = mock_sale_result
                return mock_table
            return Mock()
        
        self.mock_supabase.table.side_effect = table_side_effect
        
        # Test sale creation
        result = self.service.create_sale(self.sample_sale_data)
        
        assert result['id'] == created_sale['id']
        assert result['payment_status'] == 'Paid'
        assert result['amount_paid'] == 150.00
        assert result['amount_due'] == 0.00
        assert result['total_cogs'] == 100.00
        assert result['gross_profit'] == 50.00
        
        # Verify payment method was validated
        self.mock_payment_method_service.get_payment_method_by_id.assert_called_once_with(
            self.sample_payment_method['id']
        )
    
    def test_create_sale_success_credit(self):
        """Test successful creation of a credit sale"""
        # Mock product lookup
        mock_product_result = Mock()
        mock_product_result.data = [self.sample_product]
        
        # Mock payment method validation
        self.mock_payment_method_service.get_payment_method_by_id.return_value = self.sample_payment_method
        
        # Mock sale creation
        created_sale = {
            'id': str(uuid.uuid4()),
            'product_id': self.sample_product['id'],
            'quantity': 1,
            'unit_price': 100.00,
            'total_amount': 100.00,
            'total_cogs': 50.00,
            'gross_profit': 50.00,
            'payment_status': 'Credit',
            'amount_paid': 0.00,
            'amount_due': 100.00,
            'payment_method_id': self.sample_payment_method['id']
        }
        
        mock_sale_result = Mock()
        mock_sale_result.data = [created_sale]
        
        # Configure mock table calls
        def table_side_effect(table_name):
            if table_name == 'products':
                mock_table = Mock()
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_product_result
                return mock_table
            elif table_name == 'sales':
                mock_table = Mock()
                mock_table.insert.return_value.execute.return_value = mock_sale_result
                return mock_table
            return Mock()
        
        self.mock_supabase.table.side_effect = table_side_effect
        
        # Test credit sale creation
        result = self.service.create_sale(self.sample_credit_sale_data)
        
        assert result['payment_status'] == 'Credit'
        assert result['amount_paid'] == 0.00
        assert result['amount_due'] == 100.00
    
    def test_create_sale_missing_required_fields(self):
        """Test error handling for missing required fields"""
        incomplete_data = {
            'product_id': str(uuid.uuid4()),
            'quantity': 2,
            'unit_price': 75.00
            # Missing total_amount, payment_method_id, user_id
        }
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.create_sale(incomplete_data)
        
        assert "Missing required field" in str(exc_info.value)
    
    def test_create_sale_invalid_quantity(self):
        """Test error handling for invalid quantity"""
        invalid_data = self.sample_sale_data.copy()
        invalid_data['quantity'] = 0
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.create_sale(invalid_data)
        
        assert "Quantity must be greater than 0" in str(exc_info.value)
    
    def test_create_sale_negative_price(self):
        """Test error handling for negative unit price"""
        invalid_data = self.sample_sale_data.copy()
        invalid_data['unit_price'] = -10.00
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.create_sale(invalid_data)
        
        assert "Unit price cannot be negative" in str(exc_info.value)
    
    def test_create_sale_product_not_found(self):
        """Test error handling when product not found"""
        # Mock empty product result
        mock_product_result = Mock()
        mock_product_result.data = []
        
        mock_table = Mock()
        mock_table.select.return_value.eq.return_value.execute.return_value = mock_product_result
        self.mock_supabase.table.return_value = mock_table
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.create_sale(self.sample_sale_data)
        
        assert "Product with ID" in str(exc_info.value)
        assert "not found" in str(exc_info.value)
    
    def test_create_sale_invalid_payment_status(self):
        """Test error handling for invalid payment status"""
        invalid_data = self.sample_sale_data.copy()
        invalid_data['payment_status'] = 'InvalidStatus'
        
        # Mock product lookup
        mock_product_result = Mock()
        mock_product_result.data = [self.sample_product]
        
        mock_table = Mock()
        mock_table.select.return_value.eq.return_value.execute.return_value = mock_product_result
        self.mock_supabase.table.return_value = mock_table
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.create_sale(invalid_data)
        
        assert "Invalid payment status" in str(exc_info.value)
    
    def test_get_sale_by_id_success(self):
        """Test successful sale retrieval by ID"""
        sale_id = str(uuid.uuid4())
        sale_record = {
            'id': sale_id,
            'product_name': 'Test Product',
            'total_amount': 150.00,
            'payment_status': 'Paid'
        }
        
        mock_result = Mock()
        mock_result.data = [sale_record]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_sale_by_id(sale_id)
        
        assert result['id'] == sale_id
        assert result['total_amount'] == 150.00
        
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
    
    def test_update_sale_status_to_paid(self):
        """Test updating sale status to paid"""
        sale_id = str(uuid.uuid4())
        payment_method_id = str(uuid.uuid4())
        
        original_sale = {
            'id': sale_id,
            'total_amount': 100.00,
            'payment_status': 'Credit',
            'amount_paid': 0.00,
            'amount_due': 100.00
        }
        
        updated_sale = original_sale.copy()
        updated_sale.update({
            'payment_status': 'Paid',
            'amount_paid': 100.00,
            'amount_due': 0.00,
            'payment_method_id': payment_method_id
        })
        
        # Mock get_sale_by_id
        with patch.object(self.service, 'get_sale_by_id', return_value=original_sale):
            # Mock payment method validation
            self.mock_payment_method_service.get_payment_method_by_id.return_value = self.sample_payment_method
            
            # Mock sale update
            mock_result = Mock()
            mock_result.data = [updated_sale]
            
            mock_update = Mock()
            mock_update.eq.return_value = mock_update
            mock_update.execute.return_value = mock_result
            
            self.mock_supabase.table.return_value.update.return_value = mock_update
            
            result = self.service.update_sale_status(sale_id, 'Paid', payment_method_id)
            
            assert result['payment_status'] == 'Paid'
            assert result['amount_paid'] == 100.00
            assert result['amount_due'] == 0.00
            assert result['payment_method_id'] == payment_method_id
    
    def test_update_sale_status_invalid_status(self):
        """Test error handling for invalid payment status"""
        sale_id = str(uuid.uuid4())
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.update_sale_status(sale_id, 'InvalidStatus')
        
        assert "Invalid payment status" in str(exc_info.value)
    
    def test_update_sale_status_paid_without_method(self):
        """Test error handling when marking as paid without payment method"""
        sale_id = str(uuid.uuid4())
        original_sale = {'id': sale_id, 'payment_status': 'Credit'}
        
        with patch.object(self.service, 'get_sale_by_id', return_value=original_sale):
            with pytest.raises(ValidationError) as exc_info:
                self.service.update_sale_status(sale_id, 'Paid')
            
            assert "Payment method ID is required" in str(exc_info.value)
    
    def test_get_sales_by_user_success(self):
        """Test successful retrieval of user sales"""
        user_id = str(uuid.uuid4())
        sales = [
            {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'total_amount': 100.00,
                'payment_status': 'Paid'
            },
            {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'total_amount': 200.00,
                'payment_status': 'Credit'
            }
        ]
        
        mock_result = Mock()
        mock_result.data = sales
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_sales_by_user(user_id)
        
        assert len(result) == 2
        assert all(sale['user_id'] == user_id for sale in result)
        
        mock_query.eq.assert_called_with('user_id', user_id)
        mock_query.order.assert_called_with('created_at', desc=True)
    
    def test_get_sales_by_user_with_filters(self):
        """Test sales retrieval with filters"""
        user_id = str(uuid.uuid4())
        filters = {
            'start_date': '2025-01-01',
            'end_date': '2025-01-31',
            'payment_status': 'Paid'
        }
        
        mock_result = Mock()
        mock_result.data = []
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.offset.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_sales_by_user(user_id, filters)
        
        # Verify filters were applied
        calls = mock_query.eq.call_args_list
        assert ('user_id', user_id) in [call[0] for call in calls]
        assert ('payment_status', 'Paid') in [call[0] for call in calls]
        
        mock_query.gte.assert_called_with('date', '2025-01-01')
        mock_query.lte.assert_called_with('date', '2025-01-31')
    
    def test_get_sales_summary_success(self):
        """Test successful sales summary calculation with revenue recognition"""
        user_id = str(uuid.uuid4())
        
        # Mock sales data with mixed payment statuses
        sales = [
            {
                'id': str(uuid.uuid4()),
                'total_amount': 100.00,
                'amount_paid': 100.00,
                'amount_due': 0.00,
                'gross_profit': 30.00,
                'payment_status': 'Paid',
                'payment_method_id': 'cash-id',
                'product_category_id': 'cat1'
            },
            {
                'id': str(uuid.uuid4()),
                'total_amount': 200.00,
                'amount_paid': 0.00,
                'amount_due': 200.00,
                'gross_profit': 60.00,
                'payment_status': 'Credit',
                'payment_method_id': 'credit-id',
                'product_category_id': 'cat1'
            },
            {
                'id': str(uuid.uuid4()),
                'total_amount': 150.00,
                'amount_paid': 150.00,
                'amount_due': 0.00,
                'gross_profit': 45.00,
                'payment_status': 'Paid',
                'payment_method_id': 'cash-id',
                'product_category_id': 'cat2'
            }
        ]
        
        with patch.object(self.service, 'get_sales_by_user', return_value=sales):
            result = self.service.get_sales_summary(user_id)
            
            # Check revenue recognition (only paid sales)
            assert result['total_sales_amount'] == 450.00  # 100 + 200 + 150
            assert result['recognized_revenue'] == 250.00  # 100 + 150 (only paid)
            assert result['outstanding_credit'] == 200.00  # Only the credit sale
            
            assert result['total_transactions'] == 3
            assert result['paid_transactions'] == 2
            assert result['credit_transactions'] == 1
            assert result['pending_transactions'] == 0
            
            # Check profit recognition (only from paid sales)
            assert result['total_gross_profit'] == 135.00  # 30 + 60 + 45
            assert result['recognized_gross_profit'] == 75.00  # 30 + 45 (only paid)
            
            # Check revenue recognition rate
            assert result['revenue_recognition_rate'] == 55.56  # 250/450 * 100
            
            # Check profit margin (from recognized revenue)
            assert result['profit_margin'] == 30.0  # 75/250 * 100
    
    def test_get_product_category_sales_success(self):
        """Test successful product category sales calculation"""
        user_id = str(uuid.uuid4())
        target_date = date(2025, 1, 15)
        
        # Mock categories
        categories = [
            {'id': 'cat1', 'name': 'Beverages'},
            {'id': 'cat2', 'name': 'Snacks'}
        ]
        
        mock_categories_result = Mock()
        mock_categories_result.data = categories
        
        # Mock sales data (only paid sales should be counted)
        sales = [
            {
                'id': str(uuid.uuid4()),
                'total_amount': 100.00,
                'payment_status': 'Paid',
                'product_category_id': 'cat1'
            },
            {
                'id': str(uuid.uuid4()),
                'total_amount': 200.00,
                'payment_status': 'Credit',  # Should be excluded
                'product_category_id': 'cat1'
            },
            {
                'id': str(uuid.uuid4()),
                'total_amount': 150.00,
                'payment_status': 'Paid',
                'product_category_id': 'cat2'
            }
        ]
        
        with patch.object(self.service, 'get_sales_by_user', return_value=sales):
            # Mock categories query
            mock_table = Mock()
            mock_table.select.return_value.execute.return_value = mock_categories_result
            self.mock_supabase.table.return_value = mock_table
            
            result = self.service.get_product_category_sales(user_id, target_date)
            
            assert result['date'] == target_date.isoformat()
            assert result['total_sales'] == 250.00  # Only paid sales: 100 + 150
            assert len(result['category_breakdown']) == 2
            
            # Check category breakdown
            beverages_cat = next(cat for cat in result['category_breakdown'] if cat['category_name'] == 'Beverages')
            assert beverages_cat['total_amount'] == 100.00  # Only paid sale
            assert beverages_cat['percentage'] == 40.0  # 100/250 * 100
            
            snacks_cat = next(cat for cat in result['category_breakdown'] if cat['category_name'] == 'Snacks')
            assert snacks_cat['total_amount'] == 150.00
            assert snacks_cat['percentage'] == 60.0  # 150/250 * 100
    
    def test_database_error_handling(self):
        """Test handling of database errors"""
        # Mock database exception
        self.mock_supabase.table.side_effect = Exception("Database connection failed")
        
        with pytest.raises(DatabaseError) as exc_info:
            self.service.create_sale(self.sample_sale_data)
        
        assert "Failed to create sale" in str(exc_info.value)
    
    @patch('src.services.sales_service.get_supabase_client')
    def test_initialization_failure(self, mock_get_client):
        """Test handling of initialization failure"""
        mock_get_client.return_value = None
        
        with pytest.raises(DatabaseError) as exc_info:
            SalesService()
        
        assert "Failed to initialize Supabase client" in str(exc_info.value)