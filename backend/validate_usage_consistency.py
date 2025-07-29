#!/usr/bin/env python3
"""
Usage Consistency Validation Script
Quick script to validate that all usage counts match database records
"""

import os
import sys
from datetime import datetime

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client
from services.subscription_service import SubscriptionService

def validate_all_users():
    """Validate usage consistency for all users"""
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    subscription_service = SubscriptionService()
    
    print("🔍 Validating usage consistency for all users...")
    print("=" * 60)
    
    try:
        # Get all users
        users_result = supabase.table('users').select('id, email').execute()
        users = users_result.data
        
        total_users = len(users)
        users_with_issues = 0
        total_discrepancies = 0
        
        print(f"Found {total_users} users to validate\n")
        
        for i, user in enumerate(users, 1):
            user_id = user['id']
            email = user['email']
            
            print(f"[{i}/{total_users}] Checking {email}...")
            
            try:
                # Validate consistency
                validation_result = subscription_service.validate_usage_consistency(user_id)
                
                if not validation_result['is_consistent']:
                    users_with_issues += 1
                    discrepancy_count = len(validation_result['discrepancies'])
                    total_discrepancies += discrepancy_count
                    
                    print(f"  ❌ {discrepancy_count} discrepancies found:")
                    for disc in validation_result['discrepancies']:
                        print(f"    • {disc['feature_type']}: tracked={disc['tracked_count']}, actual={disc['actual_count']}, diff={disc['difference']}")
                else:
                    print(f"  ✅ All counts accurate")
                    
            except Exception as e:
                print(f"  ⚠️  Error validating user: {str(e)}")
                users_with_issues += 1
        
        print("\n" + "=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Total users validated: {total_users}")
        print(f"Users with issues: {users_with_issues}")
        print(f"Total discrepancies: {total_discrepancies}")
        
        if users_with_issues > 0:
            print(f"\n⚠️  {users_with_issues} users have usage count discrepancies")
            print("Run the fix script to resolve these issues:")
            print("python fix_usage_discrepancies.py --fix")
        else:
            print("\n✅ All usage counts are accurate!")
        
    except Exception as e:
        print(f"❌ Validation failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    validate_all_users()