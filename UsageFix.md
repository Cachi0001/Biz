{"description":"Business management API for Nigerian SMEs","endpoints":{"auth":"/auth/*","customers":"/customers/*","expenses":"/expenses/*","invoices":"/invoices/*","payments":"/payments/*","products":"/products/*","sales":"/sales/*","subscription":"/subscription/*","team":"/team/*"},"health":"/health","name":"SabiOps API","status":"healthy","version":"1.0.0"}

[DEBUG] Environment Configuration: Object
api.js:7 [DEBUG] Using dev-feature environment - API Base URL: https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api
scriptErrorIsolation.js:27 [ScriptErrorIsolation] Initialized error isolation
debugLogger.js:17 [DebugLogger] Initialized with enabled: false
analyticsCacheService.js:256 [Analytics Cache] Started periodic cleanup interval
AuthContext.jsx:76 [DEBUG] No token found, user not authenticated
usageTrackingService.js:252 Usage tracking stopped
scriptErrorIsolation.js:27 [ScriptErrorIsolation] Initialized error isolation
App.jsx:74 [App] Comprehensive error handling and stability systems initialized
testEnvironment.js:5 🧪 Running Environment Configuration Tests...
testEnvironment.js:6 ==================================================
testEnvironment.js:9 1. Environment Detection:
testEnvironment.js:10    Current URL: https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/
testEnvironment.js:11    Detected Environment: dev-feature
testEnvironment.js:12    API Base URL: https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api
testEnvironment.js:13    Is Production: false
testEnvironment.js:14    Is Preview: true
testEnvironment.js:15    Is Development: false
testEnvironment.js:18 
2. Backend Connectivity Test:
sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/:1 Access to fetch at 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/health' from origin 'https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/health:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
testEnvironment.js:27    ❌ Backend Health Check: FAILED
testEnvironment.js:28    Error: Failed to fetch
testEnvironment.js:32 
3. CORS Configuration Test:
sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/:1 Access to fetch at 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/debug/cors' from origin 'https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/debug/cors:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
testEnvironment.js:41    ❌ CORS Debug: FAILED
testEnvironment.js:42    Error: Failed to fetch
testEnvironment.js:46 
4. API Authentication Test:
sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/:1 Access to fetch at 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api/auth/verify-token' from origin 'https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api/auth/verify-token:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
testEnvironment.js:61    ❌ Auth Endpoint: FAILED
testEnvironment.js:62    Error: Failed to fetch
testEnvironment.js:65 
==================================================
testEnvironment.js:66 🏁 Environment Tests Complete!
manifest.json:1  Failed to load resource: the server responded with a status of 401 ()Understand this error
sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/:1 Manifest fetch from https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/manifest.json failed, code 401Understand this error
(index):29 ServiceWorker registration successful with scope:  https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/
service-worker.js:17 Opened cache
scriptErrorIsolation.js:94 Failed to get device token after permission granted: AbortError: Failed to execute 'subscribe' on 'PushManager': Subscription failed - no active Service Worker
    at index.esm2017.js:567:39
    at Generator.next (<anonymous>)
    at fulfilled (index-BMoKbitd.js:2:785)
console.error @ scriptErrorIsolation.js:94Understand this error
AuthContext.jsx:105 [AUTH] Attempting login for: sabiops.vercel@gmail.com
api.js:139 [DEBUG] Login request data: Object
login:1 Access to XMLHttpRequest at 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api/auth/login' from origin 'https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.