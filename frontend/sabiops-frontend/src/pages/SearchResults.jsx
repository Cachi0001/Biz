/**
 * Search Results Page
 * Dedicated page for displaying comprehensive search results
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import SearchResults from '../components/search/SearchResults';
import GlobalSearchBar from '../components/search/GlobalSearchBar';
import globalSearchService from '../services/globalSearchService';
import { validateSearchQuery, sortResults, filterResultsByType } from '../utils/searchUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Filter, SortAsc, SortDesc } from 'lucide-react';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';

  // Perform search when query or filters change
  useEffect(() => {
    if (query.trim()) {
      performSearch();
    }
  }, [query, type]);

  // Apply sorting and filtering when results or sort options change
  useEffect(() => {
    if (results && results.results) {
      applyFiltersAndSorting();
    }
  }, [sortBy, sortOrder, filterType]);

  const performSearch = async () => {
    const validation = validateSearchQuery(query);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await globalSearchService.search(validation.sanitized, {
        type: type,
        limit: 50
      });

      if (searchResults.success) {
        setResults(searchResults);
        setFilterType(type);
      } else {
        setError(searchResults.error?.message || 'Search failed');
      }
    } catch (err) {
      setError('An error occurred while searching');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    if (!results || !results.results) return;

    let processedResults = { ...results };
    
    // Apply type filter
    if (filterType !== 'all') {
      processedResults.results = filterResultsByType(results.results, filterType);
    }

    // Apply sorting to each category
    Object.keys(processedResults.results).forEach(category => {
      if (Array.isArray(processedResults.results[category])) {
        processedResults.results[category] = sortResults(
          processedResults.results[category],
          sortBy,
          sortOrder
        );
      }
    });

    setResults(processedResults);
  };

  const handleNewSearch = (newQuery) => {
    if (newQuery.trim()) {
      setSearchParams({ q: newQuery, type: filterType });
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleSortOrderToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    setSearchParams({ q: query, type: newFilter });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <GlobalSearchBar
              className="max-w-2xl"
              placeholder="Search customers, products, invoices..."
            />
          </div>

          {/* Filters and Sorting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters & Sorting</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                {/* Type Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Type:</label>
                  <Select value={filterType} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="invoices">Invoices</SelectItem>
                      <SelectItem value="expenses">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <Button
                  variant="outline"
                  onClick={handleSortOrderToggle}
                  className="flex items-center space-x-2"
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <SearchResults
          results={results}
          query={query}
          isLoading={isLoading}
          error={error}
          showCategories={true}
          maxItemsPerCategory={20}
          className="space-y-6"
        />

        {/* No Query State */}
        {!query.trim() && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Your Business Data</h2>
            <p className="text-gray-600 mb-6">
              Use the search bar above to find customers, products, invoices, and expenses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNewSearch('customer')}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">👤</div>
                  <h3 className="font-medium">Customers</h3>
                  <p className="text-sm text-gray-600">Search by name, email, phone</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNewSearch('product')}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📦</div>
                  <h3 className="font-medium">Products</h3>
                  <p className="text-sm text-gray-600">Search by name, description, SKU</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNewSearch('invoice')}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📄</div>
                  <h3 className="font-medium">Invoices</h3>
                  <p className="text-sm text-gray-600">Search by number, customer, status</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNewSearch('expense')}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <h3 className="font-medium">Expenses</h3>
                  <p className="text-sm text-gray-600">Search by description, category</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SearchResultsPage;