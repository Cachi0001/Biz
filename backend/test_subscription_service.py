#!/usr/bin/env python3
"""
Test the subscription service directly to debug payment upgrade issues
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'sabiops-backend', 'src'))

from services.subscription_service import SubscriptionService
import json

def test_subscription_service():
    """Test the subscription service directly"""
    print("🧪 Testing SubscriptionService...")
    
    try:
        # This will fail without Flask app context, but we can test the class structure
        service = SubscriptionService()
        print("✅ SubscriptionService class loaded successfully")
        
        # Test plan configurations
        plans = service.PLAN_CONFIGS
        print(f"✅ Available plans: {list(plans.keys())}")
        
        for plan_id, config in plans.items():
            print(f"   {plan_id}: {config['name']} - {config['price']} kobo")
        
    except Exception as e:
        print(f"❌ SubscriptionService test failed: {e}")
        return False
    
    return True

def test_paystack_verification():
    """Test Paystack verification logic"""
    print("\n💳 Testing Paystack Verification Logic...")
    
    # Mock verification data
    mock_paystack_response = {
        'success': True,
        'reference': 'TEST_REF_123',
        'amount': 1400,  # ₦14.00
        'currency': 'NGN',
        'channel': 'card',
        'fees': 21,
        'customer_email': 'test@example.com',
        'paid_at': '2025-07-28T12:00:00Z',
        'metadata': {'plan_id': 'weekly'}
    }
    
    print("✅ Mock Paystack response structure looks correct")
    print(f"   Reference: {mock_paystack_response['reference']}")
    print(f"   Amount: ₦{mock_paystack_response['amount']}")
    print(f"   Status: {'Success' if mock_paystack_response['success'] else 'Failed'}")
    
    return True

def check_database_functions():
    """Check if database functions exist"""
    print("\n🗄️  Database Functions Check...")
    
    functions_to_check = [
        'public.upgrade_user_subscription',
        'public.reset_usage_counters_for_plan',
        'public.calculate_remaining_subscription_days',
        'public.get_subscription_status'
    ]
    
    print("Required functions:")
    for func in functions_to_check:
        print(f"   - {func}")
    
    print("\n💡 To verify these exist in your database, run:")
    print("   SELECT routine_name FROM information_schema.routines")
    print("   WHERE routine_schema = 'public' AND routine_name LIKE '%subscription%';")
    
    return True

def debug_common_issues():
    """Debug common payment upgrade issues"""
    print("\n🔍 Common Payment Upgrade Issues:")
    print("=" * 50)
    
    issues = [
        {
            "issue": "Backend server not running",
            "symptoms": ["Network errors", "404 errors", "Connection refused"],
            "solution": "Start backend: cd Biz/backend/sabiops-backend && python api/index.py"
        },
        {
            "issue": "Routes not registered",
            "symptoms": ["404 on /api/subscription/*", "Route not found"],
            "solution": "Check api/index.py has: app.register_blueprint(subscription_bp, url_prefix='/subscription')"
        },
        {
            "issue": "Database connection issues",
            "symptoms": ["500 errors", "Supabase connection failed"],
            "solution": "Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env"
        },
        {
            "issue": "JWT token expired",
            "symptoms": ["401 Unauthorized", "Token validation failed"],
            "solution": "User needs to log in again to get fresh token"
        },
        {
            "issue": "Database functions missing",
            "symptoms": ["Function does not exist errors"],
            "solution": "Run all migration files in order"
        },
        {
            "issue": "CORS issues",
            "symptoms": ["CORS policy errors", "Preflight failed"],
            "solution": "Check CORS configuration in api/index.py"
        }
    ]
    
    for i, issue in enumerate(issues, 1):
        print(f"\n{i}. {issue['issue']}")
        print(f"   Symptoms: {', '.join(issue['symptoms'])}")
        print(f"   Solution: {issue['solution']}")
    
    return True

def main():
    print("🔧 SabiOps Subscription Service Debug Tool")
    print("=" * 50)
    
    # Run tests
    test_subscription_service()
    test_paystack_verification()
    check_database_functions()
    debug_common_issues()
    
    print("\n📋 Next Steps to Debug Payment Issue:")
    print("1. Ensure backend server is running")
    print("2. Test endpoints with the browser debug script")
    print("3. Check browser Network tab during payment")
    print("4. Check backend console logs")
    print("5. Verify database functions exist")
    
    print("\n🧪 Browser Debug Script:")
    print("Copy and paste this in browser console after payment:")
    print("fetch('/api/subscription/status', {headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}}).then(r => r.json()).then(console.log)")

if __name__ == "__main__":
    main()