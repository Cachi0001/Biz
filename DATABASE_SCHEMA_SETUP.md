# 🗄️ DATABASE SCHEMA SETUP - FINAL FIX

## ✅ **YOUR CREDENTIALS ARE CORRECT!**
Your .env format is perfect:
- ✅ SUPABASE_URL format is correct
- ✅ API keys format is correct
- ✅ Project connection should work

## 🚨 **MOST LIKELY ISSUE: Missing Database Schema**

Your Supabase project exists but the tables haven't been created yet.

## ⚡ **IMMEDIATE FIX:**

### **Step 1: Create Database Schema**
1. **Go to your Supabase Dashboard**
2. **Click on your `sabiops` project**
3. **Go to SQL Editor**
4. **Copy and paste this SQL:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Flask Authentication Compatible)
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    role TEXT NOT NULL DEFAULT 'Owner' CHECK (role IN ('Owner', 'Admin', 'Salesperson')),
    created_by UUID REFERENCES public.users(id),
    business_id UUID,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'weekly', 'monthly', 'yearly')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    referral_code TEXT UNIQUE DEFAULT CONCAT('SABI', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
    referred_by UUID REFERENCES public.users(id),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add business_id self-reference
ALTER TABLE public.users ADD CONSTRAINT users_business_id_fkey 
    FOREIGN KEY (business_id) REFERENCES public.users(id);

-- Basic tables for testing
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Step 2: Run the SQL**
1. **Paste the SQL in the editor**
2. **Click "Run" button**
3. **Wait for "Success" message**

### **Step 3: Test Your Backend**
```bash
# Now test your backend:
python src/main.py
```

## 🎯 **EXPECTED SUCCESS:**
```
* Running on http://127.0.0.1:5000
* Debug mode: on
SabiOps SME Nigeria API is running
```

## 🔍 **IF STILL HAVING ISSUES:**

### **Alternative: Simplified Backend Test**
Create a minimal test to verify connection:

```python
# test_connection.py
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

try:
    supabase = create_client(url, key)
    result = supabase.table('users').select('*').limit(1).execute()
    print("✅ Supabase connection successful!")
    print(f"Tables accessible: {len(result.data) >= 0}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

## 💡 **WHY THIS HAPPENS:**
- Supabase project exists but is empty
- Backend tries to create tables but fails without proper schema
- Need to set up database structure first

**Try the SQL schema setup first - this should fix your connection issue!** 🚀