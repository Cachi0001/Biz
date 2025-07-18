import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Trash2, CheckCircle, XCircle, Smartphone, Tablet, Monitor } from 'lucide-react';
import StableInput from './ui/StableInput';
import FocusManager from '../utils/focusManager';
import DebugLogger from '../utils/debugLogger';
import { 
  generateMobileResponsivenessReport, 
  logMobileResponsivenessReport,
  getCurrentBreakpoint
} from '../utils/mobileTestUtils';

/**
 * Invoice Form Mobile Test Component
 * 
 * This component demonstrates and tests the mobile-first responsive design improvements
 * implemented for the invoice form according to Requirement 5:
 * 
 * ✅ Input fields are at least 48px tall for touch accessibility
 * ✅ Buttons are full-width and easily tappable on mobile
 * ✅ Layout adapts responsively across screen sizes
 * ✅ Touch targets are appropriately sized (minimum 44px)
 * ✅ Form maintains proper spacing and readability on mobile
 */
const InvoiceFormMobileTest = () => {
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: 'Payment is due within 30 days of invoice date.',
    currency: 'NGN',
    discount_amount: 0,
    items: [
      { 
        id: Date.now(), 
        product_id: '', 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 0, 
        discount_rate: 0 
      }
    ],
  });

  const [testResults, setTestResults] = useState(null);
  const [currentBreakpoint, setCurrentBreakpoint] = useState(getCurrentBreakpoint());

  // Mock data for testing
  const mockCustomers = [
    { id: 1, name: 'Acme Corporation' },
    { id: 2, name: 'Tech Solutions Ltd' },
    { id: 3, name: 'Global Industries Inc' }
  ];

  const mockProducts = [
    { id: 1, name: 'Web Development Service', price: 50000 },
    { id: 2, name: 'Mobile App Development', price: 100000 },
    { id: 3, name: 'Consulting Services', price: 25000 }
  ];

  // Update breakpoint on window resize
  useEffect(() => {
    const handleResize = () => {
      setCurrentBreakpoint(getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Run mobile responsiveness test
  const runMobileTest = () => {
    const container = document.getElementById('invoice-form-test-container');
    if (container) {
      const report = generateMobileResponsivenessReport(container);
      setTestResults(report);
      logMobileResponsivenessReport(report);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    DebugLogger.logFocusEvent('InvoiceForm', 'input-change', e.target, { name, value });
    
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({ ...prev, [name]: value }));
    });
  };

  const handleItemChange = (index, field, value) => {
    DebugLogger.logFocusEvent('InvoiceForm', 'item-change', document.activeElement, { index, field, value });
    
    FocusManager.preserveFocus(() => {
      setFormData(prev => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        return { ...prev, items: updatedItems };
      });
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: Date.now() + Math.random(), 
        product_id: '', 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 0, 
        discount_rate: 0 
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateItemTotal = (item) => {
    const quantity = Math.max(0, parseFloat(item.quantity) || 0);
    const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
    const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
    const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

    let total = quantity * unitPrice;
    total -= total * (discountRate / 100);
    total += total * (taxRate / 100);
    
    return Math.round(total * 100) / 100;
  };

  const calculateInvoiceTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discount = Math.max(0, parseFloat(formData.discount_amount) || 0);
    const total = itemsTotal - discount;
    
    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getBreakpointIcon = () => {
    switch (currentBreakpoint) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'sm': case 'md': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getBreakpointColor = () => {
    switch (currentBreakpoint) {
      case 'mobile': return 'bg-red-100 text-red-800';
      case 'sm': return 'bg-yellow-100 text-yellow-800';
      case 'md': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div id="invoice-form-test-container" className="p-4 space-y-6 max-w-4xl mx-auto">
      
      {/* Test Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                📱 Invoice Form Mobile-First Test
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Testing mobile-first responsive design improvements
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Badge className={`${getBreakpointColor()} flex items-center gap-1`}>
                {getBreakpointIcon()}
                {currentBreakpoint} ({window.innerWidth}px)
              </Badge>
              <Button 
                onClick={runMobileTest}
                className="min-h-[44px] touch-manipulation"
              >
                Run Mobile Test
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {testResults && (
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {testResults.overallPasses ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${testResults.overallPasses ? 'text-green-600' : 'text-red-600'}`}>
                Overall Score: {testResults.overallScore.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Check browser console for detailed test results
            </p>
          </CardContent>
        )}
      </Card>

      {/* Enhanced Invoice Form */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Invoice Form</CardTitle>
          <p className="text-sm text-gray-600">
            Mobile-first responsive design with 48px input heights and 44px touch targets
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 sm:space-y-6">
            
            {/* Basic Information - Mobile-first responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer_id" className="text-sm font-medium">Customer *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                  required
                >
                  <SelectTrigger className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issue_date" className="text-sm font-medium">Issue Date *</Label>
                <StableInput
                  id="issue_date"
                  name="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                  componentName="InvoiceForm-IssueDate"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-sm font-medium">Due Date</Label>
                <StableInput
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                  componentName="InvoiceForm-DueDate"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_terms" className="text-sm font-medium">Payment Terms</Label>
                <StableInput
                  id="payment_terms"
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleInputChange}
                  placeholder="e.g., Net 30"
                  className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                  componentName="InvoiceForm-PaymentTerms"
                />
              </div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <Label className="text-base font-medium">Invoice Items *</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItem}
                  className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              
              {formData.items.map((item, index) => (
                <Card key={item.id} className="p-4 sm:p-6 mb-4 border-2 border-gray-100">
                  <div className="space-y-4 sm:space-y-6">
                    
                    {/* Product Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor={`product_id-${index}`} className="text-sm font-medium">Product</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                        >
                          <SelectTrigger 
                            id={`product_id-${index}`}
                            className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                          >
                            <SelectValue placeholder="Select product (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`} className="text-sm font-medium">Description *</Label>
                        <StableInput
                          id={`description-${index}`}
                          name="description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                          componentName={`InvoiceForm-ItemDescription-${index}`}
                          required
                        />
                      </div>
                    </div>

                    {/* Quantity and Pricing - Mobile-optimized grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${index}`} className="text-sm font-medium">Qty *</Label>
                        <StableInput
                          id={`quantity-${index}`}
                          name="quantity"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                          componentName={`InvoiceForm-ItemQuantity-${index}`}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`unit_price-${index}`} className="text-sm font-medium">Unit Price (₦) *</Label>
                        <StableInput
                          id={`unit_price-${index}`}
                          name="unit_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                          componentName={`InvoiceForm-ItemUnitPrice-${index}`}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`tax_rate-${index}`} className="text-sm font-medium">Tax (%)</Label>
                        <StableInput
                          id={`tax_rate-${index}`}
                          name="tax_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.tax_rate}
                          onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                          className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                          componentName={`InvoiceForm-ItemTaxRate-${index}`}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`discount_rate-${index}`} className="text-sm font-medium">Discount (%)</Label>
                        <StableInput
                          id={`discount_rate-${index}`}
                          name="discount_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discount_rate}
                          onChange={(e) => handleItemChange(index, 'discount_rate', e.target.value)}
                          className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                          componentName={`InvoiceForm-ItemDiscountRate-${index}`}
                        />
                      </div>
                    </div>

                    {/* Total and Remove Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 gap-3 sm:gap-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatNaira(calculateItemTotal(item))}
                        </span>
                      </div>
                      {formData.items.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeItem(index)}
                          className="w-full sm:w-auto min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-2">Remove Item</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Total Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <Label htmlFor="discount_amount" className="text-sm font-medium whitespace-nowrap">Overall Discount (₦)</Label>
                    <StableInput
                      id="discount_amount"
                      name="discount_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount_amount}
                      onChange={handleInputChange}
                      className="w-full sm:w-32 h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                      componentName="InvoiceForm-DiscountAmount"
                    />
                  </div>
                  <div className="text-right w-full sm:w-auto">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      Grand Total: {formatNaira(calculateInvoiceTotal())}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <StableInput
                  id="notes"
                  name="notes"
                  placeholder="Additional notes for the invoice"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="min-h-[96px] text-base sm:text-sm touch-manipulation resize-y"
                  component="textarea"
                  componentName="InvoiceForm-Notes"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions" className="text-sm font-medium">Terms and Conditions</Label>
                <StableInput
                  id="terms_and_conditions"
                  name="terms_and_conditions"
                  placeholder="Terms and conditions for the invoice"
                  value={formData.terms_and_conditions}
                  onChange={handleInputChange}
                  className="min-h-[96px] text-base sm:text-sm touch-manipulation resize-y"
                  component="textarea"
                  componentName="InvoiceForm-TermsAndConditions"
                  rows={4}
                />
              </div>
            </div>

            {/* Mobile-first button layout */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline"
                className="w-full sm:w-auto min-h-[48px] order-2 sm:order-1 touch-manipulation"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto min-h-[48px] bg-green-600 hover:bg-green-700 order-1 sm:order-2 touch-manipulation"
              >
                Create Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceFormMobileTest;