import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions, getInvoices, getExpenses, getSales, getPayments } from "../services/api";
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
import MobileDateInput from '@/components/ui/MobileDateInput';

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

  const [selectedTeamMember, setSelectedTeamMember] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        type: filters.type === 'all' ? undefined : filters.type,
        category: filters.category === 'all' ? undefined : filters.category,
        paymentMethod: filters.paymentMethod === 'all' ? undefined : filters.paymentMethod,
      };

      // Add team member filter if selected and user has permission
      if ((user?.role === 'Owner' || user?.role === 'Admin') && selectedTeamMember !== 'all') {
        params.team_member_id = selectedTeamMember;
      }

      // Filter out undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      // Fetch transactions using the new endpoint
      const response = await getTransactions(params);
      
      // The API should return an array of transactions with a type field
      const allTransactions = response.data || [];

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      updateSummary(allTransactions);
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to individual API calls if the new endpoint fails
      await fetchTransactionsFallback();
    } finally {
      setLoading(false);
    }
  }, [filters, selectedTeamMember, user?.role]);

  const fetchTransactionsFallback = async () => {
    try {
      const [invoices, expenses, sales, payments] = await Promise.all([
        getInvoices(),
        getExpenses(),
        getSales(),
        getPayments()
      ]);

      // Process and combine all transactions
      const allTransactions = [
        ...(invoices.data || []).map(t => ({ ...t, type: 'invoice' })),
        ...(expenses.data || []).map(t => ({ ...t, type: 'expense' })),
        ...(sales.data || []).map(t => ({ ...t, type: 'sale' })),
        ...(payments.data || []).map(t => ({ ...t, type: 'payment' }))
      ];

      // Apply team member filter if selected
      let filtered = allTransactions;
      if ((user?.role === 'Owner' || user?.role === 'Admin') && selectedTeamMember !== 'all') {
        filtered = allTransactions.filter(t => 
          t.user_id === selectedTeamMember || 
          (t.salesperson_id === selectedTeamMember) ||
          (t.created_by === selectedTeamMember)
        );
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

      setTransactions(filtered);
      setFilteredTransactions(filtered);
      updateSummary(filtered);
      
    } catch (error) {
      console.error('Error in fallback transaction fetch:', error);
      throw error;
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
    updateSummary(filtered);
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

  const updateSummary = (transactionList) => {
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction History</h1>
          </div>
          <div className="text-center py-8">Loading transactions...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 text-sm sm:text-base">
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
              <ArrowDownLeft className="h-8 w-8 text-green-600" />
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
              <ArrowUpRight className="h-8 w-8 text-red-600" />
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
              <MobileDateInput
                value={filters.dateFrom}
                onChange={(date) => setFilters({...filters, dateFrom: date})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>To Date</Label>
              <MobileDateInput
                value={filters.dateTo}
                onChange={(date) => setFilters({...filters, dateTo: date})}
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
    </DashboardLayout>
  );
};

export default Transactions;
