// POS Details Caching Service
// Stores and retrieves POS terminal details to improve user experience

class POSDetailsCache {
  constructor() {
    this.storageKey = 'sabiops_pos_details_cache';
    this.maxEntries = 5; // Store up to 5 recent POS terminals
  }

  // Initialize cache from localStorage
  initialize() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      this.cache = storedData ? JSON.parse(storedData) : {};
      
      // Ensure we have the terminals object
      if (!this.cache.terminals) {
        this.cache.terminals = [];
      }
      
      // Ensure we have the lastUsed object
      if (!this.cache.lastUsed) {
        this.cache.lastUsed = {};
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize POS details cache:', error);
      this.cache = { terminals: [], lastUsed: {} };
      return false;
    }
  }

  // Save POS details to cache
  savePOSDetails(paymentMethod, posDetails) {
    if (!this.cache) {
      this.initialize();
    }
    
    if (!posDetails || !posDetails.pos_account_name) {
      return false;
    }
    
    try {
      // Find if this terminal already exists
      const existingIndex = this.cache.terminals.findIndex(
        t => t.pos_account_name.toLowerCase() === posDetails.pos_account_name.toLowerCase()
      );
      
      // If exists, update it
      if (existingIndex >= 0) {
        this.cache.terminals[existingIndex] = {
          ...this.cache.terminals[existingIndex],
          ...posDetails,
          last_used: new Date().toISOString()
        };
      } else {
        // Add new terminal
        this.cache.terminals.push({
          ...posDetails,
          last_used: new Date().toISOString()
        });
        
        // Keep only the most recent terminals
        if (this.cache.terminals.length > this.maxEntries) {
          this.cache.terminals.sort((a, b) => 
            new Date(b.last_used) - new Date(a.last_used)
          );
          this.cache.terminals = this.cache.terminals.slice(0, this.maxEntries);
        }
      }
      
      // Save the last used terminal for this payment method
      this.cache.lastUsed[paymentMethod] = posDetails.pos_account_name;
      
      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
      
      return true;
    } catch (error) {
      console.error('Failed to save POS details to cache:', error);
      return false;
    }
  }

  // Get last used POS details for a payment method
  getLastUsedPOSDetails(paymentMethod) {
    if (!this.cache) {
      this.initialize();
    }
    
    try {
      const lastUsedName = this.cache.lastUsed[paymentMethod];
      
      if (!lastUsedName) {
        return null;
      }
      
      return this.cache.terminals.find(
        t => t.pos_account_name.toLowerCase() === lastUsedName.toLowerCase()
      );
    } catch (error) {
      console.error('Failed to get last used POS details:', error);
      return null;
    }
  }

  // Get all saved POS terminals
  getAllPOSTerminals() {
    if (!this.cache) {
      this.initialize();
    }
    
    try {
      // Sort by most recently used
      return [...this.cache.terminals].sort(
        (a, b) => new Date(b.last_used) - new Date(a.last_used)
      );
    } catch (error) {
      console.error('Failed to get all POS terminals:', error);
      return [];
    }
  }

  // Clear all cached POS details
  clearCache() {
    try {
      localStorage.removeItem(this.storageKey);
      this.cache = { terminals: [], lastUsed: {} };
      return true;
    } catch (error) {
      console.error('Failed to clear POS details cache:', error);
      return false;
    }
  }
}

// Create singleton instance
const posDetailsCache = new POSDetailsCache();
posDetailsCache.initialize();

export default posDetailsCache;