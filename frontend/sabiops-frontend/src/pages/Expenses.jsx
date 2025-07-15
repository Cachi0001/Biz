import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Edit, Trash2, Receipt, Eye, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories as getExpenseCategories, getErrorMessage } from "../services/api";
import { toast } from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    receipt_url: '',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0]
  });

  const paymentMethods = [
    'cash', 'bank_transfer', 'card', 'mobile_money', 'check', 'other'
  ];

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await getExpenses();
      console.log('[EXPENSES] Expenses response:', response);

      // Handle different response formats
      if (response && Array.isArray(response)) {
        setExpenses(response);
      } else if (response && response.expenses && Array.isArray(response.expenses)) {
        setExpenses(response.expenses);
      } else if (response && response.data && response.data.expenses && Array.isArray(response.data.expenses)) {
        setExpenses(response.data.expenses);
      } else {
        console.warn('[EXPENSES] Unexpected response structure:', response);
        setExpenses([]);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to fetch expenses');
      setError(errorMessage);
      console.error('Error fetching expenses:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getExpenseCategories();
      console.log('[EXPENSES] Categories response:', response);

      // Handle different response formats
      if (response && Array.isArray(response)) {
        setCategories(response);
      } else if (response && response.categories && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (response && response.data && response.data.categories && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else {
        console.warn('[EXPENSES] Using fallback categories');
        setCategories([
          { "name": "Rent", "description": "Monthly rent for office or business space" },
          { "name": "Utilities", "description": "Electricity, water, internet bills" },
          { "name": "Salaries", "description": "Employee salaries and wages" },
          { "name": "Marketing", "description": "Advertising and promotional expenses" },
          { "name": "Supplies", "description": "Office or operational supplies" },
          { "name": "Travel", "description": "Business travel expenses" },
          { "name": "Maintenance", "description": "Repairs and maintenance" },
          { "name": "Other", "description": "Miscellaneous expenses" }
        ]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([
        { "name": "Rent", "description": "Monthly rent for office or business space" },
        { "name": "Utilities", "description": "Electricity, water, internet bills" },
        { "name": "Salaries", "description": "Employee salaries and wages" },
        { "name": "Marketing", "description": "Advertising and promotional expenses" },
        { "name": "Supplies", "description": "Office or operational supplies" },
        { "name": "Travel", "description": "Business travel expenses" },
        { "name": "Maintenance", "description": "Repairs and maintenance" },
        { "name": "Other", "description": "Miscellaneous expenses" }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category.trim()) {
      toast.error('Category is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valid amount is required');
      return;
    }
    if (!formData.date) {
      toast.error('Date is required');
      return;
    }

    try {
      setLoading(true);

      const expenseData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        receipt_url: formData.receipt_url || '',
        payment_method: formData.payment_method || 'cash',
        date: formData.date
      };

      console.log('[EXPENSES] Submitting expense data:', expenseData);

      if (editingExpense) {
        const response = await updateExpense(editingExpense.id, expenseData);
        console.log('[EXPENSES] Update response:', response);
        toast.success('Expense updated successfully!');
      } else {
        const response = await createExpense(expenseData);
        console.log('[EXPENSES] Create response:', response);
        toast.success('Expense created successfully!');
      }

      await fetchExpenses();
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to save expense');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      setLoading(true);
      const response = await deleteExpense(expenseId);
      console.log('[EXPENSES] Delete response:', response);
      toast.success('Expense deleted successfully!');
      await fetchExpenses();
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to delete expense');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      receipt_url: '',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
  };

  const openEditDialog = (expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category || '',
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      receipt_url: expense.receipt_url || '',
      payment_method: expense.payment_method || 'cash',
      date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
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
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + (expense.amount || 0), 0);
  };

  if (loading && expenses.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 flex items-center justify-center h-64">
          <div className="text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading expenses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expense Tracking</h1>
            <p className="text-gray-600 text-sm sm:text-base">Track and manage your business expenses</p>
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
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                    <Label htmlFor="amount">Amount (₦) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter expense description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
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
                  <div>
                    <Label htmlFor="date">Expense Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="receipt_url">Receipt URL</Label>
                  <Input
                    id="receipt_url"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                    placeholder="Enter receipt URL (optional)"
                  />
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
                      <h3 className="text-lg font-semibold">{expense.category}</h3>
                      {expense.category && (
                        <Badge variant="outline">{expense.category}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Amount:</span>
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>
                        <div>{formatDate(expense.date)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Payment:</span>
                        <div>{expense.payment_method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                      </div>
                    </div>

                    {expense.description && (
                      <p className="text-gray-600 mt-2">{expense.description}</p>
                    )}

                    {/* Receipt Section */}
                    {expense.receipt_url && (
                      <div className="mt-4">
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
                            Receipt attached
                          </span>
                        </div>
                      </div>
                    )}
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
                  Receipt - {viewingReceipt.category}
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
    </DashboardLayout>
  );
};

export default Expenses;


