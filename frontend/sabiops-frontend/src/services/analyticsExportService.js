/**
 * Analytics Export Service
 * Handles exporting analytics data as CSV and chart images
 */

// Native file download implementation - no external dependencies needed

class AnalyticsExportService {
  /**
   * Native file download implementation
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export analytics data as CSV
   */
  async exportToCSV(data, filename, timePeriod) {
    try {
      const csvContent = this.generateCSVContent(data, timePeriod);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadFile(blob, `${filename}_${timePeriod}_${timestamp}.csv`);
      return { success: true, message: 'Data exported successfully' };
    } catch (error) {
      console.error('CSV export failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export chart as image (simplified version without external dependencies)
   */
  async exportChartAsImage(chartElementId, filename) {
    try {
      const chartElement = document.getElementById(chartElementId);
      if (!chartElement) {
        throw new Error('Chart element not found');
      }

      // For now, we'll create a simple text-based representation
      // In a production environment, you might want to use a different approach
      const chartData = this.extractChartData(chartElement);
      const textContent = this.generateChartTextExport(chartData, filename);
      
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadFile(blob, `${filename}_${timestamp}.txt`);

      return { success: true, message: 'Chart data exported successfully as text file' };
    } catch (error) {
      console.error('Chart export failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract data from chart element (simplified)
   */
  extractChartData(chartElement) {
    // This is a simplified implementation
    // In a real scenario, you'd extract actual chart data
    return {
      title: chartElement.getAttribute('data-chart-title') || 'Chart Data',
      type: chartElement.getAttribute('data-chart-type') || 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate text-based chart export
   */
  generateChartTextExport(chartData, filename) {
    return `
Chart Export: ${filename}
Generated: ${new Date().toLocaleString()}
Chart Type: ${chartData.type}
Title: ${chartData.title}

Note: This is a simplified text export. For full image export functionality,
additional dependencies would be required.

Chart data would be displayed here in a text format.
    `.trim();
  }

  /**
   * Generate comprehensive analytics report
   */
  async exportFullReport(analyticsData, timePeriod) {
    try {
      const reportContent = this.generateReportContent(analyticsData, timePeriod);
      const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8;' });
      const timestamp = new Date().toISOString().split('T')[0];
      this.downloadFile(blob, `analytics_report_${timePeriod}_${timestamp}.html`);
      return { success: true, message: 'Report exported successfully' };
    } catch (error) {
      console.error('Report export failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate CSV content from analytics data
   */
  generateCSVContent(data, timePeriod) {
    let csvContent = `Analytics Report - ${timePeriod.toUpperCase()}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Revenue Data
    if (data.revenue) {
      csvContent += "REVENUE ANALYTICS\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Revenue,${data.revenue.total_revenue || 0}\n`;
      csvContent += `Total Profit,${data.revenue.total_profit || 0}\n`;
      csvContent += `Revenue Growth,${data.revenue.revenue_growth || 0}%\n`;
      csvContent += `Profit Margin,${data.revenue.profit_margin || 0}%\n\n`;

      // Revenue Trends
      if (data.revenue.trends && data.revenue.trends.length > 0) {
        csvContent += "REVENUE TRENDS\n";
        csvContent += "Period,Revenue,Profit,Orders\n";
        data.revenue.trends.forEach(trend => {
          csvContent += `${trend.period},${trend.revenue || 0},${trend.profit || 0},${trend.orders || 0}\n`;
        });
        csvContent += "\n";
      }
    }

    // Customer Data
    if (data.customers) {
      csvContent += "CUSTOMER ANALYTICS\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Customers,${data.customers.total_customers || 0}\n`;
      csvContent += `New Customers,${data.customers.new_customers_current || 0}\n`;
      csvContent += `Customer Growth,${data.customers.customer_growth || 0}%\n`;
      csvContent += `Average Order Value,${data.customers.avg_order_value || 0}\n\n`;

      // Top Customers
      if (data.customers.top_customers && data.customers.top_customers.length > 0) {
        csvContent += "TOP CUSTOMERS\n";
        csvContent += "Customer Name,Revenue,Orders\n";
        data.customers.top_customers.forEach(customer => {
          csvContent += `${customer.name},${customer.revenue || 0},${customer.orders || 0}\n`;
        });
        csvContent += "\n";
      }
    }

    // Product Data
    if (data.products) {
      csvContent += "PRODUCT ANALYTICS\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Products,${data.products.total_products || 0}\n`;
      csvContent += `Low Stock Count,${data.products.low_stock_count || 0}\n`;
      csvContent += `Inventory Turnover,${data.products.inventory_turnover || 0}\n`;
      csvContent += `Total Quantity Sold,${data.products.total_quantity_sold || 0}\n\n`;

      // Top Products by Revenue
      if (data.products.top_products_by_revenue && data.products.top_products_by_revenue.length > 0) {
        csvContent += "TOP PRODUCTS BY REVENUE\n";
        csvContent += "Product Name,Revenue,Quantity Sold,Profit\n";
        data.products.top_products_by_revenue.forEach(product => {
          csvContent += `${product.name},${product.revenue || 0},${product.quantity_sold || 0},${product.profit || 0}\n`;
        });
        csvContent += "\n";
      }
    }

    // Financial Data
    if (data.financial) {
      csvContent += "FINANCIAL ANALYTICS\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Revenue,${data.financial.total_revenue || 0}\n`;
      csvContent += `Total Expenses,${data.financial.total_expenses || 0}\n`;
      csvContent += `Gross Profit,${data.financial.gross_profit || 0}\n`;
      csvContent += `Net Profit,${data.financial.net_profit || 0}\n`;
      csvContent += `Gross Margin,${data.financial.gross_margin || 0}%\n`;
      csvContent += `Net Margin,${data.financial.net_margin || 0}%\n\n`;

      // Expense Breakdown
      if (data.financial.expense_breakdown && data.financial.expense_breakdown.length > 0) {
        csvContent += "EXPENSE BREAKDOWN\n";
        csvContent += "Category,Amount,Percentage\n";
        data.financial.expense_breakdown.forEach(expense => {
          csvContent += `${expense.category},${expense.amount || 0},${expense.percentage || 0}%\n`;
        });
        csvContent += "\n";
      }
    }

    return csvContent;
  }

  /**
   * Generate HTML report content
   */
  generateReportContent(data, timePeriod) {
    const timestamp = new Date().toLocaleString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Report - ${timePeriod.toUpperCase()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .metric:last-child { border-bottom: none; }
        .metric-label { font-weight: bold; }
        .metric-value { color: #059669; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: bold; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .neutral { color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Business Analytics Report</h1>
        <p>Period: ${timePeriod.toUpperCase()} | Generated: ${timestamp}</p>
    </div>

    ${this.generateRevenueSection(data.revenue)}
    ${this.generateCustomerSection(data.customers)}
    ${this.generateProductSection(data.products)}
    ${this.generateFinancialSection(data.financial)}

    <div class="section">
        <h2>Report Summary</h2>
        <p>This report provides comprehensive insights into your business performance for the ${timePeriod} period. 
        Use these metrics to make informed decisions about your business strategy and operations.</p>
        <p><strong>Generated by SabiOps Analytics</strong> - ${timestamp}</p>
    </div>
</body>
</html>`;
  }

  generateRevenueSection(revenue) {
    if (!revenue) return '';
    
    return `
    <div class="section">
        <h2>Revenue Analytics</h2>
        <div class="metric">
            <span class="metric-label">Total Revenue:</span>
            <span class="metric-value">₦${(revenue.total_revenue || 0).toLocaleString()}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Total Profit:</span>
            <span class="metric-value">₦${(revenue.total_profit || 0).toLocaleString()}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Revenue Growth:</span>
            <span class="metric-value ${revenue.revenue_growth >= 0 ? 'positive' : 'negative'}">
                ${revenue.revenue_growth >= 0 ? '+' : ''}${(revenue.revenue_growth || 0).toFixed(1)}%
            </span>
        </div>
        <div class="metric">
            <span class="metric-label">Profit Margin:</span>
            <span class="metric-value">${(revenue.profit_margin || 0).toFixed(1)}%</span>
        </div>
    </div>`;
  }

  generateCustomerSection(customers) {
    if (!customers) return '';
    
    let topCustomersTable = '';
    if (customers.top_customers && customers.top_customers.length > 0) {
      topCustomersTable = `
        <h3>Top Customers</h3>
        <table>
            <thead>
                <tr><th>Customer</th><th>Revenue</th><th>Orders</th></tr>
            </thead>
            <tbody>
                ${customers.top_customers.slice(0, 10).map(customer => `
                    <tr>
                        <td>${customer.name}</td>
                        <td>₦${(customer.revenue || 0).toLocaleString()}</td>
                        <td>${customer.orders || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    return `
    <div class="section">
        <h2>Customer Analytics</h2>
        <div class="metric">
            <span class="metric-label">Total Customers:</span>
            <span class="metric-value">${(customers.total_customers || 0).toLocaleString()}</span>
        </div>
        <div class="metric">
            <span class="metric-label">New Customers:</span>
            <span class="metric-value">${customers.new_customers_current || 0}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Customer Growth:</span>
            <span class="metric-value ${customers.customer_growth >= 0 ? 'positive' : 'negative'}">
                ${customers.customer_growth >= 0 ? '+' : ''}${(customers.customer_growth || 0).toFixed(1)}%
            </span>
        </div>
        <div class="metric">
            <span class="metric-label">Average Order Value:</span>
            <span class="metric-value">₦${(customers.avg_order_value || 0).toLocaleString()}</span>
        </div>
        ${topCustomersTable}
    </div>`;
  }

  generateProductSection(products) {
    if (!products) return '';
    
    let topProductsTable = '';
    if (products.top_products_by_revenue && products.top_products_by_revenue.length > 0) {
      topProductsTable = `
        <h3>Top Products by Revenue</h3>
        <table>
            <thead>
                <tr><th>Product</th><th>Revenue</th><th>Quantity Sold</th><th>Profit</th></tr>
            </thead>
            <tbody>
                ${products.top_products_by_revenue.slice(0, 10).map(product => `
                    <tr>
                        <td>${product.name}</td>
                        <td>₦${(product.revenue || 0).toLocaleString()}</td>
                        <td>${product.quantity_sold || 0}</td>
                        <td>₦${(product.profit || 0).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    return `
    <div class="section">
        <h2>Product Analytics</h2>
        <div class="metric">
            <span class="metric-label">Total Products:</span>
            <span class="metric-value">${(products.total_products || 0).toLocaleString()}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Low Stock Items:</span>
            <span class="metric-value ${products.low_stock_count > 0 ? 'negative' : 'positive'}">
                ${products.low_stock_count || 0}
            </span>
        </div>
        <div class="metric">
            <span class="metric-label">Inventory Turnover:</span>
            <span class="metric-value">${(products.inventory_turnover || 0).toFixed(1)}x</span>
        </div>
        <div class="metric">
            <span class="metric-label">Total Quantity Sold:</span>
            <span class="metric-value">${(products.total_quantity_sold || 0).toLocaleString()}</span>
        </div>
        ${topProductsTable}
    </div>`;
  }

  generateFinancialSection(financial) {
    if (!financial) return '';
    
    let expenseTable = '';
    if (financial.expense_breakdown && financial.expense_breakdown.length > 0) {
      expenseTable = `
        <h3>Expense Breakdown</h3>
        <table>
            <thead>
                <tr><th>Category</th><th>Amount</th><th>Percentage</th></tr>
            </thead>
            <tbody>
                ${financial.expense_breakdown.map(expense => `
                    <tr>
                        <td>${expense.category}</td>
                        <td>₦${(expense.amount || 0).toLocaleString()}</td>
                        <td>${(expense.percentage || 0).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    return `
    <div class="section">
        <h2>Financial Analytics</h2>
        <div class="metric">
            <span class="metric-label">Total Revenue:</span>
            <span class="metric-value">₦${(financial.total_revenue || 0).toLocaleString()}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Total Expenses:</span>
            <span class="metric-value">₦${(financial.total_expenses || 0).toLocaleString()}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Gross Profit:</span>
            <span class="metric-value ${financial.gross_profit >= 0 ? 'positive' : 'negative'}">
                ₦${(financial.gross_profit || 0).toLocaleString()}
            </span>
        </div>
        <div class="metric">
            <span class="metric-label">Net Profit:</span>
            <span class="metric-value ${financial.net_profit >= 0 ? 'positive' : 'negative'}">
                ₦${(financial.net_profit || 0).toLocaleString()}
            </span>
        </div>
        <div class="metric">
            <span class="metric-label">Gross Margin:</span>
            <span class="metric-value">${(financial.gross_margin || 0).toFixed(1)}%</span>
        </div>
        <div class="metric">
            <span class="metric-label">Net Margin:</span>
            <span class="metric-value ${financial.net_margin >= 0 ? 'positive' : 'negative'}">
                ${(financial.net_margin || 0).toFixed(1)}%
            </span>
        </div>
        ${expenseTable}
    </div>`;
  }

  /**
   * Create shareable analytics link
   */
  generateShareableLink(analyticsData, timePeriod) {
    try {
      const shareData = {
        period: timePeriod,
        summary: {
          revenue: analyticsData.revenue?.total_revenue || 0,
          profit: analyticsData.revenue?.total_profit || 0,
          customers: analyticsData.customers?.total_customers || 0,
          products: analyticsData.products?.total_products || 0
        },
        generated: new Date().toISOString()
      };

      // In a real implementation, you would send this to your backend
      // and get a shareable URL back
      const encodedData = btoa(JSON.stringify(shareData));
      const shareUrl = `${window.location.origin}/analytics/shared/${encodedData}`;
      
      return {
        success: true,
        shareUrl,
        message: 'Shareable link generated successfully'
      };
    } catch (error) {
      console.error('Share link generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new AnalyticsExportService();