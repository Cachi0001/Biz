# Bizflow SME Nigeria - Frontend Troubleshooting Guide (Updated)

## 🚨 Critical Issue: `axios` Import Error (Failed to resolve import)

**Symptoms:**
```
Error: The following dependencies are imported but could not be resolved:
  axios (imported by /home/ubuntu/Biz/frontend/bizflow-frontend/src/lib/api.js)
Are they installed?
```
This error indicates that your development environment (Vite) cannot find the `axios` package, even if it appears to be listed in your `package.json` or you've attempted to install it. This is often due to corrupted `node_modules`, package manager cache issues, or Node.js version conflicts.

**Solutions: Perform a Deep Clean and Reinstallation**

This is the most critical step. You need to ensure your local environment is completely clean before reinstalling dependencies. Follow these steps precisely:

### Step 1: Verify Your Current Directory

First, ensure you are in the correct directory. Open your terminal or command prompt and navigate to the `frontend/bizflow-frontend` directory within your cloned `Biz` project.

```bash
# Example: If your 'Biz' folder is in your home directory
cd ~/Biz/frontend/bizflow-frontend

# Verify you are in the correct directory
pwd # (on Linux/macOS)
# or
cd # (on Windows, then check the path displayed)

# List contents to confirm package.json is present
ls -la
```

### Step 2: Verify Node.js Version

Ensure you are using a compatible Node.js version. Bizflow is developed and tested with Node.js **v18.x** or **v20.x**. Using other versions (especially older ones) can lead to unexpected issues.

```bash
node --version
# Expected output: v18.x.x or v20.x.x

# If your version is different, consider using nvm (Node Version Manager) to switch:
# Install nvm (if you haven't already): https://github.com/nvm-sh/nvm#installing-and-updating
# nvm install 18 # or nvm install 20
# nvm use 18 # or nvm use 20
```

### Step 3: Perform a Comprehensive Clean-up

This step removes all existing dependencies, caches, and lock files to ensure a fresh start. **Execute these commands in the `frontend/bizflow-frontend` directory.**

```bash
# 1. Stop any running development servers (Ctrl+C in the terminal where it's running)

# 2. Delete node_modules directory
rm -rf node_modules

# 3. Delete package-lock.json (npm's lock file)
rm -rf package-lock.json

# 4. Delete yarn.lock (if you've ever used yarn)
rm -rf yarn.lock

# 5. Delete pnpm-lock.yaml (if you've ever used pnpm)
rm -rf pnpm-lock.yaml

# 6. Clear npm cache (this is crucial!)
npm cache clean --force

# 7. Clear Vite cache (if it exists)
rm -rf .vite
```

### Step 4: Reinstall Dependencies

After the deep clean, reinstall all dependencies using `npm`.

```bash
npm install

# If the above command fails or gives warnings, try with --legacy-peer-deps
# npm install --legacy-peer-deps
```

### Step 5: Run the Development Server

Now, try starting the development server. Use the `--force` flag with Vite to ensure it re-optimizes dependencies from scratch.

```bash
npm run dev -- --force
```

### Step 6: Verify in Browser

Open your browser and navigate to the URL provided by Vite (e.g., `http://localhost:5173/`). Check the browser console (usually F12 -> Console tab) for any errors.

## 🚨 Common Issues and Solutions (Revisited)

### Issue 1: 500 Internal Server Errors on Component Loading

**Symptoms:**
```
GET http://localhost:5173/src/contexts/AuthContext.jsx net::ERR_ABORTED 500 (Internal Server Error)
```

**Root Causes:**
-   **Node.js Version Mismatch**: Different Node.js versions can cause module resolution issues.
-   **Package Manager Conflicts**: Mixing npm, yarn, and pnpm can cause dependency conflicts.
-   **Cache Issues**: Stale cache can cause import resolution problems.
-   **Path Resolution**: Windows vs Unix path differences.

**Solutions:** (Covered in Deep Clean above)

#### Solution: Update `vite.config.js` for Path Aliases
Ensure your `vite.config.js` has the correct path alias configuration. This should already be in your project from my previous pushes.

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

### Issue 2: Import Resolution Errors (e.g., `@/lib/utils`)

**Symptoms:**
```
Failed to resolve import "@/lib/utils" from "src/components/ui/textarea.jsx"
```

**Solutions:**

#### Solution 1: Update `jsconfig.json`
Ensure your `jsconfig.json` is correctly configured for path mapping. This should also be in your project.

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

#### Solution 2: Verify `src/lib` Directory and Files

Crucially, ensure that the `src/lib` directory and its contents (`api.js`, `utils.js`) are present in your local `frontend/bizflow-frontend/src/` directory. I have pushed these files to your GitHub repository. You must `git pull origin main` to get them.

```bash
# After navigating to frontend/bizflow-frontend/src/
ls -la lib/
# You should see api.js and utils.js listed here
```

#### Solution 3: Use Relative Imports (Fallback - if path aliases still fail)
If path aliases (`@/`) continue to cause issues after all other steps, you can temporarily modify the imports in your components to use relative paths. This is a less ideal solution but can help isolate the problem.

**Example (for `textarea.jsx`):**

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
Update `package.json` with exact versions (less common, but can resolve specific conflicts):
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
npm list react react-dom vite @vitejs/plugin-react axios

# Check for peer dependency warnings
npm install --dry-run
```

## 🚀 Step-by-Step Recovery Process (Consolidated)

### Step 1: Get Latest Code
```bash
# Navigate to your Biz project root directory
cd ~/Biz # or wherever your Biz folder is

# Pull the latest changes from GitHub
git pull origin main
```

### Step 2: Environment Check
```bash
# Navigate to the frontend directory
cd frontend/bizflow-frontend

# Check Node.js version
node --version
```

### Step 3: Complete Deep Clean
```bash
# Remove all dependencies and cache
rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml
npm cache clean --force
rm -rf .vite
```

### Step 4: Fresh Install
```bash
# Install dependencies
npm install

# If that fails, try with legacy peer deps
npm install --legacy-peer-deps
```

### Step 5: Start Development Server
```bash
# Start with cache clearing
npm run dev -- --force

# If that fails, try without force
npm run dev
```

### Step 6: Test Build
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
ls -la src/lib/api.js
ls -la src/lib/utils.js
ls -la src/components/ui/
ls -la src/contexts/AuthContext.jsx
```

### Check Import Syntax
```bash
# Verify no syntax errors in key files (requires Node.js to be able to parse JSX/TSX)
# For JS files:
node -c src/lib/utils.js
# For JSX files, you might need a transpiler like babel-node or just rely on 'npm run dev' errors
```

### Check Vite Configuration
```bash
# Verify vite config is valid
npx vite --help
```

## 📞 Support

If issues persist after following this guide:

1.  **Check Node.js version**: Use 18.x or 20.x
2.  **Try different terminal**: Use Git Bash on Windows
3.  **Clear all caches**: Browser, npm, and system
4.  **Use WSL on Windows**: For better compatibility
5.  **Check antivirus**: May block file operations

I am confident that following these steps will resolve the `axios` import error and get your frontend running. Please let me know the outcome after you try these steps.

