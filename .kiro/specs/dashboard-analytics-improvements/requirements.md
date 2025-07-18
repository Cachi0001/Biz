# Dashboard and Analytics Improvements Requirements

## Introduction

This specification addresses critical issues and improvements needed for the SabiOps dashboard and analytics functionality. The current system has several problems including broken navigation, incorrect subscription plan displays, non-functional payment endpoints, and poor mobile responsiveness. This spec will restructure the dashboard to be more focused while moving detailed analytics to a dedicated analytics page, ensuring proper plan-based access controls and mobile optimization.

## Requirements

### Requirement 1: Dashboard Restructuring and Content Organization

**User Story:** As a business owner, I want a clean, focused dashboard that shows essential metrics and quick actions, with detailed analytics moved to a dedicated section, so that I can quickly access core business functions without clutter.

#### Acceptance Criteria

1. WHEN user accesses the dashboard THEN the system SHALL display only essential overview cards (Total Revenue, This Month Revenue, Total Customers, New Customers)
2. WHEN user views the dashboard THEN the system SHALL move Top Products card and Monthly Expenses chart to the Analytics page
3. WHEN user accesses the dashboard THEN the system SHALL maintain Quick Actions section with balanced layout across all devices
4. WHEN user views Quick Actions THEN the system SHALL display primary actions (New Invoice, Record Sale, Add Product, New Customer) prominently
5. WHEN user views Quick Actions THEN the system SHALL display secondary actions (Add Expense, Analytics, Payments, Settings) in a balanced grid below
6. WHEN user accesses Recent Activities THEN the system SHALL display the last 5 activities with proper timestamps
7. WHEN user clicks "View Recent Activities" button THEN the system SHALL navigate to a dedicated activities or transactions page

### Requirement 2: Enhanced Analytics Page with Advanced Features

**User Story:** As a business owner, I want a comprehensive analytics page that shows detailed business insights including top products and low stock alerts, so that I can make informed business decisions.

#### Acceptance Criteria

1. WHEN user accesses Analytics page THEN the system SHALL display moved content from dashboard (Top Products, Monthly Expenses charts)
2. WHEN user views Analytics page THEN the system SHALL show a new "Low Stock Products" card/chart
3. WHEN user views Low Stock Products THEN the system SHALL display products with stock below configured threshold
4. WHEN user accesses Analytics THEN the system SHALL ensure all components are mobile responsive across all device sizes
5. WHEN user on basic/free plan clicks Analytics THEN the system SHALL show upgrade prompt with working "Subscribe Now" button
6. WHEN user clicks "Subscribe Now" THEN the system SHALL navigate to functional upgrade page, not 404 error
7. WHEN user has appropriate subscription THEN the system SHALL display full analytics including revenue trends, expense breakdowns, and product performance

### Requirement 3: Subscription Plan Display and Access Control

**User Story:** As a user on different subscription plans, I want to see accurate plan information and have appropriate access to features based on my current plan, so that I understand my current benefits and limitations.

#### Acceptance Criteria

1. WHEN user is on basic/free plan THEN the system SHALL display "Basic Plan - Active" instead of "Silver Weekly Plan - Active"
2. WHEN user is on basic plan THEN the system SHALL show correct limits (5 invoices/expenses monthly, basic reporting)
3. WHEN user is on Silver Weekly plan THEN the system SHALL remove "7 days free trial" text from the plan card
4. WHEN user is on Silver Weekly plan THEN the system SHALL display correct limits (100 invoices/expenses weekly, unlimited others)
5. WHEN user exceeds plan limits THEN the system SHALL show appropriate upgrade prompts
6. WHEN user role is Admin or Salesperson THEN the system SHALL hide subscription details from their dashboard
7. WHEN owner has active subscription THEN team members SHALL inherit the same access levels

### Requirement 4: Payment System Fixes and Integration

**User Story:** As a business owner, I want to record and track payments without errors, and have payment data properly integrated with sales reporting, so that I can maintain accurate financial records.

#### Acceptance Criteria

1. WHEN user accesses Payments page THEN the system SHALL load without "e.filter is not a function" error
2. WHEN getPayments API returns data THEN the system SHALL properly handle the response format
3. WHEN user records a payment THEN the system SHALL save the payment and update related invoice status
4. WHEN user records a sale THEN the system SHALL automatically create corresponding payment record if payment method is provided
5. WHEN user generates sales report THEN the system SHALL include payment data for accurate reporting
6. WHEN user views transaction history THEN the system SHALL show both sales and payment records properly linked

### Requirement 5: Mobile Responsiveness and UI Balance

**User Story:** As a mobile user, I want all dashboard and analytics components to work perfectly on my device with balanced layouts, so that I can manage my business effectively from anywhere.

#### Acceptance Criteria

1. WHEN user accesses dashboard on mobile THEN all cards SHALL be properly sized and readable
2. WHEN user views Quick Actions on mobile THEN buttons SHALL maintain proper spacing and touch targets
3. WHEN user accesses Analytics on mobile THEN all charts and cards SHALL be responsive and scrollable
4. WHEN user views subscription status on mobile THEN the card SHALL display properly without overflow
5. WHEN user interacts with any component on tablet THEN the layout SHALL adapt appropriately
6. WHEN user switches between portrait and landscape THEN components SHALL reflow correctly
7. WHEN user accesses any page on small screens THEN text SHALL remain readable and buttons accessible

### Requirement 6: Navigation and URL Routing Fixes

**User Story:** As a user, I want all navigation links and buttons to work correctly and take me to the intended destinations, so that I can access all features without encountering broken links.

#### Acceptance Criteria

1. WHEN user clicks "Subscribe Now" from basic plan upgrade prompt THEN the system SHALL navigate to working subscription upgrade page
2. WHEN user clicks "View Recent Activities" THEN the system SHALL navigate to functional activities/transactions page
3. WHEN user clicks Analytics from Quick Actions THEN the system SHALL navigate to enhanced Analytics page
4. WHEN user clicks Payments from Quick Actions THEN the system SHALL navigate to working Payments page
5. WHEN user navigates to /subscription-upgrade THEN the system SHALL display functional upgrade interface, not 404
6. WHEN user completes subscription upgrade THEN the system SHALL update user's plan in real-time
7. WHEN user accesses any protected route THEN the system SHALL properly check subscription access

### Requirement 7: Sales and Reporting Integration

**User Story:** As a business owner, I want sales recording and sales reporting to work together seamlessly, so that my reports accurately reflect all business transactions.

#### Acceptance Criteria

1. WHEN user records a sale THEN the system SHALL immediately update sales reports
2. WHEN user generates sales report THEN the system SHALL include all recorded sales with accurate totals
3. WHEN user records sale with payment THEN the system SHALL create linked payment record
4. WHEN user views dashboard metrics THEN the system SHALL reflect real-time sales data
5. WHEN user accesses Analytics THEN sales data SHALL be consistent across all charts and reports
6. WHEN user filters sales by date range THEN reports SHALL show accurate filtered results
7. WHEN user exports sales report THEN the system SHALL include all relevant transaction details

### Requirement 8: Plan-Based Feature Access and Limits

**User Story:** As a user on a specific subscription plan, I want the system to enforce appropriate limits and provide access to features based on my plan, so that I understand what I can and cannot do.

#### Acceptance Criteria

1. WHEN user on free plan creates 5th invoice THEN the system SHALL show upgrade prompt
2. WHEN user on free plan tries to access advanced analytics THEN the system SHALL show subscription required message
3. WHEN user on Silver plan accesses features THEN the system SHALL allow usage up to plan limits
4. WHEN user approaches plan limits THEN the system SHALL show warning notifications
5. WHEN user exceeds plan limits THEN the system SHALL prevent further actions and show upgrade options
6. WHEN user upgrades plan THEN the system SHALL immediately update access permissions
7. WHEN team member accesses features THEN the system SHALL use owner's subscription plan for access control