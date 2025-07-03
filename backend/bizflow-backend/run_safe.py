#!/usr/bin/env python3
"""
Safe backend runner that handles common startup issues.
"""

import sys
import os

def check_dependencies():
    """Check if all required dependencies are installed."""
    required = ['flask', 'flask_sqlalchemy', 'flask_jwt_extended', 'flask_cors']
    missing = []
    
    for dep in required:
        try:
            __import__(dep)
        except ImportError:
            missing.append(dep)
    
    return missing

def install_dependencies(missing):
    """Install missing dependencies."""
    import subprocess
    
    print(f"📦 Installing missing dependencies: {missing}")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)
        return True
    except subprocess.CalledProcessError:
        return False

def run_backend():
    """Try to run the backend with different methods."""
    
    print("🚀 Bizflow SME Nigeria - Safe Backend Runner")
    print("=" * 50)
    
    # Check dependencies
    missing = check_dependencies()
    if missing:
        print(f"❌ Missing dependencies: {missing}")
        print("🔧 Attempting to install...")
        
        if install_dependencies(missing):
            print("✅ Dependencies installed successfully")
        else:
            print("❌ Failed to install dependencies")
            print("💡 Please run manually: pip install flask flask-sqlalchemy flask-jwt-extended flask-cors")
            return False
    
    # Try different backend versions
    backends_to_try = [
        ('simple_main.py', 'Simplified Backend'),
        ('start_backend.py', 'Smart Backend Starter'),
        ('src/main.py', 'Original Backend')
    ]
    
    for backend_file, description in backends_to_try:
        if os.path.exists(backend_file):
            print(f"🧪 Trying {description} ({backend_file})...")
            try:
                if backend_file == 'src/main.py':
                    # Special handling for src/main.py
                    sys.path.insert(0, 'src')
                    from main import create_app
                    app = create_app()
                    print(f"✅ {description} loaded successfully")
                    port = int(os.environ.get("PORT", 5000))
                    app.run(host="0.0.0.0", port=port, debug=True)
                    return True
                else:
                    # Execute other files directly
                    exec(open(backend_file).read())
                    return True
                    
            except Exception as e:
                print(f"❌ {description} failed: {e}")
                continue
        else:
            print(f"⚠️ {backend_file} not found")
    
    print("❌ All backend options failed")
    return False

if __name__ == "__main__":
    success = run_backend()
    if not success:
        print("\n🆘 TROUBLESHOOTING STEPS:")
        print("1. Install dependencies: pip install flask flask-sqlalchemy flask-jwt-extended flask-cors")
        print("2. Check Python version: python --version (should be 3.7+)")
        print("3. Try manual start: python simple_main.py")
        print("4. Check for typos in file names")
        sys.exit(1)