import pytest
import json
from datetime import datetime, timedelta, timezone

class TestSearchRoutes:
    """Test cases for the global search routes."""

    @pytest.fixture
    def auth_headers(self, client):
        """Fixture to provide authentication headers for tests."""
        # This assumes a user is registered and logged in to get a valid token.
        # In a real scenario, you might have a dedicated test user or mock the login process.
        register_data = {
            "email": "testuser@example.com",
            "phone": "1234567890",
            "password": "testpassword",
            "full_name": "Test User",
            "business_name": "Test Business"
        }
        client.post('/api/auth/register', json=register_data)
        login_data = {
            "login": "testuser@example.com",
            "password": "testpassword"
        }
        response = client.post('/api/auth/login', json=login_data)
        token = response.json['data']['access_token']
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    def setup_search_data(self, client, auth_headers):
        """Fixture to set up mock data for search tests."""
        # Get owner_id from the auth_headers
        # This is a simplification; in a real app, you'd get the user ID from the token or a mock.
        # For now, we'll assume the owner_id is the same as the test user's ID after login.
        # You might need to adjust this based on how your `get_jwt_identity()` works in tests.
        login_data = {
            "login": "testuser@example.com",
            "password": "testpassword"
        }
        response = client.post('/api/auth/login', json=login_data)
        owner_id = response.json['data']['user']['id']

        # Clear existing data (if any) to ensure a clean state for each test
        # This is a placeholder; actual clearing would depend on your test setup
        # For Supabase, you might need to truncate tables directly or use a test-specific schema.

        # Add customers
        client.post('/api/customer/', json={"name": "John Doe", "email": "john@example.com", "phone": "1112223333"}, headers=auth_headers)
        client.post('/api/customer/', json={"name": "Jane Smith", "email": "jane@example.com", "phone": "4445556666"}, headers=auth_headers)

        # Add products
        client.post('/api/product/', json={"name": "Laptop Pro", "description": "High performance laptop", "sku": "LP001", "category": "Electronics", "price": 1200.00, "quantity": 10, "active": True}, headers=auth_headers)
        client.post('/api/product/', json={"name": "Mouse Wireless", "description": "Ergonomic wireless mouse", "sku": "MW001", "category": "Accessories", "price": 25.00, "quantity": 50, "active": True}, headers=auth_headers)

        # Add invoices (assuming customer_id is known or can be fetched)
        # For simplicity, we'll use a dummy customer_id here. In a real test, you'd fetch it.
        customer_response = client.get('/api/customer/', headers=auth_headers)
        customer_id = customer_response.json['data']['customers'][0]['id'] if customer_response.json['data']['customers'] else 'dummy_customer_id'

        invoice_data_1 = {
            "customer_id": customer_id,
            "items": [{"description": "Laptop Pro", "quantity": 1, "unit_price": 1200.00}],
            "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "notes": "First invoice"
        }
        invoice_data_2 = {
            "customer_id": customer_id,
            "items": [{"description": "Mouse Wireless", "quantity": 2, "unit_price": 25.00}],
            "due_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
            "notes": "Second invoice"
        }
        client.post('/api/invoice/', json=invoice_data_1, headers=auth_headers)
        client.post('/api/invoice/', json=invoice_data_2, headers=auth_headers)

        # Add transactions
        client.post('/api/transaction/', json={"amount": 100.00, "type": "income", "category": "Sales", "description": "Sale of goods"}, headers=auth_headers)
        client.post('/api/transaction/', json={"amount": 50.00, "type": "expense", "category": "Utilities", "description": "Electricity bill"}, headers=auth_headers)

        # Add expenses
        client.post('/api/expense/', json={"amount": 75.00, "category": "Office Supplies", "description": "Pens and paper"}, headers=auth_headers)
        client.post('/api/expense/', json={"amount": 200.00, "category": "Marketing", "description": "Online ads"}, headers=auth_headers)

        return owner_id # Return owner_id for potential use in tests

    def test_global_search_success_customers(self, client, auth_headers, setup_search_data):
        """Test global search for customers."""
        response = client.get('/api/search?q=John', headers=auth_headers)
        assert response.status_code == 200
        data = response.json['data']
        assert len(data['customers']) == 1
        assert data['customers'][0]['name'] == 'John Doe'
        assert len(data['products']) == 0
        assert len(data['invoices']) == 0
        assert len(data['transactions']) == 0
        assert len(data['expenses']) == 0

    def test_global_search_success_products(self, client, auth_headers, setup_search_data):
        """Test global search for products."""
        response = client.get('/api/search?q=Laptop', headers=auth_headers)
        assert response.status_code == 200
        data = response.json['data']
        assert len(data['products']) == 1
        assert data['products'][0]['name'] == 'Laptop Pro'
        assert len(data['customers']) == 0
        assert len(data['invoices']) == 0
        assert len(data['transactions']) == 0
        assert len(data['expenses']) == 0

    def test_global_search_success_invoices(self, client, auth_headers, setup_search_data):
        """Test global search for invoices."""
        response = client.get('/api/search?q=First', headers=auth_headers) # Searching by notes
        assert response.status_code == 200
        data = response.json['data']
        assert len(data['invoices']) == 1
        assert data['invoices'][0]['notes'] == 'First invoice'
        assert len(data['customers']) == 0
        assert len(data['products']) == 0
        assert len(data['transactions']) == 0
        assert len(data['expenses']) == 0

    def test_global_search_success_transactions(self, client, auth_headers, setup_search_data):
        """Test global search for transactions."""
        response = client.get('/api/search?q=goods', headers=auth_headers) # Searching by description
        assert response.status_code == 200
        data = response.json['data']
        assert len(data['transactions']) == 1
        assert data['transactions'][0]['description'] == 'Sale of goods'
        assert len(data['customers']) == 0
        assert len(data['products']) == 0
        assert len(data['invoices']) == 0
        assert len(data['expenses']) == 0

    def test_global_search_success_expenses(self, client, auth_headers, setup_search_data):
        """Test global search for expenses."""
        response = client.get('/api/search?q=Online', headers=auth_headers) # Searching by description
        assert response.status_code == 200
        data = response.json['data']
        assert len(data['expenses']) == 1
        assert data['expenses'][0]['description'] == 'Online ads'
        assert len(data['customers']) == 0
        assert len(data['products']) == 0
        assert len(data['invoices']) == 0
        assert len(data['transactions']) == 0

    def test_global_search_no_query(self, client, auth_headers, setup_search_data):
        """Test global search with no query parameter."""
        response = client.get('/api/search', headers=auth_headers)
        assert response.status_code == 200
        data = response.json['data']
        assert len(data['customers']) == 0
        assert len(data['products']) == 0
        assert len(data['invoices']) == 0
        assert len(data['transactions']) == 0
        assert len(data['expenses']) == 0

    def test_global_search_no_results(self, client, auth_headers, setup_search_data):
        """Test global search with a query that yields no results."""
        response = client.get('/api/search?q=NonExistentItem', headers=auth_headers)
        assert response.status_code == 200
        data = response.json['data']
        assert len(data['customers']) == 0
        assert len(data['products']) == 0
        assert len(data['invoices']) == 0
        assert len(data['transactions']) == 0
        assert len(data['expenses']) == 0

    def test_global_search_unauthorized(self, client):
        """Test global search without authentication."""
        response = client.get('/api/search?q=test')
        assert response.status_code == 401
        assert "Unauthorized" in response.json['message']
