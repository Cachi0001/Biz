import { handleApiError, showToast } from '../utils/errorHandling';

class DataIntegrityService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  // Get authorization headers
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Run all data integrity checks
  async runAllChecks() {
    try {
      const checks = [
        'inventory-sync',
        'transaction-integrity', 
        'customer-stats',
        'invoice-status',
        'dashboard-metrics',
        'orphaned-records'
      ];

      const results = [];
      
      for (const check of checks) {
        try {
          const response = await fetch(`${this.baseUrl}/api/data-integrity/${check}`, {
            method: 'POST',
            headers: this.getHeaders()
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || `Failed to run ${check}`);
          }

          results.push({
            id: check,
            name: this.getCheckName(check),
            status: 'success',
            ...data
          });
        } catch (error) {
          results.push({
            id: check,
            name: this.getCheckName(check),
            status: 'error',
            message: handleApiError(error),
            issues_found: 0,
            fixed_count: 0
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to run data integrity checks'));
    }
  }

  // Run individual check
  async runSingleCheck(checkId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-integrity/${checkId}`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to run ${checkId}`);
      }

      return {
        id: checkId,
        name: this.getCheckName(checkId),
        status: 'success',
        ...data
      };
    } catch (error) {
      return {
        id: checkId,
        name: this.getCheckName(checkId),
        status: 'error',
        message: handleApiError(error),
        issues_found: 0,
        fixed_count: 0
      };
    }
  }

  // Get human-readable check names
  getCheckName(checkId) {
    const names = {
      'inventory-sync': 'Inventory Synchronization',
      'transaction-integrity': 'Transaction Integrity',
      'customer-stats': 'Customer Statistics',
      'invoice-status': 'Invoice Status Sync',
      'dashboard-metrics': 'Dashboard Metrics',
      'orphaned-records': 'Orphaned Records'
    };
    return names[checkId] || checkId;
  }

  // Automatic inventory update when sale is created
  async updateInventoryOnSale(saleData) {
    try {
      if (!saleData.product_id || !saleData.quantity) {
        return; // No product or quantity to update
      }

      // This would typically be handled by the backend trigger
      // But we can add a manual check here for immediate UI updates
      const response = await fetch(`${this.baseUrl}/api/data-integrity/inventory-sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          product_id: saleData.product_id,
          quantity_sold: saleData.quantity
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update inventory');
      }

      return await response.json();
    } catch (error) {
      console.error('Inventory update error:', error);
      // Don't throw error here as it's a background operation
      return null;
    }
  }

  // Ensure transaction record exists for sale/expense
  async ensureTransactionRecord(recordType, recordId, recordData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-integrity/transaction-integrity`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          record_type: recordType,
          record_id: recordId,
          record_data: recordData
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to ensure transaction record');
      }

      return await response.json();
    } catch (error) {
      console.error('Transaction record error:', error);
      return null;
    }
  }

  // Validate data consistency before operations
  async validateDataConsistency(dataType, data) {
    const validations = {
      sale: this.validateSaleData,
      expense: this.validateExpenseData,
      invoice: this.validateInvoiceData,
      customer: this.validateCustomerData,
      product: this.validateProductData
    };

    const validator = validations[dataType];
    if (!validator) {
      return { valid: true, errors: [] };
    }

    return validator(data);
  }

  // Individual validation functions
  validateSaleData(data) {
    const errors = [];
    
    if (!data.product_name) {
      errors.push('Product name is required');
    }
    
    if (!data.quantity || data.quantity <= 0) {
      errors.push('Valid quantity is required');
    }
    
    if (!data.unit_price || data.unit_price <= 0) {
      errors.push('Valid unit price is required');
    }
    
    if (!data.total_amount || data.total_amount <= 0) {
      errors.push('Valid total amount is required');
    }

    // Check if total_amount matches quantity * unit_price
    const expectedTotal = (data.quantity || 0) * (data.unit_price || 0);
    if (Math.abs((data.total_amount || 0) - expectedTotal) > 0.01) {
      errors.push('Total amount does not match quantity × unit price');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateExpenseData(data) {
    const errors = [];
    
    if (!data.category) {
      errors.push('Expense category is required');
    }
    
    if (!data.amount || data.amount <= 0) {
      errors.push('Valid expense amount is required');
    }
    
    if (!data.description) {
      errors.push('Expense description is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateInvoiceData(data) {
    const errors = [];
    
    if (!data.customer_name && !data.customer_id) {
      errors.push('Customer information is required');
    }
    
    if (!data.amount || data.amount <= 0) {
      errors.push('Valid invoice amount is required');
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Invoice items are required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateCustomerData(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Customer name is required');
    }
    
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Valid email address is required');
    }
    
    if (data.phone && !this.isValidNigerianPhone(data.phone)) {
      errors.push('Valid Nigerian phone number is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateProductData(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }
    
    if (!data.price || data.price <= 0) {
      errors.push('Valid selling price is required');
    }
    
    if (data.quantity !== undefined && data.quantity < 0) {
      errors.push('Quantity cannot be negative');
    }
    
    if (data.cost_price && data.cost_price < 0) {
      errors.push('Cost price cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Utility validation functions
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidNigerianPhone(phone) {
    // Nigerian phone number patterns
    const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }
}

// Export singleton instance
export default new DataIntegrityService();