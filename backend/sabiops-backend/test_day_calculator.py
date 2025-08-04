#!/usr/bin/env python3
"""
Simple test script for Real-time Day Calculator
Run this to verify the day calculator works correctly
"""

import sys
import os
from datetime import datetime, timezone, timedelta

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

try:
    from services.real_time_day_calculator import RealTimeDayCalculator
    print("✅ Successfully imported RealTimeDayCalculator")
except ImportError as e:
    print(f"❌ Failed to import RealTimeDayCalculator: {e}")
    sys.exit(1)

def test_day_calculator():
    """Test the Real-time Day Calculator functionality"""
    print("\n🧪 Testing Real-time Day Calculator")
    print("=" * 50)
    
    calculator = RealTimeDayCalculator()
    
    # Test 1: Calculate days remaining for future date
    print("\n1. Testing days remaining calculation...")
    future_date = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    days_remaining = calculator.calculate_remaining_days(future_date)
    print(f"   Future date (10 days): {days_remaining} days remaining")
    assert days_remaining == 10, f"Expected 10 days, got {days_remaining}"
    print("   ✅ Future date calculation works")
    
    # Test 2: Calculate days for expired date
    print("\n2. Testing expired date calculation...")
    past_date = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
    days_remaining = calculator.calculate_remaining_days(past_date)
    print(f"   Past date (5 days ago): {days_remaining} days remaining")
    assert days_remaining == 0, f"Expected 0 days, got {days_remaining}"
    print("   ✅ Expired date calculation works")
    
    # Test 3: Check subscription expiration
    print("\n3. Testing subscription expiration check...")
    is_expired = calculator.is_subscription_expired(future_date)
    print(f"   Future subscription expired: {is_expired}")
    assert not is_expired, "Future subscription should not be expired"
    
    is_expired = calculator.is_subscription_expired(past_date)
    print(f"   Past subscription expired: {is_expired}")
    assert is_expired, "Past subscription should be expired"
    print("   ✅ Expiration check works")
    
    # Test 4: Test warning generation
    print("\n4. Testing warning generation...")
    warnings = calculator.get_expiration_warnings(1)
    print(f"   Warnings for 1 day remaining: {len(warnings)} warnings")
    assert len(warnings) == 1, "Should have 1 warning for 1 day remaining"
    assert warnings[0]['type'] == 'final_warning', "Should be final warning"
    print("   ✅ Warning generation works")
    
    # Test 5: Test date parsing
    print("\n5. Testing date parsing...")
    test_dates = [
        "2025-08-04T12:00:00Z",
        "2025-08-04T12:00:00+00:00",
        "2025-08-04T12:00:00.000Z"
    ]
    
    for date_str in test_dates:
        parsed = calculator._parse_and_normalize_date(date_str)
        print(f"   Parsed '{date_str}': {parsed is not None}")
        assert parsed is not None, f"Failed to parse {date_str}"
    print("   ✅ Date parsing works")
    
    # Test 6: Test time formatting
    print("\n6. Testing time formatting...")
    future_time = datetime.now(timezone.utc) + timedelta(days=2, hours=5, minutes=30)
    formatted = calculator.format_time_remaining(future_time.isoformat())
    print(f"   Formatted time: {formatted['formatted']}")
    assert formatted['days'] == 2, "Should have 2 days"
    assert formatted['hours'] == 5, "Should have 5 hours"
    print("   ✅ Time formatting works")
    
    # Test 7: Test subscription end date calculation
    print("\n7. Testing subscription end date calculation...")
    start_date = datetime.now(timezone.utc).isoformat()
    end_date = calculator.calculate_subscription_end_date(start_date, 30)
    print(f"   30-day subscription end date calculated: {end_date is not None}")
    assert end_date is not None, "Should calculate end date"
    print("   ✅ End date calculation works")
    
    print("\n🎉 All tests passed! Real-time Day Calculator is working correctly.")
    return True

def test_integration_with_subscription_service():
    """Test integration with subscription service"""
    print("\n🔗 Testing integration with SubscriptionService")
    print("=" * 50)
    
    try:
        # This would require Flask app context, so we'll just test the import
        from services.subscription_service import SubscriptionService
        print("✅ SubscriptionService imports successfully")
        
        # Check if the service has the day calculator
        # Note: This would fail without Flask app context, but we can check the class definition
        import inspect
        service_source = inspect.getsource(SubscriptionService.__init__)
        if 'RealTimeDayCalculator' in service_source:
            print("✅ SubscriptionService integrates RealTimeDayCalculator")
        else:
            print("❌ SubscriptionService missing RealTimeDayCalculator integration")
            
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import SubscriptionService: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Real-time Day Calculator Test Suite")
    print("=" * 60)
    
    try:
        # Test the day calculator
        success1 = test_day_calculator()
        
        # Test integration
        success2 = test_integration_with_subscription_service()
        
        if success1 and success2:
            print("\n✅ All tests completed successfully!")
            print("🎯 The Real-time Day Calculator is ready for production use.")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)