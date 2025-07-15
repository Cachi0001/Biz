import React from 'react';
import { MobileNavigation } from './MobileNavigation';
import { ModernHeader } from './ModernHeader';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-green-50">
      {/* Modern Header */}
      <ModernHeader />
      
      {/* Main content with proper spacing */}
      <div className="pt-14 lg:pt-[60px] pb-16"> {/* Top padding for header, bottom padding for mobile nav */}
        {children}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};

export { DashboardLayout };
export default DashboardLayout;