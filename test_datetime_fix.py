#!/usr/bin/env python3
"""
Test script to verify that the datetime comparison fixes work correctly.
This script tests the datetime parsing function and ensures timezone handling is correct.
"""

import os
import sys
from datetime import datetime
import pytz

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'Biz', 'backend', 'sabiops-backend')
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.join(backend_dir, 'src'))

def test_datetime_parsing():
    """Test the datetime parsing function."""
    print("Testing datetime parsing function...")
    
    # Import the function from dashboard routes
    try:
        from src.routes.dashboard import parse_supabase_datetime
        print("✅ Successfully imported parse_supabase_datetime function")
    except ImportError as e:
        print(f"❌ Failed to import parse_supabase_datetime: {e}")
        return False
    
    # Test various datetime formats
    test_cases = [
        "2024-01-15T10:30:00Z",  # ISO format with Z
        "2024-01-15T10:30:00+00:00",  # ISO format with timezone
        "2024-01-15T10:30:00",  # ISO format without timezone
        "2024-01-15 10:30:00",  # Space separated format
        None,  # None value
        "",  # Empty string
    ]
    
    utc = pytz.UTC
    current_time = datetime.now(utc)
    
    for test_case in test_cases:
        try:
            result = parse_supabase_datetime(test_case)
            if test_case is None or test_case == "":
                if result is None:
                    print(f"✅ Correctly handled {repr(test_case)}: {result}")
                else:
                    print(f"❌ Expected None for {repr(test_case)}, got: {result}")
                    return False
            else:
                if result and result.tzinfo:
                    print(f"✅ Successfully parsed {test_case}: {result}")
                    # Test comparison with timezone-aware datetime
                    try:
                        comparison = result >= current_time
                        print(f"✅ Comparison with current time works: {comparison}")
                    except TypeError as e:
                        print(f"❌ Comparison failed: {e}")
                        return False
                else:
                    print(f"❌ Failed to parse or missing timezone: {test_case} -> {result}")
                    return False
        except Exception as e:
            print(f"❌ Error parsing {test_case}: {e}")
            return False
    
    return True

def test_timezone_consistency():
    """Test that timezone handling is consistent."""
    print("\nTesting timezone consistency...")
    
    try:
        from src.routes.dashboard import parse_supabase_datetime
        
        # Test that all parsed datetimes are timezone-aware
        test_datetime = "2024-01-15T10:30:00Z"
        parsed = parse_supabase_datetime(test_datetime)
        
        if parsed and parsed.tzinfo:
            print("✅ Parsed datetime is timezone-aware")
            
            # Test comparison with UTC datetime
            utc = pytz.UTC
            utc_now = datetime.now(utc)
            
            try:
                comparison = parsed <= utc_now
                print(f"✅ Comparison with UTC datetime works: {comparison}")
                return True
            except TypeError as e:
                print(f"❌ Timezone comparison failed: {e}")
                return False
        else:
            print("❌ Parsed datetime is not timezone-aware")
            return False
            
    except Exception as e:
        print(f"❌ Error in timezone consistency test: {e}")
        return False

def test_month_calculation():
    """Test that month calculations work correctly."""
    print("\nTesting month calculation logic...")
    
    try:
        utc = pytz.UTC
        current_month_start = datetime.now(utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Test datetime from this month
        this_month_date = datetime.now(utc).replace(day=15)
        this_month_str = this_month_date.isoformat()
        
        from src.routes.dashboard import parse_supabase_datetime
        parsed_this_month = parse_supabase_datetime(this_month_str)
        
        if parsed_this_month >= current_month_start:
            print("✅ This month comparison works correctly")
        else:
            print("❌ This month comparison failed")
            return False
        
        # Test datetime from last month
        last_month_date = (datetime.now(utc) - timedelta(days=40)).replace(day=15)
        last_month_str = last_month_date.isoformat()
        
        parsed_last_month = parse_supabase_datetime(last_month_str)
        
        if parsed_last_month < current_month_start:
            print("✅ Last month comparison works correctly")
        else:
            print("❌ Last month comparison failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error in month calculation test: {e}")
        return False

def main():
    """Run all tests."""
    print("🔍 Testing datetime comparison fixes...")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test 1: Datetime parsing
    parsing_ok = test_datetime_parsing()
    all_tests_passed = all_tests_passed and parsing_ok
    
    # Test 2: Timezone consistency
    timezone_ok = test_timezone_consistency()
    all_tests_passed = all_tests_passed and timezone_ok
    
    # Test 3: Month calculation
    month_ok = test_month_calculation()
    all_tests_passed = all_tests_passed and month_ok
    
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All tests passed! Datetime comparison fixes are working correctly.")
        print("\nThe following issues have been resolved:")
        print("- Added timezone-aware datetime parsing")
        print("- Fixed 'can't compare offset-naive and offset-aware datetimes' error")
        print("- Ensured consistent UTC timezone handling")
        print("- Added robust error handling for datetime parsing")
        print("\nThe dashboard overview should now work without datetime comparison errors.")
    else:
        print("❌ Some tests failed. Please review the output above.")
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    # Import timedelta here since it's used in the test
    from datetime import timedelta
    exit(main())

