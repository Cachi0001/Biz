import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { FileText, Users, Package, TrendingUp, Calculator, CreditCard, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GradientCardWrapper } from '../ui/gradient-card-wrapper';

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
        variant: 'primary',
        description: 'Create invoice'
      },
      {
        icon: TrendingUp,
        label: 'Record Sale',
        path: '/sales',
        variant: 'primary',
        description: 'Add new sale'
      }
    ];

    if (isOwner || isAdmin) {
      baseActions.push(
        {
          icon: Package,
          label: 'Add Product',
          path: '/products',
          variant: 'primary',
          description: 'Manage inventory'
        },
        {
          icon: Calculator,
          label: 'Add Expense',
          path: '/expenses',
          variant: 'primary',
          description: 'Track expenses'
        }
      );
    }

    if (isOwner) {
      baseActions.push(
        {
          icon: Calculator,
          label: 'Add Expense',
          path: '/expenses',
          variant: 'secondary',
          description: 'Track expenses'
        },
        {
          icon: BarChart3,
          label: 'Analytics',
          path: '/analytics',
          variant: 'primary',
          description: 'View reports'
        }
      );
    }

    if (isSalesperson) {
      baseActions.push(
        {
          icon: Package,
          label: 'Products',
          path: '/products',
          variant: 'primary',
          description: 'Manage inventory'
        }
      );
    }

    // Add common actions
    baseActions.push(
      // {
      //   icon: CreditCard,
      //   label: 'Payments',
      //   path: '/payments',
      //   variant: 'primary',
      //   description: 'Payment history'
      // },
      {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        variant: 'secondary',
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
            variant={action.variant}
            size="lg"
            onClick={() => handleNavigation(action.path)}
            className="h-20 flex flex-col items-center justify-center space-y-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-center px-1 whitespace-normal"
          >
            <span className="flex items-center justify-center w-full">
              <action.icon className="h-5 w-5" />
            </span>
            <span className="w-full mt-1">
              <div className="text-xs font-semibold w-full text-center break-words leading-none">{action.label}</div>
              <div className="text-[10px] opacity-90 w-full text-center break-words leading-none mt-0.5">{action.description}</div>
            </span>
          </Button>
        ))}
      </div>

      {/* Secondary Actions */}
      {actions.length > 4 && (
        <GradientCardWrapper
          gradientFrom="from-gray-100"
          gradientTo="to-gray-200"
        >
          <Card className="border-0 bg-transparent">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {actions.slice(4).map((action, index) => (
                  <Button
                    key={index + 4}
                    variant="outline"
                    onClick={() => handleNavigation(action.path)}
                    className="h-14 flex-col space-y-0 border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-1"
                  >
                    <action.icon className="h-3 w-3 text-gray-600" />
                    <div className="text-[10px] font-medium text-gray-700 leading-none mt-1 break-words text-center">{action.label}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </GradientCardWrapper>
      )}

      {/* Role-based Quick Stats */}
      <GradientCardWrapper
        gradientFrom="from-green-100"
        gradientTo="to-blue-100"
      >
        <Card className="border-0 bg-transparent">
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
      </GradientCardWrapper>
    </div>
  );
};

export { ModernQuickActions };
export default ModernQuickActions;