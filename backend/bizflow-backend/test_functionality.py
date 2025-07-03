#!/usr/bin/env python3
"""
Test all backend functionality and generate functionality report.
"""

import requests
import json
import sys
import os

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_USER = {
    "first_name": "Test",
    "last_name": "User", 
    "email": "test@bizflow.ng",
    "username": "testuser",
    "password": "password123"
}

class FunctionalityTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.test_results = {
            'working_features': [],
            'broken_features': [],
            'partially_working': [],
            'not_implemented': []
        }
    
    def test_health_endpoint(self):
        """Test basic health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.test_results['working_features'].append({
                    'feature': 'Health Check Endpoint',
                    'status': 'Working',
                    'details': data
                })
                return True
            else:
                self.test_results['broken_features'].append({
                    'feature': 'Health Check Endpoint',
                    'status': 'Failed',
                    'error': f"Status code: {response.status_code}"
                })
                return False
        except Exception as e:
            self.test_results['broken_features'].append({
                'feature': 'Health Check Endpoint',
                'status': 'Failed',
                'error': str(e)
            })
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=TEST_USER,
                timeout=5
            )
            if response.status_code == 201:
                data = response.json()
                self.access_token = data.get('access_token')
                self.test_results['working_features'].append({
                    'feature': 'User Registration',
                    'status': 'Working',
                    'details': 'User can register successfully'
                })
                return True
            else:
                self.test_results['broken_features'].append({
                    'feature': 'User Registration',
                    'status': 'Failed',
                    'error': f"Status code: {response.status_code}, Response: {response.text}"
                })
                return False
        except Exception as e:
            self.test_results['broken_features'].append({
                'feature': 'User Registration',
                'status': 'Failed',
                'error': str(e)
            })
            return False
    
    def test_user_login(self):
        """Test user login"""
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={
                    "email": TEST_USER["email"],
                    "password": TEST_USER["password"]
                },
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                self.test_results['working_features'].append({
                    'feature': 'User Login',
                    'status': 'Working',
                    'details': 'User can login successfully'
                })
                return True
            else:
                self.test_results['broken_features'].append({
                    'feature': 'User Login',
                    'status': 'Failed',
                    'error': f"Status code: {response.status_code}"
                })
                return False
        except Exception as e:
            self.test_results['broken_features'].append({
                'feature': 'User Login',
                'status': 'Failed',
                'error': str(e)
            })
            return False
    
    def test_customer_management(self):
        """Test customer CRUD operations"""
        if not self.access_token:
            self.test_results['broken_features'].append({
                'feature': 'Customer Management',
                'status': 'Failed',
                'error': 'No access token available'
            })
            return False
        
        headers = {'Authorization': f'Bearer {self.access_token}'}
        
        try:
            # Test GET customers
            response = requests.get(f"{self.base_url}/api/customers", headers=headers, timeout=5)
            if response.status_code != 200:
                raise Exception(f"GET customers failed: {response.status_code}")
            
            # Test POST customer
            customer_data = {
                "name": "Test Customer",
                "email": "customer@test.com",
                "phone": "+2348012345678",
                "address": "123 Test Street, Lagos"
            }
            response = requests.post(f"{self.base_url}/api/customers", json=customer_data, headers=headers, timeout=5)
            if response.status_code != 201:
                raise Exception(f"POST customer failed: {response.status_code}")
            
            self.test_results['working_features'].append({
                'feature': 'Customer Management',
                'status': 'Working',
                'details': 'Can create and retrieve customers'
            })
            return True
            
        except Exception as e:
            self.test_results['broken_features'].append({
                'feature': 'Customer Management',
                'status': 'Failed',
                'error': str(e)
            })
            return False
    
    def test_product_management(self):
        """Test product CRUD operations"""
        if not self.access_token:
            self.test_results['broken_features'].append({
                'feature': 'Product Management',
                'status': 'Failed',
                'error': 'No access token available'
            })
            return False
        
        headers = {'Authorization': f'Bearer {self.access_token}'}
        
        try:
            # Test GET products
            response = requests.get(f"{self.base_url}/api/products", headers=headers, timeout=5)
            if response.status_code != 200:
                raise Exception(f"GET products failed: {response.status_code}")
            
            # Test POST product
            product_data = {
                "name": "Test Product",
                "description": "A test product for Nigerian SMEs",
                "price": 5000.00,
                "stock_quantity": 100,
                "category": "Electronics"
            }
            response = requests.post(f"{self.base_url}/api/products", json=product_data, headers=headers, timeout=5)
            if response.status_code != 201:
                raise Exception(f"POST product failed: {response.status_code}")
            
            self.test_results['working_features'].append({
                'feature': 'Product Management',
                'status': 'Working',
                'details': 'Can create and retrieve products'
            })
            return True
            
        except Exception as e:
            self.test_results['broken_features'].append({
                'feature': 'Product Management',
                'status': 'Failed',
                'error': str(e)
            })
            return False
    
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        if not self.access_token:
            self.test_results['broken_features'].append({
                'feature': 'Dashboard Statistics',
                'status': 'Failed',
                'error': 'No access token available'
            })
            return False
        
        headers = {'Authorization': f'Bearer {self.access_token}'}
        
        try:
            response = requests.get(f"{self.base_url}/api/dashboard/stats", headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.test_results['working_features'].append({
                    'feature': 'Dashboard Statistics',
                    'status': 'Working',
                    'details': f"Stats: {data}"
                })
                return True
            else:
                raise Exception(f"Dashboard stats failed: {response.status_code}")
                
        except Exception as e:
            self.test_results['broken_features'].append({
                'feature': 'Dashboard Statistics',
                'status': 'Failed',
                'error': str(e)
            })
            return False
    
    def test_advanced_features(self):
        """Test advanced features that might not be implemented"""
        advanced_endpoints = [
            '/api/invoices',
            '/api/payments',
            '/api/expenses',
            '/api/sales',
            '/api/referrals',
            '/api/subscription'
        ]
        
        headers = {'Authorization': f'Bearer {self.access_token}'} if self.access_token else {}
        
        for endpoint in advanced_endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=5)
                if response.status_code == 200:
                    self.test_results['working_features'].append({
                        'feature': f'{endpoint.split("/")[-1].title()} Management',
                        'status': 'Working',
                        'details': 'Endpoint responds successfully'
                    })
                elif response.status_code == 404:
                    self.test_results['not_implemented'].append({
                        'feature': f'{endpoint.split("/")[-1].title()} Management',
                        'status': 'Not Implemented',
                        'details': 'Endpoint not found'
                    })
                else:
                    self.test_results['partially_working'].append({
                        'feature': f'{endpoint.split("/")[-1].title()} Management',
                        'status': 'Partially Working',
                        'details': f'Status code: {response.status_code}'
                    })
            except Exception as e:
                self.test_results['not_implemented'].append({
                    'feature': f'{endpoint.split("/")[-1].title()} Management',
                    'status': 'Not Implemented',
                    'details': str(e)
                })
    
    def run_all_tests(self):
        """Run all functionality tests"""
        print("🧪 Testing Bizflow SME Nigeria Backend Functionality")
        print("=" * 60)
        
        # Test basic connectivity
        print("1. Testing health endpoint...")
        if not self.test_health_endpoint():
            print("❌ Backend is not running or not accessible")
            return self.test_results
        
        print("✅ Backend is running")
        
        # Test authentication
        print("2. Testing user registration...")
        self.test_user_registration()
        
        print("3. Testing user login...")
        self.test_user_login()
        
        # Test core features
        print("4. Testing customer management...")
        self.test_customer_management()
        
        print("5. Testing product management...")
        self.test_product_management()
        
        print("6. Testing dashboard statistics...")
        self.test_dashboard_stats()
        
        # Test advanced features
        print("7. Testing advanced features...")
        self.test_advanced_features()
        
        return self.test_results
    
    def generate_report(self):
        """Generate functionality report"""
        results = self.run_all_tests()
        
        print("\n📊 FUNCTIONALITY REPORT")
        print("=" * 60)
        
        print(f"✅ Working Features: {len(results['working_features'])}")
        for feature in results['working_features']:
            print(f"   • {feature['feature']}: {feature['details']}")
        
        print(f"\n⚠️ Partially Working Features: {len(results['partially_working'])}")
        for feature in results['partially_working']:
            print(f"   • {feature['feature']}: {feature['details']}")
        
        print(f"\n❌ Broken Features: {len(results['broken_features'])}")
        for feature in results['broken_features']:
            print(f"   • {feature['feature']}: {feature['error']}")
        
        print(f"\n🚧 Not Implemented Features: {len(results['not_implemented'])}")
        for feature in results['not_implemented']:
            print(f"   • {feature['feature']}: {feature['details']}")
        
        # Calculate success rate
        total_tested = len(results['working_features']) + len(results['broken_features']) + len(results['partially_working'])
        success_rate = (len(results['working_features']) / total_tested * 100) if total_tested > 0 else 0
        
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return results

def main():
    tester = FunctionalityTester()
    results = tester.generate_report()
    
    # Save results to file
    with open('functionality_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to functionality_test_results.json")

if __name__ == "__main__":
    main()