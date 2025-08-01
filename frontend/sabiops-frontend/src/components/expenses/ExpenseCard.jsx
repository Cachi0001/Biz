import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye, Receipt, Calendar, Tag } from 'lucide-react';
import { formatNaira, formatDateTime, truncateText } from '../../utils/formatting';
import { mobileAmountClasses } from '../../utils/mobileUtils';

const ExpenseCard = ({ expense, onEdit, onDelete, onView }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'Inventory/Stock Purchase': 'bg-blue-100 text-blue-800',
      'Rent & Utilities': 'bg-purple-100 text-purple-800',
      'Staff Salaries': 'bg-green-100 text-green-800',
      'Transportation': 'bg-yellow-100 text-yellow-800',
      'Marketing & Advertising': 'bg-pink-100 text-pink-800',
      'Equipment & Tools': 'bg-indigo-100 text-indigo-800',
      'Professional Services': 'bg-cyan-100 text-cyan-800',
      'Insurance': 'bg-orange-100 text-orange-800',
      'Taxes & Government Fees': 'bg-red-100 text-red-800',
      'Bank Charges': 'bg-gray-100 text-gray-800',
      'Maintenance & Repairs': 'bg-teal-100 text-teal-800',
      'Office Supplies': 'bg-lime-100 text-lime-800',
      'Communication': 'bg-violet-100 text-violet-800',
      'Training & Development': 'bg-emerald-100 text-emerald-800',
      'Other': 'bg-slate-100 text-slate-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {expense.description || 'Expense'}
                </h3>
                {expense.date && (
                  <p className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDateTime(expense.date)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(expense)}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(expense)}
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(expense.id)}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Category */}
          {expense.category && (
            <div className="flex items-center space-x-2">
              <Tag className="h-3 w-3 text-gray-400" />
              <Badge className={`text-xs ${getCategoryColor(expense.category)}`}>
                {expense.category}
              </Badge>
            </div>
          )}

          {/* Amount */}
          <div className="text-center py-2">
            <p className={`${mobileAmountClasses.medium} ${mobileAmountClasses.container} text-red-600`}>
              {formatNaira(expense.amount)}
            </p>
            <p className="text-xs text-gray-500">Expense Amount</p>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            {expense.vendor && (
              <div>
                <p className="text-xs text-gray-500">Vendor/Supplier</p>
                <p className="text-sm text-gray-700 truncate">{expense.vendor}</p>
              </div>
            )}
            
            {expense.payment_method && (
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm text-gray-700">{expense.payment_method}</p>
              </div>
            )}

            {expense.reference && (
              <div>
                <p className="text-xs text-gray-500">Reference</p>
                <p className="text-sm text-gray-700 truncate">{expense.reference}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-600">
                {truncateText(expense.notes, 60)}
              </p>
            </div>
          )}

          {/* Subcategory if available */}
          {expense.subcategory && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Subcategory: <span className="text-gray-700">{expense.subcategory}</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { ExpenseCard };
export default ExpenseCard;