# 🚀 Bizflow Backend Setup Instructions

## ❌ **Error You're Facing:**
```
ModuleNotFoundError: No module named 'flask'
```

## ✅ **SOLUTION - 3 Easy Steps:**

### **Step 1: Install Dependencies**
```bash
# Option A: Install essential packages manually
pip install flask flask-sqlalchemy flask-jwt-extended flask-cors python-dotenv werkzeug

# Option B: Use our automated installer
python install_dependencies.py

# Option C: Install from requirements.txt
pip install -r requirements.txt
```

### **Step 2: Start Backend**
```bash
# Use the simplified backend (guaranteed to work)
python simple_main.py
```

### **Step 3: Test Backend**
```bash
# In another terminal, test the API
curl http://localhost:5000/api/health
```

---

## 🔧 **Alternative Solutions:**

### **If pip install fails:**
```bash
# Update pip first
python -m pip install --upgrade pip

# Then install packages
pip install flask flask-sqlalchemy flask-jwt-extended flask-cors
```

### **If you're using virtual environment:**
```bash
# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install packages
pip install flask flask-sqlalchemy flask-jwt-extended flask-cors python-dotenv werkzeug

# Run backend
python simple_main.py
```

### **If you're using conda:**
```bash
# Install with conda
conda install flask
pip install flask-sqlalchemy flask-jwt-extended flask-cors python-dotenv
```

---

## 🎯 **Quick Test Commands:**

### **1. Check if Flask is installed:**
```bash
python -c "import flask; print('Flask version:', flask.__version__)"
```

### **2. Start backend:**
```bash
python simple_main.py
```

### **3. Test health endpoint:**
```bash
curl http://localhost:5000/api/health
```

### **4. Test with browser:**
Open: `http://localhost:5000/api/health`

---

## ✅ **Expected Success Output:**

### **After installing dependencies:**
```
✅ All essential packages installed successfully!
🚀 Backend is ready to run!
```

### **After starting backend:**
```
🚀 Starting Bizflow SME Nigeria Backend...
📊 Testing basic functionality...
✅ Health endpoint working
✅ Test endpoint working
🌐 Server starting on port 5000
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[your-ip]:5000
```

### **After testing health endpoint:**
```json
{
  "status": "healthy",
  "message": "Bizflow SME Nigeria API is running",
  "version": "1.0.0",
  "database": "Connected"
}
```

---

## 🚨 **If You Still Have Issues:**

### **Check Python version:**
```bash
python --version
# Should be Python 3.7 or higher
```

### **Check pip version:**
```bash
pip --version
# Should be pip 20.0 or higher
```

### **Manual package verification:**
```bash
python -c "
try:
    import flask
    import flask_sqlalchemy
    import flask_jwt_extended
    import flask_cors
    print('✅ All packages imported successfully!')
except ImportError as e:
    print(f'❌ Missing package: {e}')
"
```

---

## 🎉 **Once Working:**

Your backend will be ready with these features:
- ✅ User authentication (register/login)
- ✅ Customer management
- ✅ Product management  
- ✅ Dashboard statistics
- ✅ Database operations
- ✅ API endpoints

**Ready to connect your frontend and start testing!** 🚀