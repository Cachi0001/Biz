// Offline functionality service for sales, products, and expenses
import autoGenerateService from './autoGenerateService';

class OfflineService {
  constructor() {
    this.storageKeys = {
      sales: 'sabiops_offline_sales',
      products: 'sabiops_offline_products',
      expenses: 'sabiops_offline_expenses',
      customers: 'sabiops_offline_customers',
      sync_queue: 'sabiops_sync_queue'
    };
    
    this.isOnline = navigator.onLine;
    this.setupOnlineListener();
  }

  // Setup online/offline event listeners
  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - starting sync...');
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📱 Gone offline - enabling offline mode...');
    });
  }

  // Get data from localStorage
  getOfflineData(type) {
    try {
      const data = localStorage.getItem(this.storageKeys[type]);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to get offline ${type} data:`, error);
      return [];
    }
  }

  // Save data to localStorage
  saveOfflineData(type, data) {
    try {
      localStorage.setItem(this.storageKeys[type], JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to save offline ${type} data:`, error);
      return false;
    }
  }

  // Add item to sync queue
  addToSyncQueue(type, action, data) {
    try {
      const queue = this.getOfflineData('sync_queue');
      queue.push({
        id: autoGenerateService.generateTransactionId('SYNC'),
        type,
        action, // 'create', 'update', 'delete'
        data,
        timestamp: new Date().toISOString(),
        synced: false
      });
      this.saveOfflineData('sync_queue', queue);
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  // OFFLINE SALES FUNCTIONALITY
  createOfflineSale(saleData) {
    try {
      const sales = this.getOfflineData('sales');
      
      const newSale = {
        ...saleData,
        id: autoGenerateService.generateTransactionId('SALE'),
        receipt_number: autoGenerateService.generateReceiptNumber(),
        created_at: new Date().toISOString(),
        offline_created: true,
        synced: false
      };

      // Auto-generate POS reference if needed
      if (saleData.payment_method?.includes('pos') && !saleData.pos_reference) {
        newSale.pos_reference = autoGenerateService.generatePOSReference(saleData.pos_account);
      }

      sales.push(newSale);
      this.saveOfflineData('sales', sales);
      
      // Add to sync queue
      this.addToSyncQueue('sales', 'create', newSale);
      
      console.log('💾 Sale saved offline:', newSale);
      return newSale;
    } catch (error) {
      console.error('Failed to create offline sale:', error);
      throw error;
    }
  }

  getOfflineSales() {
    return this.getOfflineData('sales');
  }

  // OFFLINE PRODUCTS FUNCTIONALITY
  createOfflineProduct(productData) {
    try {
      const products = this.getOfflineData('products');
      
      const newProduct = {
        ...productData,
        id: autoGenerateService.generateTransactionId('PROD'),
        sku: productData.sku || autoGenerateService.generateSKU(productData.name, productData.category),
        created_at: new Date().toISOString(),
        offline_created: true,
        synced: false
      };

      products.push(newProduct);
      this.saveOfflineData('products', products);
      
      // Add to sync queue
      this.addToSyncQueue('products', 'create', newProduct);
      
      console.log('💾 Product saved offline:', newProduct);
      return newProduct;
    } catch (error) {
      console.error('Failed to create offline product:', error);
      throw error;
    }
  }

  updateOfflineProduct(productId, updateData) {
    try {
      const products = this.getOfflineData('products');
      const index = products.findIndex(p => p.id === productId);
      
      if (index === -1) {
        throw new Error('Product not found');
      }

      products[index] = {
        ...products[index],
        ...updateData,
        updated_at: new Date().toISOString(),
        synced: false
      };

      this.saveOfflineData('products', products);
      
      // Add to sync queue
      this.addToSyncQueue('products', 'update', products[index]);
      
      console.log('💾 Product updated offline:', products[index]);
      return products[index];
    } catch (error) {
      console.error('Failed to update offline product:', error);
      throw error;
    }
  }

  getOfflineProducts() {
    return this.getOfflineData('products');
  }

  // OFFLINE EXPENSES FUNCTIONALITY
  createOfflineExpense(expenseData) {
    try {
      const expenses = this.getOfflineData('expenses');
      
      const newExpense = {
        ...expenseData,
        id: autoGenerateService.generateTransactionId('EXP'),
        reference_number: autoGenerateService.generateExpenseReference(),
        created_at: new Date().toISOString(),
        offline_created: true,
        synced: false
      };

      expenses.push(newExpense);
      this.saveOfflineData('expenses', expenses);
      
      // Add to sync queue
      this.addToSyncQueue('expenses', 'create', newExpense);
      
      console.log('💾 Expense saved offline:', newExpense);
      return newExpense;
    } catch (error) {
      console.error('Failed to create offline expense:', error);
      throw error;
    }
  }

  getOfflineExpenses() {
    return this.getOfflineData('expenses');
  }

  // OFFLINE CUSTOMERS FUNCTIONALITY
  createOfflineCustomer(customerData) {
    try {
      const customers = this.getOfflineData('customers');
      
      const newCustomer = {
        ...customerData,
        id: autoGenerateService.generateTransactionId('CUST'),
        created_at: new Date().toISOString(),
        offline_created: true,
        synced: false
      };

      customers.push(newCustomer);
      this.saveOfflineData('customers', customers);
      
      // Add to sync queue
      this.addToSyncQueue('customers', 'create', newCustomer);
      
      console.log('💾 Customer saved offline:', newCustomer);
      return newCustomer;
    } catch (error) {
      console.error('Failed to create offline customer:', error);
      throw error;
    }
  }

  getOfflineCustomers() {
    return this.getOfflineData('customers');
  }

  // SYNC FUNCTIONALITY
  async syncOfflineData() {
    if (!this.isOnline) {
      console.log('📱 Still offline, skipping sync');
      return;
    }

    try {
      const syncQueue = this.getOfflineData('sync_queue');
      const unsynced = syncQueue.filter(item => !item.synced);
      
      console.log(`🔄 Syncing ${unsynced.length} offline items...`);
      
      for (const item of unsynced) {
        try {
          await this.syncSingleItem(item);
          
          // Mark as synced
          item.synced = true;
          item.synced_at = new Date().toISOString();
          
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          // Continue with other items
        }
      }
      
      // Update sync queue
      this.saveOfflineData('sync_queue', syncQueue);
      
      console.log('✅ Offline sync completed');
      
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  async syncSingleItem(item) {
    // This would integrate with your actual API
    // For now, just simulate the sync
    console.log(`🔄 Syncing ${item.type} ${item.action}:`, item.data);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, you would:
    // 1. Call the appropriate API endpoint
    // 2. Handle success/failure
    // 3. Update local data with server response
    
    return true;
  }

  // Get sync status
  getSyncStatus() {
    const syncQueue = this.getOfflineData('sync_queue');
    const unsynced = syncQueue.filter(item => !item.synced);
    
    return {
      isOnline: this.isOnline,
      totalItems: syncQueue.length,
      unsyncedItems: unsynced.length,
      lastSync: syncQueue.length > 0 ? 
        Math.max(...syncQueue.filter(item => item.synced).map(item => new Date(item.synced_at || 0))) : null
    };
  }

  // Clear all offline data (use with caution)
  clearOfflineData() {
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ All offline data cleared');
  }

  // Get all offline data for export/backup
  exportOfflineData() {
    const data = {};
    Object.entries(this.storageKeys).forEach(([type, key]) => {
      data[type] = this.getOfflineData(type);
    });
    return data;
  }
}

// Create singleton instance
const offlineService = new OfflineService();

export default offlineService;