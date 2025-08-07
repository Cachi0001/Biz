"""
HTML Template utilities for generating downloadable reports
"""
from typing import Dict, Any
from datetime import datetime

class HTMLTemplateGenerator:
    """Generate HTML templates for various report types"""
    
    @staticmethod
    def generate_daily_summary_html(summary_data: Dict[str, Any]) -> str:
        """Generate HTML content for daily summary download"""
        
        # Base template with proper styling
        html_template = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Daily Summary - {summary_data['date']}</title>
            <style>
                body {{ 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background-color: #f5f5f5;
                    color: #333;
                }}
                .container {{
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .header {{ 
                    text-align: center; 
                    margin-bottom: 40px; 
                    border-bottom: 3px solid #007bff;
                    padding-bottom: 20px;
                }}
                .header h1 {{
                    color: #007bff;
                    margin: 0 0 10px 0;
                    font-size: 2.2em;
                }}
                .header h2 {{
                    color: #666;
                    margin: 0 0 10px 0;
                    font-weight: normal;
                }}
                .header p {{
                    color: #888;
                    margin: 0;
                    font-size: 0.9em;
                }}
                .section {{ 
                    margin-bottom: 30px; 
                    padding: 20px; 
                    border: 1px solid #e0e0e0; 
                    border-radius: 6px;
                    background: #fafafa;
                }}
                .section h3 {{ 
                    margin-top: 0; 
                    color: #333; 
                    font-size: 1.3em;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 8px;
                }}
                table {{ 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 15px;
                    background: white;
                }}
                th, td {{ 
                    padding: 12px 15px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd; 
                }}
                th {{ 
                    background-color: #007bff; 
                    color: white;
                    font-weight: 600;
                }}
                tr:nth-child(even) {{
                    background-color: #f8f9fa;
                }}
                .amount {{ 
                    text-align: right; 
                    font-weight: bold; 
                    font-family: 'Courier New', monospace;
                }}
                .positive {{ color: #28a745; }}
                .negative {{ color: #dc3545; }}
                .total-row {{
                    border-top: 2px solid #333;
                    font-weight: bold;
                    background-color: #e9ecef !important;
                }}
                .summary-cards {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }}
                .summary-card {{
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid #007bff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }}
                .summary-card h4 {{
                    margin: 0 0 8px 0;
                    color: #666;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }}
                .summary-card .value {{
                    font-size: 1.4em;
                    font-weight: bold;
                    color: #333;
                }}
                @media print {{
                    body {{ background: white; }}
                    .container {{ box-shadow: none; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Daily Financial Summary</h1>
                    <h2>{summary_data['date']}</h2>
                    <p>Generated on: {datetime.fromisoformat(summary_data['generated_at']).strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <div class="section">
                    <h3>💰 Cash Management</h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <h4>Cash In</h4>
                            <div class="value positive">₦{summary_data['cash_at_hand']['total_cash_in']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Cash Out</h4>
                            <div class="value negative">₦{summary_data['cash_at_hand']['total_cash_out']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Cash at Hand</h4>
                            <div class="value">₦{summary_data['cash_at_hand']['cash_at_hand']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Transactions</h4>
                            <div class="value">{summary_data['cash_at_hand']['transaction_count']}</div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>💳 POS Transactions</h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <h4>Total Deposits</h4>
                            <div class="value positive">₦{summary_data['pos_transactions']['total_deposits']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Total Withdrawals</h4>
                            <div class="value negative">₦{summary_data['pos_transactions']['total_withdrawals']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Net POS Amount</h4>
                            <div class="value">₦{summary_data['pos_transactions']['net_pos_amount']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Transactions</h4>
                            <div class="value">{summary_data['pos_transactions']['transaction_count']}</div>
                        </div>
                    </div>
        """
        
        # Add POS account breakdown if available
        if summary_data['pos_transactions'].get('account_breakdown'):
            html_template += """
                    <table>
                        <thead>
                            <tr><th>POS Account</th><th>Deposits</th><th>Withdrawals</th><th>Net Amount</th><th>Transactions</th></tr>
                        </thead>
                        <tbody>
            """
            
            for account, data in summary_data['pos_transactions']['account_breakdown'].items():
                net_amount = data['deposits'] - data['withdrawals']
                net_class = 'positive' if net_amount >= 0 else 'negative'
                html_template += f"""
                            <tr>
                                <td>{account}</td>
                                <td class="amount positive">₦{data['deposits']:,.2f}</td>
                                <td class="amount negative">₦{data['withdrawals']:,.2f}</td>
                                <td class="amount {net_class}">₦{net_amount:,.2f}</td>
                                <td class="amount">{data['transaction_count']}</td>
                            </tr>
                """
            
            html_template += """
                        </tbody>
                    </table>
            """
        
        html_template += """
                </div>
                
                <div class="section">
                    <h3>🥤 Drinks Sales</h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <h4>Total Amount</h4>
                            <div class="value">₦{drinks_total:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Transactions</h4>
                            <div class="value">{drinks_count}</div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>📊 Sales by Category</h3>
                    <table>
                        <thead>
                            <tr><th>Category</th><th>Amount</th><th>Transactions</th><th>% of Total</th></tr>
                        </thead>
                        <tbody>
        """.format(
            drinks_total=summary_data['drinks_sales']['total_amount'],
            drinks_count=summary_data['drinks_sales']['transaction_count']
        )
        
        # Add category sales rows
        total_sales = summary_data['category_sales']['total_sales']
        for category, data in summary_data['category_sales']['categories'].items():
            percentage = (data['total_amount'] / total_sales * 100) if total_sales > 0 else 0
            html_template += f"""
                            <tr>
                                <td>{category}</td>
                                <td class="amount">₦{data['total_amount']:,.2f}</td>
                                <td class="amount">{data['transaction_count']}</td>
                                <td class="amount">{percentage:.1f}%</td>
                            </tr>
            """
        
        html_template += f"""
                            <tr class="total-row">
                                <td><strong>Total</strong></td>
                                <td class="amount"><strong>₦{summary_data['category_sales']['total_sales']:,.2f}</strong></td>
                                <td class="amount"><strong>{summary_data['category_sales']['total_transactions']}</strong></td>
                                <td class="amount"><strong>100.0%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h3>📈 Summary Overview</h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <h4>Total Revenue</h4>
                            <div class="value">₦{summary_data['category_sales']['total_sales']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Cash Position</h4>
                            <div class="value">₦{summary_data['cash_at_hand']['cash_at_hand']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>POS Net</h4>
                            <div class="value">₦{summary_data['pos_transactions']['net_pos_amount']:,.2f}</div>
                        </div>
                        <div class="summary-card">
                            <h4>Total Transactions</h4>
                            <div class="value">{summary_data['category_sales']['total_transactions']}</div>
                        </div>
                    </div>
                </div>
                
                <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
                    <p>Generated by SabiOPS - Business Management System</p>
                    <p>Report Date: {summary_data['date']} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </footer>
            </div>
        </body>
        </html>
        """
        
        return html_template
    
    @staticmethod
    def generate_sales_report_html(sales_data: Dict[str, Any]) -> str:
        """Generate HTML content for sales report download"""
        # Implementation for sales report template
        pass
    
    @staticmethod
    def generate_inventory_report_html(inventory_data: Dict[str, Any]) -> str:
        """Generate HTML content for inventory report download"""
        # Implementation for inventory report template
        pass
    
    @staticmethod
    def generate_financial_report_html(financial_data: Dict[str, Any]) -> str:
        """Generate HTML content for financial report download"""
        # Implementation for financial report template
        pass