[DEBUG] Form data before validation: {product_id: '8e869d29-2f03-4acd-9e74-fa20544d7e80', customer_id: '', customer_name: '', quantity: 1, unit_price: 500, …}
Sales.jsx:317 [DEBUG] Validation result: {isValid: true, errors: {…}, formattedData: {…}}
Sales.jsx:341 [DEBUG] Data being sent to API: {
  "product_id": "8e869d29-2f03-4acd-9e74-fa20544d7e80",
  "product_name": "Unknown Product",
  "quantity": 1,
  "unit_price": 500,
  "customer_id": null,
  "customer_name": "Walk-in Customer",
  "payment_method": "cash",
  "payment_status": "completed",
  "currency": "NGN",
  "date": "2025-07-27",
  "salesperson_id": null,
  "notes": "",
  "discount_amount": 0,
  "total_amount": 500,
  "net_amount": 0,
  "total_cogs": 0,
  "profit_from_sales": 0,
  "sale_items": [
    {
      "product_id": "8e869d29-2f03-4acd-9e74-fa20544d7e80",
      "product_name": "Unknown Product",
      "quantity": 1,
      "unit_price": 500,
      "total_price": 500,
      "cost_price": 0
    }
  ]
}
api.js:529 [DEBUG] createSale request data: {
  "product_id": "8e869d29-2f03-4acd-9e74-fa20544d7e80",
  "product_name": "Unknown Product",
  "quantity": 1,
  "unit_price": 500,
  "customer_id": null,
  "customer_name": "Walk-in Customer",
  "payment_method": "cash",
  "payment_status": "completed",
  "currency": "NGN",
  "date": "2025-07-27",
  "salesperson_id": null,
  "notes": "",
  "discount_amount": 0,
  "total_amount": 500,
  "net_amount": 0,
  "total_cogs": 0,
  "profit_from_sales": 0,
  "sale_items": [
    {
      "product_id": "8e869d29-2f03-4acd-9e74-fa20544d7e80",
      "product_name": "Unknown Product",
      "quantity": 1,
      "unit_price": 500,
      "total_price": 500,
      "cost_price": 0
    }
  ]
}
utils-Djm9CBbf.js:1  POST https://sabiops-backend.vercel.app/api/sales/ 400 (Bad Request)
(anonymous) @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
(anonymous) @ Axios.js:40
(anonymous) @ utils-Djm9CBbf.js:1
__async @ utils-Djm9CBbf.js:1
request @ Axios.js:38
(anonymous) @ Axios.js:226
(anonymous) @ bind.js:5
(anonymous) @ api.js:530
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
createSale @ api.js:527
(anonymous) @ Sales.jsx:344
fulfilled @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
onSubmit @ Sales.jsx:304
Nb @ react-dom.production.min.js:54
Tb @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
nf @ react-dom.production.min.js:105
se @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
Qk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error
scriptErrorIsolation.js:94 [ERROR] createSale failed: AxiosError$1 {message: 'Request failed with status code 400', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
(anonymous) @ api.js:534
rejected @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
createSale @ api.js:527
(anonymous) @ Sales.jsx:344
fulfilled @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
onSubmit @ Sales.jsx:304
Nb @ react-dom.production.min.js:54
Tb @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
nf @ react-dom.production.min.js:105
se @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
Qk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error
scriptErrorIsolation.js:94 Response data: {message: "Transaction processing error: 'str' object has no attribute 'get'", success: false, toast: {…}}
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
(anonymous) @ api.js:536
rejected @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
createSale @ api.js:527
(anonymous) @ Sales.jsx:344
fulfilled @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
onSubmit @ Sales.jsx:304
Nb @ react-dom.production.min.js:54
Tb @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
nf @ react-dom.production.min.js:105
se @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
Qk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error
scriptErrorIsolation.js:94 Response status: 400
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
(anonymous) @ api.js:537
rejected @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
createSale @ api.js:527
(anonymous) @ Sales.jsx:344
fulfilled @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
onSubmit @ Sales.jsx:304
Nb @ react-dom.production.min.js:54
Tb @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
nf @ react-dom.production.min.js:105
se @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
Qk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error
scriptErrorIsolation.js:94 Response headers: re {cache-control: 'public, max-age=0, must-revalidate', content-length: '214', content-type: 'application/json'}
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
(anonymous) @ api.js:538
rejected @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
createSale @ api.js:527
(anonymous) @ Sales.jsx:344
fulfilled @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
onSubmit @ Sales.jsx:304
Nb @ react-dom.production.min.js:54
Tb @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
nf @ react-dom.production.min.js:105
se @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
Qk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error
scriptErrorIsolation.js:94 Error creating sale: Error: Transaction processing error: 'str' object has no attribute 'get'
    at api.js:542:15
    at Generator.throw (<anonymous>)
    at rejected (index-DdU5WrCU.js:2:841)
console.error @ scriptErrorIsolation.js:94
console.error @ scriptErrorIsolation.js:94
(anonymous) @ Sales.jsx:363
rejected @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
fulfilled @ index-DdU5WrCU.js:2
Promise.then
step @ index-DdU5WrCU.js:2
(anonymous) @ index-DdU5WrCU.js:2
__async @ index-DdU5WrCU.js:2
onSubmit @ Sales.jsx:304
Nb @ react-dom.production.min.js:54
Tb @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
nf @ react-dom.production.min.js:105
se @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
Qk @ react-dom.production.min.js:273
Jb @ react-dom.production.min.js:52
hd @ react-dom.production.min.js:109
fd @ react-dom.production.min.js:74
ed @ react-dom.production.min.js:73Understand this error

{
    "message": "Transaction processing error: 'str' object has no attribute 'get'",
    "success": false,
    "toast": {
        "message": "Transaction processing error: 'str' object has no attribute 'get'",
        "timeout": 3000,
        "type": "error"
    }
}