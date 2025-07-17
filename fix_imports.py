#!/usr/bin/env python3
"""
Fix relative imports in backend route files for Vercel deployment
"""

import os
import re

def fix_imports_in_file(file_path):
    """Fix relative imports in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix relative imports
        patterns = [
            (r'from \.\.services\.supabase_service import', 'from src.services.supabase_service import'),
            (r'from \.\.services\.data_consistency_service import', 'from src.services.data_consistency_service import'),
            (r'from \.\.utils\.business_operations import', 'from src.utils.business_operations import'),
            (r'from \.\.services\.', 'from src.services.'),
            (r'from \.\.utils\.', 'from src.utils.'),
        ]
        
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
        
        # Write back if changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed imports in {file_path}")
            return True
        else:
            print(f"ℹ️  No changes needed in {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    """Fix imports in all route files"""
    print("🔧 Fixing relative imports for Vercel deployment...")
    
    # Route files to fix
    route_files = [
        'backend/sabiops-backend/src/routes/auth.py',
        'backend/sabiops-backend/src/routes/customer.py',
        'backend/sabiops-backend/src/routes/product.py',
        'backend/sabiops-backend/src/routes/invoice.py',
        'backend/sabiops-backend/src/routes/sales.py',
        'backend/sabiops-backend/src/routes/expense.py',
        'backend/sabiops-backend/src/routes/team.py',
        'backend/sabiops-backend/src/routes/payment.py',
        'backend/sabiops-backend/src/routes/dashboard.py',
        'backend/sabiops-backend/src/routes/notifications.py',
        'backend/sabiops-backend/src/routes/search.py',
        'backend/sabiops-backend/src/routes/subscription.py',
        'backend/sabiops-backend/src/routes/referral.py',
        'backend/sabiops-backend/src/routes/data_integrity.py',
    ]
    
    fixed_count = 0
    
    for file_path in route_files:
        if os.path.exists(file_path):
            if fix_imports_in_file(file_path):
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n✅ Fixed imports in {fixed_count} files")
    print("🚀 Backend should now be compatible with Vercel deployment")

if __name__ == "__main__":
    main()