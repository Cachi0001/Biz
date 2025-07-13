# CI Workflow Manual Fixes Required

The following changes need to be made to `.github/workflows/ci-cd.yml` to fix the failing CI checks:

## Backend Test Job Issues

**Problem**: Backend test job fails because it looks for files in `./backend/bizflow-backend/` but the actual directory is `./backend/sabiops-backend/`

**Required Changes** (around lines 70-80):
```yaml
# CHANGE FROM:
working-directory: ./backend/bizflow-backend
cache-dependency-path: ./backend/bizflow-backend/requirements.txt

# CHANGE TO:
working-directory: ./backend/sabiops-backend  
cache-dependency-path: ./backend/sabiops-backend/requirements.txt
```

## Frontend Test Job Issues

**Problem 1**: Frontend test job looks for files in `./frontend/bizflow-frontend/` but the actual directory is `./frontend/sabiops-frontend/`

**Problem 2**: Uses deprecated `actions/upload-artifact@v3` which causes job failure

**Problem 3**: Uses `npm` commands but project is configured for `pnpm`

**Required Changes** (around lines 15-30):
```yaml
# CHANGE FROM:
working-directory: ./frontend/bizflow-frontend
cache: 'npm'
cache-dependency-path: ./frontend/bizflow-frontend/package-lock.json
- name: Install dependencies
  run: npm ci
- name: Run tests
  run: npm run test:coverage
- name: Build
  run: npm run build

# CHANGE TO:
working-directory: ./frontend/sabiops-frontend
cache: 'pnpm'
cache-dependency-path: ./frontend/sabiops-frontend/pnpm-lock.yaml
- name: Install dependencies
  run: pnpm install
- name: Run tests  
  run: pnpm run test:coverage
- name: Build
  run: pnpm run build
```

**Also update deprecated action** (around line 28):
```yaml
# CHANGE FROM:
- uses: actions/upload-artifact@v3

# CHANGE TO:
- uses: actions/upload-artifact@v4
```

## Summary

These changes will fix:
1. ✅ Backend test directory path mismatch (bizflow → sabiops)
2. ✅ Frontend test directory path mismatch (bizflow → sabiops)  
3. ✅ Package manager mismatch (npm → pnpm)
4. ✅ Deprecated GitHub Action (v3 → v4)

After applying these changes, the CI pipeline should pass and allow successful deployment to Vercel.

## Current Status

- Backend infrastructure tests: ✅ Fixed (MockResult execute() method, route paths)
- Frontend tests: ✅ Pass locally with npm commands
- Authentication flow: ✅ Implemented per user requirements
- Manual workflow fixes: ⏳ Requires user to apply above changes

Once these workflow file changes are applied, the full CI pipeline should pass and the MVP will be ready for live testing.
