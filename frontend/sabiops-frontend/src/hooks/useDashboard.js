import { useState, useEffect } from 'react';
import { getDashboardOverview } from '../services/api';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from backend
      const response = await getDashboardOverview();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Fallback to mock data for development
      const mockData = {
        revenue: { total: 450000, this_month: 85000, outstanding: 25000 },
        customers: { total: 145, new_this_month: 12 },
        products: { total: 89, low_stock: 3 },
        invoices: { overdue: 2 },
        expenses: { total: 120000, this_month: 22000 },
        recent_activities: [
          { type: 'sale', description: 'Sold 2 Office Chairs to John Doe', timestamp: '2025-01-07T10:00:00Z' },
          { type: 'invoice', description: 'Invoice #INV-1234 paid by Jane Smith', timestamp: '2025-01-07T09:30:00Z' },
        ]
      };
      setDashboardData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    dashboardData,
    loading,
    error,
    refreshData,
  };
};