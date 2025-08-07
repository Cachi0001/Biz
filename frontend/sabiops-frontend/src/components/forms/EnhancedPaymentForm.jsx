import React, { useState, useEffect } from 'react';
import { validateRequired, validateNumber } from '../../utils/validation';

const EnhancedPaymentForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    amount: initialData.amount || '',
    payment_method_id: initialData.payment_method_id || '',
    description: initialData.description || '',
    is_pos_transaction: initialData.is_pos_transaction || false,
    pos_account_name: initialData.pos_account_name || '',
    transaction_type: initialData.transaction_type || 'Sale',
    pos_reference_number: initialData.pos_reference_number || '',
    sale_id: initialData.sale_id || '',
    invoice_id: initialData.invoice_id || ''
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.amount)) {
      newErrors.amount = 'Amount is required';
    } else if (!validateNumber(formData.amount)) {
      newErrors.amount = 'Amount must be a valid positive number';
    }

    if (!validateRequired(formData.payment_method_id)) {
      newErrors.payment_method_id = 'Payment method is required';
    }

    // Validate POS fields if POS transaction
    if (formData.is_pos_transaction) {
      if (!validateRequired(formData.pos_account_name)) {
        newErrors.pos_account_name = 'POS account name is required for POS transactions';
      }
      if (!validateRequired(formData.pos_reference_number)) {
        newErrors.pos_reference_number = 'POS reference number is required for POS transactions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPaymentMethod = paymentMethods.find(
    method => method.id === formData.payment_method_id
  );

  const showPosFields = formData.is_pos_transaction || 
    (selectedPaymentMethod && selectedPaymentMethod.is_pos);

  return (
    <div className="enhanced-payment-form">
      <h3>Record Payment</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount" className="form-label">
            Amount *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className={`form-input ${errors.amount ? 'error' : ''}`}
            placeholder="Enter amount"
            step="0.01"
            min="0"
          />
          {errors.amount && <span className="error-text">{errors.amount}</span>}
        </div>

        {/* Payment Method */}
        <div className="form-group">
          <label htmlFor="payment_method_id" className="form-label">
            Payment Method *
          </label>
          <select
            id="payment_method_id"
            name="payment_method_id"
            value={formData.payment_method_id}
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

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder="Optional description"
            rows="3"
          />
        </div>

        {/* POS Transaction Checkbox */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_pos_transaction"
              checked={formData.is_pos_transaction}
              onChange={handleInputChange}
              className="form-checkbox"
            />
            This is a POS transaction
          </label>
        </div>

        {/* POS Fields (conditional) */}
        {showPosFields && (
          <>
            <div className="form-group">
              <label htmlFor="pos_account_name" className="form-label">
                POS Account Name *
              </label>
              <input
                type="text"
                id="pos_account_name"
                name="pos_account_name"
                value={formData.pos_account_name}
                onChange={handleInputChange}
                className={`form-input ${errors.pos_account_name ? 'error' : ''}`}
                placeholder="e.g., Moniepoint POS, OPay POS"
              />
              {errors.pos_account_name && (
                <span className="error-text">{errors.pos_account_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="transaction_type" className="form-label">
                Transaction Type
              </label>
              <select
                id="transaction_type"
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="Sale">Sale</option>
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="Refund">Refund</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pos_reference_number" className="form-label">
                POS Reference Number *
              </label>
              <input
                type="text"
                id="pos_reference_number"
                name="pos_reference_number"
                value={formData.pos_reference_number}
                onChange={handleInputChange}
                className={`form-input ${errors.pos_reference_number ? 'error' : ''}`}
                placeholder="Reference number from POS terminal"
              />
              {errors.pos_reference_number && (
                <span className="error-text">{errors.pos_reference_number}</span>
              )}
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedPaymentForm;