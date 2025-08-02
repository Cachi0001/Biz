import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { FileText, Package, TrendingUp, Calculator, Settings, BarChart3, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GradientCardWrapper } from '../ui/gradient-card-wrapper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import CustomProductForm from '../forms/CustomProductForm';
import ExpenseForm from '../forms/ExpenseForm';
import CustomInvoiceForm from '../forms/CustomInvoiceForm';
import { SalesForm } from '../forms/SalesForm';

const ModernQuickActions = () => {
  const { role, isOwner, isAdmin, isSalesperson } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (type) => {
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleSuccess = (type) => {
    closeModal();
    // Emit events to refresh dashboard data
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type } }));
  };

  const handleAnalyticsClick = () => {
    navigate('/analytics');
  };

  const handleViewExpensesClick = () => {
    navigate('/expenses');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const getActionsForRole = () => {
    const baseActions = [
      {
        icon: FileText,
        label: 'New Invoice',
        action: () => openModal('invoice'),
        variant: 'primary',
        description: 'Create invoice'
      },
      {
        icon: TrendingUp,
        label: 'Record Sale',
        action: () => openModal('sale'),
        variant: 'primary',
        description: 'Add new sale'
      }
    ];

    if (isOwner || isAdmin) {
      baseActions.push(
        {
          icon: Package,
          label: 'Add Product',
          action: () => openModal('product'),
          variant: 'primary',
          description: 'Manage inventory'
        },
        {
          icon: Calculator,
          label: 'Add Expense',
          action: () => openModal('expense'),
          variant: 'primary',
          description: 'Track expenses'
        }
      );
    }

    if (isOwner) {
      baseActions.push(
        {
          icon: BarChart3,
          label: 'Analytics',
          action: handleAnalyticsClick,
          variant: 'primary',
          description: 'View reports',
          style : 'mild-purple'
        }
      );
    }

    // Add View Expenses button for owners/admins
    if (isOwner || isAdmin) {
      baseActions.push(
        {
          icon: Receipt,
          label: 'View Expenses',
          action: handleViewExpensesClick,
          variant: 'secondary',
          description: 'View expenses',
          style: 'mild-red'
        }
      );
    }

    if (isSalesperson) {
      baseActions.push(
        {
          icon: Package,
          label: 'Products',
          action: () => openModal('product'),
          variant: 'primary',
          description: 'Manage inventory'
        }
      );
    }

    // Add common actions
    baseActions.push(
      {
        icon: Settings,
        label: 'Settings',
        action: handleSettingsClick,
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
            onClick={action.action}
            className="h-20 flex flex-col items-center justify-center space-y-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-center px-1 whitespace-normal"
          >
            <span className="flex items-center justify-center w-full text-white">
              <action.icon className="h-5 w-5 text-white" />
            </span>
            <span className="w-full mt-1">
              <div className="text-xs font-semibold w-full text-center break-words leading-none text-white">{action.label}</div>
              <div className="text-[10px] opacity-90 w-full text-center break-words leading-none mt-0.5 text-white">{action.description}</div>
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
                {actions.slice(4).map((action, index) => {
                  const isMildRed = action.style === 'mild-red';
                  return (
                    <Button
                      key={index}
                      variant={action.variant === 'primary' ? 'default' : 'outline'}
                      className={`w-full h-auto py-3 px-4 flex flex-col items-center justify-center gap-2 text-center hover:shadow-lg transition-all duration-200 ${
                        isMildRed 
                          ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-300' 
                          : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={action.action}
                    >
                      <action.icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </GradientCardWrapper>
      )}

      {/* Modal Dialogs */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {activeModal === 'invoice' && (
            <>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Create a new invoice for your customer
                </DialogDescription>
              </DialogHeader>
              <CustomInvoiceForm 
                onSuccess={() => handleSuccess('invoice')}
                onCancel={closeModal}
              />
            </>
          )}
          
          {activeModal === 'sale' && (
            <>
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
                <DialogDescription>
                  Add a new sale transaction to your records
                </DialogDescription>
              </DialogHeader>
              <SalesForm 
                onSuccess={() => handleSuccess('sale')}
                onCancel={closeModal}
              />
            </>
          )}
          
          {activeModal === 'product' && (
            <>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory
                </DialogDescription>
              </DialogHeader>
              <CustomProductForm 
                onSuccess={() => handleSuccess('product')}
                onCancel={closeModal}
              />
            </>
          )}
          
          {activeModal === 'expense' && (
            <>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Track your business expenses
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm 
                onSuccess={() => handleSuccess('expense')}
                onCancel={closeModal}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

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

export default ModernQuickActions;