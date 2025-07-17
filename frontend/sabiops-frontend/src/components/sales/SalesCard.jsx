import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye, ShoppingCart, User, Package, Calendar } from 'lucide-react';
import { formatNaira, formatDateTime, formatPaymentMethod } from '../../utils/formatting';

const SalesCard = ({ sale, onEdit, onDelete, onView }) => {
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  Sale #{sale.id?.slice(0, 8) || 'N/A'}
                </h3>
                {sale.date && (
                  <p className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDateTime(sale.date)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(sale)}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(sale)}
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(sale.id)}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Customer and Product Info */}
          <div className="space-y-2">
            {sale.customer_name && (
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">{sale.customer_name}</span>
              </div>
            )}
            {sale.product_name && (
              <div className="flex items-center space-x-2">
                <Package className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">
                  {sale.product_name} {sale.quantity && `(${sale.quantity}x)`}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          {sale.payment_method && (
            <div className="flex justify-center">
              <Badge variant="outline" className="text-xs">
                {formatPaymentMethod(sale.payment_method)}
              </Badge>
            </div>
          )}

          {/* Amount and Quantity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-semibold text-green-600">
                {formatNaira(sale.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Quantity</p>
              <p className="text-sm font-semibold text-gray-900">
                {sale.quantity || 1}
              </p>
            </div>
          </div>

          {/* Unit Price and Profit (if available) */}
          {(sale.unit_price || sale.profit) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              {sale.unit_price && (
                <div>
                  <p className="text-xs text-gray-500">Unit Price</p>
                  <p className="text-xs text-gray-700">
                    {formatNaira(sale.unit_price)}
                  </p>
                </div>
              )}
              {sale.profit && (
                <div>
                  <p className="text-xs text-gray-500">Profit</p>
                  <p className="text-xs text-green-600 font-medium">
                    {formatNaira(sale.profit)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {sale.notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-600 truncate">
                {sale.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { SalesCard };
export default SalesCard;