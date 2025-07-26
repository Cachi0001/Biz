import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart } from 'lucide-react';
import { formatNaira, formatDateTime } from '../../utils/formatting';

export const SalesMobileCard = ({ sales, onView }) => {
  const getPaymentMethodBadge = (method) => {
    switch (method) {
      case 'cash': return 'default';
      case 'card': return 'secondary';
      case 'transfer': return 'outline';
      case 'pending': return 'destructive';
      default: return 'default';
    }
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
        <p className="text-gray-600">No sales recorded for this date.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:hidden">
      {sales.map((sale, idx) => (
        <div 
          key={sale.id} 
          className={sales.length % 2 === 1 && idx === sales.length - 1 ? 'col-span-2 flex justify-center' : ''}
        >
          <Card className="w-full border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300">
            <CardContent className="p-5">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-base">
                      {sale.customer_name || 'Walk-in Customer'}
                    </h3>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {sale.product_name || 'Unknown Product'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                    onClick={() => onView(sale)}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 font-medium block mb-1">Quantity</span>
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {sale.quantity || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block mb-1">Unit Price</span>
                    <span className="font-semibold text-gray-900">
                      {formatNaira(sale.unit_price || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block mb-1">Payment</span>
                    <Badge variant={getPaymentMethodBadge(sale.payment_method)} className="text-xs">
                      {formatPaymentMethod(sale.payment_method)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block mb-1">Date</span>
                    <span className="text-xs text-gray-600">
                      {formatDateTime(sale.created_at || sale.date)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Amount</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatNaira(sale.total_amount || 0)}
                    </span>
                  </div>
                </div>
                
                {/* Profit */}
                <div className="pt-1 flex justify-between items-center">
                  <span className="text-sm text-blue-700 font-medium">Profit:</span>
                  <span className="text-base font-bold text-blue-700">
                    {sale.profit_from_sales !== undefined ? formatNaira(sale.profit_from_sales) : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default SalesMobileCard;
