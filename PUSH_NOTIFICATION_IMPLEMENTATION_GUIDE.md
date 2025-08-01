# Push Notification Device Token Implementation Guide

## Overview

This guide provides complete implementation for adding push notification device token functionality to your SabiOps application. The implementation includes database schema, backend API endpoints, and frontend integration.

## 🗄️ Database Schema

### Quick Setup (Run in Supabase SQL Editor)

```sql
-- Simple Push Subscriptions Table for Immediate Use
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(50) DEFAULT 'web',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint (if users table exists)
ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_subscriptions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_token ON push_subscriptions(token);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (users can only access their own tokens)
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);
```

### Full Schema (For Complete Implementation)

For the complete database schema with notification preferences, history, and analytics, use the file:
`Biz/backend/sabiops-backend/database_migrations/add_push_notification_tables.sql`

## 🔧 Backend Implementation

### API Endpoints

The following endpoints are now available:

1. **Register Device Token**
   - `POST /api/push-notifications/register-token`
   - Body: `{ "token": "device_token", "device_type": "web", "device_info": {} }`

2. **Get User Tokens**
   - `GET /api/push-notifications/tokens`

3. **Remove Device Token**
   - `DELETE /api/push-notifications/tokens/{token_id}`

4. **Send Test Notification**
   - `POST /api/push-notifications/test`

5. **Get/Update Notification Preferences**
   - `GET /api/push-notifications/preferences`
   - `PUT /api/push-notifications/preferences`

6. **Get Notification History**
   - `GET /api/push-notifications/history?page=1&limit=20`

### Files Created/Updated

1. **New API Routes**: `Biz/backend/sabiops-backend/src/routes/push_notifications.py`
2. **Updated Main App**: `Biz/backend/sabiops-backend/api/index.py` (registered new blueprint)
3. **Updated Supabase Service**: Already configured to use `token` column

## 🌐 Frontend Implementation

### JavaScript Service

Use the `PushNotificationService` class for all push notification operations:

```javascript
import PushNotificationService from '../services/PushNotificationService';

// Register a device token
await PushNotificationService.registerDeviceToken('your_token_here', 'web');

// Send test notification
await PushNotificationService.sendTestNotification();

// Get user's registered devices
const tokens = await PushNotificationService.getUserTokens();
```

### React Component

A complete React component is available at:
`Biz/frontend/sabiops-frontend/src/components/PushNotificationManager.jsx`

## 🚀 Quick Start Guide

### 1. Set Up Database

Run the simple SQL schema in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(50) DEFAULT 'web',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);
```

### 2. Test the API

Use curl or Postman to test the endpoints:

```bash
# Register a device token
curl -X POST http://localhost:5000/api/push-notifications/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"token": "test_token_123", "device_type": "web"}'

# Get user tokens
curl -X GET http://localhost:5000/api/push-notifications/tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test notification
curl -X POST http://localhost:5000/api/push-notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Frontend Integration

Add the PushNotificationManager component to your settings page:

```jsx
import PushNotificationManager from '../components/PushNotificationManager';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <PushNotificationManager />
    </div>
  );
}
```

## 🔥 Firebase Setup (For Real Push Notifications)

### 1. Firebase Configuration

Create a Firebase project and add these environment variables:

```env
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
REACT_APP_FIREBASE_VAPID_KEY=your-vapid-key
```

### 2. Frontend Firebase Setup

Install Firebase SDK:

```bash
npm install firebase
```

Initialize Firebase in your app:

```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
```

### 3. Service Worker

Create `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  // Your Firebase config
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

## 🧪 Testing

### Backend Tests

Test the API endpoints:

```bash
cd Biz/backend/sabiops-backend
python test_error_fixes.py
```

### Frontend Tests

Test the push notification service:

```javascript
// In your browser console
import PushNotificationService from './services/PushNotificationService';

// Test registration
PushNotificationService.registerDeviceToken('test_token', 'web')
  .then(result => console.log('Registration successful:', result))
  .catch(error => console.error('Registration failed:', error));
```

## 📊 Monitoring and Analytics

### Database Queries for Monitoring

```sql
-- Get total active tokens
SELECT COUNT(*) as active_tokens FROM push_subscriptions WHERE is_active = true;

-- Get tokens by device type
SELECT device_type, COUNT(*) as count 
FROM push_subscriptions 
WHERE is_active = true 
GROUP BY device_type;

-- Get recent registrations
SELECT * FROM push_subscriptions 
WHERE created_at > NOW() - INTERVAL '7 days' 
ORDER BY created_at DESC;
```

### Cleanup Old Tokens

```sql
-- Remove tokens older than 90 days
DELETE FROM push_subscriptions 
WHERE updated_at < NOW() - INTERVAL '90 days' 
OR is_active = false;
```

## 🔒 Security Considerations

1. **Row Level Security**: Enabled on all tables
2. **Token Validation**: Validate tokens before storing
3. **Rate Limiting**: Consider adding rate limits to registration endpoints
4. **Token Expiry**: Implement automatic cleanup of expired tokens
5. **User Permissions**: Only users can manage their own tokens

## 🚨 Error Handling

The implementation includes comprehensive error handling:

- Graceful fallbacks when tables don't exist
- Proper error messages for invalid requests
- Logging for debugging and monitoring
- Retry mechanisms for failed notifications

## 📝 Next Steps

1. **Run the database migration** to create the push_subscriptions table
2. **Test the API endpoints** with your authentication system
3. **Integrate the frontend components** into your existing UI
4. **Set up Firebase** for real push notifications
5. **Configure monitoring** and analytics
6. **Test end-to-end** push notification flow

## 🆘 Troubleshooting

### Common Issues

1. **404 on endpoints**: Ensure the push_notifications blueprint is registered
2. **Database errors**: Check if the push_subscriptions table exists
3. **Permission denied**: Verify RLS policies are correctly set up
4. **Token registration fails**: Check JWT authentication is working
5. **No notifications received**: Verify Firebase configuration and service worker

### Debug Commands

```bash
# Check if table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'push_subscriptions';

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'push_subscriptions';

# Test API endpoint
curl -X GET http://localhost:5000/api/push-notifications/tokens -H "Authorization: Bearer YOUR_TOKEN"
```

---

This implementation provides a solid foundation for push notifications in your SabiOps application. Start with the simple setup and gradually add more features as needed.