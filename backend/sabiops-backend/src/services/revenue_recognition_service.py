#!/usr/bin/env python3
"""
Revenue Recognition Service

This service handles revenue recognition logic that only counts paid sales
toward revenue, excludes credit/pending sales, and tracks accounts receivable.

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

logger = logging.getLogger(__name__)

class RevenueRecognitionService:
    """Service for proper revenue recognition and financial calculations"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        if not self.supabase:
            raise DatabaseError("Failed to initialize Supabase client")
    
    def calculate_recognized_revenue(self, user_id: str, start_date: Optional[date] = None, 
                                   end_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Calculate recognized revenue (only from paid sales)
        
        Args:
            user_id: User ID to filter by
            start_date: Start date for calculation (optional)
            end_date: End date for calculation (optional)
            
        Returns:
            Dict containing recognized revenue calculations
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            # Build query for paid sales only
            query = self.supabase.table('sales').select('*')
            query = query.eq('user_id', user_id)
            query = query.eq('payment_status', 'Paid')  # Only paid sales
            
            if start_date:
                query = query.gte('date', start_date.isoformat())
            if end_date:
                query = query.lte('date', end_date.isoformat())
            
            result = query.execute()
            
            # Calculate totals
            total_recognized_revenue = 0
            total_recognized_profit = 0
            total_transactions = len(result.data)
            
            for sale in result.data:
                total_amount = Decimal(str(sale.get('total_amount', 0)))
                gross_profit = Decimal(str(sale.get('gross_profit', 0)))
                
                total_recognized_revenue += total_amount
                total_recognized_profit += gross_profit
            
            # Calculate profit margin
            profit_margin = (float(total_recognized_profit) / float(total_recognized_revenue) * 100) if total_recognized_revenue > 0 else 0
            
            revenue_data = {
                'period': {
                    'start_date': start_date.isoformat() if start_date else None,
                    'end_date': end_date.isoformat() if end_date else None
                },
                'recognized_revenue': float(total_recognized_revenue),
                'recognized_profit': float(total_recognized_profit),
                'transaction_count': total_transactions,
                'profit_margin': round(profit_margin, 2),
                'average_sale_value': float(total_recognized_revenue / total_transactions) if total_transactions > 0 else 0
            }
            
            logger.info(f"Recognized revenue for user {user_id}: ${total_recognized_revenue} from {total_transactions} paid sales")
            
            return revenue_data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error calculating recognized revenue: {str(e)}")
            raise DatabaseError(f"Failed to calculate recognized revenue: {str(e)}")
    
    def calculate_accounts_receivable(self, user_id: str, as_of_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Calculate accounts receivable (outstanding credit sales)
        
        Args:
            user_id: User ID to filter by
            as_of_date: Date to calculate as of (defaults to today)
            
        Returns:
            Dict containing accounts receivable information
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            if as_of_date is None:
                as_of_date = date.today()
            
            # Get outstanding credit and pending sales
            query = self.supabase.table('sales').select('*')
            query = query.eq('user_id', user_id)
            query = query.in_('payment_status', ['Credit', 'Pending'])
            query = query.gt('amount_due', 0)
            query = query.lte('date', as_of_date.isoformat())
            
            result = query.execute()
            
            total_receivable = 0
            total_overdue = 0
            current_receivable = 0
            
            # Calculate aging buckets
            aging_buckets = {
                'current': 0,      # 0-30 days
                '30_days': 0,      # 31-60 days
                '60_days': 0,      # 61-90 days
                '90_plus_days': 0  # 90+ days
            }
            
            for sale in result.data:
                amount_due = Decimal(str(sale.get('amount_due', 0)))
                sale_date = datetime.fromisoformat(sale['date'].replace('Z', '+00:00')).date()
                days_outstanding = (as_of_date - sale_date).days
                
                total_receivable += amount_due
                
                # Determine aging bucket
                if days_outstanding <= 30:
                    aging_buckets['current'] += float(amount_due)
                    current_receivable += amount_due
                elif days_outstanding <= 60:
                    aging_buckets['30_days'] += float(amount_due)
                    total_overdue += amount_due
                elif days_outstanding <= 90:
                    aging_buckets['60_days'] += float(amount_due)
                    total_overdue += amount_due
                else:
                    aging_buckets['90_plus_days'] += float(amount_due)
                    total_overdue += amount_due
            
            receivable_data = {
                'as_of_date': as_of_date.isoformat(),
                'total_accounts_receivable': float(total_receivable),
                'current_receivable': float(current_receivable),
                'overdue_receivable': float(total_overdue),
                'aging_buckets': aging_buckets,
                'outstanding_sales_count': len(result.data),
                'overdue_percentage': round((float(total_overdue) / float(total_receivable) * 100) if total_receivable > 0 else 0, 2)
            }
            
            logger.info(f"Accounts receivable for user {user_id}: ${total_receivable} total, ${total_overdue} overdue")
            
            return receivable_data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error calculating accounts receivable: {str(e)}")
            raise DatabaseError(f"Failed to calculate accounts receivable: {str(e)}")
    
    def get_revenue_recognition_summary(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive revenue recognition summary
        
        Args:
            user_id: User ID to filter by
            period_days: Number of days to look back for comparison
            
        Returns:
            Dict containing comprehensive revenue recognition data
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            end_date = date.today()
            start_date = end_date - timedelta(days=period_days)
            
            # Get current period recognized revenue
            current_revenue = self.calculate_recognized_revenue(user_id, start_date, end_date)
            
            # Get previous period for comparison
            prev_end_date = start_date - timedelta(days=1)
            prev_start_date = prev_end_date - timedelta(days=period_days)
            previous_revenue = self.calculate_recognized_revenue(user_id, prev_start_date, prev_end_date)
            
            # Get accounts receivable
            receivable = self.calculate_accounts_receivable(user_id, end_date)
            
            # Calculate growth rates
            revenue_growth = 0
            profit_growth = 0
            
            if previous_revenue['recognized_revenue'] > 0:
                revenue_growth = ((current_revenue['recognized_revenue'] - previous_revenue['recognized_revenue']) / 
                                previous_revenue['recognized_revenue'] * 100)
            
            if previous_revenue['recognized_profit'] > 0:
                profit_growth = ((current_revenue['recognized_profit'] - previous_revenue['recognized_profit']) / 
                               previous_revenue['recognized_profit'] * 100)
            
            # Get total sales (including unpaid) for comparison
            total_sales_query = self.supabase.table('sales').select('total_amount, payment_status')
            total_sales_query = total_sales_query.eq('user_id', user_id)
            total_sales_query = total_sales_query.gte('date', start_date.isoformat())
            total_sales_query = total_sales_query.lte('date', end_date.isoformat())
            
            total_sales_result = total_sales_query.execute()
            
            total_sales_amount = sum(Decimal(str(sale.get('total_amount', 0))) for sale in total_sales_result.data)
            
            # Calculate revenue recognition rate
            recognition_rate = (current_revenue['recognized_revenue'] / float(total_sales_amount) * 100) if total_sales_amount > 0 else 100
            
            summary = {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': period_days
                },
                'current_period': current_revenue,
                'previous_period': previous_revenue,
                'growth_metrics': {
                    'revenue_growth_percentage': round(revenue_growth, 2),
                    'profit_growth_percentage': round(profit_growth, 2)
                },
                'accounts_receivable': receivable,
                'revenue_recognition': {
                    'total_sales_amount': float(total_sales_amount),
                    'recognized_revenue': current_revenue['recognized_revenue'],
                    'unrecognized_revenue': receivable['total_accounts_receivable'],
                    'recognition_rate_percentage': round(recognition_rate, 2)
                }
            }
            
            logger.info(f"Revenue recognition summary for user {user_id}: "
                       f"{recognition_rate:.1f}% recognition rate, "
                       f"{revenue_growth:.1f}% growth")
            
            return summary
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating revenue recognition summary: {str(e)}")
            raise DatabaseError(f"Failed to generate revenue recognition summary: {str(e)}")
    
    def track_revenue_recognition_changes(self, sale_id: str, old_status: str, new_status: str) -> Dict[str, Any]:
        """
        Track revenue recognition changes when payment status updates
        
        Args:
            sale_id: UUID of the sale
            old_status: Previous payment status
            new_status: New payment status
            
        Returns:
            Dict containing revenue recognition impact
            
        Raises:
            ValidationError: If parameters are invalid
            DatabaseError: If database query fails
        """
        try:
            if not sale_id:
                raise ValidationError("Sale ID is required")
            
            # Get sale details
            sale_result = self.supabase.table('sales').select('*').eq('id', sale_id).execute()
            
            if not sale_result.data:
                raise ValidationError(f"Sale with ID '{sale_id}' not found")
            
            sale = sale_result.data[0]
            total_amount = Decimal(str(sale.get('total_amount', 0)))
            gross_profit = Decimal(str(sale.get('gross_profit', 0)))
            
            # Determine revenue recognition impact
            revenue_impact = 0
            profit_impact = 0
            
            # Old status impact (remove if was recognized)
            if old_status == 'Paid':
                revenue_impact -= float(total_amount)
                profit_impact -= float(gross_profit)
            
            # New status impact (add if now recognized)
            if new_status == 'Paid':
                revenue_impact += float(total_amount)
                profit_impact += float(gross_profit)
            
            # Create revenue recognition change record
            change_record = {
                'sale_id': sale_id,
                'old_payment_status': old_status,
                'new_payment_status': new_status,
                'revenue_impact': revenue_impact,
                'profit_impact': profit_impact,
                'sale_amount': float(total_amount),
                'change_date': datetime.utcnow().isoformat(),
                'user_id': sale.get('user_id')
            }
            
            # Log the change
            impact_type = "recognized" if revenue_impact > 0 else "deferred" if revenue_impact < 0 else "no change"
            logger.info(f"Revenue recognition change for sale {sale_id}: "
                       f"{old_status} -> {new_status}, "
                       f"${abs(revenue_impact)} {impact_type}")
            
            return {
                'change_record': change_record,
                'impact_summary': {
                    'revenue_impact': revenue_impact,
                    'profit_impact': profit_impact,
                    'impact_type': impact_type
                }
            }
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error tracking revenue recognition changes: {str(e)}")
            raise DatabaseError(f"Failed to track revenue recognition changes: {str(e)}")
    
    def get_monthly_revenue_trend(self, user_id: str, months: int = 12) -> Dict[str, Any]:
        """
        Get monthly revenue trend with proper revenue recognition
        
        Args:
            user_id: User ID to filter by
            months: Number of months to include in trend
            
        Returns:
            Dict containing monthly revenue trend data
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            # Calculate date range
            end_date = date.today()
            start_date = end_date.replace(day=1) - timedelta(days=months * 31)  # Approximate
            
            # Get paid sales for the period
            query = self.supabase.table('sales').select('*')
            query = query.eq('user_id', user_id)
            query = query.eq('payment_status', 'Paid')
            query = query.gte('date', start_date.isoformat())
            query = query.lte('date', end_date.isoformat())
            
            result = query.execute()
            
            # Group by month
            monthly_data = {}
            
            for sale in result.data:
                sale_date = datetime.fromisoformat(sale['date'].replace('Z', '+00:00')).date()
                month_key = sale_date.strftime('%Y-%m')
                
                if month_key not in monthly_data:
                    monthly_data[month_key] = {
                        'month': month_key,
                        'recognized_revenue': 0,
                        'recognized_profit': 0,
                        'transaction_count': 0
                    }
                
                monthly_data[month_key]['recognized_revenue'] += float(sale.get('total_amount', 0))
                monthly_data[month_key]['recognized_profit'] += float(sale.get('gross_profit', 0))
                monthly_data[month_key]['transaction_count'] += 1
            
            # Sort by month and calculate growth rates
            sorted_months = sorted(monthly_data.values(), key=lambda x: x['month'])
            
            for i, month_data in enumerate(sorted_months):
                if i > 0:
                    prev_revenue = sorted_months[i-1]['recognized_revenue']
                    if prev_revenue > 0:
                        growth_rate = ((month_data['recognized_revenue'] - prev_revenue) / prev_revenue * 100)
                        month_data['revenue_growth_percentage'] = round(growth_rate, 2)
                    else:
                        month_data['revenue_growth_percentage'] = 0
                else:
                    month_data['revenue_growth_percentage'] = 0
                
                # Calculate profit margin
                if month_data['recognized_revenue'] > 0:
                    month_data['profit_margin'] = round(
                        (month_data['recognized_profit'] / month_data['recognized_revenue'] * 100), 2
                    )
                else:
                    month_data['profit_margin'] = 0
            
            trend_data = {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'months_included': len(sorted_months)
                },
                'monthly_trend': sorted_months,
                'summary': {
                    'total_recognized_revenue': sum(m['recognized_revenue'] for m in sorted_months),
                    'total_recognized_profit': sum(m['recognized_profit'] for m in sorted_months),
                    'average_monthly_revenue': sum(m['recognized_revenue'] for m in sorted_months) / len(sorted_months) if sorted_months else 0,
                    'best_month': max(sorted_months, key=lambda x: x['recognized_revenue']) if sorted_months else None,
                    'worst_month': min(sorted_months, key=lambda x: x['recognized_revenue']) if sorted_months else None
                }
            }
            
            logger.info(f"Monthly revenue trend for user {user_id}: {len(sorted_months)} months, "
                       f"${trend_data['summary']['total_recognized_revenue']} total")
            
            return trend_data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error calculating monthly revenue trend: {str(e)}")
            raise DatabaseError(f"Failed to calculate monthly revenue trend: {str(e)}")