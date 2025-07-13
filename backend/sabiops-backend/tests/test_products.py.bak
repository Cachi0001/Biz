import pytest
import json
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

class TestProductRoutes:
    """Test cases for product management routes."""
    
    def test_create_product_success(self, client, auth_headers, sample_product_data):
        """Test successful product creation."""
        response = client.post('/api/products', 
                             json=sample_product_data, 
                             headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'Product created successfully'
        assert data['product']['name'] == sample_product_data['name']
        assert data['product']['sku'] == sample_product_data['sku']
        assert data['product']['price'] == sample_product_data['price']
    
    def test_create_product_missing_fields(self, client, auth_headers):
        """Test product creation with missing required fields."""
        response = client.post('/api/products', 
                             json={'name': 'Test Product'}, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_create_product_duplicate_sku(self, client, auth_headers, sample_product_data):
        """Test product creation with duplicate SKU."""
        # Create first product
        client.post('/api/products', 
                   json=sample_product_data, 
                   headers=auth_headers)
        
        # Try to create second product with same SKU
        duplicate_data = sample_product_data.copy()
        duplicate_data['name'] = 'Another Product'
        
        response = client.post('/api/products', 
                             json=duplicate_data, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'already exists' in data['error']
    
    def test_get_products_success(self, client, auth_headers, sample_product_data):
        """Test successful retrieval of products list."""
        # Create a product first
        client.post('/api/products', 
                   json=sample_product_data, 
                   headers=auth_headers)
        
        response = client.get('/api/products', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'products' in data
        assert len(data['products']) == 1
        assert data['products'][0]['name'] == sample_product_data['name']
    
    def test_get_products_empty_list(self, client, auth_headers):
        """Test retrieval of products when none exist."""
        response = client.get('/api/products', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'products' in data
        assert len(data['products']) == 0
    
    def test_get_product_by_id_success(self, client, auth_headers, sample_product_data):
        """Test successful retrieval of product by ID."""
        # Create a product first
        create_response = client.post('/api/products', 
                                    json=sample_product_data, 
                                    headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        response = client.get(f'/api/products/{product_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['product']['id'] == product_id
        assert data['product']['name'] == sample_product_data['name']
    
    def test_get_product_by_id_not_found(self, client, auth_headers):
        """Test retrieval of non-existent product."""
        response = client.get('/api/products/999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_update_product_success(self, client, auth_headers, sample_product_data):
        """Test successful product update."""
        # Create a product first
        create_response = client.post('/api/products', 
                                    json=sample_product_data, 
                                    headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Update product
        update_data = {'name': 'Updated Product', 'price': 1500.00}
        response = client.put(f'/api/products/{product_id}', 
                            json=update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Product updated successfully'
        assert data['product']['name'] == 'Updated Product'
        assert data['product']['price'] == 1500.00
    
    def test_update_product_not_found(self, client, auth_headers):
        """Test update of non-existent product."""
        update_data = {'name': 'Updated Product'}
        response = client.put('/api/products/999', 
                            json=update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_delete_product_success(self, client, auth_headers, sample_product_data):
        """Test successful product deletion."""
        # Create a product first
        create_response = client.post('/api/products', 
                                    json=sample_product_data, 
                                    headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Delete product
        response = client.delete(f'/api/products/{product_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Product deleted successfully'
        
        # Verify product is deleted
        get_response = client.get(f'/api/products/{product_id}', headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_product_not_found(self, client, auth_headers):
        """Test deletion of non-existent product."""
        response = client.delete('/api/products/999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_search_products_by_name(self, client, auth_headers):
        """Test product search by name."""
        # Create multiple products
        products = [
            {'name': 'Laptop Computer', 'sku': 'LAP-001', 'price': 50000, 'quantity': 10},
            {'name': 'Desktop Computer', 'sku': 'DES-001', 'price': 40000, 'quantity': 5},
            {'name': 'Mobile Phone', 'sku': 'MOB-001', 'price': 20000, 'quantity': 20}
        ]
        
        for product in products:
            client.post('/api/products', json=product, headers=auth_headers)
        
        # Search for products with 'Computer' in name
        response = client.get('/api/products?search=Computer', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['products']) == 2  # Laptop Computer and Desktop Computer
    
    def test_filter_products_by_category(self, client, auth_headers):
        """Test product filtering by category."""
        # Create products with different categories
        electronics = {'name': 'Laptop', 'sku': 'LAP-001', 'price': 50000, 'category': 'Electronics'}
        clothing = {'name': 'T-Shirt', 'sku': 'TSH-001', 'price': 2000, 'category': 'Clothing'}
        
        client.post('/api/products', json=electronics, headers=auth_headers)
        client.post('/api/products', json=clothing, headers=auth_headers)
        
        # Filter by Electronics category
        response = client.get('/api/products?category=Electronics', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['products']) == 1
        assert data['products'][0]['category'] == 'Electronics'
    
    def test_filter_products_by_status(self, client, auth_headers):
        """Test product filtering by status."""
        # Create products with different statuses
        active_product = {'name': 'Active Product', 'sku': 'ACT-001', 'price': 1000, 'status': 'active'}
        inactive_product = {'name': 'Inactive Product', 'sku': 'INA-001', 'price': 1000, 'status': 'inactive'}
        
        client.post('/api/products', json=active_product, headers=auth_headers)
        client.post('/api/products', json=inactive_product, headers=auth_headers)
        
        # Filter by active status
        response = client.get('/api/products?status=active', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['products']) == 1
        assert data['products'][0]['status'] == 'active'
    
    def test_get_low_stock_products(self, client, auth_headers):
        """Test retrieval of low stock products."""
        # Create products with different stock levels
        low_stock = {'name': 'Low Stock Product', 'sku': 'LOW-001', 'price': 1000, 'quantity': 5, 'low_stock_threshold': 10}
        normal_stock = {'name': 'Normal Stock Product', 'sku': 'NOR-001', 'price': 1000, 'quantity': 50, 'low_stock_threshold': 10}
        
        client.post('/api/products', json=low_stock, headers=auth_headers)
        client.post('/api/products', json=normal_stock, headers=auth_headers)
        
        # Get low stock products
        response = client.get('/api/products?low_stock=true', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['products']) == 1
        assert data['products'][0]['name'] == 'Low Stock Product'
    
    def test_update_product_stock(self, client, auth_headers, sample_product_data):
        """Test updating product stock quantity."""
        # Create a product first
        create_response = client.post('/api/products', 
                                    json=sample_product_data, 
                                    headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Update stock
        response = client.patch(f'/api/products/{product_id}/stock', 
                              json={'quantity': 100}, 
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Stock updated successfully'
        assert data['product']['quantity'] == 100
    
    def test_products_unauthorized_access(self, client):
        """Test accessing product routes without authentication."""
        response = client.get('/api/products')
        assert response.status_code == 401
        
        response = client.post('/api/products', json={'name': 'Test'})
        assert response.status_code == 401
        
        response = client.put('/api/products/1', json={'name': 'Test'})
        assert response.status_code == 401
        
        response = client.delete('/api/products/1')
        assert response.status_code == 401

