import pytest
import json
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

class TestCustomerRoutes:
    """Test cases for customer management routes."""
    
    def test_create_customer_success(self, client, auth_headers, sample_customer_data):
        """Test successful customer creation."""
        response = client.post('/api/customers', 
                             json=sample_customer_data, 
                             headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'Customer created successfully'
        assert data['customer']['name'] == sample_customer_data['name']
        assert data['customer']['email'] == sample_customer_data['email']
    
    def test_create_customer_missing_fields(self, client, auth_headers):
        """Test customer creation with missing required fields."""
        response = client.post('/api/customers', 
                             json={'name': 'John Doe'}, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_create_customer_duplicate_email(self, client, auth_headers, sample_customer_data):
        """Test customer creation with duplicate email."""
        # Create first customer
        client.post('/api/customers', 
                   json=sample_customer_data, 
                   headers=auth_headers)
        
        # Try to create second customer with same email
        duplicate_data = sample_customer_data.copy()
        duplicate_data['name'] = 'Jane Doe'
        
        response = client.post('/api/customers', 
                             json=duplicate_data, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'already exists' in data['error']
    
    def test_get_customers_success(self, client, auth_headers, sample_customer_data):
        """Test successful retrieval of customers list."""
        # Create a customer first
        client.post('/api/customers', 
                   json=sample_customer_data, 
                   headers=auth_headers)
        
        response = client.get('/api/customers', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'customers' in data
        assert len(data['customers']) == 1
        assert data['customers'][0]['name'] == sample_customer_data['name']
    
    def test_get_customers_empty_list(self, client, auth_headers):
        """Test retrieval of customers when none exist."""
        response = client.get('/api/customers', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'customers' in data
        assert len(data['customers']) == 0
    
    def test_get_customer_by_id_success(self, client, auth_headers, sample_customer_data):
        """Test successful retrieval of customer by ID."""
        # Create a customer first
        create_response = client.post('/api/customers', 
                                    json=sample_customer_data, 
                                    headers=auth_headers)
        customer_id = create_response.get_json()['customer']['id']
        
        response = client.get(f'/api/customers/{customer_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['customer']['id'] == customer_id
        assert data['customer']['name'] == sample_customer_data['name']
    
    def test_get_customer_by_id_not_found(self, client, auth_headers):
        """Test retrieval of non-existent customer."""
        response = client.get('/api/customers/999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_update_customer_success(self, client, auth_headers, sample_customer_data):
        """Test successful customer update."""
        # Create a customer first
        create_response = client.post('/api/customers', 
                                    json=sample_customer_data, 
                                    headers=auth_headers)
        customer_id = create_response.get_json()['customer']['id']
        
        # Update customer
        update_data = {'name': 'Updated Name', 'phone': '+2348087654321'}
        response = client.put(f'/api/customers/{customer_id}', 
                            json=update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Customer updated successfully'
        assert data['customer']['name'] == 'Updated Name'
        assert data['customer']['phone'] == '+2348087654321'
    
    def test_update_customer_not_found(self, client, auth_headers):
        """Test update of non-existent customer."""
        update_data = {'name': 'Updated Name'}
        response = client.put('/api/customers/999', 
                            json=update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_delete_customer_success(self, client, auth_headers, sample_customer_data):
        """Test successful customer deletion."""
        # Create a customer first
        create_response = client.post('/api/customers', 
                                    json=sample_customer_data, 
                                    headers=auth_headers)
        customer_id = create_response.get_json()['customer']['id']
        
        # Delete customer
        response = client.delete(f'/api/customers/{customer_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Customer deleted successfully'
        
        # Verify customer is deleted
        get_response = client.get(f'/api/customers/{customer_id}', headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_customer_not_found(self, client, auth_headers):
        """Test deletion of non-existent customer."""
        response = client.delete('/api/customers/999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_search_customers_by_name(self, client, auth_headers):
        """Test customer search by name."""
        # Create multiple customers
        customers = [
            {'name': 'John Doe', 'email': 'john@example.com', 'phone': '+2348012345678'},
            {'name': 'Jane Smith', 'email': 'jane@example.com', 'phone': '+2348012345679'},
            {'name': 'Bob Johnson', 'email': 'bob@example.com', 'phone': '+2348012345680'}
        ]
        
        for customer in customers:
            client.post('/api/customers', json=customer, headers=auth_headers)
        
        # Search for customers with 'John' in name
        response = client.get('/api/customers?search=John', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['customers']) == 2  # John Doe and Bob Johnson
    
    def test_filter_customers_by_status(self, client, auth_headers):
        """Test customer filtering by status."""
        # Create customers with different statuses
        active_customer = {'name': 'Active Customer', 'email': 'active@example.com', 'status': 'active'}
        inactive_customer = {'name': 'Inactive Customer', 'email': 'inactive@example.com', 'status': 'inactive'}
        
        client.post('/api/customers', json=active_customer, headers=auth_headers)
        client.post('/api/customers', json=inactive_customer, headers=auth_headers)
        
        # Filter by active status
        response = client.get('/api/customers?status=active', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['customers']) == 1
        assert data['customers'][0]['status'] == 'active'
    
    def test_customers_unauthorized_access(self, client):
        """Test accessing customer routes without authentication."""
        response = client.get('/api/customers')
        assert response.status_code == 401
        
        response = client.post('/api/customers', json={'name': 'Test'})
        assert response.status_code == 401
        
        response = client.put('/api/customers/1', json={'name': 'Test'})
        assert response.status_code == 401
        
        response = client.delete('/api/customers/1')
        assert response.status_code == 401

