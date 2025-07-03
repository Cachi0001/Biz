#!/usr/bin/env python3
"""
Test script to check backend functionality and identify import issues.
"""

import os
import sys
import traceback

# Add the src directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

print("🔍 Testing Bizflow Backend Components...")
print(f"Current directory: {current_dir}")
print(f"Source directory: {src_dir}")
print(f"Python path: {sys.path[:3]}...")

# Test basic imports
def test_basic_imports():
    print("\n📦 Testing basic imports...")
    try:
        from flask import Flask
        print("✅ Flask import successful")
        
        from flask_sqlalchemy import SQLAlchemy
        print("✅ Flask-SQLAlchemy import successful")
        
        from flask_jwt_extended import JWTManager
        print("✅ Flask-JWT-Extended import successful")
        
        from flask_cors import CORS
        print("✅ Flask-CORS import successful")
        
        return True
    except Exception as e:
        print(f"❌ Basic imports failed: {e}")
        return False

# Test model imports
def test_model_imports():
    print("\n🗄️ Testing model imports...")
    models_to_test = [
        'models.user',
        'models.customer', 
        'models.product',
        'models.invoice',
        'models.payment',
        'models.expense',
        'models.sale',
        'models.referral'
    ]
    
    successful_models = []
    failed_models = []
    
    for model in models_to_test:
        try:
            __import__(model)
            print(f"✅ {model} import successful")
            successful_models.append(model)
        except Exception as e:
            print(f"❌ {model} import failed: {e}")
            failed_models.append((model, str(e)))
    
    return successful_models, failed_models

# Test service imports
def test_service_imports():
    print("\n🔧 Testing service imports...")
    services_to_test = [
        'services.paystack_service',
        'services.email_service',
        'services.pdf_service',
        'services.excel_service',
        'services.cloudinary_service'
    ]
    
    successful_services = []
    failed_services = []
    
    for service in services_to_test:
        try:
            __import__(service)
            print(f"✅ {service} import successful")
            successful_services.append(service)
        except Exception as e:
            print(f"❌ {service} import failed: {e}")
            failed_services.append((service, str(e)))
    
    return successful_services, failed_services

# Test route imports
def test_route_imports():
    print("\n🛣️ Testing route imports...")
    routes_to_test = [
        'routes.auth',
        'routes.user',
        'routes.customer',
        'routes.product',
        'routes.invoice',
        'routes.payment',
        'routes.dashboard',
        'routes.expense',
        'routes.sale',
        'routes.referral',
        'routes.subscription'
    ]
    
    successful_routes = []
    failed_routes = []
    
    for route in routes_to_test:
        try:
            __import__(route)
            print(f"✅ {route} import successful")
            successful_routes.append(route)
        except Exception as e:
            print(f"❌ {route} import failed: {e}")
            failed_routes.append((route, str(e)))
    
    return successful_routes, failed_routes

# Test Flask app creation
def test_app_creation():
    print("\n🚀 Testing Flask app creation...")
    try:
        from flask import Flask
        app = Flask(__name__)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        
        print("✅ Basic Flask app created successfully")
        return app
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        traceback.print_exc()
        return None

# Test database initialization
def test_database_init(app):
    print("\n🗃️ Testing database initialization...")
    try:
        from flask_sqlalchemy import SQLAlchemy
        db = SQLAlchemy()
        db.init_app(app)
        
        with app.app_context():
            db.create_all()
        
        print("✅ Database initialization successful")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        traceback.print_exc()
        return False

# Main test function
def main():
    print("🎯 Bizflow SME Nigeria - Backend Testing")
    print("=" * 50)
    
    # Test basic imports
    if not test_basic_imports():
        print("\n❌ Basic imports failed. Please install required packages:")
        print("pip install flask flask-sqlalchemy flask-jwt-extended flask-cors")
        return
    
    # Test model imports
    successful_models, failed_models = test_model_imports()
    
    # Test service imports  
    successful_services, failed_services = test_service_imports()
    
    # Test route imports
    successful_routes, failed_routes = test_route_imports()
    
    # Test app creation
    app = test_app_creation()
    if app:
        test_database_init(app)
    
    # Summary
    print("\n📊 TESTING SUMMARY")
    print("=" * 50)
    print(f"✅ Successful models: {len(successful_models)}")
    print(f"❌ Failed models: {len(failed_models)}")
    print(f"✅ Successful services: {len(successful_services)}")
    print(f"❌ Failed services: {len(failed_services)}")
    print(f"✅ Successful routes: {len(successful_routes)}")
    print(f"❌ Failed routes: {len(failed_routes)}")
    
    if failed_models:
        print(f"\n❌ Failed model imports:")
        for model, error in failed_models:
            print(f"   - {model}: {error}")
    
    if failed_services:
        print(f"\n❌ Failed service imports:")
        for service, error in failed_services:
            print(f"   - {service}: {error}")
    
    if failed_routes:
        print(f"\n❌ Failed route imports:")
        for route, error in failed_routes:
            print(f"   - {route}: {error}")
    
    # Determine overall status
    total_components = len(successful_models) + len(failed_models) + len(successful_services) + len(failed_services) + len(successful_routes) + len(failed_routes)
    successful_components = len(successful_models) + len(successful_services) + len(successful_routes)
    
    success_rate = (successful_components / total_components) * 100 if total_components > 0 else 0
    
    print(f"\n🎯 Overall Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend is mostly functional!")
    elif success_rate >= 60:
        print("⚠️ Backend has some issues but is partially functional")
    else:
        print("❌ Backend has significant issues that need to be fixed")

if __name__ == "__main__":
    main()