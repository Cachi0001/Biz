#!/usr/bin/env python3
"""
Quick test script to verify notification system is working
Run this to test if notifications can be created and retrieved
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5000"  # Change this to your backend URL
JWT_TOKEN = None  # You'll need to get this from your login

def test_notification_system():
    """Test the notification system end-to-end"""
    
    if not JWT_TOKEN:
        print("❌ Please set JWT_TOKEN in the script first")
        print("   1. Login to your app")
        print("   2. Get the JWT token from localStorage")
        print("   3. Set JWT_TOKEN variable in this script")
        return False
    
    headers = {
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print("🧪 Testing Notification System...")
    print("=" * 50)
    
    # Test 1: Create a test notification
    print("1️⃣ Creating test notification...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/test/test-notification-create",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test notification created: {data.get('notification_id')}")
            print(f"   User ID: {data.get('user_id')}")
        else:
            print(f"❌ Failed to create test notification: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating test notification: {e}")
        return False
    
    # Test 2: Fetch notifications
    print("\n2️⃣ Fetching notifications...")
    try:
        response = requests.get(
            f"{BASE_URL}/notifications/",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            notifications = data.get('data', {}).get('notifications', [])
            unread_count = data.get('data', {}).get('unread_count', 0)
            
            print(f"✅ Fetched {len(notifications)} notifications")
            print(f"   Unread count: {unread_count}")
            
            if notifications:
                latest = notifications[0]
                print(f"   Latest: {latest.get('title')} - {latest.get('message')}")
            else:
                print("   No notifications found")
                
        else:
            print(f"❌ Failed to fetch notifications: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error fetching notifications: {e}")
        return False
    
    # Test 3: Check products for low stock
    print("\n3️⃣ Checking products for low stock...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/test/check-products",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            products_data = data.get('data', {})
            total_products = products_data.get('total_products', 0)
            low_stock_products = products_data.get('low_stock_products', [])
            
            print(f"✅ Found {total_products} total products")
            print(f"   Low stock products: {len(low_stock_products)}")
            
            for product in low_stock_products:
                print(f"   - {product['name']}: {product['quantity']} (threshold: {product['threshold']})")
                
        else:
            print(f"❌ Failed to check products: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error checking products: {e}")
    
    # Test 4: Run low stock check
    print("\n4️⃣ Running low stock check...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/test/test-low-stock",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            result_data = data.get('data', {})
            products_checked = result_data.get('products_checked', 0)
            notifications_sent = result_data.get('notifications_sent', 0)
            
            print(f"✅ Low stock check completed")
            print(f"   Products checked: {products_checked}")
            print(f"   Notifications sent: {notifications_sent}")
            
        else:
            print(f"❌ Failed to run low stock check: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error running low stock check: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Notification system test completed!")
    print("\nNext steps:")
    print("1. Check your notification bell in the frontend")
    print("2. Look for any new notifications")
    print("3. Try creating a product with low stock to trigger real notifications")
    
    return True

if __name__ == "__main__":
    print("🔧 SabiOps Notification System Tester")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        JWT_TOKEN = sys.argv[1]
        print(f"Using JWT token from command line")
    else:
        print("Usage: python test_notification_system.py <JWT_TOKEN>")
        print("Or edit the script to set JWT_TOKEN variable")
        print("\nTo get your JWT token:")
        print("1. Login to your SabiOps app")
        print("2. Open browser developer tools (F12)")
        print("3. Go to Application/Storage > Local Storage")
        print("4. Copy the 'token' value")
        sys.exit(1)
    
    test_notification_system()