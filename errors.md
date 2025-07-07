One successful login toast message is enough
index-C-9qUk8G.js:3   POST https://sabiops-backend.vercel.app/api/auth/verify-token 404 (Not Found)
(anonymous) @ index-C-9qUk8G.js:3
xhr @ index-C-9qUk8G.js:3
Ur @ index-C-9qUk8G.js:5
Promise.then
_request @ index-C-9qUk8G.js:6
request @ index-C-9qUk8G.js:5
d @ index-C-9qUk8G.js:182
await in d
h @ index-C-9qUk8G.js:472
Pf @ vendor-BqSMHcVE.js:29
zf @ vendor-BqSMHcVE.js:29
Tf @ vendor-BqSMHcVE.js:29
ui @ vendor-BqSMHcVE.js:29
Ws @ vendor-BqSMHcVE.js:29
(anonymous) @ vendor-BqSMHcVE.js:29
index-C-9qUk8G.js:182  Authentication check failed: te {message: 'Request failed with status code 404', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ hook.js:608
(anonymous) @ index-C-9qUk8G.js:182
await in (anonymous)
d @ index-C-9qUk8G.js:182
await in d

index-C-9qUk8G.js:3   POST https://sabiops-backend.vercel.app/api/auth/verify-token 404 (Not Found)
(anonymous) @ index-C-9qUk8G.js:3
xhr @ index-C-9qUk8G.js:3
Ur @ index-C-9qUk8G.js:5
Promise.then

d @ index-C-9qUk8G.js:182
await in d
h @ index-C-9qUk8G.js:472
Pf @ vendor-BqSMHcVE.js:29
zf @ vendor-BqSMHcVE.js:29
Tf @ vendor-BqSMHcVE.js:29
ui @ vendor-BqSMHcVE.js:29
Ws @ vendor-BqSMHcVE.js:29
(anonymous) @ vendor-BqSMHcVE.js:29

index-C-9qUk8G.js:182  Authentication check failed: te {message: 'Request failed with status code 404', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …} still not working
127.0.0.1 - - [07/Jul/2025 04:35:15] "POST /api/auth/login HTTP/1.1" 200 -
INFO:httpx:HTTP Request: PATCH https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?id=eq.3efb7d1e-957a-4d17-8d40-4a2fa3687a64 "HTTP/2 200 OK"
INFO:httpx:HTTP Request: GET https://okpqkuxnzibrjmniihhu.supabase.co/rest/v1/users?select=%2A&email=eq.onyemechicaleb4%40gmail.com "HTTP/2 200 OK"
127.0.0.1 - - [07/Jul/2025 04:35:16] "POST /api/auth/verify-token HTTP/1.1" 404 -

contains console error and the error am getting on my vercel dashboard logs