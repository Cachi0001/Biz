# SabiOps Comprehensive Testing Suite

This directory contains comprehensive tests for the SabiOps application, covering API endpoints, mobile responsiveness, error handling, and data consistency.

## 🧪 Test Suites

### 1. API Endpoints Testing (`api_endpoints_test.py`)
- Tests all backend API endpoints with various data scenarios
- Validates response formats and status codes
- Tests error handling and edge cases
- Measures response times and performance
- **Run:** `python Biz/tests/api_endpoints_test.py`

### 2. Mobile Responsiveness Testing (`mobile_responsiveness_test.js`)
- Tests responsive design across different viewport sizes
- Validates touch-friendly interactions
- Checks card layouts (2 per row on mobile)
- Tests navigation visibility and scrollability
- **Run:** Open `Biz/tests/test_runner.html` in browser

### 3. Error Handling Testing (`error_handling_test.js`)
- Tests network error scenarios
- Validates offline functionality
- Tests form validation and user feedback
- Checks loading states and error recovery
- **Run:** Open `Biz/tests/test_runner.html` in browser

### 4. Data Consistency Testing (`data_consistency_test.js`)
- Tests data relationships between entities
- Validates Nigerian formatting (Naira, phone numbers, dates)
- Checks dashboard metric accuracy
- Tests data integration between features
- **Run:** Open `Biz/tests/test_runner.html` in browser

## 🚀 Quick Start

### Run All Tests
```bash
# Run the master test runner
python Biz/tests/run_all_tests.py
```

This will:
1. Check backend server status
2. Run API endpoint tests
3. Generate JavaScript test runner
4. Create manual testing checklist
5. Generate comprehensive HTML report

### Run Individual Test Suites

#### Backend API Tests
```bash
# Make sure backend server is running first
cd Biz/backend/sabiops-backend
python app.py

# Then run API tests
python Biz/tests/api_endpoints_test.py
```

#### Frontend Tests
```bash
# Open the test runner in your browser
open Biz/tests/test_runner.html
# or
start Biz/tests/test_runner.html  # Windows
```

## 📊 Test Reports

After running tests, you'll find these reports:

- **`test_report.html`** - Comprehensive HTML report with visual summaries
- **`consolidated_test_report.json`** - Detailed JSON results for all test suites
- **`api_test_results.json`** - Detailed API test results
- **`mobile_test_results.json`** - Mobile responsiveness test results
- **`error_handling_results.json`** - Error handling test results
- **`data_consistency_results.json`** - Data consistency test results
- **`manual_testing_checklist.md`** - Manual testing checklist for human testers

## 🎯 Testing Requirements

### Prerequisites
- Python 3.7+ with `requests` library
- Backend server running on `localhost:5000`
- Frontend application accessible
- Modern web browser for JavaScript tests

### Test Data Requirements
The tests expect the following API endpoints to be available:
- `GET /customers/` - Customer list
- `POST /customers/` - Create customer
- `GET /products/` - Product list
- `POST /products/` - Create product
- `GET /invoices/` - Invoice list
- `POST /invoices/` - Create invoice
- `GET /sales/` - Sales list
- `POST /sales/` - Create sale
- `GET /expenses/` - Expense list
- `POST /expenses/` - Create expense
- `GET /dashboard/metrics` - Dashboard metrics

## 📱 Mobile Testing

### Automated Mobile Tests
The mobile responsiveness tests check:
- Card layouts (2 per row on mobile)
- Touch-friendly button sizes (44px minimum)
- Navigation visibility
- Form usability on mobile
- Scrollability and overflow handling

### Manual Mobile Testing
Use the manual testing checklist for:
- Testing on actual mobile devices
- Touch interaction validation
- Virtual keyboard compatibility
- Portrait/landscape orientation testing

## 🇳🇬 Nigerian SME Specific Tests

The test suite includes specific validations for Nigerian SME requirements:

### Currency Formatting
- All amounts display with Nigerian Naira symbol (₦)
- Proper number formatting with commas
- Consistent decimal places

### Phone Number Formatting
- Accepts Nigerian phone formats (+234xxx, 0xxx)
- Validates phone number patterns
- Consistent display formatting

### Business Categories
- Tests Nigerian-relevant business categories
- Validates expense categories for local businesses
- Checks category consistency across features

### Date Formatting
- Tests date formats appropriate for Nigerian users
- Validates date consistency across the application

## 🔧 Troubleshooting

### Common Issues

#### Backend Server Not Running
```
Error: Connection failed - server not running?
Solution: Start the backend server on localhost:5000
```

#### JavaScript Tests Not Running
```
Issue: Test runner page shows errors
Solution: Ensure all test files are in the same directory and accessible
```

#### API Tests Failing
```
Issue: All API tests fail with 404 errors
Solution: Check API endpoint URLs and ensure backend routes are properly configured
```

### Test Environment Setup

1. **Backend Setup:**
   ```bash
   cd Biz/backend/sabiops-backend
   pip install -r requirements.txt
   python app.py
   ```

2. **Frontend Setup:**
   ```bash
   cd Biz/frontend/sabiops-frontend
   npm install
   npm start
   ```

3. **Test Dependencies:**
   ```bash
   pip install requests
   ```

## 📈 Success Criteria

### Overall Success Metrics
- **API Tests:** 90%+ pass rate
- **Mobile Responsiveness:** 85%+ pass rate
- **Error Handling:** 80%+ pass rate
- **Data Consistency:** 95%+ pass rate

### Critical Requirements (Must Pass)
- All API endpoints return proper response format
- Mobile card layout shows 2 cards per row
- Nigerian Naira formatting is consistent
- Dashboard metrics match actual data
- Error messages are user-friendly
- Forms work properly on mobile devices

### Performance Requirements
- API responses under 3 seconds
- Page load times under 3 seconds
- No horizontal scrolling on mobile
- Touch targets minimum 44px

## 🤝 Contributing

When adding new tests:

1. Follow the existing test structure
2. Add proper logging and error handling
3. Include success/failure criteria
4. Update this README with new test descriptions
5. Ensure tests work in both automated and manual scenarios

## 📞 Support

For issues with the testing suite:

1. Check the troubleshooting section above
2. Review the generated test reports for specific error details
3. Ensure all prerequisites are met
4. Verify backend and frontend are running properly

---

**Note:** This testing suite is designed specifically for Nigerian SME requirements and includes cultural and business context appropriate for the target market.