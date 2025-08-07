import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { validateRequired, validateNumber } from '../../utils/validation';

const EnhancedCreditSalesManager = () => {
  const [creditSales, setCreditSales] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method_id: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCreditSales();
    fetchPaymentMethods();
  }, []);

  const fetchCreditSales = async () => {
    try {
      const response = await fetch('/api/sales?payment_status=Credit,Pending,Partially Paid', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCreditSales(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching credit sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handlePaymentClick = (sale) => {
    setSelectedSale(sale);
    setPaymentData({
      amount: sale.amount_due.toString(),
      payment_method_id: '',
      notes: ''
    });
    setShowPaymentForm(true);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePaymentForm = () => {
    const newErrors = {};

    if (!validateRequired(paymentData.amount)) {
      newErrors.amount = 'Payment amount is required';
    } else if (!validateNumber(paymentData.amount)) {
      newErrors.amount = 'Payment amount must be a valid positive number';
    } else if (parseFloat(paymentData.amount) > selectedSale.amount_due) {
      newErrors.amount = 'Payment amount cannot exceed amount due';
    }

    if (!validateRequired(paymentData.payment_method_id)) {
      newErrors.payment_method_id = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/sales/${selectedSale.id}/partial-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the sale in the list
        setCreditSales(prev => prev.map(sale => 
          sale.id === selectedSale.id 
            ? {
                ...sale,
                amount_paid: result.data.new_amount_paid,
                amount_due: result.data.new_amount_due,
                payment_status: result.data.new_payment_status
              }
            : sale
        ));

        // Close the form
        setShowPaymentForm(false);
        setSelectedSale(null);
        
        alert('Payment processed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    const statusClasses = {
      'Credit': 'badge-warning',
      'Pending': 'badge-info',
      'Partially Paid': 'badge-primary',
      'Paid': 'badge-success'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
        {status}
      </span>
    );
  };

  const getPaymentProgress = (amountPaid, totalAmount) => {
    const percentage = (amountPaid / totalAmount) * 100;
    return Math.round(percentage);
  };

  if (loading) {
    return (
      <div className="credit-sales-manager loading">
        <div className="loading-spinner">Loading credit sales...</div>
      </div>
    );
  }

  return (
    <div className="credit-sales-manager">
      <div className="manager-header">
        <h2>Credit Sales Management</h2>
        <div className="summary-stats">
          <div className="stat">
            <span className="label">Total Credit Sales:</span>
            <span className="value">{creditSales.length}</span>
          </div>
          <div className="stat">
            <span className="label">Total Outstanding:</span>
            <span className="value">
              {formatCurrency(
                creditSales.reduce((sum, sale) => sum + (sale.amount_due || 0), 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {creditSales.length === 0 ? (
        <div className="no-credit-sales">
          <p>No credit sales found.</p>
        </div>
      ) : (
        <div className="credit-sales-list">
          {creditSales.map(sale => (
            <div key={sale.id} className="credit-sale-card">
              <div className="sale-header">
                <div className="sale-info">
                  <h3>{sale.customer_name || 'Unknown Customer'}</h3>
                  <p className="product-name">{sale.product_name}</p>
                  <p className="sale-date">{formatDate(sale.date)}</p>
                </div>
                <div className="sale-status">
                  {getPaymentStatusBadge(sale.payment_status)}
                </div>
              </div>

              <div className="sale-amounts">
                <div className="amount-row">
                  <span className="label">Total Amount:</span>
                  <span className="value">{formatCurrency(sale.total_amount)}</span>
                </div>
                <div className="amount-row">
                  <span className="label">Amount Paid:</span>
                  <span className="value paid">{formatCurrency(sale.amount_paid || 0)}</span>
                </div>
                <div className="amount-row">
                  <span className="label">Amount Due:</span>
                  <span className="value due">{formatCurrency(sale.amount_due || 0)}</span>
                </div>
              </div>

              <div className="payment-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${getPaymentProgress(sale.amount_paid || 0, sale.total_amount)}%` 
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {getPaymentProgress(sale.amount_paid || 0, sale.total_amount)}% paid
                </span>
              </div>

              {sale.amount_due > 0 && (
                <div className="sale-actions">
                  <button
                    onClick={() => handlePaymentClick(sale)}
                    className="btn btn-primary"
                  >
                    Record Payment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="sale-summary">
                <p><strong>Customer:</strong> {selectedSale.customer_name}</p>
                <p><strong>Product:</strong> {selectedSale.product_name}</p>
                <p><strong>Amount Due:</strong> {formatCurrency(selectedSale.amount_due)}</p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="payment-form">
                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handleInputChange}
                    className={`form-input ${errors.amount ? 'error' : ''}`}
                    placeholder="Enter payment amount"
                    step="0.01"
                    min="0"
                    max={selectedSale.amount_due}
                  />
                  {errors.amount && <span className="error-text">{errors.amount}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="payment_method_id" className="form-label">
                    Payment Method *
                  </label>
                  <select
                    id="payment_method_id"
                    name="payment_method_id"
                    value={paymentData.payment_method_id}
                    onChange={handleInputChange}
                    className={`form-select ${errors.payment_method_id ? 'error' : ''}`}
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.display_name}
                      </option>
                    ))}
                  </select>
                  {errors.payment_method_id && (
                    <span className="error-text">{errors.payment_method_id}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="notes" className="form-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={paymentData.notes}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Optional notes about this payment"
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCreditSalesManager;