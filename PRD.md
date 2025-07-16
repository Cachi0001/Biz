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

SabiOps - Enhanced Implementation Guide for Full-Stack AI Engineer
Date: January 7, 2025
Purpose:This guide outlines the development of a production-ready, scalable Minimum Viable Product (MVP) for SabiOps—a business management tool tailored for Nigerian SMEs. It addresses critical pain points, enhances financial tracking, and fosters growth with intelligent features and an intuitive UI. The solution is deployed with the frontend at sabiops.vercel.app and backend at sabiops-backend.vercel.app, using Supabase (project name: "sabiops") as the database. This updated guide ensures all core functionalities are fully implemented, addressing current issues where only authentication is working.
Tech Stack

Backend: Flask (Python) with Supabase (PostgreSQL)Justification: Supabase provides a free tier, managed PostgreSQL, authentication, real-time capabilities, and scalability.
Frontend: React with Tailwind CSSJustification: Modern, responsive, and performant UI.
Authentication: JWT with Supabase
Payments: Paystack
Image Storage: Cloudinary
Deployment: Vercel

Core Functionalities
1. User Management & Authentication
Features

Owners can create team member accounts (Admins and Salespeople) using a single form with fields: full name, email, password, and a role dropdown (Admin or Salesperson). Creation requires owner authentication.
Team members inherit the owner’s subscription plan and remaining trial period (e.g., if the owner has 6 days left, team members get 6 days).
Email-based registration with mandatory verification.
Secure login with password recovery via email:
User clicks "Forgot Password" on the login page.
They are taken to a forgot password page where they input their email and click "Request Password Reset."
A unique code is sent to their email.
They paste the code into an input box on the same page and click "Verify Code."
If the code is valid, an input box appears for the new password and confirmation.
After entering the new password and clicking "Update Password," the password is updated via Supabase, and they are navigated to the login page.


Send warning emails via Gmail before deleting inactive accounts; auto-delete after 30 days (Supabase scheduled function).
Role-based access: Only owners can create/deactivate team members and upgrade subscriptions.
Optional referral code input during sign-up (e.g., "SABIXXXXXX").

Implementation

Backend:
Use Flask with Supabase auth; validate email uniqueness; link team members to owners via owner_id for subscription inheritance; implement deactivation logic.
For forgot password:
POST /api/auth/forgot-password: Accepts { "email": "user@example.com" }, generates a secure random code (e.g., using secrets.token_urlsafe(6)), stores it in password_reset_tokens with a 1-hour expiration, and sends it via email (e.g., Flask-Mail or SMTP).
POST /api/auth/verify-reset-code: Accepts { "email": "user@example.com", "reset_code": "ABC123" }, checks if the code is valid, not used, and not expired; returns success or error.
POST /api/auth/reset-password: Accepts { "email": "user@example.com", "reset_code": "ABC123", "new_password": "newpass123" }, verifies the code again, updates the password_hash in users via Supabase, marks the code as used, and returns success.


Rate limit /api/auth/forgot-password (e.g., 5 requests/hour per email) using Flask-Limiter to prevent abuse.


Frontend:
Update Register.jsx with an optional referral code field; create a team management page for owners with a single form (full name, email, password, role dropdown).
Forgot password page (/forgot-password):
Initial form: Email input and "Request Password Reset" button.
After request, display "Check your email for the code" and show input for the code with a "Verify Code" button.
On successful verification, render inputs for new password and confirmation with an "Update Password" button.
On success, redirect to /login with a "Password updated successfully" message.


Use React state (e.g., resetStage: 'request' | 'verify' | 'update' | 'success') to manage the flow.
Include tooltips/help text (e.g., "Enter the 6-digit code sent to your email") for less tech-savvy users.
Hide subscription details from Admin/Salesperson dashboards.


Error Handling: Return clear messages (e.g., "Email not found," "Invalid or expired code").

2. Customer Relationship Management (CRM)
Features

Customer profiles (name, email, phone, address, purchase history, interactions).
Segmentation by purchase behavior (e.g., frequent buyers).
Manual client input for invoices.
Edit/delete clients (Silver plan only).

Implementation

Backend: CRUD endpoints (/api/customers) with RLS ensuring access to owner’s data for team members.
Frontend: Clients page with add/edit/delete forms; display purchase history in JSONB format.

3. Product/Inventory Management
Features

Add/edit/delete products (name, description, price, stock, image via Cloudinary).
Auto stock reduction on sales.
Configurable low stock alerts (in-app toasts and push notifications).
Role-based restocking: Owners and Admins can restock products.

Implementation

Backend: /api/products endpoints; trigger stock updates on sales; send notifications via Supabase real-time.
Frontend: Stocks page with forms and alerts; enable restocking UI for Owners and Admins only.

4. Invoice Generation & Management
Features

Create/send professional invoices (PDF export, email delivery).
Status tracking (Draft, Sent, Paid, Overdue).
Offline creation with sync when online.

Implementation

Backend: /api/invoices endpoints; generate PDFs with reportlab; store offline data in localStorage.
Frontend: Invoice page with creation form; sync button for offline data.

5. Expense Tracking
Features

Record/categorize expenses with receipt uploads (Cloudinary).
Expense reports (monthly summaries).
Offline entry with sync.

Implementation

Backend: /api/expenses endpoints; handle Cloudinary uploads.
Frontend: Expenses page with form and report view; offline storage in localStorage.

6. Payment Processing
Features

Paystack integration for payments.
Auto-reconcile payments with invoices.

Implementation

Backend: Integrate Paystack SDK; update invoice status on payment success.
Frontend: Pricing page with Paystack checkout (visible only to owners); display payment status.

7. Sales Reporting & Analytics
Features

Daily sales reports (total, items sold, payment method breakdown).
Downloadable as PDF/PNG.
Analytics dashboard (revenue, expenses, profit).

Implementation

Backend: /api/reports/sales endpoint; aggregate data from transactions/sales tables.
Frontend: Dashboard with charts (e.g., Chart.js) and download options; hide subscription metrics for Admins/Salespeople.

8. Referral System
Features

10% commission on upgrades for monthly ‘monthly’ (₦500) and ‘yearly’ (₦5,000) plans for the first 3 months; weekly plans excluded.
Real-time tracking dashboard.
Withdrawal system (min ₦3,000 via Paystack).

Implementation

Backend: /api/referrals endpoints; calculate commissions based on plan type; integrate Paystack for withdrawals.
Frontend: Referrals page with earnings table and withdrawal form.

9. Subscription Plans
Features

Free: 5 invoices/expenses monthly, basic reporting(No crown).
Silver Weekly (₦1,400)(100 expenses, 100 invoices, other Unlimited), Monthly (₦4,500) 450 expenses, 450 invoices others unlimited, Yearly (₦50,000) 6000 expenses, 6000 invoices , other's unlimited with advanced features.
7-day free trial for weekly plan, inherited by team members based on owner’s remaining time; visual indicator (e.g., crown) on owner’s dashboard only.
Pro-rata upgrades mid-cycle (owner-only feature).

Implementation

Backend: Track subscription status in users table; update all team members’ access on owner upgrade via owner_id.
Frontend: Pricing page with upgrade options (owner-only); hide subscription details from Admin/Salesperson UI.

10. Offline Functionality
Features

Offline invoice creation, expense entry, product updates, customer edits.
Auto-sync with conflict resolution when online.

Implementation

Backend: Accept bulk sync data with timestamps for conflict resolution.
Frontend: Use Service Workers and localStorage; show sync status indicators.

11. Transaction History
Features

"Money In" (sales) and "Money Out" (expenses) view.
Role-based access: Owners see all, Admins see operational data, Salespeople see sales only.
Filter by date, category, payment method.

Implementation

Backend: /api/transactions endpoint with RLS filtering.
Frontend: Transaction History page with filters and role-based UI.

12. Intelligent Upgrade Path
Features

Suggest upgrades based on usage (e.g., nearing invoice limits) for owners only.
In-app upgrade with prorated cost calculation.

Implementation

Backend: Monitor usage in /api/users/{id}; return upgrade prompts for owners.
Frontend: Dashboard alerts with upgrade buttons (owner-only).

Architecture & Best Practices

Scalability: Use efficient queries; cache with Redis; process async tasks with Celery.
Clean Architecture: Follow SOC, DDD, and modular design.
Security: JWT auth, Bcrypt hashing, input validation, strict CORS, Supabase RLS, env variables.
Testing: Unit (Jest, Pytest), integration, E2E tests.
Performance: Lazy loading, code splitting, image optimization.
Error Handling: Clear, user-friendly errors (e.g., "Failed to save invoice: Network error"); log comprehensively.
Consistency: Standardize JSON data formats (e.g., camelCase keys).

Database Schema (Supabase - PostgreSQL)
See the separate SQL file for the full schema, including tables for users, team, customers, products, invoices, expenses, sales, referrals, referral_withdrawals, referral_earnings, transactions, notifications, and push_subscriptions, with RLS policies. The password_reset_tokens table (already implemented) supports the forgot password functionality.
API Endpoints (Flask)

Authentication:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password: Request a reset code
Request: { "email": "user@example.com" }
Response: 200 OK if email exists and code sent, 404 if not


POST /api/auth/verify-reset-code: Verify the reset code
Request: { "email": "user@example.com", "reset_code": "ABC123" }
Response: 200 OK if valid, 400 if invalid/expired


POST /api/auth/reset-password: Update password
Request: { "email": "user@example.com", "reset_code": "ABC123", "new_password": "newpass123" }
Response: 200 OK if successful, 400 if invalid/expired code




Users: /api/users/{id} (GET, PUT)

Customers: /api/customers (POST, GET), /api/customers/{id} (PUT, DELETE)

Products: /api/products (POST, GET), /api/products/{id} (PUT, DELETE)

Invoices: /api/invoices (POST, GET), /api/invoices/{id} (PUT, DELETE)

Expenses: /api/expenses (POST, GET)

Team: /api/team (POST), /api/team/{id} (PUT)

Referrals: /api/referrals (POST, GET)

Transactions: /api/transactions (GET), /api/reports/sales (GET)

Security: JWT, RLS, Flask-Limiter (100 req/hour)


Frontend (React with Tailwind CSS)

Pages:

Landing: "Get Started" button
Register: Phone required, email, referral code optional
Login: Phone or email
Forgot Password: Multi-step form for email, code verification, and password update
Dashboard: Metrics, actions, trial/upgrade status (owner-only), crown for owners on weekly plan
Pricing: Subscription plans with Paystack (owner-only)
Clients: Manage clients (Silver)
Team: Manage Admins/Salespersons (owner-only)
Stocks: Manage products/alerts
Referrals: Earnings and withdrawals
Transaction History: Filterable (role-based)


Components:

Navbar: Dynamic login/logout, role-based options
Dashboard: Lazy-loaded analytics, role-specific widgets, crown for owners only
Stock Management: Forms, toast alerts
Offline Mode: Sync status indicators


Styling: Nigerian-inspired (green/blue gradients), Naira formatting

Role-Based UI: Owners see all features; Admins see operational data (no subscription info); Salespeople see sales-focused UI (no subscription info).


Implementation Steps

Environment Setup  

Clone repos: git clone [frontend-url] and git clone [backend-url]  
Install dependencies: npm install (frontend), pip install -r requirements.txt (backend)


Database  

Run updated SQL queries in Supabase (already executed).


Backend  

Implement endpoints with consistent data handling; test with Postman.


Frontend  

Build pages/components; ensure offline support and role-based rendering.


Testing  

Run unit, integration, and E2E tests; verify all functionalities.


Deployment  

Deploy via Vercel with CI/CD; monitor logs for errors.



Additional Notes

Push Notifications: Use Supabase real-time or Firebase for in-app toasts and push notifications (e.g., low stock alerts).
Offline Sync: Store data in localStorage; sync with backend using timestamps for conflict resolution.
Calculations: Ensure app handles pro-rata upgrades, referral commissions, stock updates.
Consistency: Frontend sends JSON matching backend expectations (e.g., { "userId": "uuid", "amount": 5000 }).
Error Messages: Display specific errors (e.g., "Invoice creation failed: Missing customer name").
Team Management: Owners create/deactivate team members with a single form; team members inherit owner’s subscription and trial period.
Subscription Inheritance: Team members’ access reflects owner’s plan; subscription UI hidden from their dashboards.

Disclaimer:Existing Code: Since much of the code exists, review and test each feature (e.g., referral commissions, stock restocking, account deactivation) to ensure they work as expected in production. Ensure frontend data matches backend data during communication.
Our target audience is Nigerian SMEs, so we’ve designed this application with simplicity, reliability, and local relevance in mind—making it feel built specifically for them.

My backend .env state on vercel now 
SUPABASE_URL=My-url
SUPABASE_KEY=my-key.
SUPABASE_SERVICE_KEY=my-service-key
SECRET_KEY=chukwunna-nyerem-aka
JWT_SECRET_KEY=my-secret-key
PAYSTACK_SECRET_KEY=sk_test_
PAYSTACK_PUBLIC_KEY=pk_test_
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=api-key
CLOUDINARY_API_SECRET=secret-key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=onyemechicaleb4@gmail.com
SMTP_PASSWORD=vapmmsbaootvgtau
FROM_EMAIL=onyemechicaleb4@gmail.com
FROM_NAME=SabiOps
RATE_LIMIT_ENABLED=true
DEFAULT_RATE_LIMIT=1000 per hour
AUTH_RATE_LIMIT=5 per minute
PAYMENT_RATE_LIMIT=10 per minute
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *  
MAINTENANCE_MODE=false

