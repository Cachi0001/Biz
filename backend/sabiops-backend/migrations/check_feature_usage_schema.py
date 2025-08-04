#!/usr/bin/env python3
"""
Check Feature Usage Schema
This script checks the current state of feature usage tables and identifies issues.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please install: pip install supabase python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
    
    return create_client(url, key)

def check_table_exists(supabase: Client, table_name: str) -> dict:
    """Check if a table exists and get basic info"""
    info = {
        'exists': False,
        'record_count': 0,
        'sample_record': None,
        'error': None
    }
    
    try:
        # Try to query the table
        result = supabase.table(table_name).select('*', count='exact').limit(1).execute()
        info['exists'] = True
        info['record_count'] = result.count or 0
        info['sample_record'] = result.data[0] if result.data else None
        
    except Exception as e:
        info['error'] = str(e)
    
    return info

def main():
    print("Feature Usage Schema Checker")
    print("=" * 50)
    
    try:
        supabase = get_supabase_client()
        print("✓ Connected to Supabase")
        
        # Check user_feature_usage
        print("\n1. Checking user_feature_usage table...")
        user_feature_info = check_table_exists(supabase, 'user_feature_usage')
        
        if user_feature_info['exists']:
            print(f"   ✓ user_feature_usage exists with {user_feature_info['record_count']} records")
            if user_feature_info['sample_record']:
                print(f"   Sample fields: {list(user_feature_info['sample_record'].keys())}")
        else:
            print(f"   ✗ user_feature_usage does not exist: {user_feature_info['error']}")
        
        # Check feature_usage
        print("\n2. Checking feature_usage table...")
        feature_info = check_table_exists(supabase, 'feature_usage')
        
        if feature_info['exists']:
            print(f"   ✓ feature_usage exists with {feature_info['record_count']} records")
            if feature_info['sample_record']:
                print(f"   Sample fields: {list(feature_info['sample_record'].keys())}")
        else:
            print(f"   ✗ feature_usage does not exist: {feature_info['error']}")
        
        # Check users table for reference
        print("\n3. Checking users table...")
        users_info = check_table_exists(supabase, 'users')
        
        if users_info['exists']:
            print(f"   ✓ users table exists with {users_info['record_count']} records")
        else:
            print(f"   ✗ users table issue: {users_info['error']}")
        
        # Analysis and recommendations
        print("\n" + "=" * 50)
        print("ANALYSIS & RECOMMENDATIONS")
        print("=" * 50)
        
        if not feature_info['exists'] and user_feature_info['exists']:
            print("❌ ISSUE: Code expects 'feature_usage' but only 'user_feature_usage' exists")
            print("📋 SOLUTION: Run migration 011 to fix schema")
            
        elif feature_info['exists'] and not user_feature_info['exists']:
            print("✅ GOOD: feature_usage table exists as expected")
            
        elif feature_info['exists'] and user_feature_info['exists']:
            print("⚠️  WARNING: Both tables exist - potential conflict")
            print("📋 SOLUTION: Run migration 011 to consolidate")
            
        else:
            print("❌ CRITICAL: Neither table exists")
            print("📋 SOLUTION: Run migration 011 to create proper schema")
        
        # Check if subscription service fields are present
        if feature_info['exists'] and feature_info['sample_record']:
            expected_fields = ['sync_status', 'last_synced_at', 'discrepancy_count']
            missing_fields = [f for f in expected_fields if f not in feature_info['sample_record']]
            
            if missing_fields:
                print(f"⚠️  WARNING: Missing fields for subscription service: {missing_fields}")
                print("📋 SOLUTION: Run migration 011 to add missing fields")
            else:
                print("✅ GOOD: All expected fields present")
        
        print("\nNext steps:")
        print("1. Run: python migrations/run_migration_011.py")
        print("2. Copy the SQL output to Supabase SQL Editor")
        print("3. Execute the SQL in Supabase")
        print("4. Run: python migrations/run_migration_011.py --verify")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()