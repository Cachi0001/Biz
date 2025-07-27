"""
Invoice Status Manager - Centralized invoice status lifecycle management
Handles status transitions, overdue detection, and payment processing
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
import uuid

logger = logging.getLogger(__name__)

class InvoiceStatusManager:
    """Manages invoice status lifecycle with proper validation and error handling"""
    
    VALID_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"]
    
    # Define valid status transitions
    STATUS_TRANSITIONS = {
        "draft": ["sent", "cancelled"],
        "sent": ["paid", "overdue", "cancelled"],
        "overdue": ["paid", "cancelled"],
        "paid": [],  # Paid invoices cannot change status
        "cancelled": []  # Cancelled invoices cannot change status
    }
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def validate_status_transition(self, current_status: str, new_status: str) -> Tuple[bool, str]:
        """
        Validate if status transition is allowed
        Returns: (is_valid, error_message)
        """
        if new_status not in self.VALID_STATUSES:
            return False, f"Invalid status: {new_status}"
        
        if current_status not in self.STATUS_TRANSITIONS:
            return False, f"Invalid current status: {current_status}"
        
        if new_status not in self.STATUS_TRANSITIONS[current_status]:
            return False, f"Cannot transition from {current_status} to {new_status}"
        
        return True, ""
    
    def update_status(self, invoice_id: str, new_status: str, owner_id: str) -> Dict:
        """
        Update invoice status with proper validation and cascading updates
        Returns: {"success": bool, "message": str, "data": Dict}
        """
        try:
            # Get current invoice
            invoice_result = self.supabase.table("invoices").select("*").eq("id", invoice_id).eq("owner_id", owner_id).single().execute()
            
            if not invoice_result.data:
                return {"success": False, "message": "Invoice not found", "data": None}
            
            invoice = invoice_result.data
            current_status = invoice.get("status", "draft")
            
            # Validate status transition
            is_valid, error_message = self.validate_status_transition(current_status, new_status)
            if not is_valid:
                return {"success": False, "message": error_message, "data": None}
            
            # Prepare update data
            update_data = {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Add status-specific timestamps
            if new_status == "sent" and not invoice.get("sent_at"):
                update_data["sent_at"] = datetime.now(timezone.utc).isoformat()
            elif new_status == "paid" and current_status != "paid":
                update_data["paid_date"] = datetime.now(timezone.utc).isoformat()
            
            # Update invoice
            result = self.supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
            
            if not result.data:
                return {"success": False, "message": "Failed to update invoice status", "data": None}
            
            updated_invoice = result.data[0]
            
            # Handle status-specific actions
            if new_status == "paid" and current_status != "paid":
                # Create transaction record
                transaction_result = self._create_payment_transaction(updated_invoice)
                if transaction_result["success"]:
                    updated_invoice["transaction_created"] = True
                
                # Handle inventory deduction if applicable
                inventory_result = self._handle_inventory_on_payment(updated_invoice)
                if inventory_result["success"]:
                    updated_invoice["inventory_updated"] = True
            
            logger.info(f"Invoice {invoice_id} status updated from {current_status} to {new_status}")
            
            return {
                "success": True,
                "message": f"Invoice status updated to {new_status}",
                "data": updated_invoice
            }
            
        except Exception as e:
            logger.error(f"Error updating invoice status: {str(e)}")
            return {"success": False, "message": f"Failed to update status: {str(e)}", "data": None}
    
    def check_overdue_invoices(self, owner_id: str) -> List[Dict]:
        """
        Check and update overdue invoices automatically
        Returns: List of overdue invoices
        """
        try:
            now = datetime.now(timezone.utc)
            
            # Get unpaid invoices past due date
            invoices_result = self.supabase.table("invoices").select("*").eq("owner_id", owner_id).in_("status", ["sent", "draft"]).execute()
            
            overdue_invoices = []
            
            if invoices_result.data:
                for invoice in invoices_result.data:
                    due_date_str = invoice.get("due_date")
                    if due_date_str:
                        try:
                            # Parse due date
                            if due_date_str.endswith('Z'):
                                due_date_str = due_date_str.replace('Z', '+00:00')
                            due_date = datetime.fromisoformat(due_date_str)
                            
                            # Ensure due_date is timezone-aware
                            if due_date.tzinfo is None:
                                due_date = due_date.replace(tzinfo=timezone.utc)
                            
                            # Check if overdue
                            if due_date < now:
                                # Update status to overdue
                                self.supabase.table("invoices").update({
                                    "status": "overdue",
                                    "updated_at": now.isoformat()
                                }).eq("id", invoice["id"]).execute()
                                
                                invoice["status"] = "overdue"
                                overdue_invoices.append(invoice)
                                
                                logger.info(f"Invoice {invoice['id']} marked as overdue")
                        
                        except Exception as date_error:
                            logger.warning(f"Error parsing due date for invoice {invoice['id']}: {str(date_error)}")
            
            return overdue_invoices
            
        except Exception as e:
            logger.error(f"Error checking overdue invoices: {str(e)}")
            return []
    
    def get_invoice_counts(self, owner_id: str) -> Dict:
        """
        Get real-time invoice counts by status
        Returns: Dictionary with counts by status
        """
        try:
            # First, check and update overdue invoices
            self.check_overdue_invoices(owner_id)
            
            # Get all invoices
            invoices_result = self.supabase.table("invoices").select("status").eq("owner_id", owner_id).execute()
            
            counts = {
                "draft": 0,
                "sent": 0,
                "paid": 0,
                "overdue": 0,
                "cancelled": 0,
                "total": 0
            }
            
            if invoices_result.data:
                for invoice in invoices_result.data:
                    status = invoice.get("status", "draft")
                    if status in counts:
                        counts[status] += 1
                    counts["total"] += 1
            
            return counts
            
        except Exception as e:
            logger.error(f"Error getting invoice counts: {str(e)}")
            return {"draft": 0, "sent": 0, "paid": 0, "overdue": 0, "cancelled": 0, "total": 0}
    
    def process_payment(self, invoice_id: str, owner_id: str, payment_data: Optional[Dict] = None) -> Dict:
        """
        Process invoice payment with complete workflow
        Returns: {"success": bool, "message": str, "data": Dict}
        """
        try:
            # Update status to paid
            status_result = self.update_status(invoice_id, "paid", owner_id)
            
            if not status_result["success"]:
                return status_result
            
            # Additional payment processing if payment_data provided
            if payment_data:
                # Could add payment method, transaction reference, etc.
                additional_data = {
                    "payment_method": payment_data.get("payment_method", "manual"),
                    "payment_reference": payment_data.get("reference", ""),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                self.supabase.table("invoices").update(additional_data).eq("id", invoice_id).execute()
            
            logger.info(f"Payment processed for invoice {invoice_id}")
            
            return {
                "success": True,
                "message": "Payment processed successfully",
                "data": status_result["data"]
            }
            
        except Exception as e:
            logger.error(f"Error processing payment for invoice {invoice_id}: {str(e)}")
            return {"success": False, "message": f"Payment processing failed: {str(e)}", "data": None}
    
    def _create_payment_transaction(self, invoice: Dict) -> Dict:
        """
        Create transaction record for invoice payment
        Returns: {"success": bool, "transaction_id": str}
        """
        try:
            transaction_data = {
                "id": str(uuid.uuid4()),
                "owner_id": invoice["owner_id"],
                "type": "money_in",
                "amount": float(invoice["total_amount"]),
                "category": "Invoice Payment",
                "description": f"Payment for Invoice {invoice['invoice_number']} - {invoice.get('customer_name', 'Customer')}",
                "payment_method": "invoice",
                "reference_id": invoice["id"],
                "reference_type": "invoice",
                "date": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table("transactions").insert(transaction_data).execute()
            
            if result.data:
                logger.info(f"Transaction created for invoice payment: {invoice['id']}")
                return {"success": True, "transaction_id": transaction_data["id"]}
            else:
                return {"success": False, "transaction_id": None}
                
        except Exception as e:
            logger.error(f"Error creating payment transaction: {str(e)}")
            return {"success": False, "transaction_id": None}
    
    def _handle_inventory_on_payment(self, invoice: Dict) -> Dict:
        """
        Handle inventory deduction when invoice is paid
        Returns: {"success": bool, "message": str}
        """
        try:
            items = invoice.get("items", [])
            if not items:
                return {"success": True, "message": "No items to process"}
            
            inventory_updates = []
            
            for item in items:
                product_id = item.get("product_id")
                quantity = item.get("quantity", 0)
                
                if product_id and quantity > 0:
                    # Get current product inventory
                    product_result = self.supabase.table("products").select("quantity, reserved_quantity").eq("id", product_id).single().execute()
                    
                    if product_result.data:
                        current_qty = int(product_result.data.get("quantity", 0))
                        reserved_qty = int(product_result.data.get("reserved_quantity", 0))
                        
                        # Deduct from available quantity
                        new_qty = max(0, current_qty - quantity)
                        # Also reduce reserved quantity if it exists
                        new_reserved = max(0, reserved_qty - quantity)
                        
                        self.supabase.table("products").update({
                            "quantity": new_qty,
                            "reserved_quantity": new_reserved,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }).eq("id", product_id).execute()
                        
                        inventory_updates.append({
                            "product_id": product_id,
                            "quantity_deducted": quantity,
                            "new_quantity": new_qty
                        })
            
            if inventory_updates:
                logger.info(f"Inventory updated for {len(inventory_updates)} products on invoice payment")
            
            return {"success": True, "message": f"Inventory updated for {len(inventory_updates)} products"}
            
        except Exception as e:
            logger.error(f"Error handling inventory on payment: {str(e)}")
            return {"success": False, "message": f"Inventory update failed: {str(e)}"}
    
    def get_overdue_summary(self, owner_id: str) -> Dict:
        """
        Get summary of overdue invoices with amounts
        Returns: {"count": int, "total_amount": float, "invoices": List[Dict]}
        """
        try:
            # First update overdue statuses
            overdue_invoices = self.check_overdue_invoices(owner_id)
            
            # Get all overdue invoices
            result = self.supabase.table("invoices").select("*").eq("owner_id", owner_id).eq("status", "overdue").execute()
            
            total_amount = 0
            invoices = []
            
            if result.data:
                for invoice in result.data:
                    total_amount += float(invoice.get("total_amount", 0))
                    invoices.append({
                        "id": invoice["id"],
                        "invoice_number": invoice.get("invoice_number", ""),
                        "customer_name": invoice.get("customer_name", ""),
                        "total_amount": float(invoice.get("total_amount", 0)),
                        "due_date": invoice.get("due_date", ""),
                        "days_overdue": self._calculate_days_overdue(invoice.get("due_date", ""))
                    })
            
            return {
                "count": len(invoices),
                "total_amount": total_amount,
                "invoices": invoices
            }
            
        except Exception as e:
            logger.error(f"Error getting overdue summary: {str(e)}")
            return {"count": 0, "total_amount": 0, "invoices": []}
    
    def _calculate_days_overdue(self, due_date_str: str) -> int:
        """Calculate number of days overdue"""
        try:
            if not due_date_str:
                return 0
            
            if due_date_str.endswith('Z'):
                due_date_str = due_date_str.replace('Z', '+00:00')
            
            due_date = datetime.fromisoformat(due_date_str)
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
            
            now = datetime.now(timezone.utc)
            delta = now - due_date
            
            return max(0, delta.days)
            
        except Exception as e:
            logger.warning(f"Error calculating days overdue: {str(e)}")
            return 0
