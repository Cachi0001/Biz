import logging
import json
from datetime import datetime
from typing import Dict, Optional, Tuple, Any
import uuid
import traceback
from enum import Enum

# Configure logger with structured format
logger = logging.getLogger(__name__)

class TransactionErrorCode(Enum):
    """Enumeration of transaction error codes for better error categorization"""
    JSON_PARSE_ERROR = "JSON_PARSE_ERROR"
    DATA_VALIDATION_ERROR = "DATA_VALIDATION_ERROR"
    PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND"
    INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK"
    DATABASE_ERROR = "DATABASE_ERROR"
    RPC_ERROR = "RPC_ERROR"
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"

class TransactionError(Exception):
    """Custom exception for transaction processing errors"""
    def __init__(self, message: str, error_code: TransactionErrorCode, context: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code
        self.context = context or {}
        super().__init__(self.message)

class ErrorHandler:
    """Centralized error handling for transaction processing"""
    
    @staticmethod
    def log_error(error: Exception, context: Dict[str, Any] = None, level: str = "error"):
        """Log error with structured context information"""
        error_info = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {},
            "timestamp": datetime.now().isoformat(),
            "stack_trace": traceback.format_exc()
        }
        
        if level == "error":
            logger.error(f"Transaction Error: {json.dumps(error_info, indent=2)}")
        elif level == "warning":
            logger.warning(f"Transaction Warning: {json.dumps(error_info, indent=2)}")
        else:
            logger.info(f"Transaction Info: {json.dumps(error_info, indent=2)}")
    
    @staticmethod
    def categorize_error(error: Exception) -> TransactionErrorCode:
        """Categorize error based on error message and type"""
        error_str = str(error).upper()
        
        if "JSON" in error_str or "DECODE" in error_str:
            return TransactionErrorCode.JSON_PARSE_ERROR
        elif "PRODUCT" in error_str and ("NOT FOUND" in error_str or "MISSING" in error_str):
            return TransactionErrorCode.PRODUCT_NOT_FOUND
        elif "INSUFFICIENT" in error_str or "STOCK" in error_str:
            return TransactionErrorCode.INSUFFICIENT_STOCK
        elif "DATABASE" in error_str or "CONNECTION" in error_str or "SUPABASE" in error_str:
            return TransactionErrorCode.DATABASE_ERROR
        elif "RPC" in error_str or "FUNCTION" in error_str:
            return TransactionErrorCode.RPC_ERROR
        elif "VALIDATION" in error_str or "INVALID" in error_str:
            return TransactionErrorCode.DATA_VALIDATION_ERROR
        else:
            return TransactionErrorCode.UNKNOWN_ERROR
    
    @staticmethod
    def get_user_friendly_message(error_code: TransactionErrorCode, original_message: str = "") -> str:
        """Get user-friendly error message based on error code"""
        messages = {
            TransactionErrorCode.JSON_PARSE_ERROR: "Invalid data format. Please check your request and try again.",
            TransactionErrorCode.DATA_VALIDATION_ERROR: f"Data validation failed: {original_message}",
            TransactionErrorCode.PRODUCT_NOT_FOUND: "One or more products could not be found. Please verify product information.",
            TransactionErrorCode.INSUFFICIENT_STOCK: "Insufficient inventory for this transaction. Please check stock levels.",
            TransactionErrorCode.DATABASE_ERROR: "Database connection issue. Please try again in a moment.",
            TransactionErrorCode.RPC_ERROR: "Transaction processing failed. Please try again.",
            TransactionErrorCode.BUSINESS_LOGIC_ERROR: f"Business rule violation: {original_message}",
            TransactionErrorCode.UNKNOWN_ERROR: "An unexpected error occurred. Please contact support if this persists."
        }
        return messages.get(error_code, original_message)

class BusinessOperationsManager:
    """Manages business operations with automatic data consistency"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def _create_error_response(self, error: Exception, context: Dict[str, Any] = None) -> Tuple[bool, str, None]:
        """Create standardized error response with proper categorization"""
        error_code = ErrorHandler.categorize_error(error)
        user_message = ErrorHandler.get_user_friendly_message(error_code, str(error))
        
        # Log the error with context
        ErrorHandler.log_error(error, context)
        
        return False, f"Transaction processing error: {user_message}", None
    
    def _log_transaction_start(self, operation: str, context: Dict[str, Any]):
        """Log transaction start with context"""
        logger.info(f"Starting {operation} - Context: {json.dumps(context, default=str)}")
    
    def _log_transaction_success(self, operation: str, result_summary: Dict[str, Any]):
        """Log successful transaction completion"""
        logger.info(f"Successfully completed {operation} - Summary: {json.dumps(result_summary, default=str)}")
    
    def _validate_owner_id(self, owner_id: str) -> bool:
        """Validate owner ID format"""
        if not owner_id or not isinstance(owner_id, str):
            return False
        try:
            uuid.UUID(owner_id)
            return True
        except ValueError:
            return False
    
    def _normalize_sale_data(self, sale_data: Dict) -> Dict:
        try:
            # Log incoming data for debugging
            logger.debug(f"Normalizing sale data: {type(sale_data)} - Keys: {list(sale_data.keys()) if isinstance(sale_data, dict) else 'Not a dict'}")
            logger.debug(f"Full sale data content: {sale_data}")
            
            if not isinstance(sale_data, dict):
                raise ValueError(f"Sale data must be a dictionary, got {type(sale_data)}")
            
            # Check if data is already in multi-item format
            if 'sale_items' in sale_data and isinstance(sale_data['sale_items'], list):
                logger.debug(f"Data already in multi-item format with {len(sale_data['sale_items'])} items")
                # Validate that each item in sale_items is a dictionary
                for i, item in enumerate(sale_data['sale_items']):
                    if not isinstance(item, dict):
                        logger.error(f"Sale item {i} is not a dictionary: {type(item)} - {item}")
                        raise ValueError(f"Sale item {i} must be a dictionary, got {type(item).__name__}")
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
            # Use structured error logging
            error_context = {
                "method": "_normalize_sale_data",
                "data_type": type(sale_data).__name__,
                "data_keys": list(sale_data.keys()) if isinstance(sale_data, dict) else None,
                "data_size": len(str(sale_data))
            }
            
            ErrorHandler.log_error(e, error_context)
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
        # Log transaction start
        self._log_transaction_start("process_sale_transaction", {
            "owner_id": owner_id,
            "data_type": type(sale_data).__name__,
            "data_size": len(str(sale_data))
        })
        
        # Validate owner ID
        if not self._validate_owner_id(owner_id):
            error = ValueError(f"Invalid owner ID format: {owner_id}")
            return self._create_error_response(error, {"owner_id": owner_id})
        
        # Handle string data (JSON parsing)
        if isinstance(sale_data, str):
            try:
                sale_data = json.loads(sale_data)
                logger.debug("Successfully parsed JSON string data")
            except json.JSONDecodeError as e:
                error_context = {"raw_data": sale_data[:200], "owner_id": owner_id}
                return self._create_error_response(e, error_context)
        
        # Validate data type
        if not isinstance(sale_data, dict):
            error = ValueError(f"Invalid sale data format. Expected dictionary, got {type(sale_data)}")
            error_context = {"data_type": type(sale_data).__name__, "owner_id": owner_id}
            return self._create_error_response(error, error_context)
        
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

            # Process each item in the sale with enhanced error handling
            processed_items = []
            last_sale_id = None
            
            logger.info(f"Processing {len(sale_items)} sale items for owner {owner_id}")
            
            for item_index, item in enumerate(sale_items):
                try:
                    # Debug: Log item type and content
                    logger.debug(f"Processing item {item_index}: type={type(item)}, content={item}")
                    
                    # Validate that item is a dictionary
                    if not isinstance(item, dict):
                        logger.error(f"Sale item {item_index} is not a dictionary: {type(item)} - {item}")
                        return False, f"Invalid sale item format at position {item_index + 1}. Expected dictionary, got {type(item).__name__}", None
                    
                    # Validate item data with detailed logging
                    product_id = item.get("product_id")
                    if not product_id:
                        logger.error(f"Missing product_id in sale item {item_index}: {item}")
                        return False, f"Missing product ID in sale item {item_index + 1}", None
                    
                    # Validate and convert numeric values
                    try:
                        quantity = int(item.get("quantity", 0))
                        unit_price = float(item.get("unit_price", 0))
                    except (ValueError, TypeError) as e:
                        logger.error(f"Invalid numeric values in sale item {item_index}: {item} - Error: {str(e)}")
                        return False, f"Invalid numeric values in sale item {item_index + 1}: {str(e)}", None
                    
                    # Business logic validation
                    if quantity <= 0:
                        logger.error(f"Invalid quantity in sale item {item_index}: {quantity}")
                        return False, f"Quantity must be greater than 0 in sale item {item_index + 1}", None
                    
                    if unit_price < 0:
                        logger.error(f"Invalid unit price in sale item {item_index}: {unit_price}")
                        return False, f"Unit price cannot be negative in sale item {item_index + 1}", None

                    # Fetch product details with error handling
                    logger.debug(f"Fetching product details for {product_id}")
                    try:
                        product_result = self.supabase.table("products").select("name, cost_price").eq("id", product_id).single().execute()
                        
                        if not product_result.data:
                            logger.error(f"Product not found: {product_id}")
                            return False, f"Product with ID {product_id} not found", None
                        
                        product = product_result.data
                        logger.debug(f"Product found: {product.get('name', 'Unknown')} - Cost: {product.get('cost_price', 0)}")
                        
                    except Exception as db_error:
                        logger.error(f"Exception fetching product {product_id}: {str(db_error)}")
                        return False, f"Failed to fetch product details: {str(db_error)}", None

                    # Calculate financial metrics
                    cost_price = float(product.get("cost_price", 0))
                    item_total_amount = quantity * unit_price
                    item_total_cogs = quantity * cost_price
                    item_profit_from_sales = item_total_amount - item_total_cogs

                    # Update aggregated totals
                    total_amount_aggregated += item_total_amount
                    total_cogs_aggregated += item_total_cogs
                    profit_from_sales_aggregated += item_profit_from_sales

                    # Prepare RPC parameters with validation
                    rpc_params = {
                        "p_owner_id": owner_id,
                        "p_product_id": product_id,
                        "p_quantity": quantity,
                        "p_unit_price": unit_price,
                        "p_total_amount": item_total_amount,
                        "p_total_cogs": item_total_cogs,
                        "p_salesperson_id": owner_id,
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
                    }
                    
                    logger.debug(f"Calling create_sale_transaction RPC for item {item_index}")
                    
                    # Call the RPC with enhanced error handling
                    try:
                        result = self.supabase.rpc('create_sale_transaction', rpc_params).execute()
                        
                        if not result.data:
                            logger.error(f"RPC returned no data for item {item_index}")
                            return False, "Failed to create sale transaction - no ID returned", None
                        
                        last_sale_id = result.data
                        processed_items.append({
                            "item_index": item_index,
                            "product_id": product_id,
                            "sale_id": last_sale_id,
                            "amount": item_total_amount
                        })
                        
                        logger.info(f"Successfully processed sale item {item_index}: Product {product_id}, Amount {item_total_amount}")
                        
                    except Exception as rpc_error:
                        logger.error(f"Exception during RPC call for item {item_index}: {str(rpc_error)}")
                        return False, f"Transaction processing failed: {str(rpc_error)}", None
                        
                except Exception as item_error:
                    logger.error(f"Error processing sale item {item_index}: {str(item_error)} - Item data: {item}")
                    return False, f"Error processing sale item {item_index + 1}: {str(item_error)}", None

            # Validate that at least one item was processed successfully
            if not processed_items or not last_sale_id:
                logger.error(f"No items were processed successfully - Processed: {len(processed_items)}")
                return False, "No sale items were processed successfully", None
            
            logger.info(f"Successfully processed {len(processed_items)} sale items. Total amount: {total_amount_aggregated}")
            
            # Fetch the last created sale record for return
            try:
                logger.debug(f"Fetching sale record for ID: {last_sale_id}")
                sale_record_result = self.supabase.table('sales').select('*').eq('id', last_sale_id).single().execute()
                
                if not sale_record_result.data:
                    logger.warning(f"Sale record not found after creation: {last_sale_id}")
                    return True, None, {
                        "id": last_sale_id,
                        "total_amount": total_amount_aggregated,
                        "total_cogs": total_cogs_aggregated,
                        "profit_from_sales": profit_from_sales_aggregated,
                        "items_processed": len(processed_items)
                    }
                
                # Enhance the returned record with processing summary
                sale_record = sale_record_result.data
                sale_record["processing_summary"] = {
                    "items_processed": len(processed_items),
                    "total_amount_aggregated": total_amount_aggregated,
                    "total_cogs_aggregated": total_cogs_aggregated,
                    "profit_from_sales_aggregated": profit_from_sales_aggregated
                }
                
                logger.info(f"Sale transaction completed successfully: {last_sale_id}")
                return True, None, sale_record
                
            except Exception as fetch_error:
                logger.error(f"Exception fetching sale record: {str(fetch_error)}")
                # Sale was created successfully, just return summary
                return True, None, {
                    "id": last_sale_id,
                    "total_amount": total_amount_aggregated,
                    "total_cogs": total_cogs_aggregated,
                    "profit_from_sales": profit_from_sales_aggregated,
                    "items_processed": len(processed_items),
                    "note": "Sale created successfully but couldn't fetch full record"
                }

        except Exception as e:
            # Enhanced error logging with context using new error handling system
            error_context = {
                "owner_id": owner_id,
                "original_data_type": type(sale_data).__name__,
                "normalized_data_available": 'normalized_data' in locals(),
                "items_count": len(sale_items) if 'sale_items' in locals() else 0,
                "processed_items": len(processed_items) if 'processed_items' in locals() else 0,
                "method": "process_sale_transaction"
            }
            
            # Use centralized error handling
            ErrorHandler.log_error(e, error_context)
            
            # Categorize error and get user-friendly message
            error_code = ErrorHandler.categorize_error(e)
            user_message = ErrorHandler.get_user_friendly_message(error_code, str(e))
            
            logger.error(f"Returning categorized error - Code: {error_code.value}, Message: {user_message}")
            return False, f"Transaction processing error: {user_message}", None
    
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