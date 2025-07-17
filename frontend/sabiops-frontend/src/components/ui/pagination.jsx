/**
 * Pagination Component for SabiOps
 * Provides mobile-friendly pagination with performance optimizations
 */

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  showInfo = true,
  showSizeSelector = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  className = ''
}) => {
  // Don't render if there's only one page or no data
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Show first pages
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Show middle pages
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info section */}
      {showInfo && (
        <div className="text-sm text-gray-600 order-2 sm:order-1">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <div key={`ellipsis-${index}`} className="px-2 py-1">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }

            const isActive = page === currentPage;
            
            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={`min-w-[40px] ${
                  isActive 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page size selector */}
      {showSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm order-3">
          <span className="text-gray-600">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-gray-600">per page</span>
        </div>
      )}
    </div>
  );
};

// Simple pagination for mobile
export const SimplePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Pagination info component
export const PaginationInfo = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  className = ''
}) => {
  if (totalItems === 0) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        No results found
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      Showing {startItem} to {endItem} of {totalItems} results
      {totalPages > 1 && (
        <span className="ml-2">
          (Page {currentPage} of {totalPages})
        </span>
      )}
    </div>
  );
};

// Jump to page component
export const JumpToPage = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  const [inputPage, setInputPage] = React.useState(currentPage.toString());

  const handleSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(inputPage, 10);
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
    setInputPage(currentPage.toString());
  };

  React.useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Go to page:</span>
      <input
        type="number"
        min="1"
        max={totalPages}
        value={inputPage}
        onChange={(e) => setInputPage(e.target.value)}
        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <Button type="submit" size="sm" variant="outline">
        Go
      </Button>
    </form>
  );
};

// Responsive pagination that adapts to screen size
export const ResponsivePagination = (props) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <SimplePagination {...props} />;
  }

  return <Pagination {...props} />;
};

export default {
  Pagination,
  SimplePagination,
  PaginationInfo,
  JumpToPage,
  ResponsivePagination
};