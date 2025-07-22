import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { formatCurrency, formatNaira, formatDate } from '../../utils/formatting';
import { getProfile } from '../../services/api';
import { showErrorToast } from '../../utils/errorHandling';
import { Building2, User, Calendar, CreditCard, FileText, Package } from 'lucide-react';

const ReviewDialog = ({ 
  isOpen, 
  onClose, 
  invoiceData, 
  customers, 
  products, 
  onConfirm, 
  onCancel,
  isEdit = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [sellerInfo, setSellerInfo] = useState(null);

  // Fetch seller information when dialog opens
  useEffect(() => {
    if (isOpen && invoiceData) {
      fetchSellerInfo();
    }
  }, [isOpen, invoiceData]);

  const fetchSellerInfo = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      console.log('[REVIEW_DIALOG] Profile data:', profile);
      
      // Extract seller information from profile
      const seller = {
        name: profile.business_name || profile.full_name || profile.name || 'Your Business',
        address: profile.business_address || profile.address || 'Business Address',
        contact: profile.business_contact || profile.phone || profile.email || 'Contact Information',
        email: profile.email || '',
        phone: profile.phone || profile.business_phone || ''
      };
      
      setSellerInfo(seller);
    } catch (error) {
      console.error('Failed to fetch seller info:', error);
      // Use fallback seller information
      setSellerInfo({
        name: 'Your Business',
        address: 'Business Address',
        contact: 'Contact Information',
        email: '',
        phone: ''
      });
      showErrorToast('Could not load seller information');
    } finally {
      setLoading(false);
    }
  };

  // Get customer information
  const getCustomerInfo = () => {
    if (!invoiceData || !invoiceData.customer_id || !customers) return null;
    return customers.find(c => c.id === invoiceData.customer_id) || null;
  };

  // Get product information for an item
  const getProductInfo = (productId) => {
    if (!productId || !products) return null;
    return products.find(p => p.id === productId) || null;
  };

  // Calculate item total
  const calculateItemTotal = (item) => {
    if (!item) return 0;
    
    const quantity = Math.max(0, parseFloat(item.quantity) || 0);
    const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
    const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
    const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

    let total = quantity * unitPrice;
    total -= total * (discountRate / 100);
    total += total * (taxRate / 100);
    
    return Math.round(total * 100) / 100;
  };

  // Calculate invoice total
  const calculateInvoiceTotal = () => {
    if (!invoiceData || !invoiceData.items || !Array.isArray(invoiceData.items)) return 0;
    const itemsTotal = invoiceData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discount = Math.max(0, parseFloat(invoiceData.discount_amount) || 0);
    const total = itemsTotal - discount;
    
    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  // Early return if no invoice data or required fields
  if (!isOpen || !invoiceData) {
    return null;
  }

  // Check for required data
  const hasRequiredData = invoiceData.customer_id && invoiceData.items && Array.isArray(invoiceData.items);
  if (!hasRequiredData) {
    console.warn('[ReviewDialog] Missing required invoice data:', invoiceData);
    return null;
  }

  const customer = getCustomerInfo();
  const invoiceTotal = calculateInvoiceTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
        aria-labelledby="review-dialog-title"
        aria-describedby="review-dialog-description"
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle 
            id="review-dialog-title"
            className="flex items-center gap-2"
          >
            <FileText className="h-5 w-5" aria-hidden="true" />
            {isEdit ? 'Review Invoice Changes' : 'Review New Invoice'}
          </DialogTitle>
          <DialogDescription id="review-dialog-description">
            Please review all invoice details before {isEdit ? 'updating' : 'creating'} the invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seller and Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Building2 className="h-4 w-4" />
                    From (Seller)
                  </div>
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ) : sellerInfo ? (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                      <div className="font-semibold text-gray-900">{sellerInfo.name}</div>
                      <div className="text-sm text-gray-600">{sellerInfo.address}</div>
                      <div className="text-sm text-gray-600">{sellerInfo.contact}</div>
                      {sellerInfo.email && (
                        <div className="text-sm text-gray-600">{sellerInfo.email}</div>
                      )}
                      {sellerInfo.phone && sellerInfo.phone !== sellerInfo.contact && (
                        <div className="text-sm text-gray-600">{sellerInfo.phone}</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600">Seller information not available</div>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <User className="h-4 w-4" />
                    To (Customer)
                  </div>
                  {customer ? (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-1">
                      <div className="font-semibold text-gray-900">{customer.name}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      )}
                      {customer.address && (
                        <div className="text-sm text-gray-600">{customer.address}</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600">Customer not selected</div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Issue Date
                  </div>
                  <div className="text-sm font-semibold">
                    {invoiceData?.issue_date ? formatDate(invoiceData.issue_date) : 'Not specified'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </div>
                  <div className="text-sm font-semibold">
                    {invoiceData?.due_date ? formatDate(invoiceData.due_date) : 'Not specified'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    Payment Terms
                  </div>
                  <div className="text-sm font-semibold">
                    {invoiceData?.payment_terms || 'Net 30'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Currency</div>
                  <Badge variant="outline" className="text-xs">
                    {invoiceData?.currency || 'NGN'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Invoice Items ({invoiceData?.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceData?.items && invoiceData.items.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600">Qty</th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">Unit Price</th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600">Tax %</th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600">Discount %</th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceData.items.map((item, index) => {
                            const product = getProductInfo(item.product_id);
                            const itemTotal = calculateItemTotal(item);
                            
                            return (
                              <tr key={item.id || index} className="border-b">
                                <td className="py-3">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {item.description || 'No description'}
                                    </div>
                                    {product && (
                                      <div className="text-xs text-gray-500">
                                        Product: {product.name}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 text-center text-sm">
                                  {item.quantity || 0}
                                </td>
                                <td className="py-3 text-right text-sm">
                                  {formatCurrency(item.unit_price || 0, true, invoiceData?.currency || 'NGN')}
                                </td>
                                <td className="py-3 text-center text-sm">
                                  {item.tax_rate || 0}%
                                </td>
                                <td className="py-3 text-center text-sm">
                                  {item.discount_rate || 0}%
                                </td>
                                <td className="py-3 text-right font-semibold">
                                  {formatCurrency(itemTotal, true, invoiceData?.currency || 'NGN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {invoiceData.items.map((item, index) => {
                      const product = getProductInfo(item.product_id);
                      const itemTotal = calculateItemTotal(item);
                      
                      return (
                        <Card key={item.id || index} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="font-medium text-gray-900">
                                {item.description || 'No description'}
                              </div>
                              {product && (
                                <div className="text-xs text-gray-500">
                                  Product: {product.name}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Quantity: <span className="font-medium">{item.quantity || 0}</span></div>
                                <div>Unit Price: <span className="font-medium">{formatCurrency(item.unit_price || 0, true, invoiceData?.currency || 'NGN')}</span></div>
                                <div>Tax: <span className="font-medium">{item.tax_rate || 0}%</span></div>
                                <div>Discount: <span className="font-medium">{item.discount_rate || 0}%</span></div>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Item Total:</span>
                                  <span className="font-bold text-green-600">{formatCurrency(itemTotal, true, invoiceData?.currency || 'NGN')}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items added to this invoice
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(invoiceData?.items?.reduce((sum, item) => sum + calculateItemTotal(item), 0) || 0, true, invoiceData?.currency || 'NGN')}
                  </span>
                </div>
                
                {invoiceData?.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overall Discount:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(invoiceData.discount_amount, true, invoiceData?.currency || 'NGN')}
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">{formatCurrency(invoiceTotal, true, invoiceData?.currency || 'NGN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoiceData?.notes || invoiceData?.terms_and_conditions) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoiceData?.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Notes</div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                      {invoiceData.notes}
                    </div>
                  </div>
                )}
                
                {invoiceData?.terms_and_conditions && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Terms and Conditions</div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                      {invoiceData.terms_and_conditions}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t" role="group" aria-label="Invoice review actions">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="w-full sm:w-auto min-h-[48px] order-2 sm:order-1"
              aria-label="Cancel and return to edit invoice form"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            >
              Back to Edit
            </Button>
            <Button 
              onClick={handleConfirm}
              className="w-full sm:w-auto min-h-[48px] bg-green-600 hover:bg-green-700 order-1 sm:order-2"
              aria-label={isEdit ? 'Confirm and update invoice' : 'Confirm and create invoice'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            >
              {isEdit ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;