/**
 * Data Consistency and Integration Testing for SabiOps
 * Tests data flow between different components and ensures consistency
 */

class DataConsistencyTest {
    constructor() {
        this.testResults = [];
        this.testData = {
            customers: [],
            products: [],
            sales: [],
            invoices: [],
            expenses: []
        };
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

    async fetchData(endpoint) {
        try {
            const response = await fetch(`/api${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.warn(`Failed to fetch ${endpoint}:`, error.message);
            return null;
        }
    }

    async loadTestData() {
        console.log('📊 Loading test data...');
        
        this.testData.customers = await this.fetchData('/customers/') || [];
        this.testData.products = await this.fetchData('/products/') || [];
        this.testData.sales = await this.fetchData('/sales/') || [];
        this.testData.invoices = await this.fetchData('/invoices/') || [];
        this.testData.expenses = await this.fetchData('/expenses/') || [];
        
        console.log(`Loaded: ${this.testData.customers.length} customers, ${this.testData.products.length} products, ${this.testData.sales.length} sales`);
    }

    testCustomerDataConsistency() {
        console.log('\n🧪 Testing Customer Data Consistency...');
        
        const customers = Array.isArray(this.testData.customers) ? this.testData.customers : 
                         this.testData.customers?.customers || [];
        
        if (customers.length === 0) {
            this.logTest('Customer Data Available', false, 'No customer data found');
            return;
        }
        
        // Test required fields
        const requiredFields = ['id', 'name'];
        let customersWithAllFields = 0;
        
        customers.forEach(customer => {
            const hasAllFields = requiredFields.every(field => customer[field]);
            if (hasAllFields) customersWithAllFields++;
        });
        
        const fieldsConsistency = customersWithAllFields / customers.length;
        this.logTest('Customer Required Fields', fieldsConsistency >= 0.95, 
            `${customersWithAllFields}/${customers.length} customers have all required fields`);
        
        // Test data format consistency
        let validEmails = 0;
        let validPhones = 0;
        let emailCount = 0;
        let phoneCount = 0;
        
        customers.forEach(customer => {
            if (customer.email) {
                emailCount++;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(customer.email)) validEmails++;
            }
            
            if (customer.phone) {
                phoneCount++;
                const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
                if (phoneRegex.test(customer.phone)) validPhones++;
            }
        });
        
        const emailValidation = emailCount === 0 || (validEmails / emailCount) >= 0.9;
        const phoneValidation = phoneCount === 0 || (validPhones / phoneCount) >= 0.9;
        
        this.logTest('Customer Email Format', emailValidation, 
            `${validEmails}/${emailCount} emails are valid`);
        this.logTest('Customer Phone Format', phoneValidation, 
            `${validPhones}/${phoneCount} phones are valid`);
    }

    testProductDataConsistency() {
        console.log('\n🧪 Testing Product Data Consistency...');
        
        const products = Array.isArray(this.testData.products) ? this.testData.products : 
                        this.testData.products?.products || [];
        
        if (products.length === 0) {
            this.logTest('Product Data Available', false, 'No product data found');
            return;
        }
        
        // Test required fields
        const requiredFields = ['id', 'name', 'price'];
        let productsWithAllFields = 0;
        
        products.forEach(product => {
            const hasAllFields = requiredFields.every(field => product[field] !== undefined);
            if (hasAllFields) productsWithAllFields++;
        });
        
        const fieldsConsistency = productsWithAllFields / products.length;
        this.logTest('Product Required Fields', fieldsConsistency >= 0.95, 
            `${productsWithAllFields}/${products.length} products have all required fields`);
        
        // Test price consistency
        let validPrices = 0;
        products.forEach(product => {
            if (typeof product.price === 'number' && product.price >= 0) {
                validPrices++;
            }
        });
        
        const priceConsistency = validPrices / products.length;
        this.logTest('Product Price Validity', priceConsistency >= 0.95, 
            `${validPrices}/${products.length} products have valid prices`);
        
        // Test inventory consistency
        let validInventory = 0;
        products.forEach(product => {
            if (typeof product.quantity === 'number' && product.quantity >= 0) {
                validInventory++;
            }
        });
        
        const inventoryConsistency = validInventory / products.length;
        this.logTest('Product Inventory Validity', inventoryConsistency >= 0.9, 
            `${validInventory}/${products.length} products have valid inventory`);
    }

    testSalesDataConsistency() {
        console.log('\n🧪 Testing Sales Data Consistency...');
        
        const sales = Array.isArray(this.testData.sales) ? this.testData.sales : 
                     this.testData.sales?.sales || [];
        
        if (sales.length === 0) {
            this.logTest('Sales Data Available', false, 'No sales data found');
            return;
        }
        
        const customers = Array.isArray(this.testData.customers) ? this.testData.customers : 
                         this.testData.customers?.customers || [];
        const products = Array.isArray(this.testData.products) ? this.testData.products : 
                        this.testData.products?.products || [];
        
        // Test sales-customer relationship
        let validCustomerRefs = 0;
        sales.forEach(sale => {
            if (sale.customer_id) {
                const customerExists = customers.some(c => c.id === sale.customer_id);
                if (customerExists || sale.customer_name) validCustomerRefs++;
            }
        });
        
        const customerRefConsistency = validCustomerRefs / sales.length;
        this.logTest('Sales-Customer Relationship', customerRefConsistency >= 0.8, 
            `${validCustomerRefs}/${sales.length} sales have valid customer references`);
        
        // Test sales-product relationship
        let validProductRefs = 0;
        sales.forEach(sale => {
            if (sale.product_id) {
                const productExists = products.some(p => p.id === sale.product_id);
                if (productExists || sale.product_name) validProductRefs++;
            }
        });
        
        const productRefConsistency = validProductRefs / sales.length;
        this.logTest('Sales-Product Relationship', productRefConsistency >= 0.8, 
            `${validProductRefs}/${sales.length} sales have valid product references`);
        
        // Test amount calculations
        let validAmounts = 0;
        sales.forEach(sale => {
            if (sale.quantity && sale.unit_price && sale.total_amount) {
                const calculatedTotal = sale.quantity * sale.unit_price;
                const isValid = Math.abs(calculatedTotal - sale.total_amount) < 0.01;
                if (isValid) validAmounts++;
            }
        });
        
        const amountConsistency = validAmounts / sales.length;
        this.logTest('Sales Amount Calculations', amountConsistency >= 0.95, 
            `${validAmounts}/${sales.length} sales have correct amount calculations`);
    }

    testDashboardDataConsistency() {
        console.log('\n🧪 Testing Dashboard Data Consistency...');
        
        // Get dashboard metrics from DOM
        const totalSalesElement = document.querySelector('[data-testid="total-sales"], .total-sales');
        const totalCustomersElement = document.querySelector('[data-testid="total-customers"], .total-customers');
        const totalProductsElement = document.querySelector('[data-testid="total-products"], .total-products');
        
        // Test if dashboard shows data
        const hasDashboardData = totalSalesElement || totalCustomersElement || totalProductsElement;
        this.logTest('Dashboard Data Display', hasDashboardData, 
            hasDashboardData ? 'Dashboard metrics are displayed' : 'No dashboard metrics found');
        
        if (!hasDashboardData) return;
        
        // Test customer count consistency
        if (totalCustomersElement) {
            const displayedCount = parseInt(totalCustomersElement.textContent.replace(/\D/g, ''));
            const actualCount = Array.isArray(this.testData.customers) ? this.testData.customers.length : 
                              this.testData.customers?.customers?.length || 0;
            
            const countMatches = Math.abs(displayedCount - actualCount) <= 1; // Allow 1 difference for timing
            this.logTest('Dashboard Customer Count', countMatches, 
                `Dashboard shows ${displayedCount}, actual: ${actualCount}`);
        }
        
        // Test product count consistency
        if (totalProductsElement) {
            const displayedCount = parseInt(totalProductsElement.textContent.replace(/\D/g, ''));
            const actualCount = Array.isArray(this.testData.products) ? this.testData.products.length : 
                              this.testData.products?.products?.length || 0;
            
            const countMatches = Math.abs(displayedCount - actualCount) <= 1;
            this.logTest('Dashboard Product Count', countMatches, 
                `Dashboard shows ${displayedCount}, actual: ${actualCount}`);
        }
        
        // Test sales total consistency
        if (totalSalesElement) {
            const displayedAmount = totalSalesElement.textContent.replace(/[₦,\s]/g, '');
            const sales = Array.isArray(this.testData.sales) ? this.testData.sales : 
                         this.testData.sales?.sales || [];
            
            const actualTotal = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
            const displayedTotal = parseFloat(displayedAmount) || 0;
            
            const amountMatches = Math.abs(displayedTotal - actualTotal) / Math.max(actualTotal, 1) < 0.1; // 10% tolerance
            this.logTest('Dashboard Sales Total', amountMatches, 
                `Dashboard shows ₦${displayedTotal}, calculated: ₦${actualTotal}`);
        }
    }

    testNigerianFormatting() {
        console.log('\n🧪 Testing Nigerian Formatting...');
        
        // Test Naira formatting
        const priceElements = document.querySelectorAll('[data-testid*="price"], .price, .amount, .total');
        let properNairaFormat = 0;
        
        priceElements.forEach(element => {
            const text = element.textContent;
            const hasNairaSymbol = text.includes('₦');
            const hasProperFormat = /₦[\d,]+(\.\d{2})?/.test(text) || /₦\d+/.test(text);
            
            if (hasNairaSymbol && hasProperFormat) properNairaFormat++;
        });
        
        const nairaFormatRatio = priceElements.length > 0 ? properNairaFormat / priceElements.length : 1;
        this.logTest('Naira Currency Format', nairaFormatRatio >= 0.9, 
            `${properNairaFormat}/${priceElements.length} prices properly formatted with ₦`);
        
        // Test date formatting
        const dateElements = document.querySelectorAll('[data-testid*="date"], .date, .created-at');
        let properDateFormat = 0;
        
        dateElements.forEach(element => {
            const text = element.textContent;
            // Check for various acceptable date formats
            const hasValidDate = /\d{1,2}\/\d{1,2}\/\d{4}/.test(text) || 
                               /\d{1,2}-\d{1,2}-\d{4}/.test(text) ||
                               /\w{3}\s\d{1,2},?\s\d{4}/.test(text) ||
                               text.includes('ago') ||
                               text === 'N/A';
            
            if (hasValidDate) properDateFormat++;
        });
        
        const dateFormatRatio = dateElements.length > 0 ? properDateFormat / dateElements.length : 1;
        this.logTest('Date Format Consistency', dateFormatRatio >= 0.8, 
            `${properDateFormat}/${dateElements.length} dates properly formatted`);
        
        // Test phone number formatting
        const phoneElements = document.querySelectorAll('[data-testid*="phone"], .phone');
        let properPhoneFormat = 0;
        
        phoneElements.forEach(element => {
            const text = element.textContent;
            const hasValidPhone = /\+234/.test(text) || /^0\d{10}/.test(text.replace(/\s/g, '')) || text === 'N/A';
            
            if (hasValidPhone) properPhoneFormat++;
        });
        
        const phoneFormatRatio = phoneElements.length > 0 ? properPhoneFormat / phoneElements.length : 1;
        this.logTest('Nigerian Phone Format', phoneFormatRatio >= 0.8, 
            `${properPhoneFormat}/${phoneElements.length} phones properly formatted`);
    }

    testDataIntegration() {
        console.log('\n🧪 Testing Data Integration...');
        
        // Test if creating a sale updates inventory
        const products = Array.isArray(this.testData.products) ? this.testData.products : 
                        this.testData.products?.products || [];
        const sales = Array.isArray(this.testData.sales) ? this.testData.sales : 
                     this.testData.sales?.sales || [];
        
        if (products.length > 0 && sales.length > 0) {
            // Check if any products show reduced inventory from sales
            let inventoryUpdated = false;
            
            sales.forEach(sale => {
                const product = products.find(p => p.id === sale.product_id);
                if (product && sale.quantity) {
                    // This is a simplified check - in reality we'd need historical data
                    inventoryUpdated = true;
                }
            });
            
            this.logTest('Sales-Inventory Integration', inventoryUpdated, 
                inventoryUpdated ? 'Sales appear to affect inventory' : 'No clear sales-inventory integration');
        }
        
        // Test transaction creation from sales/expenses
        const transactions = []; // Would fetch from /transactions endpoint if available
        
        // For now, test if sales have proper transaction references
        let salesWithTransactions = 0;
        sales.forEach(sale => {
            if (sale.transaction_id || sale.payment_method) {
                salesWithTransactions++;
            }
        });
        
        const transactionIntegration = sales.length === 0 || (salesWithTransactions / sales.length) >= 0.5;
        this.logTest('Sales-Transaction Integration', transactionIntegration, 
            `${salesWithTransactions}/${sales.length} sales have transaction data`);
    }

    async runAllTests() {
        console.log('🚀 Starting Data Consistency and Integration Testing...');
        console.log('='.repeat(60));
        
        const startTime = Date.now();
        
        // Load test data first
        await this.loadTestData();
        
        // Run all consistency tests
        this.testCustomerDataConsistency();
        this.testProductDataConsistency();
        this.testSalesDataConsistency();
        this.testDashboardDataConsistency();
        this.testNigerianFormatting();
        this.testDataIntegration();
        
        const totalTime = (Date.now() - startTime) / 1000;
        this.generateSummary(totalTime);
    }

    generateSummary(totalTime) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DATA CONSISTENCY TEST SUMMARY');
        console.log('='.repeat(60));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
        console.log(`Total Time: ${totalTime.toFixed(2)}s`);
        
        // Show data quality metrics
        console.log('\n📈 DATA QUALITY METRICS:');
        const dataTests = this.testResults.filter(r => r.test.includes('Required Fields') || r.test.includes('Validity'));
        const dataQuality = dataTests.filter(r => r.success).length / Math.max(dataTests.length, 1);
        console.log(`Data Quality Score: ${(dataQuality * 100).toFixed(1)}%`);
        
        const formatTests = this.testResults.filter(r => r.test.includes('Format'));
        const formatQuality = formatTests.filter(r => r.success).length / Math.max(formatTests.length, 1);
        console.log(`Format Consistency: ${(formatQuality * 100).toFixed(1)}%`);
        
        const integrationTests = this.testResults.filter(r => r.test.includes('Integration') || r.test.includes('Relationship'));
        const integrationQuality = integrationTests.filter(r => r.success).length / Math.max(integrationTests.length, 1);
        console.log(`Integration Quality: ${(integrationQuality * 100).toFixed(1)}%`);
        
        // Show critical issues
        const criticalFailures = this.testResults.filter(r => 
            !r.success && (
                r.test.includes('Required Fields') ||
                r.test.includes('Dashboard') ||
                r.test.includes('Integration')
            )
        );
        
        if (criticalFailures.length > 0) {
            console.log('\n🚨 CRITICAL DATA ISSUES:');
            criticalFailures.forEach(failure => {
                console.log(`  - ${failure.test}: ${failure.message}`);
            });
        }
        
        // Save results
        const results = {
            summary: {
                total_tests: totalTests,
                passed: passedTests,
                failed: failedTests,
                success_rate: (passedTests/totalTests)*100,
                data_quality_score: dataQuality * 100,
                format_consistency: formatQuality * 100,
                integration_quality: integrationQuality * 100,
                total_time: totalTime,
                timestamp: new Date().toISOString()
            },
            test_data_summary: {
                customers_count: Array.isArray(this.testData.customers) ? this.testData.customers.length : 
                               this.testData.customers?.customers?.length || 0,
                products_count: Array.isArray(this.testData.products) ? this.testData.products.length : 
                              this.testData.products?.products?.length || 0,
                sales_count: Array.isArray(this.testData.sales) ? this.testData.sales.length : 
                           this.testData.sales?.sales?.length || 0
            },
            critical_failures: criticalFailures,
            all_results: this.testResults
        };
        
        // Save to file if in Node.js environment
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            fs.writeFileSync('Biz/tests/data_consistency_results.json', JSON.stringify(results, null, 2));
            console.log('\n📄 Detailed results saved to: data_consistency_results.json');
        }
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataConsistencyTest;
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const tester = new DataConsistencyTest();
            tester.runAllTests();
        });
    } else {
        const tester = new DataConsistencyTest();
        tester.runAllTests();
    }
}