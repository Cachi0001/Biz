# Bizflow SME Nigeria - Business Management Platform

![Bizflow Logo](https://via.placeholder.com/200x80/2563eb/ffffff?text=Bizflow)

**A comprehensive business management platform designed specifically for Small and Medium Enterprises (SMEs) in Nigeria.**

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

Bizflow SME Nigeria is a modern, full-stack business management platform built to address the unique needs of Nigerian small and medium enterprises. The platform provides comprehensive tools for customer relationship management, inventory tracking, invoice generation, payment processing, and business analytics.

### Key Objectives

- **Simplify Business Operations**: Streamline day-to-day business processes with intuitive interfaces
- **Financial Management**: Comprehensive invoicing and payment tracking with Paystack integration
- **Data-Driven Insights**: Advanced analytics and reporting for informed decision-making
- **Scalability**: Built to grow with your business from startup to enterprise
- **Local Context**: Designed with Nigerian business practices and payment methods in mind

## Features

### 🏢 Business Management
- **Customer Relationship Management (CRM)**
  - Complete customer profiles with contact information
  - Customer interaction history and notes
  - Customer segmentation and analytics
  - Automated customer communications

- **Inventory Management**
  - Product catalog with SKU tracking
  - Real-time stock level monitoring
  - Low stock alerts and notifications
  - Category-based product organization
  - Inventory valuation and reporting

- **Invoice Management**
  - Professional invoice generation
  - Customizable invoice templates
  - Automated invoice numbering
  - Multiple invoice statuses (Draft, Sent, Paid, Overdue)
  - Invoice PDF generation and email delivery

### 💰 Financial Operations
- **Payment Processing**
  - Secure Paystack integration for online payments
  - Multiple payment method support
  - Payment tracking and reconciliation
  - Automated payment confirmations
  - Payment analytics and reporting

- **Financial Reporting**
  - Revenue tracking and analytics
  - Profit and loss statements
  - Cash flow monitoring
  - Tax calculation and reporting
  - Financial dashboard with key metrics

### 📊 Analytics & Reporting
- **Business Intelligence Dashboard**
  - Real-time business metrics
  - Revenue trends and forecasting
  - Customer acquisition analytics
  - Product performance insights
  - Interactive charts and visualizations

- **Export Capabilities**
  - PDF report generation
  - Excel spreadsheet exports
  - Custom date range filtering
  - Automated report scheduling

### 🔐 Security & Authentication
- **User Management**
  - Secure user registration and authentication
  - JWT-based session management
  - Role-based access control
  - Password encryption and security

- **Data Protection**
  - Encrypted data transmission
  - Secure API endpoints
  - Input validation and sanitization
  - CORS protection

## Technology Stack

### Frontend
- **React 18** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Shadcn/UI** - High-quality, accessible React components
- **Lucide React** - Beautiful and consistent icon library
- **Recharts** - Composable charting library for React
- **React Router** - Declarative routing for React applications

### Backend
- **Flask** - Lightweight and flexible Python web framework
- **SQLAlchemy** - Python SQL toolkit and Object-Relational Mapping (ORM)
- **Flask-JWT-Extended** - JWT token management for Flask
- **Flask-Mail** - Email sending capabilities
- **Flask-CORS** - Cross-Origin Resource Sharing support

### Database
- **SQLite** (Development) - Lightweight, serverless database
- **PostgreSQL** (Production) - Robust, scalable relational database

### External Services
- **Paystack** - Nigerian payment processing platform
- **SMTP Email** - Email delivery for notifications and invoices

### Development Tools
- **pytest** - Python testing framework
- **Coverage.py** - Code coverage measurement
- **ESLint** - JavaScript linting utility
- **Prettier** - Code formatting tool

## Architecture

Bizflow follows a modern, scalable architecture pattern:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Flask)       │◄──►│   (SQLite/      │
│                 │    │                 │    │   PostgreSQL)   │
│   - Components  │    │   - REST APIs   │    │                 │
│   - State Mgmt  │    │   - Business    │    │   - User Data   │
│   - Routing     │    │     Logic       │    │   - Business    │
│   - UI/UX       │    │   - Auth        │    │     Records     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ External APIs   │
                    │                 │
                    │ - Paystack      │
                    │ - Email SMTP    │
                    │ - File Storage  │
                    └─────────────────┘
```

### Design Principles

1. **Separation of Concerns (SOC)**: Clear separation between frontend, backend, and data layers
2. **RESTful API Design**: Consistent and intuitive API endpoints
3. **Component-Based Architecture**: Reusable and maintainable React components
4. **Service Layer Pattern**: Business logic encapsulated in service classes
5. **Repository Pattern**: Data access abstraction for database operations

## Prerequisites

Before installing Bizflow, ensure you have the following installed on your system:

### Required Software
- **Python 3.11+** - Backend runtime environment
- **Node.js 18+** - Frontend development and build tools
- **npm or pnpm** - Package manager for JavaScript dependencies
- **Git** - Version control system

### Optional Tools
- **PostgreSQL** - For production database (SQLite used for development)
- **Redis** - For session storage and caching (future enhancement)

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 2GB free space for development environment
- **Network**: Internet connection for package installation and API integrations

## Installation

Follow these steps to set up Bizflow on your local development environment:

### 1. Clone the Repository

```bash
git clone https://github.com/Cachi0001/Biz.git
cd Biz
```

### 2. Backend Setup

Navigate to the backend directory and set up the Python environment:

```bash
cd backend/bizflow-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

Navigate to the frontend directory and install Node.js dependencies:

```bash
cd ../../frontend/bizflow-frontend

# Install dependencies using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 4. Environment Configuration

Create environment configuration files:

#### Backend Environment (.env)
Create a `.env` file in the `backend/bizflow-backend` directory:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
FLASK_ENV=development

# Database Configuration
DATABASE_URL=sqlite:///bizflow.db

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Bizflow SME Nigeria

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB
```

#### Frontend Environment (.env)
Create a `.env` file in the `frontend/bizflow-frontend` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Application Configuration
VITE_APP_NAME=Bizflow SME Nigeria
VITE_APP_VERSION=1.0.0
```

## Configuration

### Database Setup

The application uses SQLite for development and PostgreSQL for production.

#### Development Database (SQLite)
No additional setup required. The database file will be created automatically when you first run the application.

#### Production Database (PostgreSQL)
For production deployment, update the `DATABASE_URL` in your environment configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/bizflow_db
```

### Paystack Integration

To enable payment processing, you need to set up a Paystack account:

1. Visit [Paystack](https://paystack.com) and create an account
2. Navigate to Settings > API Keys & Webhooks
3. Copy your Test/Live API keys
4. Update the environment variables with your keys

### Email Configuration

For email notifications and invoice delivery:

1. **Gmail Setup** (Recommended for development):
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password for Bizflow
   - Use the App Password in the `SMTP_PASSWORD` environment variable

2. **Other SMTP Providers**:
   - Update `SMTP_SERVER` and `SMTP_PORT` accordingly
   - Ensure your provider supports TLS encryption

## Running the Application

### Development Mode

Start both the backend and frontend development servers:

#### Terminal 1 - Backend Server
```bash
cd backend/bizflow-backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python src/main.py
```

The backend API will be available at `http://localhost:5000`

#### Terminal 2 - Frontend Development Server
```bash
cd frontend/bizflow-frontend
pnpm run dev  # Or: npm run dev
```

The frontend application will be available at `http://localhost:5173`

### Production Mode

For production deployment:

#### Build Frontend
```bash
cd frontend/bizflow-frontend
pnpm run build  # Or: npm run build
```

#### Deploy Backend
```bash
cd backend/bizflow-backend
source venv/bin/activate
gunicorn --bind 0.0.0.0:5000 src.main:app
```

## API Documentation

The Bizflow API follows RESTful conventions and provides comprehensive endpoints for all business operations.

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

### Authentication

All API endpoints (except registration and login) require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

#### Customer Management
- `GET /customers` - List all customers
- `POST /customers` - Create new customer
- `GET /customers/{id}` - Get customer details
- `PUT /customers/{id}` - Update customer
- `DELETE /customers/{id}` - Delete customer

#### Product Management
- `GET /products` - List all products
- `POST /products` - Create new product
- `GET /products/{id}` - Get product details
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `PATCH /products/{id}/stock` - Update stock quantity

#### Invoice Management
- `GET /invoices` - List all invoices
- `POST /invoices` - Create new invoice
- `GET /invoices/{id}` - Get invoice details
- `PUT /invoices/{id}` - Update invoice
- `DELETE /invoices/{id}` - Delete invoice
- `POST /invoices/{id}/send` - Send invoice via email
- `GET /invoices/{id}/pdf` - Generate invoice PDF

#### Payment Processing
- `POST /payments/initialize` - Initialize payment
- `POST /payments/verify` - Verify payment
- `GET /payments` - List all payments
- `GET /payments/{id}` - Get payment details
- `POST /payments/webhook` - Paystack webhook endpoint

#### Dashboard & Analytics
- `GET /dashboard/overview` - Business overview metrics
- `GET /dashboard/revenue-analytics` - Revenue analytics
- `GET /dashboard/customer-analytics` - Customer analytics
- `GET /dashboard/product-analytics` - Product analytics
- `GET /dashboard/invoice-analytics` - Invoice analytics
- `GET /dashboard/recent-activities` - Recent business activities
- `GET /dashboard/export` - Export dashboard data

For detailed API documentation with request/response examples, see [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## Testing

Bizflow includes comprehensive test suites for both backend and frontend components.

### Backend Testing

Run the backend test suite:

```bash
cd backend/bizflow-backend
source venv/bin/activate
pytest
```

#### Test Coverage
```bash
# Run tests with coverage report
pytest --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html
```

#### Test Categories
- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing
- **Service Tests**: Business logic validation
- **Database Tests**: Data persistence verification

### Frontend Testing

Run the frontend test suite:

```bash
cd frontend/bizflow-frontend
pnpm test  # Or: npm test
```

#### Test Types
- **Component Tests**: React component rendering and behavior
- **Integration Tests**: User interaction flows
- **API Tests**: Frontend-backend communication
- **E2E Tests**: Complete user journey testing

### Continuous Integration

The project includes GitHub Actions workflows for automated testing:

- **Backend CI**: Python testing and linting
- **Frontend CI**: JavaScript testing and building
- **Security Scanning**: Dependency vulnerability checks
- **Code Quality**: Code coverage and quality metrics

## Deployment

Bizflow can be deployed on various platforms. Here are the recommended deployment options:

### Platform Deployment Options

#### 1. Heroku Deployment
```bash
# Install Heroku CLI
# Create Heroku app
heroku create bizflow-app

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DATABASE_URL=your-postgres-url
heroku config:set PAYSTACK_SECRET_KEY=your-paystack-key

# Deploy
git push heroku main
```

#### 2. DigitalOcean App Platform
```yaml
# app.yaml
name: bizflow
services:
- name: api
  source_dir: backend/bizflow-backend
  github:
    repo: your-username/Biz
    branch: main
  run_command: gunicorn --bind 0.0.0.0:$PORT src.main:app
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: SECRET_KEY
    value: your-secret-key
    type: SECRET
```

#### 3. AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init bizflow

# Create environment
eb create production

# Deploy
eb deploy
```

#### 4. Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/bizflow-backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/bizflow-backend/ .
COPY frontend/bizflow-frontend/dist/ static/

EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "src.main:app"]
```

### Environment-Specific Configuration

#### Production Environment Variables
```env
# Production settings
FLASK_ENV=production
SECRET_KEY=your-production-secret-key
DATABASE_URL=your-production-database-url
PAYSTACK_SECRET_KEY=sk_live_your_live_paystack_key

# Security settings
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
PERMANENT_SESSION_LIFETIME=3600
```

#### SSL/HTTPS Configuration
Ensure your production deployment includes:
- SSL certificate installation
- HTTPS redirect configuration
- Secure cookie settings
- CORS policy updates

### Database Migration

For production deployments with existing data:

```bash
# Backup existing database
pg_dump your_database > backup.sql

# Run migrations
flask db upgrade

# Verify data integrity
python scripts/verify_migration.py
```

## Contributing

We welcome contributions to Bizflow! Please follow these guidelines:

### Development Workflow

1. **Fork the Repository**
   ```bash
   git fork https://github.com/Cachi0001/Biz.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation

4. **Run Tests**
   ```bash
   # Backend tests
   cd backend/bizflow-backend && pytest
   
   # Frontend tests
   cd frontend/bizflow-frontend && pnpm test
   ```

5. **Submit Pull Request**
   - Provide clear description
   - Reference related issues
   - Ensure CI passes

### Coding Standards

#### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where applicable
- Write docstrings for functions and classes
- Maximum line length: 100 characters

#### JavaScript/React (Frontend)
- Use ESLint and Prettier configurations
- Follow React best practices
- Use TypeScript for type safety
- Write meaningful component names

### Issue Reporting

When reporting issues, please include:
- **Environment Details**: OS, Python/Node versions
- **Steps to Reproduce**: Clear reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

Bizflow uses several open-source libraries and frameworks. See [THIRD_PARTY_LICENSES.md](docs/THIRD_PARTY_LICENSES.md) for complete license information.

## Support

### Documentation
- [User Manual](docs/USER_MANUAL.md) - Complete user guide
- [API Documentation](docs/API_DOCUMENTATION.md) - Detailed API reference
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

### Community Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/Cachi0001/Biz/issues)
- **Discussions**: [Community discussions and Q&A](https://github.com/Cachi0001/Biz/discussions)
- **Wiki**: [Additional documentation and guides](https://github.com/Cachi0001/Biz/wiki)

### Commercial Support
For enterprise support, custom development, or consulting services, please contact:
- **Email**: support@bizflow.ng
- **Website**: https://bizflow.ng
- **Phone**: +234 (0) 800 BIZFLOW

### Security Issues
For security-related issues, please email security@bizflow.ng instead of using public issue tracking.

---

**Built with ❤️ for Nigerian SMEs by the Bizflow Team**

*Empowering businesses to grow, one transaction at a time.*

