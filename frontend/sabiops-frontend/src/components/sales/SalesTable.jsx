import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNaira, formatDate, formatDateTime } from '../../utils/formatting';

export const SalesTable = ({ sales, onView, loading }) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading sales data...</span>
      </div>
    );
  }

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
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="px-6 py-4 text-left font-semibold text-gray-900">Customer</TableHead>
            <TableHead className="px-6 py-4 text-left font-semibold text-gray-900">Product</TableHead>
            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Quantity</TableHead>
            <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Unit Price</TableHead>
            <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Total Amount</TableHead>
            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Payment Method</TableHead>
            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Date</TableHead>
            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Actions</TableHead>
            <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale, index) => (
            <TableRow 
              key={sale.id} 
              className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
            >
              <TableCell className="px-6 py-4">
                <div className="font-medium text-gray-900">
                  {sale.customer_name || 'Walk-in Customer'}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="font-medium text-gray-900">
                  {sale.product_name || 'Unknown Product'}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {sale.quantity || 0}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 text-right">
                <span className="font-medium text-gray-700">
                  {formatNaira(sale.unit_price || 0)}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 text-right">
                <span className="font-bold text-green-600 text-lg">
                  {formatNaira(sale.total_amount || 0)}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4 text-center">
                <Badge variant={getPaymentMethodBadge(sale.payment_method)} className="font-medium">
                  {formatPaymentMethod(sale.payment_method)}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 text-center">
                <div className="text-sm text-gray-600">
                  {formatDateTime(sale.created_at || sale.date)}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  onClick={() => onView(sale)}
                >
                  <Eye className="h-4 w-4 text-blue-600" />
                </Button>
              </TableCell>
              <TableCell className="px-6 py-4 text-right">
                <span className="font-medium text-blue-700">
                  {sale.profit_from_sales !== undefined ? formatNaira(sale.profit_from_sales) : '-'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SalesTable;
