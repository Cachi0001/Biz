import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Plus, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatNaira, formatDate } from '@/utils/formatting';
import { toastService } from '@/services/ToastService';
import { handleApiErrorWithToast } from '@/utils/errorHandling';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import UsageLimitPrompt from '@/components/subscription/UsageLimitPrompt';
import { 
  SalesTable, 
  SalesMobileCard, 
  SalesStats, 
  SalesFilters, 
  SalesForm 
} from '@/components/sales';
import { getSales, getProductsWithStock, getCustomers, createSale } from "@/services/api";
import { enhancedCreateSale } from "@/services/enhancedApi";

const Sales = () => {
  // State management
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    customer_name: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    salesperson_id: ''
  });
  const [salesStats, setSalesStats] = useState({
    total_sales: 0,
    total_transactions: 0,
    today_sales: 0,
    average_sale: 0,
    total_quantity: 0,
    profit_from_sales_monthly: 0
  });
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Usage tracking
  const { checkUsageLimit, isLimitReached } = useUsageTracking();

  // Fetch products data
  const fetchProductsData = useCallback(async () => {
    try {
      setProductsLoading(true);
      const response = await getProductsWithStock();
      
      // Handle different response formats
      let productsData = [];
      if (Array.isArray(response)) {
        productsData = response;
      } else if (response && Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response && response.products && Array.isArray(response.products)) {
        productsData = response.products;
      } else if (response && response.data && response.data.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else {
        console.warn('Unexpected products data format:', response);
        productsData = [];
      }
      
      setProducts(productsData);
      setProductsError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError('Failed to load products. Please try again.');
      setProducts([]); // Ensure products is set to empty array on error
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Fetch customers data
  const fetchCustomersData = useCallback(async () => {
    try {
      const response = await getCustomers();
      
      // Handle different response formats
      let customersData = [];
      if (Array.isArray(response)) {
        customersData = response;
      } else if (response && Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response && response.customers && Array.isArray(response.customers)) {
        customersData = response.customers;
      } else if (response && response.data && response.data.customers && Array.isArray(response.data.customers)) {
        customersData = response.data.customers;
      } else {
        console.warn('Unexpected customers data format:', response);
        customersData = [];
      }
      
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]); // Ensure customers is set to empty array on error
    }
  }, []);

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSales();
      
      // Handle different response formats
      let salesData = [];
      if (Array.isArray(response)) {
        salesData = response;
      } else if (response && Array.isArray(response.data)) {
        salesData = response.data;
      } else if (response && response.sales && Array.isArray(response.sales)) {
        salesData = response.sales;
      } else if (response && response.data && response.data.sales && Array.isArray(response.data.sales)) {
        salesData = response.data.sales;
      } else {
        console.warn('Unexpected sales data format:', response);
        salesData = [];
      }
      
      setSales(salesData);
      
      // Calculate sales stats
      const stats = calculateSalesStats(salesData);
      setSalesStats(stats);
      
      setError('');
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to load sales data. Please try again.');
      setSales([]); // Ensure sales is set to empty array on error
      setSalesStats({
        total_sales: 0,
        total_transactions: 0,
        today_sales: 0,
        average_sale: 0,
        total_quantity: 0,
        profit_from_sales_monthly: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate sales statistics
  const calculateSalesStats = (salesData) => {
    // Ensure salesData is an array
    const safeSalesData = Array.isArray(salesData) ? salesData : [];
    const today = new Date().toISOString().split('T')[0];
    
    // Safely filter monthly sales
    const monthlySales = safeSalesData.filter(sale => {
      try {
        const saleDate = sale?.date || sale?.created_at;
        return saleDate && new Date(saleDate).toISOString().split('T')[0].startsWith(today.substring(0, 7));
      } catch (e) {
        console.warn('Error processing sale date:', e);
        return false;
      }
    });

    // Helper function to safely calculate sum
    const safeSum = (data, key) => {
      if (!Array.isArray(data)) return 0;
      return data.reduce((sum, item) => {
        const value = parseFloat(item?.[key] || 0);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    };

    // Calculate today's sales
    const todaySales = safeSalesData.filter(sale => {
      try {
        const saleDate = sale?.date || sale?.created_at;
        return saleDate && new Date(saleDate).toISOString().split('T')[0] === today;
      } catch (e) {
        return false;
      }
    });

    const totalSales = safeSum(safeSalesData, 'total_amount');
    const totalQuantity = safeSum(safeSalesData, 'quantity');
    const monthlyProfit = safeSum(monthlySales, 'profit_from_sales');

    return {
      total_sales: totalSales,
      total_transactions: safeSalesData.length,
      today_sales: safeSum(todaySales, 'total_amount'),
      average_sale: safeSalesData.length > 0 ? totalSales / safeSalesData.length : 0,
      total_quantity: totalQuantity,
      profit_from_sales_monthly: monthlyProfit
    };
  };



  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check usage limits before proceeding
    if (isLimitReached('sales')) {
      return;
    }

    setSubmitting(true);
    
    try {
      // Validate form data
      if (!formData.product_id) {
        throw new Error('Please select a product');
      }
      
      if (!formData.quantity || formData.quantity <= 0) {
        throw new Error('Please enter a valid quantity');
      }
      
      if (!formData.unit_price || formData.unit_price < 0) {
        throw new Error('Please enter a valid unit price');
      }
      
      if (!formData.payment_method) {
        throw new Error('Please select a payment method');
      }

      // Create sale data
      const saleData = {
        ...formData,
        date: new Date().toISOString(),
        status: 'completed',
        // Add any additional fields required by your API
      };

      // Call the API to create the sale
      const newSale = await enhancedCreateSale(saleData);
      
      // Update local state
      setSales(prevSales => [newSale, ...prevSales]);
      
      // Update sales stats
      setSalesStats(prevStats => ({
        ...prevStats,
        total_sales: prevStats.total_sales + (newSale.total_amount || 0),
        total_transactions: prevStats.total_transactions + 1,
        today_sales: new Date(newSale.date).toISOString().split('T')[0] === 
                     new Date().toISOString().split('T')[0]
          ? prevStats.today_sales + (newSale.total_amount || 0)
          : prevStats.today_sales,
        total_quantity: prevStats.total_quantity + (parseInt(newSale.quantity) || 0),
        profit_from_sales_monthly: new Date(newSale.date).toISOString().startsWith(
          new Date().toISOString().substring(0, 7)
        ) ? prevStats.profit_from_sales_monthly + (newSale.profit_from_sales || 0) 
           : prevStats.profit_from_sales_monthly
      }));
      
      // Show success message
      toastService.success('Sale recorded successfully!');
      
      // Reset form and close dialog
      setFormData({
        product_id: '',
        customer_id: '',
        customer_name: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
        payment_method: 'cash',
        date: new Date().toISOString().split('T')[0],
        salesperson_id: ''
      });
      setShowAddDialog(false);
      
      // Update usage tracking
      checkUsageLimit('sales');
      
    } catch (error) {
      console.error('Error creating sale:', error);
      handleApiErrorWithToast(error, 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle download report
  const handleDownloadReport = async () => {
    try {
      // Implement your download report logic here
      toastService.success('Sales report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toastService.error('Failed to download report');
    }
  };

  // Filter sales based on search term and date
  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = !searchTerm || 
        (sale.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.payment_method || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = !selectedDate || 
        (sale.date || '').startsWith(selectedDate) || 
        (sale.created_at || '').startsWith(selectedDate);
      
      return matchesSearch && matchesDate;
    });
  }, [sales, searchTerm, selectedDate]);

  // Fetch initial data
  useEffect(() => {
    fetchSales();
    fetchProductsData();
    fetchCustomersData();
    
    // Cleanup function to avoid memory leaks
    return () => {
      // Any cleanup if needed
    };
  }, [fetchSales, fetchProductsData, fetchCustomersData]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
                <p className="text-gray-600 mt-1">Record sales and track performance</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.href = '/sales/report'}
                  variant="outline"
                  className="h-11 px-6 text-sm font-medium"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Sales Report
                </Button>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="h-11 px-6 text-sm font-medium bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Usage Limit Prompt */}
          <UsageLimitPrompt />

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
                    fetchSales();
                  }}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Sales Statistics */}
          <SalesStats stats={salesStats} />

          {/* Filters Section */}
          <SalesFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onRefresh={fetchSales}
            onDownload={handleDownloadReport}
            loading={loading}
          />

          {/* Sales Data Section */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Sales for {formatDate(selectedDate)}
                  </CardTitle>
                  <CardDescription>
                    {filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''} found
                    {sales.length > 0 && filteredSales.length !== sales.length && 
                      ` (${sales.length} total)`
                    }
                  </CardDescription>
                </div>
                {filteredSales.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-green-600">
                      {formatNaira(filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0))}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile View */}
              <div className="lg:hidden">
                <SalesMobileCard 
                  sales={filteredSales} 
                  onView={(sale) => {
                    // Handle view action
                    console.log('View sale:', sale);
                  }} 
                />
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block">
                <SalesTable 
                  sales={filteredSales} 
                  onView={(sale) => {
                    // Handle view action
                    console.log('View sale:', sale);
                  }} 
                  loading={loading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Sale Dialog */}
        <SalesForm
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleSubmit}
          loading={submitting}
          products={products}
          customers={customers}
          formData={formData}
          setFormData={setFormData}
          productsLoading={productsLoading}
          productsError={productsError}
          fetchProductsData={fetchProductsData}
        />
      </div>
    </DashboardLayout>
  );
};

export default Sales;
