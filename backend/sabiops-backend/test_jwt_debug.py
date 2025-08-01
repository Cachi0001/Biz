#!/usr/bin/env python3
"""
Test script to debug JWT token issues in subscription endpoints.
This script will help identify what's causing the "not enough segments" error.
"""

import jwt
import logging
from datetime import datetime, timedelta
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_jwt_token(token_string):
    """Analyze a JWT token and identify potential issues"""
    
    print(f"🔍 Analyzing JWT Token")
    print("=" * 50)
    
    if not token_string:
        print("❌ Token is empty or None")
        return False
    
    print(f"📏 Token length: {len(token_string)} characters")
    print(f"🔤 Token preview: {token_string[:50]}...")
    
    # Check if token has the right number of segments
    segments = token_string.split('.')
    print(f"📊 Token segments: {len(segments)}")
    
    if len(segments) != 3:
        print(f"❌ Invalid JWT format! Expected 3 segments, got {len(segments)}")
        print("   A valid JWT should have: header.payload.signature")
        
        if len(segments) < 3:
            print("   This is likely the cause of 'Not enough segments' error")
        
        return False
    
    print("✅ Token has correct number of segments")
    
    # Try to decode without verification first
    try:
        # Decode header
        header = jwt.get_unverified_header(token_string)
        print(f"📋 Header: {json.dumps(header, indent=2)}")
        
        # Decode payload without verification
        payload = jwt.decode(token_string, options={"verify_signature": False})
        print(f"📦 Payload: {json.dumps(payload, indent=2, default=str)}")
        
        # Check expiration
        if 'exp' in payload:
            exp_time = datetime.fromtimestamp(payload['exp'])
            current_time = datetime.now()
            
            print(f"⏰ Token expires: {exp_time}")
            print(f"🕐 Current time: {current_time}")
            
            if exp_time < current_time:
                print("❌ Token is EXPIRED!")
                return False
            else:
                print("✅ Token is not expired")
        
        # Check for user identity
        user_id = payload.get('sub') or payload.get('user_id') or payload.get('identity')
        if user_id:
            print(f"👤 User ID in token: {user_id} (type: {type(user_id)})")
        else:
            print("❌ No user ID found in token")
        
        return True
        
    except jwt.DecodeError as e:
        print(f"❌ JWT Decode Error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error analyzing token: {str(e)}")
        return False

def create_test_jwt_token():
    """Create a test JWT token for debugging"""
    
    print("\n🔧 Creating Test JWT Token")
    print("=" * 50)
    
    # Test payload
    payload = {
        'sub': '123e4567-e89b-12d3-a456-426614174000',  # User ID
        'iat': datetime.now(),
        'exp': datetime.now() + timedelta(hours=1),
        'identity': '123e4567-e89b-12d3-a456-426614174000'
    }
    
    # Create token with a test secret
    test_secret = 'test-secret-key-for-debugging'
    token = jwt.encode(payload, test_secret, algorithm='HS256')
    
    print(f"✅ Test token created: {token[:50]}...")
    print(f"📏 Token length: {len(token)}")
    
    # Analyze the test token
    analyze_jwt_token(token)
    
    return token

def simulate_flask_jwt_parsing(token):
    """Simulate how Flask-JWT-Extended parses tokens"""
    
    print(f"\n🧪 Simulating Flask-JWT-Extended Parsing")
    print("=" * 50)
    
    try:
        # This simulates what get_jwt_identity() does internally
        if not token:
            raise Exception("No token provided")
        
        segments = token.split('.')
        if len(segments) != 3:
            raise Exception("Not enough segments")
        
        # Decode payload (Flask-JWT-Extended does this)
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Extract identity (this is what get_jwt_identity() returns)
        identity = payload.get('sub') or payload.get('identity')
        
        print(f"✅ Flask-JWT parsing successful")
        print(f"👤 Identity extracted: {identity} (type: {type(identity)})")
        
        return identity
        
    except Exception as e:
        print(f"❌ Flask-JWT parsing failed: {str(e)}")
        return None

def test_common_jwt_issues():
    """Test common JWT token issues"""
    
    print(f"\n🧪 Testing Common JWT Issues")
    print("=" * 50)
    
    test_cases = [
        ("", "Empty token"),
        ("invalid", "Invalid token format"),
        ("header.payload", "Missing signature segment"),
        ("header.payload.signature.extra", "Too many segments"),
        ("not.a.jwt", "Malformed segments"),
    ]
    
    for token, description in test_cases:
        print(f"\n📋 Test: {description}")
        print(f"   Token: '{token}'")
        
        result = simulate_flask_jwt_parsing(token)
        if result:
            print(f"   ✅ Success: {result}")
        else:
            print(f"   ❌ Failed (this would cause 422 error)")

if __name__ == "__main__":
    print("🔍 JWT Token Debugging Tool")
    print("=" * 60)
    
    # Test with a valid token
    test_token = create_test_jwt_token()
    
    # Test Flask parsing
    simulate_flask_jwt_parsing(test_token)
    
    # Test common issues
    test_common_jwt_issues()
    
    print(f"\n📋 Debugging Summary:")
    print("   1. ✅ Fixed frontend URL inconsistency (removed double /api/)")
    print("   2. ✅ Added detailed JWT debugging in backend")
    print("   3. ✅ Enhanced error logging for token analysis")
    
    print(f"\n🔧 Next Steps:")
    print("   1. Check the actual JWT token being sent from frontend")
    print("   2. Verify token is not expired or malformed")
    print("   3. Check if frontend is properly storing/retrieving auth token")
    print("   4. Look at browser network tab to see exact request headers")
    
    print(f"\n💡 Common Causes of 'Not enough segments' error:")
    print("   - Token is empty or undefined")
    print("   - Token is missing Bearer prefix")
    print("   - Token is corrupted during storage/retrieval")
    print("   - Token has wrong format (not base64 encoded)")
    print("   - Frontend auth utility is returning wrong value")
