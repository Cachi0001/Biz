# Team Management CRUD Interface - Brownfield Addition

**Status:** assigned  
**Priority:** P0 - Critical  
**Estimate:** 8 hours  
**Assigned to:** dev-agent  
**Created:** 2025-07-25  
**Dependencies:** team-management-navigation-001.md

## User Story

As an **Owner**,  
I want **to create, view, edit, and deactivate team members through a management interface**,  
So that **I can control who has access to my business and assign appropriate roles**.

## Story Context

**Existing System Integration:**
- Integrates with: Team API endpoints (`/api/team`), User authentication system
- Technology: React forms, Supabase database, JWT authentication  
- Follows pattern: Existing CRUD interfaces (Customers, Products, Invoices)
- Touch points: AuthContext, API client, form validation patterns

**Backend API Endpoints (Already Exist):**
```bash
GET /api/team - List team members (Owner only)
POST /api/team - Create team member (Owner only)  
PUT /api/team/{id} - Update team member (Owner only)
DELETE /api/team/{id} - Deactivate team member (Owner only)
```

**Existing Form Patterns:**
- Customer management forms in `src/pages/Customers.jsx`
- Product management forms in `src/pages/Products.jsx`
- Modal-based create/edit pattern with toast notifications

## Acceptance Criteria

**Functional Requirements:**

1. **Team member list displays correctly**
   - Shows all team members for current owner
   - Displays: Full Name, Email (partially masked), Role, Status, Created Date
   - Email masking: "john@example.com" → "jo***@example.com"
   - Role badges: Admin (blue), Salesperson (green)
   - Status indicators: Active (green), Inactive (gray)

2. **Create team member functionality**
   - "Add Team Member" button opens modal form
   - Form fields: Full Name, Email, Password, Role dropdown
   - Client-side validation before submission
   - Success toast and list refresh on creation
   - New member can login immediately with provided credentials

3. **Edit team member functionality**
   - "Edit" button on each team member row
   - Pre-populated form with current data
   - Can modify: Name, Email, Role, Status
   - Password field optional (blank = no change)
   - Success toast and list update on save

4. **Deactivate/reactivate functionality**
   - "Deactivate" button with confirmation dialog
   - Immediate access revocation (team member can't login)
   - Visual change to inactive styling
   - "Reactivate" button for inactive members

**Integration Requirements:**

5. **API integration works correctly**
   - All CRUD operations use existing `/api/team` endpoints
   - Proper JWT token authentication
   - Error handling for API failures with user-friendly messages

6. **Form validation follows existing patterns**
   - Real-time field validation like other forms
   - Consistent error message styling and placement
   - Same validation rules as user registration

7. **UI follows existing design patterns**
   - Modal forms match customer/product creation patterns
   - Table/card layout consistent with other list pages
   - Toast notifications match existing implementation

**Quality Requirements:**

8. **Data security and validation**
   - Password hashing handled by backend
   - Email uniqueness validation
   - Role-based access enforced (only Owner can access)

9. **Error handling and edge cases**
   - Network error handling with retry options
   - Empty state when no team members exist
   - Loading states during API operations

## Technical Implementation Tasks

### Task 1: Create Team Management Page Structure
**File:** `frontend/src/pages/Team.jsx`

```javascript
// Main team management page
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { TeamManagement } from '../components/team/TeamManagement';

const Team = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        </div>
        <TeamManagement />
      </div>
    </DashboardLayout>
  );
};
```

**Steps:**
1. Replace placeholder Team page with proper structure
2. Import and use TeamManagement component
3. Add proper page title and layout
4. Test page loads with correct structure

### Task 2: Create Team Management Component
**File:** `frontend/src/components/team/TeamManagement.jsx` (new file)

```javascript
// Team list and management component
const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Fetch team members, handle create/edit/delete
  // Follow existing patterns from Customers.jsx
};
```

**Steps:**
1. Create component with state management
2. Implement team member fetching with API calls
3. Add loading states and error handling
4. Create team member list rendering
5. Integrate create/edit modal handling

### Task 3: Create Team Member Form Component
**File:** `frontend/src/components/team/TeamMemberForm.jsx` (new file)

```javascript
// Modal form for create/edit team members
const TeamMemberForm = ({ isOpen, onClose, member, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Admin'
  });

  // Form validation, submission, error handling
  // Follow existing form patterns
};
```

**Steps:**
1. Create reusable form component for create/edit
2. Implement form validation following existing patterns
3. Add proper error handling and loading states
4. Integrate with team API endpoints
5. Test both create and edit modes

### Task 4: Create Team Member Display Components
**File:** `frontend/src/components/team/TeamMemberCard.jsx` (new file)

```javascript
// Individual team member display card/row
const TeamMemberCard = ({ member, onEdit, onDeactivate }) => {
  const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  };

  // Render member info with actions
};
```

**Steps:**
1. Create team member display component
2. Implement email masking for privacy
3. Add role badges with proper colors
4. Create action buttons (Edit, Deactivate/Reactivate)
5. Test with different member states

### Task 5: Integrate API Client Methods
**File:** `frontend/src/services/api.js` (extend existing)

```javascript
// Add team management API methods
export const teamAPI = {
  getTeamMembers: () => apiClient.get('/team'),
  createTeamMember: (data) => apiClient.post('/team', data),
  updateTeamMember: (id, data) => apiClient.put(`/team/${id}`, data),
  deactivateTeamMember: (id) => apiClient.delete(`/team/${id}`)
};
```

**Steps:**
1. Add team API methods to existing API client
2. Ensure proper JWT token headers
3. Add error handling and response formatting
4. Test all API methods work correctly

### Task 6: Add Form Validation
**File:** `frontend/src/utils/validation.js` (extend existing)

```javascript
// Team member validation rules
export const validateTeamMember = (data) => {
  const errors = {};
  
  if (!data.full_name?.trim()) {
    errors.full_name = 'Full name is required';
  }
  
  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Additional validation rules
  return errors;
};
```

**Steps:**
1. Add team member validation functions
2. Follow existing validation patterns
3. Include password strength validation
4. Test validation with various inputs

## Technical Notes

- **Integration Approach:** Follows existing CRUD patterns from Customers/Products pages
- **Existing Pattern Reference:** `src/pages/Customers.jsx` for form handling and API integration
- **Key Constraints:** Must maintain data security and role-based access control

## Definition of Done

- [ ] Team page displays list of team members correctly
- [ ] "Add Team Member" button opens creation modal
- [ ] Create team member form validates and submits successfully
- [ ] New team member appears in list immediately after creation
- [ ] Created team member can login with provided credentials
- [ ] Edit functionality pre-populates form and saves changes
- [ ] Email addresses are properly masked in list display
- [ ] Role badges display with correct colors (Admin: blue, Salesperson: green)
- [ ] Deactivate functionality works with confirmation dialog
- [ ] Deactivated team members cannot login
- [ ] Reactivate functionality restores access
- [ ] Empty state displays when no team members exist
- [ ] Loading states show during API operations
- [ ] Error handling displays user-friendly messages
- [ ] Mobile responsiveness works correctly
- [ ] All API endpoints return expected data
- [ ] Form validation prevents invalid submissions

## Risk Assessment

**Primary Risk:** API integration issues or authentication problems  
**Mitigation:** Follow existing API patterns and test thoroughly with different user roles  
**Rollback:** Disable team management features and show "coming soon" message

## Dev Agent Record

### Implementation Progress
- [ ] Task 1: Create Team Management Page Structure
- [ ] Task 2: Create Team Management Component
- [ ] Task 3: Create Team Member Form Component
- [ ] Task 4: Create Team Member Display Components
- [ ] Task 5: Integrate API Client Methods
- [ ] Task 6: Add Form Validation

### Testing Completed
- [ ] Team member list loads correctly
- [ ] Create team member form works
- [ ] Edit team member form works
- [ ] Deactivate/reactivate functionality works
- [ ] Email masking displays correctly
- [ ] Role badges display correctly
- [ ] Mobile responsiveness verified
- [ ] API error handling tested
- [ ] Authentication/authorization tested

### Blockers/Issues
(To be filled by dev agent during implementation)

### Completion Notes
(To be filled by dev agent upon completion)
