This is the only thing i saw on the vercel logs 127.0.0.1 - - [01/Aug/2025 20:53:21] "GET /api/api/subscription/unified-status HTTP/1.1" 404 -
127.0.0.1 - - [01/Aug/2025 20:53:22] "GET /api/subscription/unified-status HTTP/1.1" 422 -
{"msg":"Not enough segments"}
You can also see in the image the product drop down is showing the id instead of the product proper fields
check the frontend and backend implementation for this fix and help me implement it because is showing error on the cards on the dashboard 
C:\Users\DELL\Saas\Biz\frontend\sabiops-frontend\src\components\subscription\UnifiedSubscriptionStatus.jsx
C:\Users\DELL\Saas\Biz\frontend\sabiops-frontend\src\components\dashboard\AccurateUsageCards.jsx
I think these card might be for the frontend i can't remember how the backend files looks like find it and fix it please .
frontend code base is here C:\Users\DELL\Saas\Biz\frontend\sabiops-frontend and backend is here C:\Users\DELL\Saas\Biz\backend\sabiops-backend
  


Do you see how the transaction history card and buttons on filter is structure on mobile device 2x2 that is what i want on all other pages pleaseErrorBoundary caught an error:  {componentStack: '\n    at Card (https://sabiops.vercel.app/assets/in…ps.vercel.app/assets/vendor-C16OW_zf.js:1:107036)'}
overrideMethod @ hook.js:608
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
componentDidCatch @ ErrorBoundary.jsx:17
Qi.i.componentDidCatch.r.callback @ react-dom.production.min.js:189
(anonymous) @ react-dom.production.min.js:282
(anonymous) @ react-dom.production.min.js:282