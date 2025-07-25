# SabiOps Development Stories - Release 2.1

## 📋 Story Overview

This folder contains **BMAD-format development stories** for implementing Team Management and fixing critical dashboard issues in SabiOps.

## 🎯 Sprint Goal: Core Functionality Fix

**Objective:** Enable business owners to use SabiOps for multi-user scenarios by implementing Team Management and removing broken features.

## 📁 Available Stories

### Priority P0 (Critical - Must Complete)

#### 1. Team Management Navigation
**File:** `team-management-navigation-001.md`  
**Status:** assigned  
**Estimate:** 4 hours  
**Description:** Add Team navigation to dashboard (Owner only) and create placeholder Team page

**Key Tasks:**
- Add "Team" navigation item with role-based visibility
- Create `/team` route in App.jsx
- Build placeholder Team page with proper layout
- Implement role-based navigation filtering

#### 2. Team Management CRUD Interface  
**File:** `team-management-crud-002.md`  
**Status:** assigned  
**Estimate:** 8 hours  
**Dependencies:** team-management-navigation-001.md  
**Description:** Complete Team Management functionality with create/edit/deactivate team members

**Key Tasks:**
- Build team member list with masked emails and role badges
- Create team member creation modal form
- Implement edit team member functionality
- Add deactivate/reactivate team member actions
- Integrate with existing `/api/team` endpoints

#### 3. Dashboard Payment Cleanup
**File:** `dashboard-cleanup-003.md`  
**Status:** assigned  
**Estimate:** 2 hours  
**Description:** Remove broken payment buttons and subscription upgrade features from dashboard

**Key Tasks:**
- Comment out UpgradeModal and payment handlers
- Remove upgrade buttons from SubscriptionStatus
- Disable smart upgrade system components
- Clean up quick actions (remove payment options)
- Add temporary maintenance notice

## 🛠️ Implementation Order

**Recommended sequence:**

1. **Start with:** `dashboard-cleanup-003.md` (2 hours)
   - Quick win to remove user frustration
   - Independent task that won't affect other work

2. **Then:** `team-management-navigation-001.md` (4 hours)  
   - Foundation for team management
   - Required for next story

3. **Finally:** `team-management-crud-002.md` (8 hours)
   - Main feature implementation
   - Depends on navigation being complete

**Total Estimate:** 14 hours across 3 stories

## 📋 Story Format

Each story follows BMAD format with:

- **User Story** in standard format (As a... I want... So that...)
- **Story Context** with existing system integration details
- **Acceptance Criteria** with functional/integration/quality requirements
- **Technical Implementation Tasks** with specific code examples
- **Definition of Done** with testable checkboxes
- **Dev Agent Record** section for tracking progress

## 🔧 Technical Guidelines

### Existing System Integration:
- **Frontend:** React + Tailwind CSS following existing patterns
- **Backend:** Flask API endpoints already exist for team management
- **Database:** Supabase with Row-Level Security
- **Authentication:** JWT tokens with role-based access

### Code Patterns to Follow:
- **CRUD operations:** Follow `Customers.jsx` and `Products.jsx` patterns
- **Form handling:** Use existing modal and validation patterns
- **API integration:** Extend existing `api.js` client
- **Role-based UI:** Follow existing AuthContext patterns

### File Structure:
```
frontend/src/
├── pages/Team.jsx (new)
├── components/team/ (new folder)
│   ├── TeamManagement.jsx
│   ├── TeamMemberForm.jsx
│   └── TeamMemberCard.jsx
├── components/dashboard/DashboardLayout.jsx (modify)
├── App.jsx (modify - add route)
└── services/api.js (extend)
```

## ✅ Success Criteria

After completing all stories:

- [ ] Owner can access "Team" from dashboard navigation
- [ ] Owner can create Admin and Salesperson team members
- [ ] Created team members can login with assigned credentials
- [ ] Admin sees Admin dashboard (no Team/Subscription access)
- [ ] Salesperson sees sales-focused dashboard
- [ ] No payment buttons visible on dashboard
- [ ] All existing features continue to work
- [ ] Mobile experience works correctly

## 🚨 Critical Notes

### Security Requirements:
- Only Owner role can access Team Management
- Team members inherit owner's subscription and data access
- Proper JWT validation on all team operations
- Row-Level Security prevents cross-owner data access

### Testing Requirements:
- Test with multiple user roles (Owner, Admin, Salesperson)
- Verify role-based navigation and data access
- Confirm team member creation and login works
- Validate all existing functionality remains intact

### Rollback Plan:
- All changes use conditional rendering/commenting
- Easy to disable features if issues arise
- Clear documentation of what was modified

## 🤝 Dev Agent Workflow

1. **Read story file completely** before starting implementation
2. **Update Dev Agent Record section** as you progress
3. **Complete all tasks** in the Technical Implementation section
4. **Test against Definition of Done** criteria
5. **Document any blockers/issues** in the story file
6. **Mark story complete** when all checkboxes pass

## 📞 Support

If you encounter issues or need clarification:
- Reference the comprehensive docs in `BMAD-METHOD/docs/prd/`
- Check existing patterns in `Customers.jsx` and `Products.jsx`
- All API endpoints should already exist in backend
- PM available for requirements clarification

**Let's build features that actually work! 🚀**
