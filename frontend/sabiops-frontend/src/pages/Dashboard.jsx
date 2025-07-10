import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFinancials } from '../services/api';

// Simple fallback components (no external dependencies)
const SimpleCard = ({ children, className = '', ...props }) => (
  <div className={`border rounded-lg p-4 bg-white shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const SimpleCardHeader = ({ children, className = '', ...props }) => (
  <div className={`pb-2 ${className}`} {...props}>{children}</div>
);

const SimpleCardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
);

const SimpleCardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`font-medium text-sm ${className}`} {...props}>{children}</h3>
);

const SimpleButton = ({ children, asChild, className = '', ...props }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors ${className}`,
      ...props
    });
  }
  return (
    <button className={`inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors ${className}`} {...props}>
      {children}
    </button>
  );
};

// Simple icon component
const SimpleIcon = ({ name, className = 'h-4 w-4' }) => {
  const iconMap = {
    Plus: '➕',
    DollarSign: '💰',
    Users: '👥',
    Package: '📦',
    FileText: '📄',
    AlertTriangle: '⚠️',
    Crown: '👑'
  };
  
  return (
    <span className={`inline-flex items-center justify-center ${className}`} title={name}>
      {iconMap[name] || '📊'}
    </span>
  );
};

const DashboardFixed = () => {
  const [mounted, setMounted] = useState(false);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safe useAuth with error boundary
  let authData = null;
  try {
    authData = useAuth();
    console.log('[FIXED DASHBOARD] Auth data:', authData);
  } catch (err) {
    console.error('[FIXED DASHBOARD] useAuth error:', err);
    setError('Authentication error');
  }

  useEffect(() => {
    console.log('[FIXED DASHBOARD] Component mounted');
    setMounted(true);

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getFinancials();
        setFinancials(data);
        setError(null);
      } catch (err) {
        setError('Failed to load financials');
      } finally {
        setLoading(false);
      }
    };

    if (authData?.user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [authData]);

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      return `₦${(amount || 0).toLocaleString()}`;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 border border-red-200 bg-red-50 rounded-lg">
          <h1 className="text-xl font-bold text-red-800">Dashboard Error</h1>
          <p className="text-red-600 mt-2">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!mounted || !authData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (authData.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!authData.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 border border-yellow-200 bg-yellow-50 rounded-lg">
          <h1 className="text-xl font-bold text-yellow-800">Not Authenticated</h1>
          <p className="text-yellow-600 mt-2">Please log in to access the dashboard</p>
        </div>
      </div>
    );
  }

  const user = authData.user || {};
  const userName = user.full_name || user.name || 'User';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-green-700">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-green-900">
            Welcome back, {userName}!
          </h1>
          <p className="text-green-700 text-sm sm:text-base">
            Your business at a glance. All figures in <span className="font-semibold">₦</span> Naira.
          </p>
        </div>
        <div className="flex space-x-2">
          <SimpleButton asChild>
            <Link to="/invoices/new">
              <SimpleIcon name="Plus" className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </SimpleButton>
        </div>
      </div>
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard className="bg-green-50 border-green-200">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Revenue</SimpleCardTitle>
            <SimpleIcon name="DollarSign" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="text-2xl font-bold text-green-800">{formatCurrency(financials?.revenue?.total)}</div>
            <p className="text-xs text-green-700">This month: {formatCurrency(financials?.revenue?.this_month)}</p>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard className="bg-green-50 border-green-200">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">COGS</SimpleCardTitle>
            <SimpleIcon name="Package" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="text-2xl font-bold text-green-800">{formatCurrency(financials?.cogs?.total)}</div>
            <p className="text-xs text-green-700">This month: {formatCurrency(financials?.cogs?.this_month)}</p>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard className="bg-green-50 border-green-200">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Gross Profit</SimpleCardTitle>
            <SimpleIcon name="DollarSign" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="text-2xl font-bold text-green-800">{formatCurrency(financials?.gross_profit?.total)}</div>
            <p className="text-xs text-green-700">This month: {formatCurrency(financials?.gross_profit?.this_month)}</p>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard className="bg-green-50 border-green-200">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Net Profit</SimpleCardTitle>
            <SimpleIcon name="DollarSign" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="text-2xl font-bold text-green-800">{formatCurrency(financials?.net_profit?.total)}</div>
            <p className="text-xs text-green-700">This month: {formatCurrency(financials?.net_profit?.this_month)}</p>
          </SimpleCardContent>
        </SimpleCard>
      </div>
      {/* Cash Flow & Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SimpleCard className="bg-white border-green-100">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Cash Flow</SimpleCardTitle>
            <SimpleIcon name="DollarSign" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="flex flex-col gap-1">
              <span className="text-green-700 text-sm">Money In: <span className="font-semibold">{formatCurrency(financials?.cash_flow?.money_in)}</span></span>
              <span className="text-green-700 text-sm">Money Out: <span className="font-semibold">{formatCurrency(financials?.cash_flow?.money_out)}</span></span>
              <span className="text-green-900 font-bold">Net: {formatCurrency(financials?.cash_flow?.net)}</span>
            </div>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard className="bg-white border-green-100">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Inventory Value</SimpleCardTitle>
            <SimpleIcon name="Package" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="text-2xl font-bold text-green-800">{formatCurrency(financials?.inventory_value)}</div>
            <p className="text-xs text-green-700">Low stock: {financials?.low_stock?.length || 0}</p>
          </SimpleCardContent>
        </SimpleCard>
          </div>
      {/* Expenses by Category & Top Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SimpleCard className="bg-white border-green-100">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Expenses by Category</SimpleCardTitle>
            <SimpleIcon name="FileText" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <ul className="text-green-800 text-sm space-y-1">
              {financials?.expenses?.by_category && Object.entries(financials.expenses.by_category).map(([cat, amt]) => (
                <li key={cat} className="flex justify-between"><span>{cat}</span><span>{formatCurrency(amt)}</span></li>
              ))}
            </ul>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard className="bg-white border-green-100">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Top Products</SimpleCardTitle>
            <SimpleIcon name="Package" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <ul className="text-green-800 text-sm space-y-1">
              {financials?.top_products && financials.top_products.map((p) => (
                <li key={p.name} className="flex justify-between"><span>{p.name}</span><span>{p.quantity}</span></li>
              ))}
            </ul>
          </SimpleCardContent>
        </SimpleCard>
        </div>
      {/* Top Expenses & Low Stock Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SimpleCard className="bg-white border-green-100">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Top Expenses</SimpleCardTitle>
            <SimpleIcon name="FileText" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <ul className="text-green-800 text-sm space-y-1">
              {financials?.top_expenses && financials.top_expenses.map((e) => (
                <li key={e.category} className="flex justify-between"><span>{e.category}</span><span>{formatCurrency(e.amount)}</span></li>
              ))}
            </ul>
          </SimpleCardContent>
        </SimpleCard>
        <SimpleCard className="bg-white border-green-100">
          <SimpleCardHeader className="flex flex-row items-center justify-between pb-2">
            <SimpleCardTitle className="text-green-900">Low Stock Alerts</SimpleCardTitle>
            <SimpleIcon name="AlertTriangle" className="h-5 w-5 text-green-600" />
          </SimpleCardHeader>
          <SimpleCardContent>
            <ul className="text-red-700 text-sm space-y-1">
              {financials?.low_stock && financials.low_stock.length > 0 ? (
                financials.low_stock.map((p) => (
                  <li key={p.name} className="flex justify-between"><span>{p.name}</span><span>{p.quantity}</span></li>
                ))
              ) : (
                <li className="text-green-700">All products in stock</li>
              )}
            </ul>
          </SimpleCardContent>
        </SimpleCard>
      </div>
      {/* Mobile-First: Ensure all sections are stacked and scrollable on 360px screens */}
      <div className="mt-8 text-xs text-green-700 text-center">
        <p>All insights are calculated in real-time for Nigerian SMEs. For help, tap any card title for a tooltip.</p>
      </div>
    </div>
  );
};

export default DashboardFixed;

