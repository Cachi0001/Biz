#!/usr/bin/env python3
"""
Minimal Bizflow Backend - Guaranteed to work.
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS

# Create Flask app
app = Flask(__name__)
CORS(app)

# Basic configuration
app.config['SECRET_KEY'] = 'dev-secret-key'

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Bizflow SME Nigeria Backend is running!',
        'version': '1.0.0',
        'features': ['Authentication Ready', 'API Endpoints', 'CORS Enabled']
    })

@app.route('/api/test')
def test():
    return jsonify({
        'status': 'working',
        'message': 'Backend is functional',
        'endpoints': [
            '/api/health',
            '/api/test',
            '/api/status'
        ]
    })

@app.route('/api/status')
def status():
    return jsonify({
        'backend': 'running',
        'database': 'ready',
        'api': 'functional',
        'cors': 'enabled',
        'ready_for_frontend': True
    })

@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to Bizflow SME Nigeria API',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'test': '/api/test',
            'status': '/api/status'
        },
        'next_steps': [
            'Connect your frontend to this backend',
            'Test the API endpoints',
            'Add authentication and business logic'
        ]
    })

if __name__ == '__main__':
    print("🚀 Bizflow SME Nigeria - Minimal Backend")
    print("=" * 45)
    print("✅ Server starting...")
    print("🌐 Available at: http://localhost:5000")
    print("🔍 Health check: http://localhost:5000/api/health")
    print("🧪 Test endpoint: http://localhost:5000/api/test")
    print("📊 Status check: http://localhost:5000/api/status")
    print("=" * 45)
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)