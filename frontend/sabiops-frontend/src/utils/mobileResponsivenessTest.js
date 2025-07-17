// Mobile Responsiveness Test Suite for SabiOps
// This file contains tests and validation for mobile responsiveness improvements

import { mobileUtils, breakpoints } from './mobileUtils';

/**
 * Test suite for mobile responsiveness
 */
export const mobileResponsivenessTests = {
    /**
     * Test touch-friendly button sizes
     */
    testTouchFriendlyButtons: () => {
        const results = [];

        // Check if buttons meet minimum touch target size (44px x 44px)
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
            const rect = button.getBoundingClientRect();
            const isTouchFriendly = rect.width >= 44 && rect.height >= 44;

            if (!isTouchFriendly && button.offsetParent !== null) { // Only check visible buttons
                results.push({
                    element: button,
                    index,
                    width: rect.width,
                    height: rect.height,
                    issue: 'Button too small for touch interaction'
                });
            }
        });

        return {
            passed: results.length === 0,
            issues: results,
            message: results.length === 0
                ? 'All buttons are touch-friendly'
                : `${results.length} buttons are too small for touch interaction`
        };
    },

    /**
     * Test input field accessibility on mobile
     */
    testMobileInputs: () => {
        const results = [];

        // Check if inputs have appropriate height and font size
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach((input, index) => {
            const rect = input.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(input);
            const fontSize = parseFloat(computedStyle.fontSize);

            // Minimum height should be 44px, font size should be at least 16px on mobile
            const minHeight = breakpoints.isMobile() ? 44 : 36;
            const minFontSize = breakpoints.isMobile() ? 16 : 14;

            if (rect.height < minHeight || fontSize < minFontSize) {
                results.push({
                    element: input,
                    index,
                    height: rect.height,
                    fontSize,
                    issue: `Input field not optimized for mobile (height: ${rect.height}px, fontSize: ${fontSize}px)`
                });
            }
        });

        return {
            passed: results.length === 0,
            issues: results,
            message: results.length === 0
                ? 'All input fields are mobile-optimized'
                : `${results.length} input fields need mobile optimization`
        };
    },

    /**
     * Test modal/dialog responsiveness
     */
    testModalResponsiveness: () => {
        const results = [];

        // Check if modals are properly sized for mobile
        const modals = document.querySelectorAll('[role="dialog"], .dialog-content');
        modals.forEach((modal, index) => {
            const rect = modal.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (breakpoints.isMobile()) {
                // On mobile, modals should not exceed 95% of viewport
                const maxWidth = viewportWidth * 0.95;
                const maxHeight = viewportHeight * 0.90;

                if (rect.width > maxWidth || rect.height > maxHeight) {
                    results.push({
                        element: modal,
                        index,
                        width: rect.width,
                        height: rect.height,
                        maxWidth,
                        maxHeight,
                        issue: 'Modal too large for mobile viewport'
                    });
                }
            }
        });

        return {
            passed: results.length === 0,
            issues: results,
            message: results.length === 0
                ? 'All modals are mobile-responsive'
                : `${results.length} modals need mobile optimization`
        };
    },

    /**
     * Test card layout responsiveness
     */
    testCardLayouts: () => {
        const results = [];

        // Check if cards are properly arranged on mobile (2 per row)
        const cardContainers = document.querySelectorAll('.grid');
        cardContainers.forEach((container, index) => {
            const computedStyle = window.getComputedStyle(container);
            const gridTemplateColumns = computedStyle.gridTemplateColumns;

            if (breakpoints.isMobile() && gridTemplateColumns.split(' ').length > 2) {
                results.push({
                    element: container,
                    index,
                    columns: gridTemplateColumns.split(' ').length,
                    issue: 'Too many columns for mobile view'
                });
            }
        });

        return {
            passed: results.length === 0,
            issues: results,
            message: results.length === 0
                ? 'All card layouts are mobile-responsive'
                : `${results.length} card layouts need mobile optimization`
        };
    },

    /**
     * Test navigation accessibility
     */
    testMobileNavigation: () => {
        const results = [];

        // Check if mobile navigation is present and properly sized
        const mobileNav = document.querySelector('.fixed.bottom-0');
        if (mobileNav) {
            const navButtons = mobileNav.querySelectorAll('button');
            navButtons.forEach((button, index) => {
                const rect = button.getBoundingClientRect();

                // Navigation buttons should be at least 48px tall
                if (rect.height < 48) {
                    results.push({
                        element: button,
                        index,
                        height: rect.height,
                        issue: 'Navigation button too small for touch'
                    });
                }
            });
        } else if (breakpoints.isMobile()) {
            results.push({
                issue: 'Mobile navigation not found'
            });
        }

        return {
            passed: results.length === 0,
            issues: results,
            message: results.length === 0
                ? 'Mobile navigation is properly implemented'
                : `${results.length} navigation issues found`
        };
    },

    /**
     * Run all mobile responsiveness tests
     */
    runAllTests: () => {
        const testResults = {
            touchFriendlyButtons: mobileResponsivenessTests.testTouchFriendlyButtons(),
            mobileInputs: mobileResponsivenessTests.testMobileInputs(),
            modalResponsiveness: mobileResponsivenessTests.testModalResponsiveness(),
            cardLayouts: mobileResponsivenessTests.testCardLayouts(),
            mobileNavigation: mobileResponsivenessTests.testMobileNavigation()
        };

        const allPassed = Object.values(testResults).every(result => result.passed);
        const totalIssues = Object.values(testResults).reduce((sum, result) => sum + result.issues.length, 0);

        return {
            passed: allPassed,
            totalIssues,
            results: testResults,
            summary: allPassed
                ? 'All mobile responsiveness tests passed!'
                : `${totalIssues} mobile responsiveness issues found`
        };
    }
};

/**
 * Mobile responsiveness checklist
 */
export const mobileResponsivenessChecklist = {
    // Touch-friendly interactions
    touchTargets: {
        description: 'All interactive elements are at least 44x44px',
        items: [
            'Buttons have minimum 44px height',
            'Touch targets have adequate spacing',
            'Action buttons in cards are touch-friendly',
            'Navigation buttons are properly sized'
        ]
    },

    // Form optimization
    forms: {
        description: 'Forms are optimized for mobile input',
        items: [
            'Input fields have minimum 44px height',
            'Font size is at least 16px on mobile',
            'Labels are clearly visible',
            'Form layouts stack vertically on mobile',
            'Keyboard types are appropriate for input fields'
        ]
    },

    // Layout responsiveness
    layouts: {
        description: 'Layouts adapt properly to mobile screens',
        items: [
            'Cards display 2 per row on mobile',
            'Tables switch to card view on mobile',
            'Navigation is mobile-optimized',
            'Spacing is appropriate for mobile',
            'Content fits within viewport'
        ]
    },

    // Modal and dialog optimization
    modals: {
        description: 'Modals and dialogs work well on mobile',
        items: [
            'Modals are properly sized for mobile',
            'Content is scrollable when needed',
            'Close buttons are accessible',
            'Modals don\'t exceed viewport bounds'
        ]
    },

    // Performance and usability
    performance: {
        description: 'Mobile performance and usability',
        items: [
            'Touch interactions provide feedback',
            'Scrolling is smooth',
            'Loading states are visible',
            'Error messages are clear',
            'Content loads quickly'
        ]
    }
};

/**
 * Generate mobile responsiveness report
 */
export const generateMobileReport = () => {
    const testResults = mobileResponsivenessTests.runAllTests();
    const viewport = mobileUtils.getViewportSize();
    const isMobile = breakpoints.isMobile();
    const isTouch = mobileUtils.isTouchDevice();

    return {
        timestamp: new Date().toISOString(),
        viewport,
        isMobile,
        isTouch,
        testResults,
        checklist: mobileResponsivenessChecklist,
        recommendations: generateRecommendations(testResults)
    };
};

/**
 * Generate recommendations based on test results
 */
const generateRecommendations = (testResults) => {
    const recommendations = [];

    if (!testResults.results.touchFriendlyButtons.passed) {
        recommendations.push({
            priority: 'high',
            category: 'Touch Targets',
            issue: 'Some buttons are too small for touch interaction',
            solution: 'Increase button height to at least 44px and add touch-manipulation CSS class'
        });
    }

    if (!testResults.results.mobileInputs.passed) {
        recommendations.push({
            priority: 'high',
            category: 'Form Inputs',
            issue: 'Input fields are not optimized for mobile',
            solution: 'Set minimum height to 44px and font-size to 16px on mobile devices'
        });
    }

    if (!testResults.results.modalResponsiveness.passed) {
        recommendations.push({
            priority: 'medium',
            category: 'Modals',
            issue: 'Modals are not properly sized for mobile',
            solution: 'Use mobile-optimized modal classes with proper viewport sizing'
        });
    }

    if (!testResults.results.cardLayouts.passed) {
        recommendations.push({
            priority: 'medium',
            category: 'Layout',
            issue: 'Card layouts have too many columns on mobile',
            solution: 'Limit to 2 columns on mobile using responsive grid classes'
        });
    }

    if (!testResults.results.mobileNavigation.passed) {
        recommendations.push({
            priority: 'high',
            category: 'Navigation',
            issue: 'Mobile navigation needs improvement',
            solution: 'Implement proper mobile navigation with touch-friendly buttons'
        });
    }

    return recommendations;
};

/**
 * Console helper for testing mobile responsiveness
 */
export const testMobileResponsiveness = () => {
    console.group('🔍 Mobile Responsiveness Test Results');

    const report = generateMobileReport();

    console.log('📱 Device Info:', {
        viewport: report.viewport,
        isMobile: report.isMobile,
        isTouch: report.isTouch
    });

    console.log('✅ Test Results:', report.testResults.summary);

    if (report.testResults.totalIssues > 0) {
        console.warn('⚠️ Issues Found:', report.testResults.totalIssues);
        console.table(report.recommendations);
    }

    console.groupEnd();

    return report;
};

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
    // Run tests after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(testMobileResponsiveness, 1000);
        });
    } else {
        setTimeout(testMobileResponsiveness, 1000);
    }
}

export default {
    mobileResponsivenessTests,
    mobileResponsivenessChecklist,
    generateMobileReport,
    testMobileResponsiveness
};