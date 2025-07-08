# SabiOps Deployment Guide

## Quick Start (Development)

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone and Setup
```bash
git clone https://github.com/Cachi0001/Biz.git
cd Biz
```

### 2. Backend Setup
```bash
cd backend/sabiops-backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
./run.sh
```

### 3. Frontend Setup
```bash
cd frontend/sabiops-frontend
npm install
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Production Deployment

### Environment Variables Required
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET_KEY=your_jwt_secret_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend/sabiops-frontend
npm run build
# Deploy dist/ folder
```

### Backend Deployment (Vercel/Railway)
```bash
cd backend/sabiops-backend
# Configure environment variables in platform
# Deploy using platform-specific method
```

## Features Available

### ✅ Working Features
- User registration and authentication
- Customer management
- Product catalog
- Invoice generation
- Expense tracking with receipt upload
- Sales reporting and analytics
- Payment processing
- Transaction management
- Settings and configuration

### 🔧 Technical Stack
- **Frontend**: React 18, Vite, TailwindCSS, Shadcn/UI
- **Backend**: Flask, JWT Authentication, CORS enabled
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Cloudinary
- **Payments**: Paystack integration

## API Endpoints

### Authentication
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/logout` - User logout

### Business Operations
- GET/POST `/customers` - Customer management
- GET/POST `/products` - Product management
- GET/POST `/invoices` - Invoice management
- GET/POST `/expenses` - Expense tracking
- GET/POST `/sales` - Sales management
- GET/POST `/payments` - Payment processing

### Reporting
- GET `/reports/sales` - Sales analytics
- GET `/reports/expenses` - Expense reports
- GET `/reports/dashboard` - Dashboard metrics

## Troubleshooting

### Common Issues
1. **Blank Page**: Check console for errors, ensure backend is running
2. **API Errors**: Verify environment variables and database connection
3. **Build Failures**: Check Node.js version and dependencies

### Development Mode
The application includes a mock database for development when Supabase is not configured.

## Support
For issues and questions, refer to the implementation guide and check the MVP status report.

