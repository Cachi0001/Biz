// Custom hook for product data management
import { useState, useEffect, useCallback } from 'react';
import productService from '../services/productService';

export const useProducts = (options = {}) => {
  const {
    autoLoad = true,
    includeStock = true,
    onError = null
  } = options;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load products
  const loadProducts = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const productData = includeStock 
        ? await productService.getProductsWithStock(forceRefresh)
        : await productService.getProducts(forceRefresh);

      setProducts(productData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [includeStock, onError]);

  // Refresh products
  const refresh = useCallback(() => {
    return loadProducts(true);
  }, [loadProducts]);

  // Search products
  const searchProducts = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return loadProducts();
    }

    setLoading(true);
    setError(null);

    try {
      const results = await productService.searchProducts(searchTerm);
      const finalResults = includeStock 
        ? results.map(product => ({
            ...product,
            stockStatus: productService.getStockStatus(product),
            displayText: productService.getProductDisplayText(product)
          }))
        : results;

      setProducts(finalResults);
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [includeStock, onError, loadProducts]);

  // Get product by ID
  const getProductById = useCallback(async (productId) => {
    try {
      return await productService.getProductById(productId);
    } catch (err) {
      console.error('Failed to get product by ID:', err);
      return null;
    }
  }, []);

  // Add new product
  const addProduct = useCallback(async (productData) => {
    try {
      const newProduct = await productService.addProduct(productData);
      await loadProducts(true); // Refresh list
      return newProduct;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [loadProducts, onError]);

  // Update product
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      const updatedProduct = await productService.updateProduct(productId, productData);
      await loadProducts(true); // Refresh list
      return updatedProduct;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [loadProducts, onError]);

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    try {
      const result = await productService.deleteProduct(productId);
      await loadProducts(true); // Refresh list
      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [loadProducts, onError]);

  // Update product stock
  const updateProductStock = useCallback(async (productId, newQuantity) => {
    try {
      const result = await productService.updateProductStock(productId, newQuantity);
      await loadProducts(true); // Refresh list
      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [loadProducts, onError]);

  // Get low stock products
  const getLowStockProducts = useCallback(async () => {
    try {
      return await productService.getLowStockProducts();
    } catch (err) {
      console.error('Failed to get low stock products:', err);
      return [];
    }
  }, []);

  // Get out of stock products
  const getOutOfStockProducts = useCallback(async () => {
    try {
      return await productService.getOutOfStockProducts();
    } catch (err) {
      console.error('Failed to get out of stock products:', err);
      return [];
    }
  }, []);

  // Retry failed operations
  const retry = useCallback(async () => {
    setError(null);
    return productService.retry().then(() => loadProducts(true));
  }, [loadProducts]);

  // Subscribe to product data changes
  useEffect(() => {
    const unsubscribe = productService.subscribe((data) => {
      if (data) {
        const finalProducts = includeStock 
          ? data.map(product => ({
              ...product,
              stockStatus: productService.getStockStatus(product),
              displayText: productService.getProductDisplayText(product)
            }))
          : data;

        setProducts(finalProducts);
        setLastUpdated(new Date().toISOString());
      }
    });

    return unsubscribe;
  }, [includeStock]);

  // Auto-load products on mount
  useEffect(() => {
    if (autoLoad) {
      loadProducts();
    }
  }, [autoLoad, loadProducts]);

  // Get service status
  const getStatus = useCallback(() => {
    return productService.getStatus();
  }, []);

  // Filter products by stock status
  const filterByStockStatus = useCallback((status) => {
    return products.filter(product => {
      switch (status) {
        case 'in-stock':
          return !product.isOutOfStock && !product.isLowStock;
        case 'low-stock':
          return product.isLowStock && !product.isOutOfStock;
        case 'out-of-stock':
          return product.isOutOfStock;
        default:
          return true;
      }
    });
  }, [products]);

  return {
    products,
    loading,
    error,
    lastUpdated,
    loadProducts,
    refresh,
    searchProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getLowStockProducts,
    getOutOfStockProducts,
    retry,
    getStatus,
    filterByStockStatus
  };
};