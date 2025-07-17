import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatNaira, getStockStatus, formatStockStatus, getStatusColor } from '../../utils/formatting';

const ProductCard = ({ product, onEdit, onDelete, onView }) => {
  const stockStatus = getStockStatus(product.quantity, product.low_stock_threshold);
  const stockColor = getStatusColor(stockStatus, 'stock');

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                {product.sku && (
                  <p className="text-sm text-gray-500 truncate">SKU: {product.sku}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(product)}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(product.id)}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Category and Stock Status */}
          <div className="flex items-center justify-between">
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            )}
            <Badge className={`text-xs ${stockColor}`}>
              {stockStatus === 'out_of_stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {stockStatus === 'in_stock' && <CheckCircle className="h-3 w-3 mr-1" />}
              {stockStatus === 'low_stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {formatStockStatus(stockStatus)}
            </Badge>
          </div>

          {/* Price and Stock Info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Selling Price</p>
              <p className="text-sm font-semibold text-green-600">
                {formatNaira(product.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stock Qty</p>
              <p className={`text-sm font-semibold ${
                stockStatus === 'out_of_stock' ? 'text-red-600' : 
                stockStatus === 'low_stock' ? 'text-yellow-600' : 'text-gray-900'
              }`}>
                {product.quantity || 0}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {(product.cost_price || product.low_stock_threshold) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              {product.cost_price && (
                <div>
                  <p className="text-xs text-gray-500">Cost Price</p>
                  <p className="text-xs text-gray-700">
                    {formatNaira(product.cost_price)}
                  </p>
                </div>
              )}
              {product.low_stock_threshold && (
                <div>
                  <p className="text-xs text-gray-500">Low Stock Alert</p>
                  <p className="text-xs text-gray-700">
                    {product.low_stock_threshold}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { ProductCard };
export default ProductCard;