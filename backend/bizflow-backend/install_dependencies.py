#!/usr/bin/env python3
"""
Install all required dependencies for Bizflow SME Nigeria backend.
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip."""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("🔧 Installing Bizflow SME Nigeria Backend Dependencies")
    print("=" * 60)
    
    # Essential packages for basic functionality
    essential_packages = [
        "flask",
        "flask-sqlalchemy", 
        "flask-jwt-extended",
        "flask-cors",
        "python-dotenv",
        "werkzeug"
    ]
    
    # Additional packages for full functionality
    additional_packages = [
        "flask-mail",
        "requests",
        "pillow",
        "reportlab",
        "openpyxl",
        "cloudinary",
        "paystack",
        "pytest",
        "pytest-flask"
    ]
    
    print("📦 Installing essential packages...")
    failed_essential = []
    
    for package in essential_packages:
        print(f"Installing {package}...", end=" ")
        if install_package(package):
            print("✅")
        else:
            print("❌")
            failed_essential.append(package)
    
    print("\n📦 Installing additional packages...")
    failed_additional = []
    
    for package in additional_packages:
        print(f"Installing {package}...", end=" ")
        if install_package(package):
            print("✅")
        else:
            print("❌")
            failed_additional.append(package)
    
    print("\n📊 INSTALLATION SUMMARY")
    print("=" * 30)
    
    if not failed_essential:
        print("✅ All essential packages installed successfully!")
        print("🚀 Backend is ready to run!")
    else:
        print(f"❌ Failed essential packages: {failed_essential}")
        print("⚠️ Backend may not work properly")
    
    if failed_additional:
        print(f"⚠️ Failed additional packages: {failed_additional}")
        print("📝 Some advanced features may not work")
    
    print("\n🎯 NEXT STEPS:")
    if not failed_essential:
        print("1. Run: python simple_main.py")
        print("2. Or run: python start_backend.py")
        print("3. Test: curl http://localhost:5000/api/health")
    else:
        print("1. Try installing failed packages manually:")
        for pkg in failed_essential:
            print(f"   pip install {pkg}")
        print("2. Then run the backend")

if __name__ == "__main__":
    main()