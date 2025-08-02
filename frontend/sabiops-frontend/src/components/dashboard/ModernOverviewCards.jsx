import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, Users, FileText, DollarSign, Package, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatNaira } from '../../utils/formatting';
import { GradientCardWrapper } from '../ui/gradient-card-wrapper';

const ModernOverviewCards = ({ data, loading }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // DEBUG: Log the complete data object
  console.log('ModernOverviewCards - Complete data object:', data);
  console.log('ModernOverviewCards - Revenue data:', data?.revenue);
  console.log('ModernOverviewCards - today_profit_from_sales value:', data?.revenue?.today_profit_from_sales);
  console.log('ModernOverviewCards - profit_from_sales value:', data?.revenue?.profit_from_sales);
  console.log('ModernOverviewCards - this_month_profit_from_sales value:', data?.revenue?.this_month_profit_from_sales);
  console.log('ModernOverviewCards - invoices data:', data?.invoices);
  console.log('ModernOverviewCards - Total revenue:', data?.revenue?.total);
  console.log('ModernOverviewCards - This month revenue:', data?.revenue?.this_month);
  console.log('ModernOverviewCards - Net profit calculation:', (data?.revenue?.total || 0) - (data?.expenses?.total || 0));

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


  const totalRevenue = data?.revenue?.total || 0;
  const thisMonthRevenue = data?.revenue?.this_month || 0;
  const totalExpenses = data?.expenses?.total || 0;
  const thisMonthExpenses = data?.expenses?.this_month || 0;
  const netProfit = totalRevenue - totalExpenses;
  const thisMonthNetProfit = thisMonthRevenue - thisMonthExpenses;
  
  const revenueGrowth = totalRevenue > thisMonthRevenue ? 
    Math.round(((thisMonthRevenue / (totalRevenue - thisMonthRevenue)) * 100)) : 0;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const todayCOGS = data?.revenue?.today_cogs || 0;

  const cards = [
    {
      title: 'Total Revenue',
      value: formatNaira(totalRevenue),
      change: formatNaira(thisMonthRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up'
    },
    {
      title: 'Profit From Sales',
      value: formatNaira(data?.revenue?.total_profit_from_sales || data?.revenue?.profit_from_sales || data?.revenue?.today_profit_from_sales || 0),
      change: `${formatNaira(data?.revenue?.this_month_profit_from_sales || 0)} this month`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: (data?.revenue?.total_profit_from_sales || data?.revenue?.profit_from_sales || data?.revenue?.today_profit_from_sales || 0) > 0 ? 'up' : 'down'
    },
    {
      title: 'Customers',
      value: (data?.customers?.total || 0).toLocaleString(),
      change: `+${data?.customers?.new_this_month || 0} new`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'up',
      path: '/customers'
    },
    {
      title: 'Products',
      value: (data?.products?.total || 0).toLocaleString(),
      change: data?.products?.low_stock > 0 ? `${data.products.low_stock} low stock` : 'All in stock',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: data?.products?.low_stock > 0 ? 'down' : 'up',
      path: '/products'
    },
    {
      title: 'Outstanding',
      value: formatNaira(data?.revenue?.outstanding || 0),
      change: data?.invoices?.overdue > 0 ? `${data.invoices.overdue} overdue` : 'All current',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: data?.invoices?.overdue > 0 ? 'down' : 'up',
      path: '/invoices'
    },
    {
      title: 'Net Profit',
      value: formatNaira(netProfit),
      change: profitMargin > 0 ? `${profitMargin}% margin` : 'Break even',
      icon: Crown,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: netProfit > 0 ? 'up' : 'down'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <GradientCardWrapper 
          key={index} 
          className={`shadow-sm hover:shadow-md transition-shadow ${card.path ? 'cursor-pointer' : ''}`}
          onClick={() => card.path && navigate(card.path)}
          gradientFrom="from-green-100"
          gradientTo="to-green-200"
        >
          <Card className="border-0 bg-transparent">
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
        </GradientCardWrapper>
      ))}
    </div>
  );
};

export { ModernOverviewCards };
export default ModernOverviewCards;