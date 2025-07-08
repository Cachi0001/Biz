import pytest
import os
import sys
from datetime import datetime, timedelta
import pytz

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# Mock Flask app and dependencies for testing
class MockSupabase:
    """Mock Supabase client for testing."""
    
    def __init__(self):
        self.data_store = {}
        self.tables = {}
    
    def table(self, table_name):
        if table_name not in self.tables:
            self.tables[table_name] = MockTable(table_name, self.data_store)
        return self.tables[table_name]

class MockTable:
    """Mock Supabase table for testing."""
    
    def __init__(self, table_name, data_store):
        self.table_name = table_name
        self.data_store = data_store
        if table_name not in self.data_store:
            self.data_store[table_name] = []
        self.query_filters = {}
        self.selected_columns = "*"
    
    def select(self, columns="*"):
        self.selected_columns = columns
        return self
    
    def eq(self, column, value):
        self.query_filters[column] = value
        return self
    
    def insert(self, data):
        if isinstance(data, list):
            for item in data:
                if 'id' not in item:
                    item['id'] = f"{self.table_name}_{len(self.data_store[self.table_name])}"
                self.data_store[self.table_name].append(item)
        else:
            if 'id' not in data:
                data['id'] = f"{self.table_name}_{len(self.data_store[self.table_name])}"
            self.data_store[self.table_name].append(data)
        
        result = MockResult()
        result.data = [data] if not isinstance(data, list) else data
        return result
    
    def update(self, data):
        # Find and update matching records
        updated_records = []
        for record in self.data_store[self.table_name]:
            match = True
            for key, value in self.query_filters.items():
                if record.get(key) != value:
                    match = False
                    break
            
            if match:
                record.update(data)
                updated_records.append(record)
        
        result = MockResult()
        result.data = updated_records
        return result
    
    def delete(self):
        # Find and delete matching records
        deleted_records = []
        remaining_records = []
        
        for record in self.data_store[self.table_name]:
            match = True
            for key, value in self.query_filters.items():
                if record.get(key) != value:
                    match = False
                    break
            
            if match:
                deleted_records.append(record)
            else:
                remaining_records.append(record)
        
        self.data_store[self.table_name] = remaining_records
        
        result = MockResult()
        result.data = deleted_records
        return result
    
    def execute(self):
        # Apply filters and return matching records
        matching_records = []
        
        for record in self.data_store[self.table_name]:
            match = True
            for key, value in self.query_filters.items():
                if record.get(key) != value:
                    match = False
                    break
            
            if match:
                matching_records.append(record)
        
        result = MockResult()
        result.data = matching_records
        return result

class MockResult:
    """Mock Supabase result for testing."""
    
    def __init__(self):
        self.data = []

@pytest.fixture
def mock_supabase():
    """Provide a mock Supabase client for testing."""
    return MockSupabase()

@pytest.fixture
def app(mock_supabase):
    """Create a Flask app for testing."""
    try:
        from api.index import create_app
        app = create_app()
    except ImportError:
        # Create a minimal Flask app if the main app can't be imported
        from flask import Flask
        app = Flask(__name__)
    
    # Configure for testing
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_secret_key'
    app.config['JWT_SECRET_KEY'] = 'test_jwt_secret'
    app.config['SUPABASE'] = mock_supabase
    
    return app

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        'id': 'test_user_id',
        'email': 'test@example.com',
        'phone': '+2348012345678',
        'password_hash': 'hashed_password',
        'full_name': 'Test User',
        'business_name': 'Test Business',
        'role': 'Owner',
        'subscription_plan': 'weekly',
        'subscription_status': 'trial',
        'active': True,
        'created_at': pytz.UTC.localize(datetime.utcnow()).isoformat(),
        'updated_at': pytz.UTC.localize(datetime.utcnow()).isoformat(),
        'trial_ends_at': (pytz.UTC.localize(datetime.utcnow()) + timedelta(days=7)).isoformat()
    }

@pytest.fixture
def auth_headers(client, mock_supabase, sample_user_data):
    """Create authentication headers for testing."""
    # Add user to mock database
    mock_supabase.table('users').insert(sample_user_data).execute()
    
    # Create a mock JWT token
    try:
        from flask_jwt_extended import create_access_token
        with client.application.app_context():
            token = create_access_token(identity=sample_user_data['id'])
    except ImportError:
        # Fallback to a simple token if JWT is not available
        token = 'mock_jwt_token'
    
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def sample_customer_data():
    """Sample customer data for testing."""
    return {
        'name': 'Test Customer',
        'email': 'customer@example.com',
        'phone': '+2348012345679',
        'address': '123 Test Street, Lagos, Nigeria',
        'city': 'Lagos',
        'state': 'Lagos',
        'country': 'Nigeria'
    }

@pytest.fixture
def sample_product_data():
    """Sample product data for testing."""
    return {
        'name': 'Test Product',
        'sku': 'TEST-001',
        'description': 'A test product for testing purposes',
        'price': 1000.00,
        'cost_price': 750.00,
        'quantity': 50,
        'low_stock_threshold': 10,
        'category': 'Test Category',
        'status': 'active'
    }

@pytest.fixture
def sample_invoice_data(sample_customer_data, sample_product_data):
    """Sample invoice data for testing."""
    return {
        'customer_id': 'test_customer_id',
        'invoice_date': datetime.now().strftime('%Y-%m-%d'),
        'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
        'status': 'draft',
        'notes': 'Test invoice notes',
        'tax_rate': 7.5,
        'discount_amount': 0,
        'items': [
            {
                'product_id': 'test_product_id',
                'description': sample_product_data['name'],
                'quantity': 2,
                'unit_price': sample_product_data['price']
            }
        ]
    }

@pytest.fixture
def sample_payment_data():
    """Sample payment data for testing."""
    return {
        'invoice_id': 'test_invoice_id',
        'amount': 2000.00,
        'payment_method': 'bank_transfer',
        'payment_date': datetime.now().strftime('%Y-%m-%d'),
        'reference': 'TEST_REF_123',
        'status': 'completed',
        'notes': 'Test payment'
    }

@pytest.fixture
def sample_expense_data():
    """Sample expense data for testing."""
    return {
        'description': 'Test Expense',
        'amount': 500.00,
        'category': 'Office Supplies',
        'expense_date': datetime.now().strftime('%Y-%m-%d'),
        'payment_method': 'cash',
        'receipt_url': None,
        'notes': 'Test expense for office supplies'
    }

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup test environment variables."""
    test_env = {
        'FLASK_ENV': 'testing',
        'TESTING': 'true',
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_SERVICE_KEY': 'test_key',
        'JWT_SECRET_KEY': 'test_jwt_secret',
        'SECRET_KEY': 'test_secret_key'
    }
    
    # Store original values
    original_env = {}
    for key, value in test_env.items():
        original_env[key] = os.environ.get(key)
        os.environ[key] = value
    
    yield
    
    # Restore original values
    for key, value in original_env.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value

# Test markers
pytest.mark.unit = pytest.mark.unit
pytest.mark.integration = pytest.mark.integration
pytest.mark.slow = pytest.mark.slow
pytest.mark.auth = pytest.mark.auth
pytest.mark.dashboard = pytest.mark.dashboard
pytest.mark.products = pytest.mark.products
pytest.mark.customers = pytest.mark.customers
pytest.mark.invoices = pytest.mark.invoices
pytest.mark.payments = pytest.mark.payments

