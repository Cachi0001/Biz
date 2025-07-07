import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from "../services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionBadge from '@/components/ui/subscription-badge';
import RoleBasedWrapper from '@/components/ui/role-based-wrapper';
import UpgradePrompt from '@/components/ui/upgrade-prompt';
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
  Clock,
  Crown,
  Settings,
} from 'lucide-react';

const Dashboard = () => {
  const { user, isFreeTrial, isPremium, trialDaysLeft, canAccessFeature } = useAuth();
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
      {/* Welcome Header with Subscription Status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || user?.full_name}!
            </h1>
            <SubscriptionBadge 
              subscriptionStatus={user?.subscription_status} 
              trialDaysLeft={trialDaysLeft}
            />
          </div>
          <p className="text-muted-foreground">
            Here's what's happening with your business today.
          </p>
          
          {/* Free Trial Warning */}
          {isFreeTrial && trialDaysLeft <= 3 && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Your free trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}. 
                <Link to="/subscription/upgrade" className="ml-1 underline font-medium">
                  Upgrade now
                </Link>
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <RoleBasedWrapper allowedRoles={['admin', 'standard_user']}>
            <Button asChild>
              <Link to="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </RoleBasedWrapper>
          
          {isFreeTrial && (
            <Button asChild variant="outline">
              <Link to="/subscription/upgrade">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Free Trial Upgrade Prompt */}
      {isFreeTrial && trialDaysLeft > 3 && (
        <UpgradePrompt variant="banner" showFeatures={false} />
      )}

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
            <CardTitle className="text-sm font-medium">
              Customers
              {isFreeTrial && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({overview?.customers?.total || 0}/10)
                </span>
              )}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.customers?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{overview?.customers?.new_this_month || 0} new this month
            </p>
            {isFreeTrial && (overview?.customers?.total || 0) >= 8 && (
              <p className="text-xs text-yellow-600 mt-1">
                Approaching limit. Upgrade for unlimited customers.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products
              {isFreeTrial && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({overview?.products?.total || 0}/5)
                </span>
              )}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.products?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.products?.low_stock || 0} low stock
            </p>
            {isFreeTrial && (overview?.products?.total || 0) >= 4 && (
              <p className="text-xs text-yellow-600 mt-1">
                Approaching limit. Upgrade for unlimited products.
              </p>
            )}
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
            <CardTitle className="flex items-center gap-2">
              Revenue Overview
              {!canAccessFeature('advanced_reports') && (
                <Badge variant="outline" className="text-xs">
                  Basic
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {canAccessFeature('advanced_reports') 
                ? 'Monthly revenue for the last 12 months'
                : 'Basic revenue overview (upgrade for advanced analytics)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {canAccessFeature('advanced_reports') ? (
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
            ) : (
              <div className="h-[350px] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Advanced charts available in paid plans</p>
                  <Button asChild size="sm">
                    <Link to="/subscription/upgrade">
                      Upgrade Now
                    </Link>
                  </Button>
                </div>
              </div>
            )}
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
              {topCustomers.slice(0, isFreeTrial ? 3 : 5).map((customer, index) => (
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
              {isFreeTrial && topCustomers.length > 3 && (
                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    +{topCustomers.length - 3} more customers
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/subscription/upgrade">
                      Upgrade to see all
                    </Link>
                  </Button>
                </div>
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
              {topProducts.slice(0, isFreeTrial ? 3 : 5).map((product, index) => (
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
              {isFreeTrial && topProducts.length > 3 && (
                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    +{topProducts.length - 3} more products
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/subscription/upgrade">
                      Upgrade to see all
                    </Link>
                  </Button>
                </div>
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
            <RoleBasedWrapper allowedRoles={['admin', 'standard_user']}>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to="/customers">
                  <Users className="h-6 w-6 mb-2" />
                  Add Customer
                </Link>
              </Button>
            </RoleBasedWrapper>
            
            <RoleBasedWrapper allowedRoles={['admin', 'standard_user']}>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to="/products">
                  <Package className="h-6 w-6 mb-2" />
                  Add Product
                </Link>
              </Button>
            </RoleBasedWrapper>
            
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

      {/* Upgrade Prompt for Free Trial Users */}
      {isFreeTrial && trialDaysLeft <= 7 && (
        <UpgradePrompt showFeatures={true} />
      )}
    </div>
  );
};

export default Dashboard;

