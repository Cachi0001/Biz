# Usage Limits Enforcement - Brownfield Fix

**Status:** assigned  
**Priority:** P1 - High (User Requirement #2)  
**Estimate:** 6 hours  
**Assigned to:** dev-agent  
**Created:** 2025-07-25  

## User Story

As an **Owner on a Free plan**,  
I want **the system to enforce my monthly limits (5 invoices, 5 expenses)**,  
So that **the subscription model works correctly and I'm prompted to upgrade when needed**.

## Story Context

**Existing System Integration:**
- Integrates with: Usage tracking system, Subscription enforcement
- Technology: Database triggers, Frontend limit checks, Backend validation
- Follows pattern: Existing limit enforcement in feature_usage table
- Touch points: Invoice/Expense creation, Plan upgrade prompts

**Database Schema (CONFIRMED EXISTS):**
```sql
-- Users table has usage counters:
current_month_invoices integer DEFAULT 0,
current_month_expenses integer DEFAULT 0,
usage_reset_date date DEFAULT CURRENT_DATE,

-- Feature usage table exists:
CREATE TABLE public.feature_usage (
  user_id uuid NOT NULL,
  feature_type text CHECK (feature_type = ANY (ARRAY['sales'::text, 'products'::text, 'expenses'::text, 'invoices'::text])),
  current_count integer DEFAULT 0,
  limit_count integer NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL
);

-- Functions exist:
- increment_usage_counter(user_uuid, counter_type)
- reset_monthly_usage()
- update_feature_usage()
```

**Current Problem:**
- Frontend allows unlimited invoice/expense creation
- Usage counters exist but aren't enforced
- No upgrade prompts when limits reached
- Free plan users can create more than 5 items

## Acceptance Criteria

**Functional Requirements:**

1. **Free plan limits enforced**
   - Free users can create maximum 5 invoices per month
   - Free users can create maximum 5 expenses per month
   - Attempts to exceed limit show clear error message
   - Counter resets monthly automatically

2. **Usage tracking accuracy**
   - current_month_invoices increments on invoice creation
   - current_month_expenses increments on expense creation
   - Counters display correctly in dashboard
   - Monthly reset works on first of each month

3. **Upgrade prompts triggered**
   - Warning at 80% of limit (4/5 invoices or expenses)
   - Hard stop at 100% of limit with upgrade prompt
   - Clear messaging about plan benefits

**Integration Requirements:**

4. **Backend validation works**
   - API endpoints check limits before creation
   - Proper error responses for limit exceeded
   - Usage counters update automatically via triggers

5. **Frontend limit enforcement**
   - Create buttons disabled when limit reached
   - Progress bars show usage vs. limits
   - Upgrade prompts integrated with existing UI

6. **Subscription plan integration**
   - Different limits for different plans
   - Paid plans have no limits (or high limits)
   - Plan changes update limits immediately

**Quality Requirements:**

7. **Accurate usage calculation**
   - Counters never get out of sync
   - Deletion doesn't break usage tracking
   - Edge cases handled (timezone, plan changes)

8. **User-friendly messaging**
   - Clear explanation of limits
   - Helpful upgrade suggestions
   - No confusing technical errors

## Technical Implementation Tasks

### Task 1: Verify Usage Counter Functions
**Files:** Check existing backend functions

```sql
-- Test these functions exist and work:
SELECT public.increment_usage_counter('user-uuid', 'invoice');
SELECT public.increment_usage_counter('user-uuid', 'expense');
SELECT public.reset_monthly_usage();
```

**Steps:**
1. Test increment_usage_counter function
2. Verify it updates users.current_month_invoices
3. Test reset_monthly_usage function
4. Check trigger integration with invoice/expense creation

### Task 2: Add Frontend Usage Checking
**File:** `frontend/src/hooks/useUsageTracking.js` (extend existing)

```javascript
// Enhanced usage tracking hook
export const useUsageTracking = () => {
  const [usage, setUsage] = useState({
    invoices: { current: 0, limit: 5 },
    expenses: { current: 0, limit: 5 }
  });
  
  const checkLimit = (type) => {
    const current = usage[type].current;
    const limit = usage[type].limit;
    
    return {
      canCreate: current < limit,
      isWarning: current >= limit * 0.8,
      isLimitReached: current >= limit,
      remaining: limit - current
    };
  };
  
  return { usage, checkLimit, refreshUsage };
};
```

**Steps:**
1. Extend existing usage tracking hook
2. Add limit checking logic
3. Integrate with user subscription data
4. Test with different plan types

### Task 3: Add Limit Validation to Invoice Creation
**File:** `frontend/src/pages/Invoices.jsx`

```javascript
// Add usage checking to invoice creation
const InvoiceCreateForm = () => {
  const { checkLimit } = useUsageTracking();
  const invoiceLimit = checkLimit('invoices');
  
  const handleCreateInvoice = () => {
    if (!invoiceLimit.canCreate) {
      showUpgradePrompt('invoices', invoiceLimit.remaining);
      return;
    }
    
    // Proceed with invoice creation
    createInvoice(formData);
  };
  
  return (
    <form>
      {invoiceLimit.isWarning && (
        <WarningCard>
          You have {invoiceLimit.remaining} invoices remaining this month.
        </WarningCard>
      )}
      
      <Button 
        disabled={!invoiceLimit.canCreate}
        onClick={handleCreateInvoice}
      >
        {invoiceLimit.canCreate ? 'Create Invoice' : 'Upgrade to Create More'}
      </Button>
    </form>
  );
};
```

**Steps:**
1. Add usage checking to invoice creation form
2. Show warning messages at 80% limit
3. Disable creation at 100% limit
4. Integrate upgrade prompts

### Task 4: Add Limit Validation to Expense Creation
**File:** `frontend/src/pages/Expenses.jsx`

```javascript
// Similar implementation for expenses
const ExpenseCreateForm = () => {
  const { checkLimit } = useUsageTracking();
  const expenseLimit = checkLimit('expenses');
  
  // Similar logic to invoice creation
};
```

**Steps:**
1. Mirror invoice limit logic for expenses
2. Test expense creation limit enforcement
3. Ensure consistent user experience
4. Test with different subscription plans

### Task 5: Add Backend API Validation
**File:** `backend/src/routes/invoice.py`

```python
@invoice_bp.route("/", methods=["POST"])
@jwt_required()
def create_invoice():
    owner_id = get_jwt_identity()
    
    # Check usage limits for free plan users
    user = get_user_subscription_info(owner_id)
    if user['subscription_plan'] == 'free':
        if user['current_month_invoices'] >= 5:
            return error_response(
                "Monthly invoice limit reached", 
                "Upgrade to create unlimited invoices",
                status_code=402  # Payment Required
            )
    
    # Proceed with invoice creation
    # increment_usage_counter will be called by trigger
```

**Steps:**
1. Add limit checking to create_invoice endpoint
2. Return 402 Payment Required for limit exceeded
3. Test with different subscription plans
4. Ensure triggers still increment counters

### Task 6: Add Backend API Validation for Expenses
**File:** `backend/src/routes/expense.py`

```python
# Similar validation for expense creation
@expense_bp.route("/", methods=["POST"])
@jwt_required()
def create_expense():
    # Mirror invoice limit logic
    # Check current_month_expenses vs limit
```

**Steps:**
1. Add expense creation limit checking
2. Consistent error messaging with invoices
3. Test limit enforcement end-to-end
4. Verify usage counter accuracy

### Task 7: Create Upgrade Prompt Component
**File:** `frontend/src/components/subscription/UsageLimitPrompt.jsx`

```javascript
const UsageLimitPrompt = ({ type, remaining, onUpgrade, onClose }) => {
  const messages = {
    invoices: {
      warning: `You have ${remaining} invoices remaining this month.`,
      limit: 'You've reached your monthly invoice limit.',
      upgrade: 'Upgrade to Silver plan for unlimited invoices.'
    },
    expenses: {
      warning: `You have ${remaining} expenses remaining this month.`,
      limit: 'You've reached your monthly expense limit.',
      upgrade: 'Upgrade to Silver plan for unlimited expenses.'
    }
  };
  
  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-6">
        <h3>{messages[type].limit}</h3>
        <p>{messages[type].upgrade}</p>
        <Button onClick={onUpgrade}>Upgrade Now</Button>
        <Button variant="ghost" onClick={onClose}>Maybe Later</Button>
      </div>
    </Modal>
  );
};
```

**Steps:**
1. Create reusable upgrade prompt component
2. Integrate with existing modal system
3. Add clear upgrade messaging
4. Test user flow for limit exceeded

## Technical Notes

- **Integration Approach:** Use existing database functions and add frontend enforcement
- **Existing Pattern Reference:** Follow subscription checking patterns in codebase
- **Key Constraints:** Must work with existing triggers and usage counter system

## Definition of Done

- [ ] Free plan users cannot create more than 5 invoices per month
- [ ] Free plan users cannot create more than 5 expenses per month
- [ ] Warning message appears at 80% of limit (4/5 items)
- [ ] Hard limit prevents creation at 100% (5/5 items)
- [ ] Usage counters display correctly in dashboard
- [ ] API returns 402 Payment Required when limit exceeded
- [ ] Upgrade prompts appear with clear messaging
- [ ] Monthly usage reset works correctly
- [ ] Paid plan users have no limits enforced
- [ ] Usage tracking remains accurate after deletions
- [ ] Mobile experience works correctly
- [ ] All existing functionality continues to work

## Risk Assessment

**Primary Risk:** Breaking existing invoice/expense creation for paid users  
**Mitigation:** Only enforce limits for free plan, test thoroughly with all plan types  
**Rollback:** Disable frontend limit checking, remove API validation

## Dev Agent Record

### Implementation Progress
- [ ] Task 1: Verify Usage Counter Functions
- [ ] Task 2: Add Frontend Usage Checking
- [ ] Task 3: Add Limit Validation to Invoice Creation
- [ ] Task 4: Add Limit Validation to Expense Creation
- [ ] Task 5: Add Backend API Validation
- [ ] Task 6: Add Backend API Validation for Expenses
- [ ] Task 7: Create Upgrade Prompt Component

### Testing Completed
- [ ] Free plan invoice limit enforcement works
- [ ] Free plan expense limit enforcement works
- [ ] Paid plan users have no limits
- [ ] Usage counters accurate
- [ ] Monthly reset functionality works
- [ ] Upgrade prompts appear correctly
- [ ] API validation works
- [ ] Mobile experience functional

### Blockers/Issues
(To be filled by dev agent during implementation)

### Completion Notes
(To be filled by dev agent upon completion)
