#!/usr/bin/env python3
"""
Comprehensive API Endpoints Testing for SabiOps
Tests all backend API endpoints with various data scenarios
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid

class SabiOpsAPITester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_time=0):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message} ({response_time:.2f}s)")
        
    def test_endpoint(self, method, endpoint, data=None, expected_status=200):
        """Generic endpoint testing"""
        start_time = time.time()
        try:
            url = f"{self.base_url}{endpoint}"
            
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = time.time() - start_time
            
            # Check status code
            if response.status_code != expected_status:
                return False, f"Expected {expected_status}, got {response.status_code}", response_time
                
            # Check response format for successful requests
            if response.status_code == 200:
                try:
                    json_response = response.json()
                    if not isinstance(json_response, dict):
                        return False, "Response is not a JSON object", response_time
                    if "success" not in json_response:
                        return False, "Response missing 'success' field", response_time
                except json.JSONDecodeError:
                    return False, "Invalid JSON response", response_time
                    
            return True, "Success", response_time
            
        except requests.exceptions.ConnectionError:
            response_time = time.time() - start_time
            return False, "Connection failed - server not running?", response_time
        except Exception as e:
            response_time = time.time() - start_time
            return False, f"Error: {str(e)}", response_time

    def test_customer_endpoints(self):
        """Test customer management endpoints"""
        print("\n🧪 Testing Customer Endpoints...")
        
        # Test GET customers
        success, message, response_time = self.test_endpoint("GET", "/customers/")
        self.log_test("GET /customers/", success, message, response_time)
        
        # Test POST customer with valid data
        valid_customer = {
            "name": "Test Customer",
            "email": "test@example.com",
            "phone": "+2348012345678",
            "business_name": "Test Business",
            "address": "123 Test Street, Lagos"
        }
        success, message, response_time = self.test_endpoint("POST", "/customers/", valid_customer, 201)
        self.log_test("POST /customers/ (valid data)", success, message, response_time)
        
        # Test POST customer with invalid data
        invalid_customer = {
            "name": "",  # Empty name should fail
            "email": "invalid-email",  # Invalid email format
            "phone": "123"  # Invalid phone format
        }
        success, message, response_time = self.test_endpoint("POST", "/customers/", invalid_customer, 400)
        self.log_test("POST /customers/ (invalid data)", success, message, response_time)
        
        # Test POST customer with missing required fields
        incomplete_customer = {
            "email": "test2@example.com"
            # Missing required name field
        }
        success, message, response_time = self.test_endpoint("POST", "/customers/", incomplete_customer, 400)
        self.log_test("POST /customers/ (missing required fields)", success, message, response_time)

    def test_product_endpoints(self):
        """Test product management endpoints"""
        print("\n🧪 Testing Product Endpoints...")
        
        # Test GET products
        success, message, response_time = self.test_endpoint("GET", "/products/")
        self.log_test("GET /products/", success, message, response_time)
        
        # Test POST product with valid data
        valid_product = {
            "name": "Test Product",
            "description": "A test product for API testing",
            "price": 25000.00,
            "cost_price": 15000.00,
            "quantity": 100,
            "low_stock_threshold": 10,
            "category": "Electronics",
            "sku": "TEST-001"
        }
        success, message, response_time = self.test_endpoint("POST", "/products/", valid_product, 201)
        self.log_test("POST /products/ (valid data)", success, message, response_time)
        
        # Test POST product with invalid price
        invalid_product = {
            "name": "Invalid Product",
            "price": -100,  # Negative price should fail
            "quantity": -5   # Negative quantity should fail
        }
        success, message, response_time = self.test_endpoint("POST", "/products/", invalid_product, 400)
        self.log_test("POST /products/ (invalid price/quantity)", success, message, response_time)

    def test_invoice_endpoints(self):
        """Test invoice management endpoints"""
        print("\n🧪 Testing Invoice Endpoints...")
        
        # Test GET invoices
        success, message, response_time = self.test_endpoint("GET", "/invoices/")
        self.log_test("GET /invoices/", success, message, response_time)
        
        # Test POST invoice with valid data
        valid_invoice = {
            "customer_id": str(uuid.uuid4()),
            "items": [
                {
                    "product_id": str(uuid.uuid4()),
                    "quantity": 2,
                    "unit_price": 25000.00
                }
            ],
            "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "notes": "Test invoice"
        }
        success, message, response_time = self.test_endpoint("POST", "/invoices/", valid_invoice, 201)
        self.log_test("POST /invoices/ (valid data)", success, message, response_time)

    def test_sales_endpoints(self):
        """Test sales management endpoints"""
        print("\n🧪 Testing Sales Endpoints...")
        
        # Test GET sales
        success, message, response_time = self.test_endpoint("GET", "/sales/")
        self.log_test("GET /sales/", success, message, response_time)
        
        # Test POST sale with valid data
        valid_sale = {
            "customer_id": str(uuid.uuid4()),
            "product_id": str(uuid.uuid4()),
            "quantity": 2,
            "unit_price": 25000.00,
            "payment_method": "cash"
        }
        success, message, response_time = self.test_endpoint("POST", "/sales/", valid_sale, 201)
        self.log_test("POST /sales/ (valid data)", success, message, response_time)

    def test_expense_endpoints(self):
        """Test expense management endpoints"""
        print("\n🧪 Testing Expense Endpoints...")
        
        # Test GET expenses
        success, message, response_time = self.test_endpoint("GET", "/expenses/")
        self.log_test("GET /expenses/", success, message, response_time)
        
        # Test POST expense with valid data
        valid_expense = {
            "description": "Test expense",
            "amount": 5000.00,
            "category": "Utilities",
            "date": datetime.now().isoformat()
        }
        success, message, response_time = self.test_endpoint("POST", "/expenses/", valid_expense, 201)
        self.log_test("POST /expenses/ (valid data)", success, message, response_time)

    def test_dashboard_endpoints(self):
        """Test dashboard data endpoints"""
        print("\n🧪 Testing Dashboard Endpoints...")
        
        # Test GET dashboard metrics
        success, message, response_time = self.test_endpoint("GET", "/dashboard/metrics")
        self.log_test("GET /dashboard/metrics", success, message, response_time)
        
        # Test response time requirement (should be under 3 seconds)
        if response_time > 3.0:
            self.log_test("Dashboard response time", False, f"Too slow: {response_time:.2f}s > 3.0s", response_time)
        else:
            self.log_test("Dashboard response time", True, f"Fast enough: {response_time:.2f}s", response_time)

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n🧪 Testing Error Handling...")
        
        # Test 404 endpoints
        success, message, response_time = self.test_endpoint("GET", "/nonexistent", expected_status=404)
        self.log_test("GET /nonexistent (404 test)", success, message, response_time)
        
        # Test malformed JSON
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/customers/", data="invalid json")
            response_time = time.time() - start_time
            
            if response.status_code == 400:
                self.log_test("Malformed JSON handling", True, "Properly rejected", response_time)
            else:
                self.log_test("Malformed JSON handling", False, f"Expected 400, got {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Malformed JSON handling", False, f"Error: {str(e)}", 0)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SabiOps API Comprehensive Testing...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_customer_endpoints()
        self.test_product_endpoints()
        self.test_invoice_endpoints()
        self.test_sales_endpoints()
        self.test_expense_endpoints()
        self.test_dashboard_endpoints()
        self.test_error_handling()
        
        total_time = time.time() - start_time
        
        # Generate summary
        self.generate_summary(total_time)
        
    def generate_summary(self, total_time):
        """Generate test summary report"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Total Time: {total_time:.2f}s")
        
        # Show failed tests
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Performance analysis
        slow_tests = [r for r in self.test_results if r["response_time"] > 2.0]
        if slow_tests:
            print(f"\n⚠️  SLOW TESTS (>2s):")
            for result in slow_tests:
                print(f"  - {result['test']}: {result['response_time']:.2f}s")
        
        # Save detailed results
        with open("api_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "success_rate": (passed_tests/total_tests)*100,
                    "total_time": total_time,
                    "timestamp": datetime.now().isoformat()
                },
                "results": self.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: api_test_results.json")

if __name__ == "__main__":
    # Run tests
    tester = SabiOpsAPITester()
    tester.run_all_tests()