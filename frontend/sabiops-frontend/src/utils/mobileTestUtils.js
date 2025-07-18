/**
 * Mobile-First Responsive Design Test Utilities
 * 
 * This utility file contains functions to test and validate mobile-first responsive design
 * implementations according to the requirements:
 * 
 * Requirements from Requirement 5:
 * 1. Input fields SHALL be at least 44px tall for touch accessibility
 * 2. Buttons SHALL be full-width and easily tappable on mobile
 * 3. Layout SHALL adapt responsively across screen sizes
 * 4. Touch targets SHALL be appropriately sized
 * 5. Form SHALL maintain proper spacing and readability when scrolling on mobile
 */

// Touch accessibility constants
export const TOUCH_TARGETS = {
  MINIMUM_HEIGHT: 44, // Minimum touch target height in pixels
  MINIMUM_INPUT_HEIGHT: 48, // Minimum input field height for better usability
  MINIMUM_BUTTON_HEIGHT: 44, // Minimum button height for touch accessibility
  MINIMUM_SPACING: 16, // Minimum spacing between touch targets
};

// Responsive breakpoints (matching Tailwind CSS defaults)
export const BREAKPOINTS = {
  MOBILE: 0,      // 0px and up
  SM: 640,        // 640px and up (small tablets)
  MD: 768,        // 768px and up (tablets)
  LG: 1024,       // 1024px and up (laptops)
  XL: 1280,       // 1280px and up (desktops)
};

/**
 * Test if an element meets touch accessibility requirements
 * @param {HTMLElement} element - The element to test
 * @returns {Object} Test results with pass/fail status and details
 */
export const testTouchAccessibility = (element) => {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  const results = {
    height: {
      actual: rect.height,
      minimum: TOUCH_TARGETS.MINIMUM_HEIGHT,
      passes: rect.height >= TOUCH_TARGETS.MINIMUM_HEIGHT,
    },
    width: {
      actual: rect.width,
      passes: rect.width >= TOUCH_TARGETS.MINIMUM_HEIGHT, // Width should also be at least 44px
    },
    spacing: {
      marginTop: parseInt(computedStyle.marginTop) || 0,
      marginBottom: parseInt(computedStyle.marginBottom) || 0,
      paddingTop: parseInt(computedStyle.paddingTop) || 0,
      paddingBottom: parseInt(computedStyle.paddingBottom) || 0,
    },
    touchManipulation: {
      hasTouchManipulation: computedStyle.touchAction === 'manipulation' || 
                           element.classList.contains('touch-manipulation'),
      passes: computedStyle.touchAction === 'manipulation' || 
              element.classList.contains('touch-manipulation'),
    }
  };
  
  results.overall = results.height.passes && results.width.passes && results.touchManipulation.passes;
  
  return results;
};

/**
 * Test responsive behavior of form elements
 * @param {HTMLElement} formElement - The form element to test
 * @returns {Object} Test results for responsive behavior
 */
export const testResponsiveForm = (formElement) => {
  const inputs = formElement.querySelectorAll('input, select, textarea, button');
  const results = {
    totalElements: inputs.length,
    passedElements: 0,
    failedElements: 0,
    details: []
  };
  
  inputs.forEach((element, index) => {
    const testResult = testTouchAccessibility(element);
    const elementInfo = {
      index,
      tagName: element.tagName.toLowerCase(),
      type: element.type || 'N/A',
      id: element.id || 'N/A',
      className: element.className || 'N/A',
      testResult
    };
    
    if (testResult.overall) {
      results.passedElements++;
    } else {
      results.failedElements++;
    }
    
    results.details.push(elementInfo);
  });
  
  results.passRate = (results.passedElements / results.totalElements) * 100;
  
  return results;
};

/**
 * Test mobile-first responsive grid behavior
 * @param {HTMLElement} gridElement - The grid container to test
 * @returns {Object} Test results for grid responsiveness
 */
export const testResponsiveGrid = (gridElement) => {
  const computedStyle = window.getComputedStyle(gridElement);
  const gridTemplateColumns = computedStyle.gridTemplateColumns;
  const screenWidth = window.innerWidth;
  
  let expectedColumns;
  if (screenWidth < BREAKPOINTS.SM) {
    expectedColumns = 1; // Mobile: single column
  } else if (screenWidth < BREAKPOINTS.MD) {
    expectedColumns = 2; // Small: two columns
  } else {
    expectedColumns = 4; // Medium+: four columns
  }
  
  const actualColumns = gridTemplateColumns.split(' ').length;
  
  return {
    screenWidth,
    expectedColumns,
    actualColumns,
    gridTemplateColumns,
    passes: actualColumns === expectedColumns,
    breakpoint: getCurrentBreakpoint(screenWidth)
  };
};

/**
 * Get current responsive breakpoint
 * @param {number} width - Screen width in pixels
 * @returns {string} Current breakpoint name
 */
export const getCurrentBreakpoint = (width = window.innerWidth) => {
  if (width >= BREAKPOINTS.XL) return 'xl';
  if (width >= BREAKPOINTS.LG) return 'lg';
  if (width >= BREAKPOINTS.MD) return 'md';
  if (width >= BREAKPOINTS.SM) return 'sm';
  return 'mobile';
};

/**
 * Test button responsiveness (full-width on mobile)
 * @param {HTMLElement} buttonElement - The button to test
 * @returns {Object} Test results for button responsiveness
 */
export const testButtonResponsiveness = (buttonElement) => {
  const rect = buttonElement.getBoundingClientRect();
  const parentRect = buttonElement.parentElement.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth < BREAKPOINTS.SM;
  
  const isFullWidth = Math.abs(rect.width - parentRect.width) < 10; // Allow 10px tolerance
  
  return {
    screenWidth,
    isMobile,
    buttonWidth: rect.width,
    parentWidth: parentRect.width,
    isFullWidth,
    shouldBeFullWidth: isMobile,
    passes: isMobile ? isFullWidth : true, // On mobile, should be full width
    breakpoint: getCurrentBreakpoint(screenWidth)
  };
};

/**
 * Generate a comprehensive mobile responsiveness report
 * @param {HTMLElement} containerElement - The container to test
 * @returns {Object} Comprehensive test report
 */
export const generateMobileResponsivenessReport = (containerElement) => {
  const report = {
    timestamp: new Date().toISOString(),
    screenWidth: window.innerWidth,
    breakpoint: getCurrentBreakpoint(),
    tests: {}
  };
  
  // Test form elements
  const forms = containerElement.querySelectorAll('form');
  if (forms.length > 0) {
    report.tests.forms = Array.from(forms).map(form => testResponsiveForm(form));
  }
  
  // Test buttons
  const buttons = containerElement.querySelectorAll('button');
  if (buttons.length > 0) {
    report.tests.buttons = Array.from(buttons).map(button => testButtonResponsiveness(button));
  }
  
  // Test grid layouts
  const grids = containerElement.querySelectorAll('[class*="grid"]');
  if (grids.length > 0) {
    report.tests.grids = Array.from(grids).map(grid => testResponsiveGrid(grid));
  }
  
  // Calculate overall score
  const allTests = [
    ...(report.tests.forms || []),
    ...(report.tests.buttons || []),
    ...(report.tests.grids || [])
  ];
  
  const passedTests = allTests.filter(test => test.passes || test.passRate > 80).length;
  report.overallScore = allTests.length > 0 ? (passedTests / allTests.length) * 100 : 0;
  report.overallPasses = report.overallScore >= 80;
  
  return report;
};

/**
 * Console log a formatted mobile responsiveness report
 * @param {Object} report - The report object from generateMobileResponsivenessReport
 */
export const logMobileResponsivenessReport = (report) => {
  console.group('📱 Mobile-First Responsive Design Test Report');
  console.log(`🕒 Timestamp: ${report.timestamp}`);
  console.log(`📏 Screen Width: ${report.screenWidth}px`);
  console.log(`📱 Breakpoint: ${report.breakpoint}`);
  console.log(`📊 Overall Score: ${report.overallScore.toFixed(1)}%`);
  console.log(`✅ Overall Status: ${report.overallPasses ? 'PASS' : 'FAIL'}`);
  
  if (report.tests.forms) {
    console.group('📝 Form Tests');
    report.tests.forms.forEach((formTest, index) => {
      console.log(`Form ${index + 1}: ${formTest.passRate.toFixed(1)}% pass rate (${formTest.passedElements}/${formTest.totalElements})`);
    });
    console.groupEnd();
  }
  
  if (report.tests.buttons) {
    console.group('🔘 Button Tests');
    const buttonPassRate = (report.tests.buttons.filter(b => b.passes).length / report.tests.buttons.length) * 100;
    console.log(`Button Responsiveness: ${buttonPassRate.toFixed(1)}% pass rate`);
    console.groupEnd();
  }
  
  if (report.tests.grids) {
    console.group('🔲 Grid Tests');
    const gridPassRate = (report.tests.grids.filter(g => g.passes).length / report.tests.grids.length) * 100;
    console.log(`Grid Responsiveness: ${gridPassRate.toFixed(1)}% pass rate`);
    console.groupEnd();
  }
  
  console.groupEnd();
};

// Export all utilities
export default {
  TOUCH_TARGETS,
  BREAKPOINTS,
  testTouchAccessibility,
  testResponsiveForm,
  testResponsiveGrid,
  getCurrentBreakpoint,
  testButtonResponsiveness,
  generateMobileResponsivenessReport,
  logMobileResponsivenessReport
};