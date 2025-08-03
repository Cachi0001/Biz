# Database Migration: Push Subscriptions Schema Fix

This migration resolves schema conflicts in the `push_subscriptions` table and adds missing fields required for the enhanced Firebase push notification system.

## What This Migration Does

1. **Resolves Column Conflicts**: Fixes the `active` vs `is_active` column conflict
2. **Adds Missing Fields**: Adds `fcm_token`, `notification_preferences`, and `last_used_at` columns
3. **Data Migration**: Migrates existing `token` data to `fcm_token` field
4. **Adds Indexes**: Creates performance indexes for common queries
5. **Updates Constraints**: Adds proper constraints and RLS policies
6. **Creates Backup**: Automatically backs up existing data before migration

## Before Running Migration

### 1. Check Current Schema
First, run the schema check script to see the current state:

```bash
cd Biz/backend/sabiops-backend/migrations
python check_schema.py
```

This will show you:
- Current table structure
- Any conflicts between `active` and `is_active` columns
- Missing columns
- Data integrity issues

### 2. Set Environment Variables
Ensure your environment has the required Supabase credentials:

```bash
# In your .env file
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Running the Migration

### Option 1: Interactive Mode (Recommended)
```bash
python run_migration_001.py
```

This will:
- Show you what will be changed
- Create a backup
- Ask for confirmation before proceeding
- Run the migration
- Verify the results

### Option 2: Force Mode (for automation)
```bash
python run_migration_001.py --force
```

This skips the confirmation prompt (use with caution).

## What Happens During Migration

1. **Backup Creation**: Creates `push_subscriptions_backup` table and JSON file
2. **Schema Updates**: 
   - Adds missing columns with proper defaults
   - Resolves `active`/`is_active` conflict
   - Migrates `token` → `fcm_token`
3. **Data Migration**: 
   - Preserves all existing data
   - Sets default notification preferences
   - Updates timestamps
4. **Performance Optimization**: 
   - Adds indexes for common queries
   - Creates view for active subscriptions
5. **Security**: 
   - Updates RLS policies
   - Adds proper constraints

## After Migration

### Verify Results
Run the schema check again to confirm everything worked:

```bash
python check_schema.py
```

You should see:
- ✅ All expected columns present
- ✅ No schema conflicts
- ✅ Data integrity maintained

### Expected New Schema
After migration, your `push_subscriptions` table will have:

```sql
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    fcm_token TEXT,                    -- FCM token for push notifications
    device_type VARCHAR CHECK (device_type IN ('web', 'android', 'ios', 'desktop')),
    device_info JSONB,
    active BOOLEAN NOT NULL DEFAULT true,  -- Unified active status
    notification_preferences JSONB DEFAULT '{}',  -- User notification preferences
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- Last successful use
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Rollback (if needed)

If something goes wrong, you can restore from the backup:

```sql
-- Restore from backup table
DROP TABLE push_subscriptions;
ALTER TABLE push_subscriptions_backup RENAME TO push_subscriptions;
```

Or restore from the JSON backup file using your preferred method.

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you're using the service role key, not the anon key
2. **Connection Errors**: Check your SUPABASE_URL and network connectivity
3. **Column Already Exists**: The migration is designed to be idempotent - it's safe to run multiple times

### Getting Help

If you encounter issues:

1. Check the logs - the script provides detailed logging
2. Verify your environment variables
3. Ensure you have the necessary database permissions
4. Check the backup files were created successfully

### Manual Verification Queries

You can run these queries in your Supabase SQL editor to verify the migration:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions' 
ORDER BY ordinal_position;

-- Check data integrity
SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE active = true) as active_subscriptions,
    COUNT(*) FILTER (WHERE fcm_token IS NOT NULL) as with_fcm_token,
    COUNT(DISTINCT user_id) as unique_users
FROM push_subscriptions;

-- Check notification preferences
SELECT notification_preferences, COUNT(*) 
FROM push_subscriptions 
GROUP BY notification_preferences;
```

## Next Steps

After successful migration, you can:

1. Update your application code to use the new schema
2. Remove references to the old `is_active` column
3. Start using the new `notification_preferences` field
4. Implement the enhanced notification features

The migration is designed to be backward compatible, so your existing code should continue to work while you update it to use the new features.