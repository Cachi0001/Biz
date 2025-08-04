#!/usr/bin/env python3
"""
Test script for Daily Expiration Checker
Run this to test the daily expiration check functionality
"""

import os
import sys
from pathlib import Path

# Add the src directory to the path
sys.path.append(str(Path(__file__).parent / 'src'))

try:
    from scripts.daily_expiration_check import DailyExpirationChecker
    print("✅ Successfully imported DailyExpirationChecker")
except ImportError as e:
    print(f"❌ Failed to import DailyExpirationChecker: {e}")
    sys.exit(1)

def test_daily_checker():
    """Test the daily expiration checker"""
    print("\n🧪 Testing Daily Expiration Checker")
    print("=" * 50)
    
    try:
        # Create the checker
        checker = DailyExpirationChecker()
        print("✅ DailyExpirationChecker created successfully")
        
        # Test the Flask app context
        with checker.app.app_context():
            print("✅ Flask app context working")
            
            # Test Supabase connection
            supabase = checker.app.config.get('SUPABASE')
            if supabase:
                print("✅ Supabase client configured")
            else:
                print("❌ Supabase client not configured")
                return False
        
        print("\n🚀 Running daily expiration check...")
        success = checker.run_daily_check()
        
        if success:
            print("\n✅ Daily expiration check completed successfully!")
            
            # Print statistics
            stats = checker.stats
            print(f"\n📊 Execution Statistics:")
            print(f"   - Expired subscriptions found: {stats['expired_found']}")
            print(f"   - Successfully downgraded: {stats['successfully_downgraded']}")
            print(f"   - Warnings sent: {stats['warnings_sent']}")
            print(f"   - Errors: {stats['errors']}")
            
            duration = (stats['end_time'] - stats['start_time']).total_seconds()
            print(f"   - Execution time: {duration:.2f} seconds")
            
            return True
        else:
            print("\n❌ Daily expiration check failed!")
            return False
            
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_individual_services():
    """Test individual services used by the daily checker"""
    print("\n🔧 Testing Individual Services")
    print("=" * 50)
    
    try:
        from services.auto_downgrade_service import AutoDowngradeService
        from services.subscription_expiration_monitor import SubscriptionExpirationMonitor
        from services.real_time_day_calculator import RealTimeDayCalculator
        
        print("✅ All service imports successful")
        
        # Test with minimal Flask context
        from flask import Flask
        from dotenv import load_dotenv
        from supabase import create_client
        
        load_dotenv()
        
        app = Flask(__name__)
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Supabase credentials not configured")
            return False
        
        supabase_client = create_client(supabase_url, supabase_key)
        app.config['SUPABASE'] = supabase_client
        
        with app.app_context():
            # Test RealTimeDayCalculator
            day_calculator = RealTimeDayCalculator()
            print("✅ RealTimeDayCalculator initialized")
            
            # Test SubscriptionExpirationMonitor
            expiration_monitor = SubscriptionExpirationMonitor()
            expired_users = expiration_monitor.get_expired_subscriptions()
            print(f"✅ SubscriptionExpirationMonitor working - found {len(expired_users)} expired subscriptions")
            
            # Test AutoDowngradeService
            auto_downgrade = AutoDowngradeService()
            candidates = auto_downgrade.get_downgrade_candidates()
            print(f"✅ AutoDowngradeService working - found {len(candidates)} downgrade candidates")
        
        return True
        
    except Exception as e:
        print(f"❌ Service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Daily Expiration Checker Test Suite")
    print("=" * 60)
    
    # Test individual services first
    services_ok = test_individual_services()
    
    if services_ok:
        # Test the full daily checker
        checker_ok = test_daily_checker()
        
        if checker_ok:
            print("\n🎉 All tests passed! Daily expiration checker is ready for production.")
            sys.exit(0)
        else:
            print("\n❌ Daily checker test failed!")
            sys.exit(1)
    else:
        print("\n❌ Service tests failed!")
        sys.exit(1)