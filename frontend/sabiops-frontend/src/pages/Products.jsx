import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, AlertTriangle, Eye } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
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
      
      // Handle different response formats
      if (response && Array.isArray(response)) {
        setProducts(response);
      } else if (response && response.products && Array.isArray(response.products)) {
        setProducts(response.products);
      } else if (response && response.data && response.data.products && Array.isArray(response.data.products)) {
        setProducts(response.data.products);
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
      
      // Handle different response formats
      if (response && Array.isArray(response)) {
        setCategories(response);
      } else if (response && response.categories && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (response && response.data && response.data.categories && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else {
        console.warn('[PRODUCTS] Using fallback categories');
        setCategories(['Electronics', 'Clothing', 'Food & Beverages', 'Health & Beauty', 'Home & Garden', 'Sports & Outdoors', 'Books & Media', 'Automotive', 'Office Supplies', 'Other']);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(getErrorMessage(error, 'Failed to load categories'));
      setCategories(['Electronics', 'Clothing', 'Food & Beverages', 'Health & Beauty', 'Home & Garden', 'Sports & Outdoors', 'Books & Media', 'Automotive', 'Office Supplies', 'Other']);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid selling price is required");
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      toast.error("Valid stock quantity is required");
      return;
    }

    try {
      setLoading(true);
      if (editingProduct) {
        const response = await updateProduct(editingProduct.id, formData);
        console.log('[PRODUCTS] Update response:', response);
        toast.success("Product updated successfully!");
        setShowEditDialog(false);
        setEditingProduct(null);
      } else {
        const response = await createProduct(formData);
        console.log('[PRODUCTS] Create response:', response);
        toast.success("Product created successfully!");
        setShowAddDialog(false);
      }
      
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
      
      await fetchProducts();
      await fetchCategories();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error(getErrorMessage(error, 'Failed to save product'));
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
        toast.success("Product deleted successfully!");
        await fetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
        toast.error(getErrorMessage(error, 'Failed to delete product'));
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
    if (product.quantity <= product.low_stock_threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStockBadgeVariant = (product) => {
    if (product.quantity <= product.low_stock_threshold) return 'destructive';
    return 'default';
  };

  const ProductForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            placeholder="Product SKU (optional)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Product description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <div className="flex gap-2">
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select or enter category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Or type new category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="flex-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Selling Price (₦) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_price">Cost Price (₦)</Label>
          <Input
            id="cost_price"
            name="cost_price"
            type="number"
            step="0.01"
            value={formData.cost_price}
            onChange={handleInputChange}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Stock Quantity *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
          <Input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            value={formData.low_stock_threshold}
            onChange={handleInputChange}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleInputChange}
          placeholder="Enter image URL (optional)"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setEditingProduct(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
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
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your product catalog and inventory</p>
          </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product in your catalog
              </DialogDescription>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
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
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="h-6 w-6 p-0 hover:bg-green-100"
                            >
                              <Edit className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="h-6 w-6 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Price</span>
                            <span className="text-sm font-semibold text-green-600">
                              ₦{product.price?.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Stock</span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">{product.quantity}</span>
                              {product.quantity <= product.low_stock_threshold && (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          </div>
                          
                          {product.category && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Category</span>
                              <span className="text-xs text-gray-700 truncate max-w-20">
                                {product.category}
                              </span>
                            </div>
                          )}
                          
                          <div className="pt-1">
                            <Badge 
                              variant={getStockBadgeVariant(product)}
                              className="text-xs px-2 py-0.5"
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
                          <TableCell>₦{product.price?.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{product.quantity}</span>
                              {product.quantity <= product.low_stock_threshold && (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={getStockBadgeVariant(product)}>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product information
              </DialogDescription>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Products;


