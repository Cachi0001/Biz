{
    "error": "'requires_manual_review'",
    "message": "Payment verification failed",
    "success": false
}
utils-BkdbsMoB.js:1 
 
 POST https://sabiops-backend.vercel.app/api/subscription/verify-payment 500 (Internal Server Error)
scriptErrorIsolation.js:94 
 PaystackService: Payment verification failed: 
AxiosError$1 {message: 'Request failed with status code 500', name: 'AxiosError', code: 'ERR_BAD_RESPONSE', config: {…}, request: XMLHttpRequest, …}
scriptErrorIsolation.js:94 
 PaystackService: Post-payment processing failed: Error: Server error. Please try again later.
    at lo.<anonymous> (PaystackService.js:133:17)
    at Generator.throw (<anonymous>)
    at rejected (index-BC5B96k5.js:2:841)
scriptErrorIsolation.js:94 
 Payment processing error: Error: Server error. Please try again later.
    at lo.<anonymous> (PaystackService.js:133:17)
    at Generator.throw (<anonymous>)
    at rejected (index-BC5B96k5.js:2:841)
    Uncaught TypeError: Cannot destructure property 'language' of 'object null' as it is null.
    at index-Bzs0I5Ao.js:37:865150
    at index-Bzs0I5Ao.js:37:36905

    # As for the errors below please if you can't fix them delete them and everywhere where they are been used please

    UnifiedSubscriptionStatus.jsx:21 
 
 GET https://sabiops.vercel.app/api/subscription/unified-status 404 (Not Found)
AccurateUsageCards.jsx:18 
 
 GET https://sabiops.vercel.app/api/subscription/usage-status 404 (Not Found)
AccurateUsageCards.jsx:18 
 
 GET https://sabiops.vercel.app/api/subscription/usage-status 404 (Not Found)
﻿
