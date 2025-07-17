#!/usr/bin/env python3
"""
Authentication Test for SabiOps Backend
Tests the complete auth flow to verify backend is working
"""

import requests
import json

def test_auth_flow():
    base_url = "https://sabiops-backend.vercel.app/api"
    
    print("🔐 Testing SabiOps Authentication Flow")
    print("=" * 50)
    
    # Test 1: Register a test user
    print("\n1️⃣ Testing User Registration...")
    register_data = {
        "full_name": "Test User",
        "email": "test@sabiops.com",
        "phone": "+2348012345678",
        "password": "TestPassword123!",
        "business_name": "Test Business"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=register_data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
        elif response.status_code == 400:
            print("⚠️ Registration failed (user might already exist)")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Registration error: {e}")
    
    # Test 2: Login with the test user
    print("\n2️⃣ Testing User Login...")
    login_data = {
        "login": "test@sabiops.com",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            if token:
                print("✅ Login successful! Got JWT token")
                
                # Test 3: Use token to access protected endpoint
                print("\n3️⃣ Testing Protected Endpoint Access...")
                headers = {"Authorization": f"Bearer {token}"}
                
                protected_response = requests.get(f"{base_url}/customers/", headers=headers, timeout=10)
                print(f"Protected endpoint status: {protected_response.status_code}")
                
                if protected_response.status_code == 200:
                    print("✅ Protected endpoint access successful!")
                    print("🎉 BACKEND IS FULLY FUNCTIONAL!")
                    return True
                else:
                    print(f"⚠️ Protected endpoint returned: {protected_response.status_code}")
                    print(f"Response: {protected_response.text[:200]}...")
            else:
                print("❌ Login successful but no token received")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ Login error: {e}")
    
    return False

if __name__ == "__main__":
    success = test_auth_flow()
    
    if success:
        print("\n🎉 CONCLUSION: Backend is working perfectly!")
        print("The issue is in the frontend authentication flow.")
    else:
        print("\n🔍 Backend needs investigation.")
        print("Check the specific error messages above.")