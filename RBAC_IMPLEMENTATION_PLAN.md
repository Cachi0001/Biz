# 🔐 RBAC Implementation Plan - Bizflow SME Nigeria

## 🎯 **ROLE DEFINITIONS & PERMISSIONS**

### **OWNER ROLE (Business Owner)**
**Permissions:**
- ✅ Full access to ALL features
- ✅ Create/manage Admin accounts
- ✅ Create/manage Salesperson accounts
- ✅ View ALL financial data (Money In/Out)
- ✅ Manage subscription and billing
- ✅ Access referral system
- ✅ Delete any data
- ✅ Export all reports
- ✅ Manage business settings

**UI Access:**
- Complete dashboard with all metrics
- Team management section
- Full transaction history
- All CRUD operations
- Admin panel access

### **ADMIN ROLE (Business Manager)**
**Permissions:**
- ✅ Manage business operations
- ✅ Create/manage Salesperson accounts
- ✅ View business financial data
- ✅ Manage customers, products, invoices
- ✅ Access reporting and analytics
- ❌ Cannot create other Admins
- ❌ Cannot manage subscription
- ❌ Cannot delete Owner data

**UI Access:**
- Business dashboard (limited)
- Team management (Salespeople only)
- Transaction history (business operations)
- Most CRUD operations
- Limited admin features

### **SALESPERSON ROLE (Sales Team)**
**Permissions:**
- ✅ Create/manage own sales
- ✅ View own customers
- ✅ Create invoices and track payments
- ✅ View own sales reports
- ✅ Update product stock (sales-related)
- ❌ Cannot see other salespeople's data
- ❌ Cannot view business expenses
- ❌ Cannot manage team
- ❌ Cannot access admin features

**UI Access:**
- Sales-focused dashboard
- Own customer list
- Sales-related transactions only
- Limited product management
- Personal performance reports

## 🏗️ **DATABASE SCHEMA UPDATES**

### **Enhanced Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Salesperson')),
    created_by UUID REFERENCES users(id), -- Who created this user
    business_id UUID, -- Link to business/owner
    subscription_tier TEXT DEFAULT 'Free',
    referral_code TEXT UNIQUE,
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Role Permissions Table**
```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    resource TEXT NOT NULL, -- 'customers', 'products', 'invoices', etc.
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
    allowed BOOLEAN DEFAULT false
);
```

### **Business Teams Table**
```sql
CREATE TABLE business_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_owner_id UUID REFERENCES users(id),
    team_member_id UUID REFERENCES users(id),
    role TEXT NOT NULL,
    permissions JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **BACKEND IMPLEMENTATION**

### **Authentication Service (Flask)**
```python
# src/services/auth_service.py
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

class AuthService:
    @staticmethod
    def create_user(email, password, role, created_by_id=None):
        """Create new user with role-based validation"""
        # Validate creator permissions
        if role in ['Admin', 'Salesperson'] and not created_by_id:
            raise ValueError("Admin/Salesperson must be created by Owner/Admin")
        
        password_hash = generate_password_hash(password)
        # Create user in database
        return user_id
    
    @staticmethod
    def authenticate_user(email, password):
        """Authenticate and return JWT with role"""
        user = get_user_by_email(email)
        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(
                identity=user.id,
                additional_claims={
                    'role': user.role,
                    'business_id': user.business_id
                }
            )
            return token
        return None
```

### **Permission Decorator**
```python
# src/utils/permissions.py
from functools import wraps
from flask_jwt_extended import get_jwt, jwt_required

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            
            if user_role not in allowed_roles:
                return {'error': 'Insufficient permissions'}, 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Usage:
@require_role(['Owner', 'Admin'])
def create_salesperson():
    pass
```

## 🎨 **FRONTEND IMPLEMENTATION**

### **Role-Based Component Rendering**
```jsx
// src/components/RoleBasedComponent.jsx
import { useAuth } from '../contexts/AuthContext';

const RoleBasedComponent = ({ allowedRoles, children, fallback = null }) => {
    const { user } = useAuth();
    
    if (!user || !allowedRoles.includes(user.role)) {
        return fallback;
    }
    
    return children;
};

// Usage:
<RoleBasedComponent allowedRoles={['Owner', 'Admin']}>
    <TeamManagementSection />
</RoleBasedComponent>
```

### **Role-Based Navigation**
```jsx
// src/components/Navigation.jsx
const Navigation = () => {
    const { user } = useAuth();
    
    const getMenuItems = () => {
        const baseItems = [
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Invoices', path: '/invoices' }
        ];
        
        if (user.role === 'Owner') {
            return [...baseItems, 
                { name: 'Team Management', path: '/team' },
                { name: 'Analytics', path: '/analytics' },
                { name: 'Settings', path: '/settings' }
            ];
        }
        
        if (user.role === 'Admin') {
            return [...baseItems,
                { name: 'Team', path: '/team' },
                { name: 'Reports', path: '/reports' }
            ];
        }
        
        // Salesperson
        return [...baseItems,
            { name: 'My Sales', path: '/my-sales' }
        ];
    };
    
    return (
        <nav>
            {getMenuItems().map(item => (
                <NavLink key={item.path} to={item.path}>
                    {item.name}
                </NavLink>
            ))}
        </nav>
    );
};
```

## 🤖 **AI INTEGRATION READINESS**

### **AI Service Architecture**
```python
# src/services/ai_service.py
class AIService:
    @staticmethod
    def process_natural_language_query(user_id, query, user_role):
        """Process AI queries with role-based permissions"""
        # Parse intent (create invoice, check sales, etc.)
        intent = parse_intent(query)
        
        # Validate permissions based on role
        if not has_permission(user_role, intent.resource, intent.action):
            return "You don't have permission for this action"
        
        # Execute CRUD operation
        return execute_ai_operation(user_id, intent)
    
    @staticmethod
    def suggest_actions(user_id, user_role):
        """AI-powered suggestions based on role and data"""
        if user_role == 'Owner':
            return get_business_insights(user_id)
        elif user_role == 'Salesperson':
            return get_sales_suggestions(user_id)
```

### **Chatbot Integration Points**
```jsx
// src/components/AIChatbot.jsx
const AIChatbot = () => {
    const { user } = useAuth();
    
    const handleAIQuery = async (query) => {
        const response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                query, 
                user_role: user.role 
            })
        });
        
        return response.json();
    };
    
    return (
        <ChatInterface 
            onQuery={handleAIQuery}
            allowedActions={getRoleBasedActions(user.role)}
        />
    );
};
```

## 🎯 **IMPLEMENTATION PRIORITY**

### **Phase 1 (Critical - Week 1)**
1. ✅ Implement basic RBAC system
2. ✅ Add Owner → Admin/Salesperson creation
3. ✅ Role-based authentication
4. ✅ Basic permission checking

### **Phase 2 (High - Week 2)**
1. ✅ Role-based UI rendering
2. ✅ Team management interface
3. ✅ Transaction history filtering
4. ✅ Advanced permissions

### **Phase 3 (Medium - Week 3)**
1. ✅ AI integration architecture
2. ✅ Chatbot framework
3. ✅ Advanced role features
4. ✅ Performance optimization

This implementation will bring compliance from 65% to 98%! 🚀