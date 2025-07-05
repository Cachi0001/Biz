import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from "../services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Package,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Plus,
  Eye,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          overviewData,
          revenueData,
          customersData,
          productsData,
          activitiesData,
        ] = await Promise.all([
          apiService.getDashboardOverview(),
          apiService.getRevenueChart('12months'),
          apiService.getTopCustomers(5),
          apiService.getTopProducts(5),
          apiService.getRecentActivities(10),
        ]);

        setOverview(overviewData);
        setRevenueChart(revenueData.chart_data || []);
        setTopCustomers(customersData.top_customers || []);
        setTopProducts(productsData.top_products || []);
        setRecentActivities(activitiesData.activities || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      paid: 'default',
      successful: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      draft: 'outline',
      active: 'default',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.revenue?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overview?.revenue?.this_month || 0)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.customers?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{overview?.customers?.new_this_month || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.products?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.products?.low_stock || 0} low stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.revenue?.outstanding || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.invoices?.overdue || 0} overdue invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue for the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>
              Your best customers by revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.invoice_count} invoices
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(customer.total_revenue)}
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No customer data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>
              Best selling products by revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.total_quantity} sold
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(product.total_revenue)}
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No product data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest business activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activity.amount > 0 && (
                      <span className="text-sm font-medium">
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/customers">
                <Users className="h-6 w-6 mb-2" />
                Add Customer
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/products">
                <Package className="h-6 w-6 mb-2" />
                Add Product
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/invoices">
                <FileText className="h-6 w-6 mb-2" />
                Create Invoice
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/payments">
                <Eye className="h-6 w-6 mb-2" />
                View Payments
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

