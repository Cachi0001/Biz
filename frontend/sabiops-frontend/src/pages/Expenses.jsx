import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Receipt, Upload, Download, Eye, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import FileUpload from '../components/FileUpload';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories as getExpenseCategories, post } from "../services/api";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    payment_method: '',
    vendor_name: '',
    vendor_contact: '',
    expense_date: new Date().toISOString().split('T')[0],
    is_tax_deductible: false,
    tax_category: ''
  });

  const paymentMethods = [
    'cash', 'bank_transfer', 'card', 'mobile_money', 'check', 'other'
  ];

  const taxCategories = [
    'office_supplies', 'travel', 'utilities', 'marketing', 'equipment',
    'professional_services', 'rent', 'insurance', 'meals', 'other'
  ];

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await getExpenses();
      setExpenses(response || []);
    } catch (err) {
      setError('Failed to fetch expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getExpenseCategories();
      setCategories(response || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount) || 0
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await createExpense(expenseData);
      }

      await fetchExpenses();
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await deleteExpense(expenseId);
      await fetchExpenses();
    } catch (err) {
      setError('Failed to delete expense');
    }
  };

  const handleReceiptUpload = async (expenseId, file) => {
    if (!file) return;

    try {
      setUploadingReceipt(true);
      const formData = new FormData();
      formData.append('receipt', file);

      await post(`/expenses/upload-receipt/${expenseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      await fetchExpenses();
    } catch (err) {
      setError('Failed to upload receipt');
      console.error('Error uploading receipt:', err);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: '',
      payment_method: '',
      vendor_name: '',
      vendor_contact: '',
      expense_date: new Date().toISOString().split('T')[0],
      is_tax_deductible: false,
      tax_category: ''
    });
    setEditingExpense(null);
  };

  const openEditDialog = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      category: expense.category || '',
      payment_method: expense.payment_method || '',
      vendor_name: expense.vendor_name || '',
      vendor_contact: expense.vendor_contact || '',
      expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
      is_tax_deductible: expense.is_tax_deductible || false,
      tax_category: expense.tax_category || ''
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG');
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  };

  const getMonthlyExpenses = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + (expense.amount || 0), 0);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Tracking</h1>
          <p className="text-gray-600">Track and manage your business expenses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Expense Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>
                          {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor_name">Vendor Name</Label>
                  <Input
                    id="vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_contact">Vendor Contact</Label>
                  <Input
                    id="vendor_contact"
                    value={formData.vendor_contact}
                    onChange={(e) => setFormData({...formData, vendor_contact: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expense_date">Expense Date</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="tax_category">Tax Category</Label>
                  <Select value={formData.tax_category} onValueChange={(value) => setFormData({...formData, tax_category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax category" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_tax_deductible"
                  checked={formData.is_tax_deductible}
                  onChange={(e) => setFormData({...formData, is_tax_deductible: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_tax_deductible">Tax deductible expense</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalExpenses())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getMonthlyExpenses())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <div className="grid grid-cols-1 gap-4">
        {expenses.map((expense) => (
          <Card key={expense.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{expense.title}</h3>
                    {expense.is_tax_deductible && (
                      <Badge variant="secondary">Tax Deductible</Badge>
                    )}
                    {expense.category && (
                      <Badge variant="outline">{expense.category}</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Amount:</span>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>
                      <div>{formatDate(expense.expense_date)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Payment:</span>
                      <div>{expense.payment_method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    </div>
                    <div>
                      <span className="font-medium">Vendor:</span>
                      <div>{expense.vendor_name || 'N/A'}</div>
                    </div>
                  </div>

                  {expense.description && (
                    <p className="text-gray-600 mt-2">{expense.description}</p>
                  )}

                  {/* Receipt Section */}
                  <div className="mt-4">
                    {expense.receipt_url ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingReceipt(expense)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Receipt
                        </Button>
                        <span className="text-sm text-gray-500">
                          {expense.receipt_filename}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full max-w-xs">
                        <FileUpload
                          onFileSelect={(file) => handleReceiptUpload(expense.id, file)}
                          accept="image/*,.pdf"
                          maxSize={16}
                          allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']}
                          placeholder="Upload Receipt"
                          disabled={uploadingReceipt}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(expense)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && !loading && (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-600 mb-4">Start tracking your business expenses to better manage your finances.</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Expense
          </Button>
        </div>
      )}

      {/* Receipt Viewer Dialog */}
      {viewingReceipt && (
        <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Receipt - {viewingReceipt.title}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingReceipt(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {viewingReceipt.receipt_url && (
                <img
                  src={viewingReceipt.receipt_url}
                  alt="Receipt"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Expenses;


