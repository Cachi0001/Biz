# SabiOps Backend Testing Guide

This guide provides comprehensive instructions for running and understanding the test suite for the SabiOps backend application.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip3 package manager
- Git (for cloning the repository)

### Installation
```bash
# Clone the repository
git clone https://github.com/Cachi0001/Biz.git
cd Biz/backend/sabiops-backend

# Install dependencies
pip3 install -r requirements.txt

# Install testing dependencies
pip3 install pytest pytest-cov
```

### Running Tests
```bash
# Run all tests with the test runner
python3 tests/test_runner.py --all

# Or run specific test categories
python3 tests/test_runner.py --unit        # Unit tests only
python3 tests/test_runner.py --integration # Integration tests only
python3 tests/test_runner.py --coverage    # With coverage report
```

## 📋 Test Structure

### Unit Tests
Unit tests focus on individual components and functions:

- **`test_auth_comprehensive.py`** - Authentication functionality
  - User registration and validation
  - Login with email/phone
  - JWT token management
  - Password security
  - Role-based access control

- **`test_dashboard_comprehensive.py`** - Dashboard analytics
  - Overview metrics calculation
  - Revenue chart generation
  - Top customers/products analysis
  - Recent activities tracking
  - Timezone handling

- **`test_products_comprehensive.py`** - Product management
  - CRUD operations
  - Stock management
  - Low stock alerts
  - Search and filtering
  - Data validation

- **`test_customers.py`** - Customer management
- **`test_invoices.py`** - Invoice processing
- **`test_payments.py`** - Payment handling

### Integration Tests
Integration tests cover complete business workflows:

- **`test_integration_full_workflow.py`** - End-to-end scenarios
  - Complete business setup workflow
  - Team member management
  - Subscription and limits
  - Inventory management
  - Financial reporting
  - Error handling and recovery
  - Data consistency

## 🔧 Test Configuration

### Environment Variables
Tests automatically configure the following environment variables:
```bash
FLASK_ENV=testing
TESTING=true
SUPABASE_URL=https://test.supabase.co
SUPABASE_SERVICE_KEY=test_key
JWT_SECRET_KEY=test_jwt_secret
SECRET_KEY=test_secret_key
```

### Test Database
Tests use an in-memory SQLite database for isolation and speed. Each test gets a fresh database instance.

## 📊 Test Coverage

### Current Coverage Areas
- ✅ Authentication and authorization
- ✅ User management and roles
- ✅ Product inventory management
- ✅ Customer relationship management
- ✅ Dashboard analytics
- ✅ Invoice generation and management
- ✅ Payment processing
- ✅ Stock management and alerts
- ✅ Data validation and error handling
- ✅ Timezone handling
- ✅ Complete business workflows

### Test Metrics
- **Unit Tests**: 150+ test cases
- **Integration Tests**: 10+ workflow scenarios
- **Code Coverage**: Targeting 90%+ coverage
- **Performance Tests**: Response time validation

## 🎯 Test Categories Explained

### 1. Authentication Tests (`test_auth_comprehensive.py`)
Tests all authentication-related functionality:

```python
# Example test cases:
- User registration with all fields
- Registration with referral codes
- Duplicate email/phone handling
- Login with email and phone
- Invalid credentials handling
- JWT token verification
- Password security validation
- Timezone-aware timestamps
- Role assignment and validation
```

### 2. Dashboard Tests (`test_dashboard_comprehensive.py`)
Tests dashboard analytics and reporting:

```python
# Example test cases:
- Overview metrics calculation
- Revenue chart data generation
- Top customers analysis
- Top products analysis
- Recent activities tracking
- Empty data handling
- Timezone consistency
- Performance validation
```

### 3. Product Tests (`test_products_comprehensive.py`)
Tests product management functionality:

```python
# Example test cases:
- Product creation with validation
- CRUD operations
- Stock management
- Low stock detection
- Search and filtering
- Data type validation
- Decimal precision handling
- Unauthorized access prevention
```

### 4. Integration Tests (`test_integration_full_workflow.py`)
Tests complete business scenarios:

```python
# Example workflows:
- Complete business setup (registration → products → sales)
- Team member creation and access control
- Subscription limits and upgrades
- Inventory management workflow
- Financial reporting workflow
- Error handling and recovery
- Data consistency across operations
```

## 🛠️ Running Specific Tests

### By Test File
```bash
# Run specific test file
python3 -m pytest tests/test_auth_comprehensive.py -v

# Run with coverage
python3 -m pytest tests/test_auth_comprehensive.py --cov=src --cov-report=html
```

### By Test Pattern
```bash
# Run tests matching a pattern
python3 tests/test_runner.py --pattern "auth"
python3 tests/test_runner.py --pattern "dashboard"
python3 tests/test_runner.py --pattern "integration"
```

### By Test Class or Method
```bash
# Run specific test class
python3 -m pytest tests/test_auth_comprehensive.py::TestAuthComprehensive -v

# Run specific test method
python3 -m pytest tests/test_auth_comprehensive.py::TestAuthComprehensive::test_register_success -v
```

## 📈 Coverage Reports

### Generating Coverage Reports
```bash
# HTML coverage report
python3 -m pytest tests/ --cov=src --cov-report=html

# Terminal coverage report
python3 -m pytest tests/ --cov=src --cov-report=term

# Coverage with missing lines
python3 -m pytest tests/ --cov=src --cov-report=term-missing
```

### Viewing Coverage
- HTML Report: Open `htmlcov/index.html` in your browser
- Terminal Report: Shows coverage percentages in console

## 🐛 Debugging Tests

### Verbose Output
```bash
# Run with verbose output
python3 -m pytest tests/ -v

# Show print statements
python3 -m pytest tests/ -s

# Stop on first failure
python3 -m pytest tests/ -x
```

### Test Debugging
```bash
# Run specific failing test
python3 -m pytest tests/test_auth_comprehensive.py::TestAuthComprehensive::test_register_success -v -s

# Show full traceback
python3 -m pytest tests/ --tb=long
```

## 🔍 Test Data and Fixtures

### Common Test Fixtures
- **`app`** - Flask application instance
- **`client`** - Test client for making requests
- **`auth_headers`** - Authentication headers for protected routes
- **`sample_customer_data`** - Sample customer data
- **`sample_product_data`** - Sample product data
- **`sample_invoice_data`** - Sample invoice data

### Test Data Patterns
```python
# Customer data
customer_data = {
    'name': 'Test Customer',
    'email': 'customer@example.com',
    'phone': '+2348012345678',
    'address': '123 Test Street, Lagos'
}

# Product data
product_data = {
    'name': 'Test Product',
    'sku': 'TEST-001',
    'price': 1000.00,
    'quantity': 50,
    'low_stock_threshold': 10
}
```

## 🚨 Common Issues and Solutions

### 1. Import Errors
```bash
# Error: ModuleNotFoundError
# Solution: Ensure you're in the correct directory
cd Biz/backend/sabiops-backend
python3 -m pytest tests/
```

### 2. Database Errors
```bash
# Error: Database connection failed
# Solution: Tests use in-memory database, check SQLAlchemy setup
```

### 3. Authentication Errors
```bash
# Error: JWT token invalid
# Solution: Check JWT_SECRET_KEY in test environment
```

### 4. Dependency Errors
```bash
# Error: Package not found
# Solution: Install missing dependencies
pip3 install -r requirements.txt
pip3 install pytest pytest-cov
```

## 📝 Writing New Tests

### Test File Structure
```python
import pytest
import json
from src.models.user import db

class TestNewFeature:
    """Test cases for new feature."""
    
    def test_feature_success(self, client, auth_headers):
        """Test successful feature operation."""
        # Arrange
        test_data = {'key': 'value'}
        
        # Act
        response = client.post('/api/endpoint', 
                             json=test_data, 
                             headers=auth_headers)
        
        # Assert
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
    
    def test_feature_failure(self, client, auth_headers):
        """Test feature failure scenarios."""
        # Test implementation
        pass
```

### Test Naming Conventions
- Test files: `test_<feature>_comprehensive.py`
- Test classes: `TestFeatureComprehensive`
- Test methods: `test_<action>_<scenario>`

### Best Practices
1. **Arrange-Act-Assert** pattern
2. **Descriptive test names** that explain the scenario
3. **Independent tests** that don't rely on each other
4. **Comprehensive coverage** of success and failure cases
5. **Clear assertions** with meaningful error messages

## 🔄 Continuous Integration

### GitHub Actions (Future)
```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.8
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: python3 tests/test_runner.py --coverage
```

## 📞 Support

### Getting Help
1. **Check test output** for specific error messages
2. **Review test logs** in the console output
3. **Verify environment setup** using `--setup-only` flag
4. **Run individual tests** to isolate issues

### Reporting Issues
When reporting test issues, include:
- Python version (`python3 --version`)
- Operating system
- Full error message and traceback
- Steps to reproduce the issue
- Expected vs actual behavior

## 🎯 Test Goals

### Quality Assurance
- **Functionality**: All features work as expected
- **Reliability**: Consistent behavior across environments
- **Security**: Authentication and authorization work correctly
- **Performance**: Response times within acceptable limits
- **Data Integrity**: Database operations maintain consistency

### Development Support
- **Regression Prevention**: Catch breaking changes early
- **Documentation**: Tests serve as usage examples
- **Confidence**: Safe refactoring and feature additions
- **Debugging**: Isolate and identify issues quickly

---

## 📚 Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Flask Testing](https://flask.palletsprojects.com/en/2.0.x/testing/)
- [Python Testing Best Practices](https://docs.python-guide.org/writing/tests/)

---

*This testing guide is part of the SabiOps project. For more information, see the main project documentation.*

