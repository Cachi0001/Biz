#!/usr/bin/env python3
"""
Quick test script to verify SabiOps backend functionality
Run this from the backend directory: python tmp_rovodev_test_backend.py
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER = {
    "email": "test@sabiops.com",
    "phone": "08012345678",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User",
    "business_name": "Test Business"
}

def test_backend():
    print("🔍 Testing SabiOps Backend...")
    print("=" * 50)
    
    # Test 1: Health Check
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health Check: PASSED")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health Check: FAILED ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Health Check: FAILED - {e}")
        return False
    
    # Test 2: Database Connection
    try:
        response = requests.get(f"{BASE_URL}/test-db", timeout=10)
        if response.status_code == 200:
            print("✅ Database Connection: PASSED")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Database Connection: FAILED ({response.status_code})")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Database Connection: FAILED - {e}")
        return False
    
    # Test 3: User Registration
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register", 
            json=TEST_USER,
            timeout=10
        )
        if response.status_code == 201:
            print("✅ User Registration: PASSED")
            data = response.json()
            print(f"   User ID: {data.get('user', {}).get('id', 'N/A')}")
            print(f"   Token: {'Present' if data.get('access_token') else 'Missing'}")
            return True
        else:
            print(f"❌ User Registration: FAILED ({response.status_code})")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ User Registration: FAILED - {e}")
        return False

if __name__ == "__main__":
    print("Make sure your Flask backend is running on http://localhost:5000")
    print("Run: cd backend/sabiops-backend && python src/main.py")
    print()
    
    success = test_backend()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Backend is working correctly!")
        print("You can now test the frontend registration.")
    else:
        print("🚨 Backend has issues. Check the errors above.")
        print("Make sure:")
        print("1. Flask backend is running")
        print("2. Supabase credentials are correct")
        print("3. RLS policies are disabled")