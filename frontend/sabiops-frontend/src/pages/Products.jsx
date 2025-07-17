import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import BackButton from '../components/ui/BackButton';
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
import { toast } from 'react-hot-toast'; // Corrected import
import { getErrorMessage } from '../services/api';
import { formatNaira } from '../utils/formatting';
import { handleApiErrorWithToast, showSuccessToast } from '../utils/errorHandling';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    price: '',
    cost_price: '',
    quantity: '',
    low_stock_threshold: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      console.log('[PRODUCTS] Products response:', response);

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
      toast.error(getErrorMessage(error, 'Failed to load products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      console.log('[PRODUCTS] Categories response:', response);

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
        // Use Nigerian business categories from formatting utils
        setCategories([
          'Electronics & Technology',
          'Fashion & Clothing',
          'Food & Beverages',
          'Health & Beauty',
          'Home & Garden',
          'Automotive',
          'Sports & Outdoors',
          'Books & Media',
          'Office Supplies',
          'Agriculture',
          'Construction Materials',
          'Jewelry & Accessories',
          'Toys & Games',
          'Art & Crafts',
          'Other'
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(getErrorMessage(error, 'Failed to load categories'));
      // Use Nigerian business categories as fallback
      setCategories([
        'Electronics & Technology',
        'Fashion & Clothing',
        'Food & Beverages',
        'Health & Beauty',
        'Home & Garden',
        'Automotive',
        'Sports & Outdoors',
        'Books & Media',
        'Office Supplies',
        'Agriculture',
        'Construction Materials',
        'Jewelry & Accessories',
        'Toys & Games',
        'Art & Crafts',
        'Other'
      ]);
    }
  };

  const handleInputChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enhanced validation
    if (!formData.name.trim()) {
      handleApiErrorWithToast(new Error("Product name is required"));
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      handleApiErrorWithToast(new Error("Valid selling price is required"));
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      handleApiErrorWithToast(new Error("Valid stock quantity is required"));
      return;
    }

    // Validate low stock threshold
    const quantity = parseInt(formData.quantity) || 0;
    const lowStockThreshold = parseInt(formData.low_stock_threshold) || 0;

    if (lowStockThreshold > quantity) {
      handleApiErrorWithToast(new Error(`Low stock alert (${lowStockThreshold}) cannot be greater than stock quantity (${quantity})`));
      return;
    }

    try {
      setLoading(true);
      let response;

      if (editingProduct) {
        response = await updateProduct(editingProduct.id, formData);
        console.log('[PRODUCTS] Update response:', response);
        showSuccessToast("Product updated successfully!");
        setShowEditDialog(false);
        setEditingProduct(null);
      } else {
        response = await createProduct(formData);
        console.log('[PRODUCTS] Create response:', response);
        showSuccessToast("Product created successfully!");
        setShowAddDialog(false);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        sku: '',
        category: '',
        price: '',
        cost_price: '',
        quantity: '',
        low_stock_threshold: '',
        image_url: ''
      });

      // Refresh data
      await fetchProducts();
      await fetchCategories();
    } catch (error) {
      console.error('Failed to save product:', error);
      handleApiErrorWithToast(error, 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      sku: product.sku || '',
      category: product.category || '',
      price: product.price || '',
      cost_price: product.cost_price || '',
      quantity: product.quantity || '',
      low_stock_threshold: product.low_stock_threshold || '',
      image_url: product.image_url || ''
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        const response = await deleteProduct(productId);
        console.log('[PRODUCTS] Delete response:', response);
        showSuccessToast("Product deleted successfully!");
        await fetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
        handleApiErrorWithToast(error, 'Failed to delete product');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
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

  const ProductForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">Product Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required
            className="h-12 text-base touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku" className="text-base">SKU</Label>
          <Input
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            placeholder="Product SKU (optional)"
            className="h-12 text-base touch-manipulation"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Product description"
          rows={3}
          className="text-base touch-manipulation min-h-[96px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-base">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
          <SelectTrigger className="h-12 text-base touch-manipulation">
            <SelectValue placeholder="Select product category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="text-base">Selling Price (₦) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            required
            className="h-12 text-base touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_price" className="text-base">Cost Price (₦)</Label>
          <Input
            id="cost_price"
            name="cost_price"
            type="number"
            step="0.01"
            value={formData.cost_price}
            onChange={handleInputChange}
            placeholder="0.00"
            className="h-12 text-base touch-manipulation"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-base">Stock Quantity *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="0"
            required
            className="h-12 text-base touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="low_stock_threshold" className="text-base">Low Stock Alert</Label>
          <Input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            min="0"
            max={formData.quantity || 999}
            value={formData.low_stock_threshold}
            onChange={handleInputChange}
            placeholder="5"
            className="h-12 text-base touch-manipulation"
          />
          <p className="text-xs text-gray-500">
            Alert when stock falls below this number (max: {formData.quantity || 'stock quantity'})
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url" className="text-base">Image URL</Label>
        <Input
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleInputChange}
          placeholder="Enter image URL (optional)"
          className="h-12 text-base touch-manipulation"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setEditingProduct(null);
          }}
          className="h-12 text-base touch-manipulation"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-12 text-base touch-manipulation"
        >
          {editingProduct ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

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
                  <ProductForm />
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
                    <Input
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-base touch-manipulation"
                    />
                  </div>
                </div>
                <div className="w-full">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12 text-base touch-manipulation">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first product'}
                </p>
                {!searchTerm && !selectedCategory && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile Card View (2 cards per row) */}
              <div className="block md:hidden">
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                              {product.name}
                            </h3>
                            <div className="flex gap-1 ml-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="h-8 w-8 p-0 hover:bg-green-100 touch-manipulation"
                              >
                                <Edit className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100 touch-manipulation"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Price</span>
                              <span className="text-sm font-semibold text-green-600">
                                {formatNaira(product.price)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Stock</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-sm font-medium ${getStockColor(product)}`}>
                                  {product.quantity}
                                </span>
                                {isLowStock(product) && (
                                  <AlertTriangle className={`h-3 w-3 ${isOutOfStock(product) ? 'text-red-500' : 'text-yellow-500'}`} />
                                )}
                              </div>
                            </div>

                            {product.category && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Category</span>
                                <span className="text-xs text-gray-700 truncate max-w-20" title={product.category}>
                                  {product.category}
                                </span>
                              </div>
                            )}

                            {product.sku && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">SKU</span>
                                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-700">
                                  {product.sku}
                                </code>
                              </div>
                            )}

                            <div className="pt-1">
                              <Badge
                                variant={getStockBadgeVariant(product)}
                                className={`text-xs px-2 py-0.5 ${isOutOfStock(product)
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : isLowStock(product)
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-green-100 text-green-800 border-green-200'
                                  }`}
                              >
                                {getStockStatus(product)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <Card className="hidden md:block">
                <CardHeader>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="hidden sm:table-cell">SKU</TableHead>
                          <TableHead className="hidden md:table-cell">Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead className="hidden lg:table-cell">Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                {product.description && (
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <code className="text-sm bg-muted px-1 py-0.5 rounded">
                                {product.sku || 'N/A'}
                              </code>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{product.category || 'Uncategorized'}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatNaira(product.price)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getStockColor(product)}`}>
                                  {product.quantity}
                                </span>
                                {isLowStock(product) && (
                                  <AlertTriangle className={`h-4 w-4 ${isOutOfStock(product) ? 'text-red-500' : 'text-yellow-500'}`} />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge
                                variant={getStockBadgeVariant(product)}
                                className={`${isOutOfStock(product)
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : isLowStock(product)
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-green-100 text-green-800 border-green-200'
                                  }`}
                              >
                                {getStockStatus(product)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
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
                <ProductForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Products;


