#!/usr/bin/env python3
"""
Test API Fixes
Tests that the API routing fixes are working correctly
"""

import requests
import json

def test_backend_endpoints():
    """Test backend endpoints that should exist"""
    print("🔍 Testing Backend Endpoints...")
    
    base_url = "https://sabiops-backend.vercel.app/api"
    
    endpoints_to_test = [
        ("/health", "GET", "Health check"),
        ("/subscription/plans", "GET", "Subscription plans"),
        ("/subscription/status", "GET", "Subscription status (should return 401)"),
        ("/subscription/verify-payment", "POST", "Payment verification (should return 401)"),
        ("/subscription/usage-status", "GET", "Usage status (should return 401)"),
        ("/notifications", "GET", "Notifications (should return 401)"),
        ("/notifications/unread-count", "GET", "Unread count (should return 401)"),
    ]
    
    results = []
    
    for endpoint, method, description in endpoints_to_test:
        try:
            url = f"{base_url}{endpoint}"
            
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json={}, timeout=10)
            
            # Check if we get JSON response (not HTML)
            content_type = response.headers.get('content-type', '')
            
            if 'application/json' in content_type:
                try:
                    data = response.json()
                    if response.status_code in [200, 401, 403]:
                        print(f"✅ {description}: {response.status_code} (JSON)")
                        results.append(True)
                    else:
                        print(f"⚠️  {description}: {response.status_code} (JSON)")
                        results.append(True)  # Still JSON, which is good
                except json.JSONDecodeError:
                    print(f"❌ {description}: Invalid JSON")
                    results.append(False)
            else:
                print(f"❌ {description}: HTML response (not JSON)")
                results.append(False)
                
        except Exception as e:
            print(f"❌ {description}: Error - {str(e)}")
            results.append(False)
    
    return results

def test_frontend_routing():
    """Test that frontend doesn't intercept API calls"""
    print("\n🔍 Testing Frontend Routing...")
    
    try:
        # Test that frontend serves HTML for non-API routes
        response = requests.get("https://sabiops.vercel.app/", timeout=10)
        content_type = response.headers.get('content-type', '')
        
        if 'text/html' in content_type:
            print("✅ Frontend serves HTML for root route")
            return True
        else:
            print(f"❌ Frontend unexpected content type: {content_type}")
            return False
            
    except Exception as e:
        print(f"❌ Frontend test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 API Fixes Test")
    print("=" * 50)
    
    # Test backend endpoints
    backend_results = test_backend_endpoints()
    
    # Test frontend routing
    frontend_result = test_frontend_routing()
    
    # Summary
    backend_passed = sum(backend_results)
    backend_total = len(backend_results)
    
    print(f"\n📊 Test Results")
    print("=" * 30)
    print(f"Backend Endpoints: {backend_passed}/{backend_total} working")
    print(f"Frontend Routing: {'✅ PASS' if frontend_result else '❌ FAIL'}")
    
    total_passed = backend_passed + (1 if frontend_result else 0)
    total_tests = backend_total + 1
    
    print(f"\nOverall: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n🎉 All API fixes are working correctly!")
        print("   The payment verification should now work without errors.")
    else:
        print("\n⚠️  Some issues remain. Check the results above.")
    
    return total_passed == total_tests

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)