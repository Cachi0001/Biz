#!/usr/bin/env python3
"""
Check the actual file structure and identify missing files.
Used to check the file structure of the backend.
"""

import os

def check_directory_structure():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    src_dir = os.path.join(base_dir, 'src')
    
    print("🔍 Checking Bizflow Backend Structure")
    print("=" * 40)
    print(f"Base directory: {base_dir}")
    print(f"Source directory: {src_dir}")
    
    # Check if src directory exists
    if not os.path.exists(src_dir):
        print("❌ src directory does not exist!")
        return
    
    print("✅ src directory exists")
    
    # Check subdirectories
    subdirs = ['models', 'routes', 'services']
    for subdir in subdirs:
        subdir_path = os.path.join(src_dir, subdir)
        if os.path.exists(subdir_path):
            print(f"✅ {subdir} directory exists")
            # List files in subdirectory
            files = [f for f in os.listdir(subdir_path) if f.endswith('.py')]
            print(f"   Files: {files}")
        else:
            print(f"❌ {subdir} directory missing")
    
    # Check main.py
    main_py = os.path.join(src_dir, 'main.py')
    if os.path.exists(main_py):
        print("✅ main.py exists")
    else:
        print("❌ main.py missing")
    
    # Check __init__.py files
    init_files = [
        os.path.join(src_dir, '__init__.py'),
        os.path.join(src_dir, 'models', '__init__.py'),
        os.path.join(src_dir, 'routes', '__init__.py'),
        os.path.join(src_dir, 'services', '__init__.py')
    ]
    
    print("\n📄 Checking __init__.py files:")
    for init_file in init_files:
        if os.path.exists(init_file):
            print(f"✅ {init_file.replace(base_dir, '.')} exists")
        else:
            print(f"❌ {init_file.replace(base_dir, '.')} missing")

if __name__ == "__main__":
    check_directory_structure()