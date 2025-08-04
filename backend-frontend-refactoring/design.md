# Design Document

## Overview

This design outlines a comprehensive refactoring strategy for the SabiOps application to address performance bottlenecks, code organization issues, and maintainability concerns. The refactoring will follow clean architecture principles with loose coupling, comprehensive naming conventions, and a feature-based organization structure.

### Current Architecture Issues Identified

1. **Backend Issues:**
   - Monolithic route files with mixed concerns
   - Duplicate service implementations (multiple notification services)
   - Inconsistent error handling patterns
   - Heavy coupling between routes and database operations
   - Slow authentication due to inefficient JWT handling
   - Multiple similar services (analytics_service.py, analytics_cache_service.py)

2. **Frontend Issues:**
   - Large components (Dashboard.jsx > 500 lines)
   - Duplicate API service files (api.js, apiClient.js, enhancedApi.js, optimizedApi.js)
   - Inconsistent state management patterns
   - Multiple similar utility files
   - Heavy component re-renders causing performance issues

## Architecture

### Backend Architecture (Clean Architecture + Domain-Driven Design)

```
src/
├── core/                           # Core business logic (domain layer)
│   ├── entities/                   # Business entities
│   │   ├── user_entity.py
│   │   ├── invoice_entity.py
│   │   ├── product_entity.py
│   │   └── subscription_entity.py
│   ├── use_cases/                  # Application business rules
│   │   ├── user/
│   │   │   ├── create_user_use_case.py
│   │   │   ├── authenticate_user_use_case.py
│   │   │   └── update_user_profile_use_case.py
│   │   ├── invoice/
│   │   │   ├── create_invoice_use_case.py
│   │   │   ├── calculate_invoice_totals_use_case.py
│   │   │   └── generate_invoice_pdf_use_case.py
│   │   └── subscription/
│   │       ├── upgrade_subscription_use_case.py
│   │       └── track_usage_use_case.py
│   └── interfaces/                 # Abstract interfaces
│       ├── repositories/
│       │   ├── user_repository_interface.py
│       │   ├── invoice_repository_interface.py
│       │   └── product_repository_interface.py
│       └── services/
│           ├── email_service_interface.py
│           ├── payment_service_interface.py
│           └── notification_service_interface.py
├── infrastructure/                 # External concerns (frameworks & drivers)
│   ├── database/
│   │   ├── repositories/           # Concrete repository implementations
│   │   │   ├── supabase_user_repository.py
│   │   │   ├── supabase_invoice_repository.py
│   │   │   └── sqlite_fallback_repository.py
│   │   ├── models/                 # Database models/schemas
│   │   │   ├── user_model.py
│   │   │   ├── invoice_model.py
│   │   │   └── product_model.py
│   │   └── connection/
│   │       ├── supabase_client.py
│   │       └── database_factory.py
│   ├── external_services/          # Third-party service implementations
│   │   ├── paystack_payment_service.py
│   │   ├── sendgrid_email_service.py
│   │   ├── firebase_notification_service.py
│   │   └── cloudinary_file_service.py
│   ├── web/                        # Web framework layer
│   │   ├── controllers/            # HTTP request handlers
│   │   │   ├── auth_controller.py
│   │   │   ├── invoice_controller.py
│   │   │   ├── product_controller.py
│   │   │   └── subscription_controller.py
│   │   ├── middleware/
│   │   │   ├── authentication_middleware.py
│   │   │   ├── rate_limiting_middleware.py
│   │   │   ├── error_handling_middleware.py
│   │   │   └── request_validation_middleware.py
│   │   ├── serializers/            # Request/Response serialization
│   │   │   ├── user_serializer.py
│   │   │   ├── invoice_serializer.py
│   │   │   └── product_serializer.py
│   │   └── routes/                 # Route definitions
│   │       ├── auth_routes.py
│   │       ├── invoice_routes.py
│   │       └── product_routes.py
│   └── config/
│       ├── dependency_injection.py # DI container
│       ├── environment_config.py
│       └── logging_config.py
├── shared/                         # Shared utilities and common code
│   ├── exceptions/
│   │   ├── business_exceptions.py
│   │   ├── validation_exceptions.py
│   │   └── infrastructure_exceptions.py
│   ├── validators/
│   │   ├── email_validator.py
│   │   ├── phone_validator.py
│   │   └── business_rule_validator.py
│   ├── utils/
│   │   ├── date_time_utils.py
│   │   ├── encryption_utils.py
│   │   └── formatting_utils.py
│   └── constants/
│       ├── error_messages.py
│       ├── business_constants.py
│       └── api_constants.py
└── app.py                          # Application entry point
```

### Frontend Architecture (Feature-Based + Atomic Design)

```
src/
├── features/                       # Feature-based organization
│   ├── authentication/
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ForgotPasswordForm.jsx
│   │   ├── hooks/
│   │   │   ├── useAuthentication.js
│   │   │   └── usePasswordReset.js
│   │   ├── services/
│   │   │   └── authenticationService.js
│   │   ├── types/
│   │   │   └── authTypes.ts
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       └── ForgotPasswordPage.jsx
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── DashboardOverview.jsx
│   │   │   ├── QuickActionsPanel.jsx
│   │   │   ├── RecentActivitiesWidget.jsx
│   │   │   └── UsageMetricsCard.jsx
│   │   ├── hooks/
│   │   │   ├── useDashboardData.js
│   │   │   └── useRealTimeUpdates.js
│   │   ├── services/
│   │   │   └── dashboardService.js
│   │   └── pages/
│   │       └── DashboardPage.jsx
│   ├── invoicing/
│   │   ├── components/
│   │   │   ├── InvoiceForm.jsx
│   │   │   ├── InvoiceList.jsx
│   │   │   ├── InvoicePreview.jsx
│   │   │   └── InvoiceStatusBadge.jsx
│   │   ├── hooks/
│   │   │   ├── useInvoiceManagement.js
│   │   │   └── useInvoiceCalculations.js
│   │   ├── services/
│   │   │   └── invoiceService.js
│   │   ├── utils/
│   │   │   ├── invoiceCalculations.js
│   │   │   └── invoiceValidation.js
│   │   └── pages/
│   │       ├── InvoicesPage.jsx
│   │       └── CreateInvoicePage.jsx
│   └── subscription/
│       ├── components/
│       │   ├── SubscriptionStatus.jsx
│       │   ├── UsageLimitIndicator.jsx
│       │   └── UpgradePrompt.jsx
│       ├── hooks/
│       │   ├── useSubscriptionStatus.js
│       │   └── useUsageTracking.js
│       ├── services/
│       │   └── subscriptionService.js
│       └── pages/
│           └── SubscriptionUpgradePage.jsx
├── shared/                         # Shared components and utilities
│   ├── components/                 # Atomic design system
│   │   ├── atoms/                  # Basic building blocks
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Label.jsx
│   │   │   └── Spinner.jsx
│   │   ├── molecules/              # Simple component combinations
│   │   │   ├── FormField.jsx
│   │   │   ├── SearchBox.jsx
│   │   │   ├── DataTable.jsx
│   │   │   └── ConfirmationDialog.jsx
│   │   ├── organisms/              # Complex component combinations
│   │   │   ├── NavigationHeader.jsx
│   │   │   ├── DataGrid.jsx
│   │   │   └── FormWizard.jsx
│   │   └── templates/              # Page-level layouts
│   │       ├── AuthLayout.jsx
│   │       ├── DashboardLayout.jsx
│   │       └── SettingsLayout.jsx
│   ├── hooks/                      # Reusable custom hooks
│   │   ├── useApiClient.js
│   │   ├── useFormValidation.js
│   │   ├── useLocalStorage.js
│   │   └── useDebounce.js
│   ├── services/                   # Core services
│   │   ├── apiClient.js            # Single unified API client
│   │   ├── errorHandler.js
│   │   ├── cacheManager.js
│   │   └── eventBus.js
│   ├── utils/                      # Utility functions
│   │   ├── dateUtils.js
│   │   ├── formatUtils.js
│   │   ├── validationUtils.js
│   │   └── performanceUtils.js
│   ├── constants/
│   │   ├── apiEndpoints.js
│   │   ├── errorMessages.js
│   │   └── appConstants.js
│   └── types/                      # TypeScript type definitions
│       ├── apiTypes.ts
│       ├── userTypes.ts
│       └── commonTypes.ts
├── contexts/                       # React contexts
│   ├── AuthContext.jsx
│   ├── ThemeContext.jsx
│   └── NotificationContext.jsx
└── App.jsx                         # Application root
```

## Components and Interfaces

### Backend Core Interfaces

#### Repository Pattern
```python
# core/interfaces/repositories/user_repository_interface.py
from abc import ABC, abstractmethod
from typing import Optional, List
from core.entities.user_entity import UserEntity

class UserRepositoryInterface(ABC):
    @abstractmethod
    async def create_user(self, user: UserEntity) -> UserEntity:
        pass
    
    @abstractmethod
    async def find_user_by_email(self, email: str) -> Optional[UserEntity]:
        pass
    
    @abstractmethod
    async def update_user(self, user_id: str, updates: dict) -> UserEntity:
        pass
```

#### Use Case Pattern
```python
# core/use_cases/user/authenticate_user_use_case.py
from core.interfaces.repositories.user_repository_interface import UserRepositoryInterface
from core.interfaces.services.encryption_service_interface import EncryptionServiceInterface
from shared.exceptions.business_exceptions import AuthenticationFailedException

class AuthenticateUserUseCase:
    def __init__(
        self, 
        user_repository: UserRepositoryInterface,
        encryption_service: EncryptionServiceInterface
    ):
        self._user_repository = user_repository
        self._encryption_service = encryption_service
    
    async def execute(self, email: str, password: str) -> dict:
        user = await self._user_repository.find_user_by_email(email)
        if not user or not self._encryption_service.verify_password(password, user.password_hash):
            raise AuthenticationFailedException("Invalid credentials")
        
        return {
            "user_id": user.id,
            "email": user.email,
            "access_token": self._encryption_service.generate_jwt_token(user.id)
        }
```

### Frontend Component Architecture

#### Atomic Components
```jsx
// shared/components/atoms/Button.jsx
import React from 'react';
import { cn } from '../../utils/classNames';

const Button = React.forwardRef(({ 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  children, 
  className, 
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  };
  
  const sizes = {
    small: 'h-9 px-3 text-sm',
    medium: 'h-10 px-4 py-2',
    large: 'h-11 px-8'
  };

  return (
    <button
      ref={ref}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export { Button };
```

#### Feature-Based Service
```javascript
// features/authentication/services/authenticationService.js
import { apiClient } from '../../../shared/services/apiClient';
import { AuthenticationError, ValidationError } from '../../../shared/exceptions/clientExceptions';

class AuthenticationService {
  async authenticateUser(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (error.status === 401) {
        throw new AuthenticationError('Invalid credentials');
      }
      if (error.status === 422) {
        throw new ValidationError('Invalid input data', error.data.errors);
      }
      throw error;
    }
  }

  async registerUser(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.status === 409) {
        throw new ValidationError('User already exists');
      }
      throw error;
    }
  }

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  }
}

export const authenticationService = new AuthenticationService();
```

## Data Models

### Backend Entity Models
```python
# core/entities/user_entity.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class SubscriptionPlan(Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"

@dataclass
class UserEntity:
    id: str
    email: str
    full_name: str
    business_name: Optional[str]
    phone: Optional[str]
    role: UserRole
    subscription_plan: SubscriptionPlan
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    email_verified: bool = False
    
    def is_subscription_active(self) -> bool:
        return self.subscription_plan != SubscriptionPlan.FREE
    
    def can_access_feature(self, feature: str) -> bool:
        # Business logic for feature access
        feature_permissions = {
            SubscriptionPlan.FREE: ['basic_invoicing', 'basic_products'],
            SubscriptionPlan.BASIC: ['advanced_invoicing', 'analytics', 'team_management'],
            SubscriptionPlan.PREMIUM: ['all_features']
        }
        return feature in feature_permissions.get(self.subscription_plan, [])
```

### Frontend Type Definitions
```typescript
// shared/types/userTypes.ts
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  businessName?: string;
  phone?: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  emailVerified: boolean;
}

export interface AuthenticationState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  businessName?: string;
  phone?: string;
}
```

## Error Handling

### Backend Error Handling Strategy
```python
# shared/exceptions/business_exceptions.py
class BusinessException(Exception):
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class ValidationException(BusinessException):
    def __init__(self, message: str, field_errors: dict = None):
        super().__init__(message, "VALIDATION_ERROR")
        self.field_errors = field_errors or {}

class AuthenticationFailedException(BusinessException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "AUTH_FAILED")

class AuthorizationFailedException(BusinessException):
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, "ACCESS_DENIED")

# infrastructure/web/middleware/error_handling_middleware.py
from flask import jsonify
from shared.exceptions.business_exceptions import BusinessException, ValidationException

def handle_business_exception(error: BusinessException):
    response = {
        "success": False,
        "error": {
            "code": error.error_code,
            "message": error.message
        }
    }
    
    if isinstance(error, ValidationException):
        response["error"]["field_errors"] = error.field_errors
        return jsonify(response), 422
    
    return jsonify(response), 400

def register_error_handlers(app):
    app.register_error_handler(BusinessException, handle_business_exception)
```

### Frontend Error Handling
```javascript
// shared/services/errorHandler.js
import { toast } from '../components/ui/toast';

export class ClientError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ClientError';
  }
}

export class ValidationError extends ClientError {
  constructor(message, fieldErrors = {}) {
    super(message, 'VALIDATION_ERROR', 422);
    this.fieldErrors = fieldErrors;
  }
}

export class AuthenticationError extends ClientError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_FAILED', 401);
  }
}

export const errorHandler = {
  handleApiError(error) {
    if (error.status === 401) {
      // Handle authentication errors
      this.handleAuthenticationError(error);
    } else if (error.status === 422) {
      // Handle validation errors
      this.handleValidationError(error);
    } else if (error.status >= 500) {
      // Handle server errors
      this.handleServerError(error);
    } else {
      // Handle other client errors
      this.handleClientError(error);
    }
  },

  handleAuthenticationError(error) {
    toast.error('Session expired. Please log in again.');
    // Redirect to login
    window.location.href = '/login';
  },

  handleValidationError(error) {
    const message = error.data?.message || 'Please check your input and try again.';
    toast.error(message);
  },

  handleServerError(error) {
    toast.error('Something went wrong. Please try again later.');
    // Log error for monitoring
    console.error('Server error:', error);
  },

  handleClientError(error) {
    const message = error.data?.message || 'An error occurred. Please try again.';
    toast.error(message);
  }
};
```

## Testing Strategy

### Backend Testing Architecture
```python
# tests/unit/use_cases/test_authenticate_user_use_case.py
import pytest
from unittest.mock import Mock, AsyncMock
from core.use_cases.user.authenticate_user_use_case import AuthenticateUserUseCase
from core.entities.user_entity import UserEntity
from shared.exceptions.business_exceptions import AuthenticationFailedException

class TestAuthenticateUserUseCase:
    @pytest.fixture
    def mock_user_repository(self):
        return Mock()
    
    @pytest.fixture
    def mock_encryption_service(self):
        return Mock()
    
    @pytest.fixture
    def use_case(self, mock_user_repository, mock_encryption_service):
        return AuthenticateUserUseCase(mock_user_repository, mock_encryption_service)
    
    @pytest.mark.asyncio
    async def test_successful_authentication(self, use_case, mock_user_repository, mock_encryption_service):
        # Arrange
        user = UserEntity(id="123", email="test@example.com", password_hash="hashed")
        mock_user_repository.find_user_by_email = AsyncMock(return_value=user)
        mock_encryption_service.verify_password.return_value = True
        mock_encryption_service.generate_jwt_token.return_value = "jwt_token"
        
        # Act
        result = await use_case.execute("test@example.com", "password")
        
        # Assert
        assert result["user_id"] == "123"
        assert result["access_token"] == "jwt_token"
        mock_user_repository.find_user_by_email.assert_called_once_with("test@example.com")
```

### Frontend Testing Strategy
```javascript
// features/authentication/components/__tests__/LoginForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { authenticationService } from '../../services/authenticationService';

jest.mock('../../services/authenticationService');

describe('LoginForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with email and password fields', () => {
    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should call authentication service on form submission', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    authenticationService.authenticateUser.mockResolvedValue({ user: mockUser });

    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authenticationService.authenticateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockOnSuccess).toHaveBeenCalledWith({ user: mockUser });
    });
  });
});
```

## Performance Optimizations

### Backend Performance Strategy
1. **Database Query Optimization**
   - Implement query result caching with Redis
   - Use database connection pooling
   - Optimize N+1 query problems with eager loading
   - Implement database indexing strategy

2. **API Response Optimization**
   - Implement response compression
   - Use pagination for large datasets
   - Implement field selection (GraphQL-style)
   - Cache frequently accessed data

3. **Authentication Optimization**
   - Implement JWT token caching
   - Use refresh token rotation
   - Optimize password hashing with appropriate rounds

### Frontend Performance Strategy
1. **Code Splitting and Lazy Loading**
   - Implement route-based code splitting
   - Lazy load heavy components
   - Use React.Suspense for loading states

2. **State Management Optimization**
   - Implement proper memoization with React.memo
   - Use useMemo and useCallback appropriately
   - Optimize context providers to prevent unnecessary re-renders

3. **API Call Optimization**
   - Implement request deduplication
   - Use SWR or React Query for caching
   - Implement optimistic updates

## Migration Strategy

### Phase 1: Backend Infrastructure Setup
1. Set up new clean architecture structure
2. Implement dependency injection container
3. Create core interfaces and entities
4. Set up comprehensive error handling

### Phase 2: Backend Service Migration
1. Migrate authentication services
2. Migrate CRUD operations with optimized queries
3. Consolidate duplicate services
4. Implement comprehensive testing

### Phase 3: Frontend Architecture Setup
1. Set up feature-based folder structure
2. Create atomic design system components
3. Implement unified API client
4. Set up error handling and state management

### Phase 4: Frontend Component Migration
1. Break down large components into smaller ones
2. Migrate to feature-based organization
3. Implement performance optimizations
4. Add comprehensive testing

### Phase 5: Testing and Deployment
1. Set up dev-feature branch workflow
2. Implement Vercel preview deployments
3. Performance testing and monitoring
4. Gradual rollout with feature flags