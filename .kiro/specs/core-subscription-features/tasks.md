# Core Subscription Features - Implementation Plan

## 1. Fix Build Error and Deploy Dashboard

- [ ] 1.1 Verify Dashboard.jsx default export is working
  - Test import/export structure in App.jsx
  - Ensure all dashboard components are properly imported
  - Fix any remaining build errors
  - _Requirements: Build deployment success_

- [ ] 1.2 Deploy fixed dashboard to production
  - Push changes to main branch
  - Verify Vercel deployment succeeds
  - Test dashboard loads at `/dashboard` route
  - Confirm mobile responsiveness
  - _Requirements: Production deployment working_

## 2. Implement Firebase Notification System

- [ ] 2.1 Create NotificationBell component with unread count
  - Build bell icon component with badge for unread notifications
  - Add click handler to toggle notification center
  - Style with YouTube-like notification bell design
  - Integrate with Firebase messaging for real-time updates
  - _Requirements: 8.1, 8.2_

- [ ] 2.2 Build NotificationCenter component (YouTube-style panel)
  - Create dropdown panel that opens from notification bell
  - Display list of notifications with read/unread states
  - Add "Mark all as read" functionality
  - Implement notification item click navigation
  - Style with modern notification panel design
  - _Requirements: 8.1, 8.2_

- [ ] 2.3 Implement FirebaseService for push notifications
  - Set up Firebase messaging service integration
  - Request notification permissions from users
  - Handle foreground and background message reception
  - Store FCM tokens in database for targeted notifications
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 2.4 Create notification storage and management system
  - Build backend endpoints for notification CRUD operations
  - Implement notification database schema with read/unread tracking
  - Add notification types (low_stock, payment_received, invoice_overdue, trial_expiring)
  - Create notification routing system for navigation
  - _Requirements: 8.1, 8.2_

## 3. Build Subscription Management Core

- [ ] 3.1 Create SubscriptionStatus component based on reference
  - Convert reference SubscriptionStatus.tsx to React component
  - Implement different visual states (Free, Trial, Paid plans)
  - Add usage tracking display for free plan users
  - Include trial countdown with crown icon for trial users
  - Show billing information and manage button for paid users
  - _Requirements: 1.1, 1.4_

- [ ] 3.2 Build UpgradeModal component with Paystack integration
  - Convert reference UpgradeModal.tsx to React component
  - Create plan comparison cards (Weekly ₦1,400, Monthly ₦4,500, Yearly ₦50,000)
  - Note: Database uses 'weekly', 'monthly', 'yearly' (not 'silver_' prefix)
  - Implement Paystack payment initialization with correct plan IDs
  - Add loading states and error handling for payment flow
  - Include current usage display for upgrade motivation
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.3 Implement PaystackService for payment processing
  - Create service class for Paystack payment operations
  - Add payment initialization with correct amounts in kobo
  - Implement payment verification and webhook handling
  - Add error handling for payment failures and retries
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.4 Create subscription context and state management
  - Build subscription context for real-time state management
  - Implement subscription status updates after successful payments
  - Add usage tracking and limits enforcement
  - Create feature access control based on subscription status
  - _Requirements: 6.1, 6.2, 6.3_

## 4. Implement Role-Based Dashboard Rendering

- [ ] 4.1 Create OwnerDashboard component with full access
  - Build comprehensive dashboard with all business metrics
  - Display subscription status prominently with trial countdown
  - Include team management access and referral system
  - Add complete analytics and financial reports
  - Show crown indicator for trial users
  - _Requirements: 3.1, 3.5_

- [ ] 4.2 Build AdminDashboard component for operational focus
  - Create operational metrics dashboard without billing information
  - Include inventory management and customer management tools
  - Add limited team member management capabilities
  - Hide subscription and financial details from view
  - Focus on day-to-day operational tasks
  - _Requirements: 3.2, 3.5_

- [ ] 4.3 Implement SalespersonDashboard for sales focus
  - Build sales-focused dashboard with customer interaction tools
  - Display sales performance tracking and targets
  - Include limited business overview relevant to sales
  - Hide financial and billing information completely
  - Add customer management tools for sales activities
  - _Requirements: 3.3, 3.5_

- [ ] 4.4 Add role-based navigation and feature access control
  - Implement role checking for sensitive features
  - Create navigation menus appropriate for each role
  - Add feature gating based on subscription and role
  - Test access control with different user roles
  - _Requirements: 3.4, 3.5_

## 5. Build Complete CRM and Inventory Management

- [ ] 5.1 Create CustomerManagement component with full CRM
  - Build customer list with search and filtering capabilities
  - Implement customer profile with purchase history and interactions
  - Add customer segmentation (frequent, regular, new, inactive)
  - Include edit/delete functionality for Silver plan users only
  - _Requirements: 9.1, 9.4_

- [ ] 5.2 Implement ProductManagement with Cloudinary integration
  - Create product management interface with image upload
  - Integrate Cloudinary for image storage and optimization
  - Add stock level monitoring and low stock threshold settings
  - Implement automatic stock reduction on sales
  - _Requirements: 9.2, 9.3_

- [ ] 5.3 Build StockAlerts system with Firebase notifications
  - Create configurable low stock alert system
  - Send Firebase push notifications for low stock items
  - Display in-app toast notifications for stock alerts
  - Allow owners and admins to configure alert thresholds
  - _Requirements: 9.2, 9.3_

- [ ] 5.4 Add role-based restocking capabilities
  - Implement restocking interface for owners and admins only
  - Add stock adjustment tracking and history
  - Create bulk stock update functionality
  - Include stock movement reporting
  - _Requirements: 9.2_

## 6. Implement Invoice and Expense Management

- [ ] 6.1 Create InvoiceGenerator with PDF generation
  - Build professional invoice creation interface
  - Implement PDF generation with business branding
  - Add invoice status tracking (Draft, Sent, Paid, Overdue)
  - Include email delivery functionality for invoices
  - _Requirements: 10.1, 10.2_

- [ ] 6.2 Build ExpenseTracker with receipt uploads
  - Create expense recording interface with categorization
  - Integrate Cloudinary for receipt image uploads
  - Add expense reporting and monthly summaries
  - Include expense approval workflow for team members
  - _Requirements: 10.3_

- [ ] 6.3 Implement OfflineSync for offline functionality
  - Create offline data storage using localStorage
  - Build sync mechanism with conflict resolution using timestamps
  - Add sync status indicators and manual sync buttons
  - Handle offline invoice creation and expense entry
  - _Requirements: 10.4, 13.1, 13.2, 13.3_

- [ ] 6.4 Add ReportGenerator for monthly summaries
  - Create comprehensive reporting system
  - Generate downloadable reports in PDF/PNG formats
  - Include revenue, expense, and profit analysis
  - Add role-based report access control
  - _Requirements: 10.5_

## 7. Build Advanced Referral System

- [ ] 7.1 Create ReferralDashboard with earnings tracking
  - Build referral statistics dashboard with total earnings
  - Display referral count and conversion rates
  - Show pending withdrawals and commission history
  - Include referral code sharing functionality
  - _Requirements: 11.1, 11.4_

- [ ] 7.2 Implement commission calculation system
  - Calculate 10% commission for monthly (₦500) and yearly (₦5,000) plans
  - Exclude weekly plans from commission calculations
  - Track referral conversions and payment status
  - Add commission payment processing
  - _Requirements: 11.1, 11.2, 11.5_

- [ ] 7.3 Build WithdrawalSystem with Paystack integration
  - Create withdrawal interface with ₦3,000 minimum requirement
  - Integrate Paystack for withdrawal processing
  - Add withdrawal history and status tracking
  - Include bank account management for withdrawals
  - _Requirements: 11.3_

- [ ] 7.4 Add real-time referral tracking
  - Implement real-time updates for referral activities
  - Create referral link generation and sharing
  - Add referral performance analytics
  - Include referral leaderboard for motivation
  - _Requirements: 11.4_

## 8. Implement Trial Management and Notifications

- [ ] 8.1 Create TrialCountdown component with urgency levels
  - Build trial countdown display with days remaining
  - Implement urgency levels (normal, warning, critical)
  - Add crown icon and visual indicators for trial status
  - Include upgrade prompts based on days remaining
  - _Requirements: 4.1, 4.4_

- [ ] 8.2 Build trial notification system
  - Send email reminders at 3 days and 1 day remaining
  - Create in-app notifications for trial expiration warnings
  - Add prominent upgrade banners when trial is expiring
  - Implement final notification when trial expires
  - _Requirements: 4.2, 4.3_

- [ ] 8.3 Implement trial expiration handling
  - Automatically downgrade to free plan when trial expires
  - Restrict access to premium features after expiration
  - Send final expiration notification with upgrade options
  - Handle graceful feature restriction without data loss
  - _Requirements: 4.3_

- [ ] 8.4 Add intelligent upgrade prompts
  - Monitor usage patterns and suggest upgrades
  - Show upgrade prompts when approaching free plan limits
  - Calculate and display prorated upgrade costs
  - Include usage-based upgrade recommendations
  - _Requirements: 4.5, 12.2, 12.3_

## 9. Implement Feature Usage Tracking and Limits

- [ ] 9.1 Create UsageTracker component for monitoring
  - Build usage tracking system for invoices and expenses
  - Display current usage against plan limits
  - Show usage warnings when approaching limits
  - Include usage history and trends
  - _Requirements: 12.1, 12.3_

- [ ] 9.2 Implement usage limit enforcement
  - Prevent actions when free plan limits are reached
  - Show upgrade prompts when limits are exceeded
  - Allow temporary overages with upgrade suggestions
  - Reset usage counters on billing period renewal
  - _Requirements: 12.2, 12.5_

- [ ] 9.3 Add usage analytics and reporting
  - Create usage analytics dashboard for owners
  - Track feature adoption and usage patterns
  - Generate usage reports for business insights
  - Include usage-based upgrade recommendations
  - _Requirements: 12.4_

- [ ] 9.4 Build subscription limit management
  - Configure different limits for each subscription plan
  - Implement dynamic limit updates on plan changes
  - Add grace period handling for payment failures
  - Include usage rollover policies for plan upgrades
  - _Requirements: 12.4, 12.5_

## 10. Add Team Management and Inheritance

- [ ] 10.1 Create team member management interface
  - Build team member creation form (full name, email, password, role)
  - Implement team member list with roles and status
  - Add team member deactivation functionality
  - Include team statistics and role distribution
  - _Requirements: 1.1, 5.5_

- [ ] 10.2 Implement subscription inheritance system
  - Ensure team members inherit owner's subscription plan
  - Calculate and display inherited trial period
  - Update team member access when owner upgrades
  - Hide subscription details from team member dashboards
  - _Requirements: 1.2, 6.4_

- [ ] 10.3 Add role-based team management
  - Allow only owners to create and manage team members
  - Implement role-based permissions for team features
  - Add team member activity tracking
  - Include team performance metrics
  - _Requirements: 1.1, 5.5_

- [ ] 10.4 Build team collaboration features
  - Add team member communication tools
  - Implement shared customer and product access
  - Create team-based reporting and analytics
  - Include team member performance tracking
  - _Requirements: 6.4_

## 11. Implement Transaction History and Analytics

- [ ] 11.1 Create comprehensive transaction history
  - Build "Money In" (sales) and "Money Out" (expenses) views
  - Implement role-based access (Owner sees all, Admin operational, Salesperson sales only)
  - Add filtering by date, category, and payment method
  - Include transaction search and export functionality
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [ ] 11.2 Build advanced analytics dashboard
  - Create revenue, expense, and profit analysis
  - Add trend analysis and forecasting
  - Implement role-based analytics access
  - Include downloadable reports in PDF/PNG formats
  - _Requirements: 1.1_

- [ ] 11.3 Add payment reconciliation system
  - Implement automatic payment reconciliation with invoices
  - Add manual reconciliation tools for complex transactions
  - Create payment matching algorithms
  - Include reconciliation reporting and audit trails
  - _Requirements: 2.2_

- [ ] 11.4 Build financial reporting suite
  - Create comprehensive financial reports
  - Add profit and loss statements
  - Implement cash flow analysis
  - Include tax reporting preparation tools
  - _Requirements: 1.1_

## 12. Testing and Quality Assurance

- [ ] 12.1 Write comprehensive unit tests
  - Test all subscription components with different states
  - Add PaystackService method testing with mocked responses
  - Test utility functions for date calculations and currency formatting
  - Include usage tracking and limit enforcement testing
  - _Requirements: All components_

- [ ] 12.2 Implement integration tests
  - Test end-to-end payment flow with Paystack sandbox
  - Verify subscription updates after successful payments
  - Test role-based access control across all features
  - Include trial management and expiration handling tests
  - _Requirements: All workflows_

- [ ] 12.3 Add end-to-end testing
  - Test complete upgrade flow from free plan to paid subscription
  - Verify full trial lifecycle from signup to expiration
  - Test role-based dashboards with different user types
  - Include payment verification and webhook processing tests
  - _Requirements: Complete user journeys_

- [ ] 12.4 Perform mobile responsiveness testing
  - Test all components on various mobile devices
  - Verify touch interactions and mobile payment flows
  - Test notification system on mobile browsers
  - Include offline functionality testing on mobile
  - _Requirements: Mobile-first design_

## 13. Deployment and Production Readiness

- [ ] 13.1 Set up production environment configuration
  - Configure Paystack production keys and webhooks
  - Set up Firebase production project and messaging
  - Configure Cloudinary production settings
  - Add production database optimizations
  - _Requirements: Production deployment_

- [ ] 13.2 Implement monitoring and logging
  - Add comprehensive error logging for payment flows
  - Implement subscription status monitoring
  - Create notification delivery tracking
  - Add performance monitoring for mobile users
  - _Requirements: Production monitoring_

- [ ] 13.3 Add security hardening
  - Implement webhook signature verification
  - Add rate limiting for payment endpoints
  - Secure sensitive subscription data
  - Include audit logging for subscription changes
  - _Requirements: Security compliance_

- [ ] 13.4 Perform final production testing
  - Test complete system with real Paystack payments
  - Verify Firebase notifications in production
  - Test role-based access with real user accounts
  - Include load testing for subscription endpoints
  - _Requirements: Production readiness_

This implementation plan covers all core subscription features identified from the PRD and reference dashboard, ensuring comprehensive functionality while maintaining the mobile-first approach and proper integration with existing SabiOps architecture.