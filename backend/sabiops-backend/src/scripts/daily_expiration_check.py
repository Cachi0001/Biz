#!/usr/bin/env python3
"""
Daily Expiration Check Script
Runs automated subscription expiration checks and downgrades
This script should be run daily via cron job at 00:00 UTC
"""

import os
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path

# Add the parent directory to the path so we can import from src
sys.path.append(str(Path(__file__).parent.parent))

try:
    from flask import Flask
    from dotenv import load_dotenv
    from supabase import create_client
    
    # Import our services
    from services.auto_downgrade_service import AutoDowngradeService
    from services.subscription_expiration_monitor import SubscriptionExpirationMonitor
    from services.real_time_day_calculator import RealTimeDayCalculator
    
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please ensure all dependencies are installed")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('daily_expiration_check.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class DailyExpirationChecker:
    """Main class for daily expiration checking"""
    
    def __init__(self):
        """Initialize the checker with Flask app context"""
        self.app = self._create_flask_app()
        self.stats = {
            'start_time': datetime.now(timezone.utc),
            'end_time': None,
            'expired_found': 0,
            'successfully_downgraded': 0,
            'warnings_sent': 0,
            'errors': 0,
            'total_processed': 0
        }
    
    def _create_flask_app(self):
        """Create minimal Flask app for service context"""
        app = Flask(__name__)
        
        # Configure Supabase
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")
        
        supabase_client = create_client(supabase_url, supabase_key)
        app.config['SUPABASE'] = supabase_client
        
        return app
    
    def run_daily_check(self):
        """Run the complete daily expiration check process"""
        logger.info("=" * 60)
        logger.info("Starting Daily Subscription Expiration Check")
        logger.info(f"Execution time: {self.stats['start_time'].isoformat()}")
        logger.info("=" * 60)
        
        try:
            with self.app.app_context():
                # Step 1: Process expired subscriptions
                self._process_expired_subscriptions()
                
                # Step 2: Send expiration warnings
                self._send_expiration_warnings()
                
                # Step 3: Generate summary report
                self._generate_summary_report()
                
            self.stats['end_time'] = datetime.now(timezone.utc)
            logger.info("Daily expiration check completed successfully")
            return True
            
        except Exception as e:
            self.stats['errors'] += 1
            self.stats['end_time'] = datetime.now(timezone.utc)
            logger.error(f"Daily expiration check failed: {str(e)}", exc_info=True)
            return False
    
    def _process_expired_subscriptions(self):
        """Process and downgrade expired subscriptions"""
        logger.info("Step 1: Processing expired subscriptions...")
        
        try:
            auto_downgrade_service = AutoDowngradeService()
            
            # Get expired subscriptions
            expired_users = auto_downgrade_service.get_downgrade_candidates()
            self.stats['expired_found'] = len(expired_users)
            
            logger.info(f"Found {len(expired_users)} expired subscriptions to process")
            
            if not expired_users:
                logger.info("No expired subscriptions found")
                return
            
            # Process each expired subscription
            for user in expired_users:
                try:
                    user_id = user['user_id']
                    current_plan = user['current_plan']
                    
                    logger.info(f"Processing expired subscription for user {user_id} (plan: {current_plan})")
                    
                    # Downgrade the user
                    downgrade_result = auto_downgrade_service.downgrade_user_to_free(user_id)
                    
                    if downgrade_result['success']:
                        self.stats['successfully_downgraded'] += 1
                        
                        # Reset usage limits
                        if auto_downgrade_service.reset_usage_limits_to_free(user_id):
                            logger.info(f"Successfully downgraded and reset limits for user {user_id}")
                        else:
                            logger.warning(f"Downgraded user {user_id} but failed to reset usage limits")
                        
                        # Log the action
                        auto_downgrade_service.log_downgrade_action(
                            user_id, 
                            f"Daily automated downgrade from {current_plan} due to expiration"
                        )
                        
                    else:
                        self.stats['errors'] += 1
                        logger.error(f"Failed to downgrade user {user_id}: {downgrade_result.get('error')}")
                        
                except Exception as e:
                    self.stats['errors'] += 1
                    logger.error(f"Error processing user {user.get('user_id', 'unknown')}: {str(e)}")
            
            logger.info(f"Expired subscription processing completed: {self.stats['successfully_downgraded']}/{self.stats['expired_found']} successful")
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Error in _process_expired_subscriptions: {str(e)}")
    
    def _send_expiration_warnings(self):
        """Send expiration warnings to users with subscriptions expiring soon"""
        logger.info("Step 2: Sending expiration warnings...")
        
        try:
            expiration_monitor = SubscriptionExpirationMonitor()
            
            # Process warnings for different time thresholds
            warning_thresholds = [7, 3, 1]  # 7 days, 3 days, 1 day
            
            for threshold in warning_thresholds:
                try:
                    logger.info(f"Processing {threshold}-day expiration warnings...")
                    
                    # Get users expiring within threshold
                    expiring_users = expiration_monitor.get_expiring_subscriptions(threshold)
                    
                    # Filter to only users who need warnings for this specific threshold
                    users_needing_warnings = []
                    for user in expiring_users:
                        days_remaining = user['remaining_days']
                        if days_remaining == threshold:
                            users_needing_warnings.append(user)
                    
                    logger.info(f"Found {len(users_needing_warnings)} users needing {threshold}-day warnings")
                    
                    # Send warnings
                    for user in users_needing_warnings:
                        try:
                            success = expiration_monitor.trigger_expiration_warnings(
                                user['user_id'], 
                                user['remaining_days']
                            )
                            
                            if success:
                                self.stats['warnings_sent'] += 1
                                logger.info(f"Sent {threshold}-day warning to user {user['user_id']}")
                            else:
                                self.stats['errors'] += 1
                                logger.error(f"Failed to send {threshold}-day warning to user {user['user_id']}")
                                
                        except Exception as e:
                            self.stats['errors'] += 1
                            logger.error(f"Error sending warning to user {user['user_id']}: {str(e)}")
                    
                except Exception as e:
                    self.stats['errors'] += 1
                    logger.error(f"Error processing {threshold}-day warnings: {str(e)}")
            
            logger.info(f"Expiration warning processing completed: {self.stats['warnings_sent']} warnings sent")
            
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Error in _send_expiration_warnings: {str(e)}")
    
    def _generate_summary_report(self):
        """Generate and log summary report"""
        logger.info("Step 3: Generating summary report...")
        
        try:
            duration = (self.stats['end_time'] or datetime.now(timezone.utc)) - self.stats['start_time']
            
            logger.info("=" * 60)
            logger.info("DAILY EXPIRATION CHECK SUMMARY REPORT")
            logger.info("=" * 60)
            logger.info(f"Execution Time: {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S UTC')}")
            logger.info(f"Duration: {duration.total_seconds():.2f} seconds")
            logger.info("")
            logger.info("EXPIRED SUBSCRIPTIONS:")
            logger.info(f"  - Found: {self.stats['expired_found']}")
            logger.info(f"  - Successfully downgraded: {self.stats['successfully_downgraded']}")
            logger.info("")
            logger.info("EXPIRATION WARNINGS:")
            logger.info(f"  - Warnings sent: {self.stats['warnings_sent']}")
            logger.info("")
            logger.info("ERRORS:")
            logger.info(f"  - Total errors: {self.stats['errors']}")
            logger.info("")
            
            # Calculate success rate
            total_operations = self.stats['expired_found'] + self.stats['warnings_sent']
            if total_operations > 0:
                success_rate = ((self.stats['successfully_downgraded'] + self.stats['warnings_sent']) / total_operations) * 100
                logger.info(f"SUCCESS RATE: {success_rate:.1f}%")
            else:
                logger.info("SUCCESS RATE: N/A (no operations performed)")
            
            logger.info("=" * 60)
            
            # Store summary in database for monitoring
            self._store_execution_summary()
            
        except Exception as e:
            logger.error(f"Error generating summary report: {str(e)}")
    
    def _store_execution_summary(self):
        """Store execution summary in database for monitoring"""
        try:
            summary_data = {
                'execution_date': self.stats['start_time'].date().isoformat(),
                'start_time': self.stats['start_time'].isoformat(),
                'end_time': (self.stats['end_time'] or datetime.now(timezone.utc)).isoformat(),
                'expired_found': self.stats['expired_found'],
                'successfully_downgraded': self.stats['successfully_downgraded'],
                'warnings_sent': self.stats['warnings_sent'],
                'errors': self.stats['errors'],
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Try to store in database (create table if it doesn't exist)
            try:
                supabase = self.app.config['SUPABASE']
                supabase.table('daily_expiration_logs').insert(summary_data).execute()
                logger.info("Execution summary stored in database")
            except Exception as e:
                logger.warning(f"Could not store execution summary in database: {str(e)}")
                # This is not critical, so we continue
                
        except Exception as e:
            logger.error(f"Error storing execution summary: {str(e)}")

def main():
    """Main entry point for the script"""
    try:
        checker = DailyExpirationChecker()
        success = checker.run_daily_check()
        
        if success:
            logger.info("Daily expiration check completed successfully")
            sys.exit(0)
        else:
            logger.error("Daily expiration check failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Fatal error in daily expiration check: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()