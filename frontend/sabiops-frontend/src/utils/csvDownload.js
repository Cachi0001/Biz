/**
 * CSV Download Utility
 * Provides clean, well-formatted CSV download functionality
 */

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 * @param {string} value - The value to escape
 * @returns {string} - The escaped value
 */
const escapeCSVField = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Converts array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with {key, label} format
 * @param {string} filename - Name of the file to download
 * @param {Object} options - Additional options
 */
export const downloadCSV = (data, headers, filename, options = {}) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data available to download');
    }

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      throw new Error('Headers are required for CSV download');
    }

    // Create CSV content
    const csvRows = [];
    
    // Add title if provided
    if (options.title) {
      csvRows.push(escapeCSVField(options.title));
      csvRows.push(''); // Empty line
    }
    
    // Add date range if provided
    if (options.dateRange) {
      csvRows.push(`Report Period: ${escapeCSVField(options.dateRange)}`);
      csvRows.push(''); // Empty line
    }
    
    // Add headers
    const headerRow = headers.map(header => 
      escapeCSVField(typeof header === 'string' ? header : header.label)
    );
    csvRows.push(headerRow.join(','));
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        const key = typeof header === 'string' ? header : header.key;
        const value = item[key];
        
        // Handle different data types
        if (typeof value === 'number') {
          return value.toString();
        } else if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        } else if (value instanceof Date) {
          return escapeCSVField(value.toISOString().split('T')[0]);
        } else {
          return escapeCSVField(value);
        }
      });
      csvRows.push(row.join(','));
    });
    
    // Add summary if provided
    if (options.summary && Array.isArray(options.summary)) {
      csvRows.push(''); // Empty line
      csvRows.push('SUMMARY');
      options.summary.forEach(summaryItem => {
        if (typeof summaryItem === 'string') {
          csvRows.push(escapeCSVField(summaryItem));
        } else if (summaryItem.label && summaryItem.value !== undefined) {
          const summaryRow = new Array(headers.length).fill('');
          summaryRow[0] = escapeCSVField(summaryItem.label);
          summaryRow[summaryRow.length - 1] = escapeCSVField(summaryItem.value);
          csvRows.push(summaryRow.join(','));
        }
      });
    }
    
    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
};

/**
 * Downloads expenses data as CSV
 * @param {Array} expenses - Array of expense objects
 * @param {string} filename - Optional filename
 */
export const downloadExpensesCSV = (expenses, filename) => {
  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'category', label: 'Category' },
    { key: 'subcategory', label: 'Subcategory' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount (₦)' },
    { key: 'vendor', label: 'Vendor/Supplier' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'reference', label: 'Reference' },
    { key: 'tax_deductible', label: 'Tax Deductible' },
    { key: 'notes', label: 'Notes' }
  ];
  
  const totalAmount = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  
  const options = {
    title: 'EXPENSES REPORT',
    dateRange: `Generated on ${new Date().toLocaleDateString()}`,
    summary: [
      { label: 'Total Expenses', value: `₦${totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
      { label: 'Number of Expenses', value: expenses.length }
    ]
  };
  
  return downloadCSV(
    expenses, 
    headers, 
    filename || `expenses-${new Date().toISOString().split('T')[0]}`,
    options
  );
};

/**
 * Downloads sales data as well-structured HTML report
 * @param {Array} sales - Array of sales objects
 * @param {string} filename - Optional filename
 */
export const downloadSalesHTML = (sales, filename) => {
  try {
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      throw new Error('No sales data available to download');
    }



    const totalAmount = sales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
    const totalQuantity = sales.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0);
    const averageSale = totalAmount / sales.length || 0;
    
    // Calculate Net Profit and Daily Profit from the 'profit' field in sales data
    const totalProfit = sales.reduce((sum, sale) => sum + (parseFloat(sale.profit) || 0), 0);
    const netProfit = totalProfit;
    const dailyProfit = totalProfit;
    
    // Group sales by payment method
    const paymentMethodBreakdown = sales.reduce((acc, sale) => {
      const method = sale.payment_method || 'Unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count += 1;
      acc[method].total += parseFloat(sale.total_amount) || 0;
      return acc;
    }, {});

    // Group sales by customer
    const customerBreakdown = sales.reduce((acc, sale) => {
      const customer = sale.customer_name || 'Unknown Customer';
      if (!acc[customer]) {
        acc[customer] = { count: 0, total: 0 };
      }
      acc[customer].count += 1;
      acc[customer].total += parseFloat(sale.total_amount) || 0;
      return acc;
    }, {});

    const timestamp = new Date().toLocaleString();
    const reportDate = new Date().toISOString().split('T')[0];
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Report - ${reportDate}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #16a34a, #059669); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 2em; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #16a34a; font-size: 1.1em; }
        .summary-card .value { font-size: 1.5em; font-weight: bold; color: #1f2937; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 5px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background: #16a34a; color: white; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background-color: #f9fafb; }
        tr:hover { background-color: #f3f4f6; }
        .amount { text-align: right; font-weight: bold; color: #16a34a; }
        .breakdown-table { margin-top: 15px; }
        .breakdown-table th { background: #059669; }
        .footer { margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center; color: #6b7280; }
        @media print { body { margin: 0; } .header { background: #16a34a !important; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Sales Report</h1>
        <p>Generated on ${timestamp}</p>
        <p>Total Records: ${sales.length} transactions</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>💰 Total Revenue</h3>
            <div class="value">₦${totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <h3>🛒 Total Transactions</h3>
            <div class="value">${sales.length}</div>
        </div>
        <div class="summary-card">
            <h3>📦 Items Sold</h3>
            <div class="value">${totalQuantity}</div>
        </div>
        <div class="summary-card">
            <h3>📈 Average Sale</h3>
            <div class="value">₦${averageSale.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <h3>💰 Net Profit</h3>
            <div class="value">₦${netProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
            <h3>📊 Daily Profit</h3>
            <div class="value">₦${dailyProfit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
        </div>
    </div>

    <div class="section">
        <h2>💳 Payment Method Breakdown</h2>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Payment Method</th>
                    <th style="text-align: right;">Transactions</th>
                    <th style="text-align: right;">Total Amount</th>
                    <th style="text-align: right;">Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(paymentMethodBreakdown).map(([method, data]) => `
                    <tr>
                        <td>${method}</td>
                        <td style="text-align: right;">${data.count}</td>
                        <td style="text-align: right;">₦${data.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                        <td style="text-align: right;">${((data.total / totalAmount) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>👥 Top Customers</h2>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th style="text-align: right;">Transactions</th>
                    <th style="text-align: right;">Total Amount</th>
                    <th style="text-align: right;">Average Order</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(customerBreakdown).map(([customer, data]) => `
                    <tr>
                        <td>${customer}</td>
                        <td style="text-align: right;">${data.count}</td>
                        <td style="text-align: right;">₦${data.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                        <td style="text-align: right;">₦${(data.total / data.count).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>📋 Detailed Sales Transactions</h2>
        <table>
            <thead>
                <tr>
                    <th style="text-align: center;">Date</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th style="text-align: right;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                    <th style="text-align: center;">Payment</th>
                </tr>
            </thead>
            <tbody>
                ${sales.map(sale => `
                    <tr>
                        <td style="text-align: center;">${new Date(sale.date).toLocaleDateString()}</td>
                        <td>${sale.customer_name || 'Walk-in Customer'}</td>
                        <td>${sale.product_name || 'N/A'}</td>
                        <td style="text-align: right;">${sale.quantity || 1}</td>
                        <td style="text-align: right;" class="amount">₦${parseFloat(sale.unit_price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                        <td style="text-align: right;" class="amount">₦${parseFloat(sale.total_amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                        <td style="text-align: center;">${sale.payment_method || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p><strong>SabiOps Business Management Platform</strong></p>
        <p>This report was generated automatically on ${timestamp}</p>
        <p>For support, visit: <a href="https://sabiops.vercel.app">sabiops.com</a></p>
    </div>
</body>
</html>
    `;

    // Create and download the HTML file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `sales-report-${reportDate}.html`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Sales report downloaded successfully as HTML' };
  } catch (error) {
    console.error('Sales HTML export failed:', error);
    return { success: false, error: error.message };
  }
};

// Keep the old CSV function for backward compatibility but rename it
export const downloadSalesCSV = downloadSalesHTML;

/**
 * Downloads customers data as CSV
 * @param {Array} customers - Array of customer objects
 * @param {string} filename - Optional filename
 */
export const downloadCustomersCSV = (customers, filename) => {
  const headers = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'created_at', label: 'Date Added' }
  ];
  
  const options = {
    title: 'CUSTOMERS REPORT',
    dateRange: `Generated on ${new Date().toLocaleDateString()}`,
    summary: [
      { label: 'Total Customers', value: customers.length }
    ]
  };
  
  return downloadCSV(
    customers, 
    headers, 
    filename || `customers-${new Date().toISOString().split('T')[0]}`,
    options
  );
};

/**
 * Downloads products data as CSV
 * @param {Array} products - Array of product objects
 * @param {string} filename - Optional filename
 */
export const downloadProductsCSV = (products, filename) => {
  const headers = [
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price (₦)' },
    { key: 'cost_price', label: 'Cost Price (₦)' },
    { key: 'quantity', label: 'Stock Quantity' },
    { key: 'low_stock_threshold', label: 'Low Stock Threshold' },
    { key: 'description', label: 'Description' },
    { key: 'created_at', label: 'Date Added' }
  ];
  
  const totalValue = products.reduce((sum, product) => {
    const price = parseFloat(product.price) || 0;
    const quantity = parseInt(product.quantity) || 0;
    return sum + (price * quantity);
  }, 0);
  
  const options = {
    title: 'PRODUCTS INVENTORY REPORT',
    dateRange: `Generated on ${new Date().toLocaleDateString()}`,
    summary: [
      { label: 'Total Products', value: products.length },
      { label: 'Total Inventory Value', value: `₦${totalValue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` }
    ]
  };
  
  return downloadCSV(
    products, 
    headers, 
    filename || `products-${new Date().toISOString().split('T')[0]}`,
    options
  );
};

/**
 * Downloads invoices data as CSV
 * @param {Array} invoices - Array of invoice objects
 * @param {string} filename - Optional filename
 */
export const downloadInvoicesCSV = (invoices, filename) => {
  const headers = [
    { key: 'invoice_number', label: 'Invoice Number' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total_amount', label: 'Total Amount (₦)' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' }
  ];
  
  const totalAmount = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.total_amount) || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  
  const options = {
    title: 'INVOICES REPORT',
    dateRange: `Generated on ${new Date().toLocaleDateString()}`,
    summary: [
      { label: 'Total Invoices', value: invoices.length },
      { label: 'Total Amount', value: `₦${totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
      { label: 'Paid Invoices', value: paidInvoices },
      { label: 'Pending Invoices', value: pendingInvoices }
    ]
  };
  
  return downloadCSV(
    invoices, 
    headers, 
    filename || `invoices-${new Date().toISOString().split('T')[0]}`,
    options
  );
};

/**
 * Downloads transactions data as CSV
 * @param {Array} transactions - Array of transaction objects
 * @param {string} filename - Optional filename
 */
export const downloadTransactionsCSV = (transactions, filename) => {
  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'product_name', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit_price', label: 'Unit Price (₦)' },
    { key: 'total_amount', label: 'Total Amount (₦)' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'transaction_type', label: 'Transaction Type' },
    { key: 'status', label: 'Status' }
  ];
  
  const totalAmount = transactions.reduce((sum, transaction) => sum + (parseFloat(transaction.total_amount) || 0), 0);
  const totalQuantity = transactions.reduce((sum, transaction) => sum + (parseInt(transaction.quantity) || 0), 0);
  
  const options = {
    title: 'TRANSACTION HISTORY REPORT',
    dateRange: `Generated on ${new Date().toLocaleDateString()}`,
    summary: [
      { label: 'Total Amount', value: `₦${totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
      { label: 'Total Transactions', value: transactions.length },
      { label: 'Total Items', value: totalQuantity },
      { label: 'Average Transaction', value: `₦${(totalAmount / transactions.length || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` }
    ]
  };
  
  return downloadCSV(
    transactions, 
    headers, 
    filename || `transactions-${new Date().toISOString().split('T')[0]}`,
    options
  );
};