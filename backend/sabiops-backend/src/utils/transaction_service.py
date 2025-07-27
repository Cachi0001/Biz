"""
Transaction Service - Handles transaction creation and validation for invoice payments
Provides tools for numeric validation and transaction record maintenance
"""

import logging
from typing import Dict
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

class TransactionService:
    """Handles transaction creation and data validation"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def create_invoice_payment_transaction(self, invoice_data: Dict) -> Dict:
        """
        Create a transaction record for a paid invoice
        Returns: {"success": bool, "message": str, "data": Dict}
        """
        try:
            transaction_data = {
                "id": str(uuid.uuid4()),
                "owner_id": invoice_data["owner_id"],
                "type": "money_in",
                "amount": float(invoice_data["total_amount"]),
                "category": "Invoice Payment",
                "description": f"Payment for Invoice {invoice_data['invoice_number']} - {invoice_data['customer_name']}",
                "payment_method": "invoice",
                "reference_id": invoice_data["id"],
                "reference_type": "invoice",
                "date": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table("transactions").insert(transaction_data).execute()
            
            if not result.data:
                return {"success": False, "message": "Failed to create transaction record", "data": None}
            
            return {"success": True, "message": "Transaction record created", "data": result.data[0]}
        except Exception as e:
            logger.error(f"Error creating transaction: {str(e)}")
            return {"success": False, "message": f"Failed to create transaction: {str(e)}", "data": None}
    
    def validate_transaction_data(self, transaction_data: Dict) -> bool:
        """
        Validate transaction data for proper numeric formatting
        Returns: Boolean indicating if validation passed
        """
        try:
            # Validate numeric fields
            try:
                amount = float(transaction_data.get("amount", 0))
                if amount >= 0:
                    return True
            except (ValueError, TypeError):
                logger.warning(f"Invalid transaction amount: {transaction_data.get('amount')}")
                return False
            logger.warning(f"Invalid transaction amount: {amount}")
            return False
        except (ValueError, TypeError) as e:
            logger.error(f"Error validating transaction data: {str(e)}")
            return False
    
    def format_transaction_amount(self, amount: float) -> float:
        """
        Format transaction amount to ensure valid representation
        """
        try:
            formatted_amount = round(amount, 2)
            logger.debug(f"Formatted transaction amount: {formatted_amount}")
            return formatted_amount
        except Exception as e:
            logger.error(f"Error formatting transaction amount: {str(e)}")
            return amount

