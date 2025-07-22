import React from 'react';
import { MobileNavigation } from './MobileNavigation';
import { ModernHeader } from './ModernHeader';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Modern Header */}
      <ModernHeader />
      
      {/* Main content with proper responsive spacing */}
      <main className="pt-2 pb-20 sm:pb-16 min-h-screen"> 
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};

export { DashboardLayout };
export default DashboardLayout;