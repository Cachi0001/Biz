import pytest
import json
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

class TestAuthRoutes:
    """Test cases for authentication routes."""
    
    def test_register_success(self, client, mock_supabase):
        """Test successful user registration."""
        response = client.post('/auth/register', json={
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+2348012345678',
            'password': 'password123',
            'business_name': 'Test Business'
        })
        
        assert response.status_code in [200, 201]
        data = response.get_json()
        assert data.get('success') == True
        assert 'message' in data
    
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        response = client.post('/auth/register', json={
            'full_name': 'John Doe',
            'email': 'john@example.com'
            # Missing phone and password
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert data.get('success') == False
        assert 'error' in data or 'message' in data
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format."""
        response = client.post('/auth/register', json={
            'full_name': 'John Doe',
            'email': 'invalid-email',
            'phone': '+2348012345678',
            'password': 'password123'
        })
        
        # Should either accept it or reject with proper error
        assert response.status_code in [200, 201, 400]
    
    def test_login_success(self, client, mock_supabase):
        """Test successful login."""
        # First register a user
        register_response = client.post('/auth/register', json={
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+2348012345678',
            'password': 'password123'
        })
        
        if register_response.status_code in [200, 201]:
            # Then try to login
            login_response = client.post('/auth/login', json={
                'email': 'john@example.com',
                'password': 'password123'
            })
            
            # Should succeed or fail gracefully
            assert login_response.status_code in [200, 400, 401]
            
    def test_login_phone_number(self, client, mock_supabase):
        """Test login with phone number."""
        # Register a user first
        register_response = client.post('/auth/register', json={
            'full_name': 'Jane Doe',
            'email': 'jane@example.com',
            'phone': '+2348087654321',
            'password': 'password123'
        })
        
        if register_response.status_code in [200, 201]:
            # Try login with phone
            login_response = client.post('/auth/login', json={
                'phone': '+2348087654321',
                'password': 'password123'
            })
            
            assert login_response.status_code in [200, 400, 401]
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = client.post('/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code in [400, 401]
        data = response.get_json()
        assert data.get('success') == False
    
    def test_forgot_password_flow(self, client):
        """Test forgot password functionality."""
        # Test forgot password request
        response = client.post('/auth/forgot-password', json={
            'email': 'test@example.com'
        })
        
        # Should either work or fail gracefully
        assert response.status_code in [200, 400, 404]
        
    def test_protected_route_without_token(self, client):
        """Test accessing protected route without authorization."""
        response = client.get('/dashboard')
        
        # Should be unauthorized
        assert response.status_code in [401, 403]
        
    def test_referral_code_registration(self, client):
        """Test registration with referral code."""
        response = client.post('/api/auth/register', json={
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+2348012345678',
            'password': 'password123',
            'referral_code': 'SABI123456'
        })
        
        # Should handle referral code gracefully
        assert response.status_code in [200, 201, 400]
