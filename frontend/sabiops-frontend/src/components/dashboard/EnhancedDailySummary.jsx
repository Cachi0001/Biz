import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';

const EnhancedDailySummary = ({ selectedDate = new Date() }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDailySummary();
  }, [selectedDate]);

  const fetchDailySummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/reports/daily-summary?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummaryData(data.data);
      } else {
        throw new Error('Failed to fetch daily summary');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadHtmlReport = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/reports/daily-summary/download?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download HTML file
        const blob = new Blob([data.html_content], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download report');
      }
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="enhanced-daily-summary loading">
        <div className="loading-spinner">Loading daily summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-daily-summary error">
        <div className="error-message">
          <h3>Error Loading Summary</h3>
          <p>{error}</p>
          <button onClick={fetchDailySummary} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="enhanced-daily-summary no-data">
        <p>No data available for {formatDate(selectedDate)}</p>
      </div>
    );
  }

  return (
    <div className="enhanced-daily-summary">
      <div className="summary-header">
        <h2>Daily Summary - {formatDate(selectedDate)}</h2>
        <button 
          onClick={downloadHtmlReport}
          className="btn btn-secondary download-btn"
        >
          Download HTML Report
        </button>
      </div>

      <div className="summary-grid">
        {/* Cash at Hand */}
        <div className="summary-card cash-summary">
          <h3>Cash at Hand</h3>
          <div className="cash-details">
            <div className="cash-item">
              <span className="label">Cash In:</span>
              <span className="amount positive">
                {formatCurrency(summaryData.cash_at_hand.cash_in)}
              </span>
            </div>
            <div className="cash-item">
              <span className="label">Cash Out:</span>
              <span className="amount negative">
                {formatCurrency(summaryData.cash_at_hand.cash_out)}
              </span>
            </div>
            <div className="cash-item total">
              <span className="label">Net Cash:</span>
              <span className={`amount ${summaryData.cash_at_hand.net_cash >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(summaryData.cash_at_hand.net_cash)}
              </span>
            </div>
            <div className="cash-item">
              <span className="label">Transactions:</span>
              <span className="count">{summaryData.cash_at_hand.transactions_count}</span>
            </div>
          </div>
        </div>

        {/* POS Totals */}
        <div className="summary-card pos-summary">
          <h3>POS Totals</h3>
          <div className="pos-details">
            <div className="pos-item">
              <span className="label">Total Deposits:</span>
              <span className="amount positive">
                {formatCurrency(summaryData.pos_totals.total_deposits)}
              </span>
            </div>
            <div className="pos-item">
              <span className="label">Total Withdrawals:</span>
              <span className="amount negative">
                {formatCurrency(summaryData.pos_totals.total_withdrawals)}
              </span>
            </div>
            <div className="pos-item total">
              <span className="label">Net POS:</span>
              <span className={`amount ${summaryData.pos_totals.net_pos >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(summaryData.pos_totals.net_pos)}
              </span>
            </div>
            <div className="pos-item">
              <span className="label">Transactions:</span>
              <span className="count">{summaryData.pos_totals.total_transactions}</span>
            </div>
          </div>

          {/* POS Accounts Breakdown */}
          {Object.keys(summaryData.pos_totals.pos_accounts).length > 0 && (
            <div className="pos-accounts">
              <h4>By POS Account</h4>
              {Object.entries(summaryData.pos_totals.pos_accounts).map(([account, data]) => (
                <div key={account} className="pos-account-item">
                  <div className="account-name">{account}</div>
                  <div className="account-details">
                    <span>Deposits: {formatCurrency(data.deposits)}</span>
                    <span>Withdrawals: {formatCurrency(data.withdrawals)}</span>
                    <span>Transactions: {data.transactions}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drinks Sales */}
        <div className="summary-card drinks-summary">
          <h3>Drinks Sales</h3>
          <div className="drinks-details">
            <div className="drinks-item">
              <span className="label">Total Amount:</span>
              <span className="amount">
                {formatCurrency(summaryData.drinks_sales.total_amount)}
              </span>
            </div>
            <div className="drinks-item">
              <span className="label">Total Quantity:</span>
              <span className="count">{summaryData.drinks_sales.total_quantity}</span>
            </div>
            <div className="drinks-item">
              <span className="label">Transactions:</span>
              <span className="count">{summaryData.drinks_sales.transactions_count}</span>
            </div>
            <div className="drinks-item">
              <span className="label">% of Total Sales:</span>
              <span className="percentage">
                {summaryData.drinks_sales.percentage_of_total_sales}%
              </span>
            </div>
          </div>
        </div>

        {/* Credit Sales Summary */}
        <div className="summary-card credit-summary">
          <h3>Credit Sales</h3>
          <div className="credit-details">
            <div className="credit-item">
              <span className="label">Outstanding Amount:</span>
              <span className="amount">
                {formatCurrency(summaryData.credit_sales_summary.total_outstanding || 0)}
              </span>
            </div>
            <div className="credit-item">
              <span className="label">Credit Sales Count:</span>
              <span className="count">{summaryData.credit_sales_summary.count || 0}</span>
            </div>
            <div className="credit-item">
              <span className="label">Overdue Sales:</span>
              <span className="count">{summaryData.credit_sales_summary.overdue_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales by Category */}
      <div className="category-sales-section">
        <h3>Sales by Category</h3>
        <div className="category-grid">
          {Object.entries(summaryData.sales_by_category).map(([category, data]) => (
            <div key={category} className="category-card">
              <h4>{category}</h4>
              <div className="category-stats">
                <div className="stat">
                  <span className="label">Amount:</span>
                  <span className="value">{formatCurrency(data.total_amount || 0)}</span>
                </div>
                <div className="stat">
                  <span className="label">Quantity:</span>
                  <span className="value">{data.total_quantity || 0}</span>
                </div>
                <div className="stat">
                  <span className="label">Transactions:</span>
                  <span className="value">{data.transactions_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-footer">
        <p className="generated-time">
          Generated at: {new Date(summaryData.generated_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default EnhancedDailySummary;