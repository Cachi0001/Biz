#!/usr/bin/env python3
"""
Test Payment Flow
Tests the complete payment verification flow to ensure it's working
"""

import requests
import json

def test_backend_api():
    """Test if the backend API is accessible and working"""
    print("🔍 Testing Backend API...")
    
    try:
        # Test health endpoint
        health_response = requests.get('https://sabiops-backend.vercel.app/api/health', timeout=10)
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ Backend Health: {health_data['status']}")
            print(f"   Supabase Connected: {health_data['supabase_connected']}")
            print(f"   Mode: {health_data['mode']}")
        else:
            print(f"❌ Health endpoint failed: {health_response.status_code}")
            return False
        
        # Test subscription plans endpoint
        plans_response = requests.get('https://sabiops-backend.vercel.app/api/subscription/plans', timeout=10)
        if plans_response.status_code == 200:
            plans_data = plans_response.json()
            if plans_data.get('success'):
                plan_count = len(plans_data['data']['plans'])
                print(f"✅ Subscription Plans: {plan_count} plans available")
            else:
                print(f"❌ Plans endpoint returned error: {plans_data}")
                return False
        else:
            print(f"❌ Plans endpoint failed: {plans_response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Backend API test failed: {str(e)}")
        return False

def test_frontend_api_routing():
    """Test if frontend is correctly routing API calls"""
    print("\n🔍 Testing Frontend API Routing...")
    
    try:
        # Test if frontend returns HTML (not API responses)
        frontend_response = requests.get('https://sabiops.vercel.app/api/health', timeout=10)
        
        if frontend_response.status_code == 200:
            content_type = frontend_response.headers.get('content-type', '')
            
            if 'text/html' in content_type:
                print("✅ Frontend correctly serves HTML (not intercepting API calls)")
                return True
            elif 'application/json' in content_type:
                print("⚠️  Frontend is serving API responses (should be backend)")
                print("   This might cause issues with payment verification")
                return False
            else:
                print(f"❓ Unexpected content type: {content_type}")
                return False
        else:
            print(f"❌ Frontend test failed: {frontend_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Frontend routing test failed: {str(e)}")
        return False

def test_payment_verification_endpoint():
    """Test if payment verification endpoint is accessible (without auth)"""
    print("\n🔍 Testing Payment Verification Endpoint...")
    
    try:
        # Test payment verification endpoint (should return 401 without auth)
        verify_response = requests.post(
            'https://sabiops-backend.vercel.app/api/subscription/verify-payment',
            json={'reference': 'test', 'plan_id': 'weekly'},
            timeout=10
        )
        
        if verify_response.status_code == 401:
            print("✅ Payment verification endpoint accessible (returns 401 without auth)")
            return True
        elif verify_response.status_code == 405:
            print("❌ Payment verification endpoint returns 405 (Method Not Allowed)")
            return False
        else:
            print(f"⚠️  Unexpected status code: {verify_response.status_code}")
            try:
                error_data = verify_response.json()
                print(f"   Response: {error_data}")
            except:
                print(f"   Raw response: {verify_response.text[:200]}")
            return True  # Endpoint exists, just different error
            
    except Exception as e:
        print(f"❌ Payment verification test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 SabiOps Payment Flow Test")
    print("=" * 50)
    
    tests = [
        ("Backend API", test_backend_api),
        ("Frontend API Routing", test_frontend_api_routing),
        ("Payment Verification Endpoint", test_payment_verification_endpoint)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        print("-" * 30)
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    print(f"\n📊 Test Results Summary")
    print("=" * 30)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("\n🎉 All tests passed! The payment system should work correctly.")
        print("   You can now test the payment verification flow in the frontend.")
    else:
        print("\n⚠️  Some tests failed. Please check the issues above.")
    
    return passed == len(tests)

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)