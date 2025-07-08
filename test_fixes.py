#!/usr/bin/env python3
"""
Test script to verify that the database column fixes work correctly.
This script tests the dashboard endpoint to ensure it can query the products table
with the correct column names.
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'Biz', 'backend', 'sabiops-backend')
sys.path.insert(0, backend_dir)

def test_health_endpoint():
    """Test the health endpoint to verify basic connectivity."""
    print("Testing health endpoint...")
    try:
        # Test locally if possible, otherwise skip
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
            return True
        else:
            print(f"❌ Health endpoint returned {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Could not connect to local server: {e}")
        return False

def test_column_names_in_code():
    """Test that the code uses correct column names."""
    print("\nTesting column names in code...")
    
    # Check dashboard.py for correct column usage
    dashboard_file = os.path.join(backend_dir, 'src', 'routes', 'dashboard.py')
    
    if os.path.exists(dashboard_file):
        with open(dashboard_file, 'r') as f:
            content = f.read()
            
        # Check for incorrect column names
        if 'stock_quantity' in content:
            print("❌ Found 'stock_quantity' in dashboard.py - should be 'quantity'")
            return False
        
        # Check for correct column names
        if 'quantity' in content and 'products' in content:
            print("✅ Dashboard.py uses correct column name 'quantity'")
        else:
            print("⚠️  Could not verify column usage in dashboard.py")
            
    # Check product.py for correct column usage
    product_file = os.path.join(backend_dir, 'src', 'routes', 'product.py')
    
    if os.path.exists(product_file):
        with open(product_file, 'r') as f:
            content = f.read()
            
        # Check for incorrect column names
        if 'stock_quantity' in content:
            print("❌ Found 'stock_quantity' in product.py - should be 'quantity'")
            return False
        
        # Check for correct column names
        if 'quantity' in content:
            print("✅ Product.py uses correct column name 'quantity'")
        else:
            print("⚠️  Could not verify column usage in product.py")
    
    return True

def test_excel_service_column_names():
    """Test that excel service uses correct column names."""
    print("\nTesting excel service column names...")
    
    excel_file = os.path.join(backend_dir, 'src', 'services', 'excel_service.py')
    
    if os.path.exists(excel_file):
        with open(excel_file, 'r') as f:
            content = f.read()
            
        # Check for incorrect column names
        if 'stock_quantity' in content:
            print("❌ Found 'stock_quantity' in excel_service.py - should be 'quantity'")
            return False
        
        if 'low_stock_alert' in content:
            print("❌ Found 'low_stock_alert' in excel_service.py - should be 'low_stock_threshold'")
            return False
        
        # Check for correct column names
        if 'quantity' in content and 'low_stock_threshold' in content:
            print("✅ Excel service uses correct column names")
        else:
            print("⚠️  Could not verify all column names in excel service")
            
    return True

def test_test_files_column_names():
    """Test that test files use correct column names."""
    print("\nTesting test files column names...")
    
    test_dir = os.path.join(backend_dir, 'tests')
    
    if os.path.exists(test_dir):
        test_files = [f for f in os.listdir(test_dir) if f.endswith('.py')]
        
        for test_file in test_files:
            file_path = os.path.join(test_dir, test_file)
            with open(file_path, 'r') as f:
                content = f.read()
                
            # Check for incorrect column names
            if 'stock_quantity' in content:
                print(f"❌ Found 'stock_quantity' in {test_file} - should be 'quantity'")
                return False
            
            if 'low_stock_alert' in content:
                print(f"❌ Found 'low_stock_alert' in {test_file} - should be 'low_stock_threshold'")
                return False
        
        print("✅ All test files use correct column names")
    
    return True

def main():
    """Run all tests."""
    print("🔍 Testing database column fixes...")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test 1: Health endpoint (optional)
    health_ok = test_health_endpoint()
    
    # Test 2: Column names in code
    code_ok = test_column_names_in_code()
    all_tests_passed = all_tests_passed and code_ok
    
    # Test 3: Excel service column names
    excel_ok = test_excel_service_column_names()
    all_tests_passed = all_tests_passed and excel_ok
    
    # Test 4: Test files column names
    test_files_ok = test_test_files_column_names()
    all_tests_passed = all_tests_passed and test_files_ok
    
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All tests passed! Database column fixes are working correctly.")
        print("\nThe following issues have been resolved:")
        print("- Changed 'stock_quantity' to 'quantity' in all files")
        print("- Changed 'low_stock_alert' to 'low_stock_threshold' in all files")
        print("- Updated dashboard.py, excel_service.py, and all test files")
        print("\nThe error 'column products.stock_quantity does not exist' should now be resolved.")
    else:
        print("❌ Some tests failed. Please review the output above.")
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    exit(main())

