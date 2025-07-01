# Bizflow SME Nigeria - Frontend Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: 500 Internal Server Errors on Component Loading

**Symptoms:**
```
GET http://localhost:5173/src/contexts/AuthContext.jsx net::ERR_ABORTED 500 (Internal Server Error)
GET http://localhost:5173/src/components/ui/button.jsx net::ERR_ABORTED 500 (Internal Server Error)
```

**Root Causes:**
1. **Node.js Version Mismatch**: Different Node.js versions can cause module resolution issues
2. **Package Manager Conflicts**: Mixing npm, yarn, and pnpm can cause dependency conflicts
3. **Cache Issues**: Stale cache can cause import resolution problems
4. **Path Resolution**: Windows vs Unix path differences

**Solutions:**

#### Solution 1: Complete Clean Install
```bash
# Delete all cache and dependencies
rm -rf node_modules
rm -rf package-lock.json
rm -rf pnpm-lock.yaml
rm -rf yarn.lock

# Clear npm cache
npm cache clean --force

# Reinstall with npm only
npm install

# Start with forced cache clearing
npm run dev -- --force
```

#### Solution 2: Use Specific Node.js Version
```bash
# Check your Node.js version
node --version

# Recommended: Use Node.js 18.x or 20.x
# If using nvm:
nvm install 18
nvm use 18

# Reinstall dependencies
npm install
```

#### Solution 3: Fix Path Resolution Issues
Create or update `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
```

### Issue 2: Import Resolution Errors

**Symptoms:**
```
Failed to resolve import "@/lib/utils" from "src/components/ui/textarea.jsx"
```

**Solutions:**

#### Solution 1: Update jsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
```

#### Solution 2: Use Relative Imports (Fallback)
If path aliases don't work, update components to use relative imports:

**Before:**
```javascript
import { cn } from "@/lib/utils"
```

**After:**
```javascript
import { cn } from "../../lib/utils"
```

### Issue 3: Dependency Conflicts

**Symptoms:**
```
npm error ERESOLVE unable to resolve dependency tree
```

**Solutions:**

#### Solution 1: Use Legacy Peer Deps
```bash
npm install --legacy-peer-deps
```

#### Solution 2: Force Resolution
```bash
npm install --force
```

#### Solution 3: Use Exact Versions
Update `package.json` with exact versions:
```json
{
  "dependencies": {
    "react": "18.0.0",
    "react-dom": "18.0.0",
    "date-fns": "3.6.0"
  }
}
```

### Issue 4: Windows-Specific Issues

**Solutions:**

#### Solution 1: Use PowerShell as Administrator
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Solution 2: Use WSL (Windows Subsystem for Linux)
```bash
# Install WSL and run the project in Linux environment
wsl --install
# Then run all commands in WSL terminal
```

#### Solution 3: Use Git Bash
Use Git Bash instead of Command Prompt or PowerShell for better Unix compatibility.

## 🔧 Environment Setup Verification

### Check Your Environment
```bash
# Check Node.js version (should be 18.x or 20.x)
node --version

# Check npm version
npm --version

# Check if you're in the correct directory
pwd
ls -la

# Verify package.json exists
cat package.json | grep "name"
```

### Verify Dependencies
```bash
# Check if all required dependencies are installed
npm list react react-dom vite @vitejs/plugin-react

# Check for peer dependency warnings
npm install --dry-run
```

## 🚀 Step-by-Step Recovery Process

### Step 1: Environment Check
```bash
# Ensure you're in the frontend directory
cd frontend/bizflow-frontend

# Check Node.js version
node --version
```

### Step 2: Complete Clean
```bash
# Remove all dependencies and cache
rm -rf node_modules package-lock.json pnpm-lock.yaml
npm cache clean --force
```

### Step 3: Fresh Install
```bash
# Install dependencies
npm install

# If that fails, try with legacy peer deps
npm install --legacy-peer-deps
```

### Step 4: Start Development Server
```bash
# Start with cache clearing
npm run dev -- --force

# If that fails, try without force
npm run dev
```

### Step 5: Test Build
```bash
# Test production build
npm run build

# If build succeeds, try preview
npm run preview
```

## 🔍 Debugging Commands

### Check File Structure
```bash
# Verify all required files exist
ls -la src/lib/utils.js
ls -la src/components/ui/
ls -la src/contexts/AuthContext.jsx
```

### Check Import Syntax
```bash
# Verify no syntax errors in key files
node -c src/lib/utils.js
node -c src/components/ui/button.jsx
```

### Check Vite Configuration
```bash
# Verify vite config is valid
npx vite --help
```

## 📱 Alternative Setup Methods

### Method 1: Use Create React App (Fallback)
If Vite continues to have issues:
```bash
npx create-react-app bizflow-frontend-backup
# Then manually copy src files
```

### Method 2: Use Different Package Manager
```bash
# Try with yarn
yarn install
yarn dev

# Or try with pnpm
pnpm install
pnpm dev
```

## 🎯 User Capacity Estimation

Based on the current architecture:

### **Small Scale (0-100 users)**
- **Frontend**: Can handle unlimited concurrent users (static files)
- **Backend**: 50-100 concurrent users with current Flask setup
- **Database**: SQLite suitable for development, MySQL for production
- **Hosting**: Vercel free tier sufficient

### **Medium Scale (100-1,000 users)**
- **Frontend**: No limitations (CDN-served static files)
- **Backend**: Requires horizontal scaling (multiple Flask instances)
- **Database**: MySQL with connection pooling required
- **Hosting**: Vercel Pro plan recommended

### **Large Scale (1,000+ users)**
- **Frontend**: Global CDN distribution (Vercel handles this automatically)
- **Backend**: Microservices architecture with load balancing
- **Database**: MySQL cluster or PostgreSQL with read replicas
- **Hosting**: Enterprise hosting solutions

### **Performance Optimizations Implemented**
- ✅ Code splitting and lazy loading
- ✅ Bundle optimization with Vite
- ✅ Image optimization with Cloudinary
- ✅ Efficient state management
- ✅ Responsive design for mobile performance

### **Scalability Bottlenecks**
1. **Backend API**: Single Flask instance limitation
2. **Database**: SQLite not suitable for production
3. **File Storage**: Local storage vs Cloudinary
4. **Session Management**: In-memory vs Redis

### **Recommended Production Setup**
- **Frontend**: Vercel (unlimited scaling)
- **Backend**: Multiple Flask instances behind load balancer
- **Database**: MySQL with connection pooling
- **Cache**: Redis for session management
- **Monitoring**: Application performance monitoring

## 📞 Support

If issues persist after following this guide:

1. **Check Node.js version**: Use 18.x or 20.x
2. **Try different terminal**: Use Git Bash on Windows
3. **Clear all caches**: Browser, npm, and system
4. **Use WSL on Windows**: For better compatibility
5. **Check antivirus**: May block file operations

The frontend is production-ready and can scale to handle thousands of users with proper backend infrastructure.

