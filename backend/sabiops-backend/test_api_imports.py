#!/usr/bin/env python3
"""
Test the exact import pattern from api/index.py
This simulates the production import scenario
"""

import sys
import os

# Add src to path (same as api/index.py)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_api_imports():
    """Test the exact imports from api/index.py"""
    print("🔍 Testing API imports (simulating production)...\n")
    
    # Test the routes that were failing
    critical_imports = [
        ("routes.product", "product_bp", "protected_product_creation"),
        ("routes.sales", "sales_bp", "protected_sales_creation"), 
        ("routes.expense", "expense_bp", "protected_expense_creation"),
        ("routes.invoice", "invoice_bp", "protected_invoice_creation")
    ]
    
    all_passed = True
    
    for route_module, blueprint_name, decorator_name in critical_imports:
        try:
            # Import the route module
            module = __import__(route_module, fromlist=[blueprint_name])
            blueprint = getattr(module, blueprint_name)
            
            # Verify the decorator is available
            import utils.subscription_decorators as decorators
            decorator = getattr(decorators, decorator_name)
            
            print(f"✅ {route_module} -> {blueprint_name} with {decorator_name}: SUCCESS")
            
        except ImportError as e:
            print(f"❌ {route_module} -> {blueprint_name}: FAILED - {e}")
            all_passed = False
        except Exception as e:
            print(f"⚠️  {route_module} -> {blueprint_name}: WARNING - {e}")
    
    # Test analytics decorators used in dashboard
    try:
        from utils.subscription_decorators import (
            check_analytics_access,
            get_subscription_upgrade_info,
            analytics_access_required
        )
        print("✅ Analytics decorators: SUCCESS")
    except ImportError as e:
        print(f"❌ Analytics decorators: FAILED - {e}")
        all_passed = False
    
    print(f"\n{'='*60}")
    if all_passed:
        print("🎉 ALL CRITICAL IMPORTS WORKING! Backend should start successfully.")
    else:
        print("❌ Some critical imports failed. Backend may not start.")
    print(f"{'='*60}")
    
    return all_passed

if __name__ == "__main__":
    success = test_api_imports()
    exit(0 if success else 1)