#!/usr/bin/env python3
"""
Script to apply database migration to fix foreign key constraint issue.
Run this script to update the database schema.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def apply_migration():
    # Get database connection details
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_password = os.getenv("SUPABASE_PASSWORD")
    
    if not supabase_url:
        print("Error: SUPABASE_URL environment variable is required")
        sys.exit(1)
    
    # Extract database connection details from Supabase URL
    # Format: https://[project-id].supabase.co
    project_id = supabase_url.replace("https://", "").replace(".supabase.co", "")
    
    # Database connection details
    db_host = f"db.{project_id}.supabase.co"
    db_port = "5432"
    db_name = "postgres"
    db_user = "postgres"
    db_password = supabase_password or input("Enter your Supabase database password: ")
    
    # Connection string
    connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    print(f"Connecting to database: {db_host}")
    
    try:
        # Connect to database
        conn = psycopg2.connect(connection_string)
        cur = conn.cursor()
        print("✓ Connected to database")
        
        # Read and apply migration
        with open("fix_foreign_key_constraint.sql", "r") as f:
            migration_sql = f.read()
        
        print("Applying migration...")
        cur.execute(migration_sql)
        conn.commit()
        
        print("✓ Migration completed successfully!")
        print("The foreign key constraint issue should now be fixed.")
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("Error: fix_foreign_key_constraint.sql file not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    apply_migration()