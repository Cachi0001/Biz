/**
 * HTML Report Download Utility
 * Provides HTML report generation and download functionality for daily summaries
 */

/**
 * Downloads daily summary data as a well-structured HTML report
 * @param {Object} summaryData - Daily summary data object
 * @param {string} date - Date for the report
 * @param {string} filename - Optional filename
 */
export const downloadDailySummaryHTML = (summaryData, date, filename) => {
    try {
        if (!summaryData || typeof summaryData !== 'object') {
            throw new Error('No daily summary data available to download');
        }

        const reportDate = date || new Date().toISOString().split('T')[0];
        const timestamp = new Date().toLocaleString();

        const {
            revenue_metrics = {},
            cash_flow = {},
            payment_method_breakdown = {},
            product_category_sales = {},
            pos_summary = {},
            performance_indicators = {}
        } = summaryData;

        const formatCurrency = (amount) => {
            return `₦${parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
        };

        const formatPercentage = (value) => {
            return `${parseFloat(value || 0).toFixed(1)}%`;
        };

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Financial Summary - ${new Date(reportDate).toLocaleDateString('en-NG')}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8fafc;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #16a34a, #059669); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 2.5em; 
            font-weight: 700;
        }
        .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 1.1em;
        }
        .content { 
            padding: 30px; 
        }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .metric-card { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 20px; 
            text-align: center; 
            transition: transform 0.2s ease;
        }
        .metric-card:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .metric-card h3 { 
            margin: 0 0 10px 0; 
            color: #16a34a; 
            font-size: 1.1em; 
            font-weight: 600;
        }
        .metric-card .value { 
            font-size: 2em; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 5px;
        }
        .metric-card .subtitle { 
            font-size: 0.9em; 
            color: #6b7280; 
        }
        .section { 
            margin-bottom: 40px; 
        }
        .section h2 { 
            color: #16a34a; 
            border-bottom: 3px solid #16a34a; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
            font-size: 1.5em;
            font-weight: 600;
        }
        .breakdown-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .breakdown-card { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
        }
        .breakdown-card h3 { 
            margin: 0 0 15px 0; 
            color: #374151; 
            font-size: 1.2em;
        }
        .breakdown-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 10px 0; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .breakdown-item:last-child { 
            border-bottom: none; 
        }
        .breakdown-item .label { 
            font-weight: 500; 
            color: #374151; 
        }
        .breakdown-item .value { 
            font-weight: bold; 
            color: #16a34a; 
        }
        .breakdown-item .percentage { 
            font-size: 0.9em; 
            color: #6b7280; 
            margin-left: 8px;
        }
        .pos-accounts { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
            gap: 20px; 
        }
        .pos-account { 
            border: 1px solid #d1d5db; 
            border-radius: 8px; 
            padding: 20px; 
            background: white;
        }
        .pos-account h4 { 
            margin: 0 0 15px 0; 
            color: #374151; 
            font-size: 1.1em;
        }
        .pos-metrics { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 15px; 
            text-align: center; 
        }
        .pos-metric { 
            padding: 10px; 
            border-radius: 6px; 
        }
        .pos-metric.deposits { 
            background: #dcfce7; 
            color: #166534; 
        }
        .pos-metric.withdrawals { 
            background: #fee2e2; 
            color: #991b1b; 
        }
        .pos-metric.net-flow { 
            background: #dbeafe; 
            color: #1e40af; 
        }
        .pos-metric .label { 
            font-size: 0.9em; 
            margin-bottom: 5px; 
        }
        .pos-metric .amount { 
            font-weight: bold; 
            font-size: 1.1em; 
        }
        .performance-indicators { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
        }
        .indicator { 
            text-align: center; 
            padding: 20px; 
            border-radius: 8px; 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        }
        .indicator .label { 
            font-size: 0.9em; 
            color: #374151; 
            margin-bottom: 8px; 
        }
        .indicator .value { 
            font-size: 1.8em; 
            font-weight: bold; 
            color: #0369a1; 
        }
        .footer { 
            margin-top: 50px; 
            padding: 30px; 
            background: #f8fafc; 
            text-align: center; 
            color: #6b7280; 
            border-top: 1px solid #e5e7eb;
        }
        .footer strong { 
            color: #374151; 
        }
        @media print { 
            body { 
                margin: 0; 
                background: white; 
            } 
            .container { 
                box-shadow: none; 
            }
            .header { 
                background: #16a34a !important; 
            } 
        }
        @media (max-width: 768px) {
            .content { 
                padding: 20px; 
            }
            .metrics-grid { 
                grid-template-columns: 1fr; 
            }
            .breakdown-grid { 
                grid-template-columns: 1fr; 
            }
            .pos-accounts { 
                grid-template-columns: 1fr; 
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Daily Financial Summary</h1>
            <p>Business Performance Report for ${new Date(reportDate).toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
            <p>Generated on ${timestamp}</p>
        </div>

        <div class="content">
            <!-- Key Metrics -->
            <div class="section">
                <h2>💰 Key Financial Metrics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Total Revenue</h3>
                        <div class="value">${formatCurrency(revenue_metrics.total_revenue)}</div>
                        <div class="subtitle">${revenue_metrics.total_transactions || 0} transactions</div>
                    </div>
                    <div class="metric-card">
                        <h3>Gross Profit</h3>
                        <div class="value">${formatCurrency(revenue_metrics.gross_profit)}</div>
                        <div class="subtitle">${formatPercentage(revenue_metrics.profit_margin)} margin</div>
                    </div>
                    <div class="metric-card">
                        <h3>Cash at Hand</h3>
                        <div class="value">${formatCurrency(cash_flow.cash_at_hand)}</div>
                        <div class="subtitle">${cash_flow.cash_transactions || 0} cash transactions</div>
                    </div>
                    <div class="metric-card">
                        <h3>POS Net Flow</h3>
                        <div class="value">${formatCurrency(cash_flow.pos_net_flow)}</div>
                        <div class="subtitle">${cash_flow.pos_transactions || 0} POS transactions</div>
                    </div>
                    <div class="metric-card">
                        <h3>Outstanding Credit</h3>
                        <div class="value">${formatCurrency(revenue_metrics.outstanding_credit)}</div>
                        <div class="subtitle">Accounts receivable</div>
                    </div>
                    <div class="metric-card">
                        <h3>Total Cash Flow</h3>
                        <div class="value">${formatCurrency(cash_flow.total_cash_flow)}</div>
                        <div class="subtitle">Net cash movement</div>
                    </div>
                </div>
            </div>

            <!-- Payment Methods & Categories -->
            <div class="section">
                <h2>📊 Business Breakdown</h2>
                <div class="breakdown-grid">
                    <!-- Payment Methods -->
                    <div class="breakdown-card">
                        <h3>💳 Payment Methods</h3>
                        ${payment_method_breakdown.payment_methods?.length > 0 ?
                payment_method_breakdown.payment_methods.map(method => `
                            <div class="breakdown-item">
                                <div>
                                    <span class="label">${method.payment_method_name}</span>
                                    <div style="font-size: 0.9em; color: #6b7280;">${method.transaction_count} transactions</div>
                                </div>
                                <div>
                                    <span class="value">${formatCurrency(method.total_amount)}</span>
                                    <span class="percentage">${formatPercentage(method.percentage)}</span>
                                </div>
                            </div>
                          `).join('') :
                '<div style="text-align: center; color: #6b7280; padding: 20px;">No payment data available</div>'
            }
                    </div>

                    <!-- Product Categories -->
                    <div class="breakdown-card">
                        <h3>📦 Product Categories</h3>
                        ${product_category_sales.category_breakdown?.length > 0 ?
                product_category_sales.category_breakdown.map(category => `
                            <div class="breakdown-item">
                                <div>
                                    <span class="label">${category.category_name}</span>
                                    <div style="font-size: 0.9em; color: #6b7280;">${category.transaction_count} sales</div>
                                </div>
                                <div>
                                    <span class="value">${formatCurrency(category.total_amount)}</span>
                                    <span class="percentage">${formatPercentage(category.percentage)}</span>
                                </div>
                            </div>
                          `).join('') :
                '<div style="text-align: center; color: #6b7280; padding: 20px;">No category data available</div>'
            }
                    </div>
                </div>
            </div>

            <!-- POS Accounts Summary -->
            ${pos_summary.pos_accounts?.length > 0 ? `
            <div class="section">
                <h2>🏦 POS Accounts Summary</h2>
                <div class="pos-accounts">
                    ${pos_summary.pos_accounts.map(account => `
                        <div class="pos-account">
                            <h4>${account.account_name}</h4>
                            <div style="margin-bottom: 15px; color: #6b7280; font-size: 0.9em;">
                                ${account.transaction_count} transactions
                            </div>
                            <div class="pos-metrics">
                                <div class="pos-metric deposits">
                                    <div class="label">Deposits</div>
                                    <div class="amount">${formatCurrency(account.deposits)}</div>
                                </div>
                                <div class="pos-metric withdrawals">
                                    <div class="label">Withdrawals</div>
                                    <div class="amount">${formatCurrency(account.withdrawals)}</div>
                                </div>
                                <div class="pos-metric net-flow">
                                    <div class="label">Net Flow</div>
                                    <div class="amount">${formatCurrency(account.net_flow)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Performance Indicators -->
            <div class="section">
                <h2>📈 Performance Indicators</h2>
                <div class="performance-indicators">
                    <div class="indicator">
                        <div class="label">Revenue Recognition Rate</div>
                        <div class="value">${formatPercentage(performance_indicators.revenue_recognition_rate)}</div>
                    </div>
                    <div class="indicator">
                        <div class="label">Cash to Revenue Ratio</div>
                        <div class="value">${formatPercentage(performance_indicators.cash_to_revenue_ratio)}</div>
                    </div>
                    <div class="indicator">
                        <div class="label">Credit Sales Ratio</div>
                        <div class="value">${formatPercentage(performance_indicators.credit_sales_ratio)}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>SabiOps Business Management Platform</strong></p>
            <p>This daily financial summary was generated automatically on ${timestamp}</p>
            <p>For support and more features, visit: <a href="https://sabiops.vercel.app" style="color: #16a34a;">sabiops.vercel.app</a></p>
        </div>
    </div>
</body>
</html>
    `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `daily_summary_${reportDate}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Daily summary report downloaded successfully as HTML' };
    } catch (error) {
        console.error('Daily summary HTML export failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Downloads revenue recognition data as HTML report
 * @param {Object} revenueData - Revenue recognition data object
 * @param {string} period - Period for the report
 * @param {string} filename - Optional filename
 */
export const downloadRevenueRecognitionHTML = (revenueData, period, filename) => {
    try {
        if (!revenueData || typeof revenueData !== 'object') {
            throw new Error('No revenue recognition data available to download');
        }

        const timestamp = new Date().toLocaleString();
        const reportPeriod = period || '30 days';

        const {
            current_period = {},
            previous_period = {},
            growth_metrics = {},
            accounts_receivable = {},
            revenue_recognition = {}
        } = revenueData;

        const formatCurrency = (amount) => {
            return `₦${parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
        };

        const formatPercentage = (value) => {
            return `${parseFloat(value || 0).toFixed(1)}%`;
        };

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revenue Recognition Report - ${reportPeriod}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8fafc;
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 2.5em; 
            font-weight: 700;
        }
        .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 1.1em;
        }
        .content { 
            padding: 30px; 
        }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .metric-card { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 20px; 
            text-align: center; 
        }
        .metric-card h3 { 
            margin: 0 0 10px 0; 
            color: #3b82f6; 
            font-size: 1.1em; 
            font-weight: 600;
        }
        .metric-card .value { 
            font-size: 1.8em; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 5px;
        }
        .metric-card .growth { 
            font-size: 0.9em; 
            font-weight: 500;
        }
        .growth.positive { color: #16a34a; }
        .growth.negative { color: #dc2626; }
        .growth.neutral { color: #6b7280; }
        .section { 
            margin-bottom: 40px; 
        }
        .section h2 { 
            color: #3b82f6; 
            border-bottom: 3px solid #3b82f6; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
            font-size: 1.5em;
        }
        .breakdown-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
        }
        .breakdown-card { 
            text-align: center; 
            padding: 25px; 
            border-radius: 12px; 
            border: 2px solid #e5e7eb;
        }
        .breakdown-card.recognized { 
            background: linear-gradient(135deg, #dcfce7, #bbf7d0); 
            border-color: #16a34a;
        }
        .breakdown-card.unrecognized { 
            background: linear-gradient(135deg, #fed7aa, #fdba74); 
            border-color: #ea580c;
        }
        .breakdown-card.total { 
            background: linear-gradient(135deg, #dbeafe, #93c5fd); 
            border-color: #3b82f6;
        }
        .breakdown-card h3 { 
            margin: 0 0 15px 0; 
            font-size: 1.2em;
        }
        .breakdown-card .amount { 
            font-size: 2em; 
            font-weight: bold; 
            margin-bottom: 8px;
        }
        .breakdown-card .description { 
            font-size: 0.9em; 
            opacity: 0.8;
        }
        .aging-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 15px; 
        }
        .aging-bucket { 
            text-align: center; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #d1d5db;
        }
        .aging-bucket.current { background: #dcfce7; color: #166534; }
        .aging-bucket.thirty { background: #fef3c7; color: #92400e; }
        .aging-bucket.sixty { background: #fed7aa; color: #c2410c; }
        .aging-bucket.ninety { background: #fecaca; color: #991b1b; }
        .aging-bucket .label { 
            font-size: 0.9em; 
            margin-bottom: 8px; 
            font-weight: 500;
        }
        .aging-bucket .amount { 
            font-size: 1.3em; 
            font-weight: bold; 
        }
        .footer { 
            margin-top: 50px; 
            padding: 30px; 
            background: #f8fafc; 
            text-align: center; 
            color: #6b7280; 
            border-top: 1px solid #e5e7eb;
        }
        @media print { 
            body { margin: 0; background: white; } 
            .container { box-shadow: none; }
            .header { background: #3b82f6 !important; } 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Revenue Recognition Report</h1>
            <p>Accounting-Based Revenue Analysis for ${reportPeriod}</p>
            <p>Generated on ${timestamp}</p>
        </div>

        <div class="content">
            <!-- Key Metrics -->
            <div class="section">
                <h2>💰 Revenue Recognition Overview</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Recognized Revenue</h3>
                        <div class="value">${formatCurrency(current_period.recognized_revenue)}</div>
                        <div class="growth ${growth_metrics.revenue_growth_percentage >= 0 ? 'positive' : 'negative'}">
                            ${growth_metrics.revenue_growth_percentage >= 0 ? '↗' : '↘'} ${formatPercentage(Math.abs(growth_metrics.revenue_growth_percentage))} vs prev period
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>Recognized Profit</h3>
                        <div class="value">${formatCurrency(current_period.recognized_profit)}</div>
                        <div class="growth ${growth_metrics.profit_growth_percentage >= 0 ? 'positive' : 'negative'}">
                            ${growth_metrics.profit_growth_percentage >= 0 ? '↗' : '↘'} ${formatPercentage(Math.abs(growth_metrics.profit_growth_percentage))} vs prev period
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>Accounts Receivable</h3>
                        <div class="value">${formatCurrency(accounts_receivable.total_accounts_receivable)}</div>
                        <div class="growth neutral">
                            ${accounts_receivable.outstanding_sales_count || 0} outstanding sales
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>Recognition Rate</h3>
                        <div class="value">${formatPercentage(revenue_recognition.recognition_rate_percentage)}</div>
                        <div class="growth neutral">
                            Revenue recognized vs total sales
                        </div>
                    </div>
                </div>
            </div>

            <!-- Revenue Breakdown -->
            <div class="section">
                <h2>📊 Revenue Recognition Breakdown</h2>
                <div class="breakdown-grid">
                    <div class="breakdown-card recognized">
                        <h3>✅ Recognized Revenue</h3>
                        <div class="amount">${formatCurrency(revenue_recognition.recognized_revenue)}</div>
                        <div class="description">From paid sales only</div>
                    </div>
                    <div class="breakdown-card unrecognized">
                        <h3>⏳ Unrecognized Revenue</h3>
                        <div class="amount">${formatCurrency(revenue_recognition.unrecognized_revenue)}</div>
                        <div class="description">From credit/pending sales</div>
                    </div>
                    <div class="breakdown-card total">
                        <h3>💼 Total Sales Amount</h3>
                        <div class="amount">${formatCurrency(revenue_recognition.total_sales_amount)}</div>
                        <div class="description">All sales (paid + unpaid)</div>
                    </div>
                </div>
            </div>

            <!-- Accounts Receivable Aging -->
            <div class="section">
                <h2>📅 Accounts Receivable Aging</h2>
                <div class="aging-grid">
                    <div class="aging-bucket current">
                        <div class="label">Current (0-30 days)</div>
                        <div class="amount">${formatCurrency(accounts_receivable.aging_buckets?.current || 0)}</div>
                    </div>
                    <div class="aging-bucket thirty">
                        <div class="label">31-60 days</div>
                        <div class="amount">${formatCurrency(accounts_receivable.aging_buckets?.['30_days'] || 0)}</div>
                    </div>
                    <div class="aging-bucket sixty">
                        <div class="label">61-90 days</div>
                        <div class="amount">${formatCurrency(accounts_receivable.aging_buckets?.['60_days'] || 0)}</div>
                    </div>
                    <div class="aging-bucket ninety">
                        <div class="label">90+ days</div>
                        <div class="amount">${formatCurrency(accounts_receivable.aging_buckets?.['90_plus_days'] || 0)}</div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; text-align: center;">
                        <div>
                            <div style="font-size: 0.9em; color: #6b7280; margin-bottom: 5px;">Average Days Outstanding</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #374151;">
                                ${Math.round(accounts_receivable.average_days_outstanding || 0)} days
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.9em; color: #6b7280; margin-bottom: 5px;">Collection Efficiency</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #3b82f6;">
                                ${formatPercentage(accounts_receivable.collection_efficiency)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>SabiOps Business Management Platform</strong></p>
            <p>This revenue recognition report was generated automatically on ${timestamp}</p>
            <p>For support and more features, visit: <a href="https://sabiops.vercel.app" style="color: #3b82f6;">sabiops.vercel.app</a></p>
        </div>
    </div>
</body>
</html>
    `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `revenue_recognition_${reportPeriod.replace(/\s+/g, '_')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Revenue recognition report downloaded successfully as HTML' };
    } catch (error) {
        console.error('Revenue recognition HTML export failed:', error);
        return { success: false, error: error.message };
    }
};