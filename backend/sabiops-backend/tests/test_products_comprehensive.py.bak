import pytest
import json
from decimal import Decimal
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

class TestProductsComprehensive:
    """Comprehensive test cases for product management functionality."""
    
    def test_create_product_success(self, client, auth_headers):
        """Test successful product creation with all fields."""
        product_data = {
            'name': 'Test Product',
            'sku': 'TEST-001',
            'description': 'A comprehensive test product',
            'price': 1500.00,
            'cost_price': 1000.00,
            'quantity': 100,
            'low_stock_threshold': 20,
            'category': 'Electronics',
            'status': 'active'
        }
        
        response = client.post('/api/products', json=product_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert data['message'] == 'Product created successfully'
        
        product = data['product']
        assert product['name'] == product_data['name']
        assert product['sku'] == product_data['sku']
        assert product['price'] == product_data['price']
        assert product['quantity'] == product_data['quantity']
        assert product['low_stock_threshold'] == product_data['low_stock_threshold']
        assert product['status'] == product_data['status']
        assert 'id' in product
        assert 'created_at' in product
    
    def test_create_product_minimal_fields(self, client, auth_headers):
        """Test product creation with only required fields."""
        product_data = {
            'name': 'Minimal Product',
            'sku': 'MIN-001',
            'price': 500.00,
            'quantity': 50
        }
        
        response = client.post('/api/products', json=product_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        
        product = data['product']
        assert product['name'] == product_data['name']
        assert product['sku'] == product_data['sku']
        assert product['price'] == product_data['price']
        assert product['quantity'] == product_data['quantity']
        # Default values should be set
        assert product['status'] == 'active'
        assert product['low_stock_threshold'] == 0
    
    def test_create_product_missing_required_fields(self, client, auth_headers):
        """Test product creation with missing required fields."""
        test_cases = [
            {'sku': 'TEST-002', 'price': 100.00, 'quantity': 10},  # Missing name
            {'name': 'Test Product', 'price': 100.00, 'quantity': 10},  # Missing SKU
            {'name': 'Test Product', 'sku': 'TEST-003', 'quantity': 10},  # Missing price
            {'name': 'Test Product', 'sku': 'TEST-004', 'price': 100.00}  # Missing quantity
        ]
        
        for test_data in test_cases:
            response = client.post('/api/products', json=test_data, headers=auth_headers)
            assert response.status_code == 400
            data = response.get_json()
            assert data['success'] is False
            assert 'error' in data
    
    def test_create_product_duplicate_sku(self, client, auth_headers):
        """Test product creation with duplicate SKU."""
        # Create first product
        product_data = {
            'name': 'First Product',
            'sku': 'DUP-001',
            'price': 100.00,
            'quantity': 10
        }
        
        response = client.post('/api/products', json=product_data, headers=auth_headers)
        assert response.status_code == 201
        
        # Try to create second product with same SKU
        duplicate_data = {
            'name': 'Second Product',
            'sku': 'DUP-001',
            'price': 200.00,
            'quantity': 20
        }
        
        response = client.post('/api/products', json=duplicate_data, headers=auth_headers)
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'already exists' in data['error'].lower()
    
    def test_create_product_invalid_data_types(self, client, auth_headers):
        """Test product creation with invalid data types."""
        test_cases = [
            {'name': 'Test', 'sku': 'TEST-005', 'price': 'invalid', 'quantity': 10},
            {'name': 'Test', 'sku': 'TEST-006', 'price': 100.00, 'quantity': 'invalid'},
            {'name': 'Test', 'sku': 'TEST-007', 'price': -100.00, 'quantity': 10},
            {'name': 'Test', 'sku': 'TEST-008', 'price': 100.00, 'quantity': -10}
        ]
        
        for test_data in test_cases:
            response = client.post('/api/products', json=test_data, headers=auth_headers)
            assert response.status_code == 400
            data = response.get_json()
            assert data['success'] is False
    
    def test_get_products_success(self, client, auth_headers):
        """Test successful retrieval of products list."""
        # Create some test products
        products_data = [
            {'name': 'Product A', 'sku': 'PROD-A', 'price': 100.00, 'quantity': 50},
            {'name': 'Product B', 'sku': 'PROD-B', 'price': 200.00, 'quantity': 30},
            {'name': 'Product C', 'sku': 'PROD-C', 'price': 300.00, 'quantity': 20}
        ]
        
        for product_data in products_data:
            client.post('/api/products', json=product_data, headers=auth_headers)
        
        response = client.get('/api/products', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'products' in data
        
        products = data['products']
        assert len(products) >= 3
        
        # Check that all products have required fields
        for product in products:
            assert 'id' in product
            assert 'name' in product
            assert 'sku' in product
            assert 'price' in product
            assert 'quantity' in product
            assert 'status' in product
    
    def test_get_products_empty_list(self, client, auth_headers):
        """Test retrieval of products when none exist."""
        response = client.get('/api/products', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['products'] == []
    
    def test_get_products_with_pagination(self, client, auth_headers):
        """Test products retrieval with pagination parameters."""
        # Create multiple products
        for i in range(15):
            product_data = {
                'name': f'Product {i}',
                'sku': f'PROD-{i:03d}',
                'price': 100.00 + i,
                'quantity': 10 + i
            }
            client.post('/api/products', json=product_data, headers=auth_headers)
        
        # Test pagination
        response = client.get('/api/products?page=1&limit=10', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert len(data['products']) <= 10
    
    def test_get_product_by_id_success(self, client, auth_headers):
        """Test successful retrieval of single product by ID."""
        # Create a product
        product_data = {
            'name': 'Single Product',
            'sku': 'SINGLE-001',
            'price': 150.00,
            'quantity': 25,
            'description': 'A single test product'
        }
        
        create_response = client.post('/api/products', json=product_data, headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Get the product
        response = client.get(f'/api/products/{product_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'product' in data
        
        product = data['product']
        assert product['id'] == product_id
        assert product['name'] == product_data['name']
        assert product['sku'] == product_data['sku']
        assert product['description'] == product_data['description']
    
    def test_get_product_by_id_not_found(self, client, auth_headers):
        """Test retrieval of non-existent product."""
        response = client.get('/api/products/non-existent-id', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert data['success'] is False
        assert 'not found' in data['error'].lower()
    
    def test_update_product_success(self, client, auth_headers):
        """Test successful product update."""
        # Create a product
        product_data = {
            'name': 'Original Product',
            'sku': 'ORIG-001',
            'price': 100.00,
            'quantity': 50
        }
        
        create_response = client.post('/api/products', json=product_data, headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Update the product
        update_data = {
            'name': 'Updated Product',
            'price': 150.00,
            'quantity': 75,
            'description': 'Updated description'
        }
        
        response = client.put(f'/api/products/{product_id}', json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['message'] == 'Product updated successfully'
        
        product = data['product']
        assert product['name'] == update_data['name']
        assert product['price'] == update_data['price']
        assert product['quantity'] == update_data['quantity']
        assert product['description'] == update_data['description']
        assert product['sku'] == product_data['sku']  # SKU should remain unchanged
    
    def test_update_product_partial(self, client, auth_headers):
        """Test partial product update."""
        # Create a product
        product_data = {
            'name': 'Partial Product',
            'sku': 'PART-001',
            'price': 100.00,
            'quantity': 50,
            'description': 'Original description'
        }
        
        create_response = client.post('/api/products', json=product_data, headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Update only price
        update_data = {'price': 120.00}
        
        response = client.put(f'/api/products/{product_id}', json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        product = data['product']
        assert product['price'] == update_data['price']
        assert product['name'] == product_data['name']  # Should remain unchanged
        assert product['quantity'] == product_data['quantity']  # Should remain unchanged
    
    def test_update_product_not_found(self, client, auth_headers):
        """Test update of non-existent product."""
        update_data = {'name': 'Updated Name'}
        
        response = client.put('/api/products/non-existent-id', json=update_data, headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert data['success'] is False
        assert 'not found' in data['error'].lower()
    
    def test_delete_product_success(self, client, auth_headers):
        """Test successful product deletion."""
        # Create a product
        product_data = {
            'name': 'Delete Product',
            'sku': 'DEL-001',
            'price': 100.00,
            'quantity': 50
        }
        
        create_response = client.post('/api/products', json=product_data, headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Delete the product
        response = client.delete(f'/api/products/{product_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['message'] == 'Product deleted successfully'
        
        # Verify product is deleted
        get_response = client.get(f'/api/products/{product_id}', headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_product_not_found(self, client, auth_headers):
        """Test deletion of non-existent product."""
        response = client.delete('/api/products/non-existent-id', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert data['success'] is False
        assert 'not found' in data['error'].lower()
    
    def test_search_products_by_name(self, client, auth_headers):
        """Test product search by name."""
        # Create products with different names
        products_data = [
            {'name': 'Laptop Computer', 'sku': 'LAP-001', 'price': 50000, 'quantity': 10},
            {'name': 'Desktop Computer', 'sku': 'DES-001', 'price': 40000, 'quantity': 5},
            {'name': 'Mobile Phone', 'sku': 'MOB-001', 'price': 20000, 'quantity': 20}
        ]
        
        for product_data in products_data:
            client.post('/api/products', json=product_data, headers=auth_headers)
        
        # Search for products with 'Computer' in name
        response = client.get('/api/products?search=Computer', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        
        products = data['products']
        assert len(products) == 2  # Should find 2 computer products
        
        for product in products:
            assert 'computer' in product['name'].lower()
    
    def test_search_products_by_sku(self, client, auth_headers):
        """Test product search by SKU."""
        # Create products
        products_data = [
            {'name': 'Product A', 'sku': 'ELEC-001', 'price': 100, 'quantity': 10},
            {'name': 'Product B', 'sku': 'ELEC-002', 'price': 200, 'quantity': 20},
            {'name': 'Product C', 'sku': 'FURN-001', 'price': 300, 'quantity': 30}
        ]
        
        for product_data in products_data:
            client.post('/api/products', json=product_data, headers=auth_headers)
        
        # Search for products with 'ELEC' in SKU
        response = client.get('/api/products?search=ELEC', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        products = data['products']
        assert len(products) == 2  # Should find 2 electronics products
        
        for product in products:
            assert 'ELEC' in product['sku']
    
    def test_filter_products_by_category(self, client, auth_headers):
        """Test product filtering by category."""
        # Create products with different categories
        products_data = [
            {'name': 'Product A', 'sku': 'PROD-A', 'price': 100, 'quantity': 10, 'category': 'Electronics'},
            {'name': 'Product B', 'sku': 'PROD-B', 'price': 200, 'quantity': 20, 'category': 'Electronics'},
            {'name': 'Product C', 'sku': 'PROD-C', 'price': 300, 'quantity': 30, 'category': 'Furniture'}
        ]
        
        for product_data in products_data:
            client.post('/api/products', json=product_data, headers=auth_headers)
        
        # Filter by Electronics category
        response = client.get('/api/products?category=Electronics', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        products = data['products']
        assert len(products) == 2  # Should find 2 electronics products
        
        for product in products:
            assert product['category'] == 'Electronics'
    
    def test_filter_products_by_status(self, client, auth_headers):
        """Test product filtering by status."""
        # Create products with different statuses
        products_data = [
            {'name': 'Active Product', 'sku': 'ACT-001', 'price': 100, 'quantity': 10, 'status': 'active'},
            {'name': 'Inactive Product', 'sku': 'INACT-001', 'price': 200, 'quantity': 20, 'status': 'inactive'}
        ]
        
        for product_data in products_data:
            client.post('/api/products', json=product_data, headers=auth_headers)
        
        # Filter by active status
        response = client.get('/api/products?status=active', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        products = data['products']
        for product in products:
            assert product['status'] == 'active'
    
    def test_get_low_stock_products(self, client, auth_headers):
        """Test retrieval of low stock products."""
        # Create products with different stock levels
        products_data = [
            {'name': 'Low Stock Product', 'sku': 'LOW-001', 'price': 1000, 'quantity': 5, 'low_stock_threshold': 10},
            {'name': 'Normal Stock Product', 'sku': 'NOR-001', 'price': 1000, 'quantity': 50, 'low_stock_threshold': 10}
        ]
        
        for product_data in products_data:
            client.post('/api/products', json=product_data, headers=auth_headers)
        
        # Get low stock products
        response = client.get('/api/products?low_stock=true', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        products = data['products']
        assert len(products) == 1  # Should find 1 low stock product
        assert products[0]['name'] == 'Low Stock Product'
        assert products[0]['quantity'] <= products[0]['low_stock_threshold']
    
    def test_update_product_stock(self, client, auth_headers):
        """Test updating product stock quantity."""
        # Create a product
        product_data = {
            'name': 'Stock Product',
            'sku': 'STOCK-001',
            'price': 100.00,
            'quantity': 50
        }
        
        create_response = client.post('/api/products', json=product_data, headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Update stock
        response = client.patch(f'/api/products/{product_id}/stock', 
                              json={'quantity': 100}, 
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['message'] == 'Stock updated successfully'
        assert data['product']['quantity'] == 100
    
    def test_update_product_stock_invalid_quantity(self, client, auth_headers):
        """Test updating product stock with invalid quantity."""
        # Create a product
        product_data = {
            'name': 'Stock Product',
            'sku': 'STOCK-002',
            'price': 100.00,
            'quantity': 50
        }
        
        create_response = client.post('/api/products', json=product_data, headers=auth_headers)
        product_id = create_response.get_json()['product']['id']
        
        # Try to update with negative quantity
        response = client.patch(f'/api/products/{product_id}/stock', 
                              json={'quantity': -10}, 
                              headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
    
    def test_products_unauthorized_access(self, client):
        """Test accessing product routes without authentication."""
        # Test all product endpoints without auth
        endpoints = [
            ('GET', '/api/products'),
            ('POST', '/api/products'),
            ('GET', '/api/products/test-id'),
            ('PUT', '/api/products/test-id'),
            ('DELETE', '/api/products/test-id'),
            ('PATCH', '/api/products/test-id/stock')
        ]
        
        for method, endpoint in endpoints:
            if method == 'GET':
                response = client.get(endpoint)
            elif method == 'POST':
                response = client.post(endpoint, json={'test': 'data'})
            elif method == 'PUT':
                response = client.put(endpoint, json={'test': 'data'})
            elif method == 'DELETE':
                response = client.delete(endpoint)
            elif method == 'PATCH':
                response = client.patch(endpoint, json={'test': 'data'})
            
            assert response.status_code == 401
    
    def test_product_data_validation(self, client, auth_headers):
        """Test comprehensive product data validation."""
        # Test various invalid data scenarios
        invalid_data_cases = [
            # Empty name
            {'name': '', 'sku': 'TEST-001', 'price': 100, 'quantity': 10},
            # Empty SKU
            {'name': 'Test Product', 'sku': '', 'price': 100, 'quantity': 10},
            # Zero price
            {'name': 'Test Product', 'sku': 'TEST-002', 'price': 0, 'quantity': 10},
            # Negative quantity
            {'name': 'Test Product', 'sku': 'TEST-003', 'price': 100, 'quantity': -5},
            # Invalid price type
            {'name': 'Test Product', 'sku': 'TEST-004', 'price': 'invalid', 'quantity': 10},
            # Invalid quantity type
            {'name': 'Test Product', 'sku': 'TEST-005', 'price': 100, 'quantity': 'invalid'}
        ]
        
        for invalid_data in invalid_data_cases:
            response = client.post('/api/products', json=invalid_data, headers=auth_headers)
            assert response.status_code == 400
            data = response.get_json()
            assert data['success'] is False
    
    def test_product_decimal_precision(self, client, auth_headers):
        """Test product price decimal precision handling."""
        product_data = {
            'name': 'Decimal Product',
            'sku': 'DEC-001',
            'price': 99.99,
            'cost_price': 75.50,
            'quantity': 10
        }
        
        response = client.post('/api/products', json=product_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        
        product = data['product']
        assert product['price'] == 99.99
        assert product['cost_price'] == 75.50

