import pytest
import json
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

class TestInvoiceRoutes:
    """Test cases for invoice management routes."""
    
    def setup_test_data(self, client, auth_headers):
        """Setup test customer and product data."""
        # Create a customer
        customer_response = client.post('/api/customers', json={
            'name': 'Test Customer',
            'email': 'customer@example.com',
            'phone': '+2348012345678'
        }, headers=auth_headers)
        customer_id = customer_response.get_json()['customer']['id']
        
        # Create a product
        product_response = client.post('/api/products', json={
            'name': 'Test Product',
            'sku': 'TEST-001',
            'price': 1000.00,
            'quantity': 50
        }, headers=auth_headers)
        product_id = product_response.get_json()['product']['id']
        
        return customer_id, product_id
    
    def test_create_invoice_success(self, client, auth_headers):
        """Test successful invoice creation."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        invoice_data = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'status': 'draft',
            'notes': 'Test invoice',
            'tax_rate': 7.5,
            'discount_amount': 0,
            'items': [
                {
                    'product_id': product_id,
                    'description': 'Test Product',
                    'quantity': 2,
                    'unit_price': 1000.00
                }
            ]
        }
        
        response = client.post('/api/invoices', 
                             json=invoice_data, 
                             headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'Invoice created successfully'
        assert data['invoice']['customer_id'] == customer_id
        assert len(data['invoice']['items']) == 1
        assert data['invoice']['total_amount'] == 2150.0  # (2 * 1000) + 7.5% tax
    
    def test_create_invoice_missing_fields(self, client, auth_headers):
        """Test invoice creation with missing required fields."""
        response = client.post('/api/invoices', 
                             json={'customer_id': 1}, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_create_invoice_invalid_customer(self, client, auth_headers):
        """Test invoice creation with invalid customer ID."""
        invoice_data = {
            'customer_id': 999,  # Non-existent customer
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': []
        }
        
        response = client.post('/api/invoices', 
                             json=invoice_data, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Customer not found' in data['error']
    
    def test_get_invoices_success(self, client, auth_headers):
        """Test successful retrieval of invoices list."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        # Create an invoice first
        invoice_data = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        client.post('/api/invoices', json=invoice_data, headers=auth_headers)
        
        response = client.get('/api/invoices', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'invoices' in data
        assert len(data['invoices']) == 1
    
    def test_get_invoices_empty_list(self, client, auth_headers):
        """Test retrieval of invoices when none exist."""
        response = client.get('/api/invoices', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'invoices' in data
        assert len(data['invoices']) == 0
    
    def test_get_invoice_by_id_success(self, client, auth_headers):
        """Test successful retrieval of invoice by ID."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        # Create an invoice first
        invoice_data = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        create_response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
        invoice_id = create_response.get_json()['invoice']['id']
        
        response = client.get(f'/api/invoices/{invoice_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['invoice']['id'] == invoice_id
        assert data['invoice']['customer_id'] == customer_id
    
    def test_get_invoice_by_id_not_found(self, client, auth_headers):
        """Test retrieval of non-existent invoice."""
        response = client.get('/api/invoices/999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_update_invoice_success(self, client, auth_headers):
        """Test successful invoice update."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        # Create an invoice first
        invoice_data = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        create_response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
        invoice_id = create_response.get_json()['invoice']['id']
        
        # Update invoice
        update_data = {'notes': 'Updated notes', 'tax_rate': 10.0}
        response = client.put(f'/api/invoices/{invoice_id}', 
                            json=update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Invoice updated successfully'
        assert data['invoice']['notes'] == 'Updated notes'
        assert data['invoice']['tax_rate'] == 10.0
    
    def test_update_invoice_not_found(self, client, auth_headers):
        """Test update of non-existent invoice."""
        update_data = {'notes': 'Updated notes'}
        response = client.put('/api/invoices/999', 
                            json=update_data, 
                            headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_delete_invoice_success(self, client, auth_headers):
        """Test successful invoice deletion."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        # Create an invoice first
        invoice_data = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        create_response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
        invoice_id = create_response.get_json()['invoice']['id']
        
        # Delete invoice
        response = client.delete(f'/api/invoices/{invoice_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Invoice deleted successfully'
        
        # Verify invoice is deleted
        get_response = client.get(f'/api/invoices/{invoice_id}', headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_invoice_not_found(self, client, auth_headers):
        """Test deletion of non-existent invoice."""
        response = client.delete('/api/invoices/999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_filter_invoices_by_status(self, client, auth_headers):
        """Test invoice filtering by status."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        # Create invoices with different statuses
        draft_invoice = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'status': 'draft',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        sent_invoice = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-02',
            'due_date': '2024-02-01',
            'status': 'sent',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        
        client.post('/api/invoices', json=draft_invoice, headers=auth_headers)
        client.post('/api/invoices', json=sent_invoice, headers=auth_headers)
        
        # Filter by draft status
        response = client.get('/api/invoices?status=draft', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['invoices']) == 1
        assert data['invoices'][0]['status'] == 'draft'
    
    def test_send_invoice_email(self, client, auth_headers):
        """Test sending invoice via email."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        # Create an invoice first
        invoice_data = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        create_response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
        invoice_id = create_response.get_json()['invoice']['id']
        
        # Send invoice
        response = client.post(f'/api/invoices/{invoice_id}/send', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'sent' in data['message'].lower()
    
    def test_generate_invoice_pdf(self, client, auth_headers):
        """Test generating invoice PDF."""
        customer_id, product_id = self.setup_test_data(client, auth_headers)
        
        # Create an invoice first
        invoice_data = {
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }
        create_response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
        invoice_id = create_response.get_json()['invoice']['id']
        
        # Generate PDF
        response = client.get(f'/api/invoices/{invoice_id}/pdf', headers=auth_headers)
        
        assert response.status_code == 200
        assert response.content_type == 'application/pdf'
    
    def test_invoices_unauthorized_access(self, client):
        """Test accessing invoice routes without authentication."""
        response = client.get('/api/invoices')
        assert response.status_code == 401
        
        response = client.post('/api/invoices', json={'customer_id': 1})
        assert response.status_code == 401
        
        response = client.put('/api/invoices/1', json={'notes': 'Test'})
        assert response.status_code == 401
        
        response = client.delete('/api/invoices/1')
        assert response.status_code == 401

