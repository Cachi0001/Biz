// Unified caching logic for dropdown services
class DropdownCache {
  constructor() {
    this.cache = new Map();
    this.subscribers = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Set cache with TTL
  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      data,
      expiresAt,
      timestamp: Date.now()
    });
    
    // Notify subscribers
    this.notifySubscribers(key, data);
  }

  // Get cache data
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Check if cache has valid data
  has(key) {
    return this.get(key) !== null;
  }

  // Clear specific cache or all
  clear(key = null) {
    if (key) {
      this.cache.delete(key);
      this.notifySubscribers(key, null);
    } else {
      this.cache.clear();
      // Notify all subscribers
      this.subscribers.forEach((callbacks, cacheKey) => {
        this.notifySubscribers(cacheKey, null);
      });
    }
  }

  // Subscribe to cache changes
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Notify subscribers of cache changes
  notifySubscribers(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in cache subscriber callback:', error);
        }
      });
    }
  }

  // Get cache stats
  getStats() {
    const stats = {
      totalKeys: this.cache.size,
      subscribers: this.subscribers.size,
      keys: []
    };

    this.cache.forEach((value, key) => {
      stats.keys.push({
        key,
        size: JSON.stringify(value.data).length,
        age: Date.now() - value.timestamp,
        expiresIn: value.expiresAt - Date.now()
      });
    });

    return stats;
  }

  // Preload cache with data
  preload(key, dataPromise, ttl = this.defaultTTL) {
    return dataPromise
      .then(data => {
        this.set(key, data, ttl);
        return data;
      })
      .catch(error => {
        console.error(`Failed to preload cache for ${key}:`, error);
        throw error;
      });
  }
}

// Create singleton instance
const dropdownCache = new DropdownCache();

export default dropdownCache;