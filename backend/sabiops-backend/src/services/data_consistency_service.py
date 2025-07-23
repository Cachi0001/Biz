"""
Data Consistency Service for SabiOps
Ensures data integrity across all business entities
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

class DataConsistencyService:
    """Service to maintain data consistency across all business entities"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def validate_sale_consistency(self, sale_data: Dict, owner_id: str) -> Tuple[bool, Optional[str]]:
        """
        Validate sale data consistency with products and customers
        Returns: (is_valid, error_message)
        """
        try:
            # Validate product exists and has sufficient stock
            product_result = self.supabase.table("products").select("*").eq("id", sale_data["product_id"]).eq("owner_id", owner_id).single().execute()
            
            if not product_result.data:
                return False, "Product not found"
            
            product = product_result.data
            requested_quantity = int(sale_data["quantity"])
            available_quantity = int(product.get("quantity", 0))
            
            if available_quantity < requested_quantity:
                return False, f"Insufficient stock. Available: {available_quantity}, Requested: {requested_quantity}"
            
            # Validate customer exists if customer_id is provided
            if sale_data.get("customer_id"):
                customer_result = self.supabase.table("customers").select("id").eq("id", sale_data["customer_id"]).eq("owner_id", owner_id).single().execute()
                if not customer_result.data:
                    return False, "Customer not found"
            
            # Validate pricing consistency
            unit_price = float(sale_data["unit_price"])
            total_amount = float(sale_data["total_amount"])
            expected_total = unit_price * requested_quantity
            
            if abs(total_amount - expected_total) > 0.01:  # Allow for small rounding differences
                return False, f"Price calculation error. Expected: {expected_total}, Provided: {total_amount}"
            
            return True, None
            
        except Exception as e:
            logger.error(f"Error validating sale consistency: {str(e)}")
            return False, f"Validation error: {str(e)}"
    
    def update_inventory_on_sale(self, product_id: str, quantity: int, owner_id: str) -> Tuple[bool, Optional[str]]:
        """
        Update product inventory when a sale is made
        Returns: (success, error_message)
        """
        try:
            # Get current product data
            product_result = self.supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).single().execute()
            
            if not product_result.data:
                return False, "Product not found"
            
            product = product_result.data
            current_quantity = int(product.get("quantity", 0))
            new_quantity = current_quantity - quantity
            
            if new_quantity < 0:
                return False, f"Cannot reduce stock below zero. Current: {current_quantity}, Requested: {quantity}"
            
            # Update inventory
            self.supabase.table("products").update({
                "quantity": new_quantity,
                "updated_at": datetime.now().isoformat()
            }).eq("id", product_id).execute()
            
            logger.info(f"Inventory updated for product {product_id}: {current_quantity} -> {new_quantity}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error updating inventory: {str(e)}")
            return False, f"Inventory update error: {str(e)}"
    
    def create_transaction_record(self, transaction_data: Dict) -> Tuple[bool, Optional[str]]:
        """
        Create a transaction record for sales or expenses
        Returns: (success, error_message)
        """
        try:
            # Validate required fields
            required_fields = ["owner_id", "type", "amount", "reference_id", "reference_type"]
            for field in required_fields:
                if not transaction_data.get(field):
                    return False, f"Missing required field: {field}"
            
            # Insert transaction record
            self.supabase.table("transactions").insert(transaction_data).execute()
            
            logger.info(f"Transaction record created: {transaction_data['reference_type']} {transaction_data['reference_id']}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error creating transaction record: {str(e)}")
            return False, f"Transaction creation error: {str(e)}"
    
    def validate_customer_data_consistency(self, customer_id: str, owner_id: str) -> Dict:
        """
        Calculate and validate customer statistics
        Returns: customer statistics dictionary
        """
        try:
            # Get customer sales data
            sales_result = self.supabase.table("sales").select("total_amount, date").eq("customer_id", customer_id).eq("owner_id", owner_id).execute()
            
            total_spent = 0
            purchase_count = 0
            last_purchase_date = None
            
            if sales_result.data:
                total_spent = sum(float(sale.get("total_amount", 0)) for sale in sales_result.data)
                purchase_count = len(sales_result.data)
                
                # Find most recent purchase
                dates = [sale.get("date") for sale in sales_result.data if sale.get("date")]
                if dates:
                    last_purchase_date = max(dates)
            
            return {
                "total_spent": total_spent,
                "purchase_count": purchase_count,
                "last_purchase_date": last_purchase_date
            }
            
        except Exception as e:
            logger.error(f"Error validating customer data: {str(e)}")
            return {
                "total_spent": 0,
                "purchase_count": 0,
                "last_purchase_date": None
            }
    
    def validate_product_data_consistency(self, product_id: str, owner_id: str) -> Dict:
        """
        Calculate and validate product statistics
        Returns: product statistics dictionary
        """
        try:
            # Get product sales data
            sales_result = self.supabase.table("sales").select("quantity, total_amount").eq("product_id", product_id).eq("owner_id", owner_id).execute()
            
            total_sold = 0
            total_revenue = 0
            
            if sales_result.data:
                total_sold = sum(int(sale.get("quantity", 0)) for sale in sales_result.data)
                total_revenue = sum(float(sale.get("total_amount", 0)) for sale in sales_result.data)
            
            return {
                "total_sold": total_sold,
                "total_revenue": total_revenue
            }
            
        except Exception as e:
            logger.error(f"Error validating product data: {str(e)}")
            return {
                "total_sold": 0,
                "total_revenue": 0
            }
    
    def recalculate_dashboard_metrics(self, owner_id: str) -> Dict:
        """
        Recalculate all dashboard metrics from actual data
        Returns: dashboard metrics dictionary
        """
        try:
            metrics = {
                "revenue": {"total": 0, "this_month": 0},
                "expenses": {"total": 0, "this_month": 0},
                "customers": {"total": 0, "new_this_month": 0},
                "products": {"total": 0, "low_stock": 0},
                "net_profit": {"total": 0, "this_month": 0}
            }
            
            # Calculate current month start
            now = datetime.now()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Get sales data
            sales_result = self.supabase.table("sales").select("total_amount, profit_from_sales, date").eq("owner_id", owner_id).execute()
            if sales_result.data:
                for sale in sales_result.data:
                    amount = float(sale.get("total_amount", 0))
                    metrics["revenue"]["total"] += amount
                    
                    # Check if this month
                    sale_date_str = sale.get("date")
                    if sale_date_str:
                        try:
                            sale_date = datetime.fromisoformat(sale_date_str.replace('Z', '+00:00'))
                            if sale_date >= month_start:
                                metrics["revenue"]["this_month"] += amount
                        except:
                            pass
            
            # Get expenses data
            expenses_result = self.supabase.table("expenses").select("amount, date").eq("owner_id", owner_id).execute()
            if expenses_result.data:
                for expense in expenses_result.data:
                    amount = float(expense.get("amount", 0))
                    metrics["expenses"]["total"] += amount
                    
                    # Check if this month
                    expense_date_str = expense.get("date")
                    if expense_date_str:
                        try:
                            expense_date = datetime.fromisoformat(expense_date_str.replace('Z', '+00:00'))
                            if expense_date >= month_start:
                                metrics["expenses"]["this_month"] += amount
                        except:
                            pass
            
            # Calculate net profit
            metrics["net_profit"]["total"] = metrics["revenue"]["total"] - metrics["expenses"]["total"]
            metrics["net_profit"]["this_month"] = metrics["revenue"]["this_month"] - metrics["expenses"]["this_month"]
            
            # Get customer count
            customers_result = self.supabase.table("customers").select("id, created_at").eq("owner_id", owner_id).execute()
            if customers_result.data:
                metrics["customers"]["total"] = len(customers_result.data)
                
                # Count new customers this month
                for customer in customers_result.data:
                    created_at_str = customer.get("created_at")
                    if created_at_str:
                        try:
                            created_date = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                            if created_date >= month_start:
                                metrics["customers"]["new_this_month"] += 1
                        except:
                            pass
            
            # Get product statistics
            products_result = self.supabase.table("products").select("id, quantity, low_stock_threshold").eq("owner_id", owner_id).eq("active", True).execute()
            if products_result.data:
                metrics["products"]["total"] = len(products_result.data)
                
                # Count low stock products
                for product in products_result.data:
                    quantity = int(product.get("quantity", 0))
                    threshold = int(product.get("low_stock_threshold", 5))
                    if quantity <= threshold:
                        metrics["products"]["low_stock"] += 1
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error recalculating dashboard metrics: {str(e)}")
            return {}
    
    def validate_data_relationships(self, owner_id: str) -> List[Dict]:
        """
        Validate all data relationships and return any inconsistencies found
        Returns: list of inconsistency reports
        """
        inconsistencies = []
        
        try:
            # Check for sales with invalid product references
            sales_result = self.supabase.table("sales").select("id, product_id, product_name").eq("owner_id", owner_id).execute()
            if sales_result.data:
                for sale in sales_result.data:
                    product_result = self.supabase.table("products").select("id, name").eq("id", sale["product_id"]).eq("owner_id", owner_id).single().execute()
                    if not product_result.data:
                        inconsistencies.append({
                            "type": "missing_product_reference",
                            "sale_id": sale["id"],
                            "product_id": sale["product_id"],
                            "message": f"Sale references non-existent product {sale['product_id']}"
                        })
                    elif product_result.data["name"] != sale.get("product_name"):
                        inconsistencies.append({
                            "type": "product_name_mismatch",
                            "sale_id": sale["id"],
                            "product_id": sale["product_id"],
                            "message": f"Product name mismatch in sale: expected '{product_result.data['name']}', found '{sale.get('product_name')}'"
                        })
            
            # Check for sales with invalid customer references
            sales_with_customers = self.supabase.table("sales").select("id, customer_id, customer_name").eq("owner_id", owner_id).not_.is_("customer_id", "null").execute()
            if sales_with_customers.data:
                for sale in sales_with_customers.data:
                    customer_result = self.supabase.table("customers").select("id, name").eq("id", sale["customer_id"]).eq("owner_id", owner_id).single().execute()
                    if not customer_result.data:
                        inconsistencies.append({
                            "type": "missing_customer_reference",
                            "sale_id": sale["id"],
                            "customer_id": sale["customer_id"],
                            "message": f"Sale references non-existent customer {sale['customer_id']}"
                        })
            
            # Check for transactions without valid references
            transactions_result = self.supabase.table("transactions").select("id, reference_id, reference_type").eq("owner_id", owner_id).execute()
            if transactions_result.data:
                for transaction in transactions_result.data:
                    ref_type = transaction.get("reference_type")
                    ref_id = transaction.get("reference_id")
                    
                    if ref_type == "sale":
                        sale_result = self.supabase.table("sales").select("id").eq("id", ref_id).eq("owner_id", owner_id).single().execute()
                        if not sale_result.data:
                            inconsistencies.append({
                                "type": "missing_sale_reference",
                                "transaction_id": transaction["id"],
                                "reference_id": ref_id,
                                "message": f"Transaction references non-existent sale {ref_id}"
                            })
                    elif ref_type == "expense":
                        expense_result = self.supabase.table("expenses").select("id").eq("id", ref_id).eq("owner_id", owner_id).single().execute()
                        if not expense_result.data:
                            inconsistencies.append({
                                "type": "missing_expense_reference",
                                "transaction_id": transaction["id"],
                                "reference_id": ref_id,
                                "message": f"Transaction references non-existent expense {ref_id}"
                            })
            
            logger.info(f"Data validation completed for owner {owner_id}. Found {len(inconsistencies)} inconsistencies.")
            return inconsistencies
            
        except Exception as e:
            logger.error(f"Error validating data relationships: {str(e)}")
            return [{"type": "validation_error", "message": f"Validation failed: {str(e)}"}]
    
    def fix_data_inconsistencies(self, owner_id: str, inconsistencies: List[Dict]) -> Dict:
        """
        Attempt to fix identified data inconsistencies
        Returns: summary of fixes applied
        """
        fixes_applied = {
            "successful_fixes": 0,
            "failed_fixes": 0,
            "details": []
        }
        
        try:
            for inconsistency in inconsistencies:
                fix_result = self._fix_single_inconsistency(owner_id, inconsistency)
                if fix_result["success"]:
                    fixes_applied["successful_fixes"] += 1
                else:
                    fixes_applied["failed_fixes"] += 1
                
                fixes_applied["details"].append(fix_result)
            
            logger.info(f"Data consistency fixes completed for owner {owner_id}. Success: {fixes_applied['successful_fixes']}, Failed: {fixes_applied['failed_fixes']}")
            return fixes_applied
            
        except Exception as e:
            logger.error(f"Error fixing data inconsistencies: {str(e)}")
            return {"error": str(e)}
    
    def _fix_single_inconsistency(self, owner_id: str, inconsistency: Dict) -> Dict:
        """
        Fix a single data inconsistency
        Returns: fix result dictionary
        """
        try:
            inconsistency_type = inconsistency.get("type")
            
            if inconsistency_type == "missing_product_reference":
                # Remove sales with invalid product references
                sale_id = inconsistency.get("sale_id")
                self.supabase.table("sales").delete().eq("id", sale_id).execute()
                return {"success": True, "message": f"Removed sale {sale_id} with invalid product reference"}
            
            elif inconsistency_type == "missing_customer_reference":
                # Set customer_id to null for sales with invalid customer references
                sale_id = inconsistency.get("sale_id")
                self.supabase.table("sales").update({
                    "customer_id": None,
                    "customer_name": "Walk-in Customer"
                }).eq("id", sale_id).execute()
                return {"success": True, "message": f"Fixed sale {sale_id} customer reference"}
            
            elif inconsistency_type == "missing_sale_reference":
                # Remove transactions with invalid sale references
                transaction_id = inconsistency.get("transaction_id")
                self.supabase.table("transactions").delete().eq("id", transaction_id).execute()
                return {"success": True, "message": f"Removed transaction {transaction_id} with invalid sale reference"}
            
            elif inconsistency_type == "missing_expense_reference":
                # Remove transactions with invalid expense references
                transaction_id = inconsistency.get("transaction_id")
                self.supabase.table("transactions").delete().eq("id", transaction_id).execute()
                return {"success": True, "message": f"Removed transaction {transaction_id} with invalid expense reference"}
            
            elif inconsistency_type == "product_name_mismatch":
                # Update sale with correct product name
                sale_id = inconsistency.get("sale_id")
                product_id = inconsistency.get("product_id")
                product_result = self.supabase.table("products").select("name").eq("id", product_id).single().execute()
                if product_result.data:
                    self.supabase.table("sales").update({
                        "product_name": product_result.data["name"]
                    }).eq("id", sale_id).execute()
                    return {"success": True, "message": f"Fixed product name in sale {sale_id}"}
            
            return {"success": False, "message": f"Unknown inconsistency type: {inconsistency_type}"}
            
        except Exception as e:
            logger.error(f"Error fixing inconsistency: {str(e)}")
            return {"success": False, "message": f"Fix failed: {str(e)}"}