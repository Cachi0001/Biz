# Environment Configuration Test Guide

## What We've Fixed

### 1. Backend CORS Configuration
- ✅ Added dynamic CORS origin detection
- ✅ Support for both production and preview environments
- ✅ Wildcard support for Vercel preview URLs
- ✅ Added debug endpoint at `/debug/cors`

### 2. Frontend Environment Detection
- ✅ Created smart environment detection system
- ✅ Auto-detects dev-feature, production, and preview environments
- ✅ Proper API URL routing based on current environment
- ✅ Added environment testing utilities

### 3. Environment Files
- ✅ Updated `.env` to use dev-feature backend by default
- ✅ Created `.env.dev-feature` for preview environment
- ✅ Updated `.env.production` for production environment

## Current Configuration

### Production Environment
- **Frontend**: `https://sabiops.vercel.app`
- **Backend**: `https://sabiops-backend.vercel.app/api`

### Dev-Feature Environment (Preview)
- **Frontend**: `https://sabiops-frontend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app`
- **Backend**: `https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api`

### Local Development
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000` (via proxy)

## Testing Steps

### 1. Test Environment Detection
When you load the frontend, check the browser console for:
```
[DEBUG] Environment Configuration: {
  environment: 'dev-feature',
  apiBaseUrl: 'https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/api',
  isPreview: true
}
```

### 2. Test Backend Connectivity
The environment test will automatically run and show:
```
🧪 Running Environment Configuration Tests...
1. Environment Detection: ✅
2. Backend Connectivity Test: ✅
3. CORS Configuration Test: ✅
4. API Authentication Test: ✅
```

### 3. Manual Testing
You can also test manually by visiting these URLs:

**Health Check:**
- Dev-Feature: `https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/health`
- Production: `https://sabiops-backend.vercel.app/health`

**CORS Debug:**
- Dev-Feature: `https://sabiops-backend-git-dev-feature-onyemechicaleb4-7921s-projects.vercel.app/debug/cors`
- Production: `https://sabiops-backend.vercel.app/debug/cors`

## Deployment Workflow

### For Dev-Feature Testing:
1. Push changes to `dev-feature` branch
2. Vercel will automatically deploy both frontend and backend previews
3. Frontend will auto-detect and use the preview backend
4. Test functionality on the preview URLs

### For Production Deployment:
1. Merge `dev-feature` to `main` branch
2. Vercel will deploy to production URLs
3. Frontend will auto-detect and use production backend

## Troubleshooting

### If you see CORS errors:
1. Check the browser console for environment detection logs
2. Verify the backend is deployed and accessible
3. Check the CORS debug endpoint for allowed origins

### If API calls fail:
1. Check the environment test results in console
2. Verify the backend health endpoint is responding
3. Check network tab for actual request URLs

### If environment detection is wrong:
1. Clear browser cache and reload
2. Check the current URL matches expected patterns
3. Verify environment variables are set correctly

## Next Steps

1. **Push to dev-feature branch** - This will trigger Vercel deployments
2. **Test the preview URLs** - Verify CORS and API connectivity
3. **Run login/register flow** - Test authentication works
4. **Test CRUD operations** - Verify database operations work
5. **Monitor console logs** - Check for any remaining issues

The system is now configured to automatically handle environment switching, so you can work on dev-feature branch for testing and merge to main for production without manual configuration changes.