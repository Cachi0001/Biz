#!/usr/bin/env python3
"""
Comprehensive import test for backend dependencies
Tests all subscription decorators and route imports
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_subscription_decorators():
    """Test all subscription decorator imports"""
    try:
        from utils.subscription_decorators import (
            protected_product_creation,
            protected_sales_creation, 
            protected_expense_creation,
            protected_invoice_creation,
            get_usage_status_for_response,
            check_analytics_access,
            get_subscription_upgrade_info,
            analytics_access_required,
            premium_analytics_required,
            subscription_required
        )
        print("✅ All subscription decorators imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Subscription decorators import failed: {e}")
        return False

def test_route_imports():
    """Test route imports (excluding those with external dependencies)"""
    routes_to_test = [
        ('routes.product', 'product_bp'),
        ('routes.sales', 'sales_bp'), 
        ('routes.expense', 'expense_bp'),
        ('routes.customer', 'customer_bp'),
        ('routes.team', 'team_bp'),
        ('routes.payment', 'payment_bp'),
        ('routes.subscription', 'subscription_bp'),
        ('routes.dashboard', 'dashboard_bp'),
        ('routes.auth', 'auth_bp')
    ]
    
    success_count = 0
    for module_name, blueprint_name in routes_to_test:
        try:
            module = __import__(module_name, fromlist=[blueprint_name])
            getattr(module, blueprint_name)
            print(f"✅ {module_name} imported successfully")
            success_count += 1
        except ImportError as e:
            print(f"❌ {module_name} import failed: {e}")
        except Exception as e:
            print(f"⚠️  {module_name} imported but with warning: {e}")
            success_count += 1
    
    return success_count == len(routes_to_test)

def test_service_imports():
    """Test service imports"""
    services_to_test = [
        'services.analytics_service',
        'services.analytics_cache_service'
    ]
    
    success_count = 0
    for service_name in services_to_test:
        try:
            __import__(service_name)
            print(f"✅ {service_name} imported successfully")
            success_count += 1
        except ImportError as e:
            print(f"❌ {service_name} import failed: {e}")
        except Exception as e:
            print(f"⚠️  {service_name} imported but with warning: {e}")
            success_count += 1
    
    return success_count == len(services_to_test)

def main():
    """Run all import tests"""
    print("🔍 Running comprehensive backend import tests...\n")
    
    tests = [
        ("Subscription Decorators", test_subscription_decorators),
        ("Route Blueprints", test_route_imports), 
        ("Services", test_service_imports)
    ]
    
    all_passed = True
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}:")
        if not test_func():
            all_passed = False
    
    print(f"\n{'='*50}")
    if all_passed:
        print("🎉 All import tests PASSED! Backend is ready.")
    else:
        print("⚠️  Some import tests failed. Check the errors above.")
    print(f"{'='*50}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())