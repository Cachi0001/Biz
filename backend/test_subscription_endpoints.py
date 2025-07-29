#!/usr/bin/env python3
"""
Test Subscription Endpoints
Tests the subscription API endpoints to verify they're working correctly
"""

import requests
import json
import sys

def test_endpoint(url, method='GET', headers=None, data=None, description=""):
    """Test a single API endpoint"""
    print(f"\n🔍 Testing: {description}")
    print(f"   {method} {url}")
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=10)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
        
        print(f"   Status: {response.status_code}")
        
        # Try to parse JSON response
        try:
            json_data = response.json()
            print(f"   Response: {json.dumps(json_data, indent=2)[:200]}...")
            
            if response.status_code == 200:
                print("✅ Endpoint working correctly")
                return True
            else:
                print(f"⚠️  Endpoint returned {response.status_code}")
                return False
                
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response")
            print(f"   Raw response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        return False

def main():
    """Test all subscription endpoints"""
    print("🚀 SabiOps Subscription Endpoints Test")
    print("=" * 50)
    
    base_url = "https://sabiops.vercel.app/api"
    
    # Test endpoints that don't require authentication
    endpoints = [
        {
            'url': f'{base_url}/health',
            'method': 'GET',
            'description': 'Health check endpoint'
        },
        {
            'url': f'{base_url}/subscription/plans',
            'method': 'GET', 
            'description': 'Get available subscription plans'
        }
    ]
    
    success_count = 0
    total_count = len(endpoints)
    
    for endpoint in endpoints:
        if test_endpoint(**endpoint):
            success_count += 1
    
    print(f"\n📊 Test Results: {success_count}/{total_count} endpoints working")
    
    if success_count == total_count:
        print("🎉 All basic endpoints are working!")
        print("   The subscription system backend appears to be functional.")
        
        # Additional test with authentication (if token provided)
        print("\n💡 To test authenticated endpoints, you need a valid JWT token.")
        print("   You can get one by logging in through the frontend.")
        
    else:
        print("❌ Some endpoints are not working correctly.")
        print("   Please check the backend deployment and database connection.")
    
    return success_count == total_count

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)