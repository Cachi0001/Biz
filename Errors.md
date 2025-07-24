127.0.0.1 - - [24/Jul/2025 17:02:58] "OPTIONS /api/search?q=product&limit=5 HTTP/1.1" 308 -
SearchDropdown: Sending search query: product
dashboard:1 Access to XMLHttpRequest at 'https://sabiops-backend.vercel.app/api/search?q=product&limit=5' from origin 'https://sabiops.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: Redirect is not allowed for a preflight request.Understand this error
scriptErrorIsolation.js:94 [ERROR] Global search failed: AxiosError$1 {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
(anonymous) @ api.js:1025
rejected @ index-DorB_P0c.js:2
Promise.then
step @ index-DorB_P0c.js:2
(anonymous) @ index-DorB_P0c.js:2
__async @ index-DorB_P0c.js:2
searchGlobal @ api.js:1020
(anonymous) @ SearchDropdown.jsx:35
(anonymous) @ index-DorB_P0c.js:2
__async @ index-DorB_P0c.js:2
(anonymous) @ SearchDropdown.jsx:31
setTimeout
(anonymous) @ SearchDropdown.jsx:31
Qj @ react-dom.production.min.js:243
Hk @ react-dom.production.min.js:285
(anonymous) @ react-dom.production.min.js:282
Pk @ react-dom.production.min.js:280
Ek @ react-dom.production.min.js:272
jg @ react-dom.production.min.js:127
Rk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error
scriptErrorIsolation.js:94 Search error: AxiosError$1 {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
(anonymous) @ SearchDropdown.jsx:41
rejected @ index-DorB_P0c.js:2
Promise.then
step @ index-DorB_P0c.js:2
(anonymous) @ index-DorB_P0c.js:2
__async @ index-DorB_P0c.js:2
(anonymous) @ SearchDropdown.jsx:31
setTimeout
(anonymous) @ SearchDropdown.jsx:31
Qj @ react-dom.production.min.js:243
Hk @ react-dom.production.min.js:285
(anonymous) @ react-dom.production.min.js:282
Pk @ react-dom.production.min.js:280
Ek @ react-dom.production.min.js:272
jg @ react-dom.production.min.js:127
Rk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error
utils-Djm9CBbf.js:1  GET https://sabiops-backend.vercel.app/api/search?q=product&limit=5 net::ERR_FAILED