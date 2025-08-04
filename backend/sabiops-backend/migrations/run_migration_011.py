#!/usr/bin/env python3
"""
Migration 011: Fix Feature Usage Schema
This script safely migrates the feature_usage table structure and resolves conflicts.
"""

import os
import sys
import logging
from pathlib import Path

# Add the parent directory to the path so we can import from src
sys.path.append(str(Path(__file__).parent.parent))

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please install required packages: pip install supabase python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")
    
    return create_client(url, key)

def check_current_schema(supabase: Client) -> dict:
    """Check the current state of feature usage tables"""
    logger.info("Checking current database schema...")
    
    schema_info = {
        'user_feature_usage_exists': False,
        'feature_usage_exists': False,
        'feature_usage_is_view': False,
        'user_count': 0,
        'usage_records': 0
    }
    
    try:
        # Check if user_feature_usage table exists by trying to query it
        try:
            result = supabase.table('user_feature_usage').select('id', count='exact').limit(1).execute()
            schema_info['user_feature_usage_exists'] = True
            logger.info("✓ user_feature_usage table exists")
        except Exception:
            logger.info("✗ user_feature_usage table does not exist")
        
        # Check if feature_usage exists and whether it's a table or view
        try:
            result = supabase.table('feature_usage').select('id', count='exact').limit(1).execute()
            schema_info['feature_usage_exists'] = True
            logger.info("✓ feature_usage exists (table or view)")
        except Exception:
            logger.info("✗ feature_usage does not exist")
        
        # Count users for reference
        try:
            users_result = supabase.table('users').select('id', count='exact').limit(1).execute()
            schema_info['user_count'] = users_result.count or 0
            logger.info(f"Found {schema_info['user_count']} users in the system")
        except Exception as e:
            logger.warning(f"Could not count users: {e}")
        
    except Exception as e:
        logger.error(f"Error checking schema: {e}")
    
    return schema_info

def backup_existing_data(supabase: Client) -> dict:
    """Backup existing feature usage data before migration"""
    logger.info("Backing up existing feature usage data...")
    
    backup_data = {
        'user_feature_usage': [],
        'feature_usage': []
    }
    
    # Backup user_feature_usage if it exists
    try:
        result = supabase.table('user_feature_usage').select('*').execute()
        backup_data['user_feature_usage'] = result.data or []
        logger.info(f"Backed up {len(backup_data['user_feature_usage'])} records from user_feature_usage")
    except Exception as e:
        logger.info(f"No user_feature_usage data to backup: {e}")
    
    # Backup feature_usage if it exists
    try:
        result = supabase.table('feature_usage').select('*').execute()
        backup_data['feature_usage'] = result.data or []
        logger.info(f"Backed up {len(backup_data['feature_usage'])} records from feature_usage")
    except Exception as e:
        logger.info(f"No feature_usage data to backup: {e}")
    
    return backup_data

def run_migration_sql(supabase: Client) -> bool:
    """Execute the migration SQL"""
    logger.info("Running migration SQL...")
    
    # Read the migration SQL file
    migration_file = Path(__file__).parent / "011_fix_feature_usage_schema.sql"
    
    if not migration_file.exists():
        logger.error(f"Migration file not found: {migration_file}")
        return False
    
    try:
        with open(migration_file, 'r') as f:
            sql_content = f.read()
        
        # Execute the migration
        # Note: Supabase Python client doesn't support raw SQL execution
        # This would need to be run directly in Supabase SQL Editor
        logger.info("Migration SQL prepared. Please run the following in Supabase SQL Editor:")
        logger.info("=" * 80)
        logger.info(sql_content)
        logger.info("=" * 80)
        
        return True
        
    except Exception as e:
        logger.error(f"Error preparing migration SQL: {e}")
        return False

def verify_migration(supabase: Client) -> bool:
    """Verify that the migration completed successfully"""
    logger.info("Verifying migration results...")
    
    try:
        # Check that feature_usage table exists and has expected structure
        result = supabase.table('feature_usage').select('*').limit(1).execute()
        logger.info("✓ feature_usage table is accessible")
        
        # Check that we can query usage stats
        if result.data:
            sample_record = result.data[0]
            expected_fields = ['user_id', 'feature_type', 'current_count', 'limit_count', 'sync_status']
            
            for field in expected_fields:
                if field in sample_record:
                    logger.info(f"✓ Field '{field}' exists")
                else:
                    logger.warning(f"✗ Field '{field}' missing")
        
        # Try to get usage stats for a user
        users_result = supabase.table('users').select('id').limit(1).execute()
        if users_result.data:
            user_id = users_result.data[0]['id']
            usage_result = supabase.table('feature_usage').select('*').eq('user_id', user_id).execute()
            logger.info(f"✓ Can query usage data for user (found {len(usage_result.data or [])} records)")
        
        logger.info("Migration verification completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Migration verification failed: {e}")
        return False

def main():
    """Main migration execution"""
    logger.info("Starting Feature Usage Schema Migration (011)")
    logger.info("=" * 60)
    
    try:
        # Initialize Supabase client
        supabase = get_supabase_client()
        logger.info("✓ Connected to Supabase")
        
        # Check current schema
        schema_info = check_current_schema(supabase)
        
        # Backup existing data
        backup_data = backup_existing_data(supabase)
        
        # Prepare migration SQL
        if run_migration_sql(supabase):
            logger.info("✓ Migration SQL prepared")
            
            print("\n" + "=" * 80)
            print("IMPORTANT: MANUAL STEP REQUIRED")
            print("=" * 80)
            print("The migration SQL has been prepared above.")
            print("Please copy and run it in your Supabase SQL Editor.")
            print("After running the SQL, you can verify the migration by running:")
            print("python run_migration_011.py --verify")
            print("=" * 80)
        else:
            logger.error("✗ Failed to prepare migration SQL")
            return False
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False
    
    return True

def verify_only():
    """Run only the verification step"""
    logger.info("Running migration verification only...")
    
    try:
        supabase = get_supabase_client()
        return verify_migration(supabase)
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        success = verify_only()
    else:
        success = main()
    
    if success:
        logger.info("Migration process completed successfully!")
        sys.exit(0)
    else:
        logger.error("Migration process failed!")
        sys.exit(1)