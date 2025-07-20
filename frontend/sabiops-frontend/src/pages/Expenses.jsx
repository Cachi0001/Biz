import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Edit, Trash2, Receipt, Eye, X, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { enhancedGetExpenses, enhancedCreateExpense, enhancedUpdateExpense, enhancedDeleteExpense, validateExpenseData } from "../services/enhancedApi";
import { formatNaira, formatDate, formatPaymentMethod } from '../utils/formatting';
import { handleApiErrorWithToast, showSuccessToast, showErrorToast } from '../utils/errorHandling';
import { useUsageTracking } from '../hooks/useUsageTracking';
import UsageLimitPrompt from '../components/subscription/UsageLimitPrompt';
import StableInput from '../components/ui/StableInput';
import DebugLogger from '../utils/debugLogger';
import BackButton from '../components/ui/BackButton';

const Expenses = () => {
  const { canCreateExpense, expenseStatus, usage } = useUsageTracking();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [summary, setSummary] = useState({
    total_expenses: 0,
    total_count: 0,
    today_expenses: 0,
    this_month_expenses: 0
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const [formData, setFormData] = useState({
    category: '',
    sub_category: '',
    description: '',
    amount: '',
    receipt_url: '',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState({});

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'pos', label: 'POS' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online_payment', label: 'Online Payment' },
    { value: 'credit', label: 'Credit' }
  ];

  useEffect(() => {
    fetchExpenses();
    initializeCategories();
  }, []);

  // Filter expenses when search/filter criteria change
  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, dateRange]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      DebugLogger.logApiCall('/expenses', 'Starting fetch', 'ExpensesPage', 'GET');
      
      const normalizedData = await enhancedGetExpenses();
      
      // Log expenses data for debugging
      if (normalizedData.expenses) {
        console.log('[ExpensesPage] Expenses loaded:', normalizedData.expenses.length, 'items');
      }
      
      setExpenses(normalizedData.expenses || []);
      setSummary(normalizedData.summary || {
        total_expenses: 0,
        total_count: 0,
        today_expenses: 0,
        this_month_expenses: 0
      });

      // Log if no expenses are found
      if (!normalizedData.expenses || normalizedData.expenses.length === 0) {
        DebugLogger.logDisplayIssue('ExpensesPage', 'expenses', normalizedData, 'No expenses found in response');
      }
      
    } catch (err) {
      DebugLogger.logApiError('/expenses', err, 'ExpensesPage');
      const errorMessage = handleApiErrorWithToast(err, 'Failed to fetch expenses');
      setError(errorMessage);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeCategories = () => {
    // Use Nigerian SME expense categories from formatting utils
    const nigerianCategories = [
      {
        name: "Inventory/Stock",
        description: "Goods purchased for resale",
        subcategories: ["Raw Materials", "Finished Goods", "Packaging Materials", "Import Duties"]
      },
      {
        name: "Rent",
        description: "Shop/office rent and related costs",
        subcategories: ["Shop Rent", "Office Rent", "Warehouse Rent", "Equipment Rent"]
      },
      {
        name: "Utilities",
        description: "Basic business utilities",
        subcategories: ["Electricity", "Water", "Internet", "Phone", "Generator Fuel"]
      },
      {
        name: "Transportation",
        description: "Business travel and logistics",
        subcategories: ["Fuel", "Vehicle Maintenance", "Public Transport", "Delivery Costs", "Logistics"]
      },
      {
        name: "Marketing",
        description: "Advertising and promotional expenses",
        subcategories: ["Social Media Ads", "Print Materials", "Radio/TV Ads", "Promotional Items", "Website"]
      },
      {
        name: "Staff Salaries",
        description: "Employee compensation and benefits",
        subcategories: ["Basic Salary", "Overtime", "Bonuses", "Allowances", "Benefits"]
      },
      {
        name: "Equipment",
        description: "Business equipment and tools",
        subcategories: ["Computers", "Machinery", "Furniture", "Tools", "Software"]
      },
      {
        name: "Professional Services",
        description: "External professional services",
        subcategories: ["Accounting", "Legal", "Consulting", "IT Support", "Training"]
      },
      {
        name: "Insurance",
        description: "Business insurance premiums",
        subcategories: ["Business Insurance", "Vehicle Insurance", "Health Insurance", "Property Insurance"]
      },
      {
        name: "Taxes",
        description: "Government taxes and levies",
        subcategories: ["VAT", "Company Tax", "PAYE", "Local Government Levy", "Import Duty"]
      },
      {
        name: "Bank Charges",
        description: "Banking and financial service fees",
        subcategories: ["Transaction Fees", "Account Maintenance", "Transfer Charges", "POS Charges"]
      },
      {
        name: "Other",
        description: "Miscellaneous business expenses",
        subcategories: ["Miscellaneous", "Emergency Repairs", "Cleaning", "Security", "Stationery"]
      }
    ];

    setCategories(nigerianCategories);
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.sub_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Payment method filter
    if (selectedPaymentMethod) {
      filtered = filtered.filter(expense => expense.payment_method === selectedPaymentMethod);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(expense => expense.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(expense => expense.date <= dateRange.end);
    }

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    DebugLogger.logFormSubmit('ExpensesPage', formData, 'submit');

    // Check usage limits for new expenses (not for edits)
    if (!editingExpense && !canCreateExpense) {
      showErrorToast('You have reached your expense limit for this month. Please upgrade your plan to continue.');
      return;
    }

    // Use enhanced validation
    const errors = validateExpenseData(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showErrorToast('Please fix the form errors before submitting');
      return;
    }

    try {
      setLoading(true);

      const expenseData = {
        category: formData.category,
        sub_category: formData.sub_category || '',
        description: formData.description || '',
        amount: parseFloat(formData.amount),
        receipt_url: formData.receipt_url || '',
        payment_method: formData.payment_method || 'cash',
        date: formData.date
      };

      DebugLogger.logFormSubmit('ExpensesPage', expenseData, 'processed-data');

      let result;
      if (editingExpense) {
        result = await enhancedUpdateExpense(editingExpense.id, expenseData);
        showSuccessToast('Expense updated successfully!');
      } else {
        result = await enhancedCreateExpense(expenseData);
        showSuccessToast('Expense created successfully!');
      }

      // Refresh expenses list
      await fetchExpenses();
      resetForm();
      setIsDialogOpen(false);
      
      // Dispatch events to update other parts of the application
      window.dispatchEvent(new CustomEvent('expenseUpdated', { 
        detail: { 
          expense: result, 
          action: editingExpense ? 'updated' : 'created',
          timestamp: new Date().toISOString() 
        } 
      }));
      
      // Also dispatch a general data update event
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { 
          type: 'expense', 
          action: editingExpense ? 'updated' : 'created',
          data: result,
          timestamp: new Date().toISOString() 
        } 
      }));
    } catch (err) {
      handleApiErrorWithToast(err, 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      setLoading(true);
      await enhancedDeleteExpense(expenseId);
      showSuccessToast('Expense deleted successfully!');
      await fetchExpenses();
      
      // Dispatch events to update other parts of the application
      window.dispatchEvent(new CustomEvent('expenseUpdated', { 
        detail: { 
          expenseId, 
          action: 'deleted',
          timestamp: new Date().toISOString() 
        } 
      }));
      
      // Also dispatch a general data update event
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { 
          type: 'expense', 
          action: 'deleted',
          id: expenseId,
          timestamp: new Date().toISOString() 
        } 
      }));
    } catch (err) {
      handleApiErrorWithToast(err, 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      sub_category: '',
      description: '',
      amount: '',
      receipt_url: '',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setEditingExpense(null);
    setSubcategories([]);
  };

  const openEditDialog = (expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category || '',
      sub_category: expense.sub_category || '',
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      receipt_url: expense.receipt_url || '',
      payment_method: expense.payment_method || 'cash',
      date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
    });

    // Set subcategories for the selected category
    if (expense.category) {
      const selectedCategory = categories.find(cat => cat.name === expense.category);
      setSubcategories(selectedCategory?.subcategories || []);
    }

    setIsDialogOpen(true);
  };

  const handleCategoryChange = (categoryName) => {
    DebugLogger.logFocusEvent('ExpensesPage', 'category-change', document.activeElement, { categoryName });
    
      setFormData({ ...formData, category: categoryName, sub_category: '' });
      const selectedCategory = categories.find(cat => cat.name === categoryName);
      setSubcategories(selectedCategory?.subcategories || []);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPaymentMethod('');
    setDateRange({ start: '', end: '' });
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
      <div className="relative">
        <BackButton to="/dashboard" variant="floating" />
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
                      <Select value={formData.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
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
                      {formErrors.category && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="sub_category">Subcategory</Label>
                      <Select
                        value={formData.sub_category}
                        onValueChange={(value) => {
                          DebugLogger.logFocusEvent('ExpensesPage', 'subcategory-change', document.activeElement, { value });
                            setFormData({ ...formData, sub_category: value });
                        }}
                        disabled={!formData.category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map(subcategory => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (₦) *</Label>
                    <StableInput
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                      className={formErrors.amount ? 'border-red-500' : ''}
                    />
                    {formErrors.amount && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <StableInput
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter expense description"
                      rows={3}
                      component="textarea"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Select value={formData.payment_method} onValueChange={(value) => {
                        DebugLogger.logFocusEvent('ExpensesPage', 'payment-method-change', document.activeElement, { value });
                          setFormData({ ...formData, payment_method: value });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(method => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date">Expense Date *</Label>
                      <StableInput
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="receipt_url">Receipt URL</Label>
                    <StableInput
                      id="receipt_url"
                      name="receipt_url"
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

          {/* Search and Filter Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <StableInput
                        name="search"
                        placeholder="Search expenses by category, subcategory, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="whitespace-nowrap"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="filter-category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter-payment">Payment Method</Label>
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All methods</SelectItem>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter-start-date">Start Date</Label>
                    <StableInput
                      id="filter-start-date"
                      name="filter_start_date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="filter-end-date">End Date</Label>
                    <StableInput
                      id="filter-end-date"
                      name="filter_end_date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatNaira(summary.total_expenses || getTotalExpenses())}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatNaira(summary.this_month_expenses || getMonthlyExpenses())}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatNaira(summary.today_expenses || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{filteredExpenses.length} / {expenses.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses List - Mobile: 2 per row, Desktop: 1 per row */}
          <div className="space-y-4">
            {/* Mobile Card Layout (2 per row) */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Header with category and actions */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {expense.category}
                          </h3>
                          {expense.sub_category && (
                            <p className="text-xs text-gray-600 truncate">
                              {expense.sub_category}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(expense)} className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)} className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">
                          {formatNaira(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(expense.date)}</p>
                      </div>

                      {/* Payment method */}
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {formatPaymentMethod(expense.payment_method)}
                        </Badge>
                      </div>

                      {/* Description (truncated) */}
                      {expense.description && (
                        <p className="text-xs text-gray-600 truncate" title={expense.description}>
                          {expense.description}
                        </p>
                      )}

                      {/* Receipt indicator */}
                      {expense.receipt_url && (
                        <div className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingReceipt(expense)}
                            className="h-6 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop List Layout */}
            <div className="hidden md:block space-y-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{expense.category}</h3>
                          <Badge variant="outline">{expense.category}</Badge>
                          {expense.sub_category && (
                            <Badge variant="secondary">{expense.sub_category}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Amount:</span>
                            <div className="text-lg font-bold text-green-600">
                              {formatNaira(expense.amount)}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>
                            <div>{formatDate(expense.date)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span>
                            <div>{formatPaymentMethod(expense.payment_method)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Category:</span>
                            <div>{expense.sub_category || 'General'}</div>
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
                          <Edit className="w-4 h-4 text-green-600" />
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
          </div>

          {filteredExpenses.length === 0 && !loading && (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {expenses.length === 0 ? 'No expenses yet' : 'No expenses match your filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {expenses.length === 0
                  ? 'Start tracking your business expenses to better manage your finances.'
                  : 'Try adjusting your search criteria or clear the filters.'
                }
              </p>
              {expenses.length === 0 ? (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Expense
                </Button>
              ) : (
                <Button onClick={clearFilters} variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
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
      </div>
    </DashboardLayout>
  );
};

export default Expenses;