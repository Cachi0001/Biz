# 📦 STARTER FILES PACKAGE

## 🎯 **CRITICAL STARTER FILES TO CREATE**

### **1. Frontend Vite Configuration**
Create `frontend/sabiops-frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist', // Ensures Vercel compatibility
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

### **2. Backend Main Application**
Create `backend/sabiops-backend/src/main.py`:

```python
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')

# Initialize extensions
CORS(app, origins=["http://localhost:5173", "https://*.vercel.app"])
jwt = JWTManager(app)

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'SabiOps SME Nigeria API is running',
        'database': 'Supabase',
        'version': '1.0.0'
    }), 200

# Basic auth endpoint
@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    return jsonify({
        'message': 'Authentication service ready',
        'features': ['JWT', 'Role-based access', 'Team management']
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
```

### **3. Backend Requirements**
Create `backend/sabiops-backend/requirements.txt`:

```txt
Flask==2.3.3
Flask-CORS==4.0.0
Flask-JWT-Extended==4.5.3
supabase==1.2.0
python-dotenv==1.0.0
Werkzeug==2.3.7
bcrypt==4.0.1
openai==1.3.0
requests==2.31.0
python-decouple==3.8
gunicorn==21.2.0
```

### **4. Backend Environment File**
Create `backend/sabiops-backend/.env`:

```bash
# Copy from .env.example and fill in your values
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production-min-32-chars

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo
ENABLE_AI_FEATURES=true

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### **5. Frontend Environment File**
Create `frontend/sabiops-frontend/.env`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_OFFLINE_MODE=true
```

### **6. Frontend Package.json Updates**
Add to `frontend/sabiops-frontend/package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "echo \"Frontend tests will be added\""
  }
}
```

## 🔧 **QUICK SETUP COMMANDS**

Run these in order:

```bash
# 1. Create the files above
# 2. Install dependencies
cd frontend/sabiops-frontend && npm install
cd ../../backend/sabiops-backend && pip install -r requirements.txt

# 3. Test locally
# Terminal 1 (Backend):
cd backend/sabiops-backend && python src/main.py

# Terminal 2 (Frontend):
cd frontend/sabiops-frontend && npm run dev

# 4. Verify
# Visit: http://localhost:5173 (Frontend)
# Visit: http://localhost:5000/api/health (Backend)
```

## ✅ **SUCCESS INDICATORS**

You'll know setup is working when:
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend health check returns JSON at http://localhost:5000/api/health
- [ ] No import errors in terminal
- [ ] Both services start without errors