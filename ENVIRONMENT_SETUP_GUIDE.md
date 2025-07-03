# 🔧 Environment Setup Guide - Bizflow SME Nigeria

## 📋 **STEP 1: Supabase Setup (2 minutes)**

### **Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create new project: `bizflow-sme-nigeria`
3. Choose region closest to Nigeria (Europe West or Singapore)
4. Set strong database password

### **Get Your Credentials**
Go to **Settings > API** and copy:

```bash
# Your Supabase Project URL
SUPABASE_URL=https://your-project-ref.supabase.co

# Your Supabase Anon Key
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your Supabase Service Role Key (keep secret!)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Database Setup**
Go to **SQL Editor** and run the complete schema from `SUPABASE_SETUP_GUIDE.md`

## 🔑 **STEP 2: Update Environment Variables**

### **Backend Environment (.env)**
Update `backend/bizflow-backend/.env`:

```bash
# Supabase Configuration (REQUIRED for production)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Application Secrets
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Paystack Configuration (Nigerian payments)
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public-key

# Cloudinary Configuration (image storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Bizflow SME Nigeria

# Local Development Fallback
DATABASE_URL=sqlite:///instance/bizflow_sme.db
```

### **Frontend Environment (.env)**
Create `frontend/bizflow-frontend/.env`:

```bash
# API Configuration
VITE_API_URL=http://localhost:5001/api
VITE_API_URL_PROD=https://your-backend-url.vercel.app/api

# Paystack Public Key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public-key

# App Configuration
VITE_APP_NAME=Bizflow SME Nigeria
VITE_APP_VERSION=1.0.0
```

## 🚀 **STEP 3: Quick Start Commands**

### **Install Dependencies**
```bash
# Backend
cd backend/bizflow-backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../../frontend/bizflow-frontend
npm install
```

### **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend/bizflow-backend
python src/main.py

# Terminal 2 - Frontend
cd frontend/bizflow-frontend
npm run dev
```

### **Test Your Setup**
1. **Backend Health Check**: http://localhost:5001/api/health
2. **Frontend**: http://localhost:5173
3. **Register/Login**: Should work without errors
4. **Notifications**: Bell icon should show in top-right

## 🔧 **STEP 4: Deployment to Vercel**

### **Automatic Deployment**
```bash
# Run our deployment script
python DEPLOYMENT_SCRIPT.py
```

### **Manual Deployment**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **Environment Variables in Vercel**
Add these in Vercel Dashboard > Settings > Environment Variables:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
PAYSTACK_SECRET_KEY=sk_live_your-live-key
PAYSTACK_PUBLIC_KEY=pk_live_your-live-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## ✅ **STEP 5: Verification Checklist**

### **Local Development**
- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] User registration works
- [ ] User login works
- [ ] Notifications appear in bell icon
- [ ] Toast notifications show on actions
- [ ] Customer management works
- [ ] Product management works
- [ ] Invoice creation works

### **Production Deployment**
- [ ] Vercel deployment successful
- [ ] Environment variables set in Vercel
- [ ] Supabase database connected
- [ ] All API endpoints responding
- [ ] Frontend loads without errors
- [ ] User registration/login works in production
- [ ] Notifications system working
- [ ] Payment integration functional

## 🆘 **Troubleshooting**

### **Common Issues & Solutions**

#### **"Supabase connection failed"**
```bash
# Check your Supabase URL and keys
# Ensure database schema is created
# Verify RLS policies are set up
```

#### **"CORS errors"**
```bash
# Add your Vercel domain to CORS origins in main.py
# Update frontend API URL for production
```

#### **"Module not found errors"**
```bash
# Ensure all dependencies are installed
pip install -r requirements.txt
npm install
```

#### **"Database table doesn't exist"**
```bash
# Run the Supabase schema setup
# Check if tables were created properly
```

## 🎯 **Success Indicators**

When everything is working correctly, you should see:

1. **✅ Backend Health Check**: Returns `{"status": "healthy"}`
2. **✅ Frontend Loads**: No console errors
3. **✅ User Registration**: Creates user in Supabase
4. **✅ Notifications**: Bell icon with real-time updates
5. **✅ Toast Messages**: Success/error messages appear
6. **✅ Database Operations**: CRUD operations work smoothly
7. **✅ Production Deployment**: App accessible via Vercel URL

## 🔥 **Ready for Production!**

Once all steps are completed, your Bizflow SME Nigeria platform will be:
- 🌍 **Live on Vercel** with global CDN
- 🗄️ **Connected to Supabase** with real-time capabilities
- 🔔 **Notification-enabled** with toast and push notifications
- 💳 **Payment-ready** with Paystack integration
- 📱 **Mobile-responsive** for Nigerian business owners
- 🔒 **Secure** with row-level security and proper authentication

**🎉 Your Nigerian SME platform is ready to serve thousands of businesses!**