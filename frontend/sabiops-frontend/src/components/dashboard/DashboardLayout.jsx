import React from 'react';
import { MobileNavigation } from './MobileNavigation';
import { cn } from '../../lib/utils/index.js';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-green-50">
      {/* Mobile-first layout */}
      <div className="pb-16"> {/* Bottom padding for mobile nav */}
        {children}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};

export { DashboardLayout };
export default DashboardLayout;