import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, TrendingUp } from 'lucide-react';
import { GradientCardWrapper } from '../ui/gradient-card-wrapper';

const ModernChartsSection = ({ data, loading }) => {
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

  const revenueData = data?.revenue_chart || [
    { month: 'Jan', revenue: 12000, expenses: 8000 },
    { month: 'Feb', revenue: 19000, expenses: 12000 },
    { month: 'Mar', revenue: 15000, expenses: 9000 },
    { month: 'Apr', revenue: 22000, expenses: 13000 },
    { month: 'May', revenue: 18000, expenses: 11000 },
    { month: 'Jun', revenue: 25000, expenses: 14000 },
  ];

  const topProductsData = [
    { name: 'Office Chair', value: 45, color: '#16a34a' },
    { name: 'Desk Lamp', value: 35, color: '#8b5cf6' },
    { name: 'Notebook', value: 25, color: '#3b82f6' },
    { name: 'Pen Set', value: 20, color: '#f59e0b' },
  ];

  const salesData = [
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
          title: 'Revenue Trend',
          subtitle: 'Last 3 months (Trial)',
          component: (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={revenueData.slice(0, 3)}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#revenueGradient)"
                  strokeWidth={3}
                  dot={false}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
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
            <BarChart data={revenueData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis hide />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={topProductsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="ml-4 space-y-1">
              {topProductsData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                  <span className="text-xs font-medium text-gray-900">{item.value}</span>
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
            <BarChart data={salesData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis hide />
              <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
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