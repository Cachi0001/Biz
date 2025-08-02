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
 * Downloads sales data as CSV
 * @param {Array} sales - Array of sales objects
 * @param {string} filename - Optional filename
 */
export const downloadSalesCSV = (sales, filename) => {
  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'product_name', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit_price', label: 'Unit Price (₦)' },
    { key: 'total_amount', label: 'Total Amount (₦)' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'notes', label: 'Notes' }
  ];
  
  const totalAmount = sales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  const totalQuantity = sales.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0);
  
  const options = {
    title: 'SALES REPORT',
    dateRange: `Generated on ${new Date().toLocaleDateString()}`,
    summary: [
      { label: 'Total Sales', value: `₦${totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
      { label: 'Total Transactions', value: sales.length },
      { label: 'Total Items Sold', value: totalQuantity },
      { label: 'Average Sale', value: `₦${(totalAmount / sales.length || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` }
    ]
  };
  
  return downloadCSV(
    sales, 
    headers, 
    filename || `sales-${new Date().toISOString().split('T')[0]}`,
    options
  );
};

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