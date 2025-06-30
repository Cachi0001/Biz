import pytest
import os
import tempfile
from src.main import create_app
from src.models.user import db

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file to serve as the database
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SECRET_KEY': 'test-secret-key',
        'JWT_SECRET_KEY': 'test-jwt-secret',
        'PAYSTACK_SECRET_KEY': 'sk_test_fake_key',
        'PAYSTACK_PUBLIC_KEY': 'pk_test_fake_key',
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def auth_headers(client):
    """Create a test user and return authorization headers."""
    # Register a test user
    response = client.post('/api/auth/register', json={
        'first_name': 'Test',
        'last_name': 'User',
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword123'
    })
    
    # Login to get token
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'testpassword123'
    })
    
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def sample_customer_data():
    """Sample customer data for testing."""
    return {
        'name': 'John Doe',
        'email': 'john@example.com',
        'phone': '+2348012345678',
        'address': '123 Test Street, Lagos, Nigeria',
        'status': 'active'
    }

@pytest.fixture
def sample_product_data():
    """Sample product data for testing."""
    return {
        'name': 'Test Product',
        'sku': 'TEST-001',
        'description': 'A test product for unit testing',
        'price': 1000.00,
        'stock_quantity': 50,
        'low_stock_alert': 10,
        'category': 'Test Category',
        'status': 'active'
    }

@pytest.fixture
def sample_invoice_data():
    """Sample invoice data for testing."""
    return {
        'customer_id': 1,
        'invoice_date': '2024-01-01',
        'due_date': '2024-01-31',
        'status': 'draft',
        'notes': 'Test invoice',
        'tax_rate': 7.5,
        'discount_amount': 0,
        'items': [
            {
                'product_id': 1,
                'description': 'Test Product',
                'quantity': 2,
                'unit_price': 1000.00
            }
        ]
    }

