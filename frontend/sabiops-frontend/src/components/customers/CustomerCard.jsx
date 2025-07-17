import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye, User, Mail, Phone, Calendar } from 'lucide-react';
import { formatNaira, formatDate, formatPhone } from '../../utils/formatting';

const CustomerCard = ({ customer, stats, onEdit, onDelete, onView }) => {

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">{customer.name}</h3>
                {customer.business_name && (
                  <p className="text-sm text-gray-500 truncate">{customer.business_name}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(customer)}
                className="h-10 w-10 p-0 hover:bg-blue-100 touch-manipulation"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(customer)}
                className="h-10 w-10 p-0 hover:bg-green-100 touch-manipulation"
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(customer.id)}
                className="h-10 w-10 p-0 hover:bg-red-100 touch-manipulation"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {customer.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{formatPhone(customer.phone)}</span>
              </div>
            )}
            {(stats?.lastPurchase || customer.last_purchase_date) && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Last: {formatDate(stats?.lastPurchase || customer.last_purchase_date)}
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-sm font-semibold text-green-600">
                {formatNaira(stats?.totalSpent || customer.total_spent || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Orders</p>
              <p className="text-sm font-semibold text-gray-900">
                {stats?.totalPurchases || customer.total_purchases || 0}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { CustomerCard };
export default CustomerCard;