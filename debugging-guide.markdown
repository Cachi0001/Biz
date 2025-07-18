# Comprehensive Debugging Guide for SabiOps Project

This guide provides a structured approach to debug and fix three specific issues in the SabiOps project: invoice creation not working, the record sale section dropdown not displaying existing products, and notifications dropping random toast messages. Follow the instructions carefully, verify each step, and document all changes using the provided template. Do not assume anything about the project structure or existing code—investigate and confirm everything.

## Important Instructions
- **Do Not Assume Project Structure**: Always locate and verify files, components, and APIs based on the instructions.
- **No Mock Push Notifications**: Use real notification data and events only.
- **Track Changes**: Document every step, file modification, and outcome using the template provided at the end.
- **Test After Changes**: Verify functionality after each fix to ensure resolution.
- **Log Everything**: Use console logs or debugging tools to trace issues.

---

## Part 1: Debugging Invoice Creation

**Objective**: Fix the invoice creation process, which is currently not working.

**Instructions**:

1. **Locate Invoice Creation Code**:
   - Search for the `Invoices.tsx` file (or similar) in the project directory, as it likely contains the invoice creation logic.
   - Identify the `createInvoice` function call within the `handleReviewConfirm` or similar submission handler.

2. **Check Form Validation**:
   - Inspect the `validateForm` function in `Invoices.tsx` to ensure all required fields (e.g., `customer_id`, `issue_date`, `items`) are validated correctly.
   - Add console logs to verify validation output:
     ```javascript
     console.log('Validation errors:', validateForm());
     ```
   - Fix any missing validations (e.g., ensure `items` array is not empty).

3. **Verify API Calls**:
   - Locate the `createInvoice` function in `services/api.js` or a similar API service file.
   - Check the endpoint URL (e.g., `https://sabiops.vercel.app/api/invoices`) and ensure it matches the backend API.
   - Test the API call manually using a tool like Postman with sample data:
     ```json
     {
       "customer_id": 1,
       "issue_date": "2023-10-01",
       "items": [{"product_id": "1", "description": "Test", "quantity": 1, "unit_price": 100}]
     }
     ```
   - If the API returns errors (e.g., 405 Method Not Allowed), check the backend route and ensure it accepts POST requests.

4. **Inspect Error Messages**:
   - Add error logging in the `catch` block of `handleReviewConfirm`:
     ```javascript
     catch (error) {
       console.error('Invoice creation error:', error.response || error);
       handleApiError(error, 'Invoice Save');
     }
     ```
   - Look for timeout errors (e.g., `timeout of 10000ms exceeded`) and increase the timeout in the API config if needed:
     ```javascript
     axios.post(url, data, { timeout: 30000 });
     ```

5. **Test and Verify**:
   - Submit a test invoice via the UI and monitor console logs and network requests in the browser’s developer tools.

**Files to Check**:
- `Invoices.tsx`
- `services/api.js` (or similar API service file)

---

## Part 2: Fixing Record Sale Section Dropdown

**Objective**: Ensure the dropdown in the record sale section displays existing products correctly.

**Instructions**:

1. **Locate Record Sale Component**:
   - Search for a file like `RecordSale.tsx`, `Sales.tsx`, or similar in the project directory that contains the sale recording logic.
   - Identify the dropdown component (e.g., `<Select>` or `<SearchableSelect>`) used for product selection.

2. **Verify Data Fetching**:
   - Find the `fetchProducts` function or equivalent in the component or a data hook (e.g., `useEffect` calling `getProducts`).
   - Add logging to check the fetched products:
     ```javascript
     const response = await getProducts();
     console.log('Fetched products:', response);
     ```
   - If the response is empty or fails (e.g., timeout error), locate `getProducts` in `services/api.js` and test the endpoint (e.g., `https://sabiops.vercel.app/api/products`) manually.

3. **Inspect Dropdown Component**:
   - Verify the dropdown is correctly mapping products to options:
     ```javascript
     products.map((product) => (
       <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
     ))
     ```
   - Ensure the `products` state is updated correctly after fetching:
     ```javascript
     setProducts(response.data.products || []);
     ```

4. **Check for Filters or Conditions**:
   - Look for any filters in the dropdown logic that might exclude products (e.g., `products.filter(p => p.active)`).
   - Remove or adjust filters if they’re incorrectly hiding products.

5. **Test and Verify**:
   - Reload the record sale page, open the dropdown, and confirm products appear. Check console logs for fetched data.

**Files to Check**:
- `RecordSale.tsx` or `Sales.tsx` (or similar)
- `services/api.js`
- Any custom dropdown component (e.g., `SearchableSelect.jsx`)

---

## Part 3: Addressing Notification Issues

**Objective**: Stop random toast messages and ensure notifications display correctly based on real events.

**Instructions**:

1. **Locate Notification Components**:
   - Search for `NotificationBell.jsx` and `NotificationCenter.jsx` (or similar) in the project directory.
   - Identify where toast messages are triggered (e.g., `showSuccessToast`, `showErrorToast`).

2. **Review Notification Logic**:
   - In `NotificationBell.jsx`, check the `loadNotifications` function and its API call:
     ```javascript
     const data = await notificationService.fetchNotifications();
     console.log('Notifications loaded:', data);
     ```
   - Ensure notifications are only displayed based on real data, not mock data:
     ```javascript
     setNotifications(data.notifications || []);
     ```

3. **Check for Duplicates**:
   - Inspect the `useEffect` hook in `NotificationBell.jsx` for duplicate API calls:
     ```javascript
     useEffect(() => {
       loadNotifications();
     }, []);
     ```
   - Remove any redundant calls or event listeners causing multiple triggers.

4. **Inspect Timing and Conditions**:
   - In `notificationService.js`, verify `fetchNotifications` isn’t called excessively:
     ```javascript
     async fetchNotifications() {
       const response = await axios.get('/api/notifications');
       console.log('Notification fetch response:', response);
       return response.data;
     }
     ```
   - Fix timeout issues by increasing the timeout or handling network errors:
     ```javascript
     await axios.get('/api/notifications', { timeout: 30000 });
     ```

5. **Remove Random Toasts**:
   - Search for all instances of `showErrorToast` and `showSuccessToast` across the project:
     ```bash
     grep -r "show.*Toast" .
     ```
   - Ensure they’re only called with specific events (e.g., invoice creation success), not in loops or intervals.

6. **Test and Verify**:
   - Trigger a real event (e.g., create an invoice) and confirm only relevant notifications appear. Monitor console logs.

**Files to Check**:
- `NotificationBell.jsx`
- `NotificationCenter.jsx`
- `services/notificationService.js`
- `utils/errorHandling.js`

---

## Template for Tracking Changes

For each issue, create a separate file or section using this template to document your work:

```
**Issue Description**:
[Describe the problem here]

**Steps Taken**:
1. [First step]
2. [Second step]
3. [Third step]
...

**Files Modified**:
- [File 1]
- [File 2]
- [File 3]
...

**Outcome**:
[Summary of the resolution or any remaining issues]
```

**Example**:
```
**Issue Description**:
Invoice creation fails with a timeout error.

**Steps Taken**:
1. Located `handleReviewConfirm` in `Invoices.tsx`.
2. Added logging to `createInvoice` call and found a 10s timeout.
3. Increased timeout to 30s in `services/api.js`.

**Files Modified**:
- `Invoices.tsx`
- `services/api.js`

**Outcome**:
Invoice creation now completes successfully.
```

---

## Final Steps
- After fixing each issue, test the entire workflow (create an invoice, record a sale, check notifications).
- Save all tracking templates in a `debug_log.md` file in the project root.
- If issues persist, review backend logs (e.g., Vercel logs) for additional clues.

By following this guide, you should resolve the specified issues systematically while maintaining a clear record of changes.