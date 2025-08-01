// Standardized payment methods used across the application
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  CHEQUE: 'cheque',
  ONLINE_PAYMENT: 'online_payment',
  PENDING: 'pending'
};

// Payment method display names
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHODS.CARD]: 'Card Payment',
  [PAYMENT_METHODS.MOBILE_MONEY]: 'Mobile Money',
  [PAYMENT_METHODS.CHEQUE]: 'Cheque',
  [PAYMENT_METHODS.ONLINE_PAYMENT]: 'Online Payment',
  [PAYMENT_METHODS.PENDING]: 'Pending Payment'
};

// Default payment method
export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS.CASH;

// Payment method options for dropdowns
export const PAYMENT_METHOD_OPTIONS = [
  { value: PAYMENT_METHODS.CASH, label: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CASH] },
  { value: PAYMENT_METHODS.BANK_TRANSFER, label: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BANK_TRANSFER] },
  { value: PAYMENT_METHODS.CARD, label: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CARD] },
  { value: PAYMENT_METHODS.MOBILE_MONEY, label: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.MOBILE_MONEY] },
  { value: PAYMENT_METHODS.CHEQUE, label: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.CHEQUE] },
  { value: PAYMENT_METHODS.ONLINE_PAYMENT, label: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.ONLINE_PAYMENT] },
  { value: PAYMENT_METHODS.PENDING, label: PAYMENT_METHOD_LABELS[PAYMENT_METHODS.PENDING] }
];

// Helper function to get payment method label
export const getPaymentMethodLabel = (method) => {
  return PAYMENT_METHOD_LABELS[method] || method;
};

// Helper function to format payment method for display
export const formatPaymentMethod = (method) => {
  if (!method) return 'Cash';
  return getPaymentMethodLabel(method);
}; 