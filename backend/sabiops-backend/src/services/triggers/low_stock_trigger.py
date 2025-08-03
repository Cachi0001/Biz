"""
Low Stock Monitoring Trigger
Monitors product inventory levels and sends notifications when stock is low
"""

import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from ..notification_service import NotificationService

logger = logging.getLogger(__name__)

class LowStockMonitor:
    """Monitors product stock levels and triggers notifications"""
    
    def __init__(self, supabase_client, notification_service: NotificationService = None):
        self.supabase = supabase_client
        self.notification_service = notification_service or NotificationService(supabase_client)
        self.logger = logging.getLogger(__name__)
    
    async def check_all_products(self) -> Dict[str, Any]:
        """Check all products for low stock conditions"""
        try:
            self.logger.info("Starting low stock check for all products...")
            
            # Get all active products with their stock levels
            products_result = self.supabase.table('products').select(
                'id, owner_id, name, quantity, low_stock_threshold, reorder_level, active'
            ).eq('active', True).execute()
            
            if not products_result.data:
                self.logger.info("No active products found")
                return {
                    "status": "completed",
                    "products_checked": 0,
                    "notifications_sent": 0,
                    "low_stock_products": []
                }
            
            products = products_result.data
            self.logger.info(f"Checking {len(products)} active products for low stock...")
            
            notifications_sent = 0
            low_stock_products = []
            
            for product in products:
                try:
                    result = await self._check_product_stock(product)
                    if result['notification_sent']:
                        notifications_sent += 1
                        low_stock_products.append({
                            'id': product['id'],
                            'name': product['name'],
                            'quantity': product['quantity'],
                            'threshold': product['low_stock_threshold'],
                            'alert_type': result['alert_type']
                        })
                
                except Exception as e:
                    self.logger.error(f"Error checking product {product.get('name', 'unknown')}: {str(e)}")
            
            self.logger.info(f"Low stock check completed: {notifications_sent} notifications sent")
            
            return {
                "status": "completed",
                "products_checked": len(products),
                "notifications_sent": notifications_sent,
                "low_stock_products": low_stock_products
            }
            
        except Exception as e:
            self.logger.error(f"Error in low stock check: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "products_checked": 0,
                "notifications_sent": 0
            }
    
    async def _check_product_stock(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Check a single product's stock level and send notification if needed"""
        try:
            product_id = product['id']
            owner_id = product['owner_id']
            name = product['name']
            quantity = product['quantity']
            low_stock_threshold = product.get('low_stock_threshold', 5)
            reorder_level = product.get('reorder_level', 0)
            
            # Determine alert type based on quantity
            alert_type = None
            priority = 'medium'
            
            if quantity <= 0:
                alert_type = 'out_of_stock'
                priority = 'urgent'
            elif reorder_level and quantity <= reorder_level:
                alert_type = 'reorder_needed'
                priority = 'high'
            elif quantity <= low_stock_threshold:
                alert_type = 'low_stock'
                priority = 'medium' if quantity > 2 else 'high'
            
            # If no alert needed, return early
            if not alert_type:
                return {
                    "notification_sent": False,
                    "alert_type": None,
                    "reason": "Stock levels are adequate"
                }
            
            # Check if we should send notification (avoid spam)
            should_send = await self._should_send_notification(product_id, owner_id, alert_type)
            
            if not should_send:
                return {
                    "notification_sent": False,
                    "alert_type": alert_type,
                    "reason": "Notification already sent recently"
                }
            
            # Send appropriate notification
            success = False
            notification_id = None
            
            # Send low stock alert (handles both low stock and out of stock)
            success, notification_id = await self.notification_service.send_low_stock_alert(
                user_id=owner_id,
                product_name=name,
                current_quantity=quantity,
                threshold=low_stock_threshold,
                product_id=product_id
            )
            
            if success:
                # Record the notification to prevent spam
                await self._record_notification_sent(product_id, owner_id, alert_type, notification_id)
                
                self.logger.info(f"Sent {alert_type} notification for product {name} (ID: {product_id})")
                
                return {
                    "notification_sent": True,
                    "alert_type": alert_type,
                    "notification_id": notification_id
                }
            else:
                self.logger.error(f"Failed to send {alert_type} notification for product {name}")
                return {
                    "notification_sent": False,
                    "alert_type": alert_type,
                    "reason": "Notification service failed"
                }
                
        except Exception as e:
            self.logger.error(f"Error checking product stock: {str(e)}")
            return {
                "notification_sent": False,
                "alert_type": None,
                "reason": f"Error: {str(e)}"
            }
    
    async def _should_send_notification(self, product_id: str, owner_id: str, alert_type: str) -> bool:
        """Check if we should send a notification for this product"""
        try:
            # Different cooldown periods for different alert types
            cooldown_hours = {
                'low_stock': 24,      # Once per day for low stock
                'reorder_needed': 12, # Twice per day for reorder alerts
                'out_of_stock': 6     # Every 6 hours for out of stock (more urgent)
            }
            
            hours_ago = cooldown_hours.get(alert_type, 24)
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
            
            # Check for recent notifications of the same type for this product
            recent_notifications = self.supabase.table('notifications').select('id').eq(
                'user_id', owner_id
            ).eq('type', 'low_stock_alert').gte(
                'created_at', cutoff_time.isoformat()
            ).contains('data', {'product_id': product_id}).execute()
            
            if recent_notifications.data:
                self.logger.debug(f"Skipping {alert_type} notification for product {product_id} - sent recently")
                return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error checking notification history: {str(e)}")
            # Default to sending if we can't check (better to send than miss critical alerts)
            return True
    
    async def _record_notification_sent(self, product_id: str, owner_id: str, alert_type: str, notification_id: str) -> None:
        """Record that we sent a notification (for analytics/tracking)"""
        try:
            # This could be expanded to include a separate tracking table
            # For now, we rely on the notification record itself
            self.logger.debug(f"Recorded {alert_type} notification for product {product_id}: {notification_id}")
            
        except Exception as e:
            self.logger.error(f"Error recording notification: {str(e)}")
    
    async def check_specific_product(self, product_id: str) -> Dict[str, Any]:
        """Check a specific product for low stock (useful for real-time checks)"""
        try:
            # Get the specific product
            product_result = self.supabase.table('products').select(
                'id, owner_id, name, quantity, low_stock_threshold, reorder_level, active'
            ).eq('id', product_id).eq('active', True).single().execute()
            
            if not product_result.data:
                return {
                    "status": "error",
                    "error": "Product not found or inactive",
                    "notification_sent": False
                }
            
            product = product_result.data
            result = await self._check_product_stock(product)
            
            return {
                "status": "completed",
                "product_id": product_id,
                "product_name": product['name'],
                "current_quantity": product['quantity'],
                "threshold": product.get('low_stock_threshold', 5),
                **result
            }
            
        except Exception as e:
            self.logger.error(f"Error checking specific product {product_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "notification_sent": False
            }
    
    async def monitor_inventory_changes(self) -> Dict[str, Any]:
        """Monitor recent inventory changes and check affected products"""
        try:
            self.logger.info("Monitoring recent inventory changes...")
            
            # Get inventory changes from the last hour
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            
            changes_result = self.supabase.table('inventory_changes').select(
                'product_id, new_quantity, change_type'
            ).gte('created_at', one_hour_ago.isoformat()).execute()
            
            if not changes_result.data:
                self.logger.info("No recent inventory changes found")
                return {
                    "status": "completed",
                    "changes_processed": 0,
                    "notifications_sent": 0
                }
            
            changes = changes_result.data
            unique_product_ids = list(set(change['product_id'] for change in changes))
            
            self.logger.info(f"Found {len(changes)} inventory changes affecting {len(unique_product_ids)} products")
            
            notifications_sent = 0
            
            # Check each affected product
            for product_id in unique_product_ids:
                try:
                    result = await self.check_specific_product(product_id)
                    if result.get('notification_sent'):
                        notifications_sent += 1
                        
                except Exception as e:
                    self.logger.error(f"Error checking changed product {product_id}: {str(e)}")
            
            return {
                "status": "completed",
                "changes_processed": len(changes),
                "products_checked": len(unique_product_ids),
                "notifications_sent": notifications_sent
            }
            
        except Exception as e:
            self.logger.error(f"Error monitoring inventory changes: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "changes_processed": 0,
                "notifications_sent": 0
            }

# Utility function to create monitor instance
def create_low_stock_monitor(supabase_client) -> LowStockMonitor:
    """Create a LowStockMonitor instance"""
    return LowStockMonitor(supabase_client)

# Function to run low stock check (for scheduled jobs)
async def run_low_stock_check(supabase_client) -> Dict[str, Any]:
    """Run a complete low stock check - useful for cron jobs"""
    monitor = create_low_stock_monitor(supabase_client)
    return await monitor.check_all_products()

# Function to monitor inventory changes (for real-time triggers)
async def monitor_inventory_changes(supabase_client) -> Dict[str, Any]:
    """Monitor recent inventory changes - useful for real-time triggers"""
    monitor = create_low_stock_monitor(supabase_client)
    return await monitor.monitor_inventory_changes()