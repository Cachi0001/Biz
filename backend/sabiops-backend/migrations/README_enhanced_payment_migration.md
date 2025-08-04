# Enhanced Payment and Sales Management Migration

This directory contains the database migration scripts for implementing the enhanced payment and sales management system in SabiOPS.

## Overview

The enhanced payment and sales management system introduces:

1. **Standardized Payment Methods** - Consistent payment method tracking with POS integration support
2. **Credit Sales Management** - Partial payment tracking and accounts receivable management
3. **Product Categorization** - Enhanced reporting with product category breakdowns
4. **Daily Financial Summaries** - Cash at hand, POS totals, and category-wise sales reporting

## Migration Files

### 1. Schema Migration
**File:** `008_enhanced_payment_sales_schema.sql`

Creates new tables and modifies existing ones:

**New Tables:**
- `payment_methods` - Standardized payment method lookup table
- `product_categories` - Product categorization for reporting
- `sale_payments` - Partial payment tracking for credit sales

**Modified Tables:**
- `payments` - Added POS transaction fields and payment method reference
- `sales` - Added credit sales tracking and product category reference
- `products` - Added category reference

**Additional Features:**
- Performance indexes for optimized queries
- Database views for common reporting queries
- Data integrity constraints and triggers

### 2. Data Migration
**File:** `009_migrate_existing_payment_data.sql`

Migrates existing data to the new schema:
- Maps existing payment_method text values to new payment_method_id references
- Initializes amount_paid and amount_due for existing sales
- Categorizes existing products based on name patterns
- Creates initial sale_payments records for consistency

### 3. Migration Runner
**File:** `run_enhanced_payment_migration.py`

Python script to execute migrations safely:
- Checks for already executed migrations
- Provides dry-run capability for testing
- Includes comprehensive error handling and logging
- Validates migration success

### 4. Schema Validator
**File:** `validate_schema.py`

Validates that migrations completed successfully:
- Checks table and column existence
- Validates foreign key constraints
- Verifies data integrity
- Tests database views and indexes

## Running the Migration

### Prerequisites

1. Ensure you have Python 3.8+ installed
2. Install required dependencies:
   ```bash
   pip install supabase python-dotenv
   ```
3. Set up your environment variables (`.env` file):
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

### Step 1: Dry Run (Recommended)

First, run a dry run to see what changes will be made:

```bash
cd Biz/backend/sabiops-backend/migrations
python run_enhanced_payment_migration.py --dry-run --verbose
```

### Step 2: Execute Migration

If the dry run looks good, execute the actual migration:

```bash
python run_enhanced_payment_migration.py --verbose
```

### Step 3: Validate Schema

After migration, validate that everything was set up correctly:

```bash
python validate_schema.py --verbose
```

## Migration Process Details

### Phase 1: Schema Creation
1. Creates new tables with proper constraints and indexes
2. Adds new columns to existing tables
3. Sets up database views for reporting
4. Populates lookup tables with initial data

### Phase 2: Data Migration
1. Maps existing payment methods to standardized values
2. Initializes credit sales tracking fields
3. Categorizes existing products automatically
4. Creates historical payment records for consistency

### Phase 3: Validation
1. Verifies all tables and columns exist
2. Checks foreign key relationships
3. Validates data integrity
4. Tests database views and functions

## Rollback Strategy

If you need to rollback the migration:

### Manual Rollback Steps

1. **Remove new columns from existing tables:**
   ```sql
   ALTER TABLE payments DROP COLUMN IF EXISTS payment_method_id;
   ALTER TABLE payments DROP COLUMN IF EXISTS is_pos_transaction;
   ALTER TABLE payments DROP COLUMN IF EXISTS pos_account_name;
   ALTER TABLE payments DROP COLUMN IF EXISTS transaction_type;
   ALTER TABLE payments DROP COLUMN IF EXISTS pos_reference_number;
   
   ALTER TABLE sales DROP COLUMN IF EXISTS payment_method_id;
   ALTER TABLE sales DROP COLUMN IF EXISTS amount_paid;
   ALTER TABLE sales DROP COLUMN IF EXISTS amount_due;
   ALTER TABLE sales DROP COLUMN IF EXISTS product_category_id;
   
   ALTER TABLE products DROP COLUMN IF EXISTS category_id;
   ```

2. **Drop new tables:**
   ```sql
   DROP TABLE IF EXISTS sale_payments;
   DROP TABLE IF EXISTS product_categories;
   DROP TABLE IF EXISTS payment_methods;
   ```

3. **Drop views:**
   ```sql
   DROP VIEW IF EXISTS v_payment_methods;
   DROP VIEW IF EXISTS v_daily_payment_summary;
   DROP VIEW IF EXISTS v_credit_sales_summary;
   ```

4. **Remove migration log entries:**
   ```sql
   DELETE FROM migration_log WHERE migration_name IN (
       '008_enhanced_payment_sales_schema',
       '009_migrate_existing_payment_data'
   );
   ```

## Troubleshooting

### Common Issues

1. **Migration already executed error:**
   - Check the `migration_log` table to see which migrations have run
   - Use `--dry-run` to see what would be executed

2. **Permission errors:**
   - Ensure your Supabase key has sufficient permissions
   - Check that RLS policies allow the operations

3. **Data integrity errors:**
   - Run the validation script to identify specific issues
   - Check the migration logs for detailed error messages

4. **Foreign key constraint errors:**
   - Ensure referenced tables exist before creating foreign keys
   - Check that referenced data exists

### Debugging

1. **Enable verbose logging:**
   ```bash
   python run_enhanced_payment_migration.py --verbose
   ```

2. **Check migration logs:**
   ```sql
   SELECT * FROM migration_log ORDER BY executed_at DESC;
   ```

3. **Validate specific components:**
   ```bash
   python validate_schema.py --verbose
   ```

## Post-Migration Steps

After successful migration:

1. **Update application code** to use new payment method system
2. **Test payment recording** with new POS fields
3. **Verify credit sales functionality** with partial payments
4. **Test daily summary reports** with new data structure
5. **Update frontend components** to use new payment methods

## Support

If you encounter issues during migration:

1. Check the migration logs in `migration.log`
2. Run the validation script to identify specific problems
3. Review the troubleshooting section above
4. Check the database directly using Supabase dashboard

## Data Backup Recommendation

Before running the migration in production:

1. **Create a full database backup**
2. **Test the migration on a copy of production data**
3. **Verify all functionality works as expected**
4. **Have a rollback plan ready**

The migration is designed to be safe and reversible, but it's always best practice to backup your data before making schema changes.