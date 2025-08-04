#!/usr/bin/env python3
"""
Schema Validation Script for Enhanced Payment and Sales Management

This script validates that the database schema has been properly updated
with all required tables, columns, indexes, and constraints.

Usage:
    python validate_schema.py [--verbose]
"""

import sys
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Any

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
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SchemaValidator:
    """Validates database schema for enhanced payment system"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.validation_errors = []
        self.validation_warnings = []
    
    def log_error(self, message: str):
        """Log a validation error"""
        self.validation_errors.append(message)
        logger.error(message)
    
    def log_warning(self, message: str):
        """Log a validation warning"""
        self.validation_warnings.append(message)
        logger.warning(message)
    
    def check_table_exists(self, table_name: str) -> bool:
        """Check if a table exists"""
        try:
            result = self.supabase.rpc('execute_sql', {
                'sql': f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '{table_name}'
                );
                """
            }).execute()
            
            exists = result.data[0]['exists'] if result.data else False
            
            if exists:
                logger.info(f"✓ Table '{table_name}' exists")
                return True
            else:
                self.log_error(f"✗ Table '{table_name}' does not exist")
                return False
                
        except Exception as e:
            self.log_error(f"✗ Error checking table '{table_name}': {e}")
            return False
    
    def check_column_exists(self, table_name: str, column_name: str, expected_type: str = None) -> bool:
        """Check if a column exists in a table"""
        try:
            result = self.supabase.rpc('execute_sql', {
                'sql': f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' AND column_name = '{column_name}';
                """
            }).execute()
            
            if result.data:
                column_info = result.data[0]
                logger.info(f"✓ Column '{table_name}.{column_name}' exists ({column_info['data_type']})")
                
                if expected_type and expected_type.lower() not in column_info['data_type'].lower():
                    self.log_warning(f"Column '{table_name}.{column_name}' type is '{column_info['data_type']}', expected '{expected_type}'")
                
                return True
            else:
                self.log_error(f"✗ Column '{table_name}.{column_name}' does not exist")
                return False
                
        except Exception as e:
            self.log_error(f"✗ Error checking column '{table_name}.{column_name}': {e}")
            return False
    
    def check_index_exists(self, index_name: str) -> bool:
        """Check if an index exists"""
        try:
            result = self.supabase.rpc('execute_sql', {
                'sql': f"""
                SELECT indexname 
                FROM pg_indexes 
                WHERE indexname = '{index_name}';
                """
            }).execute()
            
            if result.data:
                logger.info(f"✓ Index '{index_name}' exists")
                return True
            else:
                self.log_warning(f"Index '{index_name}' does not exist")
                return False
                
        except Exception as e:
            self.log_warning(f"Error checking index '{index_name}': {e}")
            return False
    
    def check_foreign_key_constraint(self, table_name: str, column_name: str, referenced_table: str) -> bool:
        """Check if a foreign key constraint exists"""
        try:
            result = self.supabase.rpc('execute_sql', {
                'sql': f"""
                SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                  AND tc.table_name = '{table_name}'
                  AND kcu.column_name = '{column_name}'
                  AND ccu.table_name = '{referenced_table}';
                """
            }).execute()
            
            if result.data:
                logger.info(f"✓ Foreign key constraint exists: {table_name}.{column_name} -> {referenced_table}")
                return True
            else:
                self.log_warning(f"Foreign key constraint missing: {table_name}.{column_name} -> {referenced_table}")
                return False
                
        except Exception as e:
            self.log_warning(f"Error checking foreign key constraint: {e}")
            return False
    
    def check_data_populated(self, table_name: str, expected_min_rows: int = 1) -> bool:
        """Check if a table has data populated"""
        try:
            result = self.supabase.table(table_name).select('id', count='exact').limit(1).execute()
            row_count = result.count
            
            if row_count >= expected_min_rows:
                logger.info(f"✓ Table '{table_name}' has {row_count} rows")
                return True
            else:
                self.log_warning(f"Table '{table_name}' has only {row_count} rows, expected at least {expected_min_rows}")
                return False
                
        except Exception as e:
            self.log_error(f"✗ Error checking data in table '{table_name}': {e}")
            return False
    
    def validate_new_tables(self) -> bool:
        """Validate that all new tables exist with correct structure"""
        logger.info("Validating new tables...")
        
        success = True
        
        # Check payment_methods table
        if self.check_table_exists('payment_methods'):
            self.check_column_exists('payment_methods', 'id', 'uuid')
            self.check_column_exists('payment_methods', 'name', 'character varying')
            self.check_column_exists('payment_methods', 'type', 'character varying')
            self.check_column_exists('payment_methods', 'is_pos', 'boolean')
            self.check_column_exists('payment_methods', 'requires_reference', 'boolean')
            self.check_data_populated('payment_methods', 5)  # Should have at least 5 payment methods
        else:
            success = False
        
        # Check product_categories table
        if self.check_table_exists('product_categories'):
            self.check_column_exists('product_categories', 'id', 'uuid')
            self.check_column_exists('product_categories', 'name', 'character varying')
            self.check_column_exists('product_categories', 'description', 'text')
            self.check_data_populated('product_categories', 10)  # Should have at least 10 supermarket categories
        else:
            success = False
        
        # Check sale_payments table
        if self.check_table_exists('sale_payments'):
            self.check_column_exists('sale_payments', 'id', 'uuid')
            self.check_column_exists('sale_payments', 'sale_id', 'uuid')
            self.check_column_exists('sale_payments', 'amount_paid', 'numeric')
            self.check_column_exists('sale_payments', 'payment_method_id', 'uuid')
            self.check_foreign_key_constraint('sale_payments', 'sale_id', 'sales')
            self.check_foreign_key_constraint('sale_payments', 'payment_method_id', 'payment_methods')
        else:
            success = False
        
        return success
    
    def validate_modified_tables(self) -> bool:
        """Validate that existing tables have been properly modified"""
        logger.info("Validating modified tables...")
        
        success = True
        
        # Check payments table modifications
        if self.check_table_exists('payments'):
            self.check_column_exists('payments', 'payment_method_id', 'uuid')
            self.check_column_exists('payments', 'is_pos_transaction', 'boolean')
            self.check_column_exists('payments', 'pos_account_name', 'character varying')
            self.check_column_exists('payments', 'transaction_type', 'character varying')
            self.check_column_exists('payments', 'pos_reference_number', 'character varying')
            self.check_foreign_key_constraint('payments', 'payment_method_id', 'payment_methods')
        else:
            success = False
        
        # Check sales table modifications
        if self.check_table_exists('sales'):
            self.check_column_exists('sales', 'payment_method_id', 'uuid')
            self.check_column_exists('sales', 'amount_paid', 'numeric')
            self.check_column_exists('sales', 'amount_due', 'numeric')
            self.check_column_exists('sales', 'product_category_id', 'uuid')
            self.check_foreign_key_constraint('sales', 'payment_method_id', 'payment_methods')
            self.check_foreign_key_constraint('sales', 'product_category_id', 'product_categories')
        else:
            success = False
        
        # Check products table modifications
        if self.check_table_exists('products'):
            self.check_column_exists('products', 'category_id', 'uuid')
            self.check_foreign_key_constraint('products', 'category_id', 'product_categories')
        else:
            success = False
        
        return success
    
    def validate_indexes(self) -> bool:
        """Validate that performance indexes exist"""
        logger.info("Validating indexes...")
        
        # List of expected indexes
        expected_indexes = [
            'idx_payments_payment_method_id',
            'idx_payments_is_pos_transaction',
            'idx_payments_transaction_type',
            'idx_sales_payment_method_id',
            'idx_sales_payment_status',
            'idx_sales_amount_due',
            'idx_sale_payments_sale_id',
            'idx_products_category_id'
        ]
        
        success = True
        for index_name in expected_indexes:
            if not self.check_index_exists(index_name):
                success = False
        
        return success
    
    def validate_views(self) -> bool:
        """Validate that helper views exist"""
        logger.info("Validating views...")
        
        success = True
        
        # Check v_payment_methods view
        try:
            result = self.supabase.rpc('execute_sql', {
                'sql': "SELECT * FROM v_payment_methods LIMIT 1;"
            }).execute()
            logger.info("✓ View 'v_payment_methods' exists and is accessible")
        except Exception as e:
            self.log_error(f"✗ View 'v_payment_methods' error: {e}")
            success = False
        
        # Check v_daily_payment_summary view
        try:
            result = self.supabase.rpc('execute_sql', {
                'sql': "SELECT * FROM v_daily_payment_summary LIMIT 1;"
            }).execute()
            logger.info("✓ View 'v_daily_payment_summary' exists and is accessible")
        except Exception as e:
            self.log_error(f"✗ View 'v_daily_payment_summary' error: {e}")
            success = False
        
        # Check v_credit_sales_summary view
        try:
            result = self.supabase.rpc('execute_sql', {
                'sql': "SELECT * FROM v_credit_sales_summary LIMIT 1;"
            }).execute()
            logger.info("✓ View 'v_credit_sales_summary' exists and is accessible")
        except Exception as e:
            self.log_error(f"✗ View 'v_credit_sales_summary' error: {e}")
            success = False
        
        return success
    
    def validate_data_integrity(self) -> bool:
        """Validate data integrity after migration"""
        logger.info("Validating data integrity...")
        
        success = True
        
        try:
            # Check for payments without payment_method_id
            result = self.supabase.table('payments').select('id', count='exact').is_('payment_method_id', 'null').execute()
            if result.count > 0:
                self.log_warning(f"{result.count} payments still don't have payment_method_id")
            else:
                logger.info("✓ All payments have payment_method_id assigned")
            
            # Check for sales with amount imbalance
            result = self.supabase.rpc('execute_sql', {
                'sql': """
                SELECT COUNT(*) as count 
                FROM sales 
                WHERE ABS((amount_paid + amount_due) - total_amount) > 0.01;
                """
            }).execute()
            
            imbalanced_count = result.data[0]['count'] if result.data else 0
            if imbalanced_count > 0:
                self.log_error(f"{imbalanced_count} sales have amount imbalance")
                success = False
            else:
                logger.info("✓ All sales have balanced amounts")
            
            # Check for orphaned sale_payments
            result = self.supabase.rpc('execute_sql', {
                'sql': """
                SELECT COUNT(*) as count 
                FROM sale_payments sp
                LEFT JOIN sales s ON sp.sale_id = s.id
                WHERE s.id IS NULL;
                """
            }).execute()
            
            orphaned_count = result.data[0]['count'] if result.data else 0
            if orphaned_count > 0:
                self.log_error(f"{orphaned_count} orphaned sale_payments found")
                success = False
            else:
                logger.info("✓ No orphaned sale_payments found")
            
        except Exception as e:
            self.log_error(f"Error during data integrity validation: {e}")
            success = False
        
        return success
    
    def run_full_validation(self) -> bool:
        """Run complete schema validation"""
        logger.info("Starting comprehensive schema validation...")
        
        success = True
        
        # Validate new tables
        if not self.validate_new_tables():
            success = False
        
        # Validate modified tables
        if not self.validate_modified_tables():
            success = False
        
        # Validate indexes
        if not self.validate_indexes():
            success = False
        
        # Validate views
        if not self.validate_views():
            success = False
        
        # Validate data integrity
        if not self.validate_data_integrity():
            success = False
        
        # Print summary
        logger.info("\n" + "="*50)
        logger.info("VALIDATION SUMMARY")
        logger.info("="*50)
        
        if self.validation_errors:
            logger.error(f"ERRORS FOUND: {len(self.validation_errors)}")
            for error in self.validation_errors:
                logger.error(f"  - {error}")
        
        if self.validation_warnings:
            logger.warning(f"WARNINGS: {len(self.validation_warnings)}")
            for warning in self.validation_warnings:
                logger.warning(f"  - {warning}")
        
        if success and not self.validation_errors:
            logger.info("✓ ALL VALIDATIONS PASSED!")
        else:
            logger.error("✗ VALIDATION FAILED!")
        
        return success

def main():
    """Main function to run schema validation"""
    parser = argparse.ArgumentParser(description='Validate enhanced payment and sales management schema')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Failed to initialize Supabase client")
            return 1
        
        # Run validation
        validator = SchemaValidator(supabase)
        success = validator.run_full_validation()
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        logger.info("Validation interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error during validation: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())