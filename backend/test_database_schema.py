#!/usr/bin/env python3
"""
Database Schema Test Script
Tests if all required subscription columns and tables exist
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_database_schema():
    """Test if all required database schema elements exist"""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
        return False
    
    try:
        # Create Supabase client
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase successfully")
        
        # Test 1: Check if required columns exist in users table
        print("\n🔍 Testing users table columns...")
        required_columns = [
            'trial_days_left',
            'subscription_start_date', 
            'subscription_end_date',
            'last_payment_date',
            'payment_reference'
        ]
        
        # Try to select these columns to see if they exist
        try:
            result = supabase.table('users').select(','.join(required_columns)).limit(1).execute()
            print("✅ All required users table columns exist")
        except Exception as e:
            print(f"❌ Missing columns in users table: {str(e)}")
            print("   Run: psql $DATABASE_URL -f Biz/backend/migeration/010_add_missing_subscription_columns.sql")
            return False
        
        # Test 2: Check if subscription_transactions table exists
        print("\n🔍 Testing subscription_transactions table...")
        try:
            result = supabase.table('subscription_transactions').select('id').limit(1).execute()
            print("✅ subscription_transactions table exists")
        except Exception as e:
            print(f"❌ subscription_transactions table missing: {str(e)}")
            print("   Run: psql $DATABASE_URL -f Biz/backend/migeration/011_create_subscription_transactions_table.sql")
            return False
        
        # Test 3: Check if feature_usage table has required columns
        print("\n🔍 Testing feature_usage table...")
        try:
            result = supabase.table('feature_usage').select('created_at,updated_at').limit(1).execute()
            print("✅ feature_usage table has required columns")
        except Exception as e:
            print(f"❌ feature_usage table missing columns: {str(e)}")
            print("   Run: psql $DATABASE_URL -f Biz/backend/migeration/009_fix_feature_usage_table.sql")
            return False
        
        # Test 4: Test basic subscription service functionality
        print("\n🔍 Testing subscription service functionality...")
        try:
            # Try to get a user with subscription data
            result = supabase.table('users').select('id,subscription_plan,subscription_status,trial_days_left').limit(1).execute()
            if result.data:
                user = result.data[0]
                print(f"✅ Sample user subscription data: plan={user.get('subscription_plan')}, status={user.get('subscription_status')}")
            else:
                print("⚠️  No users found in database")
        except Exception as e:
            print(f"❌ Error querying subscription data: {str(e)}")
            return False
        
        print("\n🎉 All database schema tests passed!")
        print("   The subscription system should now work correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_api_endpoints():
    """Test if API endpoints are accessible"""
    import requests
    
    print("\n🔍 Testing API endpoints...")
    
    # Test health endpoint
    try:
        response = requests.get('https://sabiops.vercel.app/api/health', timeout=10)
        if response.status_code == 200:
            print("✅ API health endpoint accessible")
            data = response.json()
            print(f"   Mode: {data.get('mode')}, Supabase: {data.get('supabase_connected')}")
        else:
            print(f"❌ API health endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ API health endpoint failed: {str(e)}")
    
    # Test subscription plans endpoint (no auth required)
    try:
        response = requests.get('https://sabiops.vercel.app/api/subscription/plans', timeout=10)
        if response.status_code == 200:
            print("✅ Subscription plans endpoint accessible")
            data = response.json()
            if data.get('success'):
                print(f"   Available plans: {len(data.get('data', {}).get('plans', {}))}")
            else:
                print(f"   Response: {data}")
        else:
            print(f"❌ Subscription plans endpoint returned {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Subscription plans endpoint failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 SabiOps Database Schema Test")
    print("=" * 50)
    
    # Test database schema
    schema_ok = test_database_schema()
    
    # Test API endpoints
    test_api_endpoints()
    
    if schema_ok:
        print("\n✅ Database schema is ready!")
        print("   You can now test the payment verification flow.")
    else:
        print("\n❌ Database schema needs fixes!")
        print("   Please run the migration scripts first.")
    
    sys.exit(0 if schema_ok else 1)