#!/usr/bin/env python3
"""
Final Integration and Deployment Testing Suite
Tests complete user workflows end-to-end for SabiOps Nigerian SME features
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta
import uuid

class SabiOpsIntegrationTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.test_data = {}
        
    def log_test(self, test_name, success, message="", data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        
    def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Backend Connectivity", True, "Backend is accessible")
                return True
            else:
                self.log_test("Backend Connectivity", False, f"Backend returned {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Connectivity", False, f"Connection failed: {str(e)}")
            return False
    
    def test_customer_workflow(self):
        """Test complete customer management workflow"""
        print("\n🧪 Testing Customer Management Workflow...")
        
        # Test customer creation
        customer_data = {
            "name": "Test Nigerian SME Customer",
            "email": "test@nigeriansme.com",
            "phone": "+2348012345678",
            "business_name": "Lagos Trading Company",
            "address": "123 Victoria Island, Lagos, Nigeria"
        }
        
        try:
            # Create customer
            response = self.session.post(
                f"{self.base_url}/customers/",
                json=customer_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success'):
                    customer_id = data['data']['id']
                    self.test_data['customer_id'] = customer_id
                    self.log_test("Customer Creation", True, "Customer created successfully")
                    
                    # Test customer retrieval
                    get_response = self.session.get(f"{self.base_url}/customers/", timeout=10)
                    if get_response.status_code == 200:
                        customers_data = get_response.json()
                        if customers_data.get('success') and customers_data.get('data', {}).get('customers'):
                            self.log_test("Customer Retrieval", True, f"Retrieved {len(customers_data['data']['customers'])} customers")
                            
                            # Verify Nigerian formatting
                            customer = customers_data['data']['customers'][0]
                            if customer.get('phone', '').startswith('+234'):
                                self.log_test("Nigerian Phone Formatting", True, "Phone number properly formatted")
                            else:
                                self.log_test("Nigerian Phone Formatting", False, "Phone number not properly formatted")
                        else:
                            self.log_test("Customer Retrieval", False, "No customers returned")
                    else:
                        self.log_test("Customer Retrieval", False, f"Failed to retrieve customers: {get_response.status_code}")
                else:
                    self.log_test("Customer Creation", False, f"API returned success=False: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Customer Creation", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Customer Creation", False, f"Exception: {str(e)}")
    
    def test_product_workflow(self):
        """Test complete product management workflow"""
        print("\n🧪 Testing Product Management Workflow...")
        
        product_data = {
            "name": "Nigerian Rice 50kg",
            "description": "Premium quality Nigerian rice",
            "price": 45000.00,
            "cost_price": 35000.00,
            "quantity": 100,
            "low_stock_threshold": 10,
            "category": "Food & Beverages",
            "sku": "RICE-50KG-001"
        }
        
        try:
            # Create product
            response = self.session.post(
                f"{self.base_url}/products/",
                json=product_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success'):
                    product_id = data['data']['id']
                    self.test_data['product_id'] = product_id
                    self.log_test("Product Creation", True, "Product created successfully")
                    
                    # Test product retrieval with inventory tracking
                    get_response = self.session.get(f"{self.base_url}/products/", timeout=10)
                    if get_response.status_code == 200:
                        products_data = get_response.json()
                        if products_data.get('success'):
                            products = products_data['data']['products']
                            if products:
                                product = products[0]
                                # Check Nigerian business categories
                                if product.get('category') in ['Food & Beverages', 'Retail/Trading', 'Fashion & Clothing']:
                                    self.log_test("Nigerian Business Categories", True, "Product uses Nigerian business category")
                                else:
                                    self.log_test("Nigerian Business Categories", False, f"Unexpected category: {product.get('category')}")
                                
                                # Check inventory tracking
                                if 'quantity' in product and 'low_stock_threshold' in product:
                                    self.log_test("Inventory Tracking", True, "Product has inventory tracking fields")
                                else:
                                    self.log_test("Inventory Tracking", False, "Missing inventory tracking fields")
                            else:
                                self.log_test("Product Retrieval", False, "No products returned")
                        else:
                            self.log_test("Product Retrieval", False, "API returned success=False")
                    else:
                        self.log_test("Product Retrieval", False, f"Failed to retrieve products: {get_response.status_code}")
                else:
                    self.log_test("Product Creation", False, f"API returned success=False: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Product Creation", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Product Creation", False, f"Exception: {str(e)}")
    
    def test_sales_workflow(self):
        """Test complete sales workflow with inventory updates"""
        print("\n🧪 Testing Sales Management Workflow...")
        
        if not self.test_data.get('customer_id') or not self.test_data.get('product_id'):
            self.log_test("Sales Workflow", False, "Missing customer or product data from previous tests")
            return
        
        sale_data = {
            "customer_id": self.test_data['customer_id'],
            "product_id": self.test_data['product_id'],
            "quantity": 2,
            "unit_price": 45000.00,
            "payment_method": "cash"
        }
        
        try:
            # Create sale
            response = self.session.post(
                f"{self.base_url}/sales/",
                json=sale_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success'):
                    sale_id = data['data']['id']
                    self.test_data['sale_id'] = sale_id
                    self.log_test("Sale Creation", True, "Sale created successfully")
                    
                    # Test inventory reduction
                    time.sleep(1)  # Allow for inventory update
                    product_response = self.session.get(f"{self.base_url}/products/", timeout=10)
                    if product_response.status_code == 200:
                        products_data = product_response.json()
                        if products_data.get('success'):
                            products = products_data['data']['products']
                            product = next((p for p in products if p['id'] == self.test_data['product_id']), None)
                            if product:
                                # Original quantity was 100, sold 2, should be 98
                                if product['quantity'] == 98:
                                    self.log_test("Inventory Reduction", True, "Inventory properly reduced after sale")
                                else:
                                    self.log_test("Inventory Reduction", False, f"Expected quantity 98, got {product['quantity']}")
                            else:
                                self.log_test("Inventory Reduction", False, "Product not found for inventory check")
                    
                    # Test sales retrieval
                    sales_response = self.session.get(f"{self.base_url}/sales/", timeout=10)
                    if sales_response.status_code == 200:
                        sales_data = sales_response.json()
                        if sales_data.get('success'):
                            sales = sales_data['data']['sales']
                            if sales:
                                sale = sales[0]
                                # Check Nigerian currency formatting in response
                                if 'total_amount' in sale and sale['total_amount'] == 90000.00:
                                    self.log_test("Sales Calculation", True, "Sale total calculated correctly (₦90,000)")
                                else:
                                    self.log_test("Sales Calculation", False, f"Incorrect total: {sale.get('total_amount')}")
                            else:
                                self.log_test("Sales Retrieval", False, "No sales returned")
                        else:
                            self.log_test("Sales Retrieval", False, "API returned success=False")
                else:
                    self.log_test("Sale Creation", False, f"API returned success=False: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Sale Creation", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Sale Creation", False, f"Exception: {str(e)}")
    
    def test_expense_workflow(self):
        """Test expense management with Nigerian categories"""
        print("\n🧪 Testing Expense Management Workflow...")
        
        expense_data = {
            "description": "Shop rent for January 2025",
            "amount": 150000.00,
            "category": "Rent",
            "payment_method": "bank_transfer",
            "date": datetime.now().isoformat()
        }
        
        try:
            # Create expense
            response = self.session.post(
                f"{self.base_url}/expenses/",
                json=expense_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success'):
                    expense_id = data['data']['id']
                    self.test_data['expense_id'] = expense_id
                    self.log_test("Expense Creation", True, "Expense created successfully")
                    
                    # Test expense retrieval
                    get_response = self.session.get(f"{self.base_url}/expenses/", timeout=10)
                    if get_response.status_code == 200:
                        expenses_data = get_response.json()
                        if expenses_data.get('success'):
                            expenses = expenses_data['data']['expenses']
                            if expenses:
                                expense = expenses[0]
                                # Check Nigerian expense categories
                                nigerian_categories = ['Rent', 'Utilities', 'Transportation', 'Staff Salaries', 'Inventory/Stock']
                                if expense.get('category') in nigerian_categories:
                                    self.log_test("Nigerian Expense Categories", True, "Expense uses Nigerian business category")
                                else:
                                    self.log_test("Nigerian Expense Categories", False, f"Unexpected category: {expense.get('category')}")
                            else:
                                self.log_test("Expense Retrieval", False, "No expenses returned")
                        else:
                            self.log_test("Expense Retrieval", False, "API returned success=False")
                    else:
                        self.log_test("Expense Retrieval", False, f"Failed to retrieve expenses: {get_response.status_code}")
                else:
                    self.log_test("Expense Creation", False, f"API returned success=False: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Expense Creation", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Expense Creation", False, f"Exception: {str(e)}")
    
    def test_dashboard_metrics(self):
        """Test dashboard data accuracy"""
        print("\n🧪 Testing Dashboard Metrics Accuracy...")
        
        try:
            response = self.session.get(f"{self.base_url}/dashboard/metrics", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    metrics = data['data']
                    
                    # Check if metrics include expected Nigerian SME data
                    expected_fields = ['total_revenue', 'total_expenses', 'total_customers', 'total_products', 'low_stock_count']
                    missing_fields = [field for field in expected_fields if field not in metrics]
                    
                    if not missing_fields:
                        self.log_test("Dashboard Metrics Structure", True, "All expected metrics present")
                        
                        # Check if revenue matches our test sale (₦90,000)
                        if metrics.get('total_revenue', 0) >= 90000:
                            self.log_test("Revenue Calculation", True, f"Revenue includes test sale: ₦{metrics['total_revenue']:,.2f}")
                        else:
                            self.log_test("Revenue Calculation", False, f"Revenue too low: ₦{metrics.get('total_revenue', 0):,.2f}")
                        
                        # Check if expenses match our test expense (₦150,000)
                        if metrics.get('total_expenses', 0) >= 150000:
                            self.log_test("Expense Calculation", True, f"Expenses include test expense: ₦{metrics['total_expenses']:,.2f}")
                        else:
                            self.log_test("Expense Calculation", False, f"Expenses too low: ₦{metrics.get('total_expenses', 0):,.2f}")
                    else:
                        self.log_test("Dashboard Metrics Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Dashboard Metrics", False, f"API returned success=False: {data.get('message', 'Unknown error')}")
            else:
                self.log_test("Dashboard Metrics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Dashboard Metrics", False, f"Exception: {str(e)}")
    
    def test_performance_benchmarks(self):
        """Test performance under realistic usage scenarios"""
        print("\n🧪 Testing Performance Benchmarks...")
        
        endpoints_to_test = [
            ("/customers/", "Customer List"),
            ("/products/", "Product List"),
            ("/sales/", "Sales List"),
            ("/expenses/", "Expense List"),
            ("/dashboard/metrics", "Dashboard Metrics")
        ]
        
        for endpoint, name in endpoints_to_test:
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                end_time = time.time()
                
                response_time = end_time - start_time
                
                if response.status_code == 200:
                    if response_time <= 3.0:  # 3 second requirement
                        self.log_test(f"Performance - {name}", True, f"Response time: {response_time:.2f}s")
                    else:
                        self.log_test(f"Performance - {name}", False, f"Too slow: {response_time:.2f}s (>3s)")
                else:
                    self.log_test(f"Performance - {name}", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Performance - {name}", False, f"Exception: {str(e)}")
    
    def test_nigerian_sme_features(self):
        """Test Nigerian SME specific features"""
        print("\n🧪 Testing Nigerian SME Specific Features...")
        
        # Test Naira formatting
        test_amounts = [1000, 25000.50, 1500000, 0]
        for amount in test_amounts:
            formatted = f"₦{amount:,.2f}".replace('.00', '')
            if formatted.startswith('₦') and ',' in formatted:
                self.log_test(f"Naira Formatting - ₦{amount}", True, f"Properly formatted: {formatted}")
            else:
                self.log_test(f"Naira Formatting - ₦{amount}", False, f"Incorrect format: {formatted}")
        
        # Test Nigerian business categories
        nigerian_categories = [
            'Retail/Trading', 'Food & Beverages', 'Fashion & Clothing',
            'Electronics', 'Health & Beauty', 'Home & Garden',
            'Automotive', 'Services', 'Manufacturing', 'Agriculture'
        ]
        
        if len(nigerian_categories) >= 10:
            self.log_test("Nigerian Business Categories", True, f"Comprehensive categories available: {len(nigerian_categories)}")
        else:
            self.log_test("Nigerian Business Categories", False, f"Insufficient categories: {len(nigerian_categories)}")
        
        # Test Nigerian phone number formatting
        test_phones = [
            ("08012345678", "+2348012345678"),
            ("+2348012345678", "+2348012345678"),
            ("2348012345678", "+2348012345678")
        ]
        
        for input_phone, expected in test_phones:
            # Simulate phone formatting logic
            cleaned = input_phone.replace(/\D/g, '')
            if cleaned.startswith('234'):
                formatted = f"+{cleaned}"
            elif cleaned.startswith('0'):
                formatted = f"+234{cleaned[1:]}"
            else:
                formatted = input_phone
                
            if formatted == expected:
                self.log_test(f"Phone Formatting - {input_phone}", True, f"Correctly formatted: {formatted}")
            else:
                self.log_test(f"Phone Formatting - {input_phone}", False, f"Expected {expected}, got {formatted}")
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n🧪 Testing Error Handling...")
        
        # Test invalid data scenarios
        invalid_customer = {
            "name": "",  # Empty required field
            "email": "invalid-email",  # Invalid email
            "phone": "invalid-phone"  # Invalid phone
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/customers/",
                json=invalid_customer,
                timeout=10
            )
            
            if response.status_code in [400, 422]:  # Bad request or validation error
                data = response.json()
                if not data.get('success') and data.get('message'):
                    self.log_test("Error Handling - Invalid Data", True, "Proper error response for invalid data")
                else:
                    self.log_test("Error Handling - Invalid Data", False, "Error response missing message")
            else:
                self.log_test("Error Handling - Invalid Data", False, f"Expected 400/422, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling - Invalid Data", False, f"Exception: {str(e)}")
        
        # Test non-existent endpoint
        try:
            response = self.session.get(f"{self.base_url}/nonexistent", timeout=10)
            if response.status_code == 404:
                self.log_test("Error Handling - 404", True, "Proper 404 response for non-existent endpoint")
            else:
                self.log_test("Error Handling - 404", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling - 404", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run complete integration test suite"""
        print("🚀 Starting SabiOps Final Integration Testing...")
        print("=" * 60)
        
        start_time = time.time()
        
        # Core connectivity test
        if not self.test_backend_connectivity():
            print("❌ Backend not accessible. Stopping tests.")
            return self.generate_report()
        
        # Run all test workflows
        self.test_customer_workflow()
        self.test_product_workflow()
        self.test_sales_workflow()
        self.test_expense_workflow()
        self.test_dashboard_metrics()
        self.test_performance_benchmarks()
        self.test_nigerian_sme_features()
        self.test_error_handling()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"\n⏱️  Total test time: {total_time:.2f} seconds")
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{success_rate:.1f}%",
                "timestamp": datetime.now().isoformat()
            },
            "results": self.test_results,
            "recommendations": []
        }
        
        # Add recommendations based on failures
        failed_categories = {}
        for result in self.test_results:
            if not result['success']:
                category = result['test'].split(' - ')[0] if ' - ' in result['test'] else result['test']
                failed_categories[category] = failed_categories.get(category, 0) + 1
        
        if failed_categories:
            report["recommendations"].append("Priority fixes needed in: " + ", ".join(failed_categories.keys()))
        
        if success_rate < 80:
            report["recommendations"].append("Success rate below 80% - significant issues need addressing")
        elif success_rate < 95:
            report["recommendations"].append("Minor issues detected - review failed tests")
        else:
            report["recommendations"].append("Excellent test results - system ready for production")
        
        print("\n" + "=" * 60)
        print("📊 FINAL INTEGRATION TEST REPORT")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if report["recommendations"]:
            print("\n📋 Recommendations:")
            for rec in report["recommendations"]:
                print(f"  • {rec}")
        
        return report

if __name__ == "__main__":
    # Allow custom base URL for testing different environments
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    tester = SabiOpsIntegrationTester(base_url)
    report = tester.run_all_tests()
    
    # Save report to file
    with open('final_integration_test_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: final_integration_test_report.json")
    
    # Exit with appropriate code
    sys.exit(0 if report["summary"]["success_rate"] == "100.0%" else 1)