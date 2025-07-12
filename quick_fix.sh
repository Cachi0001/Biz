#!/bin/bash

# Quick Fix Script for Registration Bug
# This script helps apply the foreign key constraint fix

echo "🚀 SabiOps Registration Bug Fix"
echo "=================================="
echo

# Check if migration files exist
if [ ! -f "fix_foreign_key_constraint.sql" ]; then
    echo "❌ Error: fix_foreign_key_constraint.sql not found"
    exit 1
fi

if [ ! -f "apply_db_migration.py" ]; then
    echo "❌ Error: apply_db_migration.py not found"
    exit 1
fi

echo "✅ Migration files found"

# Check if psycopg2 is installed
if ! python3 -c "import psycopg2" 2>/dev/null; then
    echo "❌ psycopg2 not found. Installing..."
    sudo apt update && sudo apt install -y python3-psycopg2
    if [ $? -eq 0 ]; then
        echo "✅ psycopg2 installed successfully"
    else
        echo "❌ Failed to install psycopg2"
        exit 1
    fi
else
    echo "✅ psycopg2 is already installed"
fi

# Check environment variables
if [ -z "$SUPABASE_URL" ]; then
    echo "❗ SUPABASE_URL environment variable not set"
    echo "Please set it with: export SUPABASE_URL='https://your-project-id.supabase.co'"
    echo
fi

if [ -z "$SUPABASE_PASSWORD" ]; then
    echo "❗ SUPABASE_PASSWORD environment variable not set"
    echo "Please set it with: export SUPABASE_PASSWORD='your-database-password'"
    echo
fi

# Show next steps
echo "📋 Next Steps:"
echo "1. Set your environment variables:"
echo "   export SUPABASE_URL='https://your-project-id.supabase.co'"
echo "   export SUPABASE_PASSWORD='your-database-password'"
echo
echo "2. Run the migration:"
echo "   python3 apply_db_migration.py"
echo
echo "3. Deploy your backend with the updated auth.py"
echo
echo "4. Test the registration process"
echo
echo "📖 For detailed instructions, see: BUG_FIX_REGISTRATION_FOREIGN_KEY.md"
echo
echo "🎯 Summary of the fix:"
echo "   - Fixed foreign key constraint in email_verification_tokens table"
echo "   - Enhanced registration logic with better error handling"
echo "   - Added user verification and cleanup mechanisms"
echo

# Make the script executable
chmod +x apply_db_migration.py

echo "✅ Setup complete! Follow the steps above to apply the fix."