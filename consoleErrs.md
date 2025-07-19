ERROR] recordPayment failed: 
Object { error: `{'code': 'PGRST204', 'details': None, 'hint': None, 'message': "Could not find the 'currency' column of 'payments' in the schema cache"}`, message: "Error", success: false }
scriptErrorIsolation.js:94:21
Sale created but payment recording failed: 
Object { message: "Request failed with status code 500", name: "AxiosError", code: "ERR_BAD_RESPONSE", config: {…}, request: XMLHttpRequest, response: {…}, status: 500, stack: "", … }
scriptErrorIsolation.js:94:21
[SUCCESS] Sale recorded successfully, but payment recording had issues. Please check payments section. errorHandling.js:403:13
API Error: 
Object { message: "Request failed with status code 400", name: "AxiosError", code: "ERR_BAD_REQUEST", config: {…}, request: XMLHttpRequest, response: {…}, status: 400, stack: "", … }