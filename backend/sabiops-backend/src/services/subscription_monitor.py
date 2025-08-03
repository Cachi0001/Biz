"""
Subscription Monitor Service
Handles real-time subscription monitoring and automatic status updates
"""

import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from threading import Thread
import time

logger = logging.getLogger(__name__)

class SubscriptionMonitor:
    """Service for monitoring and updating subscription statuses"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.logger = logging.getLogger(__name__)
        self.is_monitoring = False
        self.monitor_thread = None
        self.check_interval = 300  # 5 minutes
        
    def start_monitoring(self):
        """Start the subscription monitoring service"""
        if self.is_monitoring:
            self.logger.warning("Subscription monitoring is already running")
            return
            
        self.logger.info("Starting subscription monitoring service...")
        self.is_monitoring = True
        
        # Start monitoring in a separate thread
        self.monitor_thread = Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        
    def stop_monitoring(self):
        """Stop the subscription monitoring service"""
        if not self.is_monitoring:
            return
            
        self.logger.info("Stopping subscription monitoring service...")
        self.is_monitoring = False
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=10)
            
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                # Check for expired subscriptions
                expired_count = self.expire_old_subscriptions()
                if expired_count > 0:
                    self.logger.info(f"Expired {expired_count} subscriptions")
                
                # Check for expiring soon subscriptions
                expiring_count = self.check_expiring_subscriptions()
                if expiring_count > 0:
                    self.logger.info(f"Found {expiring_count} subscriptions expiring soon")
                
                # Update subscription metrics
                self.update_subscription_metrics()
                
                # Sleep for the check interval
                time.sleep(self.check_interval)
                
            except Exception as e:
                self.logger.error(f"Error in subscription monitoring loop: {str(e)}")
                time.sleep(60)  # Wait 1 minute before retrying on error
                
    def expire_old_subscriptions(self) -> int:
        """Find and expire old subscriptions"""
        try:
            now = datetime.now(timezone.utc)
            
            # Update expired subscriptions
            result = self.supabase.table('user_subscriptions').update({\n                'status': 'expired',\n                'updated_at': now.isoformat()\n            }).eq('status', 'active').lt('end_date', now.isoformat()).execute()\n            \n            expired_count = len(result.data) if result.data else 0\n            \n            if expired_count > 0:\n                self.logger.info(f\"Marked {expired_count} subscriptions as expired\")\n                \n                # Send notifications for expired subscriptions\n                self._notify_expired_subscriptions(result.data)\n            \n            return expired_count\n            \n        except Exception as e:\n            self.logger.error(f\"Error expiring old subscriptions: {str(e)}\")\n            return 0\n    \n    def check_expiring_subscriptions(self) -> int:\n        \"\"\"Check for subscriptions expiring within 7 days\"\"\"\n        try:\n            now = datetime.now(timezone.utc)\n            warning_date = now + timedelta(days=7)\n            \n            # Find subscriptions expiring within 7 days\n            result = self.supabase.table('user_subscriptions').select(\n                'id, user_id, end_date, plan_id'\n            ).eq('status', 'active').gte(\n                'end_date', now.isoformat()\n            ).lte(\n                'end_date', warning_date.isoformat()\n            ).execute()\n            \n            expiring_subscriptions = result.data or []\n            \n            if expiring_subscriptions:\n                self.logger.info(f\"Found {len(expiring_subscriptions)} subscriptions expiring soon\")\n                \n                # Send expiring soon notifications\n                self._notify_expiring_subscriptions(expiring_subscriptions)\n            \n            return len(expiring_subscriptions)\n            \n        except Exception as e:\n            self.logger.error(f\"Error checking expiring subscriptions: {str(e)}\")\n            return 0\n    \n    def update_subscription_metrics(self):\n        \"\"\"Update subscription-related metrics\"\"\"\n        try:\n            # This could update analytics, usage statistics, etc.\n            # For now, just log that we're updating metrics\n            self.logger.debug(\"Updating subscription metrics...\")\n            \n        except Exception as e:\n            self.logger.error(f\"Error updating subscription metrics: {str(e)}\")\n    \n    def _notify_expired_subscriptions(self, expired_subscriptions: List[Dict]):\n        \"\"\"Send notifications for expired subscriptions\"\"\"\n        try:\n            for subscription in expired_subscriptions:\n                user_id = subscription.get('user_id')\n                if user_id:\n                    # Create notification record\n                    notification_data = {\n                        'user_id': user_id,\n                        'type': 'subscription_expired',\n                        'title': 'Subscription Expired',\n                        'message': 'Your subscription has expired. Upgrade to continue using premium features.',\n                        'data': {\n                            'subscription_id': subscription.get('id'),\n                            'action_url': '/subscription/upgrade'\n                        },\n                        'created_at': datetime.now(timezone.utc).isoformat()\n                    }\n                    \n                    self.supabase.table('notifications').insert(notification_data).execute()\n                    \n        except Exception as e:\n            self.logger.error(f\"Error sending expired subscription notifications: {str(e)}\")\n    \n    def _notify_expiring_subscriptions(self, expiring_subscriptions: List[Dict]):\n        \"\"\"Send notifications for subscriptions expiring soon\"\"\"\n        try:\n            for subscription in expiring_subscriptions:\n                user_id = subscription.get('user_id')\n                end_date = subscription.get('end_date')\n                \n                if user_id and end_date:\n                    # Calculate days remaining\n                    end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))\n                    days_remaining = max(0, (end_datetime - datetime.now(timezone.utc)).days)\n                    \n                    # Create notification record\n                    notification_data = {\n                        'user_id': user_id,\n                        'type': 'subscription_expiring',\n                        'title': 'Subscription Expiring Soon',\n                        'message': f'Your subscription expires in {days_remaining} days. Renew now to avoid interruption.',\n                        'data': {\n                            'subscription_id': subscription.get('id'),\n                            'days_remaining': days_remaining,\n                            'action_url': '/subscription/renew'\n                        },\n                        'created_at': datetime.now(timezone.utc).isoformat()\n                    }\n                    \n                    self.supabase.table('notifications').insert(notification_data).execute()\n                    \n        except Exception as e:\n            self.logger.error(f\"Error sending expiring subscription notifications: {str(e)}\")\n    \n    def get_user_subscription_status(self, user_id: str) -> Dict[str, Any]:\n        \"\"\"Get real-time subscription status for a user\"\"\"\n        try:\n            # Get active subscription\n            subscription_result = self.supabase.table('user_subscriptions').select(\n                'id, plan_id, status, start_date, end_date, auto_renew, created_at, updated_at'\n            ).eq('user_id', user_id).eq('status', 'active').order(\n                'created_at', desc=True\n            ).limit(1).execute()\n            \n            if not subscription_result.data:\n                return self._get_free_plan_status(user_id)\n            \n            subscription = subscription_result.data[0]\n            \n            # Get plan details\n            plan_result = self.supabase.table('subscription_plans').select(\n                'id, name, price, billing_cycle, features, limits'\n            ).eq('id', subscription['plan_id']).single().execute()\n            \n            if not plan_result.data:\n                self.logger.error(f\"Plan not found: {subscription['plan_id']}\")\n                return self._get_free_plan_status(user_id)\n            \n            plan = plan_result.data\n            \n            # Calculate real-time days remaining\n            end_date = datetime.fromisoformat(subscription['end_date'].replace('Z', '+00:00'))\n            now = datetime.now(timezone.utc)\n            days_remaining = max(0, (end_date - now).days)\n            \n            # Check if subscription should be expired\n            is_expired = end_date < now\n            if is_expired and subscription['status'] == 'active':\n                # Auto-expire the subscription\n                self.supabase.table('user_subscriptions').update({\n                    'status': 'expired',\n                    'updated_at': now.isoformat()\n                }).eq('id', subscription['id']).execute()\n                \n                return self._get_free_plan_status(user_id)\n            \n            return {\n                'subscription_id': subscription['id'],\n                'plan_id': plan['id'],\n                'plan_name': plan['name'],\n                'status': subscription['status'],\n                'start_date': subscription['start_date'],\n                'end_date': subscription['end_date'],\n                'days_remaining': days_remaining,\n                'auto_renew': subscription['auto_renew'],\n                'price': plan['price'],\n                'billing_cycle': plan['billing_cycle'],\n                'features': plan['features'],\n                'limits': plan['limits'],\n                'is_expired': is_expired,\n                'is_expiring_soon': days_remaining <= 7 and days_remaining > 0,\n                'last_updated': now.isoformat()\n            }\n            \n        except Exception as e:\n            self.logger.error(f\"Error getting subscription status: {str(e)}\")\n            return self._get_free_plan_status(user_id)\n    \n    def _get_free_plan_status(self, user_id: str) -> Dict[str, Any]:\n        \"\"\"Get free plan status\"\"\"\n        now = datetime.now(timezone.utc)\n        \n        return {\n            'subscription_id': None,\n            'plan_id': 'free',\n            'plan_name': 'Free Plan',\n            'status': 'active',\n            'start_date': None,\n            'end_date': None,\n            'days_remaining': None,\n            'auto_renew': False,\n            'price': 0,\n            'billing_cycle': 'lifetime',\n            'features': ['Basic invoicing', 'Up to 10 products', 'Basic reporting'],\n            'limits': {\n                'invoices': 10,\n                'products': 10,\n                'customers': 25,\n                'sales': 50,\n                'storage_mb': 100\n            },\n            'is_expired': False,\n            'is_expiring_soon': False,\n            'last_updated': now.isoformat()\n        }\n    \n    def force_refresh_user_status(self, user_id: str) -> Dict[str, Any]:\n        \"\"\"Force refresh a user's subscription status\"\"\"\n        self.logger.info(f\"Force refreshing subscription status for user: {user_id}\")\n        return self.get_user_subscription_status(user_id)\n    \n    def get_monitoring_stats(self) -> Dict[str, Any]:\n        \"\"\"Get monitoring service statistics\"\"\"\n        try:\n            # Get subscription counts by status\n            active_result = self.supabase.table('user_subscriptions').select(\n                'id', count='exact'\n            ).eq('status', 'active').execute()\n            \n            expired_result = self.supabase.table('user_subscriptions').select(\n                'id', count='exact'\n            ).eq('status', 'expired').execute()\n            \n            cancelled_result = self.supabase.table('user_subscriptions').select(\n                'id', count='exact'\n            ).eq('status', 'cancelled').execute()\n            \n            return {\n                'is_monitoring': self.is_monitoring,\n                'check_interval': self.check_interval,\n                'subscription_counts': {\n                    'active': active_result.count or 0,\n                    'expired': expired_result.count or 0,\n                    'cancelled': cancelled_result.count or 0\n                },\n                'last_check': datetime.now(timezone.utc).isoformat()\n            }\n            \n        except Exception as e:\n            self.logger.error(f\"Error getting monitoring stats: {str(e)}\")\n            return {\n                'is_monitoring': self.is_monitoring,\n                'check_interval': self.check_interval,\n                'error': str(e)\n            }"