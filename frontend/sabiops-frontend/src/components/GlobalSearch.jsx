import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, User, Package, FileText, DollarSign, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchService } from '../services/SearchService';
import { cn } from '../lib/utils';

const GlobalSearch = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({});
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const [searchResults, searchSuggestions] = await Promise.all([
        searchService.globalSearch(searchQuery),
        searchService.getSearchSuggestions(searchQuery)
      ]);
      
      setResults(searchResults.results || {});
      setSuggestions(searchSuggestions.suggestions || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults({});
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 300);
    
    setSearchTimeout(timeout);
  };
  
  const handleKeyDown = (e) => {
    const allResults = getAllResults();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex]);
        } else if (query.trim()) {
          // Perform full search
          navigate(`/search?q=${encodeURIComponent(query)}`);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };
  
  const getAllResults = () => {
    const allResults = [];
    
    // Add suggestions first
    suggestions.forEach(suggestion => {
      allResults.push({
        type: 'suggestion',
        ...suggestion
      });
    });
    
    // Add search results
    Object.entries(results).forEach(([category, items]) => {
      items.forEach(item => {
        allResults.push({
          type: 'result',
          category,
          ...item
        });
      });
    });
    
    return allResults;
  };
  
  const handleResultClick = (item) => {
    if (item.type === 'suggestion') {
      setQuery(item.text);
      performSearch(item.text);
      return;
    }
    
    // Navigate based on item type
    switch (item.category) {
      case 'customers':
        navigate(`/customers/${item.id}`);
        break;
      case 'products':
        navigate(`/products/${item.id}`);
        break;
      case 'invoices':
        navigate(`/invoices/${item.id}`);
        break;
      case 'expenses':
        navigate(`/expenses/${item.id}`);
        break;
      default:
        break;
    }
    
    setIsOpen(false);
    setQuery('');
  };
  
  const handleRecentSearchClick = (recentQuery) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
  };
  
  const getResultIcon = (category) => {
    switch (category) {
      case 'customers':
        return <User className=\"w-4 h-4\" />;
      case 'products':
        return <Package className=\"w-4 h-4\" />;
      case 'invoices':
        return <FileText className=\"w-4 h-4\" />;
      case 'expenses':
        return <DollarSign className=\"w-4 h-4\" />;
      default:
        return <Search className=\"w-4 h-4\" />;
    }
  };
  
  const formatResultText = (item, category) => {
    switch (category) {
      case 'customers':
        return `${item.name} ${item.email ? `(${item.email})` : ''}`;
      case 'products':
        return `${item.name} - ₦${item.price?.toLocaleString()}`;
      case 'invoices':
        return `${item.invoice_number} - ${item.customer_name} (₦${item.total_amount?.toLocaleString()})`;
      case 'expenses':
        return `${item.description} - ₦${item.amount?.toLocaleString()}`;
      default:
        return item.name || item.text;
    }
  };
  
  // Load recent searches on open
  useEffect(() => {
    if (isOpen) {
      searchService.getRecentSearches().then(recent => {
        setRecentSearches(recent.recent_searches || []);
      }).catch(console.error);
    }
  }, [isOpen]);
  
  // Global keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const totalResults = Object.values(results).reduce((sum, items) => sum + items.length, 0);
  const allResults = getAllResults();
  
  return (
    <div className={cn(\"relative\", className)} ref={searchRef}>
      {/* Search Input */}
      <div className=\"relative\">
        <div 
          className=\"flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition-colors\"
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search className=\"w-4 h-4 text-gray-400\" />
          <input
            ref={inputRef}
            type=\"text\"
            placeholder=\"Search customers, products, invoices... (Ctrl+K)\"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            className=\"flex-1 outline-none text-sm\"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults({});
                setSuggestions([]);
              }}
              className=\"text-gray-400 hover:text-gray-600\"
            >
              <X className=\"w-4 h-4\" />
            </button>
          )}
          <kbd className=\"hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded border\">
            ⌘K
          </kbd>
        </div>
      </div>
      
      {/* Search Results Dropdown */}
      {isOpen && (
        <div className=\"absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto\">
          {isLoading && (
            <div className=\"flex items-center justify-center py-8\">
              <Loader2 className=\"w-6 h-6 animate-spin text-blue-500\" />
              <span className=\"ml-2 text-sm text-gray-600\">Searching...</span>
            </div>
          )}
          
          {!isLoading && query.length >= 2 && totalResults === 0 && suggestions.length === 0 && (
            <div className=\"py-8 text-center text-gray-500\">
              <Search className=\"w-8 h-8 mx-auto mb-2 text-gray-300\" />
              <p>No results found for \"{query}\"</p>
            </div>
          )}
          
          {!isLoading && query.length < 2 && recentSearches.length > 0 && (
            <div className=\"p-4\">
              <h3 className=\"text-sm font-medium text-gray-700 mb-2 flex items-center\">
                <Clock className=\"w-4 h-4 mr-1\" />
                Recent Searches
              </h3>
              {recentSearches.map((recent, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recent.query)}
                  className=\"w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded\"
                >
                  {recent.query}
                </button>
              ))}
            </div>
          )}
          
          {!isLoading && (suggestions.length > 0 || totalResults > 0) && (
            <div className=\"py-2\">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className=\"px-4 py-2\">
                  <h3 className=\"text-xs font-medium text-gray-500 uppercase tracking-wide mb-2\">
                    Suggestions
                  </h3>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onClick={() => handleResultClick(suggestion)}
                      className={cn(
                        \"w-full text-left px-2 py-2 text-sm rounded hover:bg-gray-50 flex items-center space-x-2\",
                        selectedIndex === index && \"bg-blue-50\"
                      )}
                    >
                      <Search className=\"w-4 h-4 text-gray-400\" />
                      <span>{suggestion.text}</span>
                      <span className=\"text-xs text-gray-400 ml-auto\">{suggestion.category}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Search Results */}
              {Object.entries(results).map(([category, items]) => (
                items.length > 0 && (
                  <div key={category} className=\"px-4 py-2\">
                    <h3 className=\"text-xs font-medium text-gray-500 uppercase tracking-wide mb-2\">
                      {category} ({items.length})
                    </h3>
                    {items.map((item, index) => {
                      const globalIndex = suggestions.length + 
                        Object.entries(results).slice(0, Object.keys(results).indexOf(category))
                          .reduce((sum, [, prevItems]) => sum + prevItems.length, 0) + index;
                      
                      return (
                        <button
                          key={`${category}-${item.id}`}
                          onClick={() => handleResultClick({ ...item, category })}
                          className={cn(
                            \"w-full text-left px-2 py-2 text-sm rounded hover:bg-gray-50 flex items-center space-x-2\",
                            selectedIndex === globalIndex && \"bg-blue-50\"
                          )}
                        >
                          {getResultIcon(category)}
                          <span className=\"flex-1\">{formatResultText(item, category)}</span>
                        </button>
                      );
                    })}
                  </div>
                )
              ))}
              
              {/* View All Results */}
              {query.trim() && totalResults > 0 && (
                <div className=\"border-t border-gray-100 px-4 py-2\">
                  <button
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(query)}`);
                      setIsOpen(false);
                    }}
                    className=\"w-full text-left px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded\"
                  >
                    View all results for \"{query}\"
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

