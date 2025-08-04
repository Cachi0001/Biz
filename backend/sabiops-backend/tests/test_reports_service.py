#!/usr/bin/env python3
"""
Unit Tests for Reports Service

Tests all functionality of the ReportsService including daily summaries,
weekly/monthly reports, and financial dashboard generation.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import pytest
import uuid
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, date, timedelta
from decimal import Decimal

from src.services.reports_service import ReportsService
from src.utils.exceptions import ValidationError, DatabaseError

class TestReportsService:
    """Test cases for ReportsService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_supabase = Mock()
        self.mock_payment_service = Mock()
        self.mock_sales_service = Mock()
        
        self.service = ReportsService()
        self.service.supabase = self.mock_supabase
        self.service.payment_service = self.mock_payment_service
        self.service.sales_service = self.mock_sales_service
        
        self.user_id = str(uuid.uuid4())
        self.target_date = date(2025, 1, 15)
        
        # Sample service responses
        self.sample_cash_summary = {
            'date': '2025-01-15',
            'cash_in': 500.00,
            'cash_out': 50.00,
            'cash_at_hand': 450.00,
            'transaction_count': 10
        }
        
        self.sample_pos_summary = {
            'date': '2025-01-15',
            'total_deposits': 800.00,
            'total_withdrawals': 100.00,
            'net_flow': 700.00,
            'total_transactions': 15,
            'pos_accounts': [
                {
                    'account_name': 'Moniepoint POS',
                    'deposits': 500.00,
                    'withdrawals': 50.00,
                    'net_flow': 450.00,
                    'transaction_count': 8
                }
            ]
        }
        
        self.sample_payment_breakdown = {
            'date': '2025-01-15',
            'total_amount': 1200.00,
            'total_transactions': 25,
            'payment_methods': [
                {
                    'payment_method_name': 'Cash',
                    'total_amount': 500.00,
                    'transaction_count': 10,
                    'percentage': 41.67
                },
                {
                    'payment_method_name': 'POS - Card',
                    'total_amount': 700.00,
                    'transaction_count': 15,
                    'percentage': 58.33
                }
            ]
        }
        
        self.sample_category_sales = {
            'date': '2025-01-15',
            'total_sales': 1200.00,
            'category_breakdown': [
                {
                    'category_name': 'Beverages',
                    'total_amount': 600.00,
                    'transaction_count': 12,
                    'percentage': 50.0
                },
                {
                    'category_name': 'Snacks',
                    'total_amount': 400.00,
                    'transaction_count': 8,
                    'percentage': 33.33
                }
            ]
        }
        
        self.sample_sales_summary = {
            'recognized_revenue': 1200.00,
            'recognized_gross_profit': 360.00,
            'outstanding_credit': 200.00,
            'paid_transactions': 25,
            'profit_margin': 30.0,
            'revenue_recognition_rate': 85.7
        }
    
    def test_generate_daily_summary_success(self):
        """Test successful daily summary generation"""
        # Mock service responses
        self.mock_payment_service.get_daily_cash_summary.return_value = self.sample_cash_summary
        self.mock_payment_service.get_pos_summary.return_value = self.sample_pos_summary
        self.mock_payment_service.get_payment_method_breakdown.return_value = self.sample_payment_breakdown
        self.mock_sales_service.get_product_category_sales.return_value = self.sample_category_sales
        self.mock_sales_service.get_sales_summary.return_value = self.sample_sales_summary
        
        result = self.service.generate_daily_summary(self.user_id, self.target_date)
        
        assert result['summary_date'] == self.target_date.isoformat()
        assert result['user_id'] == self.user_id
        
        # Check revenue metrics
        assert result['revenue_metrics']['total_revenue'] == 1200.00
        assert result['revenue_metrics']['total_transactions'] == 25
        assert result['revenue_metrics']['outstanding_credit'] == 200.00
        assert result['revenue_metrics']['gross_profit'] == 360.00
        
        # Check cash flow
        assert result['cash_flow']['cash_at_hand'] == 450.00
        assert result['cash_flow']['pos_net_flow'] == 700.00
        assert result['cash_flow']['total_cash_flow'] == 1150.00  # 450 + 700
        
        # Check performance indicators
        assert result['performance_indicators']['revenue_recognition_rate'] == 85.7
        assert result['performance_indicators']['cash_to_revenue_ratio'] == 95.83  # 1150/1200 * 100
        
        # Verify service calls
        self.mock_payment_service.get_daily_cash_summary.assert_called_once_with(self.target_date, self.user_id)
        self.mock_payment_service.get_pos_summary.assert_called_once_with(self.target_date, self.user_id)
        self.mock_sales_service.get_product_category_sales.assert_called_once_with(self.user_id, self.target_date)
    
    def test_generate_daily_summary_missing_user_id(self):
        """Test error handling for missing user ID"""
        with pytest.raises(ValidationError) as exc_info:
            self.service.generate_daily_summary('')
        
        assert "User ID is required" in str(exc_info.value)
    
    def test_generate_daily_summary_future_date(self):
        """Test error handling for future date"""
        future_date = date.today() + timedelta(days=1)
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.generate_daily_summary(self.user_id, future_date)
        
        assert "Cannot generate summary for future dates" in str(exc_info.value)
    
    def test_generate_daily_summary_default_date(self):
        """Test daily summary generation with default date (today)"""
        # Mock service responses
        self.mock_payment_service.get_daily_cash_summary.return_value = self.sample_cash_summary
        self.mock_payment_service.get_pos_summary.return_value = self.sample_pos_summary
        self.mock_payment_service.get_payment_method_breakdown.return_value = self.sample_payment_breakdown
        self.mock_sales_service.get_product_category_sales.return_value = self.sample_category_sales
        self.mock_sales_service.get_sales_summary.return_value = self.sample_sales_summary
        
        result = self.service.generate_daily_summary(self.user_id)
        
        assert result['summary_date'] == date.today().isoformat()
        
        # Verify services were called with today's date
        self.mock_payment_service.get_daily_cash_summary.assert_called_once_with(date.today(), self.user_id)
    
    def test_generate_weekly_summary_success(self):
        """Test successful weekly summary generation"""
        week_ending = date(2025, 1, 15)  # Wednesday
        
        # Mock daily summary generation
        daily_summaries = []
        for i in range(7):  # 7 days
            daily_date = week_ending - timedelta(days=6-i)
            daily_summary = {
                'summary_date': daily_date.isoformat(),
                'revenue_metrics': {
                    'total_revenue': 100.00 + (i * 10),  # Varying revenue
                    'total_transactions': 5 + i,
                    'outstanding_credit': 20.00,
                    'gross_profit': 30.00 + (i * 3)
                },
                'cash_flow': {
                    'total_cash_flow': 80.00 + (i * 5)
                }
            }
            daily_summaries.append(daily_summary)
        
        with patch.object(self.service, 'generate_daily_summary', side_effect=daily_summaries):
            result = self.service.generate_weekly_summary(self.user_id, week_ending)
            
            assert result['week_period']['end_date'] == week_ending.isoformat()
            assert result['week_period']['days_included'] == 7
            
            # Check weekly totals
            expected_revenue = sum(ds['revenue_metrics']['total_revenue'] for ds in daily_summaries)
            assert result['weekly_totals']['total_revenue'] == expected_revenue
            
            expected_transactions = sum(ds['revenue_metrics']['total_transactions'] for ds in daily_summaries)
            assert result['weekly_totals']['total_transactions'] == expected_transactions
            
            # Check averages
            assert result['weekly_averages']['average_daily_revenue'] == expected_revenue / 7
            assert result['weekly_averages']['average_daily_transactions'] == expected_transactions / 7
            
            # Check best/worst days
            assert result['weekly_metrics']['best_day'] is not None
            assert result['weekly_metrics']['worst_day'] is not None
    
    def test_generate_monthly_summary_success(self):
        """Test successful monthly summary generation"""
        year = 2025
        month = 1
        
        # Mock sales summary for the month
        monthly_sales = {
            'recognized_revenue': 15000.00,
            'recognized_gross_profit': 4500.00,
            'outstanding_credit': 2000.00,
            'paid_transactions': 300,
            'profit_margin': 30.0,
            'revenue_recognition_rate': 88.2,
            'payment_method_breakdown': [],
            'product_category_breakdown': []
        }
        
        self.mock_sales_service.get_sales_summary.return_value = monthly_sales
        
        # Mock daily snapshots
        daily_snapshots = [
            {'summary_date': '2025-01-01', 'revenue_metrics': {'total_revenue': 500.00}},
            {'summary_date': '2025-01-15', 'revenue_metrics': {'total_revenue': 600.00}},
            {'summary_date': '2025-01-31', 'revenue_metrics': {'total_revenue': 550.00}}
        ]
        
        with patch.object(self.service, 'generate_daily_summary', side_effect=daily_snapshots):
            result = self.service.generate_monthly_summary(self.user_id, year, month)
            
            assert result['month_period']['year'] == year
            assert result['month_period']['month'] == month
            assert result['month_period']['days_in_period'] == 31
            
            # Check monthly totals
            assert result['monthly_totals']['total_revenue'] == 15000.00
            assert result['monthly_totals']['total_transactions'] == 300
            assert result['monthly_totals']['outstanding_credit'] == 2000.00
            
            # Check averages
            assert result['monthly_averages']['average_daily_revenue'] == 15000.00 / 31
            assert result['monthly_averages']['average_daily_transactions'] == 300 / 31
            assert result['monthly_averages']['average_transaction_value'] == 15000.00 / 300
            
            # Check metrics
            assert result['monthly_metrics']['profit_margin'] == 30.0
            assert result['monthly_metrics']['revenue_recognition_rate'] == 88.2
    
    def test_generate_monthly_summary_invalid_month(self):
        """Test error handling for invalid month"""
        with pytest.raises(ValidationError) as exc_info:
            self.service.generate_monthly_summary(self.user_id, 2025, 13)
        
        assert "Month must be between 1 and 12" in str(exc_info.value)
    
    def test_generate_monthly_summary_invalid_year(self):
        """Test error handling for invalid year"""
        with pytest.raises(ValidationError) as exc_info:
            self.service.generate_monthly_summary(self.user_id, 2019, 1)
        
        assert "Year must be between 2020" in str(exc_info.value)
    
    def test_generate_monthly_summary_future_month(self):
        """Test error handling for future month"""
        future_year = date.today().year + 1
        
        with pytest.raises(ValidationError) as exc_info:
            self.service.generate_monthly_summary(self.user_id, future_year, 1)
        
        assert "Cannot generate summary for future months" in str(exc_info.value)
    
    def test_get_financial_dashboard_data_success(self):
        """Test successful financial dashboard data generation"""
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Mock today's summary
        today_summary = {
            'summary_date': today.isoformat(),
            'revenue_metrics': {
                'total_revenue': 1000.00,
                'total_transactions': 20,
                'outstanding_credit': 150.00,
                'gross_profit': 300.00,
                'profit_margin': 30.0
            },
            'cash_flow': {
                'cash_at_hand': 400.00,
                'pos_net_flow': 600.00,
                'total_cash_flow': 1000.00
            }
        }
        
        # Mock yesterday's summary
        yesterday_summary = {
            'summary_date': yesterday.isoformat(),
            'revenue_metrics': {
                'total_revenue': 800.00,
                'total_transactions': 16
            }
        }
        
        # Mock week summary
        week_summary = {
            'weekly_totals': {
                'total_revenue': 5000.00,
                'total_transactions': 100
            }
        }
        
        # Mock month summary
        month_summary = {
            'monthly_totals': {
                'total_revenue': 20000.00,
                'total_transactions': 400
            }
        }
        
        # Mock outstanding credit summary
        outstanding_summary = {
            'total_outstanding_amount': 2500.00,
            'total_count': 15,
            'outstanding_sales': [
                {'id': '1', 'amount_due': 200.00},
                {'id': '2', 'amount_due': 150.00}
            ]
        }
        
        with patch.object(self.service, 'generate_daily_summary', side_effect=[today_summary, yesterday_summary]):
            with patch.object(self.service, 'generate_weekly_summary', return_value=week_summary):
                with patch.object(self.service, 'generate_monthly_summary', return_value=month_summary):
                    with patch('src.services.reports_service.CreditSalesService') as mock_credit_service_class:
                        mock_credit_service = Mock()
                        mock_credit_service.get_outstanding_credit_sales.return_value = outstanding_summary
                        mock_credit_service_class.return_value = mock_credit_service
                        
                        result = self.service.get_financial_dashboard_data(self.user_id)
                        
                        assert result['dashboard_date'] == today.isoformat()
                        assert result['user_id'] == self.user_id
                        
                        # Check summaries are included
                        assert result['today_summary'] == today_summary
                        assert result['yesterday_summary'] == yesterday_summary
                        assert result['week_summary'] == week_summary
                        assert result['month_summary'] == month_summary
                        
                        # Check growth metrics
                        expected_growth = ((1000.00 - 800.00) / 800.00 * 100)
                        assert result['growth_metrics']['daily_revenue_growth'] == round(expected_growth, 2)
                        
                        # Check KPIs
                        assert result['key_performance_indicators']['daily_revenue'] == 1000.00
                        assert result['key_performance_indicators']['weekly_revenue'] == 5000.00
                        assert result['key_performance_indicators']['monthly_revenue'] == 20000.00
                        assert result['key_performance_indicators']['outstanding_credit'] == 2500.00
    
    def test_calculate_cash_flow_consistency_high_consistency(self):
        """Test cash flow consistency calculation with consistent flows"""
        daily_summaries = [
            {'cash_flow': {'total_cash_flow': 100.00}},
            {'cash_flow': {'total_cash_flow': 105.00}},
            {'cash_flow': {'total_cash_flow': 95.00}},
            {'cash_flow': {'total_cash_flow': 102.00}}
        ]
        
        consistency = self.service._calculate_cash_flow_consistency(daily_summaries)
        
        # Should be high consistency (low variation)
        assert consistency > 90.0
    
    def test_calculate_cash_flow_consistency_low_consistency(self):
        """Test cash flow consistency calculation with inconsistent flows"""
        daily_summaries = [
            {'cash_flow': {'total_cash_flow': 100.00}},
            {'cash_flow': {'total_cash_flow': 500.00}},
            {'cash_flow': {'total_cash_flow': 50.00}},
            {'cash_flow': {'total_cash_flow': 300.00}}
        ]
        
        consistency = self.service._calculate_cash_flow_consistency(daily_summaries)
        
        # Should be low consistency (high variation)
        assert consistency < 50.0
    
    def test_calculate_cash_flow_consistency_single_day(self):
        """Test cash flow consistency with single day (should be 100%)"""
        daily_summaries = [
            {'cash_flow': {'total_cash_flow': 100.00}}
        ]
        
        consistency = self.service._calculate_cash_flow_consistency(daily_summaries)
        
        assert consistency == 100.0
    
    def test_database_error_handling(self):
        """Test handling of database errors"""
        # Mock service exception
        self.mock_payment_service.get_daily_cash_summary.side_effect = Exception("Service error")
        
        with pytest.raises(DatabaseError) as exc_info:
            self.service.generate_daily_summary(self.user_id, self.target_date)
        
        assert "Failed to generate daily summary" in str(exc_info.value)
    
    @patch('src.services.reports_service.get_supabase_client')
    def test_initialization_failure(self, mock_get_client):
        """Test handling of initialization failure"""
        mock_get_client.return_value = None
        
        with pytest.raises(DatabaseError) as exc_info:
            ReportsService()
        
        assert "Failed to initialize Supabase client" in str(exc_info.value)