import React from 'react';
import { MobileNavigation } from './MobileNavigation';
import { ModernHeader } from './ModernHeader';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-green-50">
      {/* Modern Header */}
      <ModernHeader />
      
      {/* Main content with proper spacing - adjusted for dynamic header height */}
      <div className="pt-[120px] sm:pt-[100px] lg:pt-[90px] pb-20 sm:pb-16"> 
        {children}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};

export { DashboardLayout };
export default DashboardLayout;