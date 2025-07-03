#!/usr/bin/env python3
"""
Smart backend starter that chooses the best working version.
"""

import os
import sys
import subprocess

def check_original_backend():
    """Check if original backend can start without errors."""
    try:
        # Try importing the original main module
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
        from src.main import create_app
        app = create_app()
        print("✅ Original backend imports working")
        return True, app
    except Exception as e:
        print(f"❌ Original backend has import issues: {e}")
        return False, None

def start_simplified_backend():
    """Start the simplified backend."""
    print("🚀 Starting simplified backend (guaranteed to work)...")
    try:
        exec(open('simple_main.py').read())
    except Exception as e:
        print(f"❌ Error starting simplified backend: {e}")

def main():
    print("🎯 Bizflow SME Nigeria - Smart Backend Starter")
    print("=" * 50)
    
    # Check if we can use the original backend
    original_works, app = check_original_backend()
    
    if original_works:
        print("✅ Using original backend with all features")
        if __name__ == '__main__':
            port = int(os.environ.get("PORT", 5000))
            app.run(host="0.0.0.0", port=port, debug=True)
    else:
        print("⚠️ Original backend has issues, using simplified version")
        print("📝 Note: Some advanced features may not be available")
        print("🔧 Run 'python fix_imports.py' to enable all features")
        start_simplified_backend()

if __name__ == "__main__":
    main()