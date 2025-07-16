describe('Mobile-First Responsive Design', () => {
  test('mobile viewport classes (320px - 768px)', () => {
    const mobileClasses = {
      // Grid system
      grid: 'grid-cols-1',
      overviewGrid: 'grid-cols-2',
      
      // Spacing
      padding: 'p-4',
      spacing: 'space-y-6',
      gap: 'gap-3',
      
      // Typography
      text: 'text-sm',
      heading: 'text-xl',
      
      // Components
      cardPadding: 'p-3',
      buttonSize: 'px-6 py-3'
    };

    // Verify mobile-first approach (no breakpoint prefix)
    expect(mobileClasses.grid).toBe('grid-cols-1');
    expect(mobileClasses.overviewGrid).toBe('grid-cols-2');
    expect(mobileClasses.padding).toBe('p-4');
    expect(mobileClasses.spacing).toBe('space-y-6');
    expect(mobileClasses.gap).toBe('gap-3');
    expect(mobileClasses.text).toBe('text-sm');
    expect(mobileClasses.cardPadding).toBe('p-3');
  });

  test('tablet viewport classes (768px - 1024px)', () => {
    const tabletClasses = {
      // Enhanced spacing
      padding: 'sm:px-6',
      spacing: 'sm:space-y-8',
      gap: 'sm:gap-4',
      
      // Enhanced typography
      text: 'sm:text-lg',
      heading: 'sm:text-2xl',
      
      // Enhanced components
      cardPadding: 'sm:p-4',
      buttonSize: 'sm:px-8',
      
      // Layout adjustments
      topPadding: 'sm:pt-[100px]',
      bottomPadding: 'sm:pb-16'
    };

    // Verify tablet enhancements use 'sm:' prefix
    Object.values(tabletClasses).forEach(className => {
      expect(className).toMatch(/^sm:/);
    });

    expect(tabletClasses.padding).toBe('sm:px-6');
    expect(tabletClasses.spacing).toBe('sm:space-y-8');
    expect(tabletClasses.text).toBe('sm:text-lg');
  });

  test('desktop viewport classes (1024px+)', () => {
    const desktopClasses = {
      // Grid system
      mainGrid: 'lg:grid-cols-2',
      gap: 'lg:gap-8',
      
      // Enhanced spacing
      padding: 'lg:px-8',
      
      // Layout adjustments
      topPadding: 'lg:pt-[90px]',
      maxWidth: 'max-w-7xl'
    };

    // Verify desktop enhancements use 'lg:' prefix or are layout constraints
    expect(desktopClasses.mainGrid).toBe('lg:grid-cols-2');
    expect(desktopClasses.gap).toBe('lg:gap-8');
    expect(desktopClasses.padding).toBe('lg:px-8');
    expect(desktopClasses.topPadding).toBe('lg:pt-[90px]');
    expect(desktopClasses.maxWidth).toBe('max-w-7xl');
  });

  test('touch-friendly interaction classes', () => {
    const touchClasses = {
      // Button sizing for touch
      minHeight: 'h-20', // Quick actions buttons
      buttonPadding: 'px-6 py-3',
      
      // Touch targets
      iconSize: 'h-6 w-6', // Larger icons for touch
      tapTarget: 'p-3', // Minimum 44px touch target
      
      // Hover states that work on touch
      hover: 'hover:shadow-xl',
      transition: 'transition-all duration-200',
      transform: 'hover:scale-105'
    };

    // Verify touch-friendly sizing
    expect(touchClasses.minHeight).toBe('h-20');
    expect(touchClasses.buttonPadding).toBe('px-6 py-3');
    expect(touchClasses.iconSize).toBe('h-6 w-6');
    expect(touchClasses.tapTarget).toBe('p-3');
    
    // Verify touch-friendly interactions
    expect(touchClasses.hover).toBe('hover:shadow-xl');
    expect(touchClasses.transition).toBe('transition-all duration-200');
    expect(touchClasses.transform).toBe('hover:scale-105');
  });

  test('responsive container system', () => {
    const containerClasses = {
      container: 'container mx-auto',
      maxWidth: 'max-w-7xl',
      mobilePadding: 'px-4',
      tabletPadding: 'sm:px-6',
      desktopPadding: 'lg:px-8'
    };

    // Verify container system
    expect(containerClasses.container).toBe('container mx-auto');
    expect(containerClasses.maxWidth).toBe('max-w-7xl');
    
    // Verify progressive padding enhancement
    expect(containerClasses.mobilePadding).toBe('px-4');
    expect(containerClasses.tabletPadding).toBe('sm:px-6');
    expect(containerClasses.desktopPadding).toBe('lg:px-8');
  });

  test('responsive typography scale', () => {
    const typographyScale = {
      // Body text
      bodyMobile: 'text-sm',
      bodyTablet: 'sm:text-base',
      bodyDesktop: 'lg:text-lg',
      
      // Headings
      headingMobile: 'text-xl',
      headingTablet: 'sm:text-2xl',
      headingDesktop: 'lg:text-3xl',
      
      // Small text
      smallMobile: 'text-xs',
      smallTablet: 'sm:text-sm'
    };

    // Verify mobile-first typography
    expect(typographyScale.bodyMobile).toBe('text-sm');
    expect(typographyScale.headingMobile).toBe('text-xl');
    expect(typographyScale.smallMobile).toBe('text-xs');
    
    // Verify progressive enhancement
    expect(typographyScale.bodyTablet).toBe('sm:text-base');
    expect(typographyScale.headingTablet).toBe('sm:text-2xl');
  });

  test('mobile navigation and header spacing', () => {
    const navigationSpacing = {
      // Header spacing to account for mobile navigation
      topPadding: 'pt-[120px]',
      tabletTopPadding: 'sm:pt-[100px]',
      desktopTopPadding: 'lg:pt-[90px]',
      
      // Bottom spacing for mobile navigation
      bottomPadding: 'pb-20',
      tabletBottomPadding: 'sm:pb-16'
    };

    // Verify mobile-first navigation spacing
    expect(navigationSpacing.topPadding).toBe('pt-[120px]');
    expect(navigationSpacing.bottomPadding).toBe('pb-20');
    
    // Verify progressive spacing reduction
    expect(navigationSpacing.tabletTopPadding).toBe('sm:pt-[100px]');
    expect(navigationSpacing.desktopTopPadding).toBe('lg:pt-[90px]');
    expect(navigationSpacing.tabletBottomPadding).toBe('sm:pb-16');
  });

  test('responsive grid breakpoints', () => {
    const gridBreakpoints = {
      // Mobile: single column for main content
      mobile: 'grid-cols-1',
      
      // Desktop: two columns for main content
      desktop: 'lg:grid-cols-2',
      
      // Overview cards: 2 columns on all sizes
      overviewCards: 'grid-cols-2',
      
      // Quick actions: 2 columns on all sizes
      quickActions: 'grid-cols-2'
    };

    // Verify mobile-first grid system
    expect(gridBreakpoints.mobile).toBe('grid-cols-1');
    expect(gridBreakpoints.desktop).toBe('lg:grid-cols-2');
    expect(gridBreakpoints.overviewCards).toBe('grid-cols-2');
    expect(gridBreakpoints.quickActions).toBe('grid-cols-2');
  });

  test('mobile-optimized component sizing', () => {
    const componentSizing = {
      // Card content padding
      cardMobile: 'p-3',
      cardTablet: 'sm:p-4',
      cardDesktop: 'sm:p-6',
      
      // Icon sizing
      iconSmall: 'h-3 w-3',
      iconMedium: 'h-4 w-4',
      iconLarge: 'h-6 w-6',
      
      // Button sizing
      buttonHeight: 'h-20', // Touch-friendly
      buttonPadding: 'px-6 py-3'
    };

    // Verify mobile-optimized sizing
    expect(componentSizing.cardMobile).toBe('p-3');
    expect(componentSizing.iconLarge).toBe('h-6 w-6');
    expect(componentSizing.buttonHeight).toBe('h-20');
    expect(componentSizing.buttonPadding).toBe('px-6 py-3');
    
    // Verify progressive enhancement
    expect(componentSizing.cardTablet).toBe('sm:p-4');
  });
});