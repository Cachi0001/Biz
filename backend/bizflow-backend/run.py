#!/usr/bin/env python3
"""
Simple script to run the Flask backend server.
This script handles the Python path issues and runs the server correctly.
"""

import os
import sys

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Now import and run the app
from src.main import app

if __name__ == '__main__':
    print("Starting Bizflow SME Nigeria Backend Server...")
    print("Server will be available at: http://localhost:5000")
    print("Health check endpoint: http://localhost:5000/api/health")
    print("Press Ctrl+C to stop the server")
    
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)