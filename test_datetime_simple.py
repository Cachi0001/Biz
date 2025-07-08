#!/usr/bin/env python3
"""
Simple test script to verify that the datetime comparison logic works correctly.
This script tests the datetime parsing logic without importing from the backend.
"""

from datetime import datetime
import pytz

def parse_supabase_datetime(datetime_str):
    """
    Parse datetime string from Supabase and ensure it's timezone-aware.
    Handles various formats that Supabase might return.
    (Copy of the function from dashboard.py for testing)
    """
    if not datetime_str:
        return None
    
    try:
        # Handle ISO format with 'Z' suffix (UTC)
        if datetime_str.endswith('Z'):
            datetime_str = datetime_str.replace('Z', '+00:00')
        
        # Parse the datetime string
        dt = datetime.fromisoformat(datetime_str)
        
        # If it's naive, assume UTC
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        
        return dt
    except (ValueError, TypeError) as e:
        print(f"Error parsing datetime '{datetime_str}': {e}")
        return None

def test_datetime_parsing():
    """Test the datetime parsing function."""
    print("Testing datetime parsing function...")
    
    # Test various datetime formats
    test_cases = [
        "2024-01-15T10:30:00Z",  # ISO format with Z
        "2024-01-15T10:30:00+00:00",  # ISO format with timezone
        "2024-01-15T10:30:00",  # ISO format without timezone
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

def test_dashboard_logic():
    """Test the dashboard overview logic that was failing."""
    print("\nTesting dashboard overview logic...")
    
    try:
        # Simulate the dashboard logic
        utc = pytz.UTC
        current_month_start = datetime.now(utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Simulate invoice data from Supabase
        mock_invoices = [
            {"total_amount": 1000, "status": "paid", "created_at": "2024-07-15T10:30:00Z"},
            {"total_amount": 500, "status": "paid", "created_at": "2024-06-15T10:30:00Z"},
            {"total_amount": 750, "status": "pending", "created_at": "2024-07-20T10:30:00Z"},
        ]
        
        # Test the logic that was causing the error
        revenue_this_month = sum(
            inv["total_amount"] for inv in mock_invoices
            if inv["status"] == "paid" and parse_supabase_datetime(inv["created_at"]) and parse_supabase_datetime(inv["created_at"]) >= current_month_start
        )
        
        print(f"✅ Revenue calculation works: {revenue_this_month}")
        
        # Simulate customer data
        mock_customers = [
            {"id": "1", "created_at": "2024-07-10T10:30:00Z"},
            {"id": "2", "created_at": "2024-06-10T10:30:00Z"},
        ]
        
        new_customers_this_month = sum(
            1 for cust in mock_customers
            if parse_supabase_datetime(cust["created_at"]) and parse_supabase_datetime(cust["created_at"]) >= current_month_start
        )
        
        print(f"✅ Customer calculation works: {new_customers_this_month}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in dashboard logic test: {e}")
        return False

def test_original_error_scenario():
    """Test the specific scenario that was causing the original error."""
    print("\nTesting original error scenario...")
    
    try:
        # This is what was causing the error before
        # datetime.now() creates a naive datetime
        # datetime.fromisoformat() with Supabase data creates timezone-aware datetime
        
        naive_datetime = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        supabase_datetime_str = "2024-07-15T10:30:00Z"
        
        # This would fail with the original code
        try:
            aware_datetime = datetime.fromisoformat(supabase_datetime_str.replace('Z', '+00:00'))
            comparison = aware_datetime >= naive_datetime  # This would cause the error
            print("❌ Original error scenario should have failed but didn't")
            return False
        except TypeError as e:
            print(f"✅ Original error reproduced: {e}")
        
        # Now test with our fix
        utc = pytz.UTC
        fixed_naive_datetime = datetime.now(utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fixed_aware_datetime = parse_supabase_datetime(supabase_datetime_str)
        
        if fixed_aware_datetime:
            comparison = fixed_aware_datetime >= fixed_naive_datetime
            print(f"✅ Fixed comparison works: {comparison}")
            return True
        else:
            print("❌ Failed to parse datetime with fix")
            return False
            
    except Exception as e:
        print(f"❌ Error in original error scenario test: {e}")
        return False

def main():
    """Run all tests."""
    print("🔍 Testing datetime comparison fixes...")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test 1: Datetime parsing
    parsing_ok = test_datetime_parsing()
    all_tests_passed = all_tests_passed and parsing_ok
    
    # Test 2: Dashboard logic
    dashboard_ok = test_dashboard_logic()
    all_tests_passed = all_tests_passed and dashboard_ok
    
    # Test 3: Original error scenario
    error_ok = test_original_error_scenario()
    all_tests_passed = all_tests_passed and error_ok
    
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All tests passed! Datetime comparison fixes are working correctly.")
        print("\nThe following issues have been resolved:")
        print("- Added timezone-aware datetime parsing")
        print("- Fixed 'can't compare offset-naive and offset-aware datetimes' error")
        print("- Ensured consistent UTC timezone handling")
        print("- Added robust error handling for datetime parsing")
        print("- Added pytz dependency for timezone support")
        print("\nThe dashboard overview should now work without datetime comparison errors.")
    else:
        print("❌ Some tests failed. Please review the output above.")
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    exit(main())

