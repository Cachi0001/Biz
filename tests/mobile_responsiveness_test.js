/**
 * Mobile Responsiveness Testing Suite for SabiOps
 * Tests mobile-first design and touch interactions
 */

class MobileResponsivenessTest {
    constructor() {
        this.testResults = [];
        this.viewports = {
            mobile: { width: 375, height: 667, name: 'iPhone SE' },
            mobileLarge: { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
            tablet: { width: 768, height: 1024, name: 'iPad' },
            desktop: { width: 1920, height: 1080, name: 'Desktop' }
        };
    }

    logTest(testName, success, message = '', viewport = '') {
        const result = {
            test: testName,
            success,
            message,
            viewport,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName} (${viewport}) - ${message}`);
    }

    async setViewport(viewport) {
        if (typeof window !== 'undefined') {
            // Browser environment - simulate viewport
            document.documentElement.style.width = `${viewport.width}px`;
            document.documentElement.style.height = `${viewport.height}px`;
            
            // Trigger resize event
            window.dispatchEvent(new Event('resize'));
            
            // Wait for layout to settle
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    testCardLayout(viewport) {
        const cards = document.querySelectorAll('.grid');
        let passed = true;
        let message = '';

        cards.forEach(cardContainer => {
            const computedStyle = window.getComputedStyle(cardContainer);
            const gridCols = computedStyle.getPropertyValue('grid-template-columns');
            
            if (viewport.width < 768) {
                // Mobile: Should be 2 columns
                if (!gridCols.includes('repeat(2') && !gridCols.split(' ').length === 2) {
                    passed = false;
                    message = 'Mobile layout should show 2 cards per row';
                }
            } else if (viewport.width >= 1024) {
                // Desktop: Should use table or more columns
                const tableView = document.querySelector('.hidden.md\\:block');
                if (!tableView) {
                    passed = false;
                    message = 'Desktop should show table view';
                }
            }
        });

        this.logTest('Card Layout Responsiveness', passed, message, viewport.name);
        return passed;
    }

    testTouchInteractions(viewport) {
        if (viewport.width >= 768) {
            this.logTest('Touch Interactions', true, 'Desktop - touch not required', viewport.name);
            return true;
        }

        const buttons = document.querySelectorAll('button');
        let passed = true;
        let message = '';

        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            const minTouchSize = 44; // iOS/Android minimum touch target

            if (rect.width < minTouchSize || rect.height < minTouchSize) {
                passed = false;
                message = `Button too small for touch: ${rect.width}x${rect.height}px (min: ${minTouchSize}px)`;
            }
        });

        this.logTest('Touch Target Sizes', passed, message, viewport.name);
        return passed;
    }

    testNavigationResponsiveness(viewport) {
        const mobileNav = document.querySelector('.md\\:hidden');
        const desktopNav = document.querySelector('.hidden.md\\:block');
        
        let passed = true;
        let message = '';

        if (viewport.width < 768) {
            // Mobile: Should show mobile navigation
            if (!mobileNav || window.getComputedStyle(mobileNav).display === 'none') {
                passed = false;
                message = 'Mobile navigation not visible on mobile viewport';
            }
            
            if (desktopNav && window.getComputedStyle(desktopNav).display !== 'none') {
                passed = false;
                message = 'Desktop navigation visible on mobile viewport';
            }
        } else {
            // Desktop: Should show desktop navigation
            if (!desktopNav || window.getComputedStyle(desktopNav).display === 'none') {
                passed = false;
                message = 'Desktop navigation not visible on desktop viewport';
            }
        }

        this.logTest('Navigation Responsiveness', passed, message, viewport.name);
        return passed;
    }

    testFormResponsiveness(viewport) {
        const forms = document.querySelectorAll('form');
        let passed = true;
        let message = '';

        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                const rect = input.getBoundingClientRect();
                
                if (viewport.width < 768) {
                    // Mobile: Inputs should be full width or nearly full width
                    const parentWidth = input.parentElement.getBoundingClientRect().width;
                    const widthRatio = rect.width / parentWidth;
                    
                    if (widthRatio < 0.9) {
                        passed = false;
                        message = `Input too narrow on mobile: ${(widthRatio * 100).toFixed(1)}% of parent width`;
                    }
                    
                    // Check minimum height for touch
                    if (rect.height < 44) {
                        passed = false;
                        message = `Input too short for touch: ${rect.height}px (min: 44px)`;
                    }
                }
            });
        });

        this.logTest('Form Responsiveness', passed, message, viewport.name);
        return passed;
    }

    testModalResponsiveness(viewport) {
        // Simulate opening a modal
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        let passed = true;
        let message = '';

        modals.forEach(modal => {
            const rect = modal.getBoundingClientRect();
            
            if (viewport.width < 768) {
                // Mobile: Modal should be full width or nearly full width
                const viewportWidth = viewport.width;
                const widthRatio = rect.width / viewportWidth;
                
                if (widthRatio < 0.9) {
                    passed = false;
                    message = `Modal too narrow on mobile: ${rect.width}px (${(widthRatio * 100).toFixed(1)}% of viewport)`;
                }
                
                // Check if modal is scrollable when content overflows
                if (rect.height > viewport.height) {
                    const isScrollable = window.getComputedStyle(modal).overflowY === 'auto' || 
                                       window.getComputedStyle(modal).overflowY === 'scroll';
                    if (!isScrollable) {
                        passed = false;
                        message = 'Modal content overflows without scrolling on mobile';
                    }
                }
            }
        });

        this.logTest('Modal Responsiveness', passed, message || 'Modals properly responsive', viewport.name);
        return passed;
    }

    testTextReadability(viewport) {
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        let passed = true;
        let message = '';

        textElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const fontSize = parseFloat(computedStyle.fontSize);
            
            if (viewport.width < 768) {
                // Mobile: Minimum font size should be 16px for readability
                if (fontSize < 14) {
                    passed = false;
                    message = `Text too small on mobile: ${fontSize}px (min: 14px)`;
                }
            }
        });

        this.logTest('Text Readability', passed, message || 'Text sizes appropriate', viewport.name);
        return passed;
    }

    testNigerianCurrencyDisplay(viewport) {
        // Look for currency displays
        const currencyElements = document.querySelectorAll('[data-currency], .currency');
        const textWithNaira = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes('₦')
        );
        
        let passed = true;
        let message = '';

        [...currencyElements, ...textWithNaira].forEach(element => {
            const text = element.textContent;
            
            // Check if Naira symbol is properly displayed
            if (text.includes('₦')) {
                // Check formatting: ₦1,000.00 or ₦1,000
                const nairaRegex = /₦[\d,]+(?:\.\d{2})?/;
                if (!nairaRegex.test(text)) {
                    passed = false;
                    message = `Improper Naira formatting: ${text}`;
                }
            }
        });

        this.logTest('Nigerian Currency Display', passed, message || 'Currency properly formatted', viewport.name);
        return passed;
    }

    async testViewport(viewport) {
        console.log(`\n🧪 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        await this.setViewport(viewport);
        
        const tests = [
            () => this.testCardLayout(viewport),
            () => this.testTouchInteractions(viewport),
            () => this.testNavigationResponsiveness(viewport),
            () => this.testFormResponsiveness(viewport),
            () => this.testModalResponsiveness(viewport),
            () => this.testTextReadability(viewport),
            () => this.testNigerianCurrencyDisplay(viewport)
        ];

        const results = tests.map(test => test());
        return results.every(result => result);
    }

    async runAllTests() {
        console.log('🚀 Starting Mobile Responsiveness Testing...');
        console.log('=' * 60);

        const startTime = Date.now();
        let allPassed = true;

        // Test each viewport
        for (const [key, viewport] of Object.entries(this.viewports)) {
            const viewportPassed = await this.testViewport(viewport);
            allPassed = allPassed && viewportPassed;
        }

        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;

        console.log(`\n⏱️  Total test time: ${totalTime.toFixed(2)} seconds`);

        return this.generateReport(allPassed);
    }

    generateReport(allPassed) {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100) : 0;

        const report = {
            summary: {
                total_tests: totalTests,
                passed: passedTests,
                failed: failedTests,
                success_rate: `${successRate.toFixed(1)}%`,
                timestamp: new Date().toISOString()
            },
            results: this.testResults,
            recommendations: []
        };

        // Add recommendations
        const failedByViewport = {};
        this.testResults.filter(r => !r.success).forEach(result => {
            const viewport = result.viewport || 'Unknown';
            failedByViewport[viewport] = (failedByViewport[viewport] || 0) + 1;
        });

        if (Object.keys(failedByViewport).length > 0) {
            report.recommendations.push(`Issues detected on: ${Object.keys(failedByViewport).join(', ')}`);
        }

        if (successRate < 80) {
            report.recommendations.push('Critical mobile responsiveness issues - immediate attention required');
        } else if (successRate < 95) {
            report.recommendations.push('Minor mobile responsiveness issues - review and fix');
        } else {
            report.recommendations.push('Excellent mobile responsiveness - ready for mobile users');
        }

        console.log('\n' + '='.repeat(60));
        console.log('📱 MOBILE RESPONSIVENESS TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${successRate.toFixed(1)}%`);

        if (report.recommendations.length > 0) {
            console.log('\n📋 Recommendations:');
            report.recommendations.forEach(rec => console.log(`  • ${rec}`));
        }

        return report;
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileResponsivenessTest;
}

// Auto-run if in browser environment
if (typeof window !== 'undefined' && document.readyState === 'complete') {
    const tester = new MobileResponsivenessTest();
    tester.runAllTests().then(report => {
        console.log('📄 Mobile responsiveness test completed');
        
        // Save report if possible
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('mobile_test_report', JSON.stringify(report));
        }
    });
} else if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
        const tester = new MobileResponsivenessTest();
        tester.runAllTests().then(report => {
            console.log('📄 Mobile responsiveness test completed');
            
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('mobile_test_report', JSON.stringify(report));
            }
        });
    });
}