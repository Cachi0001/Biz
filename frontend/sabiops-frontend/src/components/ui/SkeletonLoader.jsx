/**
 * Skeleton Loader Components for SabiOps
 * Provides loading placeholders that match the actual content structure
 */

import React from 'react';

// Base skeleton component
export const Skeleton = ({ className = '', width, height, ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ width, height }}
    {...props}
  />
);

// Card skeleton for customer, product, invoice cards
export const CardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-1 ml-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
    
    {/* Content */}
    <div className="space-y-1">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
      <div className="text-center space-y-1">
        <Skeleton className="h-6 w-16 mx-auto" />
        <Skeleton className="h-3 w-12 mx-auto" />
      </div>
      <div className="text-center space-y-1">
        <Skeleton className="h-6 w-16 mx-auto" />
        <Skeleton className="h-3 w-12 mx-auto" />
      </div>
    </div>
  </div>
);

// Grid of card skeletons
export const CardGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: count }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Dashboard overview cards skeleton
export const DashboardCardsSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 300 }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded" />
      </div>
      <div className="relative" style={{ height }}>
        <Skeleton className="absolute inset-0 rounded" />
        {/* Chart bars simulation */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton 
              key={i} 
              className="w-8" 
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Form skeleton
export const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
    ))}
    <div className="flex justify-end space-x-2 pt-4">
      <Skeleton className="h-10 w-20 rounded" />
      <Skeleton className="h-10 w-16 rounded" />
    </div>
  </div>
);

// List item skeleton
export const ListItemSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-16 rounded" />
  </div>
);

// List skeleton
export const ListSkeleton = ({ items = 5 }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    {Array.from({ length: items }, (_, i) => (
      <ListItemSkeleton key={i} />
    ))}
  </div>
);

// Page header skeleton
export const PageHeaderSkeleton = () => (
  <div className="flex items-center justify-between mb-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="flex space-x-2">
      <Skeleton className="h-10 w-24 rounded" />
      <Skeleton className="h-10 w-32 rounded" />
    </div>
  </div>
);

// Stats skeleton
export const StatsSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

// Mobile navigation skeleton
export const MobileNavSkeleton = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
    <div className="flex justify-around">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex flex-col items-center space-y-1">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  </div>
);

// Search skeleton
export const SearchSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full rounded" />
    <div className="space-y-2">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Full page skeleton
export const FullPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </div>
    </div>
    
    {/* Content */}
    <div className="p-6">
      <PageHeaderSkeleton />
      <div className="space-y-6">
        <DashboardCardsSkeleton />
        <ChartSkeleton />
        <TableSkeleton />
      </div>
    </div>
  </div>
);

export default {
  Skeleton,
  CardSkeleton,
  CardGridSkeleton,
  TableSkeleton,
  DashboardCardsSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
  StatsSkeleton,
  MobileNavSkeleton,
  SearchSkeleton,
  FullPageSkeleton
};