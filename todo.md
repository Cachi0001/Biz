# MVP CRITICAL FIXES - Priority Order

## PHASE 1: Backend Infrastructure (1-2 hours)
### CRITICAL: Fix 500 errors and CORS issues
1. [ ] Fix CORS configuration in backend
2. [ ] Fix backend API endpoints returning 500 errors:
   - `/api/products/stock-status` 
   - `/api/user/usage-status`
   - `/api/auth/profile`
   - `/api/sales` (with date filters)
3. [ ] Add missing 'phone' column to payments table
4. [ ] Test all critical endpoints with curl

## PHASE 2: Core Business Operations (2-3 hours)
### Product Management
5. [ ] Fix product update functionality + add toast notifications
6. [ ] Fix product dropdown to show stock quantities ("Product Name Qty:5 price")
7. [ ] Add real-time stock updates after sales
8. [ ] Add quantity validation alerts

### Sales & Profit Tracking
9. [ ] Fix sales recording to calculate and store profit (selling_price - cost_price)
10. [ ] Fix dashboard calculations (outstanding, this month stats)
11. [ ] Implement profit calculation system with date filters
12. [ ] Fix sales reports to show real data

## PHASE 3: Essential Features (2-3 hours)
### Data Export & Invoice
13. [ ] Fix CSV download functionality (headers/data mixing issue)
14. [ ] Fix PDF generation and sending
15. [ ] Fix invoice update functionality
16. [ ] Fix payment recording (Paystack integration)

### Settings & User Management
17. [ ] Fix settings profile update (full_name, business_name only)
18. [ ] Implement team management system (CRUD for team members)
19. [ ] Set email_confirmed=true for owners automatically(already done in the database)ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;


## PHASE 4: Analytics & Advanced Features (1-2 hours) 
20. [ ] Fix advanced analytics charts (currently showing random data)
21. [ ] Implement referral system with tracking links
22. [ ] Fix global search bar functionality
23. [ ] Fix push notifications

## TESTING STRATEGY (No localhost)
- Backend: Use curl commands to test API endpoints
- Frontend: Build and deploy, test live on Vercel
- Node.js testing for validation logic
- Simple backend tests with curl/postman

## DEPLOYMENT NOTES
- Frontend: sabiops.vercel.app
- Backend: sabiops-backend.vercel.app
- Database: Supabase
- Payments: Paystack (test keys already configured)

Each phase should be completed and tested before moving to next phase.

No local host testing, the users prefers build and only nodejs testing for frontend and CURL(api testing) with simple/easy to set up backend testing

'sabiops-backend.vercel.app'
