import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, Users, FileText, DollarSign, Package, Crown, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatNumber } from '../../lib/utils/index.js';

const ModernOverviewCards = ({ data, loading }) => {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3 sm:p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.revenue?.total || 0),
      change: data?.revenue?.this_month || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up'
    },
    {
      title: 'This Month',
      value: formatCurrency(data?.revenue?.this_month || 0),
      change: '+12%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up'
    },
    {
      title: 'Customers',
      value: formatNumber(data?.customers?.total || 0),
      change: `+${data?.customers?.new_this_month || 0} new`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'up'
    },
    {
      title: 'Products',
      value: formatNumber(data?.products?.total || 0),
      change: data?.products?.low_stock > 0 ? `${data.products.low_stock} low stock` : 'All in stock',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: data?.products?.low_stock > 0 ? 'down' : 'up'
    },
    {
      title: 'Outstanding',
      value: formatCurrency(data?.revenue?.outstanding || 0),
      change: data?.invoices?.overdue > 0 ? `${data.invoices.overdue} overdue` : 'All current',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: data?.invoices?.overdue > 0 ? 'down' : 'up'
    },
    {
      title: 'Net Profit',
      value: formatCurrency((data?.revenue?.total || 0) - (data?.expenses?.total || 0)),
      change: '+8.2%',
      icon: Crown,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'up'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {cards.map((card, index) => (
        <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              {card.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1 truncate">{card.title}</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{card.value}</p>
              <p className={`text-xs ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'} truncate`}>
                {card.change}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { ModernOverviewCards };
export default ModernOverviewCards;