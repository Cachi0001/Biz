#!/usr/bin/env python3
"""
Daily Summary and Reporting Service

This service generates comprehensive daily financial summaries including
cash at hand, POS transactions, and product category sales totals.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from uuid import UUID
from decimal import Decimal
from ..config import get_supabase_client
from ..utils.exceptions import ValidationError, DatabaseError
from .payment_service import PaymentService
from .sales_service import SalesService

logger = logging.getLogger(__name__)

class ReportsService:
    """Service for generating daily financial summaries and reports"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.payment_service = PaymentService()
        self.sales_service = SalesService()
        if not self.supabase:
            raise DatabaseError("Failed to initialize Supabase client")
    
    def generate_daily_summary(self, user_id: str, target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate comprehensive daily financial summary
        
        Args:
            user_id: User ID to generate summary for
            target_date: Date to generate summary for (defaults to today)
            
        Returns:
            Dict containing comprehensive daily summary
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            if target_date is None:
                target_date = date.today()
            
            # Validate date range
            if target_date > date.today():
                raise ValidationError("Cannot generate summary for future dates")
            
            # Get cash summary
            cash_summary = self.payment_service.get_daily_cash_summary(target_date, user_id)
            
            # Get POS summary
            pos_summary = self.payment_service.get_pos_summary(target_date, user_id)
            
            # Get payment method breakdown
            payment_breakdown = self.payment_service.get_payment_method_breakdown(target_date, user_id)
            
            # Get product category sales
            category_sales = self.sales_service.get_product_category_sales(user_id, target_date)
            
            # Get sales summary for the day
            sales_filters = {
                'start_date': f"{target_date}T00:00:00",
                'end_date': f"{target_date}T23:59:59"
            }
            sales_summary = self.sales_service.get_sales_summary(user_id, sales_filters)
            
            # Calculate overall financial metrics
            total_revenue = sales_summary['recognized_revenue']  # Only paid sales
            total_transactions = sales_summary['paid_transactions']
            outstanding_credit = sales_summary['outstanding_credit']
            
            # Calculate cash flow summary
            cash_flow = {
                'cash_at_hand': cash_summary['cash_at_hand'],
                'pos_net_flow': pos_summary['net_flow'],
                'total_cash_flow': cash_summary['cash_at_hand'] + pos_summary['net_flow'],
                'cash_transactions': cash_summary['transaction_count'],
                'pos_transactions': pos_summary['total_transactions']
            }
            
            # Generate summary
            daily_summary = {
                'summary_date': target_date.isoformat(),
                'generated_at': datetime.utcnow().isoformat(),
                'user_id': user_id,
                
                # Revenue and sales metrics
                'revenue_metrics': {
                    'total_revenue': total_revenue,
                    'total_transactions': total_transactions,
                    'average_transaction_value': total_revenue / total_transactions if total_transactions > 0 else 0,
                    'outstanding_credit': outstanding_credit,
                    'gross_profit': sales_summary['recognized_gross_profit'],
                    'profit_margin': sales_summary.get('profit_margin', 0)
                },
                
                # Cash flow summary
                'cash_flow': cash_flow,
                
                # Detailed breakdowns
                'cash_summary': cash_summary,
                'pos_summary': pos_summary,
                'payment_method_breakdown': payment_breakdown,
                'product_category_sales': category_sales,
                
                # Performance indicators
                'performance_indicators': {
                    'revenue_recognition_rate': sales_summary.get('revenue_recognition_rate', 100),
                    'cash_to_revenue_ratio': (cash_flow['total_cash_flow'] / total_revenue * 100) if total_revenue > 0 else 0,
                    'credit_sales_ratio': (outstanding_credit / (total_revenue + outstanding_credit) * 100) if (total_revenue + outstanding_credit) > 0 else 0
                }
            }
            
            logger.info(f"Generated daily summary for {target_date}: "
                       f"${total_revenue} revenue, {total_transactions} transactions, "
                       f"${cash_flow['total_cash_flow']} cash flow")
            
            return daily_summary
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating daily summary: {str(e)}")
            raise DatabaseError(f"Failed to generate daily summary: {str(e)}")
    
    def generate_weekly_summary(self, user_id: str, week_ending_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate weekly financial summary
        
        Args:
            user_id: User ID to generate summary for
            week_ending_date: End date of the week (defaults to today)
            
        Returns:
            Dict containing weekly summary
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            if week_ending_date is None:
                week_ending_date = date.today()
            
            # Calculate week start date (7 days back)
            week_start_date = week_ending_date - timedelta(days=6)
            
            # Generate daily summaries for each day of the week
            daily_summaries = []
            weekly_totals = {
                'total_revenue': 0,
                'total_transactions': 0,
                'total_cash_flow': 0,
                'total_outstanding_credit': 0,
                'total_gross_profit': 0
            }
            
            current_date = week_start_date
            while current_date <= week_ending_date:
                try:
                    daily_summary = self.generate_daily_summary(user_id, current_date)
                    daily_summaries.append(daily_summary)
                    
                    # Accumulate weekly totals
                    weekly_totals['total_revenue'] += daily_summary['revenue_metrics']['total_revenue']
                    weekly_totals['total_transactions'] += daily_summary['revenue_metrics']['total_transactions']
                    weekly_totals['total_cash_flow'] += daily_summary['cash_flow']['total_cash_flow']
                    weekly_totals['total_outstanding_credit'] += daily_summary['revenue_metrics']['outstanding_credit']
                    weekly_totals['total_gross_profit'] += daily_summary['revenue_metrics']['gross_profit']
                    
                except Exception as e:
                    logger.warning(f"Failed to generate daily summary for {current_date}: {e}")
                    # Continue with other days
                
                current_date += timedelta(days=1)
            
            # Calculate weekly averages and metrics
            days_with_data = len(daily_summaries)
            weekly_summary = {
                'week_period': {
                    'start_date': week_start_date.isoformat(),
                    'end_date': week_ending_date.isoformat(),
                    'days_included': days_with_data
                },
                'generated_at': datetime.utcnow().isoformat(),
                'user_id': user_id,
                
                'weekly_totals': weekly_totals,
                'weekly_averages': {
                    'average_daily_revenue': weekly_totals['total_revenue'] / days_with_data if days_with_data > 0 else 0,
                    'average_daily_transactions': weekly_totals['total_transactions'] / days_with_data if days_with_data > 0 else 0,
                    'average_daily_cash_flow': weekly_totals['total_cash_flow'] / days_with_data if days_with_data > 0 else 0,
                    'average_transaction_value': weekly_totals['total_revenue'] / weekly_totals['total_transactions'] if weekly_totals['total_transactions'] > 0 else 0
                },
                'weekly_metrics': {
                    'profit_margin': (weekly_totals['total_gross_profit'] / weekly_totals['total_revenue'] * 100) if weekly_totals['total_revenue'] > 0 else 0,
                    'cash_flow_consistency': self._calculate_cash_flow_consistency(daily_summaries),
                    'best_day': max(daily_summaries, key=lambda x: x['revenue_metrics']['total_revenue']) if daily_summaries else None,
                    'worst_day': min(daily_summaries, key=lambda x: x['revenue_metrics']['total_revenue']) if daily_summaries else None
                },
                'daily_summaries': daily_summaries
            }
            
            logger.info(f"Generated weekly summary for {week_start_date} to {week_ending_date}: "
                       f"${weekly_totals['total_revenue']} revenue, {days_with_data} days")
            
            return weekly_summary
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating weekly summary: {str(e)}")
            raise DatabaseError(f"Failed to generate weekly summary: {str(e)}")
    
    def generate_monthly_summary(self, user_id: str, year: int, month: int) -> Dict[str, Any]:
        """
        Generate monthly financial summary
        
        Args:
            user_id: User ID to generate summary for
            year: Year for the summary
            month: Month for the summary (1-12)
            
        Returns:
            Dict containing monthly summary
            
        Raises:
            ValidationError: If parameters are invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            if not (1 <= month <= 12):
                raise ValidationError("Month must be between 1 and 12")
            
            if year < 2020 or year > date.today().year:
                raise ValidationError(f"Year must be between 2020 and {date.today().year}")
            
            # Calculate month date range
            month_start = date(year, month, 1)
            if month == 12:
                month_end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(year, month + 1, 1) - timedelta(days=1)
            
            # Don't generate for future months
            if month_start > date.today():
                raise ValidationError("Cannot generate summary for future months")
            
            # Limit end date to today if month includes future dates
            if month_end > date.today():
                month_end = date.today()
            
            # Get monthly sales data
            sales_filters = {
                'start_date': f"{month_start}T00:00:00",
                'end_date': f"{month_end}T23:59:59"
            }
            monthly_sales = self.sales_service.get_sales_summary(user_id, sales_filters)
            
            # Get daily summaries for key days (first, middle, last of month)
            key_dates = [month_start]
            if (month_end - month_start).days > 7:
                mid_month = month_start + timedelta(days=(month_end - month_start).days // 2)
                key_dates.append(mid_month)
            if month_end != month_start:
                key_dates.append(month_end)
            
            daily_snapshots = []
            for key_date in key_dates:
                try:
                    daily_summary = self.generate_daily_summary(user_id, key_date)
                    daily_snapshots.append(daily_summary)
                except Exception as e:
                    logger.warning(f"Failed to generate daily snapshot for {key_date}: {e}")
            
            # Calculate monthly metrics
            days_in_period = (month_end - month_start).days + 1
            
            monthly_summary = {
                'month_period': {
                    'year': year,
                    'month': month,
                    'start_date': month_start.isoformat(),
                    'end_date': month_end.isoformat(),
                    'days_in_period': days_in_period
                },
                'generated_at': datetime.utcnow().isoformat(),
                'user_id': user_id,
                
                'monthly_totals': {
                    'total_revenue': monthly_sales['recognized_revenue'],
                    'total_transactions': monthly_sales['paid_transactions'],
                    'total_gross_profit': monthly_sales['recognized_gross_profit'],
                    'outstanding_credit': monthly_sales['outstanding_credit']
                },
                'monthly_averages': {
                    'average_daily_revenue': monthly_sales['recognized_revenue'] / days_in_period,
                    'average_daily_transactions': monthly_sales['paid_transactions'] / days_in_period,
                    'average_transaction_value': monthly_sales['recognized_revenue'] / monthly_sales['paid_transactions'] if monthly_sales['paid_transactions'] > 0 else 0
                },
                'monthly_metrics': {
                    'profit_margin': monthly_sales.get('profit_margin', 0),
                    'revenue_recognition_rate': monthly_sales.get('revenue_recognition_rate', 100),
                    'payment_method_breakdown': monthly_sales['payment_method_breakdown'],
                    'product_category_breakdown': monthly_sales['product_category_breakdown']
                },
                'daily_snapshots': daily_snapshots
            }
            
            logger.info(f"Generated monthly summary for {year}-{month:02d}: "
                       f"${monthly_sales['recognized_revenue']} revenue, "
                       f"{monthly_sales['paid_transactions']} transactions")
            
            return monthly_summary
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating monthly summary: {str(e)}")
            raise DatabaseError(f"Failed to generate monthly summary: {str(e)}")
    
    def get_financial_dashboard_data(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive financial dashboard data
        
        Args:
            user_id: User ID to get dashboard data for
            
        Returns:
            Dict containing dashboard data
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            today = date.today()
            
            # Get today's summary
            today_summary = self.generate_daily_summary(user_id, today)
            
            # Get yesterday's summary for comparison
            yesterday = today - timedelta(days=1)
            try:
                yesterday_summary = self.generate_daily_summary(user_id, yesterday)
            except Exception:
                yesterday_summary = None
            
            # Get this week's summary
            week_summary = self.generate_weekly_summary(user_id, today)
            
            # Get this month's summary
            month_summary = self.generate_monthly_summary(user_id, today.year, today.month)
            
            # Calculate growth rates
            growth_metrics = {}
            if yesterday_summary:
                today_revenue = today_summary['revenue_metrics']['total_revenue']
                yesterday_revenue = yesterday_summary['revenue_metrics']['total_revenue']
                
                if yesterday_revenue > 0:
                    growth_metrics['daily_revenue_growth'] = round(
                        ((today_revenue - yesterday_revenue) / yesterday_revenue * 100), 2
                    )
                else:
                    growth_metrics['daily_revenue_growth'] = 0
            
            # Get outstanding credit summary
            from .credit_sales_service import CreditSalesService
            credit_service = CreditSalesService()
            outstanding_summary = credit_service.get_outstanding_credit_sales(user_id, limit=10)
            
            dashboard_data = {
                'dashboard_date': today.isoformat(),
                'generated_at': datetime.utcnow().isoformat(),
                'user_id': user_id,
                
                'today_summary': today_summary,
                'yesterday_summary': yesterday_summary,
                'week_summary': week_summary,
                'month_summary': month_summary,
                
                'growth_metrics': growth_metrics,
                'outstanding_credit_summary': {
                    'total_outstanding': outstanding_summary['total_outstanding_amount'],
                    'outstanding_count': outstanding_summary['total_count'],
                    'recent_outstanding_sales': outstanding_summary['outstanding_sales'][:5]  # Top 5
                },
                
                'key_performance_indicators': {
                    'daily_revenue': today_summary['revenue_metrics']['total_revenue'],
                    'weekly_revenue': week_summary['weekly_totals']['total_revenue'],
                    'monthly_revenue': month_summary['monthly_totals']['total_revenue'],
                    'cash_at_hand': today_summary['cash_flow']['cash_at_hand'],
                    'pos_balance': today_summary['cash_flow']['pos_net_flow'],
                    'profit_margin': today_summary['revenue_metrics']['profit_margin'],
                    'outstanding_credit': outstanding_summary['total_outstanding_amount']
                }
            }
            
            logger.info(f"Generated financial dashboard for user {user_id}: "
                       f"${today_summary['revenue_metrics']['total_revenue']} today, "
                       f"${outstanding_summary['total_outstanding_amount']} outstanding")
            
            return dashboard_data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating financial dashboard: {str(e)}")
            raise DatabaseError(f"Failed to generate financial dashboard: {str(e)}")
    
    def _calculate_cash_flow_consistency(self, daily_summaries: List[Dict[str, Any]]) -> float:
        """
        Calculate cash flow consistency score (0-100)
        
        Args:
            daily_summaries: List of daily summary data
            
        Returns:
            Consistency score as percentage
        """
        if len(daily_summaries) < 2:
            return 100.0
        
        cash_flows = [summary['cash_flow']['total_cash_flow'] for summary in daily_summaries]
        
        # Calculate coefficient of variation
        mean_flow = sum(cash_flows) / len(cash_flows)
        if mean_flow == 0:
            return 100.0
        
        variance = sum((flow - mean_flow) ** 2 for flow in cash_flows) / len(cash_flows)
        std_dev = variance ** 0.5
        
        coefficient_of_variation = std_dev / abs(mean_flow)
        
        # Convert to consistency score (lower variation = higher consistency)
        consistency_score = max(0, 100 - (coefficient_of_variation * 100))
        
        return round(consistency_score, 2)