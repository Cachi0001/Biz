import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye, FileText, Calendar, User } from 'lucide-react';
import { formatNaira, formatDate, formatInvoiceStatus, getStatusColor } from '../../utils/formatting';

const InvoiceCard = ({ invoice, onEdit, onDelete, onView, onSend, onMarkPaid }) => {
  const statusColor = getStatusColor(invoice.status, 'invoice');

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {invoice.invoice_number || `INV-${invoice.id?.slice(0, 8)}`}
                </h3>
                {invoice.customer_name && (
                  <p className="text-sm text-gray-500 truncate flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {invoice.customer_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(invoice)}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(invoice)}
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(invoice.id)}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${statusColor}`}>
              {formatInvoiceStatus(invoice.status)}
            </Badge>
            {invoice.created_at && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(invoice.created_at)}
              </div>
            )}
          </div>

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-semibold text-green-600">
                {formatNaira(invoice.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="text-sm text-gray-700">
                {invoice.due_date ? formatDate(invoice.due_date) : 'Not set'}
              </p>
            </div>
          </div>

          {/* Action Buttons for Status */}
          {invoice.status !== 'paid' && (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {invoice.status === 'draft' && onSend && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSend(invoice)}
                  className="flex-1 text-xs"
                >
                  Send Invoice
                </Button>
              )}
              {(invoice.status === 'sent' || invoice.status === 'overdue') && onMarkPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkPaid(invoice)}
                  className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Mark as Paid
                </Button>
              )}
            </div>
          )}

          {/* Additional Info */}
          {(invoice.description || invoice.payment_terms) && (
            <div className="pt-2 border-t border-gray-100">
              {invoice.description && (
                <p className="text-xs text-gray-600 truncate">
                  {invoice.description}
                </p>
              )}
              {invoice.payment_terms && (
                <p className="text-xs text-gray-500 mt-1">
                  Terms: {invoice.payment_terms}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { InvoiceCard };
export default InvoiceCard;