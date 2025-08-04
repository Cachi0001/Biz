#!/usr/bin/env python3
"""
Unit Tests for Revenue Recognition Service

Tests all functionality of the RevenueRecognitionService including proper
revenue recognition logic, accounts receivable calculations, and trend analysis.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import pytest
import uuid
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date, timedelta
from decimal import Decimal

from src.services.revenue_recognition_service import RevenueRecognitionService
from src.utils.exceptions import ValidationError, DatabaseError

class TestRevenueRecognitionService:
    """Test cases for RevenueRecognitionService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_supabase = Mock()
        
        self.service = RevenueRecognitionService()
        self.service.supabase = self.mock_supabase
        
        self.user_id = str(uuid.uuid4())
        
        # Sample sales data
        self.paid_sales = [
            {
                'id': str(uuid.uuid4()),
                'user_id': self.user_id,
                'total_amount': 100.00,
                'gross_profit': 30.00,
                'payment_status': 'Paid',
                'date': '2025-01-15T10:00:00Z'
            },
            {
                'id': str(uuid.uuid4()),
                'user_id': self.user_id,
                'total_amount': 200.00,
                'gross_profit': 60.00,
                'payment_status': 'Paid',
                'date': '2025-01-15T14:00:00Z'
            }
        ]
        
        self.credit_sales = [
            {
                'id': str(uuid.uuid4()),
                'user_id': self.user_id,
                'total_amount': 150.00,
                'amount_due': 150.00,
                'payment_status': 'Credit',
                'date': '2025-01-10T10:00:00Z'  # 5 days old
            },
            {
                'id': str(uuid.uuid4()),
                'user_id': self.user_id,
                'total_amount': 300.00,
                'amount_due': 300.00,
                'payment_status': 'Credit',
                'date': '2024-11-15T10:00:00Z'  # 60+ days old
            }
        ]
    
    def test_calculate_recognized_revenue_success(self):
        """Test successful recognized revenue calculation"""
        # Mock paid sales query
        mock_result = Mock()
        mock_result.data = self.paid_sales
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        start_date = date(2025, 1, 1)
        end_date = date(2025, 1, 31)
        
        result = self.service.calculate_recognized_revenue(self.user_id, start_date, end_date)
        
        assert result['recognized_revenue'] == 300.00  # 100 + 200
        assert result['recognized_profit'] == 90.00    # 30 + 60
        assert result['transaction_count'] == 2
        assert result['profit_margin'] == 30.0  # 90/300 * 100
        assert result['average_sale_value'] == 150.0  # 300/2
        
        # Verify query was built correctly
        calls = mock_query.eq.call_args_list
        assert ('user_id', self.user_id) in [call[0] for call in calls]
        assert ('payment_status', 'Paid') in [call[0] for call in calls]
    
    def test_calculate_recognized_revenue_no_sales(self):
        """Test recognized revenue calculation with no sales"""
        mock_result = Mock()
        mock_result.data = []
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.calculate_recognized_revenue(self.user_id)
        
        assert result['recognized_revenue'] == 0.0
        assert result['recognized_profit'] == 0.0
        assert result['transaction_count'] == 0
        assert result['profit_margin'] == 0.0
        assert result['average_sale_value'] == 0.0
    
    def test_calculate_accounts_receivable_success(self):
        """Test successful accounts receivable calculation"""
        # Mock credit sales query
        mock_result = Mock()
        mock_result.data = self.credit_sales
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.in_.return_value = mock_query
        mock_query.gt.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        as_of_date = date(2025, 1, 15)
        
        result = self.service.calculate_accounts_receivable(self.user_id, as_of_date)
        
        assert result['total_accounts_receivable'] == 450.00  # 150 + 300
        assert result['current_receivable'] == 150.00  # 5 days old
        assert result['overdue_receivable'] == 300.00  # 60+ days old
        
        # Check aging buckets
        assert result['aging_buckets']['current'] == 150.00
        assert result['aging_buckets']['60_days'] == 300.00
        
        assert result['outstanding_sales_count'] == 2
        assert result['overdue_percentage'] == 66.67  # 300/450 * 100
    
    def test_calculate_accounts_receivable_no_outstanding(self):
        """Test accounts receivable calculation with no outstanding sales"""
        mock_result = Mock()
        mock_result.data = []
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.in_.return_value = mock_query
        mock_query.gt.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.calculate_accounts_receivable(self.user_id)
        
        assert result['total_accounts_receivable'] == 0.0
        assert result['current_receivable'] == 0.0
        assert result['overdue_receivable'] == 0.0
        assert result['outstanding_sales_count'] == 0
        assert result['overdue_percentage'] == 0.0
    
    def test_get_revenue_recognition_summary_success(self):
        """Test comprehensive revenue recognition summary"""
        # Mock current period revenue calculation
        current_revenue = {
            'recognized_revenue': 300.00,
            'recognized_profit': 90.00,
            'transaction_count': 2,
            'profit_margin': 30.0,
            'average_sale_value': 150.0
        }
        
        # Mock previous period revenue calculation
        previous_revenue = {
            'recognized_revenue': 250.00,
            'recognized_profit': 75.00,
            'transaction_count': 2,
            'profit_margin': 30.0,
            'average_sale_value': 125.0
        }
        
        # Mock accounts receivable
        receivable = {
            'total_accounts_receivable': 450.00,
            'current_receivable': 150.00,
            'overdue_receivable': 300.00
        }
        
        # Mock total sales query
        mock_total_sales_result = Mock()
        mock_total_sales_result.data = [
            {'total_amount': 100.00, 'payment_status': 'Paid'},
            {'total_amount': 200.00, 'payment_status': 'Paid'},
            {'total_amount': 150.00, 'payment_status': 'Credit'}
        ]
        
        with patch.object(self.service, 'calculate_recognized_revenue', side_effect=[current_revenue, previous_revenue]):
            with patch.object(self.service, 'calculate_accounts_receivable', return_value=receivable):
                # Mock total sales query
                mock_query = Mock()
                mock_query.eq.return_value = mock_query
                mock_query.gte.return_value = mock_query
                mock_query.lte.return_value = mock_query
                mock_query.execute.return_value = mock_total_sales_result
                
                self.mock_supabase.table.return_value.select.return_value = mock_query
                
                result = self.service.get_revenue_recognition_summary(self.user_id, 30)
                
                assert result['current_period']['recognized_revenue'] == 300.00
                assert result['previous_period']['recognized_revenue'] == 250.00
                
                # Check growth calculations
                assert result['growth_metrics']['revenue_growth_percentage'] == 20.0  # (300-250)/250 * 100
                assert result['growth_metrics']['profit_growth_percentage'] == 20.0   # (90-75)/75 * 100
                
                # Check revenue recognition metrics
                assert result['revenue_recognition']['total_sales_amount'] == 450.00  # 100+200+150
                assert result['revenue_recognition']['recognized_revenue'] == 300.00
                assert result['revenue_recognition']['unrecognized_revenue'] == 450.00
                assert result['revenue_recognition']['recognition_rate_percentage'] == 66.67  # 300/450 * 100
    
    def test_track_revenue_recognition_changes_credit_to_paid(self):
        """Test tracking revenue recognition changes when sale moves from credit to paid"""
        sale_id = str(uuid.uuid4())
        
        # Mock sale data
        sale_data = {
            'id': sale_id,
            'total_amount': 200.00,
            'gross_profit': 60.00,
            'user_id': self.user_id
        }
        
        mock_result = Mock()
        mock_result.data = [sale_data]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.track_revenue_recognition_changes(sale_id, 'Credit', 'Paid')
        
        # Should add revenue since moving to paid
        assert result['impact_summary']['revenue_impact'] == 200.00
        assert result['impact_summary']['profit_impact'] == 60.00
        assert result['impact_summary']['impact_type'] == 'recognized'
        
        assert result['change_record']['old_payment_status'] == 'Credit'
        assert result['change_record']['new_payment_status'] == 'Paid'
        assert result['change_record']['sale_amount'] == 200.00
    
    def test_track_revenue_recognition_changes_paid_to_credit(self):
        """Test tracking revenue recognition changes when sale moves from paid to credit"""
        sale_id = str(uuid.uuid4())
        
        # Mock sale data
        sale_data = {
            'id': sale_id,
            'total_amount': 200.00,
            'gross_profit': 60.00,
            'user_id': self.user_id
        }
        
        mock_result = Mock()
        mock_result.data = [sale_data]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.track_revenue_recognition_changes(sale_id, 'Paid', 'Credit')
        
        # Should remove revenue since moving from paid
        assert result['impact_summary']['revenue_impact'] == -200.00
        assert result['impact_summary']['profit_impact'] == -60.00
        assert result['impact_summary']['impact_type'] == 'deferred'
    
    def test_track_revenue_recognition_changes_no_impact(self):
        """Test tracking revenue recognition changes with no impact"""
        sale_id = str(uuid.uuid4())
        
        # Mock sale data
        sale_data = {
            'id': sale_id,
            'total_amount': 200.00,
            'gross_profit': 60.00,
            'user_id': self.user_id
        }
        
        mock_result = Mock()
        mock_result.data = [sale_data]
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.track_revenue_recognition_changes(sale_id, 'Credit', 'Pending')
        
        # No revenue impact since neither status recognizes revenue
        assert result['impact_summary']['revenue_impact'] == 0.0
        assert result['impact_summary']['profit_impact'] == 0.0
        assert result['impact_summary']['impact_type'] == 'no change'
    
    def test_get_monthly_revenue_trend_success(self):
        """Test monthly revenue trend calculation"""
        # Mock monthly sales data
        monthly_sales = [
            {
                'total_amount': 100.00,
                'gross_profit': 30.00,
                'date': '2024-12-15T10:00:00Z',
                'payment_status': 'Paid'
            },
            {
                'total_amount': 200.00,
                'gross_profit': 60.00,
                'date': '2025-01-15T10:00:00Z',
                'payment_status': 'Paid'
            },
            {
                'total_amount': 150.00,
                'gross_profit': 45.00,
                'date': '2025-01-20T10:00:00Z',
                'payment_status': 'Paid'
            }
        ]
        
        mock_result = Mock()
        mock_result.data = monthly_sales
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        result = self.service.get_monthly_revenue_trend(self.user_id, 3)
        
        assert len(result['monthly_trend']) == 2  # 2024-12 and 2025-01
        
        # Check December data
        dec_data = next(m for m in result['monthly_trend'] if m['month'] == '2024-12')
        assert dec_data['recognized_revenue'] == 100.00
        assert dec_data['recognized_profit'] == 30.00
        assert dec_data['transaction_count'] == 1
        assert dec_data['profit_margin'] == 30.0
        
        # Check January data
        jan_data = next(m for m in result['monthly_trend'] if m['month'] == '2025-01')
        assert jan_data['recognized_revenue'] == 350.00  # 200 + 150
        assert jan_data['recognized_profit'] == 105.00   # 60 + 45
        assert jan_data['transaction_count'] == 2
        assert jan_data['revenue_growth_percentage'] == 250.0  # (350-100)/100 * 100
        
        # Check summary
        assert result['summary']['total_recognized_revenue'] == 450.00  # 100 + 350
        assert result['summary']['total_recognized_profit'] == 135.00   # 30 + 105
        assert result['summary']['average_monthly_revenue'] == 225.00   # 450/2
    
    def test_calculate_recognized_revenue_missing_user_id(self):
        """Test error handling for missing user ID"""
        with pytest.raises(ValidationError) as exc_info:
            self.service.calculate_recognized_revenue('')
        
        assert "User ID is required" in str(exc_info.value)
    
    def test_track_revenue_recognition_changes_sale_not_found(self):
        """Test error handling when sale not found"""
        sale_id = str(uuid.uuid4())
        
        mock_result = Mock()
        mock_result.data = []
        
        mock_query = Mock()
        mock_query.eq.return_value = mock_query
        mock_query.execute.return_value = mock_result
        
        self.mock_supabase.table.return_value.select.return_value = mock_query
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.track_revenue_recognition_changes(sale_id, 'Credit', 'Paid')
        
        assert "not found" in str(exc_info.value)
    
    def test_database_error_handling(self):
        """Test handling of database errors"""
        # Mock database exception
        self.mock_supabase.table.side_effect = Exception("Database connection failed")
        
        with pytest.raises(DatabaseError) as exc_info:
            self.service.calculate_recognized_revenue(self.user_id)
        
        assert "Failed to calculate recognized revenue" in str(exc_info.value)
    
    @patch('src.services.revenue_recognition_service.get_supabase_client')
    def test_initialization_failure(self, mock_get_client):
        """Test handling of initialization failure"""
        mock_get_client.return_value = None
        
        with pytest.raises(DatabaseError) as exc_info:
            RevenueRecognitionService()
        
        assert "Failed to initialize Supabase client" in str(exc_info.value)