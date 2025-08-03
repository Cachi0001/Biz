"""
Notification Scheduler
Runs business triggers on a schedule to monitor for notification conditions
"""

import logging
import asyncio
import schedule
import time
from datetime import datetime, timezone
from typing import Dict, Any, List
from threading import Thread

from .business_trigger_manager import create_trigger_manager
from .triggers.low_stock_trigger import run_low_stock_check, monitor_inventory_changes
from .triggers.overdue_invoice_trigger import run_overdue_invoice_check

logger = logging.getLogger(__name__)

class NotificationScheduler:
    """Schedules and runs notification triggers"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.trigger_manager = create_trigger_manager(supabase_client)
        self.logger = logging.getLogger(__name__)
        self.running = False
        self.scheduler_thread = None
    
    def setup_schedules(self):
        """Set up the notification schedules"""
        try:
            # Clear any existing schedules
            schedule.clear()
            
            # Low stock checks - every 2 hours during business hours
            schedule.every(2).hours.do(self._run_low_stock_check)
            
            # Overdue invoice checks - daily at 9 AM
            schedule.every().day.at("09:00").do(self._run_overdue_invoice_check)
            
            # Inventory change monitoring - every 30 minutes
            schedule.every(30).minutes.do(self._monitor_inventory_changes)
            
            # Full trigger manager run - every 4 hours
            schedule.every(4).hours.do(self._run_all_triggers)
            
            # Usage limit checks - every 6 hours
            schedule.every(6).hours.do(self._run_usage_limit_check)
            
            # Subscription expiry checks - daily at 8 AM
            schedule.every().day.at("08:00").do(self._run_subscription_expiry_check)
            
            # Profit alert checks - daily at 10 PM (end of business day)
            schedule.every().day.at("22:00").do(self._run_profit_alert_check)
            
            self.logger.info("Notification schedules set up successfully")
            
        except Exception as e:
            self.logger.error(f"Error setting up schedules: {str(e)}")
    
    def start(self):
        """Start the scheduler in a background thread"""
        if self.running:
            self.logger.warning("Scheduler is already running")
            return
        
        self.setup_schedules()
        self.running = True
        
        def run_scheduler():
            self.logger.info("Notification scheduler started")
            while self.running:
                try:
                    schedule.run_pending()
                    time.sleep(60)  # Check every minute
                except Exception as e:
                    self.logger.error(f"Error in scheduler loop: {str(e)}")
                    time.sleep(60)
        
        self.scheduler_thread = Thread(target=run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        self.logger.info("Notification scheduler thread started")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        schedule.clear()
        self.logger.info("Notification scheduler stopped")
    
    def _run_low_stock_check(self):
        """Run low stock check"""
        try:
            self.logger.info("Running scheduled low stock check...")
            result = asyncio.run(run_low_stock_check(self.supabase))
            self.logger.info(f"Low stock check completed: {result.get('notifications_sent', 0)} notifications sent")
        except Exception as e:
            self.logger.error(f"Error in scheduled low stock check: {str(e)}")
    
    def _monitor_inventory_changes(self):
        """Monitor recent inventory changes"""
        try:
            self.logger.info("Monitoring inventory changes...")
            result = asyncio.run(monitor_inventory_changes(self.supabase))
            self.logger.info(f"Inventory monitoring completed: {result.get('notifications_sent', 0)} notifications sent")
        except Exception as e:
            self.logger.error(f"Error in inventory monitoring: {str(e)}")
    
    def _run_overdue_invoice_check(self):
        """Run overdue invoice check"""
        try:
            self.logger.info("Running scheduled overdue invoice check...")
            result = asyncio.run(run_overdue_invoice_check(self.supabase))
            self.logger.info(f"Overdue invoice check completed: {result.get('notifications_sent', 0)} notifications sent")
        except Exception as e:
            self.logger.error(f"Error in scheduled overdue invoice check: {str(e)}")
    
    def _run_all_triggers(self):
        """Run all business triggers"""
        try:
            self.logger.info("Running all business triggers...")
            result = asyncio.run(self.trigger_manager.run_all_triggers())
            
            total_notifications = sum(
                trigger_result.notifications_sent 
                for trigger_result in result.values() 
                if hasattr(trigger_result, 'notifications_sent')
            )
            
            self.logger.info(f"All triggers completed: {total_notifications} total notifications sent")
        except Exception as e:
            self.logger.error(f"Error running all triggers: {str(e)}")
    
    def _run_usage_limit_check(self):
        """Run usage limit check"""
        try:
            self.logger.info("Running usage limit check...")
            # This would be implemented when we have the usage limit trigger
            self.logger.info("Usage limit check completed (placeholder)")
        except Exception as e:
            self.logger.error(f"Error in usage limit check: {str(e)}")
    
    def _run_subscription_expiry_check(self):
        """Run subscription expiry check"""
        try:
            self.logger.info("Running subscription expiry check...")
            # This would be implemented when we have the subscription expiry trigger
            self.logger.info("Subscription expiry check completed (placeholder)")
        except Exception as e:
            self.logger.error(f"Error in subscription expiry check: {str(e)}")
    
    def _run_profit_alert_check(self):
        """Run profit alert check"""
        try:
            self.logger.info("Running profit alert check...")
            # This would be implemented when we have the profit alert trigger
            self.logger.info("Profit alert check completed (placeholder)")
        except Exception as e:
            self.logger.error(f"Error in profit alert check: {str(e)}")
    
    def run_manual_check(self, check_type: str = "all") -> Dict[str, Any]:
        """Run a manual check of specific type"""
        try:
            self.logger.info(f"Running manual {check_type} check...")
            
            if check_type == "low_stock":
                result = asyncio.run(run_low_stock_check(self.supabase))
            elif check_type == "overdue_invoice":
                result = asyncio.run(run_overdue_invoice_check(self.supabase))
            elif check_type == "inventory_changes":
                result = asyncio.run(monitor_inventory_changes(self.supabase))
            elif check_type == "all":
                result = asyncio.run(self.trigger_manager.run_all_triggers())
            else:
                return {
                    "status": "error",
                    "error": f"Unknown check type: {check_type}"
                }
            
            return {
                "status": "completed",
                "check_type": check_type,
                "result": result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error in manual {check_type} check: {str(e)}")
            return {
                "status": "error",
                "check_type": check_type,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def get_schedule_status(self) -> Dict[str, Any]:
        """Get current schedule status"""
        try:
            jobs = []
            for job in schedule.jobs:
                jobs.append({
                    "job": str(job.job_func),
                    "next_run": job.next_run.isoformat() if job.next_run else None,
                    "interval": str(job.interval),
                    "unit": job.unit
                })
            
            return {
                "status": "running" if self.running else "stopped",
                "total_jobs": len(schedule.jobs),
                "jobs": jobs,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting schedule status: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Global scheduler instance
_scheduler_instance = None

def get_scheduler(supabase_client) -> NotificationScheduler:
    """Get or create the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = NotificationScheduler(supabase_client)
    return _scheduler_instance

def start_notification_scheduler(supabase_client):
    """Start the notification scheduler"""
    scheduler = get_scheduler(supabase_client)
    scheduler.start()
    return scheduler

def stop_notification_scheduler():
    """Stop the notification scheduler"""
    global _scheduler_instance
    if _scheduler_instance:
        _scheduler_instance.stop()
        _scheduler_instance = None