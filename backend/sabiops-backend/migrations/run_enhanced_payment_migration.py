#!/usr/bin/env python3
"""
Enhanced Payment and Sales Management Migration Runner

This script runs the database migrations for the enhanced payment and sales management system.
It handles schema creation, data migration, and validation.

Usage:
    python run_enhanced_payment_migration.py [--dry-run] [--verbose]
"""

import os
import sys
import logging
import argparse
from datetime import datetime
from pathlib import Path

# Add the parent directory to the path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

try:
    from src.config import get_supabase_client
    from supabase import Client
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Make sure you're running this from the backend directory")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MigrationRunner:
    """Handles running database migrations for enhanced payment system"""
    
    def __init__(self, supabase_client: Client, dry_run: bool = False):
        self.supabase = supabase_client
        self.dry_run = dry_run
        self.migration_dir = Path(__file__).parent
        
    def create_migration_log_table(self):
        """Create migration log table if it doesn't exist"""
        try:
            create_log_table_sql = """
            CREATE TABLE IF NOT EXISTS migration_log (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                description TEXT,
                success BOOLEAN DEFAULT TRUE
            );
            """
            
            if not self.dry_run:
                self.supabase.rpc('execute_sql', {'sql': create_log_table_sql}).execute()
            
            logger.info("Migration log table created/verified")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create migration log table: {e}")
            return False
    
    def check_migration_executed(self, migration_name: str) -> bool:
        """Check if a migration has already been executed"""
        try:
            result = self.supabase.table('migration_log').select('migration_name').eq('migration_name', migration_name).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.warning(f"Could not check migration status for {migration_name}: {e}")
            return False
    
    def execute_sql_file(self, file_path: Path) -> bool:
        """Execute SQL commands from a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                sql_content = file.read()
            
            if self.dry_run:
                logger.info(f"DRY RUN: Would execute SQL from {file_path.name}")
                logger.debug(f"SQL Content Preview: {sql_content[:200]}...")
                return True
            
            # Split SQL content by statements (basic splitting on semicolons)
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            for i, statement in enumerate(statements):
                if statement.strip():
                    try:
                        logger.debug(f"Executing statement {i+1}/{len(statements)}")
                        self.supabase.rpc('execute_sql', {'sql': statement}).execute()
                    except Exception as e:
                        logger.error(f"Failed to execute statement {i+1}: {e}")
                        logger.error(f"Statement: {statement[:100]}...")
                        raise
            
            logger.info(f"Successfully executed SQL from {file_path.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to execute SQL file {file_path.name}: {e}")
            return False
    
    def run_schema_migration(self) -> bool:
        """Run the schema migration (008_enhanced_payment_sales_schema.sql)"""
        migration_name = "008_enhanced_payment_sales_schema"
        
        if self.check_migration_executed(migration_name):
            logger.info(f"Migration {migration_name} already executed, skipping")
            return True
        
        logger.info(f"Running schema migration: {migration_name}")
        
        schema_file = self.migration_dir / "008_enhanced_payment_sales_schema.sql"
        if not schema_file.exists():
            logger.error(f"Schema migration file not found: {schema_file}")
            return False
        
        success = self.execute_sql_file(schema_file)
        
        if success and not self.dry_run:
            logger.info(f"Schema migration {migration_name} completed successfully")
        
        return success
    
    def run_data_migration(self) -> bool:
        """Run the data migration (009_migrate_existing_payment_data.sql)"""
        migration_name = "009_migrate_existing_payment_data"
        
        if self.check_migration_executed(migration_name):
            logger.info(f"Migration {migration_name} already executed, skipping")
            return True
        
        logger.info(f"Running data migration: {migration_name}")
        
        data_file = self.migration_dir / "009_migrate_existing_payment_data.sql"
        if not data_file.exists():
            logger.error(f"Data migration file not found: {data_file}")
            return False
        
        success = self.execute_sql_file(data_file)
        
        if success and not self.dry_run:
            logger.info(f"Data migration {migration_name} completed successfully")
        
        return success
    
    def validate_migration(self) -> bool:
        """Validate that the migration was successful"""
        if self.dry_run:
            logger.info("DRY RUN: Skipping migration validation")
            return True
        
        logger.info("Validating migration results...")
        
        try:
            # Check that new tables exist
            tables_to_check = ['payment_methods', 'product_categories', 'sale_payments']
            for table in tables_to_check:
                result = self.supabase.table(table).select('id').limit(1).execute()
                logger.info(f"Table {table} exists and is accessible")
            
            # Check that payment_methods are populated
            payment_methods = self.supabase.table('payment_methods').select('name').execute()
            if len(payment_methods.data) == 0:
                logger.error("Payment methods table is empty")
                return False
            
            logger.info(f"Found {len(payment_methods.data)} payment methods")
            
            # Check that product_categories are populated
            categories = self.supabase.table('product_categories').select('name').execute()
            if len(categories.data) == 0:
                logger.error("Product categories table is empty")
                return False
            
            logger.info(f"Found {len(categories.data)} product categories")
            
            # Check that existing payments have payment_method_id
            payments_without_method = self.supabase.table('payments').select('id').is_('payment_method_id', 'null').limit(1).execute()
            if len(payments_without_method.data) > 0:
                logger.warning("Some payments still don't have payment_method_id assigned")
            
            logger.info("Migration validation completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Migration validation failed: {e}")
            return False
    
    def run_all_migrations(self) -> bool:
        """Run all migrations in sequence"""
        logger.info("Starting enhanced payment and sales management migration")
        
        # Create migration log table
        if not self.create_migration_log_table():
            return False
        
        # Run schema migration
        if not self.run_schema_migration():
            logger.error("Schema migration failed")
            return False
        
        # Run data migration
        if not self.run_data_migration():
            logger.error("Data migration failed")
            return False
        
        # Validate migration
        if not self.validate_migration():
            logger.error("Migration validation failed")
            return False
        
        logger.info("All migrations completed successfully!")
        return True

def main():
    """Main function to run migrations"""
    parser = argparse.ArgumentParser(description='Run enhanced payment and sales management migrations')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without executing')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if args.dry_run:
        logger.info("Running in DRY RUN mode - no changes will be made")
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Failed to initialize Supabase client")
            return 1
        
        # Run migrations
        runner = MigrationRunner(supabase, dry_run=args.dry_run)
        success = runner.run_all_migrations()
        
        if success:
            logger.info("Migration completed successfully!")
            return 0
        else:
            logger.error("Migration failed!")
            return 1
            
    except KeyboardInterrupt:
        logger.info("Migration interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error during migration: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())