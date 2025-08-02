import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Filter, RefreshCw, Receipt, Calendar, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getExpenses, getExpenseCategories, createExpense, updateExpense, deleteExpense } from "../services/api";
import { formatNaira } from '../utils/formatting';
import { handleApiErrorWithToast, showSuccessToast } from '../utils/errorHandling';
import { useToast } from '../components/ToastProvider';
import ExpenseForm from '../components/forms/ExpenseForm';
import ExpenseCard from '../components/expenses/ExpenseCard';
import BackButton from '../components/ui/BackButton';
import StableInput from '../components/ui/StableInput';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { validateExpenseData } from '../utils/expenseValidator';
import MobileDateInput from '../components/ui/MobileDateInput';
import { downloadExpensesCSV } from '../utils/csvDownload';

const Expenses = () => {
  // State
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);

  const { success, error: toastError } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getExpenses();
      
      let expensesData = [];
      
      if (response?.data?.expenses && Array.isArray(response.data.expenses)) {
        expensesData = response.data.expenses;
      } else if (response?.data && Array.isArray(response.data)) {
        expensesData = response.data;
      } else if (Array.isArray(response)) {
        expensesData = response;
      } else if (response?.expenses && Array.isArray(response.expenses)) {
        expensesData = response.expenses;
      }

      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses. Please try again.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await getExpenseCategories();
      
      let categoriesData = [];
      
      if (response?.data?.categories && Array.isArray(response.data.categories)) {
        categoriesData = response.data.categories;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (Array.isArray(response)) {
        categoriesData = response;
      } else if (response?.categories && Array.isArray(response.categories)) {
        categoriesData = response.categories;
      }

      // If no categories returned, use shared expense categories constants
      if (categoriesData.length === 0) {
        categoriesData = EXPENSE_CATEGORIES.map(category => ({ id: category, name: category }));
      }

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use shared expense categories constants as fallback
      setCategories(EXPENSE_CATEGORIES.map(category => ({ id: category, name: category })));
    }
  };

  // Handle add expense
  const handleAddExpense = async (expenseData) => {
    try {
      // Import the validator dynamically to avoid circular dependencies
      const { validateExpenseData } = await import('../utils/expenseValidator');
      
      // Validate the expense data
      const validation = validateExpenseData(expenseData);
      
      if (!validation.isValid) {
        // Show the first validation error
        const firstErrorKey = Object.keys(validation.errors)[0];
        const firstError = validation.errors[firstErrorKey];
        toastError(firstError);
        throw new Error(firstError); // Re-throw to be caught by the form
      }
      
      await createExpense(validation.formattedData);
      success('Expense added successfully');
      setShowAddDialog(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toastError('Failed to add expense');
      throw error; // Re-throw to be caught by the form
    }
  };

  // Handle edit expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowEditDialog(true);
  };

  // Handle view expense
  const handleViewExpense = (expense) => {
    setViewingExpense(expense);
    setShowViewDialog(true);
  };

  // Handle update expense
  const handleUpdateExpense = async (expenseData) => {
    try {
      // Import the validator dynamically to avoid circular dependencies
      const { validateExpenseData } = await import('../utils/expenseValidator');
      
      // Validate the expense data
      const validation = validateExpenseData(expenseData);
      
      if (!validation.isValid) {
        // Show the first validation error
        const firstErrorKey = Object.keys(validation.errors)[0];
        const firstError = validation.errors[firstErrorKey];
        toastError(firstError);
        throw new Error(firstError); // Re-throw to be caught by the form
      }
      
      await updateExpense(editingExpense.id, validation.formattedData);
      success('Expense updated successfully');
      setShowEditDialog(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toastError('Failed to update expense');
      throw error; // Re-throw to be caught by the form
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteExpense(expenseId);
      success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toastError('Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    // Search term filter
    const matchesSearch = 
      (expense.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = 
      categoryFilter === 'all' || 
      expense.category === categoryFilter;
    
    // Date filter
    let matchesDate = true;
    const expenseDate = new Date(expense.date);
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    
    if (dateFilter === 'last30days') {
      matchesDate = expenseDate >= thirtyDaysAgo;
    } else if (dateFilter === 'last90days') {
      matchesDate = expenseDate >= ninetyDaysAgo;
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // Download expenses as CSV using the utility
  const handleDownload = () => {
    try {
      downloadExpensesCSV(filteredExpenses);
      success('Expenses report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toastError('Failed to download report');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
                <p className="text-gray-600 mt-1">Track and manage your business expenses</p>
              </div>
              <div>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="h-11 px-6 text-sm font-medium bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError('');
                    fetchExpenses();
                  }}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Expense Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{formatNaira(totalExpenses)}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Number of Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{filteredExpenses.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card className="mb-6 bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Filter & Search</CardTitle>
              <CardDescription>Filter expenses by category, date, and search for specific expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Search Expenses</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <StableInput
                      id="search"
                      name="search"
                      placeholder="Search by description, vendor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500 md:text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category_filter" className="text-sm font-medium text-gray-700 mb-2 block">Filter by Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category_filter" className="h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue 
                        placeholder="Select category"
                        value={categoryFilter === 'all' ? undefined : categories.find(cat => cat.id === categoryFilter)?.name}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date_filter" className="text-sm font-medium text-gray-700 mb-2 block">Filter by Date</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger id="date_filter" className="h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue 
                        placeholder="Select date range"
                        value={dateFilter === 'all' ? undefined : dateFilter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last30days">Last 30 Days</SelectItem>
                      <SelectItem value="last90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setDateFilter('all');
                  }}
                  className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchExpenses}
                  className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Data Section */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Expenses
                  </CardTitle>
                  <CardDescription>
                    {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found
                    {expenses.length > 0 && filteredExpenses.length !== expenses.length && 
                      ` (${expenses.length} total)`
                    }
                  </CardDescription>
                </div>
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-red-600">{formatNaira(totalExpenses)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Loading expenses...</span>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {searchTerm || categoryFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your search criteria or filters'
                      : 'Get started by adding your first expense.'}
                  </p>
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Expense
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredExpenses.map((expense, idx) => (
                    <div key={expense.id} className={
                      filteredExpenses.length % 2 === 1 && idx === filteredExpenses.length - 1
                        ? 'col-span-2 flex justify-center' : ''
                    }>
                      <ExpenseCard
                        expense={expense}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteExpense}
                        onView={handleViewExpense}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Record a new business expense
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <ExpenseForm
              onSubmit={handleAddExpense}
              onCancel={() => setShowAddDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense details
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <ExpenseForm
              onSubmit={handleUpdateExpense}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingExpense(null);
              }}
              editingExpense={editingExpense}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              View complete expense information
            </DialogDescription>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4 mt-4">
              <div className="text-center py-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                  <Receipt className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewingExpense.description || 'Expense'}
                </h3>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatNaira(viewingExpense.amount || 0)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-base text-gray-900">{viewingExpense.category || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Subcategory</p>
                  <p className="text-base text-gray-900">{viewingExpense.subcategory || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-base text-gray-900">{viewingExpense.date || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Vendor/Supplier</p>
                  <p className="text-base text-gray-900">{viewingExpense.vendor || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Method</p>
                  <p className="text-base text-gray-900">{viewingExpense.payment_method || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Reference/Receipt Number</p>
                  <p className="text-base text-gray-900">{viewingExpense.reference || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tax Deductible</p>
                  <p className="text-base text-gray-900">{viewingExpense.tax_deductible ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {viewingExpense.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-md mt-1">{viewingExpense.notes}</p>
                </div>
              )}

              {viewingExpense.receipt_url && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Receipt</p>
                  <a 
                    href={viewingExpense.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Receipt
                  </a>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewDialog(false);
                    setViewingExpense(null);
                  }}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditExpense(viewingExpense);
                  }}
                >
                  Edit Expense
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <style>{`
  @media (max-width: 639px) {
    .mobile-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .mobile-grid-2 > .col-span-2 {
      grid-column: span 2 / span 2;
      justify-content: center;
    }
    .mobile-card-content {
      padding: 1rem !important;
    }
    .mobile-btn,
    .mobile-input {
      width: 100% !important;
      min-width: 0;
      font-size: 16px;
      padding: 0.75rem;
      height: auto;
      min-height: 2.5rem;
    }
  }
`}</style>
    </DashboardLayout>
  );
};

export default Expenses;