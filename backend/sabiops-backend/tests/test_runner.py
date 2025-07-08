#!/usr/bin/env python3
"""
Test Runner for SabiOps Backend
This script provides an easy way to run all tests locally with proper setup and reporting.
"""

import os
import sys
import subprocess
import argparse
import time
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def run_command(command, description):
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        end_time = time.time()
        
        print(f"✅ {description} completed successfully in {end_time - start_time:.2f}s")
        if result.stdout:
            print("Output:")
            print(result.stdout)
        return True
        
    except subprocess.CalledProcessError as e:
        end_time = time.time()
        
        print(f"❌ {description} failed after {end_time - start_time:.2f}s")
        print("Error output:")
        print(e.stderr)
        if e.stdout:
            print("Standard output:")
            print(e.stdout)
        return False

def check_dependencies():
    """Check if all required dependencies are installed."""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        'pytest',
        'flask',
        'flask-jwt-extended',
        'flask-cors',
        'supabase',
        'pytz'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} is missing")
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        
        install_command = f"pip3 install {' '.join(missing_packages)}"
        if not run_command(install_command, "Installing missing dependencies"):
            return False
    
    return True

def setup_test_environment():
    """Setup test environment variables."""
    print("🔧 Setting up test environment...")
    
    # Set test environment variables
    test_env = {
        'FLASK_ENV': 'testing',
        'TESTING': 'true',
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_SERVICE_KEY': 'test_key',
        'JWT_SECRET_KEY': 'test_jwt_secret',
        'SECRET_KEY': 'test_secret_key'
    }
    
    for key, value in test_env.items():
        os.environ[key] = value
        print(f"✅ Set {key}")
    
    return True

def run_unit_tests():
    """Run unit tests."""
    test_files = [
        'tests/test_auth_comprehensive.py',
        'tests/test_dashboard_comprehensive.py',
        'tests/test_products_comprehensive.py',
        'tests/test_customers.py',
        'tests/test_invoices.py',
        'tests/test_payments.py'
    ]
    
    success_count = 0
    total_count = len(test_files)
    
    for test_file in test_files:
        if os.path.exists(test_file):
            command = f"python3 -m pytest {test_file} -v --tb=short"
            if run_command(command, f"Running {test_file}"):
                success_count += 1
        else:
            print(f"⚠️  Test file {test_file} not found, skipping...")
    
    print(f"\n📊 Unit Tests Summary: {success_count}/{total_count} test files passed")
    return success_count == total_count

def run_integration_tests():
    """Run integration tests."""
    test_files = [
        'tests/test_integration_full_workflow.py'
    ]
    
    success_count = 0
    total_count = len(test_files)
    
    for test_file in test_files:
        if os.path.exists(test_file):
            command = f"python3 -m pytest {test_file} -v --tb=short"
            if run_command(command, f"Running {test_file}"):
                success_count += 1
        else:
            print(f"⚠️  Test file {test_file} not found, skipping...")
    
    print(f"\n📊 Integration Tests Summary: {success_count}/{total_count} test files passed")
    return success_count == total_count

def run_all_tests():
    """Run all tests with coverage."""
    command = "python3 -m pytest tests/ -v --tb=short --cov=src --cov-report=html --cov-report=term"
    return run_command(command, "Running all tests with coverage")

def run_specific_test(test_pattern):
    """Run specific test based on pattern."""
    command = f"python3 -m pytest -k '{test_pattern}' -v --tb=short"
    return run_command(command, f"Running tests matching pattern: {test_pattern}")

def generate_test_report():
    """Generate a comprehensive test report."""
    print("\n📋 Generating Test Report...")
    
    report_content = f"""
# SabiOps Backend Test Report
Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}

## Test Environment
- Python Version: {sys.version}
- Working Directory: {os.getcwd()}
- Backend Directory: {backend_dir}

## Test Categories

### Unit Tests
- Authentication Tests (test_auth_comprehensive.py)
- Dashboard Tests (test_dashboard_comprehensive.py)
- Product Management Tests (test_products_comprehensive.py)
- Customer Management Tests (test_customers.py)
- Invoice Management Tests (test_invoices.py)
- Payment Processing Tests (test_payments.py)

### Integration Tests
- Full Workflow Tests (test_integration_full_workflow.py)

## How to Run Tests Locally

### Prerequisites
1. Install Python 3.8+
2. Install required dependencies:
   ```bash
   pip3 install -r requirements.txt
   pip3 install pytest pytest-cov
   ```

### Running Tests
1. **All Tests:**
   ```bash
   python3 tests/test_runner.py --all
   ```

2. **Unit Tests Only:**
   ```bash
   python3 tests/test_runner.py --unit
   ```

3. **Integration Tests Only:**
   ```bash
   python3 tests/test_runner.py --integration
   ```

4. **Specific Test Pattern:**
   ```bash
   python3 tests/test_runner.py --pattern "test_auth"
   ```

5. **With Coverage Report:**
   ```bash
   python3 tests/test_runner.py --coverage
   ```

### Test Structure
- Each test file focuses on a specific functionality
- Tests are organized into classes by feature
- Integration tests cover complete business workflows
- All tests use proper setup and teardown

### Environment Setup
Tests automatically set up a test environment with:
- Test database configuration
- Mock external services
- Isolated test data

## Troubleshooting

### Common Issues
1. **Import Errors:** Ensure all dependencies are installed
2. **Database Errors:** Check Supabase configuration
3. **Authentication Errors:** Verify JWT secret keys
4. **Permission Errors:** Ensure proper file permissions

### Getting Help
- Check test output for specific error messages
- Review test logs in the console
- Ensure all environment variables are set correctly
"""
    
    report_file = "test_report.md"
    with open(report_file, 'w') as f:
        f.write(report_content)
    
    print(f"✅ Test report generated: {report_file}")
    return True

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description='SabiOps Backend Test Runner')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    parser.add_argument('--unit', action='store_true', help='Run unit tests only')
    parser.add_argument('--integration', action='store_true', help='Run integration tests only')
    parser.add_argument('--pattern', type=str, help='Run tests matching pattern')
    parser.add_argument('--coverage', action='store_true', help='Run tests with coverage')
    parser.add_argument('--report', action='store_true', help='Generate test report only')
    parser.add_argument('--setup-only', action='store_true', help='Setup environment only')
    
    args = parser.parse_args()
    
    print("🚀 SabiOps Backend Test Runner")
    print("=" * 60)
    
    # Generate report only
    if args.report:
        generate_test_report()
        return
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed. Please install missing packages.")
        sys.exit(1)
    
    # Setup test environment
    if not setup_test_environment():
        print("❌ Environment setup failed.")
        sys.exit(1)
    
    if args.setup_only:
        print("✅ Environment setup completed.")
        return
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    success = True
    
    # Run tests based on arguments
    if args.all or args.coverage:
        success = run_all_tests()
    elif args.unit:
        success = run_unit_tests()
    elif args.integration:
        success = run_integration_tests()
    elif args.pattern:
        success = run_specific_test(args.pattern)
    else:
        # Default: run all tests
        print("No specific test type specified. Running all tests...")
        success = run_all_tests()
    
    # Generate report
    generate_test_report()
    
    # Final summary
    print("\n" + "=" * 60)
    if success:
        print("🎉 All tests completed successfully!")
        print("✅ Your SabiOps backend is working correctly.")
    else:
        print("❌ Some tests failed.")
        print("🔍 Please check the output above for details.")
        sys.exit(1)
    
    print("\n📋 Test report generated: test_report.md")
    print("🔗 For detailed coverage report, check: htmlcov/index.html")

if __name__ == "__main__":
    main()

