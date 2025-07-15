import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { FileText, Users, Package, TrendingUp, Calculator, CreditCard, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ModernQuickActions = () => {
  const navigate = useNavigate();
  const { role, isOwner, isAdmin, isSalesperson } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const getActionsForRole = () => {
    const baseActions = [
      {
        icon: FileText,
        label: 'New Invoice',
        path: '/invoices',
        color: 'bg-green-600 hover:bg-green-700',
        description: 'Create invoice'
      },
      {
        icon: TrendingUp,
        label: 'Record Sale',
        path: '/sales',
        color: 'bg-blue-600 hover:bg-blue-700',
        description: 'Add new sale'
      }
    ];

    if (isOwner || isAdmin) {
      baseActions.push(
        {
          icon: Package,
          label: 'Add Product',
          path: '/products',
          color: 'bg-purple-600 hover:bg-purple-700',
          description: 'Manage inventory'
        },
        {
          icon: Users,
          label: 'New Customer',
          path: '/customers',
          color: 'bg-orange-600 hover:bg-orange-700',
          description: 'Add customer'
        }
      );
    }

    if (isOwner) {
      baseActions.push(
        {
          icon: Calculator,
          label: 'Add Expense',
          path: '/expenses',
          color: 'bg-red-600 hover:bg-red-700',
          description: 'Track expenses'
        },
        {
          icon: BarChart3,
          label: 'Analytics',
          path: '/analytics',
          color: 'bg-indigo-600 hover:bg-indigo-700',
          description: 'View reports'
        }
      );
    }

    if (isSalesperson) {
      baseActions.push(
        {
          icon: Users,
          label: 'View Customers',
          path: '/customers',
          color: 'bg-teal-600 hover:bg-teal-700',
          description: 'Customer list'
        }
      );
    }

    // Add common actions
    baseActions.push(
      {
        icon: CreditCard,
        label: 'Payments',
        path: '/payments',
        color: 'bg-emerald-600 hover:bg-emerald-700',
        description: 'Payment history'
      },
      {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        color: 'bg-gray-600 hover:bg-gray-700',
        description: 'App settings'
      }
    );

    return baseActions;
  };

  const actions = getActionsForRole();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
      
      {/* Primary Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.slice(0, 4).map((action, index) => (
          <Button
            key={index}
            onClick={() => handleNavigation(action.path)}
            className={`h-20 flex-col space-y-1 text-white ${action.color} shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
          >
            <action.icon className="h-6 w-6" />
            <div className="text-center">
              <div className="text-sm font-semibold">{action.label}</div>
              <div className="text-xs opacity-90">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Secondary Actions */}
      {actions.length > 4 && (
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {actions.slice(4).map((action, index) => (
                <Button
                  key={index + 4}
                  variant="outline"
                  onClick={() => handleNavigation(action.path)}
                  className="h-14 flex-col space-y-1 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  <action.icon className="h-4 w-4 text-gray-600" />
                  <div className="text-xs font-medium text-gray-700">{action.label}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-based Quick Stats */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Role: <span className="font-bold text-green-700">{role}</span>
            </div>
            <div className="text-xs text-gray-600">
              {actions.length} actions available
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { ModernQuickActions };
export default ModernQuickActions;