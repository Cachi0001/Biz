import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  PlusCircle, 
  BarChart3, 
  Settings,
  Users,
  Package,
  FileText,
  CreditCard,
  Receipt,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils/index.js';

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isOwner, isAdmin } = useAuth();
  
  const getNavigationItems = () => {
    // Core items based on role
    const coreItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Customers', path: '/customers' },
      { icon: FileText, label: 'Invoices', path: '/invoices' },
      { icon: TrendingUp, label: 'Sales', path: '/sales' }, // Fixed path
    ];

    // Add Team as a core item for owners (positioned between Sales and Analytics)
    if (isOwner) {
      coreItems.push({ icon: Package, label: 'Products', path: '/products' });
    }

    // If we already have 5 items, return them
    if (coreItems.length >= 5) {
      return coreItems;
    }

    // Add the 5th item based on current page or role
    let fifthItem;
    
    // If we're on a specific page, show relevant action
    if (location.pathname.includes('/products')) {
      fifthItem = { icon: Package, label: 'Products', path: '/products' };
    } else if (location.pathname.includes('/expenses')) {
      fifthItem = { icon: Receipt, label: 'Expenses', path: '/expenses' };
    } else if (location.pathname.includes('/transactions')) {
      fifthItem = { icon: CreditCard, label: 'Money', path: '/transactions' };
    } else if (location.pathname.includes('/analytics')) {
      fifthItem = { icon: BarChart3, label: 'Analytics', path: '/analytics' };
    } else {
      // Default 5th item based on role
      if (isOwner) {
        fifthItem = { icon: Package, label: 'Products', path: '/products' };
      } else if (isAdmin) {
        fifthItem = { icon: Package, label: 'Products', path: '/products' };
      } else {
        fifthItem = { icon: Settings, label: 'Settings', path: '/settings' };
      }
    }

    return [...coreItems, fifthItem];
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (path) => {
    // Check if analytics is locked for free plan
    if (path === '/analytics' && user?.subscription_status === 'trial') {
      alert('Upgrade to access advanced analytics');
      return;
    }
    
    // Check if team management is restricted to Owner only
    if (path === '/team' && !isOwner) {
      alert('Team management is only available to business owners');
      return;
    }
    
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-500 border-t border-green-400 z-50 safe-area-pb">
      <div className="px-2 py-1">
        <div className="grid grid-cols-5 gap-1 w-full">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors rounded-lg min-h-[64px] touch-manipulation",
                  isActive
                    ? "text-white bg-green-600"
                    : "text-white hover:text-green-100 hover:bg-green-600 active:bg-green-700",
                  item.path === '/analytics' && user?.subscription_status === 'trial' && "opacity-60"
                )}
                style={{ minHeight: '64px', minWidth: '48px' }}
              >
                <item.icon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-center leading-tight truncate w-full text-[10px] sm:text-xs">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { MobileNavigation };
export default MobileNavigation;