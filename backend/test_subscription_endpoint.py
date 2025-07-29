#!/usr/bin/env python3
"""
Test script to verify subscription endpoints are working
Run this to debug the payment upgrade issue
"""

import requests
import json
import sys

# Test configuration
BASE_URL = "http://localhost:5000"  # Adjust if your server runs on different port
TEST_TOKEN = "your_jwt_token_here"  # Replace with actual JWT token

def test_subscription_endpoints():
    """Test all subscription endpoints"""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEST_TOKEN}"
    }
    
    print("🧪 Testing Subscription Endpoints...")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health Check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False
    
    # Test 2: List available plans
    try:
        response = requests.get(f"{BASE_URL}/subscription/plans")
        print(f"✅ Plans Endpoint: {response.status_code}")
        if response.status_code == 200:
            plans = response.json()
            print(f"   Available plans: {list(plans.get('data', {}).get('plans', {}).keys())}")
    except Exception as e:
        print(f"❌ Plans Endpoint Failed: {e}")
    
    # Test 3: Get subscription status (requires auth)
    if TEST_TOKEN != "your_jwt_token_here":
        try:
            response = requests.get(f"{BASE_URL}/subscription/status", headers=headers)
            print(f"✅ Status Endpoint: {response.status_code}")
            if response.status_code == 200:
                status = response.json()
                print(f"   Current status: {status.get('data', {}).get('subscription_plan', 'unknown')}")
        except Exception as e:
            print(f"❌ Status Endpoint Failed: {e}")
    else:
        print("⚠️  Skipping authenticated endpoints (no token provided)")
    
    # Test 4: Test payment verification endpoint structure
    try:
        # This should return 401 (unauthorized) but not 404 (not found)
        response = requests.post(f"{BASE_URL}/subscription/verify-payment", 
                                json={"reference": "test", "plan_id": "weekly"})
        print(f"✅ Verify Payment Endpoint: {response.status_code}")
        if response.status_code == 404:
            print("❌ ERROR: Endpoint not found! Routes not properly registered.")
        elif response.status_code == 401:
            print("   ✅ Endpoint exists (returns 401 unauthorized as expected)")
    except Exception as e:
        print(f"❌ Verify Payment Endpoint Failed: {e}")
    
    print("\n🔍 Debug Information:")
    print(f"   Base URL: {BASE_URL}")
    print(f"   Expected endpoints:")
    print(f"   - GET  {BASE_URL}/subscription/status")
    print(f"   - POST {BASE_URL}/subscription/verify-payment")
    print(f"   - GET  {BASE_URL}/subscription/plans")
    
    return True

def test_paystack_flow():
    """Test the PaystackService flow"""
    print("\n💳 Testing PaystackService Flow...")
    print("=" * 50)
    
    # Check if frontend is calling the right endpoint
    print("Frontend should call: POST /api/subscription/verify-payment")
    print("With body: {reference: 'PAYSTACK_REF', plan_id: 'weekly|monthly|yearly'}")
    
    # Common issues
    print("\n🚨 Common Issues:")
    print("1. Backend server not running")
    print("2. Routes not properly registered")
    print("3. CORS issues blocking requests")
    print("4. JWT token expired or invalid")
    print("5. Database connection issues")
    print("6. Supabase service key issues")

if __name__ == "__main__":
    print("🔧 SabiOps Subscription Endpoint Tester")
    print("=" * 50)
    
    # Get token from user if provided
    if len(sys.argv) > 1:
        TEST_TOKEN = sys.argv[1]
        print(f"Using provided JWT token: {TEST_TOKEN[:20]}...")
    
    test_subscription_endpoints()
    test_paystack_flow()
    
    print("\n📋 Next Steps:")
    print("1. Ensure your backend server is running")
    print("2. Check browser network tab during payment")
    print("3. Check backend logs for errors")
    print("4. Verify JWT token is valid")
    print("5. Test with curl:")
    print(f"   curl -X POST {BASE_URL}/subscription/verify-payment \\")
    print("        -H 'Content-Type: application/json' \\")
    print("        -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print("        -d '{\"reference\":\"test\",\"plan_id\":\"weekly\"}'")