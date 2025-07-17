// Mobile responsiveness utilities for SabiOps
// Provides consistent touch-friendly interactions and mobile-optimized components

/**
 * Touch-friendly button classes for consistent mobile interactions
 */
export const touchFriendlyClasses = {
  // Standard touch-friendly button
  button: "h-12 text-base touch-manipulation min-w-[48px]",
  
  // Small touch-friendly button (for action buttons in cards)
  buttonSmall: "h-10 w-10 text-sm touch-manipulation min-w-[40px]",
  
  // Large touch-friendly button (for primary actions)
  buttonLarge: "h-14 text-lg touch-manipulation min-w-[56px]",
  
  // Touch-friendly input fields
  input: "h-12 text-base touch-manipulation",
  
  // Touch-friendly textarea
  textarea: "text-base touch-manipulation min-h-[96px]",
  
  // Touch-friendly select
  select: "h-12 text-base touch-manipulation",
  
  // Touch-friendly label
  label: "text-base font-medium",
  
  // Mobile-optimized card padding
  cardPadding: "p-3 sm:p-4 lg:p-6",
  
  // Mobile-optimized spacing
  spacing: "space-y-4 sm:space-y-6",
  
  // Mobile-optimized grid gaps
  gridGap: "gap-3 sm:gap-4 lg:gap-6"
};

/**
 * Mobile breakpoint utilities
 */
export const breakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  
  // Check if current viewport is mobile
  isMobile: () => window.matchMedia('(max-width: 767px)').matches,
  
  // Check if current viewport is tablet
  isTablet: () => window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
  
  // Check if current viewport is desktop
  isDesktop: () => window.matchMedia('(min-width: 1024px)').matches
};

/**
 * Mobile-optimized dialog/modal configurations
 */
export const mobileDialogClasses = {
  // Full-screen mobile dialog
  fullScreen: "w-[100vw] h-[100vh] max-w-none max-h-none m-0 rounded-none",
  
  // Near full-screen mobile dialog (recommended)
  nearFullScreen: "w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col",
  
  // Large mobile dialog
  large: "w-[95vw] max-w-4xl h-[85vh] max-h-[85vh] overflow-hidden flex flex-col",
  
  // Standard mobile dialog
  standard: "w-[90vw] max-w-lg h-auto max-h-[80vh] overflow-hidden flex flex-col",
  
  // Dialog header (non-scrollable)
  header: "flex-shrink-0 pb-4 border-b",
  
  // Dialog content (scrollable)
  content: "flex-1 overflow-y-auto px-1 py-4",
  
  // Dialog footer (non-scrollable)
  footer: "flex-shrink-0 pt-4 border-t"
};

/**
 * Mobile-optimized form layouts
 */
export const mobileFormClasses = {
  // Single column layout for mobile
  container: "space-y-6",
  
  // Form field wrapper
  field: "space-y-2",
  
  // Form field grid (responsive)
  fieldGrid: "grid grid-cols-1 gap-4",
  
  // Form actions (buttons)
  actions: "flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t",
  
  // Required field indicator
  required: "text-red-500 ml-1",
  
  // Optional field indicator
  optional: "text-gray-400 ml-1"
};

/**
 * Mobile-optimized card layouts
 */
export const mobileCardClasses = {
  // Standard mobile card (2 per row)
  standard: "bg-white border border-gray-200 hover:shadow-md transition-shadow rounded-lg",
  
  // Mobile card content
  content: "p-3 sm:p-4",
  
  // Mobile card grid (2 per row on mobile, responsive)
  grid: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4",
  
  // Mobile card header
  header: "flex items-start justify-between mb-3",
  
  // Mobile card title
  title: "font-medium text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight",
  
  // Mobile card subtitle
  subtitle: "text-xs sm:text-sm text-gray-600 truncate",
  
  // Mobile card actions
  actions: "flex gap-1 ml-2 flex-shrink-0",
  
  // Mobile card stats
  stats: "space-y-1.5 sm:space-y-2",
  
  // Mobile card stat row
  statRow: "flex justify-between items-center text-xs sm:text-sm"
};

/**
 * Mobile-optimized table alternatives
 */
export const mobileTableClasses = {
  // Hide table on mobile, show cards
  hideOnMobile: "hidden md:block",
  
  // Show only on mobile (for card view)
  showOnMobile: "block md:hidden",
  
  // Responsive table wrapper
  wrapper: "overflow-x-auto",
  
  // Mobile-friendly table cells
  cell: "px-2 py-3 text-sm",
  
  // Mobile-friendly table headers
  header: "px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
};

/**
 * Mobile-optimized search and filter components
 */
export const mobileSearchClasses = {
  // Search container
  container: "space-y-3 sm:space-y-4",
  
  // Search input wrapper
  inputWrapper: "relative",
  
  // Search icon positioning
  icon: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
  
  // Search input
  input: "pl-10 h-12 text-base touch-manipulation w-full",
  
  // Filter grid
  filterGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",
  
  // Clear search button
  clearButton: "h-8 text-sm touch-manipulation"
};

/**
 * Mobile-optimized navigation classes
 */
export const mobileNavClasses = {
  // Bottom navigation container
  bottomNav: "fixed bottom-0 left-0 right-0 bg-green-500 border-t border-green-400 z-50 safe-area-pb",
  
  // Bottom navigation content
  navContent: "px-2 py-1",
  
  // Navigation grid
  navGrid: "grid grid-cols-5 gap-1 w-full",
  
  // Navigation button
  navButton: "flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors rounded-lg min-h-[64px] touch-manipulation",
  
  // Active navigation button
  navButtonActive: "text-white bg-green-600",
  
  // Inactive navigation button
  navButtonInactive: "text-white hover:text-green-100 hover:bg-green-600 active:bg-green-700",
  
  // Navigation icon
  navIcon: "h-5 w-5 mb-1 flex-shrink-0",
  
  // Navigation label
  navLabel: "text-center leading-tight truncate w-full text-[10px] sm:text-xs"
};

/**
 * Utility functions for mobile interactions
 */
export const mobileUtils = {
  /**
   * Add touch-friendly classes to an element
   */
  makeTouchFriendly: (baseClasses, type = 'button') => {
    const touchClasses = touchFriendlyClasses[type] || touchFriendlyClasses.button;
    return `${baseClasses} ${touchClasses}`;
  },
  
  /**
   * Get appropriate dialog classes based on screen size
   */
  getDialogClasses: (size = 'standard') => {
    return mobileDialogClasses[size] || mobileDialogClasses.standard;
  },
  
  /**
   * Check if device supports touch
   */
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  /**
   * Get viewport dimensions
   */
  getViewportSize: () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },
  
  /**
   * Scroll to top of page (useful for mobile navigation)
   */
  scrollToTop: () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  
  /**
   * Prevent zoom on double tap (for buttons)
   */
  preventZoom: (event) => {
    if (event.detail > 1) {
      event.preventDefault();
    }
  },
  
  /**
   * Handle mobile keyboard visibility
   */
  handleKeyboard: {
    // Scroll input into view when focused
    scrollIntoView: (element) => {
      if (breakpoints.isMobile()) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    },
    
    // Blur input when done (to hide keyboard)
    blurOnEnter: (event) => {
      if (event.key === 'Enter' && breakpoints.isMobile()) {
        event.target.blur();
      }
    }
  }
};

/**
 * Mobile-specific event handlers
 */
export const mobileEventHandlers = {
  /**
   * Handle touch start for better button feedback
   */
  handleTouchStart: (event) => {
    event.currentTarget.style.transform = 'scale(0.95)';
  },
  
  /**
   * Handle touch end for better button feedback
   */
  handleTouchEnd: (event) => {
    event.currentTarget.style.transform = 'scale(1)';
  },
  
  /**
   * Handle swipe gestures
   */
  handleSwipe: {
    start: null,
    
    onTouchStart: (event) => {
      mobileEventHandlers.handleSwipe.start = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        time: Date.now()
      };
    },
    
    onTouchEnd: (event, callbacks = {}) => {
      if (!mobileEventHandlers.handleSwipe.start) return;
      
      const end = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
        time: Date.now()
      };
      
      const deltaX = end.x - mobileEventHandlers.handleSwipe.start.x;
      const deltaY = end.y - mobileEventHandlers.handleSwipe.start.y;
      const deltaTime = end.time - mobileEventHandlers.handleSwipe.start.time;
      
      // Only consider it a swipe if it's fast enough and long enough
      if (deltaTime < 500 && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight();
        } else if (deltaX < 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft();
        }
      }
      
      mobileEventHandlers.handleSwipe.start = null;
    }
  }
};

export default {
  touchFriendlyClasses,
  breakpoints,
  mobileDialogClasses,
  mobileFormClasses,
  mobileCardClasses,
  mobileTableClasses,
  mobileSearchClasses,
  mobileNavClasses,
  mobileUtils,
  mobileEventHandlers
};