import pytest
import json
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

class TestAuthRoutes:
    """Test cases for authentication routes."""
    
    def test_register_success(self, client):
        """Test successful user registration."""
        response = client.post('/api/auth/register', json={
            'first_name': 'John',
            'last_name': 'Doe',
            'username': 'johndoe',
            'email': 'john@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'User registered successfully'
        assert 'access_token' in data
        assert data['user']['email'] == 'john@example.com'
        assert data['user']['username'] == 'johndoe'
    
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        response = client.post('/api/auth/register', json={
            'first_name': 'John',
            'email': 'john@example.com'
            # Missing last_name, username, password
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email."""
        # First registration
        client.post('/api/auth/register', json={
            'first_name': 'John',
            'last_name': 'Doe',
            'username': 'johndoe',
            'email': 'john@example.com',
            'password': 'password123'
        })
        
        # Second registration with same email
        response = client.post('/api/auth/register', json={
            'first_name': 'Jane',
            'last_name': 'Smith',
            'username': 'janesmith',
            'email': 'john@example.com',  # Same email
            'password': 'password456'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'already exists' in data['error']
    
    def test_register_duplicate_username(self, client):
        """Test registration with duplicate username."""
        # First registration
        client.post('/api/auth/register', json={
            'first_name': 'John',
            'last_name': 'Doe',
            'username': 'johndoe',
            'email': 'john@example.com',
            'password': 'password123'
        })
        
        # Second registration with same username
        response = client.post('/api/auth/register', json={
            'first_name': 'Jane',
            'last_name': 'Smith',
            'username': 'johndoe',  # Same username
            'email': 'jane@example.com',
            'password': 'password456'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'already exists' in data['error']
    
    def test_login_success(self, client):
        """Test successful login."""
        # Register user first
        client.post('/api/auth/register', json={
            'first_name': 'John',
            'last_name': 'Doe',
            'username': 'johndoe',
            'email': 'john@example.com',
            'password': 'password123'
        })
        
        # Login
        response = client.post('/api/auth/login', json={
            'email': 'john@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Login successful'
        assert 'access_token' in data
        assert data['user']['email'] == 'john@example.com'
    
    def test_login_invalid_email(self, client):
        """Test login with invalid email."""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Invalid credentials' in data['error']
    
    def test_login_invalid_password(self, client):
        """Test login with invalid password."""
        # Register user first
        client.post('/api/auth/register', json={
            'first_name': 'John',
            'last_name': 'Doe',
            'username': 'johndoe',
            'email': 'john@example.com',
            'password': 'password123'
        })
        
        # Login with wrong password
        response = client.post('/api/auth/login', json={
            'email': 'john@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'Invalid credentials' in data['error']
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields."""
        response = client.post('/api/auth/login', json={
            'email': 'john@example.com'
            # Missing password
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_logout_success(self, client, auth_headers):
        """Test successful logout."""
        response = client.post('/api/auth/logout', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Successfully logged out'
    
    def test_logout_without_token(self, client):
        """Test logout without authentication token."""
        response = client.post('/api/auth/logout')
        
        assert response.status_code == 401
    
    def test_protected_route_with_valid_token(self, client, auth_headers):
        """Test accessing protected route with valid token."""
        response = client.get('/api/users/profile', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'user' in data
    
    def test_protected_route_without_token(self, client):
        """Test accessing protected route without token."""
        response = client.get('/api/users/profile')
        
        assert response.status_code == 401
    
    def test_protected_route_with_invalid_token(self, client):
        """Test accessing protected route with invalid token."""
        headers = {'Authorization': 'Bearer invalid_token'}
        response = client.get('/api/users/profile', headers=headers)
        
        assert response.status_code == 422  # JWT decode error

