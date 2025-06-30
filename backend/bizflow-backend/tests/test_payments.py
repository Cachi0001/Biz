import pytest
import json
from unittest.mock import patch, MagicMock
from src.models.payment import Payment
from src.models.invoice import Invoice
from src.models.customer import Customer
from src.models.user import db

class TestPaymentRoutes:
    """Test cases for payment management routes."""
    
    def setup_test_data(self, client, auth_headers):
        """Setup test customer and invoice data."""
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
            'stock_quantity': 50
        }, headers=auth_headers)
        product_id = product_response.get_json()['product']['id']
        
        # Create an invoice
        invoice_response = client.post('/api/invoices', json={
            'customer_id': customer_id,
            'invoice_date': '2024-01-01',
            'due_date': '2024-01-31',
            'items': [{'product_id': product_id, 'quantity': 1, 'unit_price': 1000.00}]
        }, headers=auth_headers)
        invoice_id = invoice_response.get_json()['invoice']['id']
        
        return customer_id, invoice_id
    
    @patch('src.services.paystack_service.paystack_service.initialize_transaction')
    def test_initialize_payment_success(self, mock_initialize, client, auth_headers):
        """Test successful payment initialization."""
        customer_id, invoice_id = self.setup_test_data(client, auth_headers)
        
        # Mock Paystack response
        mock_initialize.return_value = {
            'status': True,
            'data': {
                'authorization_url': 'https://checkout.paystack.com/test123',
                'access_code': 'test_access_code',
                'reference': 'test_reference_123'
            }
        }
        
        payment_data = {
            'invoice_id': invoice_id,
            'amount': 1000.00,
            'payment_method': 'paystack'
        }
        
        response = client.post('/api/payments/initialize', 
                             json=payment_data, 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'authorization_url' in data
        assert 'reference' in data
        mock_initialize.assert_called_once()
    
    @patch('src.services.paystack_service.paystack_service.initialize_transaction')
    def test_initialize_payment_invalid_invoice(self, mock_initialize, client, auth_headers):
        """Test payment initialization with invalid invoice."""
        payment_data = {
            'invoice_id': 999,  # Non-existent invoice
            'amount': 1000.00,
            'payment_method': 'paystack'
        }
        
        response = client.post('/api/payments/initialize', 
                             json=payment_data, 
                             headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'Invoice not found' in data['error']
        mock_initialize.assert_not_called()
    
    @patch('src.services.paystack_service.paystack_service.verify_transaction')
    def test_verify_payment_success(self, mock_verify, client, auth_headers):
        """Test successful payment verification."""
        customer_id, invoice_id = self.setup_test_data(client, auth_headers)
        
        # Mock Paystack verification response
        mock_verify.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': 'test_reference_123',
                'amount': 100000,  # Amount in kobo
                'customer': {
                    'email': 'customer@example.com'
                },
                'metadata': {
                    'invoice_id': invoice_id
                }
            }
        }
        
        response = client.post('/api/payments/verify', 
                             json={'reference': 'test_reference_123'}, 
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Payment verified successfully'
        assert data['payment']['status'] == 'completed'
        mock_verify.assert_called_once_with('test_reference_123')
    
    @patch('src.services.paystack_service.paystack_service.verify_transaction')
    def test_verify_payment_failed(self, mock_verify, client, auth_headers):
        """Test verification of failed payment."""
        mock_verify.return_value = {
            'status': True,
            'data': {
                'status': 'failed',
                'reference': 'test_reference_123',
                'amount': 100000
            }
        }
        
        response = client.post('/api/payments/verify', 
                             json={'reference': 'test_reference_123'}, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Payment failed' in data['error']
    
    @patch('src.services.paystack_service.paystack_service.verify_transaction')
    def test_verify_payment_invalid_reference(self, mock_verify, client, auth_headers):
        """Test verification with invalid reference."""
        mock_verify.return_value = {
            'status': False,
            'message': 'Transaction not found'
        }
        
        response = client.post('/api/payments/verify', 
                             json={'reference': 'invalid_reference'}, 
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'verification failed' in data['error'].lower()
    
    def test_get_payments_success(self, client, auth_headers):
        """Test successful retrieval of payments list."""
        customer_id, invoice_id = self.setup_test_data(client, auth_headers)
        
        # Create a payment record directly in database for testing
        with client.application.app_context():
            payment = Payment(
                invoice_id=invoice_id,
                amount=1000.00,
                payment_method='paystack',
                payment_reference='test_ref_123',
                status='completed'
            )
            db.session.add(payment)
            db.session.commit()
        
        response = client.get('/api/payments', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'payments' in data
        assert len(data['payments']) == 1
        assert data['payments'][0]['payment_reference'] == 'test_ref_123'
    
    def test_get_payments_empty_list(self, client, auth_headers):
        """Test retrieval of payments when none exist."""
        response = client.get('/api/payments', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'payments' in data
        assert len(data['payments']) == 0
    
    def test_get_payment_by_id_success(self, client, auth_headers):
        """Test successful retrieval of payment by ID."""
        customer_id, invoice_id = self.setup_test_data(client, auth_headers)
        
        # Create a payment record directly in database for testing
        with client.application.app_context():
            payment = Payment(
                invoice_id=invoice_id,
                amount=1000.00,
                payment_method='paystack',
                payment_reference='test_ref_123',
                status='completed'
            )
            db.session.add(payment)
            db.session.commit()
            payment_id = payment.id
        
        response = client.get(f'/api/payments/{payment_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['payment']['id'] == payment_id
        assert data['payment']['payment_reference'] == 'test_ref_123'
    
    def test_get_payment_by_id_not_found(self, client, auth_headers):
        """Test retrieval of non-existent payment."""
        response = client.get('/api/payments/999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'not found' in data['error']
    
    def test_filter_payments_by_status(self, client, auth_headers):
        """Test payment filtering by status."""
        customer_id, invoice_id = self.setup_test_data(client, auth_headers)
        
        # Create payments with different statuses
        with client.application.app_context():
            completed_payment = Payment(
                invoice_id=invoice_id,
                amount=1000.00,
                payment_method='paystack',
                payment_reference='completed_ref',
                status='completed'
            )
            pending_payment = Payment(
                invoice_id=invoice_id,
                amount=500.00,
                payment_method='paystack',
                payment_reference='pending_ref',
                status='pending'
            )
            db.session.add_all([completed_payment, pending_payment])
            db.session.commit()
        
        # Filter by completed status
        response = client.get('/api/payments?status=completed', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['payments']) == 1
        assert data['payments'][0]['status'] == 'completed'
    
    def test_filter_payments_by_invoice(self, client, auth_headers):
        """Test payment filtering by invoice ID."""
        customer_id, invoice_id = self.setup_test_data(client, auth_headers)
        
        # Create a payment for the invoice
        with client.application.app_context():
            payment = Payment(
                invoice_id=invoice_id,
                amount=1000.00,
                payment_method='paystack',
                payment_reference='test_ref',
                status='completed'
            )
            db.session.add(payment)
            db.session.commit()
        
        # Filter by invoice ID
        response = client.get(f'/api/payments?invoice_id={invoice_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['payments']) == 1
        assert data['payments'][0]['invoice_id'] == invoice_id
    
    @patch('src.services.paystack_service.paystack_service.webhook_signature_valid')
    def test_webhook_valid_signature(self, mock_signature_valid, client):
        """Test webhook with valid signature."""
        mock_signature_valid.return_value = True
        
        webhook_data = {
            'event': 'charge.success',
            'data': {
                'reference': 'test_reference_123',
                'status': 'success',
                'amount': 100000,
                'metadata': {
                    'invoice_id': 1
                }
            }
        }
        
        headers = {'X-Paystack-Signature': 'valid_signature'}
        response = client.post('/api/payments/webhook', 
                             json=webhook_data, 
                             headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Webhook processed successfully'
    
    @patch('src.services.paystack_service.paystack_service.webhook_signature_valid')
    def test_webhook_invalid_signature(self, mock_signature_valid, client):
        """Test webhook with invalid signature."""
        mock_signature_valid.return_value = False
        
        webhook_data = {
            'event': 'charge.success',
            'data': {
                'reference': 'test_reference_123'
            }
        }
        
        headers = {'X-Paystack-Signature': 'invalid_signature'}
        response = client.post('/api/payments/webhook', 
                             json=webhook_data, 
                             headers=headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Invalid signature' in data['error']
    
    def test_payments_unauthorized_access(self, client):
        """Test accessing payment routes without authentication."""
        response = client.get('/api/payments')
        assert response.status_code == 401
        
        response = client.post('/api/payments/initialize', json={'amount': 1000})
        assert response.status_code == 401
        
        response = client.post('/api/payments/verify', json={'reference': 'test'})
        assert response.status_code == 401

