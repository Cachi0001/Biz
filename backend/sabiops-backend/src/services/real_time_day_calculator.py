"""
Real-time Day Calculator Service
Handles accurate subscription day calculations with proper timezone support
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import logging
from dateutil import parser
import pytz

logger = logging.getLogger(__name__)

class RealTimeDayCalculator:
    """Service for calculating accurate subscription days remaining with timezone support"""
    
    def __init__(self):
        """Initialize the calculator with UTC as default timezone"""
        self.default_timezone = timezone.utc
        
    def calculate_remaining_days(self, subscription_end_date: str, user_timezone: str = 'UTC') -> int:
        """
        Calculate accurate days remaining based on current time and subscription end date
        
        Args:
            subscription_end_date: ISO format date string or datetime object
            user_timezone: User's timezone (defaults to UTC for consistency)
            
        Returns:
            int: Number of days remaining (0 if expired, never negative)
        """
        try:
            if not subscription_end_date:
                logger.warning("No subscription end date provided")
                return 0
            
            # Parse and normalize the end date
            end_date = self._parse_and_normalize_date(subscription_end_date)
            if not end_date:
                logger.error(f"Could not parse subscription end date: {subscription_end_date}")
                return 0
            
            # Get current time in UTC
            now = datetime.now(timezone.utc)
            
            # Calculate remaining days
            remaining = (end_date - now).days
            
            # Never return negative days - expired subscriptions show 0
            result = max(0, remaining)
            
            logger.debug(f"Calculated {result} days remaining from {subscription_end_date}")
            return result
            
        except Exception as e:
            logger.error(f"Error calculating remaining days: {str(e)}", exc_info=True)
            return 0
    
    def is_subscription_expired(self, subscription_end_date: str) -> bool:
        """
        Check if a subscription has expired
        
        Args:
            subscription_end_date: ISO format date string
            
        Returns:
            bool: True if expired, False if still active
        """
        try:
            if not subscription_end_date:
                return True
            
            # Parse and normalize the end date
            end_date = self._parse_and_normalize_date(subscription_end_date)
            if not end_date:
                return True
            
            # Get current time in UTC
            now = datetime.now(timezone.utc)
            
            # Check if expired (end date has passed)
            is_expired = end_date <= now
            
            logger.debug(f"Subscription expired check: {is_expired} (end: {end_date}, now: {now})")
            return is_expired
            
        except Exception as e:
            logger.error(f"Error checking subscription expiration: {str(e)}")
            # Default to expired for safety
            return True
    
    def get_expiration_warnings(self, days_remaining: int) -> List[Dict[str, Any]]:
        """
        Get appropriate warning messages based on days remaining
        
        Args:
            days_remaining: Number of days left in subscription
            
        Returns:
            List of warning dictionaries with type, message, and urgency
        """
        warnings = []
        
        try:
            if days_remaining <= 0:
                warnings.append({
                    'type': 'expired',
                    'message': 'Your subscription has expired. Reactivate to continue using premium features.',
                    'urgency': 'critical',
                    'action_required': True,
                    'days_remaining': 0
                })
            elif days_remaining == 1:
                warnings.append({
                    'type': 'final_warning',
                    'message': 'Your subscription expires tomorrow! Renew now to avoid interruption.',
                    'urgency': 'urgent',
                    'action_required': True,
                    'days_remaining': days_remaining
                })
            elif days_remaining <= 3:
                warnings.append({
                    'type': 'urgent_warning',
                    'message': f'Your subscription expires in {days_remaining} days. Renew soon to avoid interruption.',
                    'urgency': 'high',
                    'action_required': True,
                    'days_remaining': days_remaining
                })
            elif days_remaining <= 7:
                warnings.append({
                    'type': 'advance_warning',
                    'message': f'Your subscription expires in {days_remaining} days. Consider renewing soon.',
                    'urgency': 'medium',
                    'action_required': False,
                    'days_remaining': days_remaining
                })
            
            return warnings
            
        except Exception as e:
            logger.error(f"Error generating expiration warnings: {str(e)}")
            return []
    
    def calculate_subscription_end_date(self, start_date: str, plan_duration_days: int) -> str:
        """
        Calculate subscription end date based on start date and plan duration
        
        Args:
            start_date: ISO format start date string
            plan_duration_days: Number of days in the plan
            
        Returns:
            str: ISO format end date string
        """
        try:
            # Parse and normalize the start date
            start = self._parse_and_normalize_date(start_date)
            if not start:
                logger.error(f"Could not parse start date: {start_date}")
                return datetime.now(timezone.utc).isoformat()
            
            # Calculate end date
            end_date = start + timedelta(days=plan_duration_days)
            
            return end_date.isoformat()
            
        except Exception as e:
            logger.error(f"Error calculating subscription end date: {str(e)}")
            # Return current time as fallback
            return datetime.now(timezone.utc).isoformat()
    
    def get_days_until_expiration(self, subscription_end_date: str, include_today: bool = True) -> int:
        """
        Get precise days until expiration with option to include current day
        
        Args:
            subscription_end_date: ISO format date string
            include_today: Whether to count today as a remaining day
            
        Returns:
            int: Days until expiration
        """
        try:
            if not subscription_end_date:
                return 0
            
            # Parse and normalize the end date
            end_date = self._parse_and_normalize_date(subscription_end_date)
            if not end_date:
                return 0
            
            # Get current time in UTC
            now = datetime.now(timezone.utc)
            
            # Calculate difference
            diff = end_date - now
            
            if include_today:
                # Include the current day in the count
                days = diff.days + (1 if diff.seconds > 0 else 0)
            else:
                # Only count full days remaining
                days = diff.days
            
            return max(0, days)
            
        except Exception as e:
            logger.error(f"Error calculating days until expiration: {str(e)}")
            return 0
    
    def format_time_remaining(self, subscription_end_date: str) -> Dict[str, Any]:
        """
        Format time remaining in a human-readable way
        
        Args:
            subscription_end_date: ISO format date string
            
        Returns:
            Dict with formatted time information
        """
        try:
            if not subscription_end_date:
                return {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'formatted': 'Expired',
                    'is_expired': True
                }
            
            # Parse and normalize the end date
            end_date = self._parse_and_normalize_date(subscription_end_date)
            if not end_date:
                return {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'formatted': 'Expired',
                    'is_expired': True
                }
            
            # Get current time in UTC
            now = datetime.now(timezone.utc)
            
            # Calculate difference
            diff = end_date - now
            
            if diff.total_seconds() <= 0:
                return {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'formatted': 'Expired',
                    'is_expired': True
                }
            
            days = diff.days
            hours, remainder = divmod(diff.seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            
            # Format the display string
            if days > 0:
                formatted = f"{days} day{'s' if days != 1 else ''}"
                if hours > 0:
                    formatted += f", {hours} hour{'s' if hours != 1 else ''}"
            elif hours > 0:
                formatted = f"{hours} hour{'s' if hours != 1 else ''}"
                if minutes > 0:
                    formatted += f", {minutes} minute{'s' if minutes != 1 else ''}"
            else:
                formatted = f"{minutes} minute{'s' if minutes != 1 else ''}"
            
            return {
                'days': days,
                'hours': hours,
                'minutes': minutes,
                'formatted': formatted,
                'is_expired': False
            }
            
        except Exception as e:
            logger.error(f"Error formatting time remaining: {str(e)}")
            return {
                'days': 0,
                'hours': 0,
                'minutes': 0,
                'formatted': 'Error',
                'is_expired': True
            }
    
    def _parse_and_normalize_date(self, date_input: str) -> Optional[datetime]:
        """
        Parse various date formats and normalize to UTC timezone
        
        Args:
            date_input: Date string in various formats
            
        Returns:
            datetime object in UTC timezone or None if parsing fails
        """
        try:
            if not date_input:
                return None
            
            # If it's already a datetime object, just ensure it's UTC
            if isinstance(date_input, datetime):
                if date_input.tzinfo is None:
                    # Assume UTC if no timezone info
                    return date_input.replace(tzinfo=timezone.utc)
                else:
                    # Convert to UTC
                    return date_input.astimezone(timezone.utc)
            
            # Parse string date
            if isinstance(date_input, str):
                # Handle common ISO formats
                if date_input.endswith('Z'):
                    # Replace Z with +00:00 for proper parsing
                    date_input = date_input.replace('Z', '+00:00')
                
                # Use dateutil parser for flexible parsing
                parsed_date = parser.isoparse(date_input)
                
                # Ensure timezone awareness
                if parsed_date.tzinfo is None:
                    # Assume UTC if no timezone info
                    parsed_date = parsed_date.replace(tzinfo=timezone.utc)
                else:
                    # Convert to UTC
                    parsed_date = parsed_date.astimezone(timezone.utc)
                
                return parsed_date
            
            logger.warning(f"Unsupported date input type: {type(date_input)}")
            return None
            
        except Exception as e:
            logger.error(f"Error parsing date '{date_input}': {str(e)}")
            return None
    
    def validate_subscription_dates(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Validate subscription start and end dates
        
        Args:
            start_date: ISO format start date string
            end_date: ISO format end date string
            
        Returns:
            Dict with validation results
        """
        try:
            validation_result = {
                'is_valid': True,
                'errors': [],
                'warnings': [],
                'parsed_start': None,
                'parsed_end': None,
                'duration_days': 0
            }
            
            # Parse start date
            parsed_start = self._parse_and_normalize_date(start_date)
            if not parsed_start:
                validation_result['is_valid'] = False
                validation_result['errors'].append(f"Invalid start date format: {start_date}")
            else:
                validation_result['parsed_start'] = parsed_start.isoformat()
            
            # Parse end date
            parsed_end = self._parse_and_normalize_date(end_date)
            if not parsed_end:
                validation_result['is_valid'] = False
                validation_result['errors'].append(f"Invalid end date format: {end_date}")
            else:
                validation_result['parsed_end'] = parsed_end.isoformat()
            
            # Validate date logic if both dates are valid
            if parsed_start and parsed_end:
                if parsed_end <= parsed_start:
                    validation_result['is_valid'] = False
                    validation_result['errors'].append("End date must be after start date")
                else:
                    duration = (parsed_end - parsed_start).days
                    validation_result['duration_days'] = duration
                    
                    # Add warnings for unusual durations
                    if duration > 365:
                        validation_result['warnings'].append(f"Unusually long subscription duration: {duration} days")
                    elif duration < 1:
                        validation_result['warnings'].append(f"Very short subscription duration: {duration} days")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating subscription dates: {str(e)}")
            return {
                'is_valid': False,
                'errors': [f"Validation error: {str(e)}"],
                'warnings': [],
                'parsed_start': None,
                'parsed_end': None,
                'duration_days': 0
            }