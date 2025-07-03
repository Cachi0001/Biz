#!/usr/bin/env python3
"""
Simple test runner to check what's working in the backend.
"""

import os
import sys

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print("🔍 Quick Backend Test")
print("=" * 30)

# Test 1: Check if we can import Flask
try:
    from flask import Flask
    print("✅ Flask available")
except ImportError as e:
    print(f"❌ Flask not available: {e}")
    sys.exit(1)

# Test 2: Check if we can create a basic app
try:
    app = Flask(__name__)
    print("✅ Flask app created")
except Exception as e:
    print(f"❌ Flask app creation failed: {e}")
    sys.exit(1)

# Test 3: Check if we can import from src
try:
    sys.path.insert(0, os.path.join(current_dir, 'src'))
    print("✅ Source path added")
except Exception as e:
    print(f"❌ Source path error: {e}")

# Test 4: Try to import main module
try:
    from src.main import create_app
    print("✅ Main module imported")
    
    # Try to create the app
    app = create_app()
    print("✅ App created successfully")
    
    # Test the health endpoint
    with app.test_client() as client:
        response = client.get('/api/health')
        if response.status_code == 200:
            print("✅ Health endpoint working")
            print(f"   Response: {response.get_json()}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            
except Exception as e:
    print(f"❌ Main module import failed: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Test completed!")