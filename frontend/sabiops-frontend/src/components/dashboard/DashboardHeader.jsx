import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

const DashboardHeader = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-green-100 text-sm">
              {user?.business_name || 'SabiOps Dashboard'} • {user?.role || 'User'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white bg-opacity-10 rounded-lg p-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-green-100 text-xs">Today's Sales</p>
            <p className="text-white font-semibold">₦0</p>
          </div>
          <div>
            <p className="text-green-100 text-xs">This Month</p>
            <p className="text-white font-semibold">₦0</p>
          </div>
          <div>
            <p className="text-green-100 text-xs">Total Revenue</p>
            <p className="text-white font-semibold">₦0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DashboardHeader };
export default DashboardHeader;