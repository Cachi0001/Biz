#!/usr/bin/env python3
"""
Migration Script: Fix push_subscriptions table schema conflicts
Run this script to safely apply the database schema changes.
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_environment():
    """Load environment variables"""
    # Try to load from different possible locations
    env_paths = [
        Path(__file__).parent.parent / '.env',
        Path(__file__).parent.parent.parent / '.env',
        Path.cwd() / '.env'
    ]
    
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            logger.info(f"Loaded environment from {env_path}")
            break
    else:
        logger.warning("No .env file found, using system environment variables")

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")
    
    return create_client(url, key)

def read_migration_file() -> str:
    """Read the migration SQL file"""
    migration_file = Path(__file__).parent / '001_fix_push_subscriptions_schema.sql'
    
    if not migration_file.exists():
        raise FileNotFoundError(f"Migration file not found: {migration_file}")
    
    return migration_file.read_text()

def check_table_exists(supabase: Client) -> bool:
    """Check if push_subscriptions table exists"""
    try:
        result = supabase.table('push_subscriptions').select('id').limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Table check failed: {e}")
        return False

def backup_existing_data(supabase: Client) -> bool:
    """Create a backup of existing data"""
    try:
        # Get current data
        result = supabase.table('push_subscriptions').select('*').execute()
        data = result.data
        
        if data:
            logger.info(f"Found {len(data)} existing records in push_subscriptions table")
            
            # Save backup to file
            import json
            backup_file = Path(__file__).parent / f'push_subscriptions_backup_{int(time.time())}.json'
            with open(backup_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            logger.info(f"Backup saved to {backup_file}")
        else:
            logger.info("No existing data found in push_subscriptions table")
        
        return True
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return False

def run_migration(supabase: Client, sql: str) -> bool:
    """Execute the migration SQL"""
    try:
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
        
        logger.info(f"Executing {len(statements)} SQL statements...")
        
        for i, statement in enumerate(statements, 1):
            if statement.upper().startswith(('SELECT', 'COMMENT')):
                # Skip verification and comment statements
                continue
                
            logger.info(f"Executing statement {i}/{len(statements)}")
            logger.debug(f"SQL: {statement[:100]}...")
            
            # Execute using raw SQL
            result = supabase.postgrest.session.post(
                f"{supabase.supabase_url}/rest/v1/rpc/exec_sql",
                json={"sql": statement},
                headers=supabase.postgrest.auth.headers
            )
            
            if result.status_code not in [200, 201]:
                logger.error(f"Statement failed: {result.text}")
                return False
        
        logger.info("Migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False

def verify_migration(supabase: Client) -> bool:
    """Verify the migration was successful"""
    try:
        # Check if the table structure is correct
        result = supabase.table('push_subscriptions').select('*').limit(1).execute()
        
        if result.data is not None:
            logger.info("Migration verification: Table is accessible")
            
            # Check for required columns by trying to select them
            test_columns = ['id', 'user_id', 'fcm_token', 'active', 'notification_preferences', 'last_used_at']
            for col in test_columns:
                try:
                    supabase.table('push_subscriptions').select(col).limit(1).execute()
                    logger.info(f"✓ Column '{col}' exists")
                except Exception as e:
                    logger.error(f"✗ Column '{col}' missing or inaccessible: {e}")
                    return False
            
            logger.info("Migration verification: All required columns present")
            return True
        else:
            logger.error("Migration verification failed: Cannot access table")
            return False
            
    except Exception as e:
        logger.error(f"Migration verification failed: {e}")
        return False

def main():
    """Main migration function"""
    import time
    
    logger.info("Starting push_subscriptions table schema migration...")
    
    try:
        # Load environment
        load_environment()
        
        # Initialize Supabase client
        logger.info("Connecting to Supabase...")
        supabase = get_supabase_client()
        
        # Check if table exists
        if not check_table_exists(supabase):
            logger.error("push_subscriptions table does not exist. Please create it first.")
            return False
        
        # Create backup
        logger.info("Creating backup of existing data...")
        if not backup_existing_data(supabase):
            logger.error("Backup failed. Aborting migration for safety.")
            return False
        
        # Read migration SQL
        logger.info("Reading migration file...")
        sql = read_migration_file()
        
        # Confirm before proceeding
        if '--force' not in sys.argv:
            response = input("This will modify the push_subscriptions table structure. Continue? (y/N): ")
            if response.lower() != 'y':
                logger.info("Migration cancelled by user")
                return False
        
        # Run migration
        logger.info("Executing migration...")
        if not run_migration(supabase, sql):
            logger.error("Migration failed")
            return False
        
        # Verify migration
        logger.info("Verifying migration...")
        if not verify_migration(supabase):
            logger.error("Migration verification failed")
            return False
        
        logger.info("✅ Migration completed successfully!")
        logger.info("The push_subscriptions table schema has been updated and is ready for use.")
        
        return True
        
    except Exception as e:
        logger.error(f"Migration failed with error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)