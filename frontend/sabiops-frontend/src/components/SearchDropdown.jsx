import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Package, FileText, CreditCard, Receipt } from 'lucide-react';
import { searchGlobal } from '../services/api';

const SearchDropdown = ({ isOpen, onClose, searchQuery, setSearchQuery }) => {
  const [results, setResults] = useState({
    customers: [],
    products: [],
    invoices: [],
    transactions: [],
    expenses: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim() || !isOpen) {
      setResults({
        customers: [],
        products: [],
        invoices: [],
        transactions: [],
        expenses: []
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchGlobal(searchQuery);
        if (response.success) {
          setResults(response.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      const allResults = [
        ...results.customers.map(item => ({ ...item, type: 'customer' })),
        ...results.products.map(item => ({ ...item, type: 'product' })),
        ...results.invoices.map(item => ({ ...item, type: 'invoice' })),
        ...results.transactions.map(item => ({ ...item, type: 'transaction' })),
        ...results.expenses.map(item => ({ ...item, type: 'expense' }))
      ];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleResultClick(allResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleResultClick = (result) => {
    switch (result.type) {
      case 'customer':
        navigate(`/customers?highlight=${result.id}`);
        break;
      case 'product':
        navigate(`/products?highlight=${result.id}`);
        break;
      case 'invoice':
        navigate(`/invoices?highlight=${result.id}`);
        break;
      case 'transaction':
        navigate(`/transactions?highlight=${result.id}`);
        break;
      case 'expense':
        navigate(`/expenses?highlight=${result.id}`);
        break;
      default:
        break;
    }
    onClose();
    setSearchQuery('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'customer':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'product':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'invoice':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'transaction':
        return <CreditCard className="h-4 w-4 text-orange-500" />;
      case 'expense':
        return <Receipt className="h-4 w-4 text-red-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderResultItem = (item, type, index) => {
    const isSelected = selectedIndex === index;
    
    return (
      <div
        key={`${type}-${item.id}`}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
          isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
        onClick={() => handleResultClick({ ...item, type })}
      >
        {getIcon(type)}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {type === 'customer' && item.name}
            {type === 'product' && item.name}
            {type === 'invoice' && `Invoice #${item.invoice_number}`}
            {type === 'transaction' && item.description}
            {type === 'expense' && item.description}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {type === 'customer' && (item.email || item.phone)}
            {type === 'product' && `₦${item.price} - Stock: ${item.quantity}`}
            {type === 'invoice' && `${formatCurrency(item.total_amount)} - ${item.status}`}
            {type === 'transaction' && `${formatCurrency(item.amount)} - ${item.category}`}
            {type === 'expense' && `${formatCurrency(item.amount)} - ${item.category}`}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const hasResults = Object.values(results).some(arr => arr.length > 0);
  const allResults = [
    ...results.customers.map((item, idx) => ({ ...item, type: 'customer', globalIndex: idx })),
    ...results.products.map((item, idx) => ({ ...item, type: 'product', globalIndex: results.customers.length + idx })),
    ...results.invoices.map((item, idx) => ({ ...item, type: 'invoice', globalIndex: results.customers.length + results.products.length + idx })),
    ...results.transactions.map((item, idx) => ({ ...item, type: 'transaction', globalIndex: results.customers.length + results.products.length + results.invoices.length + idx })),
    ...results.expenses.map((item, idx) => ({ ...item, type: 'expense', globalIndex: results.customers.length + results.products.length + results.invoices.length + results.transactions.length + idx }))
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-gray-600">Searching...</span>
        </div>
      ) : !hasResults && searchQuery.trim() ? (
        <div className="px-4 py-8 text-center text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No results found for "{searchQuery}"</p>
        </div>
      ) : hasResults ? (
        <div className="py-2">
          {results.customers.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                Customers
              </div>
              {results.customers.slice(0, 5).map((item, idx) => 
                renderResultItem(item, 'customer', idx)
              )}
            </div>
          )}
          
          {results.products.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                Products
              </div>
              {results.products.slice(0, 5).map((item, idx) => 
                renderResultItem(item, 'product', results.customers.length + idx)
              )}
            </div>
          )}
          
          {results.invoices.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                Invoices
              </div>
              {results.invoices.slice(0, 5).map((item, idx) => 
                renderResultItem(item, 'invoice', results.customers.length + results.products.length + idx)
              )}
            </div>
          )}
          
          {results.transactions.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                Transactions
              </div>
              {results.transactions.slice(0, 5).map((item, idx) => 
                renderResultItem(item, 'transaction', results.customers.length + results.products.length + results.invoices.length + idx)
              )}
            </div>
          )}
          
          {results.expenses.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                Expenses
              </div>
              {results.expenses.slice(0, 5).map((item, idx) => 
                renderResultItem(item, 'expense', results.customers.length + results.products.length + results.invoices.length + results.transactions.length + idx)
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SearchDropdown;

