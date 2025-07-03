#!/usr/bin/env python3
"""
Debug script to identify startup issues.
"""

import sys
import os

print("🔍 Bizflow Backend Debug - Startup Issues")
print("=" * 50)

# Check Python version
print(f"Python version: {sys.version}")

# Check current directory
print(f"Current directory: {os.getcwd()}")

# Check if Flask is installed
try:
    import flask
    print(f"✅ Flask installed: {flask.__version__}")
except ImportError as e:
    print(f"❌ Flask not installed: {e}")
    print("💡 Solution: pip install flask")
    sys.exit(1)

# Check other dependencies
dependencies = [
    'flask_sqlalchemy',
    'flask_jwt_extended', 
    'flask_cors',
    'werkzeug'
]

missing_deps = []
for dep in dependencies:
    try:
        __import__(dep)
        print(f"✅ {dep} installed")
    except ImportError:
        print(f"❌ {dep} missing")
        missing_deps.append(dep)

if missing_deps:
    print(f"\n💡 Install missing dependencies:")
    print(f"pip install {' '.join(missing_deps)}")

# Check if main files exist
files_to_check = [
    'src/main.py',
    'simple_main.py',
    'start_backend.py'
]

print(f"\n📁 Checking files:")
for file in files_to_check:
    if os.path.exists(file):
        print(f"✅ {file} exists")
    else:
        print(f"❌ {file} missing")

# Try importing main module
print(f"\n🧪 Testing imports:")
try:
    sys.path.insert(0, 'src')
    from main import create_app
    print("✅ main.py imports working")
except Exception as e:
    print(f"❌ main.py import failed: {e}")
    print("💡 Try using simple_main.py instead")

print(f"\n🎯 RECOMMENDATIONS:")
print("1. If Flask is missing: pip install flask flask-sqlalchemy flask-jwt-extended flask-cors")
print("2. If main.py has issues: python simple_main.py")
print("3. If still failing: python start_backend.py")