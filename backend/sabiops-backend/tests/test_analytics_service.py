"""
Unit tests for Analytics Service
Tests the comprehensive business analytics functionality
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from services.analytics_service import AnalyticsService

class TestAnalyticsService(unittest.TestCase):
    """Test cases for AnalyticsService"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.analytics_service = AnalyticsService()
        
        # Mock supabase client
        self.mock_supabase = Mock()
        self.analytics_service.supabase = self.mock_supabase
        
        # Sample test data
        self.sample_user_id = "test-user-123"
        self.sample_owner_id = "test-owner-456"
        
        # Sample sales data
        self.sample_sales_data = [
            {
                'total_amount': 1000.0,
                'profit_from_sales': 300.0,
                'total_cogs': 700.0,
                'date': '2024-01-15T10:00:00Z',
                'quantity': 2,
                'product_name': 'Test Product 1'
            },
            {
                'total_amount': 1500.0,
                'profit_from_sales': 500.0,
                'total_cogs': 1000.0,
                'date': '2024-01-20T14:30:00Z',
                'quantity': 3,
                'product_name': 'Test Product 2'
            }
        ]
        
        # Sample customer data
        self.sample_customers_data = [
            {
                'id': 'customer-1',
                'name': 'John Doe',
                'email': 'john@example.com',
                'created_at': '2024-01-10T09:00:00Z'
            },
            {
                'id': 'customer-2',
                'name': 'Jane Smith',
                'email': 'jane@example.com',
                'created_at': '2024-01-25T11:00:00Z'
            }
        ]
        
        # Sample product data
        self.sample_products_data = [
            {
                'id': 'product-1',
                'name': 'Test Product 1',
                'quantity': 50,
                'low_stock_threshold': 10
            },
            {
                'id': 'product-2',
                'name': 'Test Product 2',
                'quantity': 5,
                'low_stock_threshold': 10
            }
        ]
        
        # Sample expense data
        self.sample_expenses_data = [
            {
                'amount': 200.0,
                'category': 'Office Supplies',
                'date': '2024-01-12T08:00:00Z'
            },
            {
                'amount': 300.0,
                'category': 'Marketing',
                'date': '2024-01-18T16:00:00Z'
            }
        ]

    @patch('services.analytics_service.get_user_context')
    def test_get_business_analytics_success(self, mock_get_user_context):
        """Test successful business analytics retrieval"""
        # Mock user context
        mock_get_user_context.return_value = (self.sample_owner_id, 'Owner')
        
        # Mock individual analytics methods
        with patch.object(self.analytics_service, 'get_revenue_analytics') as mock_revenue, \
             patch.object(self.analytics_service, 'get_customer_analytics') as mock_customer, \
             patch.object(self.analytics_service, 'get_product_analytics') as mock_product, \
             patch.object(self.analytics_service, 'get_financial_analytics') as mock_financial:
            
            # Set up mock returns
            mock_revenue.return_value = {'total_revenue': 2500.0}
            mock_customer.return_value = {'total_customers': 2}
            mock_product.return_value = {'total_products': 2}
            mock_financial.return_value = {'total_expenses': 500.0}
            
            # Call the method
            result = self.analytics_service.get_business_analytics(self.sample_user_id, 'monthly')
            
            # Assertions
            self.assertTrue(result['success'])
            self.assertIn('data', result)
            self.assertEqual(result['data']['time_period'], 'monthly')
            self.assertIn('revenue', result['data'])
            self.assertIn('customers', result['data'])
            self.assertIn('products', result['data'])
            self.assertIn('financial', result['data'])
            
            # Verify method calls
            mock_revenue.assert_called_once_with(self.sample_owner_id, 'monthly')
            mock_customer.assert_called_once_with(self.sample_owner_id, 'monthly')
            mock_product.assert_called_once_with(self.sample_owner_id, 'monthly')
            mock_financial.assert_called_once_with(self.sample_owner_id, 'monthly')

    def test_get_revenue_analytics_with_data(self):
        """Test revenue analytics calculation with sample data"""
        # Mock supabase table calls
        mock_sales_result = Mock()
        mock_sales_result.data = self.sample_sales_data
        
        self.mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value = mock_sales_result
        
        # Call the method
        result = self.analytics_service.get_revenue_analytics(self.sample_owner_id, 'monthly')
        
        # Assertions
        self.assertEqual(result['total_revenue'], 2500.0)  # 1000 + 1500
        self.assertEqual(result['total_profit'], 800.0)    # 300 + 500
        self.assertEqual(result['total_cogs'], 1700.0)     # 700 + 1000
        self.assertEqual(result['profit_margin'], 32.0)    # 800/2500 * 100

    def test_get_customer_analytics_with_data(self):
        """Test customer analytics calculation with sample data"""
        # Mock supabase calls
        mock_customers_result = Mock()
        mock_customers_result.data = self.sample_customers_data
        
        mock_sales_result = Mock()
        mock_sales_result.data = [
            {'customer_name': 'John Doe', 'total_amount': 1000.0},
            {'customer_name': 'Jane Smith', 'total_amount': 1500.0},
            {'customer_name': 'John Doe', 'total_amount': 500.0}
        ]
        
        self.mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_customers_result
        
        # Mock the second call for sales data
        def mock_table_calls(*args):
            if args[0] == 'customers':
                return Mock(select=Mock(return_value=Mock(eq=Mock(return_value=Mock(execute=Mock(return_value=mock_customers_result))))))
            elif args[0] == 'sales':
                return Mock(select=Mock(return_value=Mock(eq=Mock(return_value=Mock(execute=Mock(return_value=mock_sales_result))))))
        
        self.mock_supabase.table.side_effect = mock_table_calls
        
        # Call the method
        result = self.analytics_service.get_customer_analytics(self.sample_owner_id, 'monthly')
        
        # Assertions
        self.assertEqual(result['total_customers'], 2)
        self.assertIn('top_customers', result)
        self.assertIn('avg_order_value', result)

    def test_get_product_analytics_with_data(self):
        """Test product analytics calculation with sample data"""
        # Mock supabase calls
        mock_products_result = Mock()
        mock_products_result.data = self.sample_products_data
        
        mock_sales_result = Mock()
        mock_sales_result.data = self.sample_sales_data
        
        def mock_table_calls(*args):
            if args[0] == 'products':
                return Mock(select=Mock(return_value=Mock(eq=Mock(return_value=Mock(execute=Mock(return_value=mock_products_result))))))
            elif args[0] == 'sales':
                return Mock(select=Mock(return_value=Mock(eq=Mock(return_value=Mock(gte=Mock(return_value=Mock(lte=Mock(return_value=Mock(execute=Mock(return_value=mock_sales_result))))))))))
        
        self.mock_supabase.table.side_effect = mock_table_calls
        
        # Call the method
        result = self.analytics_service.get_product_analytics(self.sample_owner_id, 'monthly')
        
        # Assertions
        self.assertEqual(result['total_products'], 2)
        self.assertEqual(result['low_stock_count'], 1)  # Product 2 has stock (5) <= threshold (10)
        self.assertIn('top_products_by_revenue', result)
        self.assertIn('inventory_turnover', result)

    def test_get_financial_analytics_with_data(self):
        """Test financial analytics calculation with sample data"""
        # Mock supabase calls
        mock_sales_result = Mock()
        mock_sales_result.data = self.sample_sales_data
        
        mock_expenses_result = Mock()
        mock_expenses_result.data = self.sample_expenses_data
        
        def mock_table_calls(*args):
            if args[0] == 'sales':
                return Mock(select=Mock(return_value=Mock(eq=Mock(return_value=Mock(gte=Mock(return_value=Mock(lte=Mock(return_value=Mock(execute=Mock(return_value=mock_sales_result))))))))))
            elif args[0] == 'expenses':
                return Mock(select=Mock(return_value=Mock(eq=Mock(return_value=Mock(gte=Mock(return_value=Mock(lte=Mock(return_value=Mock(execute=Mock(return_value=mock_expenses_result))))))))))
        
        self.mock_supabase.table.side_effect = mock_table_calls
        
        # Call the method
        result = self.analytics_service.get_financial_analytics(self.sample_owner_id, 'monthly')
        
        # Assertions
        self.assertEqual(result['total_revenue'], 2500.0)
        self.assertEqual(result['total_expenses'], 500.0)
        self.assertEqual(result['gross_profit'], 800.0)  # revenue - cogs
        self.assertEqual(result['net_profit'], 300.0)    # gross_profit - expenses
        self.assertIn('expense_breakdown', result)

    def test_calculate_growth_rate(self):
        """Test growth rate calculation"""
        # Test positive growth
        growth = self.analytics_service._calculate_growth_rate(120, 100)
        self.assertEqual(growth, 20.0)
        
        # Test negative growth
        growth = self.analytics_service._calculate_growth_rate(80, 100)
        self.assertEqual(growth, -20.0)
        
        # Test zero previous value
        growth = self.analytics_service._calculate_growth_rate(100, 0)
        self.assertEqual(growth, 100.0)
        
        # Test zero current value
        growth = self.analytics_service._calculate_growth_rate(0, 100)
        self.assertEqual(growth, -100.0)

    def test_parse_date_valid_formats(self):
        """Test date parsing with various valid formats"""
        # Test ISO format with Z
        date_str = "2024-01-15T10:30:00Z"
        parsed = self.analytics_service._parse_date(date_str)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed.year, 2024)
        self.assertEqual(parsed.month, 1)
        self.assertEqual(parsed.day, 15)
        
        # Test ISO format with timezone
        date_str = "2024-01-15T10:30:00+00:00"
        parsed = self.analytics_service._parse_date(date_str)
        self.assertIsNotNone(parsed)
        
        # Test None input
        parsed = self.analytics_service._parse_date(None)
        self.assertIsNone(parsed)
        
        # Test empty string
        parsed = self.analytics_service._parse_date("")
        self.assertIsNone(parsed)

    def test_get_time_range_monthly(self):
        """Test time range calculation for monthly period"""
        with patch('services.analytics_service.datetime') as mock_datetime:
            # Mock current time
            mock_now = datetime(2024, 2, 15, 12, 0, 0, tzinfo=timezone.utc)
            mock_datetime.now.return_value = mock_now
            
            start_date, end_date, prev_start, prev_end = self.analytics_service._get_time_range('monthly')
            
            # Should be February 1st to February 29th (or 28th)
            self.assertEqual(start_date.day, 1)
            self.assertEqual(start_date.month, 2)
            self.assertEqual(start_date.year, 2024)
            
            # Previous period should be January
            self.assertEqual(prev_start.month, 1)
            self.assertEqual(prev_start.year, 2024)

    def test_get_time_range_daily(self):
        """Test time range calculation for daily period"""
        with patch('services.analytics_service.datetime') as mock_datetime:
            # Mock current time
            mock_now = datetime(2024, 2, 15, 12, 0, 0, tzinfo=timezone.utc)
            mock_datetime.now.return_value = mock_now
            
            start_date, end_date, prev_start, prev_end = self.analytics_service._get_time_range('daily')
            
            # Should be today
            self.assertEqual(start_date.day, 15)
            self.assertEqual(start_date.month, 2)
            self.assertEqual(start_date.year, 2024)
            self.assertEqual(start_date.hour, 0)
            
            # Previous period should be yesterday
            self.assertEqual(prev_start.day, 14)
            self.assertEqual(prev_start.month, 2)

    def test_generate_revenue_time_series(self):
        """Test revenue time series generation"""
        result = self.analytics_service._generate_revenue_time_series(self.sample_sales_data, 'monthly')
        
        # Should return a list of time series data
        self.assertIsInstance(result, list)
        
        # Each item should have required fields
        for item in result:
            self.assertIn('period', item)
            self.assertIn('revenue', item)
            self.assertIn('profit', item)
            self.assertIn('orders', item)

    def test_error_handling_in_revenue_analytics(self):
        """Test error handling in revenue analytics"""
        # Mock supabase to raise an exception
        self.mock_supabase.table.side_effect = Exception("Database error")
        
        result = self.analytics_service.get_revenue_analytics(self.sample_owner_id, 'monthly')
        
        # Should return default values and error
        self.assertEqual(result['total_revenue'], 0)
        self.assertEqual(result['total_profit'], 0)
        self.assertIn('error', result)

    def test_empty_data_handling(self):
        """Test handling of empty data sets"""
        # Mock empty results
        mock_empty_result = Mock()
        mock_empty_result.data = []
        
        self.mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value = mock_empty_result
        
        result = self.analytics_service.get_revenue_analytics(self.sample_owner_id, 'monthly')
        
        # Should handle empty data gracefully
        self.assertEqual(result['total_revenue'], 0)
        self.assertEqual(result['total_profit'], 0)
        self.assertEqual(result['revenue_growth'], 0)
        self.assertEqual(result['profit_growth'], 0)

if __name__ == '__main__':
    unittest.main()