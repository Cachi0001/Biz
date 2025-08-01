import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, TrendingUp } from 'lucide-react';
import { GradientCardWrapper } from '../ui/gradient-card-wrapper';

const ModernChartsSection = ({ data, loading, analyticsData }) => {
  const { role, subscription, isFreeTrial } = useAuth();

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get revenue trends from analytics data or use mock data
  const revenueTrends = analyticsData?.revenue?.trends || [];
  const cashFlowTrends = analyticsData?.financial?.cash_flow_trends || [];
  
  // Debug logs for troubleshooting
  console.log('ModernChartsSection Debug:', {
    analyticsData: analyticsData,
    revenueTrends: revenueTrends,
    cashFlowTrends: cashFlowTrends,
    dashboardData: data
  });
  
  // Create a combined dataset with revenue from revenue trends and expenses from cash flow trends
  let chartRevenueData = [];
  
  if (revenueTrends.length > 0) {
    // Use revenue trends as the base and match with cash flow data for expenses
    chartRevenueData = revenueTrends.map(revenueItem => {
      // Find matching period in cash flow data for expenses
      const matchingCashFlow = cashFlowTrends.find(cashFlow => 
        cashFlow.period === revenueItem.period
      );
      
      return {
        month: revenueItem.period,
        revenue: revenueItem.revenue || 0,
        expenses: matchingCashFlow?.money_out || 0,
        profit: revenueItem.profit || 0
      };
    });
  } else if (cashFlowTrends.length > 0) {
    // If no revenue trends but have cash flow data, use that
    chartRevenueData = cashFlowTrends.map(cashFlow => ({
      month: cashFlow.period,
      revenue: cashFlow.money_in || 0,
      expenses: cashFlow.money_out || 0,
      profit: (cashFlow.money_in || 0) - (cashFlow.money_out || 0)
    }));
  } else if (data?.revenue_chart) {
    // Fallback to dashboard data
    chartRevenueData = data.revenue_chart.map(item => ({
      month: item.period || item.month,
      revenue: item.revenue || 0,
      expenses: item.expenses || 0,
      profit: item.profit || 0
    }));
  } else {
    // Final fallback to mock data with expenses
    chartRevenueData = [
      { month: 'Jan', revenue: 12000, expenses: 8000 },
      { month: 'Feb', revenue: 19000, expenses: 12000 },
      { month: 'Mar', revenue: 15000, expenses: 9000 },
      { month: 'Apr', revenue: 22000, expenses: 13000 },
      { month: 'May', revenue: 18000, expenses: 11000 },
      { month: 'Jun', revenue: 25000, expenses: 14000 },
    ];
  }
  
  // Additional debug log for chart data
  console.log('Chart Revenue Data:', chartRevenueData);

  const topProductsData = analyticsData?.products?.top_products_by_revenue?.slice(0, 4).map((product, index) => ({
    name: product.name || `Product ${index + 1}`,
    value: Math.round(product.revenue || 0),
    color: ['#16a34a', '#8b5cf6', '#3b82f6', '#f59e0b'][index] || '#6b7280'
  })) || [
    { name: 'Office Chair', value: 45, color: '#16a34a' },
    { name: 'Desk Lamp', value: 35, color: '#8b5cf6' },
    { name: 'Notebook', value: 25, color: '#3b82f6' },
    { name: 'Pen Set', value: 20, color: '#f59e0b' },
  ];

  // Generate sales data from analytics or use mock data
  const salesData = analyticsData?.revenue?.trends?.slice(-7).map((item, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `Day ${index + 1}`,
    sales: item.orders || 0,
    target: 15 // This could be configurable
  })) || [
    { day: 'Mon', sales: 12, target: 15 },
    { day: 'Tue', sales: 19, target: 15 },
    { day: 'Wed', sales: 8, target: 15 },
    { day: 'Thu', sales: 15, target: 15 },
    { day: 'Fri', sales: 22, target: 15 },
    { day: 'Sat', sales: 18, target: 15 },
    { day: 'Sun', sales: 9, target: 15 },
  ];

  const getChartsForRole = () => {
    if (isFreeTrial) {
      return [
        {
          title: 'Revenue vs Expenses',
          subtitle: 'Monthly comparison',
          component: (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartRevenueData.slice(0, 3)} barCategoryGap="2%">
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis hide />
                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      ];
    }

    const charts = [
      {
        title: 'Revenue vs Expenses',
        subtitle: 'Monthly comparison',
        component: (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartRevenueData} barCategoryGap="2%">
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis hide />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    ];

    if (role === 'Owner' || role === 'Admin') {
      charts.push({
        title: 'Top Products',
        subtitle: 'Sales distribution',
        component: (
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0">
            <div className="w-full sm:w-auto flex justify-center">
              <ResponsiveContainer width={140} height={140} minWidth={120}>
                <PieChart>
                  <Pie
                    data={topProductsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {topProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:ml-4 space-y-1">
              {topProductsData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      });
    }

    if (role === 'Salesperson') {
      charts.push({
        title: 'Daily Sales',
        subtitle: 'This week',
        component: (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={salesData} barCategoryGap="25%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis hide />
              <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={35} />
              <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} maxBarSize={35} />
            </BarChart>
          </ResponsiveContainer>
        )
      });
    }

    return charts;
  };

  const charts = getChartsForRole();

  return (
    <div className="space-y-4">
      {charts.map((chart, index) => (
        <GradientCardWrapper
          key={index}
          className="shadow-lg hover:shadow-xl transition-shadow"
          gradientFrom="from-blue-100"
          gradientTo="to-blue-200"
        >
          <Card className="border-0 bg-transparent overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 shadow-sm" />
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-green-900 flex items-center space-x-2">
                    <span>{chart.title}</span>
                    {isFreeTrial && index === 0 && (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    )}
                  </CardTitle>
                  <p className="text-xs text-green-700 mt-1 font-medium">{chart.subtitle}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 bg-gradient-to-br from-white to-green-50">
              {chart.component}
            </CardContent>
          </Card>
        </GradientCardWrapper>
      ))}
    </div>
  );
};

export { ModernChartsSection };
export default ModernChartsSection;