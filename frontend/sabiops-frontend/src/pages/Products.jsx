import React, { useState, useEffect, memo } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import BackButton from '../components/ui/BackButton';
import StableInput from '../components/ui/StableInput';
import DebugLogger from '../utils/debugLogger';
import useDebugRenders from '../hooks/useDebugRenders';
import CustomProductForm from '../components/forms/CustomProductForm';
import { BUSINESS_CATEGORIES } from '../constants/categories';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { getProducts, getCategories, updateProduct, createProduct, deleteProduct } from "../services/api";
import { toastService } from '../services/ToastService';
import { getErrorMessage } from '../services/api';
import { formatNaira } from '../utils/formatting';
import { handleApiErrorWithToast } from '../utils/errorHandling';

const Products = () => {
  // Main state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();

      // Handle standardized API response format
      if (response && response.success && response.data) {
        setProducts(response.data.products || []);
        // Update categories from API response if available
        if (response.data.categories) {
          setCategories(response.data.categories);
        }
      } else if (response && response.products && Array.isArray(response.products)) {
        setProducts(response.products);
      } else if (response && Array.isArray(response)) {
        setProducts(response);
      } else {
        console.warn('[PRODUCTS] Unexpected response structure:', response);
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toastService.error(getErrorMessage(error, 'Failed to load products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();

      // Handle standardized API response format
      if (response && response.success && response.data) {
        setCategories(response.data.all_categories || response.data.categories || []);
      } else if (response && response.all_categories && Array.isArray(response.all_categories)) {
        setCategories(response.all_categories);
      } else if (response && response.categories && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (response && Array.isArray(response)) {
        setCategories(response);
      } else {
        console.warn('[PRODUCTS] Using fallback categories');
        // Use shared business categories constants
        setCategories(BUSINESS_CATEGORIES.map(category => ({ id: category, name: category })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toastService.error(getErrorMessage(error, 'Failed to load categories'));
      // Use shared business categories constants as fallback
      setCategories(BUSINESS_CATEGORIES.map(category => ({ id: category, name: category })));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    // Optimistic UI - remove product immediately
    const originalProducts = [...products];
    const productToDelete = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    // Show loading toast
    const loadingToastId = toastService.loading('Deleting product...');

    try {
      const response = await deleteProduct(productId);
      
      // Remove loading toast and show success
      toastService.removeToast(loadingToastId);
      toastService.success("Product deleted successfully!");
      
      // Refresh products to ensure consistency
      await fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      
      // Rollback optimistic update
      setProducts(originalProducts);
      
      // Remove loading toast and show error
      toastService.removeToast(loadingToastId);
      toastService.error(`Failed to delete ${productToDelete?.name || 'product'}`);
    }
  };

  const handleFormSuccess = (response) => {
    const isEditing = !!editingProduct;
    // Only show one toast
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleFormCancel = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingProduct(null);
  };

  // Add a global search handler for the search bar
  const handleGlobalSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (product) => {
    const quantity = Number(product.quantity) || 0;
    const threshold = Number(product.low_stock_threshold) || 5;

    if (quantity === 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStockBadgeVariant = (product) => {
    const quantity = Number(product.quantity) || 0;
    const threshold = Number(product.low_stock_threshold) || 5;

    if (quantity === 0) return 'destructive';
    if (quantity <= threshold) return 'secondary';
    return 'default';
  };

  const getStockColor = (product) => {
    const quantity = Number(product.quantity) || 0;
    const threshold = Number(product.low_stock_threshold) || 5;

    if (quantity === 0) return 'text-red-600';
    if (quantity <= threshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const isLowStock = (product) => {
    const quantity = Number(product.quantity) || 0;
    const threshold = Number(product.low_stock_threshold) || 5;
    return quantity <= threshold;
  };

  const isOutOfStock = (product) => {
    const quantity = Number(product.quantity) || 0;
    return quantity === 0;
  };

  // Calculate low stock alerts
  const lowStockProducts = filteredProducts.filter(product => isLowStock(product) && !isOutOfStock(product));
  const outOfStockProducts = filteredProducts.filter(product => isOutOfStock(product));

  return (
    <DashboardLayout>
      <div className="relative">
        <BackButton to="/dashboard" variant="floating" />
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your product catalog and inventory</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="h-12 text-base touch-manipulation">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new product in your catalog
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-1">
                  <CustomProductForm
                    categories={categories}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                    editingProduct={editingProduct}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Low Stock Alerts */}
          {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <div className="space-y-3">
              {outOfStockProducts.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>{outOfStockProducts.length} product{outOfStockProducts.length > 1 ? 's' : ''} out of stock:</strong>{' '}
                    {outOfStockProducts.slice(0, 3).map(p => p.name).join(', ')}
                    {outOfStockProducts.length > 3 && ` and ${outOfStockProducts.length - 3} more`}
                  </AlertDescription>
                </Alert>
              )}

              {lowStockProducts.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low:</strong>{' '}
                    {lowStockProducts.slice(0, 3).map(p => `${p.name} (${p.quantity})`).join(', ')}
                    {lowStockProducts.length > 3 && ` and ${lowStockProducts.length - 3} more`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <StableInput
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={handleGlobalSearch}
                      className="pl-12 h-12 text-base touch-manipulation md:text-sm"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12 text-base touch-manipulation">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Display */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900">No products found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first product</p>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                  Add Product
                  </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                <Card key={product.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                          <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.sku || 'No SKU'}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                            <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Category</span>
                          <span>{product.category || 'Uncategorized'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Price</span>
                          <span className="font-semibold text-green-600">
                            {formatNaira(product.price || product.unit_price || 0)}
                              </span>
                            </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Stock</span>
                          <span className={getStockColor(product)}>
                            {product.quantity || 0} units
                                </span>
                              </div>
                            </div>

                      <div className="flex items-center justify-between">
                        <Badge variant={getStockBadgeVariant(product)}>
                                {getStockStatus(product)}
                              </Badge>
                        <div className="text-xs text-gray-500">
                          {product.category}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product information
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <CustomProductForm
                  categories={categories}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                  editingProduct={editingProduct}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default React.memo(Products);


