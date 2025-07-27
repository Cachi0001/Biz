"""
Business Operations Utility
Handles automatic inventory updates, transaction creation, and data consistency
"""

import logging
import json
from datetime import datetime
from typing import Dict, Optional, Tuple
import uuid

logger = logging.getLogger(__name__)

class BusinessOperationsManager:
    """Manages business operations with automatic data consistency"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def _normalize_sale_data(self, sale_data: Dict) -> Dict:
        """
        Normalize sale data to expected format with sale_items array
        Handles both single-item and multi-item sale formats
        
        Args:
            sale_data: Raw sale data from frontend
            
        Returns:
            Normalized data with sale_items array
            
        Raises:
            ValueError: If data format is invalid
        """
        try:
            # Log incoming data for debugging
            logger.debug(f"Normalizing sale data: {type(sale_data)} - Keys: {list(sale_data.keys()) if isinstance(sale_data, dict) else 'Not a dict'}")
            
            if not isinstance(sale_data, dict):
                raise ValueError(f"Sale data must be a dictionary, got {type(sale_data)}")
            
            # Check if data is already in multi-item format
            if 'sale_items' in sale_data and isinstance(sale_data['sale_items'], list):
                logger.debug("Data already in multi-item format")
                return sale_data
            
            # Convert single-item format to multi-item format
            required_fields = ['product_id', 'quantity', 'unit_price']
            missing_fields = [field for field in required_fields if field not in sale_data]
            
            if missing_fields:
                raise ValueError(f"Missing required fields for single-item sale: {missing_fields}")
            
            # Validate data types
            try:
                quantity = int(sale_data['quantity'])
                unit_price = float(sale_data['unit_price'])
                total_amount = float(sale_data.get('total_amount', quantity * unit_price))
            except (ValueError, TypeError) as e:
                raise ValueError(f"Invalid numeric values in sale data: {str(e)}")
            
            if quantity <= 0:
                raise ValueError("Quantity must be greater than 0")
            if unit_price < 0:
                raise ValueError("Unit price cannot be negative")
            
            # Create normalized format
            normalized_data = {
                'sale_items': [
                    {
                        'product_id': sale_data['product_id'],
                        'quantity': quantity,
                        'unit_price': unit_price,
                        'total_amount': total_amount
                    }
                ],
                'customer_id': sale_data.get('customer_id'),
                'customer_name': sale_data.get('customer_name'),
                'customer_email': sale_data.get('customer_email'),
                'payment_method': sale_data.get('payment_method', 'cash'),
                'payment_status': sale_data.get('payment_status', 'completed'),
                'date': sale_data.get('date'),
                'notes': sale_data.get('notes'),
                'discount_amount': sale_data.get('discount_amount', 0),
                'tax_amount': sale_data.get('tax_amount', 0),
                'currency': sale_data.get('currency', 'NGN'),
                'total_amount': total_amount,
                'total_items': 1
            }
            
            logger.debug(f"Successfully normalized single-item sale data")
            return normalized_data
            
        except Exception as e:
            logger.error(f"Error normalizing sale data: {str(e)} - Data: {sale_data}")
            raise ValueError(f"Data normalization failed: {str(e)}")
    
    def process_sale_transaction(self, sale_data: Dict, owner_id: str) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Process a complete sale transaction with automatic inventory updates and transaction creation
        Handles both single-item and multi-item sale formats
        
        Args:
            sale_data: Sale data in any supported format
            owner_id: ID of the business owner
            
        Returns:
            Tuple of (success, error_message, sale_record)
        """
        # Handle string data (JSON parsing)
        if isinstance(sale_data, str):
            try:
                sale_data = json.loads(sale_data)
            except json.JSONDecodeError:
                logger.error(f"Failed to decode JSON string in process_sale_transaction: {sale_data}")
                return False, "Invalid JSON format for sale data", None
        
        # Validate data type
        if not isinstance(sale_data, dict):
            logger.error(f"process_sale_transaction received non-dictionary data: {type(sale_data)}, content: {sale_data}")
            return False, "Invalid sale data format. Expected a dictionary.", None
        
        try:
            # Normalize sale data to expected format
            try:
                normalized_data = self._normalize_sale_data(sale_data)
                logger.debug(f"Sale data normalized successfully for owner {owner_id}")
            except ValueError as e:
                logger.error(f"Data normalization failed: {str(e)} - Original data: {sale_data}")
                return False, f"Data validation error: {str(e)}", None
            
            # Initialize aggregated totals
            total_amount_aggregated = 0.0
            total_cogs_aggregated = 0.0
            profit_from_sales_aggregated = 0.0
            
            sale_items = normalized_data.get('sale_items', [])
            if not sale_items:
                logger.error(f"No sale items found after normalization - Data: {normalized_data}")
                return False, "No sale items provided", None

            # Process each item in the sale
            for item in sale_items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 0))
                unit_price = float(item.get("unit_price", 0))
                
                if not product_id or quantity <= 0 or unit_price < 0:
                    return False, "Invalid product details in sale items", None

                product_result = self.supabase.table("products").select("name, cost_price").eq("id", product_id).single().execute()
                if not product_result.data:
                    return False, f"Product with ID {product_id} not found", None
                product = product_result.data

                cost_price = float(product.get("cost_price", 0))
                item_total_amount = quantity * unit_price
                item_total_cogs = quantity * cost_price
                item_profit_from_sales = item_total_amount - item_total_cogs

                total_amount_aggregated += item_total_amount
                total_cogs_aggregated += item_total_cogs
                profit_from_sales_aggregated += item_profit_from_sales

                # Call the RPC for each item
                result = self.supabase.rpc('create_sale_transaction', {
                    "p_owner_id": owner_id,
                    "p_product_id": product_id,
                    "p_quantity": quantity,
                    "p_unit_price": unit_price,
                    "p_total_amount": item_total_amount,
                    "p_total_cogs": item_total_cogs,
                    "p_salesperson_id": owner_id, # Assuming the logged in user is the salesperson
                    "p_customer_id": normalized_data.get("customer_id"),
                    "p_customer_name": normalized_data.get("customer_name"),
                    "p_payment_method": normalized_data.get("payment_method", "cash"),
                    "p_product_name": product.get("name"),
                    "p_notes": normalized_data.get("notes"),
                    "p_date": normalized_data.get("date"),
                    "p_discount_amount": normalized_data.get("discount_amount", 0),
                    "p_tax_amount": normalized_data.get("tax_amount", 0),
                    "p_currency": normalized_data.get("currency", "NGN"),
                    "p_payment_status": normalized_data.get("payment_status", "completed")
                }).execute()

                if result.error:
                    raise Exception(result.error.message)

            # After processing all items, fetch the last created sale record or a summary
            # For simplicity, we'll return a summary of the aggregated totals
            # If you need individual sale records for each item, you'd collect new_sale_id from each RPC call
            
            # The function returns the new sale_id. We can use that to fetch the created sale record.
            new_sale_id = result.data
            if not new_sale_id:
                 return False, "Failed to create sale, no ID returned", None

            sale_record_result = self.supabase.table('sales').select('*').eq('id', new_sale_id).single().execute()
            
            if sale_record_result.error:
                raise Exception(sale_record_result.error.message)

            return True, None, sale_record_result.data

        except Exception as e:
            logger.error(f"Error processing sale transaction: {str(e)}")
            error_message = str(e)
            try:
                if isinstance(e, Exception) and hasattr(e, 'message'):
                    error_message = e.message
            except:
                pass
            return False, f"Transaction processing error: {error_message}", None
    
    def process_expense_transaction(self, expense_data: Dict, owner_id: str) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Process a complete expense transaction with transaction records
        Returns: (success, error_message, expense_record)
        """
        try:
            # Create expense record
            expense_id = str(uuid.uuid4())
            expense_record = {
                "id": expense_id,
                "owner_id": owner_id,
                "category": expense_data["category"],
                "sub_category": expense_data.get("sub_category", ""),
                "amount": float(expense_data["amount"]),
                "description": expense_data.get("description", ""),
                "receipt_url": expense_data.get("receipt_url", ""),
                "payment_method": expense_data.get("payment_method", "cash"),
                "date": expense_data["date"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Insert expense record
            expense_result = self.supabase.table("expenses").insert(expense_record).execute()
            if not expense_result.data:
                return False, "Failed to create expense record", None
            
            # Create transaction record (expense-to-transaction integration)
            transaction_success = self._create_transaction_record({
                "id": str(uuid.uuid4()),
                "owner_id": owner_id,
                "type": "expense",
                "category": expense_data["category"],
                "sub_category": expense_data.get("sub_category", ""),
                "amount": float(expense_data["amount"]),
                "description": expense_data.get("description", f"{expense_data['category']} expense"),
                "reference_id": expense_id,
                "reference_type": "expense",
                "payment_method": expense_data.get("payment_method", "cash"),
                "date": expense_data["date"],
                "created_at": datetime.now().isoformat()
            })
            
            if not transaction_success:
                logger.warning(f"Transaction record creation failed for expense {expense_id}")
                # Don't rollback expense for transaction failure, just log warning
            
            logger.info(f"Expense transaction processed successfully: {expense_id}")
            return True, None, expense_result.data[0]
            
        except Exception as e:
            logger.error(f"Error processing expense transaction: {str(e)}")
            return False, f"Transaction processing error: {str(e)}", None
    
    def reverse_sale_transaction(self, sale_id: str, owner_id: str) -> Tuple[bool, Optional[str]]:
        """
        Reverse a sale transaction (restore inventory, remove transaction record)
        Returns: (success, error_message)
        """
        try:
            # Get sale details
            sale_result = self.supabase.table("sales").select("*").eq("id", sale_id).eq("owner_id", owner_id).single().execute()
            if not sale_result.data:
                return False, "Sale not found"
            
            sale = sale_result.data
            
            # Restore inventory
            product_result = self.supabase.table("products").select("quantity").eq("id", sale["product_id"]).single().execute()
            if product_result.data:
                current_quantity = product_result.data["quantity"]
                restored_quantity = current_quantity + sale["quantity"]
                self.supabase.table("products").update({
                    "quantity": restored_quantity,
                    "updated_at": datetime.now().isoformat()
                }).eq("id", sale["product_id"]).execute()
                
                logger.info(f"Inventory restored for product {sale['product_id']}: {current_quantity} -> {restored_quantity}")
            
            # Remove transaction record
            try:
                self.supabase.table("transactions").delete().eq("reference_id", sale_id).eq("reference_type", "sale").execute()
                logger.info(f"Transaction record removed for sale {sale_id}")
            except Exception as transaction_error:
                logger.warning(f"Failed to remove transaction record: {str(transaction_error)}")
            
            # Delete the sale
            self.supabase.table("sales").delete().eq("id", sale_id).execute()
            
            logger.info(f"Sale transaction reversed successfully: {sale_id}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error reversing sale transaction: {str(e)}")
            return False, f"Transaction reversal error: {str(e)}"
    
    def update_customer_statistics(self, customer_id: str, owner_id: str) -> Dict:
        """
        Update and return customer statistics based on actual sales data
        Returns: customer statistics dictionary
        """
        try:
            # Get customer sales
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
            
            # Update customer record with calculated statistics
            try:
                self.supabase.table("customers").update({
                    "total_spent": total_spent,
                    "purchase_count": purchase_count,
                    "last_purchase_date": last_purchase_date,
                    "updated_at": datetime.now().isoformat()
                }).eq("id", customer_id).execute()
            except Exception as update_error:
                logger.warning(f"Failed to update customer statistics: {str(update_error)}")
            
            return {
                "total_spent": total_spent,
                "purchase_count": purchase_count,
                "last_purchase_date": last_purchase_date
            }
            
        except Exception as e:
            logger.error(f"Error updating customer statistics: {str(e)}")
            return {"total_spent": 0, "purchase_count": 0, "last_purchase_date": None}
    
    def validate_inventory_consistency(self, owner_id: str) -> Dict:
        """
        Validate inventory consistency across products and sales
        Returns: validation report
        """
        try:
            inconsistencies = []
            
            # Get all products
            products_result = self.supabase.table("products").select("*").eq("owner_id", owner_id).eq("active", True).execute()
            
            if products_result.data:
                for product in products_result.data:
                    # Calculate total sold quantity
                    sales_result = self.supabase.table("sales").select("quantity").eq("product_id", product["id"]).eq("owner_id", owner_id).execute()
                    
                    total_sold = 0
                    if sales_result.data:
                        total_sold = sum(int(sale.get("quantity", 0)) for sale in sales_result.data)
                    
                    # Check for negative inventory
                    current_quantity = int(product.get("quantity", 0))
                    if current_quantity < 0:
                        inconsistencies.append({
                            "type": "negative_inventory",
                            "product_id": product["id"],
                            "product_name": product["name"],
                            "current_quantity": current_quantity,
                            "message": f"Product has negative inventory: {current_quantity}"
                        })
                    
                    # Check for low stock
                    threshold = int(product.get("low_stock_threshold", 5))
                    if current_quantity <= threshold and current_quantity > 0:
                        inconsistencies.append({
                            "type": "low_stock_warning",
                            "product_id": product["id"],
                            "product_name": product["name"],
                            "current_quantity": current_quantity,
                            "threshold": threshold,
                            "message": f"Product is low on stock: {current_quantity} (threshold: {threshold})"
                        })
            
            return {
                "inconsistencies": inconsistencies,
                "total_issues": len(inconsistencies),
                "is_consistent": len(inconsistencies) == 0
            }
            
        except Exception as e:
            logger.error(f"Error validating inventory consistency: {str(e)}")
            return {"error": str(e)}
    
    def _create_transaction_record(self, transaction_data: Dict) -> bool:
        """
        Create a transaction record
        Returns: success boolean
        """
        try:
            self.supabase.table("transactions").insert(transaction_data).execute()
            return True
        except Exception as e:
            logger.error(f"Error creating transaction record: {str(e)}")
            return False
    
    def ensure_data_consistency(self, owner_id: str) -> Dict:
        """
        Ensure data consistency across all business entities
        Returns: consistency report
        """
        try:
            report = {
                "inventory_validation": self.validate_inventory_consistency(owner_id),
                "customer_updates": 0,
                "transaction_fixes": 0,
                "dashboard_metrics_updated": False,
                "data_validation_issues": 0,
                "errors": []
            }
            
            # Update all customer statistics based on actual sales data
            try:
                customers_result = self.supabase.table("customers").select("id").eq("owner_id", owner_id).execute()
                if customers_result.data:
                    for customer in customers_result.data:
                        self.update_customer_statistics(customer["id"], owner_id)
                        report["customer_updates"] += 1
            except Exception as customer_error:
                report["errors"].append(f"Customer statistics update failed: {str(customer_error)}")
            
            # Validate and fix missing transaction records for sales and expenses
            try:
                # Check sales without transaction records
                sales_result = self.supabase.table("sales").select("*").eq("owner_id", owner_id).execute()
                if sales_result.data:
                    for sale in sales_result.data:
                        transaction_result = self.supabase.table("transactions").select("id").eq("reference_id", sale["id"]).eq("reference_type", "sale").execute()
                        if not transaction_result.data:
                            # Create missing transaction record for sale
                            transaction_success = self._create_transaction_record({
                                "id": str(uuid.uuid4()),
                                "owner_id": owner_id,
                                "type": "income",
                                "category": "Sales",
                                "amount": float(sale.get("total_amount", 0)),
                                "description": f"Sale of {sale.get('quantity', 1)}x {sale.get('product_name', 'Product')} to {sale.get('customer_name', 'Customer')}",
                                "reference_id": sale["id"],
                                "reference_type": "sale",
                                "payment_method": sale.get("payment_method", "cash"),
                                "date": sale.get("date", sale.get("created_at")),
                                "created_at": datetime.now().isoformat()
                            })
                            if transaction_success:
                                report["transaction_fixes"] += 1
                                logger.info(f"Created missing transaction record for sale {sale['id']}")
                
                # Check expenses without transaction records
                expenses_result = self.supabase.table("expenses").select("*").eq("owner_id", owner_id).execute()
                if expenses_result.data:
                    for expense in expenses_result.data:
                        transaction_result = self.supabase.table("transactions").select("id").eq("reference_id", expense["id"]).eq("reference_type", "expense").execute()
                        if not transaction_result.data:
                            # Create missing transaction record for expense
                            transaction_success = self._create_transaction_record({
                                "id": str(uuid.uuid4()),
                                "owner_id": owner_id,
                                "type": "expense",
                                "category": expense.get("category", "Other"),
                                "sub_category": expense.get("sub_category", ""),
                                "amount": float(expense.get("amount", 0)),
                                "description": expense.get("description", f"{expense.get('category', 'Other')} expense"),
                                "reference_id": expense["id"],
                                "reference_type": "expense",
                                "payment_method": expense.get("payment_method", "cash"),
                                "date": expense.get("date"),
                                "created_at": datetime.now().isoformat()
                            })
                            if transaction_success:
                                report["transaction_fixes"] += 1
                                logger.info(f"Created missing transaction record for expense {expense['id']}")
                                
            except Exception as transaction_error:
                report["errors"].append(f"Transaction validation failed: {str(transaction_error)}")
            
            # Validate data relationships across all entities
            try:
                from ..services.data_consistency_service import DataConsistencyService
                consistency_service = DataConsistencyService(self.supabase)
                
                # Validate all data relationships
                inconsistencies = consistency_service.validate_data_relationships(owner_id)
                report["data_validation_issues"] = len(inconsistencies)
                
                if inconsistencies:
                    # Attempt to fix inconsistencies
                    fix_results = consistency_service.fix_data_inconsistencies(owner_id, inconsistencies)
                    report["inconsistency_fixes"] = fix_results
                    logger.info(f"Fixed {fix_results.get('successful_fixes', 0)} data inconsistencies")
                
                # Update dashboard metrics to ensure accuracy
                accurate_metrics = consistency_service.recalculate_dashboard_metrics(owner_id)
                if accurate_metrics:
                    report["dashboard_metrics_updated"] = True
                    report["accurate_metrics"] = accurate_metrics
                    logger.info("Dashboard metrics recalculated from actual data")
                
            except Exception as validation_error:
                report["errors"].append(f"Data validation failed: {str(validation_error)}")
            
            # Ensure inventory consistency across all products
            try:
                products_result = self.supabase.table("products").select("*").eq("owner_id", owner_id).eq("active", True).execute()
                if products_result.data:
                    inventory_issues = 0
                    for product in products_result.data:
                        # Check for negative inventory
                        current_quantity = int(product.get("quantity", 0))
                        if current_quantity < 0:
                            # Fix negative inventory by setting to 0
                            self.supabase.table("products").update({
                                "quantity": 0,
                                "updated_at": datetime.now().isoformat()
                            }).eq("id", product["id"]).execute()
                            inventory_issues += 1
                            logger.warning(f"Fixed negative inventory for product {product['id']}: {current_quantity} -> 0")
                    
                    report["inventory_fixes"] = inventory_issues
                    
            except Exception as inventory_error:
                report["errors"].append(f"Inventory consistency check failed: {str(inventory_error)}")
            
            logger.info(f"Complete data consistency check completed for owner {owner_id}: {report}")
            return report
            
        except Exception as e:
            logger.error(f"Error ensuring data consistency: {str(e)}")
            return {"error": str(e)}