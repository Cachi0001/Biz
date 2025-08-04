// Product service with caching and subscription mechanisms
import api from './api';
import dropdownCache from './dropdownCache';

class ProductService {
  constructor() {
    this.cacheKey = 'products';
    this.isLoading = false;
    this.lastError = null;
  }

  // Fetch products with caching
  async getProducts(forceRefresh = false) {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && dropdownCache.has(this.cacheKey)) {
      return dropdownCache.get(this.cacheKey);
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      return new Promise((resolve, reject) => {
        const unsubscribe = dropdownCache.subscribe(this.cacheKey, (data) => {
          unsubscribe();
          if (data) {
            resolve(data);
          } else if (this.lastError) {
            reject(this.lastError);
          }
        });
      });
    }

    this.isLoading = true;
    this.lastError = null;

    try {
      const response = await api.get('/products');
      const products = this.formatProducts(response.data);
      
      // Cache the data
      dropdownCache.set(this.cacheKey, products);
      
      this.isLoading = false;
      return products;
    } catch (error) {
      this.isLoading = false;
      this.lastError = error;
      
      console.error('Failed to fetch products:', error);
      
      // Return cached data if available, even if stale
      const cachedData = dropdownCache.get(this.cacheKey);
      if (cachedData) {
        console.warn('Using stale product data due to API error');
        return cachedData;
      }
      
      throw error;
    }
  }

  // Format products for dropdown consumption
  formatProducts(rawProducts) {
    if (!Array.isArray(rawProducts)) {
      console.warn('Invalid products data format:', rawProducts);
      return [];
    }

    return rawProducts.map(product => ({
      id: product.id?.toString() || '',
      name: product.name || product.product_name || 'Unknown Product',
      price: parseFloat(product.price || product.selling_price || 0),
      cost: parseFloat(product.cost || product.cost_price || 0),
      quantity: parseInt(product.quantity || product.stock_quantity || 0),
      category: product.category || '',
      description: product.description || '',
      isOutOfStock: parseInt(product.quantity || product.stock_quantity || 0) <= 0,
      isLowStock: parseInt(product.quantity || product.stock_quantity || 0) <= (product.low_stock_threshold || 5)
    }));
  }

  // Get product by ID
  async getProductById(productId) {
    if (!productId) return null;

    try {
      const products = await this.getProducts();
      return products.find(product => product.id === productId.toString()) || null;
    } catch (error) {
      console.error('Failed to get product by ID:', error);
      return null;
    }
  }

  // Search products by name
  async searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.getProducts();
    }

    try {
      const products = await this.getProducts();
      const term = searchTerm.toLowerCase().trim();
      
      return products.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  }

  // Get products with stock information
  async getProductsWithStock() {
    try {
      const products = await this.getProducts();
      return products.map(product => ({
        ...product,
        stockStatus: this.getStockStatus(product),
        displayText: this.getProductDisplayText(product)
      }));
    } catch (error) {
      console.error('Failed to get products with stock:', error);
      return [];
    }
  }

  // Get stock status for a product
  getStockStatus(product) {
    if (product.isOutOfStock) return 'out-of-stock';
    if (product.isLowStock) return 'low-stock';
    return 'in-stock';
  }

  // Get display text for product dropdown
  getProductDisplayText(product, showQuantity = true, showPrice = true) {
    let displayText = product.name;
    
    if (showPrice && product.price > 0) {
      displayText += ` - ₦${product.price.toLocaleString()}`;
    }
    
    if (showQuantity) {
      displayText += ` - Qty: ${product.quantity}`;
    }
    
    return displayText;
  }

  // Subscribe to product data changes
  subscribe(callback) {
    return dropdownCache.subscribe(this.cacheKey, callback);
  }

  // Invalidate product cache
  invalidateCache() {
    dropdownCache.clear(this.cacheKey);
  }

  // Add new product and update cache
  async addProduct(productData) {
    try {
      const response = await api.post('/products', productData);
      
      // Refresh cache to include new product
      await this.getProducts(true);
      
      return response.data;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  }

  // Update product and refresh cache
  async updateProduct(productId, productData) {
    try {
      const response = await api.put(`/products/${productId}`, productData);
      
      // Refresh cache to reflect updates
      await this.getProducts(true);
      
      return response.data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }

  // Delete product and refresh cache
  async deleteProduct(productId) {
    try {
      const response = await api.delete(`/products/${productId}`);
      
      // Refresh cache to remove deleted product
      await this.getProducts(true);
      
      return response.data;
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  }

  // Update product stock
  async updateProductStock(productId, newQuantity) {
    try {
      const response = await api.patch(`/products/${productId}/stock`, {
        quantity: newQuantity
      });
      
      // Refresh cache to reflect stock updates
      await this.getProducts(true);
      
      return response.data;
    } catch (error) {
      console.error('Failed to update product stock:', error);
      throw error;
    }
  }

  // Retry failed requests
  async retry() {
    this.lastError = null;
    return this.getProducts(true);
  }

  // Get service status
  getStatus() {
    return {
      isLoading: this.isLoading,
      hasError: !!this.lastError,
      error: this.lastError,
      cacheStatus: dropdownCache.has(this.cacheKey) ? 'cached' : 'empty',
      lastUpdated: dropdownCache.get(this.cacheKey) ? 
        new Date(dropdownCache.cache.get(this.cacheKey)?.timestamp).toISOString() : null
    };
  }

  // Get low stock products
  async getLowStockProducts() {
    try {
      const products = await this.getProducts();
      return products.filter(product => product.isLowStock && !product.isOutOfStock);
    } catch (error) {
      console.error('Failed to get low stock products:', error);
      return [];
    }
  }

  // Get out of stock products
  async getOutOfStockProducts() {
    try {
      const products = await this.getProducts();
      return products.filter(product => product.isOutOfStock);
    } catch (error) {
      console.error('Failed to get out of stock products:', error);
      return [];
    }
  }
}

// Create singleton instance
const productService = new ProductService();

export default productService;