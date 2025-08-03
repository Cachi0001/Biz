"""
Business Trigger Manager
Monitors business data and triggers notifications for critical events
"""

import logging
import asyncio
from datetime import datetime, timezone, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from abc import ABC, abstractmethod

from .notification_service import NotificationService

logger = logging.getLogger(__name__)

@dataclass
class TriggerResult:
    """Result of a trigger check"""
    triggered: bool
    notifications_sent: int = 0
    errors: List[str] = None
    details: Dict[str, Any] = None

class BaseTrigger(ABC):
    """Base class for all business triggers"""
    
    def __init__(self, notification_service: NotificationService, supabase_client):
        self.notification_service = notification_service
        self.supabase = supabase_client
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @abstractmethod
    async def check_and_trigger(self) -> TriggerResult:
        """Check conditions and trigger notifications if needed"""
        pass
    
    @abstractmethod
    def get_trigger_name(self) -> str:
        """Get human-readable trigger name"""
        pass

class LowStockTrigger(BaseTrigger):
    """Monitors product stock levels and triggers low stock alerts"""
    
    def get_trigger_name(self) -> str:
        return "Low Stock Monitor"
    
    async def check_and_trigger(self) -> TriggerResult:
        """Check for products with low stock and send alerts"""
        try:
            self.logger.info("Checking for low stock products...")
            
            # Get products that are below their low stock threshold
            low_stock_products = self.supabase.table('products').select(
                'id, owner_id, name, quantity, low_stock_threshold, reorder_level'
            ).filter(
                'active', 'eq', True
            ).filter(
                'quantity', 'lte', 'low_stock_threshold'
            ).execute()
            
            if not low_stock_products.data:
                self.logger.info("No low stock products found")
                return TriggerResult(triggered=False)
            
            notifications_sent = 0
            errors = []
            
            for product in low_stock_products.data:
                try:
                    # Check if we've already sent a notification for this product recently
                    if await self._should_send_low_stock_alert(product):
                        success, notification_id = await self.notification_service.send_low_stock_alert(
                            user_id=product['owner_id'],
                            product_name=product['name'],
                            current_quantity=product['quantity'],
                            threshold=product['low_stock_threshold'],
                            product_id=product['id']
                        )
                        
                        if success:
                            notifications_sent += 1
                            self.logger.info(f"Low stock alert sent for product {product['name']} (ID: {product['id']})")
                            
                            # Record that we sent this notification
                            await self._record_low_stock_alert(product['id'], notification_id)
                        else:
                            error_msg = f"Failed to send low stock alert for product {product['name']}"
                            errors.append(error_msg)
                            self.logger.error(error_msg)
                
                except Exception as e:
                    error_msg = f"Error processing low stock alert for product {product.get('name', 'unknown')}: {str(e)}"
                    errors.append(error_msg)
                    self.logger.error(error_msg)
            
            return TriggerResult(
                triggered=notifications_sent > 0,
                notifications_sent=notifications_sent,
                errors=errors if errors else None,
                details={
                    "total_low_stock_products": len(low_stock_products.data),
                    "notifications_sent": notifications_sent
                }
            )
            
        except Exception as e:
            error_msg = f"Error in low stock trigger: {str(e)}"
            self.logger.error(error_msg)
            return TriggerResult(
                triggered=False,
                errors=[error_msg]
            )
    
    async def _should_send_low_stock_alert(self, product: Dict[str, Any]) -> bool:
        """Check if we should send a low stock alert for this product"""
        try:
            # Check if we've sent an alert for this product in the last 24 hours
            yesterday = datetime.now(timezone.utc) - timedelta(days=1)
            
            recent_notifications = self.supabase.table('notifications').select('id').eq(
                'user_id', product['owner_id']
            ).eq('type', 'low_stock_alert').gte(
                'created_at', yesterday.isoformat()
            ).contains('data', {'product_id': product['id']}).execute()
            
            # Don't send if we already sent one recently
            if recent_notifications.data:
                self.logger.info(f"Skipping low stock alert for product {product['name']} - already sent recently")
                return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error checking recent low stock alerts: {str(e)}")
            # Default to sending if we can't check
            return True
    
    async def _record_low_stock_alert(self, product_id: str, notification_id: str) -> None:
        """Record that we sent a low stock alert"""
        try:
            # This could be used for tracking/analytics
            # For now, we just log it
            self.logger.info(f"Recorded low stock alert for product {product_id}, notification {notification_id}")
        except Exception as e:
            self.logger.error(f"Error recording low stock alert: {str(e)}")

class OverdueInvoiceTrigger(BaseTrigger):
    """Monitors invoices for overdue payments and triggers alerts"""
    
    def get_trigger_name(self) -> str:
        return "Overdue Invoice Monitor"
    
    async def check_and_trigger(self) -> TriggerResult:
        """Check for overdue invoices and send alerts"""
        try:
            self.logger.info("Checking for overdue invoices...")
            
            # Get invoices that are overdue (due_date < today and status != 'paid')
            today = date.today()
            
            overdue_invoices = self.supabase.table('invoices').select(
                'id, owner_id, customer_name, invoice_number, total_amount, due_date, status'
            ).neq('status', 'paid').lt('due_date', today.isoformat()).execute()
            
            if not overdue_invoices.data:
                self.logger.info("No overdue invoices found")
                return TriggerResult(triggered=False)
            
            notifications_sent = 0
            errors = []
            
            for invoice in overdue_invoices.data:
                try:
                    # Calculate days overdue
                    due_date = datetime.fromisoformat(invoice['due_date'].replace('Z', '+00:00')).date()
                    days_overdue = (today - due_date).days
                    
                    # Check if we should send an alert based on days overdue and previous alerts
                    if await self._should_send_overdue_alert(invoice, days_overdue):
                        success, notification_id = await self.notification_service.send_overdue_invoice_alert(
                            user_id=invoice['owner_id'],
                            customer_name=invoice['customer_name'],
                            invoice_number=invoice['invoice_number'],
                            amount=float(invoice['total_amount']),
                            days_overdue=days_overdue,
                            invoice_id=invoice['id']
                        )
                        
                        if success:
                            notifications_sent += 1
                            self.logger.info(f"Overdue invoice alert sent for invoice {invoice['invoice_number']} ({days_overdue} days overdue)")
                            
                            # Record that we sent this notification
                            await self._record_overdue_alert(invoice['id'], notification_id, days_overdue)
                        else:
                            error_msg = f"Failed to send overdue alert for invoice {invoice['invoice_number']}"
                            errors.append(error_msg)
                            self.logger.error(error_msg)
                
                except Exception as e:
                    error_msg = f"Error processing overdue invoice {invoice.get('invoice_number', 'unknown')}: {str(e)}"
                    errors.append(error_msg)
                    self.logger.error(error_msg)
            
            return TriggerResult(
                triggered=notifications_sent > 0,
                notifications_sent=notifications_sent,
                errors=errors if errors else None,
                details={
                    "total_overdue_invoices": len(overdue_invoices.data),
                    "notifications_sent": notifications_sent
                }
            )
            
        except Exception as e:
            error_msg = f"Error in overdue invoice trigger: {str(e)}"
            self.logger.error(error_msg)
            return TriggerResult(
                triggered=False,
                errors=[error_msg]
            )
    
    async def _should_send_overdue_alert(self, invoice: Dict[str, Any], days_overdue: int) -> bool:
        """Check if we should send an overdue alert for this invoice"""
        try:
            # Send alerts at specific intervals: 1, 7, 30 days overdue
            alert_intervals = [1, 7, 30]
            
            # Check if we're at an alert interval
            if days_overdue not in alert_intervals:
                return False
            
            # Check if we've already sent an alert for this specific interval
            recent_notifications = self.supabase.table('notifications').select('id, data').eq(
                'user_id', invoice['owner_id']
            ).eq('type', 'overdue_invoice').contains('data', {'invoice_id': invoice['id']}).execute()
            
            if recent_notifications.data:
                # Check if we've already sent an alert for this specific days_overdue value
                for notification in recent_notifications.data:
                    if notification.get('data', {}).get('days_overdue') == days_overdue:
                        self.logger.info(f"Skipping overdue alert for invoice {invoice['invoice_number']} - already sent for {days_overdue} days")
                        return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error checking recent overdue alerts: {str(e)}")
            # Default to sending if we can't check
            return True
    
    async def _record_overdue_alert(self, invoice_id: str, notification_id: str, days_overdue: int) -> None:
        """Record that we sent an overdue alert"""
        try:
            self.logger.info(f"Recorded overdue alert for invoice {invoice_id}, notification {notification_id}, {days_overdue} days overdue")
        except Exception as e:
            self.logger.error(f"Error recording overdue alert: {str(e)}")

class UsageLimitTrigger(BaseTrigger):
    """Monitors feature usage and triggers limit warnings"""
    
    def get_trigger_name(self) -> str:
        return "Usage Limit Monitor"
    
    async def check_and_trigger(self) -> TriggerResult:
        """Check for users approaching usage limits and send warnings"""
        try:
            self.logger.info("Checking for usage limit warnings...")
            
            # Get current feature usage that's approaching limits
            usage_data = self.supabase.table('user_feature_usage').select(
                'user_id, feature_type, current_count, limit_count, usage_percentage'
            ).gte('usage_percentage', 80).execute()  # 80% or higher
            
            if not usage_data.data:
                self.logger.info("No users approaching usage limits")
                return TriggerResult(triggered=False)
            
            notifications_sent = 0
            errors = []
            
            for usage in usage_data.data:
                try:
                    percentage = float(usage['usage_percentage'])
                    
                    # Check if we should send an alert based on percentage thresholds
                    if await self._should_send_usage_alert(usage, percentage):
                        success, notification_id = await self.notification_service.send_usage_limit_warning(
                            user_id=usage['user_id'],
                            feature_type=usage['feature_type'],
                            current_usage=usage['current_count'],
                            limit=usage['limit_count'],
                            percentage=percentage
                        )
                        
                        if success:
                            notifications_sent += 1
                            self.logger.info(f"Usage limit warning sent for user {usage['user_id']}, feature {usage['feature_type']} ({percentage:.0f}%)")
                            
                            # Record that we sent this notification
                            await self._record_usage_alert(usage['user_id'], usage['feature_type'], notification_id, percentage)
                        else:
                            error_msg = f"Failed to send usage warning for user {usage['user_id']}, feature {usage['feature_type']}"
                            errors.append(error_msg)
                            self.logger.error(error_msg)
                
                except Exception as e:
                    error_msg = f"Error processing usage warning for user {usage.get('user_id', 'unknown')}: {str(e)}"
                    errors.append(error_msg)
                    self.logger.error(error_msg)
            
            return TriggerResult(
                triggered=notifications_sent > 0,
                notifications_sent=notifications_sent,
                errors=errors if errors else None,
                details={
                    "total_users_near_limit": len(usage_data.data),
                    "notifications_sent": notifications_sent
                }
            )
            
        except Exception as e:
            error_msg = f"Error in usage limit trigger: {str(e)}"
            self.logger.error(error_msg)
            return TriggerResult(
                triggered=False,
                errors=[error_msg]
            )
    
    async def _should_send_usage_alert(self, usage: Dict[str, Any], percentage: float) -> bool:
        """Check if we should send a usage alert"""
        try:
            # Send alerts at specific thresholds: 80%, 95%, 100%
            alert_thresholds = [80, 95, 100]
            
            # Find the appropriate threshold
            current_threshold = None
            for threshold in alert_thresholds:
                if percentage >= threshold:
                    current_threshold = threshold
            
            if current_threshold is None:
                return False
            
            # Check if we've already sent an alert for this threshold in the last 24 hours
            yesterday = datetime.now(timezone.utc) - timedelta(days=1)
            
            recent_notifications = self.supabase.table('notifications').select('id, data').eq(
                'user_id', usage['user_id']
            ).eq('type', 'usage_limit_warning').gte(
                'created_at', yesterday.isoformat()
            ).contains('data', {'feature_type': usage['feature_type']}).execute()
            
            if recent_notifications.data:
                # Check if we've already sent an alert for this threshold
                for notification in recent_notifications.data:
                    notification_data = notification.get('data', {})
                    if notification_data.get('percentage', 0) >= current_threshold:
                        self.logger.info(f"Skipping usage alert for user {usage['user_id']}, feature {usage['feature_type']} - already sent for {current_threshold}%")
                        return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error checking recent usage alerts: {str(e)}")
            # Default to sending if we can't check
            return True
    
    async def _record_usage_alert(self, user_id: str, feature_type: str, notification_id: str, percentage: float) -> None:
        """Record that we sent a usage alert"""
        try:
            self.logger.info(f"Recorded usage alert for user {user_id}, feature {feature_type}, notification {notification_id}, {percentage:.0f}%")
        except Exception as e:
            self.logger.error(f"Error recording usage alert: {str(e)}")

class BusinessTriggerManager:
    """Main manager for all business triggers"""
    
    def __init__(self, notification_service: NotificationService, supabase_client):
        self.notification_service = notification_service
        self.supabase = supabase_client
        self.logger = logging.getLogger(__name__)
        
        # Initialize all triggers
        self.triggers = [
            LowStockTrigger(notification_service, supabase_client),
            OverdueInvoiceTrigger(notification_service, supabase_client),
            UsageLimitTrigger(notification_service, supabase_client),
        ]
    
    async def run_all_triggers(self) -> Dict[str, TriggerResult]:
        """Run all business triggers and return results"""
        self.logger.info("Starting business trigger check cycle...")
        
        results = {}
        total_notifications = 0
        total_errors = []
        
        for trigger in self.triggers:
            try:
                self.logger.info(f"Running trigger: {trigger.get_trigger_name()}")
                result = await trigger.check_and_trigger()
                
                results[trigger.get_trigger_name()] = result
                total_notifications += result.notifications_sent
                
                if result.errors:
                    total_errors.extend(result.errors)
                
                self.logger.info(f"Trigger {trigger.get_trigger_name()} completed: {result.notifications_sent} notifications sent")
                
            except Exception as e:
                error_msg = f"Error running trigger {trigger.get_trigger_name()}: {str(e)}"
                self.logger.error(error_msg)
                total_errors.append(error_msg)
                
                results[trigger.get_trigger_name()] = TriggerResult(
                    triggered=False,
                    errors=[error_msg]
                )
        
        # Log summary
        self.logger.info(f"Business trigger cycle completed: {total_notifications} total notifications sent")
        if total_errors:
            self.logger.warning(f"Trigger cycle had {len(total_errors)} errors")
        
        return results
    
    async def run_specific_trigger(self, trigger_name: str) -> Optional[TriggerResult]:
        """Run a specific trigger by name"""
        for trigger in self.triggers:
            if trigger.get_trigger_name().lower() == trigger_name.lower():
                self.logger.info(f"Running specific trigger: {trigger_name}")
                return await trigger.check_and_trigger()
        
        self.logger.error(f"Trigger not found: {trigger_name}")
        return None
    
    def get_available_triggers(self) -> List[str]:
        """Get list of available trigger names"""
        return [trigger.get_trigger_name() for trigger in self.triggers]
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of trigger system"""
        try:
            # Test database connection
            test_query = self.supabase.table('notifications').select('id').limit(1).execute()
            db_healthy = test_query is not None
            
            return {
                "status": "healthy" if db_healthy else "unhealthy",
                "database_connected": db_healthy,
                "available_triggers": self.get_available_triggers(),
                "trigger_count": len(self.triggers),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

# Utility function to create trigger manager
def create_trigger_manager(supabase_client) -> BusinessTriggerManager:
    """Create a BusinessTriggerManager instance"""
    notification_service = NotificationService(supabase_client)
    return BusinessTriggerManager(notification_service, supabase_client)