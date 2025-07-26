import React from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StableInput from '@/components/ui/StableInput';
import MobileDateInput from '@/components/ui/MobileDateInput';

export const SalesFilters = ({
  searchTerm,
  setSearchTerm,
  selectedDate,
  setSelectedDate,
  onRefresh,
  onDownload,
  loading
}) => {
  return (
    <Card className="mb-6 bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Filter & Search</CardTitle>
        <CardDescription>Filter sales by date and search for specific transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
              Search Sales
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <StableInput
                id="search"
                name="search"
                placeholder="Search by customer name, product, or sale details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500 md:text-xs"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="filter_date" className="text-sm font-medium text-gray-700 mb-2 block">
              Filter by Date
            </Label>
            <MobileDateInput
              id="filter_date"
              name="filter_date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onDownload}
            className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesFilters;
