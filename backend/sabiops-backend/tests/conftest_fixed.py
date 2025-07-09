import pytest
import os
import sys
from datetime import datetime, timedelta
import pytz

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.join(backend_dir, 'src'))
sys.path.insert(0, os.path.join(backend_dir, 'api'))

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
        # Try to import the actual app
        from index import app as flask_app
        flask_app.config['TESTING'] = True
        flask_app.config['SUPABASE'] = mock_supabase
        flask_app.config['MOCK_DB'] = {
            'users': [],
            'customers': [],
            'products': [],
            'invoices': [],
            'sales': [],
            'expenses': [],
            'team': [],
            'transactions': [],
            'payments': [],
            'settings': {}
        }
        return flask_app
    except ImportError:
        # Create a minimal Flask app if the main app can't be imported
        from flask import Flask, g
        flask_app = Flask(__name__)
        flask_app.config['TESTING'] = True
        flask_app.config['SECRET_KEY'] = 'test_secret_key'
        flask_app.config['JWT_SECRET_KEY'] = 'test_jwt_secret'
        flask_app.config['SUPABASE'] = mock_supabase
        flask_app.config['MOCK_DB'] = {
            'users': [],
            'customers': [],
            'products': [],
            'invoices': [],
            'sales': [],
            'expenses': [],
            'team': [],
            'transactions': [],
            'payments': [],
            'settings': {}
        }
        
        @flask_app.before_request
        def load_mock_data():
            g.user = None
            g.supabase = mock_supabase
            g.mock_db = flask_app.config['MOCK_DB']
        
        return flask_app

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
        'updated_at': pytz.UTC.localize(datetime.utcnow()).isoformat()
    }

@pytest.fixture
def auth_headers(client, sample_user_data):
    """Provide authorization headers for authenticated requests."""
    # Mock JWT token (in real scenario, this would be generated by the auth system)
    mock_token = "mock_jwt_token_for_testing"
    return {
        'Authorization': f'Bearer {mock_token}',
        'Content-Type': 'application/json'
    }
