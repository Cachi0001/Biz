import logging
from typing import Dict, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class InvoiceInventoryManager:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def reserve_inventory(self, invoice_items: List[Dict], owner_id: str) -> bool:
        """
        Reserve inventory for invoice items when invoice is created
        Returns: Boolean indicating success
        """
        try:
            for item in invoice_items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))
                
                if not product_id or quantity <= 0:
                    continue
                
                # Get current product inventory
                product_result = self.supabase.table("products").select("quantity, reserved_quantity").eq("id", product_id).eq("owner_id", owner_id).single().execute()
                
                if not product_result.data:
                    logger.warning(f"Product {product_id} not found for inventory reservation")
                    continue
                
                product = product_result.data
                current_qty = int(product.get("quantity", 0))
                reserved_qty = int(product.get("reserved_quantity", 0))
                
                # Check if enough inventory available
                if current_qty < quantity:
                    logger.warning(f"Insufficient inventory for product {product_id}: available={current_qty}, requested={quantity}")
                    return False
                
                # Update reserved quantity
                new_reserved = reserved_qty + quantity
                
                self.supabase.table("products").update({
                    "reserved_quantity": new_reserved,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", product_id).execute()
                
                logger.info(f"Reserved {quantity} units of product {product_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error reserving inventory: {str(e)}")
            return False
    
    def validate_stock_availability(self, invoice_items: List[Dict], owner_id: str) -> Dict:
        """
        Validate stock availability for invoice items before creation
        Returns: Dict with validation result and details
        """
        try:
            validation_result = {
                "valid": True,
                "errors": [],
                "warnings": []
            }
            
            for item in invoice_items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))
                
                if not product_id or quantity <= 0:
                    continue
                
                # Get current product inventory
                product_result = self.supabase.table("products").select("name, quantity, reserved_quantity").eq("id", product_id).eq("owner_id", owner_id).single().execute()
                
                if not product_result.data:
                    validation_result["valid"] = False
                    validation_result["errors"].append(f"Product {product_id} not found")
                    continue
                
                product = product_result.data
                product_name = product.get("name", f"Product {product_id}")
                current_qty = int(product.get("quantity", 0))
                reserved_qty = int(product.get("reserved_quantity", 0))
                available_qty = current_qty - reserved_qty
                
                # Check if enough inventory available
                if available_qty < quantity:
                    validation_result["valid"] = False
                    validation_result["errors"].append(
                        f"Insufficient stock for {product_name}: available={available_qty}, requested={quantity}"
                    )
                elif available_qty < quantity * 1.2:  # Warning if less than 20% buffer
                    validation_result["warnings"].append(
                        f"Low stock warning for {product_name}: only {available_qty} units available"
                    )
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating stock availability: {str(e)}")
            return {
                "valid": False,
                "errors": [f"Stock validation failed: {str(e)}"],
                "warnings": []
            }

    def release_inventory(self, invoice_items: List[Dict], owner_id: str) -> bool:
        try:
            for item in invoice_items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))
                
                if not product_id or quantity <= 0:
                    continue
                
                # Get current product inventory
                product_result = self.supabase.table("products").select("reserved_quantity").eq("id", product_id).eq("owner_id", owner_id).single().execute()
                
                if not product_result.data:
                    continue
                
                product = product_result.data
                reserved_qty = int(product.get("reserved_quantity", 0))
                
                # Release reserved quantity
                new_reserved = max(0, reserved_qty - quantity)
                
                self.supabase.table("products").update({
                    "reserved_quantity": new_reserved,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", product_id).execute()
                
                logger.info(f"Released {quantity} units of product {product_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error releasing inventory: {str(e)}")
            return False
    
    def deduct_inventory(self, invoice_items: List[Dict], owner_id: str) -> bool:
        """
        Deduct inventory when invoice is paid
        Returns: Boolean indicating success
        """
        try:
            for item in invoice_items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))
                
                if not product_id or quantity <= 0:
                    continue
                
                # Get current product inventory
                product_result = self.supabase.table("products").select("quantity, reserved_quantity").eq("id", product_id).eq("owner_id", owner_id).single().execute()
                
                if not product_result.data:
                    continue
                
                product = product_result.data
                current_qty = int(product.get("quantity", 0))
                reserved_qty = int(product.get("reserved_quantity", 0))
                
                # Deduct from both available and reserved quantities
                new_qty = max(0, current_qty - quantity)
                new_reserved = max(0, reserved_qty - quantity)
                
                self.supabase.table("products").update({
                    "quantity": new_qty,
                    "reserved_quantity": new_reserved,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", product_id).execute()
                
                logger.info(f"Deducted {quantity} units of product {product_id}, new quantity: {new_qty}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deducting inventory: {str(e)}")
            return False
    
    def get_inventory_status(self, product_id: str, owner_id: str) -> Dict:
        """
        Get inventory status for a specific product
        Returns: Dictionary with inventory details
        """
        try:
            product_result = self.supabase.table("products").select("quantity, reserved_quantity, name").eq("id", product_id).eq("owner_id", owner_id).single().execute()
            
            if not product_result.data:
                return {"available": 0, "reserved": 0, "total": 0, "name": "Unknown"}
            
            product = product_result.data
            available = int(product.get("quantity", 0))
            reserved = int(product.get("reserved_quantity", 0))
            total = available + reserved
            
            return {
                "available": available,
                "reserved": reserved,
                "total": total,
                "name": product.get("name", "Unknown")
            }
            
        except Exception as e:
            logger.error(f"Error getting inventory status: {str(e)}")
            return {"available": 0, "reserved": 0, "total": 0, "name": "Unknown"}
    
    def validate_inventory_availability(self, invoice_items: List[Dict], owner_id: str) -> Dict:
        """
        Validate that sufficient inventory is available for all items
        Returns: {"valid": bool, "message": str, "insufficient_items": List[Dict]}
        """
        try:
            insufficient_items = []
            
            for item in invoice_items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))
                
                if not product_id or quantity <= 0:
                    continue
                
                inventory_status = self.get_inventory_status(product_id, owner_id)
                available = inventory_status["available"]
                
                if available < quantity:
                    insufficient_items.append({
                        "product_id": product_id,
                        "product_name": inventory_status["name"],
                        "requested": quantity,
                        "available": available,
                        "shortage": quantity - available
                    })
            
            if insufficient_items:
                return {
                    "valid": False,
                    "message": f"Insufficient inventory for {len(insufficient_items)} products",
                    "insufficient_items": insufficient_items
                }
            
            return {
                "valid": True,
                "message": "Sufficient inventory available",
                "insufficient_items": []
            }
            
        except Exception as e:
            logger.error(f"Error validating inventory availability: {str(e)}")
            return {
                "valid": False,
                "message": f"Error validating inventory: {str(e)}",
                "insufficient_items": []
            }
