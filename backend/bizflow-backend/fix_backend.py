#!/usr/bin/env python3
"""
Backend Fix Script for Bizflow SME Nigeria
This script fixes common backend issues and ensures all services are working properly.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            return True
        else:
            print(f"❌ {description} failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} failed with exception: {e}")
        return False

def check_python_path():
    """Check and fix Python path issues"""
    print("🔍 Checking Python path configuration...")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
        print("✅ Added current directory to Python path")
    
    return True

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        'flask', 'flask-sqlalchemy', 'flask-jwt-extended', 
        'flask-cors', 'flask-mail', 'python-dotenv',
        'cloudinary', 'paystack', 'reportlab', 'openpyxl',
        'requests', 'pillow', 'pymysql'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} is missing")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages: {', '.join(missing_packages)}")
        install_cmd = f"pip install {' '.join(missing_packages)}"
        return run_command(install_cmd, "Installing missing dependencies")
    
    return True

def check_environment_file():
    """Check if .env file exists and has required variables"""
    print("🔍 Checking environment configuration...")
    
    env_path = Path('.env')
    if not env_path.exists():
        print("❌ .env file not found")
        return False
    
    required_vars = [
        'SECRET_KEY', 'JWT_SECRET_KEY', 'DATABASE_URL',
        'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
        'PAYSTACK_SECRET_KEY', 'PAYSTACK_PUBLIC_KEY'
    ]
    
    with open(env_path, 'r') as f:
        env_content = f.read()
    
    missing_vars = []
    for var in required_vars:
        if f"{var}=" not in env_content:
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("Please add these to your .env file")
        return False
    
    print("✅ Environment file is properly configured")
    return True

def test_imports():
    """Test if all imports work correctly"""
    print("🔍 Testing imports...")
    
    try:
        # Test Flask imports
        from flask import Flask
        from flask_sqlalchemy import SQLAlchemy
        from flask_jwt_extended import JWTManager
        from flask_cors import CORS
        print("✅ Flask imports successful")
        
        # Test local imports
        from src.models.user import User, db
        from src.routes.auth import auth_bp
        from src.services.paystack_service import PaystackService
        print("✅ Local imports successful")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def create_missing_files():
    """Create any missing __init__.py files"""
    print("🔧 Creating missing __init__.py files...")
    
    directories = [
        'src',
        'src/models',
        'src/routes', 
        'src/services'
    ]
    
    for directory in directories:
        init_file = Path(directory) / '__init__.py'
        if not init_file.exists():
            init_file.parent.mkdir(parents=True, exist_ok=True)
            init_file.write_text('# This file makes the directory a Python package\n')
            print(f"✅ Created {init_file}")
    
    return True

def test_database_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    
    try:
        from src.main import create_app
        app = create_app()
        
        with app.app_context():
            from src.models.user import db
            # Try to create tables
            db.create_all()
            print("✅ Database connection successful")
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main fix function"""
    print("🚀 Starting Bizflow Backend Fix Script")
    print("=" * 50)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    checks = [
        ("Python Path", check_python_path),
        ("Dependencies", check_dependencies),
        ("Environment File", check_environment_file),
        ("Missing Files", create_missing_files),
        ("Imports", test_imports),
        ("Database Connection", test_database_connection)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n📋 Running {name} check...")
        success = check_func()
        results.append((name, success))
    
    print("\n" + "=" * 50)
    print("🏁 Fix Script Results:")
    print("=" * 50)
    
    all_passed = True
    for name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{name}: {status}")
        if not success:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All checks passed! Your backend should be working now.")
        print("\nTo start the server, run:")
        print("python run.py")
    else:
        print("⚠️  Some checks failed. Please review the errors above.")
        print("You may need to manually fix some issues before the backend will work.")
    
    print("=" * 50)

if __name__ == '__main__':
    main()