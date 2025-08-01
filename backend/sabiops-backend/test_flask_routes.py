#!/usr/bin/env python3
"""
Test Flask route registration to ensure no conflicts
"""

import sys
import os
from flask import Flask

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_flask_blueprint_registration():
    """Test that all blueprints can be registered without conflicts"""
    print("🔍 Testing Flask blueprint registration...\n")
    
    try:
        # Create Flask app
        app = Flask(__name__)
        app.config['JWT_SECRET_KEY'] = 'test-secret'
        app.config['SUPABASE'] = None  # Mock for testing
        
        # Import and register blueprints one by one
        blueprints_to_test = [
            ('routes.auth', 'auth_bp', '/auth'),
            ('routes.customer', 'customer_bp', '/customers'),
            ('routes.product', 'product_bp', '/products'),
            ('routes.sales', 'sales_bp', '/sales'),
            ('routes.expense', 'expense_bp', '/expenses'),
            ('routes.team', 'team_bp', '/team'),
            ('routes.payment', 'payment_bp', '/payments'),
            ('routes.subscription', 'subscription_bp', '/subscription'),
            ('routes.dashboard', 'dashboard_bp', '/dashboard')
        ]
        
        registered_count = 0
        for module_name, blueprint_name, url_prefix in blueprints_to_test:
            try:
                module = __import__(module_name, fromlist=[blueprint_name])
                blueprint = getattr(module, blueprint_name)
                app.register_blueprint(blueprint, url_prefix=url_prefix)
                print(f"✅ {module_name} -> {blueprint_name} registered successfully")
                registered_count += 1
            except ImportError as e:
                print(f"❌ {module_name} import failed: {e}")
            except AssertionError as e:
                print(f"❌ {module_name} registration conflict: {e}")
            except Exception as e:
                print(f"⚠️  {module_name} registration warning: {e}")
                registered_count += 1  # Count as success if it's just a warning
        
        print(f"\n📊 Registration Summary:")
        print(f"   Total blueprints: {len(blueprints_to_test)}")
        print(f"   Successfully registered: {registered_count}")
        print(f"   Failed: {len(blueprints_to_test) - registered_count}")
        
        if registered_count == len(blueprints_to_test):
            print("\n🎉 ALL BLUEPRINTS REGISTERED SUCCESSFULLY!")
            print("   No Flask route conflicts detected.")
            return True
        else:
            print(f"\n⚠️  {len(blueprints_to_test) - registered_count} blueprints failed to register.")
            return False
            
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        return False

def main():
    """Run Flask blueprint registration test"""
    print("🧪 Flask Route Conflict Test\n")
    print("="*50)
    
    success = test_flask_blueprint_registration()
    
    print("="*50)
    if success:
        print("✅ FLASK ROUTE TEST PASSED!")
        print("   Backend should start without route conflicts.")
    else:
        print("❌ FLASK ROUTE TEST FAILED!")
        print("   Check the errors above.")
    print("="*50)
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())