import React from 'react';

/**
 * Mobile Responsiveness Utilities
 * Provides consistent mobile optimization across all components
 */

/**
 * Standard responsive grid classes for consistent layouts
 */
export const responsiveGrids = {
  // Cards and overview sections
  overviewCards: "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4",
  quickActions: "grid grid-cols-2 gap-3 sm:gap-4",
  analyticsGrid: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6",
  
  // Form layouts
  formGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  formSingle: "grid grid-cols-1 gap-4",
  
  // Table responsiveness
  tableContainer: "overflow-x-auto",
  tableWrapper: "min-w-full",
};

/**
 * Standard responsive spacing classes
 */
export const responsiveSpacing = {
  container: "container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl",
  section: "space-y-4 sm:space-y-6",
  card: "p-3 sm:p-4 lg:p-6",
  cardHeader: "p-4 sm:p-6",
  cardContent: "p-3 sm:p-4",
};

/**
 * Standard responsive text classes
 */
export const responsiveText = {
  heading1: "text-xl sm:text-2xl lg:text-3xl font-bold",
  heading2: "text-lg sm:text-xl lg:text-2xl font-semibold",
  heading3: "text-base sm:text-lg font-semibold",
  body: "text-sm sm:text-base",
  caption: "text-xs sm:text-sm",
};

/**
 * Standard responsive button classes
 */
export const responsiveButtons = {
  primary: "h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base touch-manipulation",
  secondary: "h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm touch-manipulation",
  icon: "h-8 w-8 sm:h-10 sm:w-10 touch-manipulation",
  fab: "h-12 w-12 sm:h-14 sm:w-14 touch-manipulation",
};

/**
 * Mobile-specific utilities
 */
export const mobileUtils = {
  // Check if device is mobile
  isMobile: () => {
    return window.innerWidth < 768;
  },
  
  // Check if device is tablet
  isTablet: () => {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  },
  
  // Check if device is desktop
  isDesktop: () => {
    return window.innerWidth >= 1024;
  },
  
  // Get appropriate grid columns based on screen size
  getGridCols: (mobile = 1, tablet = 2, desktop = 3) => {
    if (mobileUtils.isMobile()) return mobile;
    if (mobileUtils.isTablet()) return tablet;
    return desktop;
  },
  
  // Touch-friendly minimum sizes
  minTouchTarget: "min-h-[44px] min-w-[44px]", // Apple's recommended minimum
  
  // Safe area padding for mobile devices
  safeArea: "pb-safe-bottom pl-safe-left pr-safe-right",
};

/**
 * Responsive breakpoint hooks
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

/**
 * Mobile-optimized component wrappers
 */
export const MobileOptimizedCard = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`${responsiveSpacing.card} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileOptimizedContainer = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`${responsiveSpacing.container} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileOptimizedGrid = ({ 
  children, 
  cols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  gap = "gap-4 sm:gap-6",
  className = "",
  ...props 
}) => {
  return (
    <div 
      className={`grid ${cols} ${gap} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Mobile-specific CSS classes for common patterns
 */
export const mobileClasses = {
  // Scrollable containers
  scrollContainer: "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
  
  // Mobile-friendly tables
  mobileTable: "min-w-full divide-y divide-gray-200 text-sm",
  mobileTableCell: "px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap",
  
  // Mobile navigation
  mobileNav: "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden",
  
  // Mobile modals
  mobileModal: "fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4",
  mobileModalContent: "w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl",
  
  // Mobile forms
  mobileForm: "space-y-4 sm:space-y-6",
  mobileInput: "h-12 text-base touch-manipulation",
  mobileSelect: "h-12 text-base touch-manipulation",
  
  // Mobile buttons
  mobilePrimary: "h-12 px-6 text-base font-medium touch-manipulation",
  mobileSecondary: "h-10 px-4 text-sm touch-manipulation",
};

/**
 * Accessibility helpers for mobile
 */
export const mobileA11y = {
  // Screen reader only text
  srOnly: "sr-only",
  
  // Focus visible styles
  focusVisible: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  
  // High contrast mode support
  highContrast: "contrast-more:border-black contrast-more:text-black",
  
  // Reduced motion support
  reducedMotion: "motion-reduce:transition-none motion-reduce:transform-none",
};

export default {
  responsiveGrids,
  responsiveSpacing,
  responsiveText,
  responsiveButtons,
  mobileUtils,
  useResponsive,
  MobileOptimizedCard,
  MobileOptimizedContainer,
  MobileOptimizedGrid,
  mobileClasses,
  mobileA11y,
};