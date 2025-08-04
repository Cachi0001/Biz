#!/usr/bin/env python3
"""
HTML Report Generation Service

This service generates professional HTML reports for daily summaries,
financial reports, and other business documents with responsive design.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from decimal import Decimal
from ..config import get_supabase_client
from ..utils.exceptions import ValidationError, DatabaseError
from .reports_service import ReportsService

logger = logging.getLogger(__name__)

class HTMLReportService:
    """Service for generating HTML reports and documents"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.reports_service = ReportsService()
        if not self.supabase:
            raise DatabaseError("Failed to initialize Supabase client")
    
    def generate_daily_summary_html(self, user_id: str, target_date: Optional[date] = None) -> str:
        """
        Generate HTML report for daily summary
        
        Args:
            user_id: User ID to generate report for
            target_date: Date to generate report for (defaults to today)
            
        Returns:
            HTML string for the daily summary report
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If report generation fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            # Get daily summary data
            summary_data = self.reports_service.generate_daily_summary(user_id, target_date)
            
            # Generate HTML
            html_content = self._create_daily_summary_template(summary_data)
            
            logger.info(f"Generated daily summary HTML for user {user_id}, date {target_date}")
            return html_content
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating daily summary HTML: {str(e)}")
            raise DatabaseError(f"Failed to generate daily summary HTML: {str(e)}")
    
    def generate_weekly_summary_html(self, user_id: str, week_ending_date: Optional[date] = None) -> str:
        """
        Generate HTML report for weekly summary
        
        Args:
            user_id: User ID to generate report for
            week_ending_date: End date of the week (defaults to today)
            
        Returns:
            HTML string for the weekly summary report
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            # Get weekly summary data
            summary_data = self.reports_service.generate_weekly_summary(user_id, week_ending_date)
            
            # Generate HTML
            html_content = self._create_weekly_summary_template(summary_data)
            
            logger.info(f"Generated weekly summary HTML for user {user_id}")
            return html_content
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating weekly summary HTML: {str(e)}")
            raise DatabaseError(f"Failed to generate weekly summary HTML: {str(e)}")
    
    def _create_daily_summary_template(self, summary_data: Dict[str, Any]) -> str:
        """Create HTML template for daily summary"""
        
        # Extract data
        summary_date = summary_data.get('summary_date', 'Unknown Date')
        revenue_metrics = summary_data.get('revenue_metrics', {})
        cash_flow = summary_data.get('cash_flow', {})
        payment_breakdown = summary_data.get('payment_method_breakdown', {})
        category_sales = summary_data.get('product_category_sales', {})
        pos_summary = summary_data.get('pos_summary', {})
        
        # Format currency
        def format_currency(amount):
            return f"₦{amount:,.2f}" if amount else "₦0.00"
        
        def format_percentage(value):
            return f"{value:.1f}%" if value else "0.0%"
        
        # Generate payment methods table
        payment_methods_rows = ""
        if payment_breakdown.get('payment_methods'):
            for method in payment_breakdown['payment_methods']:
                payment_methods_rows += f"""
                <tr>
                    <td>{method.get('payment_method_name', 'Unknown')}</td>
                    <td class="text-right">{format_currency(method.get('total_amount', 0))}</td>
                    <td class="text-right">{method.get('transaction_count', 0)}</td>
                    <td class="text-right">{format_percentage(method.get('percentage', 0))}</td>
                </tr>
                """
        
        # Generate category sales table
        category_rows = ""
        if category_sales.get('category_breakdown'):
            for category in category_sales['category_breakdown']:
                category_rows += f"""
                <tr>
                    <td>{category.get('category_name', 'Unknown')}</td>
                    <td class="text-right">{format_currency(category.get('total_amount', 0))}</td>
                    <td class="text-right">{category.get('transaction_count', 0)}</td>
                    <td class="text-right">{format_percentage(category.get('percentage', 0))}</td>
                </tr>
                """
        
        # Generate POS accounts table
        pos_accounts_rows = ""
        if pos_summary.get('pos_accounts'):
            for account in pos_summary['pos_accounts']:
                pos_accounts_rows += f"""
                <tr>
                    <td>{account.get('account_name', 'Unknown')}</td>
                    <td class="text-right">{format_currency(account.get('deposits', 0))}</td>
                    <td class="text-right">{format_currency(account.get('withdrawals', 0))}</td>
                    <td class="text-right">{format_currency(account.get('net_flow', 0))}</td>
                    <td class="text-right">{account.get('transaction_count', 0)}</td>
                </tr>
                """
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Daily Financial Summary - {summary_date}</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                    color: #333;
                }}
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 2.5em;
                    font-weight: 300;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    font-size: 1.2em;
                    opacity: 0.9;
                }}
                .content {{
                    padding: 30px;
                }}
                .metrics-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                .metric-card {{
                    background: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    border-radius: 4px;
                }}
                .metric-card h3 {{
                    margin: 0 0 10px 0;
                    color: #495057;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }}
                .metric-card .value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #2c3e50;
                    margin: 0;
                }}
                .metric-card .subvalue {{
                    font-size: 0.9em;
                    color: #6c757d;
                    margin-top: 5px;
                }}
                .section {{
                    margin-bottom: 40px;
                }}
                .section h2 {{
                    color: #2c3e50;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    background: white;
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }}
                th, td {{
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #dee2e6;
                }}
                th {{
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                    text-transform: uppercase;
                    font-size: 0.85em;
                    letter-spacing: 0.5px;
                }}
                tr:hover {{
                    background-color: #f8f9fa;
                }}
                .text-right {{
                    text-align: right;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 0.9em;
                }}
                @media (max-width: 768px) {{
                    .container {{
                        margin: 10px;
                        border-radius: 0;
                    }}
                    .header {{
                        padding: 20px;
                    }}
                    .header h1 {{
                        font-size: 2em;
                    }}
                    .content {{
                        padding: 20px;
                    }}
                    .metrics-grid {{
                        grid-template-columns: 1fr;
                    }}
                    table {{
                        font-size: 0.9em;
                    }}
                    th, td {{
                        padding: 8px 10px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Daily Financial Summary</h1>
                    <p>{summary_date}</p>
                    <p>Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <div class="content">
                    <!-- Key Metrics -->
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h3>Total Revenue</h3>
                            <div class="value">{format_currency(revenue_metrics.get('total_revenue', 0))}</div>
                            <div class="subvalue">{revenue_metrics.get('total_transactions', 0)} transactions</div>
                        </div>
                        <div class="metric-card">
                            <h3>Gross Profit</h3>
                            <div class="value">{format_currency(revenue_metrics.get('gross_profit', 0))}</div>
                            <div class="subvalue">{format_percentage(revenue_metrics.get('profit_margin', 0))} margin</div>
                        </div>
                        <div class="metric-card">
                            <h3>Cash at Hand</h3>
                            <div class="value">{format_currency(cash_flow.get('cash_at_hand', 0))}</div>
                            <div class="subvalue">{cash_flow.get('cash_transactions', 0)} cash transactions</div>
                        </div>
                        <div class="metric-card">
                            <h3>POS Net Flow</h3>
                            <div class="value">{format_currency(cash_flow.get('pos_net_flow', 0))}</div>
                            <div class="subvalue">{cash_flow.get('pos_transactions', 0)} POS transactions</div>
                        </div>
                        <div class="metric-card">
                            <h3>Outstanding Credit</h3>
                            <div class="value">{format_currency(revenue_metrics.get('outstanding_credit', 0))}</div>
                            <div class="subvalue">Accounts receivable</div>
                        </div>
                        <div class="metric-card">
                            <h3>Total Cash Flow</h3>
                            <div class="value">{format_currency(cash_flow.get('total_cash_flow', 0))}</div>
                            <div class="subvalue">Cash + POS combined</div>
                        </div>
                    </div>
                    
                    <!-- Payment Methods Breakdown -->
                    <div class="section">
                        <h2>Payment Methods Breakdown</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Payment Method</th>
                                    <th class="text-right">Amount</th>
                                    <th class="text-right">Transactions</th>
                                    <th class="text-right">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payment_methods_rows}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Product Categories -->
                    <div class="section">
                        <h2>Product Category Sales</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th class="text-right">Sales Amount</th>
                                    <th class="text-right">Transactions</th>
                                    <th class="text-right">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {category_rows}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- POS Accounts Summary -->
                    <div class="section">
                        <h2>POS Accounts Summary</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>POS Account</th>
                                    <th class="text-right">Deposits</th>
                                    <th class="text-right">Withdrawals</th>
                                    <th class="text-right">Net Flow</th>
                                    <th class="text-right">Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pos_accounts_rows}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This report was automatically generated by SabiOPS Enhanced Payment System</p>
                    <p>For questions or support, contact your system administrator</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_weekly_summary_template(self, summary_data: Dict[str, Any]) -> str:
        """Create HTML template for weekly summary"""
        
        week_period = summary_data.get('week_period', {})
        weekly_totals = summary_data.get('weekly_totals', {})
        weekly_averages = summary_data.get('weekly_averages', {})
        daily_summaries = summary_data.get('daily_summaries', [])
        
        def format_currency(amount):
            return f"₦{amount:,.2f}" if amount else "₦0.00"
        
        # Generate daily breakdown table
        daily_rows = ""
        for daily in daily_summaries:
            daily_date = daily.get('summary_date', 'Unknown')
            revenue = daily.get('revenue_metrics', {}).get('total_revenue', 0)
            transactions = daily.get('revenue_metrics', {}).get('total_transactions', 0)
            cash_flow = daily.get('cash_flow', {}).get('total_cash_flow', 0)
            
            daily_rows += f"""
            <tr>
                <td>{daily_date}</td>
                <td class="text-right">{format_currency(revenue)}</td>
                <td class="text-right">{transactions}</td>
                <td class="text-right">{format_currency(cash_flow)}</td>
            </tr>
            """
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Financial Summary</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                    color: #333;
                }}
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 2.5em;
                    font-weight: 300;
                }}
                .content {{
                    padding: 30px;
                }}
                .metrics-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                .metric-card {{
                    background: #f8f9fa;
                    border-left: 4px solid #28a745;
                    padding: 20px;
                    border-radius: 4px;
                }}
                .metric-card h3 {{
                    margin: 0 0 10px 0;
                    color: #495057;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }}
                .metric-card .value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #2c3e50;
                    margin: 0;
                }}
                .metric-card .subvalue {{
                    font-size: 0.9em;
                    color: #6c757d;
                    margin-top: 5px;
                }}
                .section {{
                    margin-bottom: 40px;
                }}
                .section h2 {{
                    color: #2c3e50;
                    border-bottom: 2px solid #28a745;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    background: white;
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }}
                th, td {{
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #dee2e6;
                }}
                th {{
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                    text-transform: uppercase;
                    font-size: 0.85em;
                    letter-spacing: 0.5px;
                }}
                tr:hover {{
                    background-color: #f8f9fa;
                }}
                .text-right {{
                    text-align: right;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 0.9em;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Weekly Financial Summary</h1>
                    <p>{week_period.get('start_date', '')} to {week_period.get('end_date', '')}</p>
                    <p>Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <div class="content">
                    <!-- Weekly Totals -->
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h3>Total Revenue</h3>
                            <div class="value">{format_currency(weekly_totals.get('total_revenue', 0))}</div>
                            <div class="subvalue">{weekly_totals.get('total_transactions', 0)} transactions</div>
                        </div>
                        <div class="metric-card">
                            <h3>Average Daily Revenue</h3>
                            <div class="value">{format_currency(weekly_averages.get('average_daily_revenue', 0))}</div>
                            <div class="subvalue">{weekly_averages.get('average_daily_transactions', 0):.0f} avg transactions</div>
                        </div>
                        <div class="metric-card">
                            <h3>Total Cash Flow</h3>
                            <div class="value">{format_currency(weekly_totals.get('total_cash_flow', 0))}</div>
                            <div class="subvalue">{format_currency(weekly_averages.get('average_daily_cash_flow', 0))} daily avg</div>
                        </div>
                    </div>
                    
                    <!-- Daily Breakdown -->
                    <div class="section">
                        <h2>Daily Breakdown</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th class="text-right">Revenue</th>
                                    <th class="text-right">Transactions</th>
                                    <th class="text-right">Cash Flow</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daily_rows}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This report was automatically generated by SabiOPS Enhanced Payment System</p>
                </div>
            </div>
        </body>
        </html>
        """