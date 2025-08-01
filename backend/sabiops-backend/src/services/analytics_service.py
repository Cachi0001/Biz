"""
Analytics Service
Provides comprehensive business analytics functionality with real data aggregation
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, List, Any
import logging
from flask import current_app
import pytz
from src.services.analytics_cache_service import analytics_cache

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for generating business analytics from real data"""
    
    def __init__(self):
        self.supabase = current_app.config.get('SUPABASE')
        
    def get_business_analytics(self, user_id: str, time_period: str = 'monthly') -> Dict[str, Any]:
        """Get comprehensive business analytics for the specified time period"""
        try:
            # Get user context
            from src.utils.user_context import get_user_context
            owner_id, user_role = get_user_context(user_id)
            
            # Check cache first
            cache_key = analytics_cache.get_cache_key(owner_id, 'business_analytics', time_period)
            cached_data = analytics_cache.get_cached_data(cache_key)
            
            if cached_data:
                logger.info(f"Returning cached business analytics for user {user_id}")
                return cached_data
            
            # Get analytics for all categories
            revenue_analytics = self.get_revenue_analytics(owner_id, time_period)
            customer_analytics = self.get_customer_analytics(owner_id, time_period)
            product_analytics = self.get_product_analytics(owner_id, time_period)
            financial_analytics = self.get_financial_analytics(owner_id, time_period)
            
            result = {
                'success': True,
                'data': {
                    'revenue': revenue_analytics,
                    'customers': customer_analytics,
                    'products': product_analytics,
                    'financial': financial_analytics,
                    'time_period': time_period,
                    'generated_at': datetime.now(timezone.utc).isoformat()
                }
            }
            
            # Cache the result
            analytics_cache.set_cached_data(cache_key, result, time_period)
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating business analytics for user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate business analytics'
            }
    
    def get_revenue_analytics(self, owner_id: str, period: str = 'monthly') -> Dict[str, Any]:
        """Get revenue analytics with trends and comparisons"""
        try:
            # Get time range based on period
            start_date, end_date, previous_start, previous_end = self._get_time_range(period)
            
            # Get sales data for current period
            current_sales = self.supabase.table('sales').select(
                'total_amount, profit_from_sales, total_cogs, date, created_at'
            ).eq('owner_id', owner_id).gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).execute()
            
            # Get sales data for previous period (for comparison)
            previous_sales = self.supabase.table('sales').select(
                'total_amount, profit_from_sales, total_cogs, date'
            ).eq('owner_id', owner_id).gte('date', previous_start.isoformat()).lte('date', previous_end.isoformat()).execute()
            
            # Calculate current period metrics
            current_revenue = sum(float(sale.get('total_amount', 0)) for sale in current_sales.data)
            current_profit = sum(float(sale.get('profit_from_sales', 0)) for sale in current_sales.data)
            current_cogs = sum(float(sale.get('total_cogs', 0)) for sale in current_sales.data)
            
            # Calculate previous period metrics
            previous_revenue = sum(float(sale.get('total_amount', 0)) for sale in previous_sales.data)
            previous_profit = sum(float(sale.get('profit_from_sales', 0)) for sale in previous_sales.data)
            
            # Calculate growth rates
            revenue_growth = self._calculate_growth_rate(current_revenue, previous_revenue)
            profit_growth = self._calculate_growth_rate(current_profit, previous_profit)
            
            # Generate time series data for charts
            revenue_trends = self._generate_revenue_time_series(current_sales.data, period)
            
            return {
                'total_revenue': current_revenue,
                'total_profit': current_profit,
                'total_cogs': current_cogs,
                'revenue_growth': revenue_growth,
                'profit_growth': profit_growth,
                'profit_margin': (current_profit / current_revenue * 100) if current_revenue > 0 else 0,
                'trends': revenue_trends,
                'period_comparison': {
                    'current_period': {
                        'revenue': current_revenue,
                        'profit': current_profit,
                        'start_date': start_date.isoformat(),
                        'end_date': end_date.isoformat()
                    },
                    'previous_period': {
                        'revenue': previous_revenue,
                        'profit': previous_profit,
                        'start_date': previous_start.isoformat(),
                        'end_date': previous_end.isoformat()
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating revenue analytics: {str(e)}")
            return {
                'total_revenue': 0,
                'total_profit': 0,
                'revenue_growth': 0,
                'profit_growth': 0,
                'trends': [],
                'error': str(e)
            }
    
    def get_customer_analytics(self, owner_id: str, period: str = 'monthly') -> Dict[str, Any]:
        """Get customer analytics with acquisition trends and top customers"""
        try:
            start_date, end_date, previous_start, previous_end = self._get_time_range(period)
            
            # Get all customers
            customers_result = self.supabase.table('customers').select('*').eq('owner_id', owner_id).execute()
            
            # Get sales data to calculate customer metrics
            sales_result = self.supabase.table('sales').select(
                'customer_name, customer_id, total_amount, date'
            ).eq('owner_id', owner_id).execute()
            
            # Calculate customer metrics
            total_customers = len(customers_result.data)
            
            # New customers in current period
            new_customers_current = len([
                c for c in customers_result.data 
                if self._parse_date(c.get('created_at')) and 
                start_date <= self._parse_date(c.get('created_at')) <= end_date
            ])
            
            # New customers in previous period
            new_customers_previous = len([
                c for c in customers_result.data 
                if self._parse_date(c.get('created_at')) and 
                previous_start <= self._parse_date(c.get('created_at')) <= previous_end
            ])
            
            # Calculate top customers by revenue
            customer_revenue = {}
            for sale in sales_result.data:
                customer_name = sale.get('customer_name', 'Unknown')
                revenue = float(sale.get('total_amount', 0))
                if customer_name in customer_revenue:
                    customer_revenue[customer_name]['revenue'] += revenue
                    customer_revenue[customer_name]['orders'] += 1
                else:
                    customer_revenue[customer_name] = {'revenue': revenue, 'orders': 1}
            
            # Sort and get top 10 customers
            top_customers = sorted(
                [{'name': name, **data} for name, data in customer_revenue.items()],
                key=lambda x: x['revenue'],
                reverse=True
            )[:10]
            
            # Calculate average order value
            total_orders = len(sales_result.data)
            total_revenue = sum(float(sale.get('total_amount', 0)) for sale in sales_result.data)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Generate customer acquisition trends
            acquisition_trends = self._generate_customer_acquisition_trends(customers_result.data, period)
            
            return {
                'total_customers': total_customers,
                'new_customers_current': new_customers_current,
                'new_customers_previous': new_customers_previous,
                'customer_growth': self._calculate_growth_rate(new_customers_current, new_customers_previous),
                'top_customers': top_customers,
                'avg_order_value': avg_order_value,
                'total_orders': total_orders,
                'acquisition_trends': acquisition_trends
            }
            
        except Exception as e:
            logger.error(f"Error generating customer analytics: {str(e)}")
            return {
                'total_customers': 0,
                'new_customers_current': 0,
                'customer_growth': 0,
                'top_customers': [],
                'avg_order_value': 0,
                'error': str(e)
            }
    
    def get_product_analytics(self, owner_id: str, period: str = 'monthly') -> Dict[str, Any]:
        """Get product performance analytics with inventory insights"""
        try:
            start_date, end_date, _, _ = self._get_time_range(period)
            
            # Get products data
            products_result = self.supabase.table('products').select('*').eq('owner_id', owner_id).execute()
            
            # Get sales data for product performance
            sales_result = self.supabase.table('sales').select(
                'product_name, product_id, quantity, total_amount, profit_from_sales, date'
            ).eq('owner_id', owner_id).gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).execute()
            
            # Calculate product performance
            product_performance = {}
            for sale in sales_result.data:
                product_name = sale.get('product_name', 'Unknown')
                quantity = int(sale.get('quantity', 0))
                revenue = float(sale.get('total_amount', 0))
                profit = float(sale.get('profit_from_sales', 0))
                
                if product_name in product_performance:
                    product_performance[product_name]['quantity_sold'] += quantity
                    product_performance[product_name]['revenue'] += revenue
                    product_performance[product_name]['profit'] += profit
                else:
                    product_performance[product_name] = {
                        'quantity_sold': quantity,
                        'revenue': revenue,
                        'profit': profit
                    }
            
            # Sort products by revenue and quantity
            top_products_by_revenue = sorted(
                [{'name': name, **data} for name, data in product_performance.items()],
                key=lambda x: x['revenue'],
                reverse=True
            )[:10]
            
            top_products_by_quantity = sorted(
                [{'name': name, **data} for name, data in product_performance.items()],
                key=lambda x: x['quantity_sold'],
                reverse=True
            )[:10]
            
            # Calculate inventory metrics
            total_products = len(products_result.data)
            low_stock_products = []
            
            for product in products_result.data:
                stock = int(product.get('quantity', 0))
                threshold = int(product.get('low_stock_threshold', 10))
                if stock <= threshold:
                    low_stock_products.append({
                        'name': product.get('name'),
                        'current_stock': stock,
                        'threshold': threshold,
                        'shortage': max(0, threshold - stock)
                    })
            
            # Calculate inventory turnover (simplified)
            total_quantity_sold = sum(int(sale.get('quantity', 0)) for sale in sales_result.data)
            avg_inventory = sum(int(product.get('quantity', 0)) for product in products_result.data) / total_products if total_products > 0 else 0
            inventory_turnover = total_quantity_sold / avg_inventory if avg_inventory > 0 else 0
            
            return {
                'total_products': total_products,
                'top_products_by_revenue': top_products_by_revenue,
                'top_products_by_quantity': top_products_by_quantity,
                'low_stock_count': len(low_stock_products),
                'low_stock_products': low_stock_products,
                'inventory_turnover': inventory_turnover,
                'total_quantity_sold': total_quantity_sold
            }
            
        except Exception as e:
            logger.error(f"Error generating product analytics: {str(e)}")
            return {
                'total_products': 0,
                'top_products_by_revenue': [],
                'top_products_by_quantity': [],
                'low_stock_count': 0,
                'inventory_turnover': 0,
                'error': str(e)
            }
    
    def get_financial_analytics(self, owner_id: str, period: str = 'monthly') -> Dict[str, Any]:
        """Get financial analytics with cash flow and profitability metrics"""
        try:
            start_date, end_date, previous_start, previous_end = self._get_time_range(period)
            
            # Get sales data (money in)
            sales_result = self.supabase.table('sales').select(
                'total_amount, profit_from_sales, total_cogs, date'
            ).eq('owner_id', owner_id).gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).execute()
            
            # Get expenses data (money out)
            expenses_result = self.supabase.table('expenses').select(
                'amount, category, date'
            ).eq('owner_id', owner_id).gte('date', start_date.isoformat()).lte('date', end_date.isoformat()).execute()
            
            # Calculate financial metrics
            total_revenue = sum(float(sale.get('total_amount', 0)) for sale in sales_result.data)
            total_profit = sum(float(sale.get('profit_from_sales', 0)) for sale in sales_result.data)
            total_cogs = sum(float(sale.get('total_cogs', 0)) for sale in sales_result.data)
            total_expenses = sum(float(expense.get('amount', 0)) for expense in expenses_result.data)
            
            # Calculate profitability metrics
            gross_profit = total_revenue - total_cogs
            net_profit = gross_profit - total_expenses
            gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
            net_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
            
            # Generate cash flow time series
            cash_flow_trends = self._generate_cash_flow_trends(sales_result.data, expenses_result.data, period)
            
            # Calculate expense breakdown by category
            expense_categories = {}
            for expense in expenses_result.data:
                category = expense.get('category', 'Other')
                amount = float(expense.get('amount', 0))
                if category in expense_categories:
                    expense_categories[category] += amount
                else:
                    expense_categories[category] = amount
            
            expense_breakdown = [
                {'category': category, 'amount': amount, 'percentage': (amount / total_expenses * 100) if total_expenses > 0 else 0}
                for category, amount in expense_categories.items()
            ]
            
            return {
                'total_revenue': total_revenue,
                'total_expenses': total_expenses,
                'gross_profit': gross_profit,
                'net_profit': net_profit,
                'gross_margin': gross_margin,
                'net_margin': net_margin,
                'cash_flow_trends': cash_flow_trends,
                'expense_breakdown': expense_breakdown,
                'roi_metrics': {
                    'return_on_investment': (net_profit / total_expenses * 100) if total_expenses > 0 else 0,
                    'profit_per_sale': total_profit / len(sales_result.data) if len(sales_result.data) > 0 else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating financial analytics: {str(e)}")
            return {
                'total_revenue': 0,
                'total_expenses': 0,
                'gross_profit': 0,
                'net_profit': 0,
                'cash_flow_trends': [],
                'expense_breakdown': [],
                'error': str(e)
            }
    
    def _get_time_range(self, period: str) -> tuple:
        """Get start and end dates for the specified period"""
        now = datetime.now(timezone.utc)
        
        if period == 'daily':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            previous_start = start_date - timedelta(days=1)
            previous_end = previous_start.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif period == 'weekly':
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
            previous_start = start_date - timedelta(days=7)
            previous_end = previous_start + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
        elif period == 'yearly':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
            previous_start = start_date.replace(year=start_date.year - 1)
            previous_end = previous_start.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
        else:  # monthly (default)
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end_date = now.replace(year=now.year + 1, month=1, day=1) - timedelta(microseconds=1)
            else:
                end_date = now.replace(month=now.month + 1, day=1) - timedelta(microseconds=1)
            
            if start_date.month == 1:
                previous_start = start_date.replace(year=start_date.year - 1, month=12, day=1)
            else:
                previous_start = start_date.replace(month=start_date.month - 1, day=1)
            
            previous_end = start_date - timedelta(microseconds=1)
        
        return start_date, end_date, previous_start, previous_end
    
    def _calculate_growth_rate(self, current: float, previous: float) -> float:
        """Calculate growth rate percentage"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        if not date_str:
            return None
        try:
            if date_str.endswith('Z'):
                date_str = date_str.replace('Z', '+00:00')
            dt = datetime.fromisoformat(date_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, TypeError):
            return None
    
    def _generate_revenue_time_series(self, sales_data: List[Dict], period: str) -> List[Dict]:
        """Generate time series data for revenue trends"""
        try:
            # Group sales by time period
            time_groups = {}
            
            for sale in sales_data:
                sale_date = self._parse_date(sale.get('date'))
                if not sale_date:
                    continue
                
                # Create time key based on period
                if period == 'daily':
                    time_key = sale_date.strftime('%Y-%m-%d')
                elif period == 'weekly':
                    # Get week start date
                    week_start = sale_date - timedelta(days=sale_date.weekday())
                    time_key = week_start.strftime('%Y-W%U')
                elif period == 'yearly':
                    time_key = sale_date.strftime('%Y')
                else:  # monthly
                    time_key = sale_date.strftime('%Y-%m')
                
                if time_key not in time_groups:
                    time_groups[time_key] = {'revenue': 0, 'profit': 0, 'orders': 0}
                
                time_groups[time_key]['revenue'] += float(sale.get('total_amount', 0))
                time_groups[time_key]['profit'] += float(sale.get('profit_from_sales', 0))
                time_groups[time_key]['orders'] += 1
            
            # Convert to list and sort
            trends = [
                {
                    'period': period_key,
                    'revenue': data['revenue'],
                    'profit': data['profit'],
                    'orders': data['orders']
                }
                for period_key, data in time_groups.items()
            ]
            
            return sorted(trends, key=lambda x: x['period'])
            
        except Exception as e:
            logger.error(f"Error generating revenue time series: {str(e)}")
            return []
    
    def _generate_customer_acquisition_trends(self, customers_data: List[Dict], period: str) -> List[Dict]:
        """Generate customer acquisition trends"""
        try:
            time_groups = {}
            
            for customer in customers_data:
                created_date = self._parse_date(customer.get('created_at'))
                if not created_date:
                    continue
                
                # Create time key based on period
                if period == 'daily':
                    time_key = created_date.strftime('%Y-%m-%d')
                elif period == 'weekly':
                    week_start = created_date - timedelta(days=created_date.weekday())
                    time_key = week_start.strftime('%Y-W%U')
                elif period == 'yearly':
                    time_key = created_date.strftime('%Y')
                else:  # monthly
                    time_key = created_date.strftime('%Y-%m')
                
                if time_key not in time_groups:
                    time_groups[time_key] = 0
                
                time_groups[time_key] += 1
            
            trends = [
                {'period': period_key, 'new_customers': count}
                for period_key, count in time_groups.items()
            ]
            
            return sorted(trends, key=lambda x: x['period'])
            
        except Exception as e:
            logger.error(f"Error generating customer acquisition trends: {str(e)}")
            return []
    
    def _generate_cash_flow_trends(self, sales_data: List[Dict], expenses_data: List[Dict], period: str) -> List[Dict]:
        """Generate cash flow trends showing money in vs money out"""
        try:
            time_groups = {}
            
            # Process sales (money in)
            for sale in sales_data:
                sale_date = self._parse_date(sale.get('date'))
                if not sale_date:
                    continue
                
                if period == 'daily':
                    time_key = sale_date.strftime('%Y-%m-%d')
                elif period == 'weekly':
                    week_start = sale_date - timedelta(days=sale_date.weekday())
                    time_key = week_start.strftime('%Y-W%U')
                elif period == 'yearly':
                    time_key = sale_date.strftime('%Y')
                else:  # monthly
                    time_key = sale_date.strftime('%Y-%m')
                
                if time_key not in time_groups:
                    time_groups[time_key] = {'money_in': 0, 'money_out': 0}
                
                time_groups[time_key]['money_in'] += float(sale.get('total_amount', 0))
            
            # Process expenses (money out)
            for expense in expenses_data:
                expense_date = self._parse_date(expense.get('date'))
                if not expense_date:
                    continue
                
                if period == 'daily':
                    time_key = expense_date.strftime('%Y-%m-%d')
                elif period == 'weekly':
                    week_start = expense_date - timedelta(days=expense_date.weekday())
                    time_key = week_start.strftime('%Y-W%U')
                elif period == 'yearly':
                    time_key = expense_date.strftime('%Y')
                else:  # monthly
                    time_key = expense_date.strftime('%Y-%m')
                
                if time_key not in time_groups:
                    time_groups[time_key] = {'money_in': 0, 'money_out': 0}
                
                time_groups[time_key]['money_out'] += float(expense.get('amount', 0))
            
            # Convert to list with net cash flow
            trends = [
                {
                    'period': period_key,
                    'money_in': data['money_in'],
                    'money_out': data['money_out'],
                    'net_cash_flow': data['money_in'] - data['money_out']
                }
                for period_key, data in time_groups.items()
            ]
            
            return sorted(trends, key=lambda x: x['period'])
            
        except Exception as e:
            logger.error(f"Error generating cash flow trends: {str(e)}")
            return []