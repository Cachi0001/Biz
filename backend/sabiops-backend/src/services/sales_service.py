#!/usr/bin/env python3
"""
Enhanced Sales Service

This service handles sales creation with enhanced payment method integration,
credit sales support, and proper amount tracking for revenue recognition.

Author: SabiOPS Enhanced Payment System
Date: 2025-01-15
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal
from ..config import get_supabase_client
from ..utils.exceptions import ValidationError, DatabaseError, NotFoundError
from .payment_method_service import PaymentMethodService

logger = logging.getLogger(__name__)

class SalesService:
    """Enhanced service for sales creation and management with payment integration"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.payment_method_service = PaymentMethodService()
        if not self.supabase:
            raise DatabaseError("Failed to initialize Supabase client")
    
    def create_sale(self, sale_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new sale with enhanced payment method integration
        
        Args:
            sale_data: Dictionary containing sale information
                Required: product_id, quantity, unit_price, total_amount, payment_method_id, user_id
                Optional: customer_id, customer_name, payment_status, description, 
                         pos_account_name, transaction_type, pos_reference_number
                
        Returns:
            Dict containing the created sale record
            
        Raises:
            ValidationError: If validation fails
            DatabaseError: If database operation fails
        """
        try:
            # Validate required fields
            required_fields = ['product_id', 'quantity', 'unit_price', 'total_amount', 'payment_method_id', 'user_id']
            for field in required_fields:
                if field not in sale_data or sale_data[field] is None:
                    raise ValidationError(f"Missing required field: {field}")
            
            # Validate numeric fields
            try:
                quantity = int(sale_data['quantity'])
                unit_price = Decimal(str(sale_data['unit_price']))
                total_amount = Decimal(str(sale_data['total_amount']))
                
                if quantity <= 0:
                    raise ValidationError("Quantity must be greater than 0")
                if unit_price < 0:
                    raise ValidationError("Unit price cannot be negative")
                if total_amount < 0:
                    raise ValidationError("Total amount cannot be negative")
                    
            except (ValueError, TypeError):
                raise ValidationError("Invalid numeric values provided")
            
            # Get product information for cost calculations
            product_result = self.supabase.table('products').select('*').eq('id', sale_data['product_id']).execute()
            
            if not product_result.data:
                raise ValidationError(f"Product with ID '{sale_data['product_id']}' not found")
            
            product = product_result.data[0]
            cost_price = Decimal(str(product.get('cost_price', 0)))
            
            # Get product category if available
            product_category_id = product.get('category_id')
            if not product_category_id:
                # Try to find category by product name or set default
                category_result = self.supabase.table('product_categories').select('*').eq('name', 'General').execute()
                if category_result.data:
                    product_category_id = category_result.data[0]['id']
            
            # Calculate cost and profit
            total_cogs = cost_price * quantity
            gross_profit = total_amount - total_cogs
            
            # Validate payment method and determine payment status
            payment_method_id = sale_data['payment_method_id']
            payment_status = sale_data.get('payment_status', 'Paid')  # Default to Paid for immediate payments
            
            # Validate payment method exists
            payment_method = self.payment_method_service.get_payment_method_by_id(payment_method_id)
            
            # Initialize amount tracking based on payment status
            if payment_status == 'Paid':
                amount_paid = float(total_amount)
                amount_due = 0.0
            elif payment_status in ['Credit', 'Pending']:
                amount_paid = 0.0
                amount_due = float(total_amount)
            else:
                raise ValidationError(f"Invalid payment status: {payment_status}")
            
            # Prepare sale record
            sale_record = {
                'product_id': sale_data['product_id'],
                'product_name': product.get('name', 'Unknown Product'),
                'quantity': quantity,
                'unit_price': float(unit_price),
                'total_amount': float(total_amount),
                'total_cogs': float(total_cogs),
                'gross_profit': float(gross_profit),
                'profit_from_sales': float(gross_profit),  # Same as gross_profit for now
                
                # Enhanced payment fields
                'payment_method_id': payment_method_id,
                'payment_status': payment_status,
                'amount_paid': amount_paid,
                'amount_due': amount_due,
                
                # Customer information
                'customer_id': sale_data.get('customer_id'),
                'customer_name': sale_data.get('customer_name', 'Walk-in Customer'),
                
                # Product category linking
                'product_category_id': product_category_id,
                
                # User and ownership
                'user_id': sale_data['user_id'],
                'owner_id': sale_data.get('owner_id', sale_data['user_id']),
                'salesperson_id': sale_data.get('salesperson_id', sale_data['user_id']),
                
                # Additional fields
                'description': sale_data.get('description', ''),
                'notes': sale_data.get('notes', ''),
                'date': sale_data.get('date', datetime.utcnow().isoformat()),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Validate total_amount equals amount_paid + amount_due
            if abs((amount_paid + amount_due) - float(total_amount)) > 0.01:  # Allow for small floating point differences
                raise ValidationError("Total amount must equal amount_paid + amount_due")
            
            # Insert sale record
            result = self.supabase.table('sales').insert(sale_record).execute()
            
            if not result.data:
                raise DatabaseError("Failed to create sale record")
            
            created_sale = result.data[0]
            
            # Log sale creation
            logger.info(f"Sale created: {created_sale['id']} - {payment_method['name']} - "
                       f"${total_amount} ({payment_status})")
            
            return created_sale
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error creating sale: {str(e)}")
            raise DatabaseError(f"Failed to create sale: {str(e)}")
    
    def get_sale_by_id(self, sale_id: str) -> Dict[str, Any]:
        """
        Retrieve a sale by ID
        
        Args:
            sale_id: UUID of the sale
            
        Returns:
            Sale record
            
        Raises:
            ValidationError: If sale_id is invalid
            NotFoundError: If sale not found
            DatabaseError: If database query fails
        """
        try:
            if not sale_id:
                raise ValidationError("Sale ID is required")
            
            try:
                UUID(sale_id)
            except ValueError:
                raise ValidationError("Invalid sale ID format")
            
            result = self.supabase.table('sales').select('*').eq('id', sale_id).execute()
            
            if not result.data:
                raise NotFoundError(f"Sale with ID '{sale_id}' not found")
            
            return result.data[0]
            
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error retrieving sale by ID '{sale_id}': {e}")
            raise DatabaseError(f"Failed to retrieve sale: {str(e)}")
    
    def update_sale_status(self, sale_id: str, new_status: str, 
                          payment_method_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Update sale payment status with proper amount tracking
        
        Args:
            sale_id: UUID of the sale to update
            new_status: New payment status ('Paid', 'Credit', 'Pending', 'Cancelled')
            payment_method_id: Payment method ID if changing to paid status
            
        Returns:
            Updated sale record
            
        Raises:
            ValidationError: If validation fails
            NotFoundError: If sale not found
            DatabaseError: If database operation fails
        """
        try:
            # Get the sale record
            sale = self.get_sale_by_id(sale_id)
            
            # Validate new status
            valid_statuses = ['Paid', 'Credit', 'Pending', 'Cancelled']
            if new_status not in valid_statuses:
                raise ValidationError(f"Invalid payment status. Must be one of: {valid_statuses}")
            
            # Validate payment method if marking as paid
            if new_status == 'Paid' and not payment_method_id:
                raise ValidationError("Payment method ID is required when marking sale as paid")
            
            # Prepare update data
            update_data = {
                'payment_status': new_status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            total_amount = Decimal(str(sale.get('total_amount', 0)))
            
            # Handle status-specific updates
            if new_status == 'Paid':
                # Validate payment method exists
                self.payment_method_service.get_payment_method_by_id(payment_method_id)
                
                update_data.update({
                    'amount_paid': float(total_amount),
                    'amount_due': 0.0,
                    'payment_method_id': payment_method_id
                })
            elif new_status in ['Credit', 'Pending']:
                # Set as credit/pending
                current_paid = Decimal(str(sale.get('amount_paid', 0)))
                update_data.update({
                    'amount_due': float(total_amount - current_paid)
                })
            elif new_status == 'Cancelled':
                # Cancel the sale
                update_data.update({
                    'amount_due': 0.0,
                    'notes': f"Sale cancelled on {datetime.utcnow().isoformat()}"
                })
            
            # Update the sale
            result = self.supabase.table('sales').update(update_data).eq('id', sale_id).execute()
            
            if not result.data:
                raise DatabaseError("Failed to update sale status - no data returned")
            
            updated_sale = result.data[0]
            
            logger.info(f"Updated sale {sale_id} status to '{new_status}'")
            
            return updated_sale
            
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error updating sale status for '{sale_id}': {e}")
            raise DatabaseError(f"Failed to update sale status: {str(e)}")
    
    def get_sales_by_user(self, user_id: str, filters: Optional[Dict[str, Any]] = None,
                         limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Retrieve sales for a specific user with optional filters
        
        Args:
            user_id: User ID to filter by
            filters: Optional filters (start_date, end_date, customer_id, product_id, payment_status)
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List of sale records
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            # Build query
            query = self.supabase.table('sales').select('*')
            query = query.eq('user_id', user_id)
            
            # Apply filters if provided
            if filters:
                if 'start_date' in filters and filters['start_date']:
                    query = query.gte('date', filters['start_date'])
                
                if 'end_date' in filters and filters['end_date']:
                    query = query.lte('date', filters['end_date'])
                
                if 'customer_id' in filters and filters['customer_id']:
                    query = query.eq('customer_id', filters['customer_id'])
                
                if 'product_id' in filters and filters['product_id']:
                    query = query.eq('product_id', filters['product_id'])
                
                if 'payment_status' in filters and filters['payment_status']:
                    query = query.eq('payment_status', filters['payment_status'])
            
            # Apply ordering and pagination
            query = query.order('created_at', desc=True)
            query = query.limit(limit).offset(offset)
            
            result = query.execute()
            
            logger.info(f"Retrieved {len(result.data)} sales for user {user_id}")
            return result.data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error retrieving sales for user '{user_id}': {e}")
            raise DatabaseError(f"Failed to retrieve sales: {str(e)}")
    
    def get_sales_summary(self, user_id: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get sales summary with revenue recognition (only paid sales)
        
        Args:
            user_id: User ID to filter by
            filters: Optional filters (start_date, end_date, payment_status)
            
        Returns:
            Dict containing sales summary with revenue recognition
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            # Get all sales for the user
            sales = self.get_sales_by_user(user_id, filters, limit=10000)  # Get all sales
            
            # Initialize summary counters
            total_sales_amount = 0
            recognized_revenue = 0  # Only paid sales
            outstanding_credit = 0  # Credit and pending sales
            total_transactions = len(sales)
            paid_transactions = 0
            credit_transactions = 0
            pending_transactions = 0
            
            total_gross_profit = 0
            recognized_gross_profit = 0  # Only from paid sales
            
            payment_method_breakdown = {}
            product_category_breakdown = {}
            
            for sale in sales:
                total_amount = Decimal(str(sale.get('total_amount', 0)))
                amount_paid = Decimal(str(sale.get('amount_paid', 0)))
                amount_due = Decimal(str(sale.get('amount_due', 0)))
                gross_profit = Decimal(str(sale.get('gross_profit', 0)))
                payment_status = sale.get('payment_status', 'Paid')
                
                total_sales_amount += float(total_amount)
                total_gross_profit += float(gross_profit)
                
                # Revenue recognition - only count paid amounts
                if payment_status == 'Paid':
                    recognized_revenue += float(total_amount)
                    recognized_gross_profit += float(gross_profit)
                    paid_transactions += 1
                    
                    # Payment method breakdown (only for paid sales)
                    payment_method_id = sale.get('payment_method_id')
                    if payment_method_id:
                        if payment_method_id not in payment_method_breakdown:
                            payment_method_breakdown[payment_method_id] = {
                                'payment_method_id': payment_method_id,
                                'total_amount': 0,
                                'transaction_count': 0
                            }
                        payment_method_breakdown[payment_method_id]['total_amount'] += float(total_amount)
                        payment_method_breakdown[payment_method_id]['transaction_count'] += 1
                        
                elif payment_status in ['Credit', 'Pending']:
                    outstanding_credit += float(amount_due)
                    if payment_status == 'Credit':
                        credit_transactions += 1
                    else:
                        pending_transactions += 1
                
                # Product category breakdown
                category_id = sale.get('product_category_id')
                if category_id:
                    if category_id not in product_category_breakdown:
                        product_category_breakdown[category_id] = {
                            'category_id': category_id,
                            'total_amount': 0,
                            'recognized_amount': 0,
                            'transaction_count': 0
                        }
                    product_category_breakdown[category_id]['total_amount'] += float(total_amount)
                    product_category_breakdown[category_id]['transaction_count'] += 1
                    
                    if payment_status == 'Paid':
                        product_category_breakdown[category_id]['recognized_amount'] += float(total_amount)
            
            # Calculate ratios
            revenue_recognition_rate = (recognized_revenue / total_sales_amount * 100) if total_sales_amount > 0 else 0
            profit_margin = (recognized_gross_profit / recognized_revenue * 100) if recognized_revenue > 0 else 0
            
            summary = {
                'total_sales_amount': total_sales_amount,
                'recognized_revenue': recognized_revenue,  # Only paid sales
                'outstanding_credit': outstanding_credit,
                'total_transactions': total_transactions,
                'paid_transactions': paid_transactions,
                'credit_transactions': credit_transactions,
                'pending_transactions': pending_transactions,
                'total_gross_profit': total_gross_profit,
                'recognized_gross_profit': recognized_gross_profit,  # Only from paid sales
                'revenue_recognition_rate': round(revenue_recognition_rate, 2),
                'profit_margin': round(profit_margin, 2),
                'payment_method_breakdown': list(payment_method_breakdown.values()),
                'product_category_breakdown': list(product_category_breakdown.values())
            }
            
            logger.info(f"Sales summary for user {user_id}: ${recognized_revenue} recognized revenue, "
                       f"${outstanding_credit} outstanding credit")
            
            return summary
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error calculating sales summary for user '{user_id}': {e}")
            raise DatabaseError(f"Failed to calculate sales summary: {str(e)}")
    
    def get_product_category_sales(self, user_id: str, target_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Get sales totals by product category for a specific date
        
        Args:
            user_id: User ID to filter by
            target_date: Date to calculate for (defaults to today)
            
        Returns:
            Dict containing category sales breakdown
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            if target_date is None:
                target_date = date.today()
            
            # Get sales for the target date
            filters = {
                'start_date': f"{target_date}T00:00:00",
                'end_date': f"{target_date}T23:59:59"
            }
            
            sales = self.get_sales_by_user(user_id, filters, limit=10000)
            
            # Get all product categories for reference
            categories_result = self.supabase.table('product_categories').select('*').execute()
            categories_map = {cat['id']: cat for cat in categories_result.data}
            
            # Group sales by category
            category_sales = {}
            total_sales = 0
            
            for sale in sales:
                # Only count paid sales for revenue recognition
                if sale.get('payment_status') != 'Paid':
                    continue
                
                category_id = sale.get('product_category_id')
                total_amount = Decimal(str(sale.get('total_amount', 0)))
                
                if category_id not in category_sales:
                    category_info = categories_map.get(category_id, {})
                    category_sales[category_id] = {
                        'category_id': category_id,
                        'category_name': category_info.get('name', 'Unknown'),
                        'total_amount': 0,
                        'transaction_count': 0,
                        'percentage': 0
                    }
                
                category_sales[category_id]['total_amount'] += float(total_amount)
                category_sales[category_id]['transaction_count'] += 1
                total_sales += float(total_amount)
            
            # Calculate percentages
            for category_data in category_sales.values():
                if total_sales > 0:
                    category_data['percentage'] = round(
                        (category_data['total_amount'] / total_sales) * 100, 2
                    )
            
            # Sort by total amount
            sorted_categories = sorted(
                category_sales.values(), 
                key=lambda x: x['total_amount'], 
                reverse=True
            )
            
            result = {
                'date': target_date.isoformat(),
                'total_sales': total_sales,
                'category_breakdown': sorted_categories,
                'category_count': len(sorted_categories)
            }
            
            logger.info(f"Product category sales for {target_date}: {len(sorted_categories)} categories, ${total_sales} total")
            
            return result
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error calculating product category sales: {str(e)}")
            raise DatabaseError(f"Failed to calculate product category sales: {str(e)}")