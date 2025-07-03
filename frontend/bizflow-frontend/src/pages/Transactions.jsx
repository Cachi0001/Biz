import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  Users,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

const Transactions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalMoneyIn: 0,
    totalMoneyOut: 0,
    netFlow: 0,
    transactionCount: 0
  });
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all', // all, money_in, money_out
    category: 'all',
    paymentMethod: 'all'
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple sources
      const [invoicesRes, expensesRes, salesRes, paymentsRes] = await Promise.all([
        apiService.getInvoices().catch(() => ({ invoices: [] })),
        apiService.getExpenses().catch(() => ({ expenses: [] })),
        apiService.getSales().catch(() => ({ sales: [] })),
        apiService.getPayments().catch(() => ({ payments: [] }))
      ]);

      // Combine all transactions
      const allTransactions = [
        // Money In - Sales/Invoices
        ...(salesRes.sales || []).map(sale => ({
          id: `sale-${sale.id}`,
          type: 'money_in',
          category: 'Sales',
          description: `Sale to ${sale.customer?.name || 'Walk-in Customer'}`,
          amount: sale.total_amount,
          date: sale.created_at,
          paymentMethod: sale.payment_method || 'Cash',
          reference: sale.id,
          icon: TrendingUp,
          color: 'text-green-600'
        })),
        
        // Money In - Invoice Payments
        ...(invoicesRes.invoices || [])
          .filter(invoice => invoice.status === 'paid')
          .map(invoice => ({
            id: `invoice-${invoice.id}`,
            type: 'money_in',
            category: 'Invoice Payment',
            description: `Payment for Invoice #${invoice.invoice_number}`,
            amount: invoice.total,
            date: invoice.updated_at,
            paymentMethod: 'Bank Transfer',
            reference: invoice.invoice_number,
            icon: FileText,
            color: 'text-green-600'
          })),

        // Money Out - Expenses
        ...(expensesRes.expenses || []).map(expense => ({
          id: `expense-${expense.id}`,
          type: 'money_out',
          category: expense.category || 'Business Expense',
          description: expense.description,
          amount: expense.amount,
          date: expense.date || expense.created_at,
          paymentMethod: 'Cash',
          reference: expense.id,
          icon: Receipt,
          color: 'text-red-600'
        })),

        // Money Out - Referral Withdrawals
        ...(user?.total_withdrawn > 0 ? [{
          id: 'referral-withdrawal',
          type: 'money_out',
          category: 'Referral Withdrawal',
          description: 'Referral earnings withdrawal',
          amount: user.total_withdrawn,
          date: new Date().toISOString(),
          paymentMethod: 'Bank Transfer',
          reference: 'REF-WITHDRAWAL',
          icon: Users,
          color: 'text-red-600'
        }] : [])
      ];

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setTransactions(allTransactions);
      calculateSummary(allTransactions);
      
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (transactionList) => {
    const moneyIn = transactionList
      .filter(t => t.type === 'money_in')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const moneyOut = transactionList
      .filter(t => t.type === 'money_out')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    setSummary({
      totalMoneyIn: moneyIn,
      totalMoneyOut: moneyOut,
      netFlow: moneyIn - moneyOut,
      transactionCount: transactionList.length
    });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
    }

    setFilteredTransactions(filtered);
    calculateSummary(filtered);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(transactions.map(t => t.category))];
    return categories.filter(Boolean);
  };

  const getUniquePaymentMethods = () => {
    const methods = [...new Set(transactions.map(t => t.paymentMethod))];
    return methods.filter(Boolean);
  };

  const exportTransactions = () => {
    // Create CSV content
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.type === 'money_in' ? 'Money In' : 'Money Out',
        t.category,
        `"${t.description}"`,
        t.amount,
        t.paymentMethod,
        t.reference
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Transaction History</h1>
        </div>
        <div className="text-center py-8">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            Complete overview of money flowing in and out of your business
          </p>
        </div>
        <Button onClick={exportTransactions} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Money In</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalMoneyIn)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Money Out</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalMoneyOut)}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Flow</p>
                <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netFlow)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{summary.transactionCount}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter transactions by date, type, category, or payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="money_in">Money In</SelectItem>
                  <SelectItem value="money_out">Money Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({...filters, paymentMethod: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {getUniquePaymentMethods().map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                dateFrom: '',
                dateTo: '',
                type: 'all',
                category: 'all',
                paymentMethod: 'all'
              })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Detailed view of all your business transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const IconComponent = transaction.icon;
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.date), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${transaction.color}`} />
                          <Badge variant={transaction.type === 'money_in' ? 'default' : 'destructive'}>
                            {transaction.type === 'money_in' ? 'Money In' : 'Money Out'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            Ref: {transaction.reference}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${transaction.color}`}>
                        {transaction.type === 'money_in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Alert>
              <AlertDescription>
                No transactions found matching your criteria. Try adjusting your filters.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;