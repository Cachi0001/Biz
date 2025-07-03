App.jsx:5  Uncaught SyntaxError: The requested module '/src/components/Layout.jsx?t=1751526731194' does not provide an export named 'default' (at App.jsx:5:8)
hook.js:608  Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?

Check the render method of `Primitive.button.SlotClone`. Error Component Stack
    at Button (button.jsx:39:3)
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at dialog.tsx:100:13
    at SheetTrigger (sheet.jsx:14:6)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Sheet (sheet.jsx:8:6)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
printWarning @ react-dom.development.js:86
error @ react-dom.development.js:60
validateFunctionComponentInDev @ react-dom.development.js:20222
mountIndeterminateComponent @ react-dom.development.js:20189
beginWork @ react-dom.development.js:21626
beginWork$1 @ react-dom.development.js:27465
performUnitOfWork @ react-dom.development.js:26596
workLoopConcurrent @ react-dom.development.js:26582
renderRootConcurrent @ react-dom.development.js:26544
performConcurrentWorkOnRoot @ react-dom.development.js:25777
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
hook.js:608  Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?

Check the render method of `Primitive.button.SlotClone`. Error Component Stack
    at Button (button.jsx:39:3)
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at popper.tsx:75:13
    at menu.tsx:149:13
    at dropdown-menu.tsx:101:13
    at DropdownMenuTrigger (dropdown-menu.jsx:22:6)
    at Provider (create-context.tsx:59:15)
    at Provider (create-context.tsx:59:15)
    at Provider (create-context.tsx:59:15)
    at Popper (popper.tsx:50:11)
    at Menu (menu.tsx:88:11)
    at Provider (create-context.tsx:59:15)
    at DropdownMenu (dropdown-menu.tsx:52:5)
    at DropdownMenu (dropdown-menu.jsx:10:6)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
printWarning @ react-dom.development.js:86
error @ react-dom.development.js:60
validateFunctionComponentInDev @ react-dom.development.js:20222
mountIndeterminateComponent @ react-dom.development.js:20189
beginWork @ react-dom.development.js:21626
beginWork$1 @ react-dom.development.js:27465
performUnitOfWork @ react-dom.development.js:26596
workLoopConcurrent @ react-dom.development.js:26582
renderRootConcurrent @ react-dom.development.js:26544
performConcurrentWorkOnRoot @ react-dom.development.js:25777
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
Dashboard.jsx:65  Failed to fetch dashboard data: TypeError: apiService.getRevenueChart is not a function
    at fetchDashboardData (Dashboard.jsx:53:22)
    at Dashboard.jsx:71:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at commitPassiveMountOnFiber (react-dom.development.js:24965:13)
    at commitPassiveMountEffects_complete (react-dom.development.js:24930:9)
    at commitPassiveMountEffects_begin (react-dom.development.js:24917:7)
    at commitPassiveMountEffects (react-dom.development.js:24905:3)
    at flushPassiveEffectsImpl (react-dom.development.js:27078:3)
    at flushPassiveEffects (react-dom.development.js:27023:14)
    at performSyncWorkOnRoot (react-dom.development.js:26115:3) Error Component Stack
    at Dashboard (Dashboard.jsx:34:20)
    at div (<anonymous>)
    at main (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
fetchDashboardData @ Dashboard.jsx:65
(anonymous) @ Dashboard.jsx:71
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
Dashboard.jsx:65  Failed to fetch dashboard data: TypeError: apiService.getRevenueChart is not a function
    at fetchDashboardData (Dashboard.jsx:53:22)
    at Dashboard.jsx:71:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at invokePassiveEffectMountInDEV (react-dom.development.js:25193:13)
    at invokeEffectsInDev (react-dom.development.js:27390:11)
    at commitDoubleInvokeEffectsInDEV (react-dom.development.js:27369:7)
    at flushPassiveEffectsImpl (react-dom.development.js:27095:5)
    at flushPassiveEffects (react-dom.development.js:27023:14)
    at performSyncWorkOnRoot (react-dom.development.js:26115:3)
    at flushSyncCallbacks (react-dom.development.js:12042:22)
overrideMethod @ hook.js:608
fetchDashboardData @ Dashboard.jsx:65
(anonymous) @ Dashboard.jsx:71
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
api.js:154   GET http://localhost:5001/api/dashboard/overview 422 (UNPROCESSABLE ENTITY)
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getDashboardOverview @ api.js:154
fetchDashboardData @ Dashboard.jsx:52
(anonymous) @ Dashboard.jsx:71
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
api.js:155  Uncaught (in promise) AxiosError {message: 'Request failed with status code 422', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
settle @ settle.js:19
onloadend @ xhr.js:59
XMLHttpRequest.send
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getDashboardOverview @ api.js:154
fetchDashboardData @ Dashboard.jsx:52
(anonymous) @ Dashboard.jsx:71
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
api.js:154   GET http://localhost:5001/api/dashboard/overview 422 (UNPROCESSABLE ENTITY)
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getDashboardOverview @ api.js:154
fetchDashboardData @ Dashboard.jsx:52
(anonymous) @ Dashboard.jsx:71
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
api.js:155  Uncaught (in promise) AxiosError {message: 'Request failed with status code 422', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
settle @ settle.js:19
onloadend @ xhr.js:59
XMLHttpRequest.send
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getDashboardOverview @ api.js:154
fetchDashboardData @ Dashboard.jsx:52
(anonymous) @ Dashboard.jsx:71
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
hook.js:608  Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?

Check the render method of `Primitive.div.SlotClone`. Error Component Stack
    at SheetOverlay (sheet.jsx:32:3)
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at portal.tsx:22:22
    at Presence (presence.tsx:12:11)
    at Provider (create-context.tsx:59:15)
    at DialogPortal (dialog.tsx:146:11)
    at SheetPortal (sheet.jsx:26:6)
    at SheetContent (sheet.jsx:47:3)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Sheet (sheet.jsx:8:6)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
printWarning @ react-dom.development.js:86
error @ react-dom.development.js:60
validateFunctionComponentInDev @ react-dom.development.js:20222
mountIndeterminateComponent @ react-dom.development.js:20189
beginWork @ react-dom.development.js:21626
beginWork$1 @ react-dom.development.js:27465
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
performSyncWorkOnRoot @ react-dom.development.js:26124
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/dialog Error Component Stack
    at TitleWarning (dialog.tsx:508:54)
    at dialog.tsx:386:13
    at dialog.tsx:261:58
    at Presence (presence.tsx:12:11)
    at dialog.tsx:236:64
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at portal.tsx:22:22
    at Presence (presence.tsx:12:11)
    at Provider (create-context.tsx:59:15)
    at DialogPortal (dialog.tsx:146:11)
    at SheetPortal (sheet.jsx:26:6)
    at SheetContent (sheet.jsx:47:3)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Sheet (sheet.jsx:8:6)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:520
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}. Error Component Stack
    at DescriptionWarning (dialog.tsx:534:66)
    at dialog.tsx:386:13
    at dialog.tsx:261:58
    at Presence (presence.tsx:12:11)
    at dialog.tsx:236:64
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at portal.tsx:22:22
    at Presence (presence.tsx:12:11)
    at Provider (create-context.tsx:59:15)
    at DialogPortal (dialog.tsx:146:11)
    at SheetPortal (sheet.jsx:26:6)
    at SheetContent (sheet.jsx:47:3)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Sheet (sheet.jsx:8:6)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:543
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/dialog
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:520
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:543
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
:5173/sales/report:1  Access to XMLHttpRequest at 'http://localhost:5001/api/sales/report?date=2025-07-03' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
SalesReport.jsx:54  Failed to fetch sales report: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ hook.js:608
fetchSalesReport @ SalesReport.jsx:54
await in fetchSalesReport
(anonymous) @ SalesReport.jsx:37
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
api.js:296   GET http://localhost:5001/api/sales/report?date=2025-07-03 net::ERR_FAILED
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getSalesReport @ api.js:296
fetchSalesReport @ SalesReport.jsx:51
(anonymous) @ SalesReport.jsx:37
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
:5173/sales/report:1  Access to XMLHttpRequest at 'http://localhost:5001/api/sales/report?date=2025-07-03' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
SalesReport.jsx:54  Failed to fetch sales report: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ hook.js:608
fetchSalesReport @ SalesReport.jsx:54
await in fetchSalesReport
(anonymous) @ SalesReport.jsx:37
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
api.js:296   GET http://localhost:5001/api/sales/report?date=2025-07-03 net::ERR_FAILED
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getSalesReport @ api.js:296
fetchSalesReport @ SalesReport.jsx:51
(anonymous) @ SalesReport.jsx:37
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
:5173/sales/report:1  Access to XMLHttpRequest at 'http://localhost:5001/api/sales/report?start_date=2025-07-03&end_date=2025-07-03' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
SalesReport.jsx:54  Failed to fetch sales report: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ hook.js:608
fetchSalesReport @ SalesReport.jsx:54
await in fetchSalesReport
(anonymous) @ SalesReport.jsx:37
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
api.js:296   GET http://localhost:5001/api/sales/report?start_date=2025-07-03&end_date=2025-07-03 net::ERR_FAILED
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getSalesReport @ api.js:296
fetchSalesReport @ SalesReport.jsx:51
(anonymous) @ SalesReport.jsx:37
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
:5173/sales/report:1  Access to XMLHttpRequest at 'http://localhost:5001/api/sales/report?start_date=2025-07-03&end_date=2025-07-03' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
SalesReport.jsx:54  Failed to fetch sales report: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ hook.js:608
fetchSalesReport @ SalesReport.jsx:54
await in fetchSalesReport
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
api.js:296   GET http://localhost:5001/api/sales/report?start_date=2025-07-03&end_date=2025-07-03 net::ERR_FAILED
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getSalesReport @ api.js:296
fetchSalesReport @ SalesReport.jsx:51
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
:5173/sales/report:1  Access to XMLHttpRequest at 'http://localhost:5001/api/sales/report?start_date=2025-07-03&end_date=2025-07-03' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
SalesReport.jsx:54  Failed to fetch sales report: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ hook.js:608
fetchSalesReport @ SalesReport.jsx:54
await in fetchSalesReport
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
api.js:296   GET http://localhost:5001/api/sales/report?start_date=2025-07-03&end_date=2025-07-03 net::ERR_FAILED
dispatchXhrRequest @ xhr.js:195
xhr @ xhr.js:15
dispatchRequest @ dispatchRequest.js:51
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
Axios.<computed> @ Axios.js:213
wrap @ bind.js:5
getSalesReport @ api.js:296
fetchSalesReport @ SalesReport.jsx:51
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:4291
executeDispatch @ react-dom.development.js:9041
processDispatchQueueItemsInOrder @ react-dom.development.js:9073
processDispatchQueue @ react-dom.development.js:9086
dispatchEventsForPlugins @ react-dom.development.js:9097
(anonymous) @ react-dom.development.js:9288
batchedUpdates$1 @ react-dom.development.js:26179
batchedUpdates @ react-dom.development.js:3991
dispatchEventForPluginEventSystem @ react-dom.development.js:9287
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom.development.js:6465
dispatchEvent @ react-dom.development.js:6457
dispatchDiscreteEvent @ react-dom.development.js:6430
hook.js:608  `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/dialog Error Component Stack
    at TitleWarning (dialog.tsx:508:54)
    at dialog.tsx:386:13
    at dialog.tsx:261:58
    at Presence (presence.tsx:12:11)
    at dialog.tsx:236:64
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at portal.tsx:22:22
    at Presence (presence.tsx:12:11)
    at Provider (create-context.tsx:59:15)
    at DialogPortal (dialog.tsx:146:11)
    at SheetPortal (sheet.jsx:26:6)
    at SheetContent (sheet.jsx:47:3)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Sheet (sheet.jsx:8:6)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:520
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}. Error Component Stack
    at DescriptionWarning (dialog.tsx:534:66)
    at dialog.tsx:386:13
    at dialog.tsx:261:58
    at Presence (presence.tsx:12:11)
    at dialog.tsx:236:64
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at portal.tsx:22:22
    at Presence (presence.tsx:12:11)
    at Provider (create-context.tsx:59:15)
    at DialogPortal (dialog.tsx:146:11)
    at SheetPortal (sheet.jsx:26:6)
    at SheetContent (sheet.jsx:47:3)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Sheet (sheet.jsx:8:6)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:543
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/dialog
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:520
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:543
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
Expenses.jsx:59  Error fetching expenses: ReferenceError: api is not defined
    at fetchExpenses (Expenses.jsx:55:24)
    at Expenses.jsx:48:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at commitPassiveMountOnFiber (react-dom.development.js:24965:13)
    at commitPassiveMountEffects_complete (react-dom.development.js:24930:9)
    at commitPassiveMountEffects_begin (react-dom.development.js:24917:7)
    at commitPassiveMountEffects (react-dom.development.js:24905:3)
    at flushPassiveEffectsImpl (react-dom.development.js:27078:3)
    at flushPassiveEffects (react-dom.development.js:27023:14)
    at performSyncWorkOnRoot (react-dom.development.js:26115:3) Error Component Stack
    at Expenses (Expenses.jsx:16:35)
    at div (<anonymous>)
    at main (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
fetchExpenses @ Expenses.jsx:59
(anonymous) @ Expenses.jsx:48
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
Expenses.jsx:70  Error fetching categories: ReferenceError: api is not defined
    at fetchCategories (Expenses.jsx:67:24)
    at Expenses.jsx:49:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at commitPassiveMountOnFiber (react-dom.development.js:24965:13)
    at commitPassiveMountEffects_complete (react-dom.development.js:24930:9)
    at commitPassiveMountEffects_begin (react-dom.development.js:24917:7)
    at commitPassiveMountEffects (react-dom.development.js:24905:3)
    at flushPassiveEffectsImpl (react-dom.development.js:27078:3)
    at flushPassiveEffects (react-dom.development.js:27023:14)
    at performSyncWorkOnRoot (react-dom.development.js:26115:3) Error Component Stack
    at Expenses (Expenses.jsx:16:35)
    at div (<anonymous>)
    at main (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
fetchCategories @ Expenses.jsx:70
(anonymous) @ Expenses.jsx:49
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
Expenses.jsx:59  Error fetching expenses: ReferenceError: api is not defined
    at fetchExpenses (Expenses.jsx:55:24)
    at Expenses.jsx:48:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at invokePassiveEffectMountInDEV (react-dom.development.js:25193:13)
    at invokeEffectsInDev (react-dom.development.js:27390:11)
    at commitDoubleInvokeEffectsInDEV (react-dom.development.js:27369:7)
    at flushPassiveEffectsImpl (react-dom.development.js:27095:5)
    at flushPassiveEffects (react-dom.development.js:27023:14)
    at performSyncWorkOnRoot (react-dom.development.js:26115:3)
    at flushSyncCallbacks (react-dom.development.js:12042:22)
overrideMethod @ hook.js:608
fetchExpenses @ Expenses.jsx:59
(anonymous) @ Expenses.jsx:48
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
Expenses.jsx:70  Error fetching categories: ReferenceError: api is not defined
    at fetchCategories (Expenses.jsx:67:24)
    at Expenses.jsx:49:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at invokePassiveEffectMountInDEV (react-dom.development.js:25193:13)
    at invokeEffectsInDev (react-dom.development.js:27390:11)
    at commitDoubleInvokeEffectsInDEV (react-dom.development.js:27369:7)
    at flushPassiveEffectsImpl (react-dom.development.js:27095:5)
    at flushPassiveEffects (react-dom.development.js:27023:14)
    at performSyncWorkOnRoot (react-dom.development.js:26115:3)
    at flushSyncCallbacks (react-dom.development.js:12042:22)
overrideMethod @ hook.js:608
fetchCategories @ Expenses.jsx:70
(anonymous) @ Expenses.jsx:49
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
performSyncWorkOnRoot @ react-dom.development.js:26115
flushSyncCallbacks @ react-dom.development.js:12042
commitRootImpl @ react-dom.development.js:26998
commitRoot @ react-dom.development.js:26721
finishConcurrentRender @ react-dom.development.js:26020
performConcurrentWorkOnRoot @ react-dom.development.js:25848
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
hook.js:608  Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?

Check the render method of `Primitive.button.SlotClone`. Error Component Stack
    at Button (button.jsx:39:3)
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at dialog.tsx:100:13
    at DialogTrigger (dialog.jsx:14:6)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Dialog (dialog.jsx:8:6)
    at div (<anonymous>)
    at div (<anonymous>)
    at Expenses (Expenses.jsx:16:35)
    at div (<anonymous>)
    at main (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
printWarning @ react-dom.development.js:86
error @ react-dom.development.js:60
validateFunctionComponentInDev @ react-dom.development.js:20222
mountIndeterminateComponent @ react-dom.development.js:20189
beginWork @ react-dom.development.js:21626
beginWork$1 @ react-dom.development.js:27465
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
performConcurrentWorkOnRoot @ react-dom.development.js:25777
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
hook.js:608  Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?

Check the render method of `Primitive.div.SlotClone`. Error Component Stack
    at DialogOverlay (dialog.jsx:32:3)
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at portal.tsx:22:22
    at Presence (presence.tsx:12:11)
    at Provider (create-context.tsx:59:15)
    at DialogPortal (dialog.tsx:146:11)
    at DialogPortal (dialog.jsx:20:6)
    at DialogContent (dialog.jsx:47:3)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Dialog (dialog.jsx:8:6)
    at div (<anonymous>)
    at div (<anonymous>)
    at Expenses (Expenses.jsx:16:35)
    at div (<anonymous>)
    at main (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
printWarning @ react-dom.development.js:86
error @ react-dom.development.js:60
validateFunctionComponentInDev @ react-dom.development.js:20222
mountIndeterminateComponent @ react-dom.development.js:20189
beginWork @ react-dom.development.js:21626
beginWork$1 @ react-dom.development.js:27465
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
performSyncWorkOnRoot @ react-dom.development.js:26124
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}. Error Component Stack
    at DescriptionWarning (dialog.tsx:534:66)
    at dialog.tsx:386:13
    at dialog.tsx:261:58
    at Presence (presence.tsx:12:11)
    at dialog.tsx:236:64
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at portal.tsx:22:22
    at Presence (presence.tsx:12:11)
    at Provider (create-context.tsx:59:15)
    at DialogPortal (dialog.tsx:146:11)
    at DialogPortal (dialog.jsx:20:6)
    at DialogContent (dialog.jsx:47:3)
    at Provider (create-context.tsx:59:15)
    at Dialog (dialog.tsx:52:5)
    at Dialog (dialog.jsx:8:6)
    at div (<anonymous>)
    at div (<anonymous>)
    at Expenses (Expenses.jsx:16:35)
    at div (<anonymous>)
    at main (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526636207:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:543
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
hook.js:608  Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
overrideMethod @ hook.js:608
(anonymous) @ dialog.tsx:543
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
commitRootImpl @ react-dom.development.js:26974
commitRoot @ react-dom.development.js:26721
performSyncWorkOnRoot @ react-dom.development.js:26156
flushSyncCallbacks @ react-dom.development.js:12042
(anonymous) @ react-dom.development.js:25690
@react-refresh:228  Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?

Check the render method of `Primitive.button.SlotClone`. Error Component Stack
    at Button (button.jsx:39:3)
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at slot.tsx:68:13
    at slot.tsx:15:13
    at primitive.tsx:40:13
    at popper.tsx:75:13
    at menu.tsx:149:13
    at dropdown-menu.tsx:101:13
    at DropdownMenuTrigger (dropdown-menu.jsx:22:6)
    at Provider (create-context.tsx:59:15)
    at Provider (create-context.tsx:59:15)
    at Provider (create-context.tsx:59:15)
    at Popper (popper.tsx:50:11)
    at Menu (menu.tsx:88:11)
    at Provider (create-context.tsx:59:15)
    at DropdownMenu (dropdown-menu.tsx:52:5)
    at DropdownMenu (dropdown-menu.jsx:10:6)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at Layout (Layout.jsx?t=1751526705440:52:19)
    at ProtectedRoute (ProtectedRoute.jsx:5:27)
    at RenderedRoute (chunk-QMGIS6GS.mjs:5106:26)
    at Routes (chunk-QMGIS6GS.mjs:5796:3)
    at div (<anonymous>)
    at Router (chunk-QMGIS6GS.mjs:5739:13)
    at BrowserRouter (chunk-QMGIS6GS.mjs:8800:3)
    at AuthProvider (AuthContext.jsx:14:32)
    at App (<anonymous>)
overrideMethod @ hook.js:608
printWarning @ react-dom.development.js:86
error @ react-dom.development.js:60
validateFunctionComponentInDev @ react-dom.development.js:20222
mountIndeterminateComponent @ react-dom.development.js:20189
beginWork @ react-dom.development.js:21626
beginWork$1 @ react-dom.development.js:27465
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
performSyncWorkOnRoot @ react-dom.development.js:26124
flushSyncCallbacks @ react-dom.development.js:12042
flushSync @ react-dom.development.js:26240
scheduleRefresh @ react-dom.development.js:27834
p.scheduleRefresh @ renderer.js:963
(anonymous) @ @react-refresh:228
performReactRefresh @ @react-refresh:217
(anonymous) @ @react-refresh:586
setTimeout
(anonymous) @ @react-refresh:576
validateRefreshBoundaryAndEnqueueUpdate @ @react-refresh:625
(anonymous) @ Layout.jsx?t=1751526636207:512
(anonymous) @ client:34
(anonymous) @ client:213
(anonymous) @ client:186
queueUpdate @ client:186
await in queueUpdate
(anonymous) @ client:930
handleMessage @ client:928
await in handleMessage
(anonymous) @ client:490
dequeue @ client:516
(anonymous) @ client:504
enqueue @ client:498
(anonymous) @ client:490
onMessage @ client:309
(anonymous) @ client:439
client:882  [vite] SyntaxError: The requested module '/src/components/Layout.jsx?t=1751526731125' does not provide an export named 'default' (at App.jsx:5:8)
overrideMethod @ hook.js:608
error @ client:882
warnFailedUpdate @ client:167
fetchUpdate @ client:206
await in fetchUpdate
queueUpdate @ client:179
(anonymous) @ client:930
handleMessage @ client:928
await in handleMessage
(anonymous) @ client:490
dequeue @ client:516
(anonymous) @ client:504
enqueue @ client:498
(anonymous) @ client:490
onMessage @ client:309
(anonymous) @ client:439
client:882  [vite] Failed to reload /src/App.jsx. This could be due to syntax errors or importing non-existent modules. (see errors above)