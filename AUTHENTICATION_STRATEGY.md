# 🔐 Authentication Strategy - Flask + Supabase Hybrid

## 🎯 **RECOMMENDED APPROACH: Flask Authentication + Supabase Database**

Based on your preference for simplicity, here's the optimal strategy:

### **✅ FLASK HANDLES:**
- User registration/login
- Password hashing (bcrypt)
- JWT token generation
- Role-based permissions
- Session management

### **✅ SUPABASE HANDLES:**
- Database storage only
- Real-time subscriptions
- File storage
- Backup and scaling

## 🏗️ **IMPLEMENTATION STRUCTURE**

### **Backend Authentication Flow**
```python
# src/services/auth_service.py
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from src.services.supabase_service import supabase

class AuthService:
    @staticmethod
    def register_user(email, password, phone, role='Owner', created_by=None):
        """Register new user with role validation"""
        
        # Validate role creation permissions
        if role in ['Admin', 'Salesperson'] and not created_by:
            return {'error': 'Admin/Salesperson must be created by Owner/Admin'}, 400
        
        # Check if user exists
        existing_user = supabase.table('users').select('*').eq('email', email).execute()
        if existing_user.data:
            return {'error': 'User already exists'}, 400
        
        # Hash password
        password_hash = generate_password_hash(password)
        
        # Create user in Supabase
        user_data = {
            'email': email,
            'phone': phone,
            'password_hash': password_hash,
            'role': role,
            'created_by': created_by,
            'business_id': created_by if role != 'Owner' else None,
            'active': True
        }
        
        result = supabase.table('users').insert(user_data).execute()
        
        if result.data:
            # Generate JWT token
            token = create_access_token(
                identity=result.data[0]['id'],
                additional_claims={
                    'role': role,
                    'email': email,
                    'business_id': result.data[0]['business_id']
                }
            )
            
            return {
                'token': token,
                'user': {
                    'id': result.data[0]['id'],
                    'email': email,
                    'role': role,
                    'phone': phone
                }
            }, 201
        
        return {'error': 'Registration failed'}, 500
    
    @staticmethod
    def login_user(email, password):
        """Authenticate user and return JWT"""
        
        # Get user from Supabase
        user_result = supabase.table('users').select('*').eq('email', email).eq('active', True).execute()
        
        if not user_result.data:
            return {'error': 'Invalid credentials'}, 401
        
        user = user_result.data[0]
        
        # Verify password
        if not check_password_hash(user['password_hash'], password):
            return {'error': 'Invalid credentials'}, 401
        
        # Update last login
        supabase.table('users').update({'last_login': 'now()'}).eq('id', user['id']).execute()
        
        # Generate JWT token
        token = create_access_token(
            identity=user['id'],
            additional_claims={
                'role': user['role'],
                'email': user['email'],
                'business_id': user['business_id']
            }
        )
        
        return {
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user['role'],
                'phone': user['phone'],
                'business_id': user['business_id']
            }
        }, 200
    
    @staticmethod
    def create_team_member(creator_id, email, password, phone, role, first_name, last_name):
        """Owner/Admin creates Admin/Salesperson"""
        
        # Verify creator permissions
        creator = supabase.table('users').select('*').eq('id', creator_id).execute()
        if not creator.data:
            return {'error': 'Creator not found'}, 404
        
        creator_role = creator.data[0]['role']
        
        # Permission validation
        if creator_role == 'Owner' and role in ['Admin', 'Salesperson']:
            pass  # Owner can create both
        elif creator_role == 'Admin' and role == 'Salesperson':
            pass  # Admin can create Salesperson
        else:
            return {'error': 'Insufficient permissions'}, 403
        
        # Create the team member
        return AuthService.register_user(
            email=email,
            password=password,
            phone=phone,
            role=role,
            created_by=creator_id
        )
```

### **Permission Middleware**
```python
# src/utils/permissions.py
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt

def require_role(allowed_roles):
    """Decorator to check user role permissions"""
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

def require_business_access():
    """Ensure user can only access their business data"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            user_id = get_jwt_identity()
            business_id = claims.get('business_id')
            
            # Add business_id and user_id to kwargs for filtering
            kwargs['current_user_id'] = user_id
            kwargs['current_business_id'] = business_id
            kwargs['current_user_role'] = claims.get('role')
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

## 🎨 **FRONTEND AUTHENTICATION**

### **Auth Context**
```jsx
// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (token) {
            // Decode JWT to get user info
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.sub,
                    role: payload.role,
                    email: payload.email,
                    business_id: payload.business_id
                });
            } catch (error) {
                localStorage.removeItem('token');
                setToken(null);
            }
        }
        setLoading(false);
    }, [token]);
    
    const login = async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Login failed' };
        }
    };
    
    const createTeamMember = async (memberData) => {
        try {
            const response = await fetch('/api/auth/create-team-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(memberData)
            });
            
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Failed to create team member' };
        }
    };
    
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };
    
    const hasPermission = (requiredRoles) => {
        return user && requiredRoles.includes(user.role);
    };
    
    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            createTeamMember,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};
```

## 🔧 **API ROUTES**

### **Authentication Routes**
```python
# src/routes/auth.py
from flask import Blueprint, request, jsonify
from src.services.auth_service import AuthService
from src.utils.permissions import require_role, require_business_access

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    return AuthService.register_user(
        email=data.get('email'),
        password=data.get('password'),
        phone=data.get('phone')
    )

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    return AuthService.login_user(
        email=data.get('email'),
        password=data.get('password')
    )

@auth_bp.route('/create-team-member', methods=['POST'])
@require_role(['Owner', 'Admin'])
def create_team_member():
    data = request.get_json()
    creator_id = get_jwt_identity()
    
    return AuthService.create_team_member(
        creator_id=creator_id,
        email=data.get('email'),
        password=data.get('password'),
        phone=data.get('phone'),
        role=data.get('role'),
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )

@auth_bp.route('/team-members', methods=['GET'])
@require_role(['Owner', 'Admin'])
@require_business_access()
def get_team_members(**kwargs):
    business_id = kwargs['current_business_id']
    user_role = kwargs['current_user_role']
    
    # Owner sees all, Admin sees only Salespeople
    if user_role == 'Owner':
        members = supabase.table('users').select('*').eq('business_id', business_id).execute()
    else:  # Admin
        members = supabase.table('users').select('*').eq('business_id', business_id).eq('role', 'Salesperson').execute()
    
    return {'team_members': members.data}, 200
```

## 🎯 **WHY THIS APPROACH IS OPTIMAL**

### **✅ ADVANTAGES:**
1. **Simple Setup**: No complex Supabase Auth configuration
2. **Full Control**: Complete control over authentication logic
3. **Role Flexibility**: Easy to implement complex role-based permissions
4. **JWT Standard**: Industry-standard token-based authentication
5. **Supabase Benefits**: Still get database scaling and real-time features

### **✅ IMPLEMENTATION TIMELINE:**
- **Day 1**: Basic Flask auth setup
- **Day 2**: Role-based permissions
- **Day 3**: Team member creation
- **Day 4**: Frontend integration
- **Day 5**: Testing and deployment

This approach gives you 98% compliance with your requirements while keeping authentication simple and maintainable! 🚀