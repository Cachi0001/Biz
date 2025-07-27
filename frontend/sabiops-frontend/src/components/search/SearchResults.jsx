/**
 * Search Results Component
 * Unified search results display with categorization, highlighting, and navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  formatResultForDisplay, 
  getResultNavigationUrl,
  getResultIcon,
  groupResultsWithCounts,
  getTotalResultsCount
} from '../../utils/searchUtils';

const SearchResults = ({ 
  results, 
  query, 
  isLoading = false, 
  error = null,
  onResultClick,
  showCategories = true,
  maxItemsPerCategory = 10,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleResultClick = (item) => {
    if (onResultClick) {
      onResultClick(item);
    } else {
      const url = getResultNavigationUrl(item);
      navigate(url);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Searching...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No results state
  if (!results || !results.results || getTotalResultsCount(results.results) === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          {query && (
            <p className="text-gray-600 mb-4">
              No results found for "<span className="font-medium">{query}</span>"
            </p>
          )}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Try different keywords or check spelling</p>
            <p>Use more general terms</p>
            <p>Check if the item exists in your data</p>
          </div>
        </div>
      </div>
    );
  }

  const groupedResults = groupResultsWithCounts(results.results);
  const totalResults = getTotalResultsCount(results.results);

  return (
    <div className={`${className}`}>
      {/* Results Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {totalResults} results
              {query && (
                <span> for "<span className="font-medium">{query}</span>"</span>
              )}
            </p>
          </div>
          
          {results.cached && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Cached results</span>
            </div>
          )}
        </div>
      </div>

      {/* Results by Category */}
      <div className="space-y-8">
        {groupedResults.map((category) => (
          <div key={category.type} className="bg-white rounded-lg border border-gray-200">
            {/* Category Header */}
            {showCategories && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {category.count} {category.count === 1 ? 'result' : 'results'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Results */}
            <div className="divide-y divide-gray-200">
              {category.items.slice(0, maxItemsPerCategory).map((item) => {
                const formattedItem = formatResultForDisplay(item, query);
                
                return (
                  <SearchResultItem
                    key={item.id}
                    item={item}
                    formattedItem={formattedItem}
                    query={query}
                    onClick={() => handleResultClick(item)}
                  />
                );
              })}
              
              {/* Show More Button */}
              {category.items.length > maxItemsPerCategory && (
                <div className="px-6 py-4 bg-gray-50">
                  <button
                    onClick={() => {
                      // Navigate to filtered results page
                      navigate(`/search?q=${encodeURIComponent(query)}&type=${category.type}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all {category.count} {category.label.toLowerCase()}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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

// Individual Search Result Item Component
const SearchResultItem = ({ item, formattedItem, query, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
    >
      <div className="flex items-start space-x-4">
        {/* Result Icon */}
        <div className="flex-shrink-0 mt-1">
          <span className="text-2xl">{getResultIcon(item.type)}</span>
        </div>

        {/* Result Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between">
            <h4 
              className="text-base font-medium text-gray-900 truncate"
              dangerouslySetInnerHTML={{ 
                __html: formattedItem.highlightedName || item.name || item.description || item.invoice_number 
              }}
            />
            
            {/* Amount */}
            {formattedItem.formattedAmount && (
              <span className="ml-4 text-lg font-semibold text-gray-900 flex-shrink-0">
                {formattedItem.formattedAmount}
              </span>
            )}
          </div>

          {/* Description */}
          {formattedItem.highlightedDescription && 
           formattedItem.highlightedDescription !== formattedItem.highlightedName && (
            <p 
              className="text-sm text-gray-600 mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: formattedItem.highlightedDescription }}
            />
          )}

          {/* Metadata */}
          <div className="flex items-center space-x-4 mt-2">
            {/* Date */}
            {formattedItem.formattedDate && (
              <span className="text-sm text-gray-500">
                {formattedItem.formattedDate}
              </span>
            )}

            {/* Status */}
            {item.status && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.status === 'paid' ? 'bg-green-100 text-green-800' :
                item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                item.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {item.status}
              </span>
            )}

            {/* Category */}
            {item.category && (
              <span className="text-sm text-gray-500">
                {item.category}
              </span>
            )}

            {/* Stock for products */}
            {item.type === 'product' && typeof item.stock === 'number' && (
              <span className={`text-sm ${
                item.stock > 10 ? 'text-green-600' :
                item.stock > 0 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {item.stock} in stock
              </span>
            )}

            {/* Customer info for invoices */}
            {item.type === 'invoice' && item.customer_name && (
              <span className="text-sm text-gray-500">
                Customer: {item.customer_name}
              </span>
            )}

            {/* Email for customers */}
            {item.type === 'customer' && item.email && (
              <span className="text-sm text-gray-500">
                {item.email}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Arrow */}
        <div className="flex-shrink-0 ml-4">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;