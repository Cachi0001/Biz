{
    "error": "Failed to create user",
    "message": "Error",
    "success": false
}

utils-BkdbsMoB.js:1 
 
 POST https://sabiops-backend.vercel.app/api/auth/forgot-password 404 (Not Found)
utils-BkdbsMoB.js:1 
 
 POST https://sabiops-backend.vercel.app/api/auth/register 500 (Internal Server Error)
scriptErrorIsolation.js:94 
 [ERROR] Register failed: 
AxiosError$1 {message: 'Request failed with status code 500', name: 'AxiosError', code: 'ERR_BAD_RESPONSE', config: {…}, request: XMLHttpRequest, …}
scriptErrorIsolation.js:94 
 [ERROR] Register error response: 
{error: 'Failed to create user', message: 'Error', success: false}
scriptErrorIsolation.js:94 
 [ERROR] Register error status: 500
scriptErrorIsolation.js:94 
 [AUTH] Registration error: 
AxiosError$1 {message: 'Request failed with status code 500', name: 'AxiosError', code: 'ERR_BAD_RESPONSE', config: {…}, request: XMLHttpRequest, …}