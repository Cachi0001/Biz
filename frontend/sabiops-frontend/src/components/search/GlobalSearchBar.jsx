/**
 * Global Search Bar Component
 * Universal search bar with autocomplete, real-time search, and keyboard navigation
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import globalSearchService from '../../services/globalSearchService';
import { 
  validateSearchQuery, 
  formatResultForDisplay, 
  getResultNavigationUrl,
  getResultIcon,
  groupResultsWithCounts
} from '../../utils/searchUtils';

const GlobalSearchBar = ({ className = '', placeholder = "Search products, customers, invoices, sales, expenses..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input changes
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setError(null);

    if (!newQuery.trim()) {
      setResults(null);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const validation = validateSearchQuery(newQuery);
    if (!validation.isValid) {
      setError(validation.error);
      setResults(null);
      setIsOpen(false);
      return;
    }

    // Perform debounced search
    setIsLoading(true);
    globalSearchService.debouncedSearch(
      validation.sanitized,
      { limit: 8 },
      (searchResults) => {
        setIsLoading(false);
        
        if (searchResults.success) {
          setResults(searchResults);
          setIsOpen(true);
          setSelectedIndex(-1);
        } else {
          setError(searchResults.error?.message || 'Search failed');
          setResults(null);
          setIsOpen(false);
        }
      }
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || !results) return;

    const flatResults = getFlatResults();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < flatResults.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && flatResults[selectedIndex]) {
          handleResultClick(flatResults[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        searchRef.current?.querySelector('input')?.blur();
        break;
    }
  };

  // Get flattened results for keyboard navigation
  const getFlatResults = () => {
    if (!results?.results) return [];
    
    const flat = [];
    Object.values(results.results).forEach(items => {
      if (Array.isArray(items)) {
        flat.push(...items);
      }
    });
    return flat;
  };

  // Handle result click
  const handleResultClick = (item) => {
    const url = getResultNavigationUrl(item);
    setIsOpen(false);
    setQuery('');
    setResults(null);
    setSelectedIndex(-1);
    navigate(url);
  };

  // Handle search focus
  const handleFocus = () => {
    if (results && query.trim()) {
      setIsOpen(true);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    searchRef.current?.querySelector('input')?.focus();
  };

  // Get grouped results for display
  const groupedResults = results ? groupResultsWithCounts(results.results) : [];

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-6 w-6 sm:h-5 sm:w-5 text-green-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 bg-green-600/50 text-white border border-green-400/30 rounded-lg 
                   focus:ring-2 focus:ring-green-300 focus:border-green-300 
                   placeholder:text-green-200 text-sm touch-manipulation h-12 sm:h-auto"
          autoComplete="off"
        />
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-200 hover:text-white touch-manipulation"
          >
            <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm z-50">
          {error}
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && results && !error && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {groupedResults.length > 0 ? (
            <div className="py-2">
              {/* Results Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Found {results.total_results} results
                  </span>
                  {results.cached && (
                    <span className="text-xs text-gray-400">Cached</span>
                  )}
                </div>
              </div>

              {/* Results by Category */}
              {groupedResults.map((category, categoryIndex) => (
                <div key={category.type} className="py-1">
                  {/* Category Header */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {category.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({category.count})
                      </span>
                    </div>
                  </div>

                  {/* Category Results */}
                  {category.items.map((item, itemIndex) => {
                    const flatIndex = getFlatResults().indexOf(item);
                    const isSelected = selectedIndex === flatIndex;
                    const formattedItem = formatResultForDisplay(item, query);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-b-0 
                                  ${isSelected ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg mt-0.5">{getResultIcon(item.type)}</span>
                          
                          <div className="flex-1 min-w-0">
                            <div 
                              className="text-sm font-medium text-gray-900 truncate"
                              dangerouslySetInnerHTML={{ 
                                __html: formattedItem.highlightedName || item.name || item.description || item.invoice_number 
                              }}
                            />
                            
                            {formattedItem.highlightedDescription && formattedItem.highlightedDescription !== formattedItem.highlightedName && (
                              <div 
                                className="text-sm text-gray-600 truncate mt-1"
                                dangerouslySetInnerHTML={{ __html: formattedItem.highlightedDescription }}
                              />
                            )}
                            
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              {formattedItem.formattedAmount && (
                                <span>{formattedItem.formattedAmount}</span>
                              )}
                              {formattedItem.formattedDate && (
                                <span>{formattedItem.formattedDate}</span>
                              )}
                              {item.status && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  item.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* View All Results */}
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all results for "{query}"
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">No results found for "{query}"</p>
              <p className="text-xs text-gray-500 mt-1">Try different keywords or check spelling</p>
            </div>
          )}
        </div>
      )}

      {/* Search Highlight Styles */}
      <style jsx>{`
        .search-highlight {
          background-color: #fef3c7;
          color: #92400e;
          padding: 0 2px;
          border-radius: 2px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default GlobalSearchBar;