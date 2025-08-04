"""
Unit tests for Real-time Day Calculator Service
Tests various timezone scenarios, edge cases, and date calculations
"""

import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
import sys
import os

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from services.real_time_day_calculator import RealTimeDayCalculator

class TestRealTimeDayCalculator(unittest.TestCase):
    """Test cases for RealTimeDayCalculator"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.calculator = RealTimeDayCalculator()
        
        # Fixed test time for consistent testing
        self.test_now = datetime(2025, 8, 4, 12, 0, 0, tzinfo=timezone.utc)
        
    def test_calculate_remaining_days_valid_future_date(self):
        """Test calculating days remaining for a valid future date"""
        # Test date 10 days in the future
        future_date = (self.test_now + timedelta(days=10)).isoformat()
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.calculate_remaining_days(future_date)
            self.assertEqual(result, 10)
    
    def test_calculate_remaining_days_expired_date(self):
        """Test calculating days remaining for an expired date"""
        # Test date 5 days in the past
        past_date = (self.test_now - timedelta(days=5)).isoformat()
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.calculate_remaining_days(past_date)
            self.assertEqual(result, 0)  # Should never return negative
    
    def test_calculate_remaining_days_empty_date(self):
        """Test calculating days remaining with empty date"""
        result = self.calculator.calculate_remaining_days("")
        self.assertEqual(result, 0)
        
        result = self.calculator.calculate_remaining_days(None)
        self.assertEqual(result, 0)
    
    def test_calculate_remaining_days_invalid_date_format(self):
        """Test calculating days remaining with invalid date format"""
        result = self.calculator.calculate_remaining_days("invalid-date")
        self.assertEqual(result, 0)
        
        result = self.calculator.calculate_remaining_days("2025-13-45")  # Invalid date
        self.assertEqual(result, 0)
    
    def test_calculate_remaining_days_timezone_handling(self):
        """Test timezone handling in date calculations"""
        # Test with Z suffix (UTC)
        future_date_z = (self.test_now + timedelta(days=7)).isoformat().replace('+00:00', 'Z')
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.calculate_remaining_days(future_date_z)
            self.assertEqual(result, 7)
    
    def test_is_subscription_expired_active_subscription(self):
        """Test expiration check for active subscription"""
        future_date = (self.test_now + timedelta(days=5)).isoformat()
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.is_subscription_expired(future_date)
            self.assertFalse(result)
    
    def test_is_subscription_expired_expired_subscription(self):
        """Test expiration check for expired subscription"""
        past_date = (self.test_now - timedelta(days=1)).isoformat()
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.is_subscription_expired(past_date)
            self.assertTrue(result)
    
    def test_is_subscription_expired_edge_case_same_time(self):
        """Test expiration check when end date equals current time"""
        same_time = self.test_now.isoformat()
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.is_subscription_expired(same_time)
            self.assertTrue(result)  # Equal time should be considered expired
    
    def test_is_subscription_expired_invalid_input(self):
        """Test expiration check with invalid input"""
        result = self.calculator.is_subscription_expired("")
        self.assertTrue(result)  # Default to expired for safety
        
        result = self.calculator.is_subscription_expired(None)
        self.assertTrue(result)
        
        result = self.calculator.is_subscription_expired("invalid-date")
        self.assertTrue(result)
    
    def test_get_expiration_warnings_expired(self):
        """Test warning generation for expired subscription"""
        warnings = self.calculator.get_expiration_warnings(0)
        
        self.assertEqual(len(warnings), 1)
        self.assertEqual(warnings[0]['type'], 'expired')
        self.assertEqual(warnings[0]['urgency'], 'critical')
        self.assertTrue(warnings[0]['action_required'])
    
    def test_get_expiration_warnings_final_warning(self):
        """Test warning generation for 1 day remaining"""
        warnings = self.calculator.get_expiration_warnings(1)
        
        self.assertEqual(len(warnings), 1)
        self.assertEqual(warnings[0]['type'], 'final_warning')
        self.assertEqual(warnings[0]['urgency'], 'urgent')
        self.assertTrue(warnings[0]['action_required'])
    
    def test_get_expiration_warnings_urgent_warning(self):
        """Test warning generation for 2-3 days remaining"""
        for days in [2, 3]:
            warnings = self.calculator.get_expiration_warnings(days)
            
            self.assertEqual(len(warnings), 1)
            self.assertEqual(warnings[0]['type'], 'urgent_warning')
            self.assertEqual(warnings[0]['urgency'], 'high')
            self.assertTrue(warnings[0]['action_required'])
            self.assertEqual(warnings[0]['days_remaining'], days)
    
    def test_get_expiration_warnings_advance_warning(self):
        """Test warning generation for 4-7 days remaining"""
        for days in [4, 5, 6, 7]:
            warnings = self.calculator.get_expiration_warnings(days)
            
            self.assertEqual(len(warnings), 1)
            self.assertEqual(warnings[0]['type'], 'advance_warning')
            self.assertEqual(warnings[0]['urgency'], 'medium')
            self.assertFalse(warnings[0]['action_required'])
            self.assertEqual(warnings[0]['days_remaining'], days)
    
    def test_get_expiration_warnings_no_warnings(self):
        """Test warning generation for subscriptions with plenty of time"""
        warnings = self.calculator.get_expiration_warnings(30)
        self.assertEqual(len(warnings), 0)
        
        warnings = self.calculator.get_expiration_warnings(8)
        self.assertEqual(len(warnings), 0)
    
    def test_calculate_subscription_end_date(self):
        """Test calculation of subscription end date"""
        start_date = self.test_now.isoformat()
        duration_days = 30
        
        result = self.calculator.calculate_subscription_end_date(start_date, duration_days)
        
        # Parse the result and verify it's 30 days later
        expected_end = self.test_now + timedelta(days=30)
        result_date = datetime.fromisoformat(result.replace('Z', '+00:00'))
        
        self.assertEqual(result_date.date(), expected_end.date())
    
    def test_calculate_subscription_end_date_invalid_start(self):
        """Test calculation with invalid start date"""
        result = self.calculator.calculate_subscription_end_date("invalid-date", 30)
        
        # Should return a valid ISO date string (current time as fallback)
        self.assertIsInstance(result, str)
        # Should be parseable as ISO date
        datetime.fromisoformat(result.replace('Z', '+00:00'))
    
    def test_get_days_until_expiration_include_today(self):
        """Test days until expiration including today"""
        # End date at end of today (23:59:59)
        end_of_today = self.test_now.replace(hour=23, minute=59, second=59)
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.get_days_until_expiration(
                end_of_today.isoformat(), 
                include_today=True
            )
            self.assertEqual(result, 1)  # Should include today
    
    def test_get_days_until_expiration_exclude_today(self):
        """Test days until expiration excluding today"""
        # End date tomorrow
        tomorrow = self.test_now + timedelta(days=1)
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.get_days_until_expiration(
                tomorrow.isoformat(), 
                include_today=False
            )
            self.assertEqual(result, 1)  # Full day remaining
    
    def test_format_time_remaining_days_and_hours(self):
        """Test formatting time remaining with days and hours"""
        # 2 days, 5 hours, 30 minutes from now
        future_time = self.test_now + timedelta(days=2, hours=5, minutes=30)
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.format_time_remaining(future_time.isoformat())
            
            self.assertEqual(result['days'], 2)
            self.assertEqual(result['hours'], 5)
            self.assertEqual(result['minutes'], 30)
            self.assertEqual(result['formatted'], '2 days, 5 hours')
            self.assertFalse(result['is_expired'])
    
    def test_format_time_remaining_hours_only(self):
        """Test formatting time remaining with only hours"""
        # 3 hours, 45 minutes from now
        future_time = self.test_now + timedelta(hours=3, minutes=45)
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.format_time_remaining(future_time.isoformat())
            
            self.assertEqual(result['days'], 0)
            self.assertEqual(result['hours'], 3)
            self.assertEqual(result['minutes'], 45)
            self.assertEqual(result['formatted'], '3 hours, 45 minutes')
            self.assertFalse(result['is_expired'])
    
    def test_format_time_remaining_minutes_only(self):
        """Test formatting time remaining with only minutes"""
        # 15 minutes from now
        future_time = self.test_now + timedelta(minutes=15)
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.format_time_remaining(future_time.isoformat())
            
            self.assertEqual(result['days'], 0)
            self.assertEqual(result['hours'], 0)
            self.assertEqual(result['minutes'], 15)
            self.assertEqual(result['formatted'], '15 minutes')
            self.assertFalse(result['is_expired'])
    
    def test_format_time_remaining_expired(self):
        """Test formatting time remaining for expired subscription"""
        past_time = self.test_now - timedelta(hours=1)
        
        with patch('services.real_time_day_calculator.datetime') as mock_datetime:
            mock_datetime.now.return_value = self.test_now
            
            result = self.calculator.format_time_remaining(past_time.isoformat())
            
            self.assertEqual(result['days'], 0)
            self.assertEqual(result['hours'], 0)
            self.assertEqual(result['minutes'], 0)
            self.assertEqual(result['formatted'], 'Expired')
            self.assertTrue(result['is_expired'])
    
    def test_parse_and_normalize_date_iso_format(self):
        """Test parsing various ISO date formats"""
        test_cases = [
            "2025-08-04T12:00:00Z",
            "2025-08-04T12:00:00+00:00",
            "2025-08-04T12:00:00.000Z",
            "2025-08-04T12:00:00.000+00:00"
        ]
        
        for date_str in test_cases:
            result = self.calculator._parse_and_normalize_date(date_str)
            self.assertIsNotNone(result)
            self.assertEqual(result.tzinfo, timezone.utc)
    
    def test_parse_and_normalize_date_datetime_object(self):
        """Test parsing datetime objects"""
        # Test with timezone-aware datetime
        aware_dt = datetime(2025, 8, 4, 12, 0, 0, tzinfo=timezone.utc)
        result = self.calculator._parse_and_normalize_date(aware_dt)
        self.assertEqual(result, aware_dt)
        
        # Test with naive datetime (should assume UTC)
        naive_dt = datetime(2025, 8, 4, 12, 0, 0)
        result = self.calculator._parse_and_normalize_date(naive_dt)
        self.assertEqual(result.tzinfo, timezone.utc)
    
    def test_parse_and_normalize_date_invalid_input(self):
        """Test parsing invalid date inputs"""
        invalid_inputs = [
            "",
            None,
            "invalid-date",
            "2025-13-45",
            123,
            []
        ]
        
        for invalid_input in invalid_inputs:
            result = self.calculator._parse_and_normalize_date(invalid_input)
            self.assertIsNone(result)
    
    def test_validate_subscription_dates_valid(self):
        """Test validation of valid subscription dates"""
        start_date = self.test_now.isoformat()
        end_date = (self.test_now + timedelta(days=30)).isoformat()
        
        result = self.calculator.validate_subscription_dates(start_date, end_date)
        
        self.assertTrue(result['is_valid'])
        self.assertEqual(len(result['errors']), 0)
        self.assertEqual(result['duration_days'], 30)
        self.assertIsNotNone(result['parsed_start'])
        self.assertIsNotNone(result['parsed_end'])
    
    def test_validate_subscription_dates_invalid_start(self):
        """Test validation with invalid start date"""
        start_date = "invalid-date"
        end_date = (self.test_now + timedelta(days=30)).isoformat()
        
        result = self.calculator.validate_subscription_dates(start_date, end_date)
        
        self.assertFalse(result['is_valid'])
        self.assertGreater(len(result['errors']), 0)
        self.assertIn("Invalid start date format", result['errors'][0])
    
    def test_validate_subscription_dates_end_before_start(self):
        """Test validation when end date is before start date"""
        start_date = self.test_now.isoformat()
        end_date = (self.test_now - timedelta(days=1)).isoformat()
        
        result = self.calculator.validate_subscription_dates(start_date, end_date)
        
        self.assertFalse(result['is_valid'])
        self.assertIn("End date must be after start date", result['errors'])
    
    def test_validate_subscription_dates_unusual_duration(self):
        """Test validation with unusual subscription duration"""
        start_date = self.test_now.isoformat()
        
        # Test very long duration (2 years)
        long_end_date = (self.test_now + timedelta(days=730)).isoformat()
        result = self.calculator.validate_subscription_dates(start_date, long_end_date)
        
        self.assertTrue(result['is_valid'])  # Still valid, just unusual
        self.assertGreater(len(result['warnings']), 0)
        self.assertIn("Unusually long subscription duration", result['warnings'][0])

if __name__ == '__main__':
    unittest.main()