import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardOverview } from '../services/api';

const DashboardMinimal = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState({
    revenue: { total: 0, this_month: 0 },
    customers: { total: 0, new_this_month: 0 },
    products: { total: 0, low_stock: 0 },
    invoices: { overdue: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[MINIMAL DASHBOARD] Fetching data...");
        const data = await getDashboardOverview();
        console.log("[MINIMAL DASHBOARD] Data received:", data);
        
        if (data) {
          setOverview({
            revenue: data.revenue || { total: 0, this_month: 0 },
            customers: data.customers || { total: 0, new_this_month: 0 },
            products: data.products || { total: 0, low_stock: 0 },
            invoices: data.invoices || { overdue: 0 }
          });
        }
      } catch (err) {
        console.error("[MINIMAL DASHBOARD] Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-primary text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(overview?.revenue?.total || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ₦{(overview?.revenue?.this_month || 0).toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
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
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.invoices?.overdue || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800">Minimal Dashboard Test</h3>
        <p className="text-green-700 text-sm mt-1">
          This is a simplified version of the dashboard to test for minification issues.
          If this loads successfully, the issue is likely in the charts or custom components.
        </p>
      </div>
    </div>
  );
};

export default DashboardMinimal;

