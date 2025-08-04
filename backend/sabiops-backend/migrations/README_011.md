# Migration 011: Fix Feature Usage Schema

## Problem
The current codebase has a schema conflict where:
- The Python code expects a `feature_usage` table
- The existing migration created a `user_feature_usage` table
- This causes errors when trying to create indexes on views

## Solution
This migration:
1. Consolidates the schema into a single `feature_usage` table
2. Migrates any existing data from `user_feature_usage`
3. Adds proper indexes and functions for subscription tracking
4. Ensures compatibility with the existing Python code

## Files Created
- `011_fix_feature_usage_schema.sql` - Main migration SQL
- `run_migration_011.py` - Python helper script
- `check_feature_usage_schema.py` - Schema validation script

## How to Run

### Step 1: Check Current Schema
```bash
cd Biz/backend/sabiops-backend
python migrations/check_feature_usage_schema.py
```

### Step 2: Prepare Migration
```bash
python migrations/run_migration_011.py
```

### Step 3: Execute SQL
1. Copy the SQL output from step 2
2. Open Supabase SQL Editor
3. Paste and execute the SQL

### Step 4: Verify Migration
```bash
python migrations/run_migration_011.py --verify
```

## What the Migration Does

### Database Changes
- Drops any existing `feature_usage` view
- Creates proper `feature_usage` table with required fields
- Migrates data from `user_feature_usage` if it exists
- Adds performance indexes
- Creates RLS policies for security

### New Fields Added
- `sync_status` - Track synchronization state
- `last_synced_at` - Last sync timestamp
- `discrepancy_count` - Count of sync issues

### Functions Created
- `increment_feature_usage()` - Atomic usage increment
- `get_current_usage_stats()` - Get user usage statistics
- `update_feature_usage_timestamp()` - Auto-update timestamps

### Views Created
- `usage_alerts_view` - Monitor users near limits

## Verification
After migration, the system should:
- ✅ Have a working `feature_usage` table
- ✅ Support all subscription service operations
- ✅ Have proper indexes for performance
- ✅ Include all required fields for day tracking

## Rollback
If needed, you can rollback by:
1. Backing up current `feature_usage` data
2. Dropping the `feature_usage` table
3. Recreating the original `user_feature_usage` structure

## Next Steps
After this migration:
1. The subscription day tracking system can be implemented
2. Real-time usage monitoring will work properly
3. Automated expiration checks can be added