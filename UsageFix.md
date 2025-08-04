{"allowed_origins":["https://sabiops.vercel.app","http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173","https://sabiops-frontend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app","https://sabiops-frontend-git-main-onyemechicaleb4-7921s-projects.vercel.app","https://sabiops-olnjhgn12-onyemechicaleb4-7921s-projects.vercel.app","https://sabiops-backend-7r7t5mtwq-onyemechicaleb4-7921s-projects.vercel.app","http://sabiops-backend-7r7t5mtwq-onyemechicaleb4-7921s-projects.vercel.app"],"cors_config":{"allow_headers":["Content-Type","Authorization","X-Requested-With","Accept","Origin","X-Vercel-Deployment-Url"],"methods":["GET","POST","PUT","DELETE","OPTIONS","PATCH"],"origins":"*","supports_credentials":true},"message":"CORS debug endpoint","origin":"No Origin Header","timestamp":"2025-08-04T07:11:27.302802","vercel_env":"preview","vercel_url":"sabiops-backend-7r7t5mtwq-onyemechicaleb4-7921s-projects.vercel.app"}
🧪 Running Environment Configuration Tests...
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
sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/health:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
testEnvironment.js:27    ❌ Backend Health Check: FAILED
testEnvironment.js:28    Error: Failed to fetch
testEnvironment.js:32 
3. CORS Configuration Test:
sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/debug/cors:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
testEnvironment.js:41    ❌ CORS Debug: FAILED
testEnvironment.js:42    Error: Failed to fetch
testEnvironment.js:46 
4. API Authentication Test:
sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api/auth/verify-token:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
testEnvironment.js:61    ❌ Auth Endpoint: FAILED
testEnvironment.js:62    Error: Failed to fetch
testEnvironment.js:65 
==================================================
testEnvironment.js:66 🏁 Environment Tests Complete!
vendor-B2w3_AxV.js:1 Datadog Browser SDK: No storage available for session. We will not send any data.
init @ vendor-B2w3_AxV.js:1Understand this warning
(index):29 ServiceWorker registration successful with scope:  https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/
service-worker.js:17 Opened cache
AuthContext.jsx:105 [AUTH] Attempting login for: sabiops.vercel@gmail.com
api.js:139 [DEBUG] Login request data: Object
login:1 Access to XMLHttpRequest at 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api/auth/login' from origin 'https://sabiops-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
scriptErrorIsolation.js:94 [ERROR] Login failed: AxiosError$1
console.error @ scriptErrorIsolation.js:94Understand this error
scriptErrorIsolation.js:94 [ERROR] Login error response: Network Error
console.error @ scriptErrorIsolation.js:94Understand this error
scriptErrorIsolation.js:94 [ERROR] Login error status: No status
console.error @ scriptErrorIsolation.js:94Understand this error
scriptErrorIsolation.js:94 [AUTH] Login error: AxiosError$1
console.error @ scriptErrorIsolation.js:94Understand this error
sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api/auth/login:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
manifest.json:1  Failed to load resource: the server responded with a status of 401 ()