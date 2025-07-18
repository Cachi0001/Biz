export interface InvoiceItem {
  id?: number | string;
  product_id: number | string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
}

export interface Invoice {
  id: number | string;
  customer_id: number | string;
  invoice_number?: string;
  issue_date: string;
  due_date: string | null;
  payment_terms: string;
  notes: string;
  terms_and_conditions: string;
  currency: string;
  discount_amount: number;
  items: InvoiceItem[];
  total_amount: number;
  amount_due: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface Customer {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Product {
  id: number | string;
  name: string;
  price: number;
  unit_price?: number;
}

