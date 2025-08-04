# Implementation Plan

- [x] 1. Database Schema Setup and Migrations



  - Create migration scripts for new tables (payment_methods, sale_payments, product_categories)
  - Write migration scripts to add new columns to existing tables (payments, sales, products)
  - Implement data migration script to populate payment_methods table with standardized methods
  - Create database indexes for performance optimization on new foreign key relationships
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 6.1_




- [ ] 2. Backend Core Services Implementation
- [ ] 2.1 Create Payment Method Management Service
  - Implement PaymentMethodService class with CRUD operations for payment methods


  - Write methods to retrieve payment methods by type (Cash, Digital, Credit)


  - Create validation logic for payment method selection and POS field requirements
  - Write unit tests for payment method service functionality
  - _Requirements: 1.1, 1.2, 6.1_



- [ ] 2.2 Enhance Payment Service for POS Integration
  - Modify existing PaymentService to handle new payment_method_id field
  - Implement POS transaction recording with pos_account_name, transaction_type, pos_reference_number
  - Add validation logic for POS-specific fields when is_pos_transaction is true
  - Create methods for daily cash and POS summary calculations
  - Write comprehensive unit tests for enhanced payment recording
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 6.2_



- [ ] 2.3 Implement Credit Sales Management Service
  - Create CreditSalesService class for managing credit sales and partial payments
  - Implement record_partial_payment method to handle partial payment recording
  - Write logic to update amount_paid and amount_due in sales table
  - Create automatic payment status updates when amount_due reaches zero



  - Implement get_outstanding_credit_sales method for accounts receivable tracking
  - Write unit tests for all credit sales management functionality
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2_

- [ ] 3. Enhanced Sales Service Implementation
- [x] 3.1 Modify Sales Creation Logic


  - Update create_sale method to initialize amount_paid and amount_due for credit sales
  - Implement proper payment_method_id assignment during sale creation
  - Add product_category_id linking during sale creation
  - Create validation to ensure total_amount equals amount_paid + amount_due
  - Write unit tests for enhanced sales creation logic
  - _Requirements: 3.1, 5.1, 5.2_



- [ ] 3.2 Implement Sales Status Update Functionality
  - Create update_sale_status endpoint to handle payment status transitions
  - Implement logic to change payment_status from 'Credit'/'Pending' to 'Paid'
  - Add payment_method update capability when status changes to paid
  - Create validation to prevent invalid status transitions
  - Write integration tests for sales status update workflow
  - _Requirements: 5.1, 5.2_




- [ ] 4. Revenue Recognition Logic Implementation
- [ ] 4.1 Modify Revenue Calculation Methods
  - Update total_sales calculation to exclude sales with payment_status 'Credit' or 'Pending'
  - Modify gross_profit calculations to only include sales with payment_status 'Paid'
  - Implement separate calculation for 'Outstanding Credit Sales' or 'Accounts Receivable'
  - Create methods to track revenue recognition changes when payment status updates


  - Write unit tests for revenue recognition logic with various payment statuses
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Daily Summary and Reporting Service
- [ ] 5.1 Implement Daily Financial Summary Calculations
  - Create ReportsService class with generate_daily_summary method

  - Implement cash at hand calculation (cash in minus cash out for the day)
  - Create POS deposits and withdrawals calculation grouped by POS account
  - Implement product category sales totals (e.g., drinks category sales)
  - Add date range validation and error handling for summary calculations
  - Write comprehensive unit tests for all daily summary calculations
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5.2 Create HTML Report Generation System



  - Implement HTML template system for daily summary reports
  - Create generate_html_report method using existing HTML template patterns
  - Design responsive HTML template with cash summary, POS totals, and category breakdowns
  - Implement proper data formatting for currency and percentages in HTML output
  - Add error handling for template rendering failures


  - Write integration tests for HTML report generation
  - _Requirements: 2.4_

- [ ] 6. Backend API Endpoints Implementation
- [ ] 6.1 Create Payment Management API Endpoints
  - Implement GET /api/payments/methods endpoint to return standardized payment methods
  - Create enhanced POST /api/payments/record endpoint with POS transaction support
  - Implement GET /api/payments/daily-summary endpoint for payment method breakdowns
  - Add proper request validation and error handling for all payment endpoints
  - Write API integration tests for payment management endpoints
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2_

- [ ] 6.2 Implement Sales Management API Endpoints
  - Create PUT /api/sales/{sale_id}/update-status endpoint for payment status updates
  - Implement POST /api/sales/{sale_id}/partial-payment endpoint for credit sales
  - Add GET /api/sales/credit endpoint to retrieve outstanding credit sales
  - Create proper request validation and business logic validation
  - Write comprehensive API tests for sales management endpoints
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2_

- [ ] 6.3 Create Daily Reports API Endpoints
  - Implement GET /api/reports/daily-summary endpoint with date parameter support
  - Create GET /api/reports/daily-summary/download-html endpoint for HTML downloads
  - Add proper date validation and error handling for invalid date ranges
  - Implement caching mechanism for frequently requested daily summaries
  - Write API integration tests for reports endpoints
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7. Frontend Payment Method Components
- [ ] 7.1 Create Enhanced Payment Method Selector Component
  - Build PaymentMethodSelector component with standardized payment method dropdown
  - Implement conditional POS fields display when POS payment method is selected
  - Add form validation for required POS fields (account name, transaction type, reference)
  - Create proper error handling and user feedback for payment method selection
  - Write component unit tests for payment method selector functionality
  - _Requirements: 1.1, 1.2, 1.3, 6.2_

- [ ] 7.2 Update Existing Forms with Enhanced Payment Methods
  - Modify ExpenseForm component to use new PaymentMethodSelector
  - Update sales entry forms to include enhanced payment method selection
  - Add POS transaction fields to payment recording forms
  - Implement proper form validation for POS-specific fields
  - Write integration tests for updated forms with new payment method handling
  - _Requirements: 1.2, 1.3, 6.1, 6.2_

- [ ] 8. Credit Sales Management Frontend
- [ ] 8.1 Create Credit Sales Management Component
  - Build CreditSalesManager component to display outstanding balances
  - Implement partial payment recording interface with amount validation
  - Create payment history display showing all partial payments
  - Add automatic balance updates when partial payments are recorded
  - Write component tests for credit sales management functionality
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 8.2 Implement Sales Status Update Interface
  - Create SalesStatusUpdater component for changing payment status
  - Implement dropdown for status transitions (Credit/Pending to Paid)
  - Add payment method selection when marking sales as paid
  - Create confirmation dialogs for status changes that affect revenue recognition
  - Write integration tests for sales status update workflow
  - _Requirements: 5.1, 5.2_

- [ ] 9. Daily Summary Dashboard Implementation
- [ ] 9.1 Create Daily Summary Dashboard Component
  - Build DailySummaryDashboard component with date selector
  - Implement cash at hand display with breakdown of cash in/out
  - Create POS summary cards showing deposits and withdrawals by account
  - Add product category sales display with visual charts or cards
  - Write component tests for daily summary dashboard functionality
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 9.2 Implement HTML Download Functionality
  - Create downloadDailySummaryHTML function using existing HTML template patterns
  - Implement proper data formatting for HTML report generation
  - Add download trigger button with loading states and error handling
  - Create responsive HTML template matching existing report styles
  - Write integration tests for HTML download functionality
  - _Requirements: 2.4_

- [ ] 10. Revenue Recognition Frontend Updates
- [ ] 10.1 Update Dashboard Analytics Components
  - Modify existing revenue display components to exclude unpaid credit sales
  - Create separate display for 'Outstanding Credit Sales' or 'Accounts Receivable'
  - Update profit calculations to only include paid sales
  - Add visual indicators to distinguish between recognized and potential revenue
  - Write tests for updated revenue recognition display logic
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 11. Data Migration and Cleanup
- [ ] 11.1 Create Data Migration Scripts
  - Write script to migrate existing payment_method text values to payment_method_id references
  - Create script to populate product_categories table with existing product categories
  - Implement script to initialize amount_paid and amount_due for existing sales
  - Add script to update existing sales with proper payment_status values
  - Write validation scripts to ensure data integrity after migration
  - _Requirements: 1.1, 3.1, 4.1_

- [ ] 12. Testing and Quality Assurance
- [ ] 12.1 Comprehensive Integration Testing
  - Write end-to-end tests for complete payment recording workflow
  - Create integration tests for credit sales lifecycle with partial payments
  - Implement tests for daily summary generation with various data scenarios
  - Add performance tests for daily summary calculations with large datasets
  - Write tests for HTML report generation and download functionality
  - _Requirements: All requirements_

- [ ] 12.2 User Acceptance Testing Preparation
  - Create test data sets representing typical Nigerian SME scenarios
  - Write user testing scripts for POS transaction recording workflows
  - Prepare test scenarios for credit sales management and partial payments
  - Create documentation for testing daily summary and reporting features
  - Implement error handling validation tests for edge cases
  - _Requirements: All requirements_