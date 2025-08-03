"""
Overdue Invoice Monitoring Trigger
Monitors invoice due dates and sends escalating notifications for overdue payments
"""

import logging
import asyncio
from datetime import datetime, timezone, timedelta, date
from typing import List, Dict, Any, Optional

from ..notification_service import NotificationService

logger = logging.getLogger(__name__)

class OverdueInvoiceMonitor:
    """Monitors invoice due dates and triggers overdue notifications"""
    
    def __init__(self, supabase_client, notification_service: NotificationService = None):
        self.supabase = supabase_client
        self.notification_service = notification_service or NotificationService(supabase_client)
        self.logger = logging.getLogger(__name__)
        
        # Alert intervals (days overdue)
        self.alert_intervals = [1, 7, 14, 30, 60, 90]
    
    async def check_all_overdue_invoices(self) -> Dict[str, Any]:
        """Check all invoices for overdue conditions"""
        try:
            self.logger.info("Starting overdue invoice check...")
            
            today = date.today()
            
            # Get all unpaid invoices that are past due date
            invoices_result = self.supabase.table('invoices').select(
                'id, owner_id, customer_name, invoice_number, total_amount, due_date, status, issue_date'
            ).neq('status', 'paid').lt('due_date', today.isoformat()).execute()
            
            if not invoices_result.data:
                self.logger.info("No overdue invoices found")
                return {
                    "status": "completed",
                    "invoices_checked": 0,
                    "notifications_sent": 0,
                    "overdue_invoices": []
                }
            
            invoices = invoices_result.data
            self.logger.info(f"Checking {len(invoices)} overdue invoices...")
            
            notifications_sent = 0
            overdue_invoices = []
            
            for invoice in invoices:
                try:
                    result = await self._check_invoice_overdue(invoice, today)
                    if result['notification_sent']:
                        notifications_sent += 1
                        overdue_invoices.append({
                            'id': invoice['id'],
                            'invoice_number': invoice['invoice_number'],
                            'customer_name': invoice['customer_name'],
                            'amount': float(invoice['total_amount']),
                            'days_overdue': result['days_overdue'],
                            'alert_type': result['alert_type']
                        })
                
                except Exception as e:
                    self.logger.error(f"Error checking invoice {invoice.get('invoice_number', 'unknown')}: {str(e)}")
            
            self.logger.info(f"Overdue invoice check completed: {notifications_sent} notifications sent")
            
            return {
                "status": "completed",
                "invoices_checked": len(invoices),
                "notifications_sent": notifications_sent,
                "overdue_invoices": overdue_invoices
            }
            
        except Exception as e:
            self.logger.error(f"Error in overdue invoice check: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "invoices_checked": 0,
                "notifications_sent": 0
            }
    
    async def _check_invoice_overdue(self, invoice: Dict[str, Any], today: date) -> Dict[str, Any]:
        """Check a single invoice for overdue condition and send notification if needed"""
        try:
            invoice_id = invoice['id']
            owner_id = invoice['owner_id']
            customer_name = invoice['customer_name']
            invoice_number = invoice['invoice_number']
            amount = float(invoice['total_amount'])
            due_date_str = invoice['due_date']
            
            # Parse due date
            if 'T' in due_date_str:
                due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')).date()
            else:
                due_date = datetime.fromisoformat(due_date_str).date()
            
            # Calculate days overdue
            days_overdue = (today - due_date).days
            
            if days_overdue <= 0:
                return {
                    "notification_sent": False,
                    "days_overdue": days_overdue,
                    "reason": "Invoice is not overdue"
                }
            
            # Determine alert type based on days overdue
            alert_type = self._get_alert_type(days_overdue)
            
            # Check if we should send notification for this interval
            should_send = await self._should_send_overdue_notification(
                invoice_id, owner_id, days_overdue, alert_type
            )
            
            if not should_send:
                return {
                    "notification_sent": False,
                    "days_overdue": days_overdue,
                    "alert_type": alert_type,
                    "reason": "Notification already sent for this interval"
                }
            
            # Send overdue notification
            success, notification_id = await self.notification_service.send_overdue_invoice_alert(
                user_id=owner_id,
                customer_name=customer_name,
                invoice_number=invoice_number,
                amount=amount,
                days_overdue=days_overdue,
                invoice_id=invoice_id
            )
            
            if success:
                # Record the notification to prevent spam
                await self._record_overdue_notification(
                    invoice_id, owner_id, days_overdue, alert_type, notification_id
                )
                
                self.logger.info(f"Sent {alert_type} notification for invoice {invoice_number} ({days_overdue} days overdue)")
                
                return {
                    "notification_sent": True,
                    "days_overdue": days_overdue,
                    "alert_type": alert_type,
                    "notification_id": notification_id
                }
            else:
                self.logger.error(f"Failed to send overdue notification for invoice {invoice_number}")
                return {
                    "notification_sent": False,
                    "days_overdue": days_overdue,
                    "alert_type": alert_type,
                    "reason": "Notification service failed"
                }
                
        except Exception as e:
            self.logger.error(f"Error checking invoice overdue: {str(e)}")
            return {
                "notification_sent": False,
                "days_overdue": 0,
                "reason": f"Error: {str(e)}"
            }
    
    def _get_alert_type(self, days_overdue: int) -> str:
        """Determine alert type based on days overdue"""
        if days_overdue >= 90:
            return "critical_overdue"
        elif days_overdue >= 60:
            return "severe_overdue"
        elif days_overdue >= 30:
            return "major_overdue"
        elif days_overdue >= 14:
            return "moderate_overdue"
        elif days_overdue >= 7:
            return "weekly_overdue"
        else:
            return "initial_overdue"
    
    async def _should_send_overdue_notification(
        self, 
        invoice_id: str, 
        owner_id: str, 
        days_overdue: int, 
        alert_type: str
    ) -> bool:
        """Check if we should send an overdue notification"""
        try:
            # Only send notifications at specific intervals
            if days_overdue not in self.alert_intervals:
                return False
            
            # Check if we've already sent a notification for this specific interval
            recent_notifications = self.supabase.table('notifications').select(
                'id, data, created_at'
            ).eq('user_id', owner_id).eq('type', 'overdue_invoice').contains(
                'data', {'invoice_id': invoice_id}
            ).execute()
            
            if recent_notifications.data:
                # Check if we've already sent an alert for this specific days_overdue value
                for notification in recent_notifications.data:
                    notification_data = notification.get('data', {})
                    if notification_data.get('days_overdue') == days_overdue:
                        self.logger.debug(f"Skipping overdue alert for invoice {invoice_id} - already sent for {days_overdue} days")
                        return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error checking overdue notification history: {str(e)}")
            # Default to sending if we can't check (better to send than miss)
            return True
    
    async def _record_overdue_notification(
        self, 
        invoice_id: str, 
        owner_id: str, 
        days_overdue: int, 
        alert_type: str, 
        notification_id: str
    ) -> None:
        """Record that we sent an overdue notification"""
        try:
            # This could be expanded to include a separate tracking table
            self.logger.debug(f"Recorded {alert_type} notification for invoice {invoice_id}: {notification_id}")
            
        except Exception as e:
            self.logger.error(f"Error recording overdue notification: {str(e)}")
    
    async def check_specific_invoice(self, invoice_id: str) -> Dict[str, Any]:
        """Check a specific invoice for overdue condition"""
        try:
            # Get the specific invoice
            invoice_result = self.supabase.table('invoices').select(
                'id, owner_id, customer_name, invoice_number, total_amount, due_date, status, issue_date'
            ).eq('id', invoice_id).neq('status', 'paid').single().execute()
            
            if not invoice_result.data:
                return {
                    "status": "error",
                    "error": "Invoice not found, already paid, or inactive",
                    "notification_sent": False
                }
            
            invoice = invoice_result.data
            today = date.today()
            result = await self._check_invoice_overdue(invoice, today)
            
            return {
                "status": "completed",
                "invoice_id": invoice_id,
                "invoice_number": invoice['invoice_number'],
                "customer_name": invoice['customer_name'],
                "amount": float(invoice['total_amount']),
                "due_date": invoice['due_date'],
                **result
            }
            
        except Exception as e:
            self.logger.error(f"Error checking specific invoice {invoice_id}: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "notification_sent": False
            }
    
    async def get_overdue_summary(self) -> Dict[str, Any]:
        """Get a summary of all overdue invoices"""
        try:
            today = date.today()
            
            # Get all overdue invoices
            invoices_result = self.supabase.table('invoices').select(
                'id, owner_id, customer_name, invoice_number, total_amount, due_date, status'
            ).neq('status', 'paid').lt('due_date', today.isoformat()).execute()
            
            if not invoices_result.data:
                return {
                    "total_overdue": 0,
                    "total_amount": 0,
                    "by_age": {},
                    "by_owner": {}
                }
            
            invoices = invoices_result.data
            total_amount = 0
            by_age = {
                "1-7_days": {"count": 0, "amount": 0},
                "8-30_days": {"count": 0, "amount": 0},
                "31-60_days": {"count": 0, "amount": 0},
                "61-90_days": {"count": 0, "amount": 0},
                "90+_days": {"count": 0, "amount": 0}
            }
            by_owner = {}
            
            for invoice in invoices:
                amount = float(invoice['total_amount'])
                total_amount += amount
                
                # Calculate days overdue
                due_date_str = invoice['due_date']
                if 'T' in due_date_str:
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')).date()
                else:
                    due_date = datetime.fromisoformat(due_date_str).date()
                
                days_overdue = (today - due_date).days
                
                # Categorize by age
                if days_overdue <= 7:
                    age_key = "1-7_days"
                elif days_overdue <= 30:
                    age_key = "8-30_days"
                elif days_overdue <= 60:
                    age_key = "31-60_days"
                elif days_overdue <= 90:
                    age_key = "61-90_days"
                else:
                    age_key = "90+_days"
                
                by_age[age_key]["count"] += 1
                by_age[age_key]["amount"] += amount
                
                # Categorize by owner
                owner_id = invoice['owner_id']
                if owner_id not in by_owner:
                    by_owner[owner_id] = {"count": 0, "amount": 0}
                by_owner[owner_id]["count"] += 1
                by_owner[owner_id]["amount"] += amount
            
            return {
                "total_overdue": len(invoices),
                "total_amount": total_amount,
                "by_age": by_age,
                "by_owner": by_owner,
                "alert_intervals": self.alert_intervals
            }
            
        except Exception as e:
            self.logger.error(f"Error getting overdue summary: {str(e)}")
            return {
                "error": str(e),
                "total_overdue": 0,
                "total_amount": 0
            }
    
    async def send_overdue_summary_report(self, owner_id: str) -> Dict[str, Any]:
        """Send a summary report of overdue invoices to a specific owner"""
        try:
            today = date.today()
            
            # Get overdue invoices for this owner
            invoices_result = self.supabase.table('invoices').select(
                'id, customer_name, invoice_number, total_amount, due_date'
            ).eq('owner_id', owner_id).neq('status', 'paid').lt('due_date', today.isoformat()).execute()
            
            if not invoices_result.data:
                return {
                    "status": "no_overdue_invoices",
                    "message": "No overdue invoices found for this user"
                }
            
            invoices = invoices_result.data
            total_amount = sum(float(inv['total_amount']) for inv in invoices)
            
            # Create summary message
            summary_message = f"You have {len(invoices)} overdue invoices totaling ₦{total_amount:,.2f}. "
            summary_message += "Please follow up with customers for payment."
            
            # Send summary notification
            from ..notification_service import NotificationData, NotificationType
            
            notification_data = NotificationData(
                title="Overdue Invoices Summary",
                message=summary_message,
                type=NotificationType.SYSTEM_UPDATE,
                data={
                    'total_overdue': len(invoices),
                    'total_amount': total_amount,
                    'report_type': 'overdue_summary'
                },
                navigation_url="/invoices?filter=overdue",
                action_required=True,
                priority="high"
            )
            
            success, notification_id = await self.notification_service.create_notification(
                owner_id, notification_data
            )
            
            return {
                "status": "completed",
                "notification_sent": success,
                "notification_id": notification_id,
                "total_overdue": len(invoices),
                "total_amount": total_amount
            }
            
        except Exception as e:
            self.logger.error(f"Error sending overdue summary report: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

# Utility function to create monitor instance
def create_overdue_invoice_monitor(supabase_client) -> OverdueInvoiceMonitor:
    """Create an OverdueInvoiceMonitor instance"""
    return OverdueInvoiceMonitor(supabase_client)

# Function to run overdue invoice check (for scheduled jobs)
async def run_overdue_invoice_check(supabase_client) -> Dict[str, Any]:
    """Run a complete overdue invoice check - useful for cron jobs"""
    monitor = create_overdue_invoice_monitor(supabase_client)
    return await monitor.check_all_overdue_invoices()

# Function to get overdue summary (for reporting)
async def get_overdue_summary(supabase_client) -> Dict[str, Any]:
    """Get overdue invoice summary - useful for dashboards"""
    monitor = create_overdue_invoice_monitor(supabase_client)
    return await monitor.get_overdue_summary()