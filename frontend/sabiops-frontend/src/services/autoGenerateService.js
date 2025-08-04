// Auto-generation service for optional fields like POS reference IDs, SKUs, etc.
class AutoGenerateService {
  constructor() {
    this.storageKey = 'sabiops_auto_generate_counters';
    this.counters = this.loadCounters();
  }

  // Load counters from localStorage
  loadCounters() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {
        pos_reference: 1000,
        sku: 1000,
        invoice_number: 1000,
        receipt_number: 1000,
        expense_ref: 1000
      };
    } catch (error) {
      console.error('Failed to load auto-generate counters:', error);
      return {
        pos_reference: 1000,
        sku: 1000,
        invoice_number: 1000,
        receipt_number: 1000,
        expense_ref: 1000
      };
    }
  }

  // Save counters to localStorage
  saveCounters() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.counters));
    } catch (error) {
      console.error('Failed to save auto-generate counters:', error);
    }
  }

  // Generate POS reference number
  generatePOSReference(posAccountName = '') {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const counter = this.counters.pos_reference++;
    const accountPrefix = posAccountName.substring(0, 3).toUpperCase() || 'POS';
    
    this.saveCounters();
    return `${accountPrefix}${timestamp}${counter.toString().padStart(3, '0')}`;
  }

  // Generate SKU for products
  generateSKU(productName = '', category = '') {
    const namePrefix = productName.substring(0, 3).toUpperCase() || 'PRD';
    const categoryPrefix = category.substring(0, 2).toUpperCase() || 'GN';
    const counter = this.counters.sku++;
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits
    
    this.saveCounters();
    return `${namePrefix}${categoryPrefix}${counter.toString().padStart(4, '0')}${timestamp}`;
  }

  // Generate invoice number
  generateInvoiceNumber() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const counter = this.counters.invoice_number++;
    
    this.saveCounters();
    return `INV${year}${month}${counter.toString().padStart(4, '0')}`;
  }

  // Generate receipt number
  generateReceiptNumber() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const counter = this.counters.receipt_number++;
    
    this.saveCounters();
    return `RCP${year}${month}${day}${counter.toString().padStart(3, '0')}`;
  }

  // Generate expense reference
  generateExpenseReference() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const counter = this.counters.expense_ref++;
    
    this.saveCounters();
    return `EXP${year}${month}${counter.toString().padStart(4, '0')}`;
  }

  // Generate transaction ID
  generateTransactionId(type = 'TXN') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${type}${timestamp}${random}`;
  }

  // Reset counters (for testing or new year)
  resetCounters() {
    this.counters = {
      pos_reference: 1000,
      sku: 1000,
      invoice_number: 1000,
      receipt_number: 1000,
      expense_ref: 1000
    };
    this.saveCounters();
  }

  // Get current counter values
  getCounters() {
    return { ...this.counters };
  }
}

// Create singleton instance
const autoGenerateService = new AutoGenerateService();

export default autoGenerateService;