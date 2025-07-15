# Core Subscription Features - Requirements Document

## Introduction

This spec covers the implementation of core subscription management features for SabiOps, including Paystack integration, role-based dashboard rendering, trial management, and essential owner-only features. The goal is to ensure proper subscription handling, payment processing, and user experience based on subscription status and role.

## Requirements

### Requirement 1: Subscription Management System

**User Story:** As a business owner, I want to manage my subscription plans and payments so that I can access premium features and maintain my account status.

#### Acceptance Criteria

1. WHEN an owner views their dashboard THEN the system SHALL display current subscription status, plan details, and remaining trial days
2. WHEN trial period expires THEN the system SHALL automatically downgrade user to free plan and restrict features
3. WHEN owner clicks upgrade THEN the system SHALL show available plans with Paystack payment integration
4. IF user is on trial THEN the system SHALL show trial countdown with upgrade prompts
5. WHEN payment is successful THEN the system SHALL immediately update subscription status and unlock features

### Requirement 2: Paystack Payment Integration

**User Story:** As a business owner, I want to pay for my subscription using Paystack so that I can upgrade my plan securely.

#### Acceptance Criteria

1. WHEN owner selects a plan THEN the system SHALL initialize Paystack payment with correct amount and plan details
2. WHEN payment is completed THEN the system SHALL verify payment with Paystack webhook
3. WHEN payment verification succeeds THEN the system SHALL update user subscription in database
4. IF payment fails THEN the system SHALL show error message and allow retry
5. WHEN subscription is active THEN the system SHALL calculate and display next billing date

### Requirement 3: Role-Based Dashboard Rendering

**User Story:** As a user with different roles, I want to see dashboard content appropriate to my role and subscription level so that I have access to relevant features only.

#### Acceptance Criteria

1. WHEN owner logs in THEN the system SHALL display full dashboard with subscription management, team features, and all business metrics
2. WHEN admin logs in THEN the system SHALL display operational dashboard without subscription or billing information
3. WHEN salesperson logs in THEN the system SHALL display sales-focused dashboard with limited access to business data
4. WHEN user is on free plan THEN the system SHALL restrict access to premium features and show upgrade prompts
5. WHEN trial user accesses features THEN the system SHALL provide full weekly plan access with trial indicators

### Requirement 4: Trial Management & Notifications

**User Story:** As a trial user, I want to be reminded about my trial expiration so that I can decide whether to upgrade before losing access.

#### Acceptance Criteria

1. WHEN trial has 3 days remaining THEN the system SHALL send email reminder about trial expiration
2. WHEN trial has 1 day remaining THEN the system SHALL show prominent upgrade banner on dashboard
3. WHEN trial expires THEN the system SHALL send final notification and restrict access to free plan features
4. WHEN user logs in during trial THEN the system SHALL display trial countdown prominently
5. IF trial user creates more than free plan limits THEN the system SHALL show upgrade prompt

### Requirement 5: Owner-Only Features Access Control

**User Story:** As a business owner, I want exclusive access to sensitive business features so that I can maintain control over my business operations.

#### Acceptance Criteria

1. WHEN non-owner tries to access team management THEN the system SHALL deny access and show permission error
2. WHEN non-owner tries to access subscription settings THEN the system SHALL redirect to dashboard
3. WHEN owner accesses referral system THEN the system SHALL display earnings, withdrawal options, and referral tracking
4. WHEN owner views analytics THEN the system SHALL show complete business insights including profit/loss
5. WHEN team member views dashboard THEN the system SHALL hide subscription status and billing information

### Requirement 6: Subscription Status Persistence

**User Story:** As a user, I want my subscription status to be consistent across all sessions so that my access level is maintained properly.

#### Acceptance Criteria

1. WHEN user logs in THEN the system SHALL fetch current subscription status from database
2. WHEN subscription changes THEN the system SHALL update user context immediately
3. WHEN user refreshes page THEN the system SHALL maintain subscription state without re-authentication
4. IF subscription expires during session THEN the system SHALL update UI to reflect new access level
5. WHEN team member inherits owner's plan THEN the system SHALL reflect inherited benefits correctly

### Requirement 7: Payment History & Billing

**User Story:** As a business owner, I want to view my payment history and billing information so that I can track my subscription expenses.

#### Acceptance Criteria

1. WHEN owner accesses billing section THEN the system SHALL display payment history with dates, amounts, and status
2. WHEN payment is processed THEN the system SHALL generate receipt and store transaction record
3. WHEN subscription renews THEN the system SHALL automatically charge using saved payment method
4. IF payment fails on renewal THEN the system SHALL retry payment and notify user
5. WHEN owner downloads receipt THEN the system SHALL provide PDF with transaction details

### Requirement 8: Firebase Push Notifications System

**User Story:** As a user, I want to receive real-time notifications about important business events so that I can stay informed and take timely actions.

#### Acceptance Criteria

1. WHEN user clicks notification bell icon THEN the system SHALL display notification center with read/unread notifications
2. WHEN notification is clicked THEN the system SHALL navigate user to relevant section and mark notification as read
3. WHEN low stock alert occurs THEN the system SHALL send Firebase push notification and in-app toast
4. WHEN invoice becomes overdue THEN the system SHALL send notification to owner with invoice details
5. WHEN payment is received THEN the system SHALL notify relevant users with payment confirmation

### Requirement 9: Comprehensive CRM & Inventory Management

**User Story:** As a business user, I want complete customer and inventory management so that I can track all business relationships and stock levels.

#### Acceptance Criteria

1. WHEN adding customer THEN the system SHALL store complete profile with purchase history and interactions
2. WHEN stock level drops below threshold THEN the system SHALL send configurable low stock alerts
3. WHEN sale is made THEN the system SHALL automatically reduce stock and update customer purchase history
4. WHEN Silver plan user manages clients THEN the system SHALL allow edit/delete operations
5. WHEN product image is uploaded THEN the system SHALL use Cloudinary for storage and optimization

### Requirement 10: Complete Invoice & Expense Management

**User Story:** As a business owner, I want comprehensive invoice and expense tracking so that I can manage cash flow effectively.

#### Acceptance Criteria

1. WHEN creating invoice THEN the system SHALL generate professional PDF with business branding
2. WHEN invoice status changes THEN the system SHALL track Draft, Sent, Paid, Overdue states
3. WHEN recording expense THEN the system SHALL allow receipt upload via Cloudinary
4. WHEN offline THEN the system SHALL store data locally and sync when connection restored
5. WHEN generating reports THEN the system SHALL provide monthly summaries and downloadable formats

### Requirement 11: Advanced Referral System

**User Story:** As a business owner, I want to earn commissions from referrals so that I can benefit from recommending the platform.

#### Acceptance Criteria

1. WHEN referral upgrades to monthly plan THEN the system SHALL credit 10% commission (₦500)
2. WHEN referral upgrades to yearly plan THEN the system SHALL credit 10% commission (₦5,000)
3. WHEN commission reaches ₦3,000 minimum THEN the system SHALL allow withdrawal via Paystack
4. WHEN viewing referral dashboard THEN the system SHALL show real-time earnings and withdrawal history
5. WHEN weekly plan upgrade occurs THEN the system SHALL exclude from commission calculation

### Requirement 12: Feature Usage Tracking & Limits

**User Story:** As a system, I want to track feature usage so that I can enforce subscription limits and suggest upgrades.

#### Acceptance Criteria

1. WHEN user creates invoice THEN the system SHALL increment usage counter for current billing period
2. WHEN free user reaches limit THEN the system SHALL prevent further actions and show upgrade prompt
3. WHEN usage approaches limit THEN the system SHALL show warning with remaining quota
4. WHEN subscription upgrades THEN the system SHALL reset usage limits to new plan allowances
5. WHEN billing period resets THEN the system SHALL reset usage counters for free plan users

### Requirement 13: Offline Functionality & Sync

**User Story:** As a user in areas with poor connectivity, I want to work offline so that I can continue business operations without interruption.

#### Acceptance Criteria

1. WHEN offline THEN the system SHALL allow invoice creation, expense entry, and product updates
2. WHEN connection restored THEN the system SHALL sync all offline data with conflict resolution
3. WHEN sync conflicts occur THEN the system SHALL use timestamps to resolve data conflicts
4. WHEN offline mode active THEN the system SHALL show sync status indicators
5. WHEN sync completes THEN the system SHALL notify user of successful data synchronization