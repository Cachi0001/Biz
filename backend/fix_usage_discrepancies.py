#!/usr/bin/env python3
"""
Data Consistency Script - Fix Usage Count Discrepancies
This script identifies and fixes discrepancies between tracked usage counts and actual database records.
"""

import os
import sys
from datetime import datetime
import logging

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client
from services.subscription_service import SubscriptionService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('usage_discrepancy_fix.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class UsageDiscrepancyFixer:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        self.subscription_service = SubscriptionService()
        
    def get_all_users(self):
        """Get all users from the database"""
        try:
            result = self.supabase.table('users').select('id, email, subscription_plan').execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            return []
    
    def audit_user_usage(self, user_id, email):
        """Audit usage counts for a specific user"""
        try:
            logger.info(f"Auditing usage for user {email} ({user_id})")
            
            # Get tracked usage counts
            usage_result = self.supabase.table('feature_usage').select('*').eq('user_id', user_id).execute()
            tracked_usage = {usage['feature_type']: usage for usage in usage_result.data}
            
            # Get actual counts from database
            actual_counts = self.subscription_service._get_actual_database_counts(user_id)
            
            discrepancies = []
            
            for feature_type, actual_count in actual_counts.items():
                if feature_type in tracked_usage:
                    tracked_count = tracked_usage[feature_type]['current_count']
                    if tracked_count != actual_count:
                        discrepancies.append({
                            'feature_type': feature_type,
                            'tracked_count': tracked_count,
                            'actual_count': actual_count,
                            'difference': actual_count - tracked_count
                        })
                else:
                    # Missing usage record
                    discrepancies.append({
                        'feature_type': feature_type,
                        'tracked_count': 0,
                        'actual_count': actual_count,
                        'difference': actual_count,
                        'missing_record': True
                    })
            
            return {
                'user_id': user_id,
                'email': email,
                'discrepancies': discrepancies,
                'has_discrepancies': len(discrepancies) > 0
            }
            
        except Exception as e:
            logger.error(f"Error auditing user {email}: {str(e)}")
            return {
                'user_id': user_id,
                'email': email,
                'error': str(e),
                'has_discrepancies': False
            }
    
    def fix_user_discrepancies(self, user_id, email, discrepancies):
        """Fix discrepancies for a specific user"""
        try:
            logger.info(f"Fixing {len(discrepancies)} discrepancies for user {email}")
            
            fixed_count = 0
            current_time = datetime.now()
            
            for discrepancy in discrepancies:
                feature_type = discrepancy['feature_type']
                actual_count = discrepancy['actual_count']
                
                if discrepancy.get('missing_record'):
                    # Create missing usage record
                    user_subscription = self.subscription_service.get_unified_subscription_status(user_id)
                    plan_config = user_subscription['plan_config']
                    limit_count = plan_config['features'].get(feature_type, 0)
                    
                    new_usage = {
                        'user_id': user_id,
                        'feature_type': feature_type,
                        'current_count': actual_count,
                        'limit_count': limit_count,
                        'period_start': current_time.isoformat(),
                        'period_end': (current_time.replace(day=1, month=current_time.month+1) if current_time.month < 12 else current_time.replace(year=current_time.year+1, month=1, day=1)).isoformat(),
                        'created_at': current_time.isoformat(),
                        'updated_at': current_time.isoformat(),
                        'sync_status': 'synced',
                        'last_synced_at': current_time.isoformat(),
                        'discrepancy_count': 0
                    }
                    
                    self.supabase.table('feature_usage').insert(new_usage).execute()
                    logger.info(f"Created missing usage record for {feature_type}: {actual_count}")
                    
                else:
                    # Update existing record
                    self.supabase.table('feature_usage').update({
                        'current_count': actual_count,
                        'updated_at': current_time.isoformat(),
                        'last_synced_at': current_time.isoformat(),
                        'sync_status': 'synced',
                        'discrepancy_count': 0
                    }).eq('user_id', user_id).eq('feature_type', feature_type).execute()
                    
                    logger.info(f"Fixed {feature_type}: {discrepancy['tracked_count']} -> {actual_count}")
                
                fixed_count += 1
            
            return {
                'success': True,
                'fixed_count': fixed_count,
                'message': f"Fixed {fixed_count} discrepancies for user {email}"
            }
            
        except Exception as e:
            logger.error(f"Error fixing discrepancies for user {email}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f"Failed to fix discrepancies for user {email}"
            }
    
    def run_full_audit(self, fix_discrepancies=False):
        """Run full audit on all users"""
        logger.info("Starting full usage audit...")
        
        users = self.get_all_users()
        logger.info(f"Found {len(users)} users to audit")
        
        total_users = len(users)
        users_with_discrepancies = 0
        total_discrepancies = 0
        total_fixed = 0
        
        audit_results = []
        
        for i, user in enumerate(users, 1):
            user_id = user['id']
            email = user['email']
            
            logger.info(f"Processing user {i}/{total_users}: {email}")
            
            # Audit user
            audit_result = self.audit_user_usage(user_id, email)
            audit_results.append(audit_result)
            
            if audit_result['has_discrepancies']:
                users_with_discrepancies += 1
                discrepancy_count = len(audit_result['discrepancies'])
                total_discrepancies += discrepancy_count
                
                logger.warning(f"User {email} has {discrepancy_count} discrepancies:")
                for disc in audit_result['discrepancies']:
                    logger.warning(f"  {disc['feature_type']}: tracked={disc['tracked_count']}, actual={disc['actual_count']}, diff={disc['difference']}")
                
                # Fix discrepancies if requested
                if fix_discrepancies:
                    fix_result = self.fix_user_discrepancies(user_id, email, audit_result['discrepancies'])
                    if fix_result['success']:
                        total_fixed += fix_result['fixed_count']
                        logger.info(fix_result['message'])
                    else:
                        logger.error(fix_result['message'])
        
        # Summary
        logger.info("=== AUDIT SUMMARY ===")
        logger.info(f"Total users audited: {total_users}")
        logger.info(f"Users with discrepancies: {users_with_discrepancies}")
        logger.info(f"Total discrepancies found: {total_discrepancies}")
        
        if fix_discrepancies:
            logger.info(f"Total discrepancies fixed: {total_fixed}")
        else:
            logger.info("No fixes applied (audit only mode)")
        
        return {
            'total_users': total_users,
            'users_with_discrepancies': users_with_discrepancies,
            'total_discrepancies': total_discrepancies,
            'total_fixed': total_fixed if fix_discrepancies else 0,
            'audit_results': audit_results
        }
    
    def backup_current_usage_data(self):
        """Create backup of current usage data before making changes"""
        try:
            logger.info("Creating backup of current usage data...")
            
            # Get all feature usage records
            result = self.supabase.table('feature_usage').select('*').execute()
            
            # Save to backup file
            backup_filename = f"usage_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            import json
            with open(backup_filename, 'w') as f:
                json.dump(result.data, f, indent=2, default=str)
            
            logger.info(f"Backup saved to {backup_filename}")
            return backup_filename
            
        except Exception as e:
            logger.error(f"Error creating backup: {str(e)}")
            return None

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fix usage count discrepancies')
    parser.add_argument('--audit-only', action='store_true', help='Only audit, do not fix discrepancies')
    parser.add_argument('--fix', action='store_true', help='Fix discrepancies (creates backup first)')
    parser.add_argument('--user-id', help='Audit/fix specific user only')
    
    args = parser.parse_args()
    
    if not args.audit_only and not args.fix:
        print("Please specify either --audit-only or --fix")
        return
    
    try:
        fixer = UsageDiscrepancyFixer()
        
        if args.user_id:
            # Single user mode
            logger.info(f"Processing single user: {args.user_id}")
            
            # Get user info
            user_result = fixer.supabase.table('users').select('id, email').eq('id', args.user_id).single().execute()
            if not user_result.data:
                logger.error(f"User {args.user_id} not found")
                return
            
            user = user_result.data
            audit_result = fixer.audit_user_usage(user['id'], user['email'])
            
            if audit_result['has_discrepancies']:
                logger.info(f"Found {len(audit_result['discrepancies'])} discrepancies")
                
                if args.fix:
                    fix_result = fixer.fix_user_discrepancies(user['id'], user['email'], audit_result['discrepancies'])
                    logger.info(fix_result['message'])
            else:
                logger.info("No discrepancies found")
        
        else:
            # Full audit mode
            if args.fix:
                # Create backup before fixing
                backup_file = fixer.backup_current_usage_data()
                if not backup_file:
                    logger.error("Failed to create backup. Aborting fix operation.")
                    return
            
            # Run full audit
            results = fixer.run_full_audit(fix_discrepancies=args.fix)
            
            logger.info("Audit completed successfully")
    
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()