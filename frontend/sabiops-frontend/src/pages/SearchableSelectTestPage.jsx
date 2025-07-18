import React from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import SearchableSelectTest from '../components/ui/SearchableSelectTest';

const SearchableSelectTestPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">SearchableSelect Component Test</h1>
        <SearchableSelectTest />
      </div>
    </DashboardLayout>
  );
};

export default SearchableSelectTestPage;