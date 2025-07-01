# Bizflow SME Nigeria - Local Setup Guide

This guide provides step-by-step instructions to set up and run the Bizflow SME Nigeria application on your local machine for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js and npm**: Required for the frontend. You can download them from [https://nodejs.org/](https://nodejs.org/).
- **Python and pip**: Required for the backend. You can download them from [https://www.python.org/](https://www.python.org/).
- **Git**: For version control. You can download it from [https://git-scm.com/](https://git-scm.com/).
- **MySQL Server**: A local MySQL server is required for the database. We recommend using XAMPP, WAMP, or MAMP for an easy setup.

## 1. Clone the Repository

First, clone the project repository from GitHub:

```bash
cd /path/to/your/projects
git clone https://github.com/Cachi0001/Biz.git
cd Biz
```

## 2. Backend Setup

### a. Create and Activate a Virtual Environment

It is highly recommended to use a virtual environment to manage Python dependencies:

```bash
cd backend/bizflow-backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
. venv/bin/activate
```

### b. Install Dependencies

Install all the required Python packages:

```bash
pip install -r requirements.txt
```

### c. Configure Environment Variables

Create a `.env` file in the `backend/bizflow-backend` directory and populate it with your credentials. You can use the provided `.env.example` as a template.

**`backend/bizflow-backend/.env`:**
```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-in-production

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=bizflow_sme

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### d. Create the Database

Make sure your MySQL server is running. Then, using a tool like MySQL Workbench or the command line, create a new database named `bizflow_sme`.

### e. Run the Backend Server

Start the Flask development server:

```bash
python src/main.py
```

The backend should now be running at `http://localhost:5000`.

## 3. Frontend Setup

### a. Install Dependencies

In a new terminal, navigate to the frontend directory and install the required npm packages:

```bash
cd frontend/bizflow-frontend
npm install
```

### b. Configure Environment Variables

Create a `.env` file in the `frontend/bizflow-frontend` directory:

**`frontend/bizflow-frontend/.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
```

### c. Run the Frontend Development Server

Start the Vite development server:

```bash
npm run dev
```

The frontend should now be running at `http://localhost:3000`.

## 4. Access the Application

Open your web browser and navigate to `http://localhost:3000`. You should now be able to use the Bizflow SME Nigeria application locally.

## Troubleshooting

- **`ERESOLVE` error during `npm install`**: If you encounter this error, try deleting the `node_modules` directory and the `package-lock.json` file, then run `npm install` again. If the issue persists, you can try `npm install --legacy-peer-deps`.
- **MySQL Connection Error**: Ensure your MySQL server is running and that the credentials in your backend `.env` file are correct.
- **`ModuleNotFoundError`**: Make sure you have activated your Python virtual environment and installed all dependencies from `requirements.txt`.

That's it! You now have a fully functional local setup of the Bizflow SME Nigeria application. Happy coding!


