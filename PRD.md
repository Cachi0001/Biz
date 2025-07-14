SabiOps MVP Product Requirements Document (PRD)
Date: January 7, 2025Version: 1.0Status: Draft
1. Introduction
SabiOps is a business management tool designed specifically for Nigerian Small and Medium Enterprises (SMEs). It aims to address critical pain points such as informal record-keeping, cash-based transactions, fluctuating costs, tax complexities, and limited access to formal financial services. By providing an intuitive, scalable solution, SabiOps enhances financial tracking, streamlines operations, and fosters growth for Nigerian SMEs.
The Minimum Viable Product (MVP) for SabiOps will deliver essential features to manage users, customers, products, invoices, expenses, payments, and more, with a focus on simplicity, reliability, and local relevance. The solution is deployed with the frontend at sabiops.vercel.app and the backend at sabiops-backend.vercel.app, using Supabase (project name: "sabiops") as the database.
2. Purpose
The purpose of this MVP is to:

Provide Nigerian SMEs with a user-friendly tool to manage business operations.
Address challenges like manual record-keeping, cash flow management, and tax compliance.
Enable efficient tracking of sales, expenses, inventory, and customer relationships.
Offer intelligent features such as alerts, budgeting, and scenario planning to support decision-making.
Ensure the solution is scalable, secure, and optimized for performance.

This MVP will lay the foundation for future iterations based on user feedback and SME needs.
3. Scope
3.1 In Scope

User Management & Authentication
Customer Relationship Management (CRM)
Product/Inventory Management
Invoice Generation & Management
Expense Tracking
Payment Processing
Sales Reporting & Analytics
Referral System
Subscription Plans
Offline Functionality
Transaction History
Intelligent Upgrade Path

3.2 Out of Scope (for MVP)

Advanced tax estimator
Integration with external accounting software
Multi-currency support
Advanced AI-driven insights

4. Functional Requirements
4.1 User Management & Authentication

Owners can create team member accounts (Admins and Salespeople) using a single form with fields: full name, email, password, and role dropdown (Admin or Salesperson). Creation requires owner authentication.
Team members inherit the owner’s subscription plan and remaining trial period (e.g., 6 days left for owner means 6 days for team members).
Email-based registration with mandatory verification.
Secure login with password recovery via email:
User clicks "Forgot Password" on the login page.
Taken to a forgot password page to input email and click "Request Password Reset."
A unique code is sent to their email.
User pastes the code into an input box and clicks "Verify Code."
If valid, inputs for new password and confirmation appear.
After clicking "Update Password," the password updates via Supabase, and user is redirected to login.


Send warning emails via Gmail before deleting inactive accounts; auto-delete after 30 days (Supabase scheduled function).
Role-based access: Only owners can create/deactivate team members and upgrade subscriptions.
Optional referral code input during sign-up (e.g., "SABIXXXXXX").

4.2 Customer Relationship Management (CRM)

Customer profiles with fields: name, email, phone, address, purchase history, interactions.
Segmentation by purchase behavior (e.g., frequent buyers).
Manual client input for invoices.
Edit/delete clients (Silver plan only).

4.3 Product/Inventory Management

Add/edit/delete products with fields: name, description, price, stock, image via Cloudinary.
Auto stock reduction on sales.
Configurable low stock alerts (in-app toasts and push notifications).
Role-based restocking: Owners and Admins can restock products.

4.4 Invoice Generation & Management

Create/send professional invoices (PDF export, email delivery).
Status tracking (Draft, Sent, Paid, Overdue).
Offline creation with sync when online.

4.5 Expense Tracking

Record/categorize expenses with receipt uploads (Cloudinary).
Expense reports (monthly summaries).
Offline entry with sync.

4.6 Payment Processing

Paystack integration for payments.
Auto-reconcile payments with invoices.

4.7 Sales Reporting & Analytics

Daily sales reports (total, items sold, payment method breakdown).
Downloadable as PDF/PNG.
Analytics dashboard (revenue, expenses, profit).

4.8 Referral System

10% commission on upgrades for ‘monthly’ (₦500) and ‘yearly’ (₦5,000) plans; weekly plans excluded.
Real-time tracking dashboard.
Withdrawal system (min ₦3,000 via Paystack).

4.9 Subscription Plans

Free: 5 invoices/expenses monthly, basic reporting.
Silver Weekly (₦1,400), Monthly (₦4,500), Yearly (₦50,000) with advanced features.
7-day free trial for weekly plan, inherited by team members based on owner’s remaining time; visual indicator (e.g., crown) on owner’s dashboard only.
Pro-rata upgrades mid-cycle (owner-only feature).

4.10 Offline Functionality

Offline invoice creation, expense entry, product updates, customer edits.
Auto-sync with conflict resolution when online.

4.11 Transaction History

"Money In" (sales) and "Money Out" (expenses) view.
Role-based access: Owners see all, Admins see operational data, Salespeople see sales only.
Filter by date, category, payment method.

4.12 Intelligent Upgrade Path

Suggest upgrades based on usage (e.g., nearing invoice limits) for owners only.
In-app upgrade with prorated cost calculation.

5. Non-Functional Requirements
5.1 Scalability

Use efficient queries; cache with Redis; process async tasks with Celery.

5.2 Clean Architecture

Follow Separation of Concerns (SOC), Domain-Driven Design (DDD), and modular design.

5.3 Security

JWT authentication, Bcrypt hashing, input validation, strict CORS, Supabase RLS, environment variables.

5.4 Testing

Unit tests (Jest, Pytest), integration tests, E2E tests.

5.5 Performance

Lazy loading, code splitting, image optimization.

5.6 Error Handling

Clear, user-friendly errors (e.g., "Failed to save invoice: Network error"); comprehensive logging.

5.7 Consistency

Standardize JSON data formats (e.g., camelCase keys).

6. Technical Requirements
6.1 Backend

Framework: Flask (Python)
Database: Supabase (PostgreSQL)
Authentication: JWT with Supabase
Payments: Paystack
Image Storage: Cloudinary
Deployment: Vercel

6.2 Frontend

Framework: React with Tailwind CSS
Styling: Nigerian-inspired (green/blue gradients), Naira formatting
Role-Based UI: Owners see all features; Admins see operational data (no subscription info); Salespeople see sales-focused UI (no subscription info).

6.3 API Endpoints

Authentication:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/verify-reset-code
POST /api/auth/reset-password


Users: /api/users/{id} (GET, PUT)
Customers: /api/customers (POST, GET), /api/customers/{id} (PUT, DELETE)
Products: /api/products (POST, GET), /api/products/{id} (PUT, DELETE)
Invoices: /api/invoices (POST, GET), /api/invoices/{id} (PUT, DELETE)
Expenses: /api/expenses (POST, GET)
Team: /api/team (POST), /api/team/{id} (PUT)
Referrals: /api/referrals (POST, GET)
Transactions: /api/transactions (GET), /api/reports/sales (GET)

6.4 Database Schema

Tables: users, team, customers, products, invoices, expenses, sales, referrals, referral_withdrawals, referral_earnings, transactions, notifications, push_subscriptions, password_reset_tokens
Row-Level Security (RLS) policies for data access control

7. UI/UX Requirements
7.1 Pages

Landing: "Get Started" button
Register: Phone required, email optional, referral code optional
Login: Phone or email
Forgot Password: Multi-step form for email, code verification, and password update
Dashboard: Metrics, actions, trial/upgrade status (owner-only), crown for owners on weekly plan
Pricing: Subscription plans with Paystack (owner-only)
Clients: Manage clients (Silver plan only)
Team: Manage Admins/Salespersons (owner-only)
Stocks: Manage products/alerts
Referrals: Earnings and withdrawals
Transaction History: Filterable (role-based)

7.2 Components

Navbar: Dynamic login/logout, role-based options
Dashboard: Lazy-loaded analytics, role-specific widgets, crown for owners only
Stock Management: Forms, toast alerts
Offline Mode: Sync status indicators

7.3 Styling

Nigerian-inspired design (green/blue gradients)
Naira currency formatting

8. Testing Requirements

Unit tests for components and functions
Integration tests for API endpoints and database interactions
End-to-End (E2E) tests for critical user flows (e.g., registration, invoice creation)

9. Deployment Requirements

Continuous Integration/Continuous Deployment (CI/CD) via Vercel
Monitor logs for errors and performance issues

10. Additional Notes

Push Notifications: Use Supabase real-time or Firebase for in-app toasts and push notifications (e.g., low stock alerts).
Offline Sync: Store data in localStorage; sync with backend using timestamps for conflict resolution.
Calculations: Ensure accurate handling of pro-rata upgrades, referral commissions, and stock updates.
Consistency: Frontend sends JSON matching backend expectations (e.g., { "userId": "uuid", "amount": 5000 }).
Error Messages: Display specific, user-friendly errors (e.g., "Invoice creation failed: Missing customer name").
Team Management: Owners create/deactivate team members with a single form; team members inherit owner’s subscription and trial period.
Subscription Inheritance: Team members’ access reflects owner’s plan; subscription UI hidden from their dashboards.
Existing Code: Review and test features like referral commissions, stock restocking, and account deactivation to ensure they work in production.

11. Appendices

Database Schema: Refer to the separate SQL file for full schema details.
API Documentation: To be generated based on the defined endpoints.


This PRD provides a comprehensive guide for building the SabiOps MVP, ensuring all core functionalities are implemented to address the needs of Nigerian SMEs with a scalable, secure, and user-friendly solution.