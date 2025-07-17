/**
 * Error Handling and Edge Cases Testing for SabiOps
 * Tests error scenarios, network issues, and edge cases
 */

class ErrorHandlingTest {
    constructor() {
        this.testResults = [];
        this.originalFetch = window.fetch;
        this.originalNavigator = window.navigator;
    }

    logTest(testName, success, message = '') {
        const result = {
            test: testName,
            success,
            message,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}: ${message}`);
    }

    // Mock network conditions
    mockNetworkFailure() {
        window.fetch = () => Promise.reject(new Error('Network Error'));
    }

    mockSlowNetwork() {
        window.fetch = (...args) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(this.originalFetch(...args));
                }, 5000); // 5 second delay
            });
        };
    }

    mockOfflineMode() {
        Object.defineProperty(window.navigator, 'onLine', {
            writable: true,
            value: false
        });
        window.dispatchEvent(new Event('offline'));
    }

    restoreNetwork() {
        window.fetch = this.originalFetch;
        Object.defineProperty(window.navigator, 'onLine', {
            writable: true,
            value: true
        });
        window.dispatchEvent(new Event('online'));
    }

    async testNetworkErrorHandling() {
        console.log('\n🧪 Testing Network Error Handling...');
        
        try {
            // Mock network failure
            this.mockNetworkFailure();
            
            // Try to trigger an API call (simulate button click)
            const apiButtons = document.querySelectorAll('[data-testid*="api"], button[onclick*="fetch"]');
            
            if (apiButtons.length > 0) {
                // Click first API button
                apiButtons[0].click();
                
                // Wait for error handling
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if error message is displayed
                const errorMessages = document.querySelectorAll('.error, [data-testid*="error"], .toast-error');
                const hasErrorMessage = errorMessages.length > 0;
                
                this.logTest('Network Error Display', hasErrorMessage, 
                    hasErrorMessage ? 'Error message shown to user' : 'No error message displayed');
                
                // Check if error message is user-friendly
                if (hasErrorMessage) {
                    const errorText = Array.from(errorMessages).map(el => el.textContent).join(' ');
                    const isUserFriendly = !errorText.includes('500') && 
                                         !errorText.includes('undefined') && 
                                         !errorText.includes('null') &&
                                         errorText.length > 10;
                    
                    this.logTest('User-Friendly Error Message', isUserFriendly, 
                        isUserFriendly ? 'Error message is user-friendly' : 'Error message is too technical');
                }
            } else {
                this.logTest('Network Error Test', false, 'No API buttons found to test');
            }
            
        } catch (error) {
            this.logTest('Network Error Test', false, `Test error: ${error.message}`);
        } finally {
            this.restoreNetwork();
        }
    }

    async testOfflineHandling() {
        console.log('\n🧪 Testing Offline Handling...');
        
        try {
            // Mock offline mode
            this.mockOfflineMode();
            
            // Wait for offline detection
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if offline indicator is shown
            const offlineIndicators = document.querySelectorAll('.offline, [data-testid*="offline"]');
            const hasOfflineIndicator = offlineIndicators.length > 0;
            
            this.logTest('Offline Indicator', hasOfflineIndicator, 
                hasOfflineIndicator ? 'Offline indicator displayed' : 'No offline indicator found');
            
            // Check if forms are disabled or show offline message
            const forms = document.querySelectorAll('form');
            let offlineFormsHandled = 0;
            
            forms.forEach(form => {
                const isDisabled = form.hasAttribute('disabled') || 
                                 form.style.pointerEvents === 'none' ||
                                 form.querySelector('.offline-message');
                if (isDisabled) offlineFormsHandled++;
            });
            
            const formsHandledProperly = forms.length === 0 || offlineFormsHandled > 0;
            this.logTest('Offline Form Handling', formsHandledProperly, 
                `${offlineFormsHandled}/${forms.length} forms handle offline state`);
            
        } catch (error) {
            this.logTest('Offline Handling Test', false, `Test error: ${error.message}`);
        } finally {
            this.restoreNetwork();
        }
    }

    async testFormValidationErrors() {
        console.log('\n🧪 Testing Form Validation Errors...');
        
        const forms = document.querySelectorAll('form');
        
        for (let i = 0; i < forms.length; i++) {
            const form = forms[i];
            const requiredInputs = form.querySelectorAll('input[required], textarea[required], select[required]');
            
            if (requiredInputs.length > 0) {
                // Try to submit form with empty required fields
                const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
                
                if (submitButton) {
                    // Clear required fields
                    requiredInputs.forEach(input => {
                        input.value = '';
                    });
                    
                    // Try to submit
                    submitButton.click();
                    
                    // Wait for validation
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Check if validation errors are shown
                    const validationErrors = form.querySelectorAll('.error, .invalid, [aria-invalid="true"]');
                    const hasValidationErrors = validationErrors.length > 0 || 
                                              requiredInputs[0].validity && !requiredInputs[0].validity.valid;
                    
                    this.logTest(`Form ${i + 1} Validation`, hasValidationErrors, 
                        hasValidationErrors ? 'Validation errors displayed' : 'No validation feedback');
                }
            }
        }
    }

    testInvalidDataHandling() {
        console.log('\n🧪 Testing Invalid Data Handling...');
        
        // Test number inputs with invalid values
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach((input, index) => {
            // Set invalid value
            input.value = 'invalid-number';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Check if error is shown
            const hasError = input.classList.contains('error') || 
                           input.getAttribute('aria-invalid') === 'true' ||
                           input.parentElement.querySelector('.error');
            
            this.logTest(`Number Input ${index + 1} Validation`, hasError, 
                hasError ? 'Invalid number rejected' : 'Invalid number not caught');
        });
        
        // Test email inputs with invalid values
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach((input, index) => {
            input.value = 'invalid-email';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            const hasError = input.classList.contains('error') || 
                           input.getAttribute('aria-invalid') === 'true' ||
                           input.parentElement.querySelector('.error');
            
            this.logTest(`Email Input ${index + 1} Validation`, hasError, 
                hasError ? 'Invalid email rejected' : 'Invalid email not caught');
        });
    }

    testLoadingStates() {
        console.log('\n🧪 Testing Loading States...');
        
        // Check if loading states exist
        const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
        const skeletonElements = document.querySelectorAll('[data-testid*="skeleton"], .skeleton');
        
        const hasLoadingStates = loadingElements.length > 0 || skeletonElements.length > 0;
        this.logTest('Loading States Present', hasLoadingStates, 
            hasLoadingStates ? 'Loading states implemented' : 'No loading states found');
        
        // Test if buttons are disabled during loading
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        let buttonsWithLoadingState = 0;
        
        submitButtons.forEach(button => {
            // Check if button has loading state handling
            const hasLoadingState = button.hasAttribute('disabled') || 
                                   button.textContent.includes('Loading') ||
                                   button.textContent.includes('Saving') ||
                                   button.querySelector('.spinner');
            
            if (hasLoadingState) buttonsWithLoadingState++;
        });
        
        const loadingButtonsRatio = submitButtons.length > 0 ? buttonsWithLoadingState / submitButtons.length : 1;
        this.logTest('Button Loading States', loadingButtonsRatio >= 0.5, 
            `${buttonsWithLoadingState}/${submitButtons.length} buttons have loading states`);
    }

    testErrorRecovery() {
        console.log('\n🧪 Testing Error Recovery...');
        
        // Check for retry buttons
        const retryButtons = document.querySelectorAll('[data-testid*="retry"], button[onclick*="retry"], .retry');
        const hasRetryMechanism = retryButtons.length > 0;
        
        this.logTest('Retry Mechanism', hasRetryMechanism, 
            hasRetryMechanism ? 'Retry buttons available' : 'No retry mechanism found');
        
        // Check for refresh/reload options
        const refreshButtons = document.querySelectorAll('[data-testid*="refresh"], button[onclick*="refresh"], .refresh');
        const hasRefreshMechanism = refreshButtons.length > 0;
        
        this.logTest('Refresh Mechanism', hasRefreshMechanism, 
            hasRefreshMechanism ? 'Refresh options available' : 'No refresh mechanism found');
    }

    testDataConsistency() {
        console.log('\n🧪 Testing Data Consistency...');
        
        // Check for data validation in forms
        const forms = document.querySelectorAll('form');
        let formsWithValidation = 0;
        
        forms.forEach(form => {
            const hasValidation = form.querySelector('[required]') || 
                                form.querySelector('[pattern]') ||
                                form.querySelector('[min]') ||
                                form.querySelector('[max]') ||
                                form.hasAttribute('novalidate') === false;
            
            if (hasValidation) formsWithValidation++;
        });
        
        const validationRatio = forms.length > 0 ? formsWithValidation / forms.length : 1;
        this.logTest('Form Data Validation', validationRatio >= 0.8, 
            `${formsWithValidation}/${forms.length} forms have validation`);
        
        // Check for consistent data display
        const priceElements = document.querySelectorAll('[data-testid*="price"], .price, .amount');
        let consistentPriceFormat = 0;
        
        priceElements.forEach(element => {
            const text = element.textContent;
            const hasNairaSymbol = text.includes('₦');
            const hasProperFormat = /₦[\d,]+(\.\d{2})?/.test(text);
            
            if (hasNairaSymbol && hasProperFormat) consistentPriceFormat++;
        });
        
        const priceFormatRatio = priceElements.length > 0 ? consistentPriceFormat / priceElements.length : 1;
        this.logTest('Consistent Price Format', priceFormatRatio >= 0.9, 
            `${consistentPriceFormat}/${priceElements.length} prices properly formatted`);
    }

    async runAllTests() {
        console.log('🚀 Starting Error Handling and Edge Cases Testing...');
        console.log('='.repeat(60));
        
        const startTime = Date.now();
        
        // Run all error handling tests
        await this.testNetworkErrorHandling();
        await this.testOfflineHandling();
        await this.testFormValidationErrors();
        this.testInvalidDataHandling();
        this.testLoadingStates();
        this.testErrorRecovery();
        this.testDataConsistency();
        
        const totalTime = (Date.now() - startTime) / 1000;
        this.generateSummary(totalTime);
    }

    generateSummary(totalTime) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 ERROR HANDLING TEST SUMMARY');
        console.log('='.repeat(60));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
        console.log(`Total Time: ${totalTime.toFixed(2)}s`);
        
        // Show critical failures
        const criticalFailures = this.testResults.filter(r => 
            !r.success && (
                r.test.includes('Network Error') ||
                r.test.includes('Offline') ||
                r.test.includes('Validation')
            )
        );
        
        if (criticalFailures.length > 0) {
            console.log('\n🚨 CRITICAL ERROR HANDLING ISSUES:');
            criticalFailures.forEach(failure => {
                console.log(`  - ${failure.test}: ${failure.message}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        const networkTests = this.testResults.filter(r => r.test.includes('Network'));
        const networkPassed = networkTests.filter(r => r.success).length;
        
        if (networkPassed < networkTests.length) {
            console.log('  - Improve network error handling and user feedback');
        }
        
        const validationTests = this.testResults.filter(r => r.test.includes('Validation'));
        const validationPassed = validationTests.filter(r => r.success).length;
        
        if (validationPassed < validationTests.length) {
            console.log('  - Add comprehensive form validation');
        }
        
        const loadingTests = this.testResults.filter(r => r.test.includes('Loading'));
        const loadingPassed = loadingTests.filter(r => r.success).length;
        
        if (loadingPassed < loadingTests.length) {
            console.log('  - Implement loading states for better UX');
        }
        
        // Save results
        const results = {
            summary: {
                total_tests: totalTests,
                passed: passedTests,
                failed: failedTests,
                success_rate: (passedTests/totalTests)*100,
                total_time: totalTime,
                timestamp: new Date().toISOString()
            },
            critical_failures: criticalFailures,
            all_results: this.testResults
        };
        
        // Save to file if in Node.js environment
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            fs.writeFileSync('Biz/tests/error_handling_results.json', JSON.stringify(results, null, 2));
            console.log('\n📄 Detailed results saved to: error_handling_results.json');
        }
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandlingTest;
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const tester = new ErrorHandlingTest();
            tester.runAllTests();
        });
    } else {
        const tester = new ErrorHandlingTest();
        tester.runAllTests();
    }
}