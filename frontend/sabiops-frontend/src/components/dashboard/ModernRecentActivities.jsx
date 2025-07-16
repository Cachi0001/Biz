import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Activity, TrendingUp, FileText, CreditCard, Package, Users, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../lib/utils/index.js';
import { GradientCardWrapper } from '../ui/gradient-card-wrapper';

const ModernRecentActivities = ({ activities, loading }) => {
  const { subscription, isFreeTrial } = useAuth();

  if (loading) {
    return (
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mockActivities = activities || [
    { 
      type: 'sale', 
      description: 'Sold 2 Office Chairs to John Doe', 
      timestamp: '2025-01-07T10:00:00Z', 
      amount: '₦45,000' 
    },
    { 
      type: 'invoice', 
      description: 'Invoice #INV-1234 paid by Jane Smith', 
      timestamp: '2025-01-07T08:00:00Z', 
      amount: '₦15,000' 
    },
    { 
      type: 'product', 
      description: 'Added new product: Desk Lamp', 
      timestamp: '2025-01-07T06:00:00Z' 
    },
    { 
      type: 'payment', 
      description: 'Received payment via transfer', 
      timestamp: '2025-01-07T04:00:00Z', 
      amount: '₦25,000' 
    },
    { 
      type: 'customer', 
      description: 'New customer: Alice Johnson', 
      timestamp: '2025-01-06T14:00:00Z' 
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'sale': return TrendingUp;
      case 'invoice': return FileText;
      case 'payment': return CreditCard;
      case 'product': return Package;
      case 'customer': return Users;
      default: return Activity;
    }
  };

  const getActivityGradient = (type) => {
    switch (type) {
      case 'sale': return 'from-green-500 to-teal-500';
      case 'invoice': return 'from-blue-500 to-indigo-500';
      case 'payment': return 'from-purple-500 to-pink-500';
      case 'product': return 'from-orange-500 to-red-500';
      case 'customer': return 'from-teal-500 to-green-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDateTime(timestamp);
  };

  return (
    <GradientCardWrapper
      className="shadow-lg hover:shadow-xl transition-shadow"
      gradientFrom="from-blue-100"
      gradientTo="to-purple-100"
    >
      <Card className="border-0 bg-transparent overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 shadow-sm" />
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-sm font-semibold text-blue-900 flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span>Recent Activities</span>
            {isFreeTrial && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 bg-gradient-to-br from-white to-blue-50">
          <div className="space-y-3">
            {mockActivities.slice(0, 5).map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const gradient = getActivityGradient(activity.type);
              
              return (
                <div 
                  key={index} 
                  className="flex items-start space-x-3 group hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 p-3 rounded-lg transition-all duration-200 border border-transparent hover:border-green-200"
                >
                  <div className={`p-2 rounded-full bg-gradient-to-br ${gradient} shadow-md`}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-900 font-medium leading-5">
                        {activity.description}
                      </p>
                      {activity.amount && (
                        <span className="text-xs font-semibold text-green-600 ml-2 flex-shrink-0 bg-green-100 px-2 py-1 rounded-full">
                          {activity.amount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* View All Button */}
          <div className="mt-4 pt-3 border-t border-blue-100">
            <button className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors">
              View All Activities →
            </button>
          </div>
        </CardContent>
      </Card>
    </GradientCardWrapper>
  );
};

export { ModernRecentActivities };
export default ModernRecentActivities;