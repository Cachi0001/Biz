#!/usr/bin/env python3
"""
Database Migration Runner
Runs the required database migrations for the subscription system
"""

import os
import sys
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration(migration_file):
    """Run a single migration file"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        return False
    
    migration_path = f"migeration/{migration_file}"
    
    if not os.path.exists(migration_path):
        print(f"❌ ERROR: Migration file not found: {migration_path}")
        return False
    
    print(f"🔄 Running migration: {migration_file}")
    
    try:
        # Run psql command
        result = subprocess.run([
            "psql", database_url, "-f", migration_path
        ], capture_output=True, text=True, check=True)
        
        print(f"✅ Migration completed: {migration_file}")
        if result.stdout:
            print(f"   Output: {result.stdout.strip()}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {migration_file}")
        print(f"   Error: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ ERROR: psql command not found. Please install PostgreSQL client.")
        print("   Alternative: Run the SQL files manually in your database client")
        return False

def main():
    """Run all required migrations"""
    print("🚀 SabiOps Database Migration Runner")
    print("=" * 50)
    
    # List of migrations to run in order
    migrations = [
        "010_add_missing_subscription_columns.sql",
        "011_create_subscription_transactions_table.sql"
    ]
    
    success_count = 0
    
    for migration in migrations:
        if run_migration(migration):
            success_count += 1
        else:
            print(f"\n❌ Migration failed: {migration}")
            print("   Please fix the error before continuing.")
            break
    
    print(f"\n📊 Migration Results: {success_count}/{len(migrations)} completed")
    
    if success_count == len(migrations):
        print("🎉 All migrations completed successfully!")
        print("   You can now test the subscription system.")
        
        # Run schema test
        print("\n🔍 Running schema validation...")
        try:
            from test_database_schema import test_database_schema
            if test_database_schema():
                print("✅ Schema validation passed!")
            else:
                print("❌ Schema validation failed!")
        except ImportError:
            print("⚠️  Schema validation script not available")
        
    else:
        print("❌ Some migrations failed. Please check the errors above.")
        
        # Show manual commands
        print("\n📝 Manual Migration Commands:")
        for migration in migrations:
            print(f"   psql $DATABASE_URL -f migeration/{migration}")

if __name__ == "__main__":
    main()