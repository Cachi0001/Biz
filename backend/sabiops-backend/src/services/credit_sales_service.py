#!/usr/bin/env python3
"""
Credit Sales Management Service

This service handles credit sales, partial payments, and accounts receivable
tracking with automatic payment status updates and outstanding balance management.

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

class CreditSalesService:
    """Service for managing credit sales and partial payments"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.payment_method_service = PaymentMethodService()
        if not self.supabase:
            raise DatabaseError("Failed to initialize Supabase client")
    
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
    
    def record_partial_payment(self, sale_id: str, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record a partial payment for a credit sale
        
        Args:
            sale_id: UUID of the sale to make payment for
            payment_data: Dictionary containing payment information
                Required: amount, payment_method_id, user_id
                Optional: description, pos_account_name, transaction_type, pos_reference_number
                
        Returns:
            Dict containing updated sale record and payment record
            
        Raises:
            ValidationError: If validation fails
            NotFoundError: If sale not found
            DatabaseError: If database operation fails
        """
        try:
            # Get the sale record
            sale = self.get_sale_by_id(sale_id)
            
            # Validate sale is eligible for partial payment
            if sale.get('payment_status') not in ['Credit', 'Pending']:
                raise ValidationError(f"Sale payment status '{sale.get('payment_status')}' does not allow partial payments")
            
            # Validate payment amount
            try:
                payment_amount = Decimal(str(payment_data['amount']))
                if payment_amount <= 0:
                    raise ValidationError("Payment amount must be greater than 0")
            except (ValueError, TypeError):
                raise ValidationError("Invalid payment amount format")
            
            # Check if payment amount doesn't exceed outstanding balance
            current_amount_due = Decimal(str(sale.get('amount_due', 0)))
            if payment_amount > current_amount_due:
                raise ValidationError(f"Payment amount ${payment_amount} exceeds outstanding balance ${current_amount_due}")
            
            # Validate payment method and POS requirements
            payment_method_id = payment_data['payment_method_id']
            pos_data = {
                'pos_account_name': payment_data.get('pos_account_name', ''),
                'transaction_type': payment_data.get('transaction_type', 'Sale'),
                'pos_reference_number': payment_data.get('pos_reference_number', ''),
                'reference_number': payment_data.get('reference_number', '')
            }
            
            validation_result = self.payment_method_service.validate_payment_method_selection(
                payment_method_id, pos_data
            )
            
            if not validation_result['is_valid']:
                missing_fields = ', '.join(validation_result['missing_fields'])
                raise ValidationError(f"Missing required fields for payment method: {missing_fields}")
            
            payment_method = validation_result['payment_method']
            validated_pos_data = validation_result['pos_data']
            
            # Calculate new amounts
            new_amount_paid = Decimal(str(sale.get('amount_paid', 0))) + payment_amount
            new_amount_due = current_amount_due - payment_amount
            
            # Determine new payment status
            new_payment_status = 'Paid' if new_amount_due == 0 else sale.get('payment_status', 'Credit')
            
            # Start transaction-like operations
            try:
                # 1. Record the payment in sale_payments table
                payment_record = {
                    'sale_id': sale_id,
                    'amount': float(payment_amount),
                    'payment_method_id': payment_method_id,
                    'user_id': payment_data['user_id'],
                    'description': payment_data.get('description', f'Partial payment for sale {sale_id}'),
                    'payment_date': datetime.utcnow().isoformat(),
                    'created_at': datetime.utcnow().isoformat(),
                    
                    # POS fields if applicable
                    'is_pos_transaction': payment_method.get('is_pos', False),
                    'pos_account_name': validated_pos_data.get('pos_account_name'),
                    'transaction_type': validated_pos_data.get('transaction_type', 'Sale'),
                    'pos_reference_number': validated_pos_data.get('pos_reference_number'),
                }
                
                # Add reference number for non-POS methods that require it
                if not payment_method.get('is_pos', False) and payment_method.get('requires_reference', False):
                    payment_record['reference_number'] = validated_pos_data.get('reference_number', '')
                
                payment_result = self.supabase.table('sale_payments').insert(payment_record).execute()
                
                if not payment_result.data:
                    raise DatabaseError("Failed to record payment in sale_payments table")
                
                created_payment = payment_result.data[0]
                
                # 2. Update the sale record
                sale_update_data = {
                    'amount_paid': float(new_amount_paid),
                    'amount_due': float(new_amount_due),
                    'payment_status': new_payment_status,
                    'updated_at': datetime.utcnow().isoformat()
                }
                
                # Update payment_method_id if sale is now fully paid
                if new_payment_status == 'Paid':
                    sale_update_data['payment_method_id'] = payment_method_id
                
                sale_result = self.supabase.table('sales').update(sale_update_data).eq('id', sale_id).execute()
                
                if not sale_result.data:
                    raise DatabaseError("Failed to update sale record")
                
                updated_sale = sale_result.data[0]
                
                # Log the partial payment
                logger.info(f"Partial payment recorded: Sale {sale_id}, Amount ${payment_amount}, "
                          f"New balance: ${new_amount_due}, Status: {new_payment_status}")
                
                return {
                    'sale': updated_sale,
                    'payment': created_payment,
                    'payment_amount': float(payment_amount),
                    'new_amount_paid': float(new_amount_paid),
                    'new_amount_due': float(new_amount_due),
                    'new_payment_status': new_payment_status,
                    'is_fully_paid': new_payment_status == 'Paid'
                }
                
            except Exception as e:
                logger.error(f"Error in partial payment transaction: {str(e)}")
                raise DatabaseError(f"Failed to complete partial payment transaction: {str(e)}")
                
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error recording partial payment for sale '{sale_id}': {e}")
            raise DatabaseError(f"Failed to record partial payment: {str(e)}")
    
    def get_outstanding_credit_sales(self, user_id: Optional[str] = None, 
                                   limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        """
        Get all outstanding credit sales (accounts receivable)
        
        Args:
            user_id: Optional user ID to filter by
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            Dict containing outstanding credit sales and summary information
            
        Raises:
            DatabaseError: If database query fails
        """
        try:
            # Build query for outstanding credit sales
            query = self.supabase.table('sales').select('*')
            query = query.in_('payment_status', ['Credit', 'Pending'])
            query = query.gt('amount_due', 0)
            query = query.order('created_at', desc=True)
            query = query.limit(limit).offset(offset)
            
            if user_id:
                query = query.eq('user_id', user_id)
            
            result = query.execute()
            
            # Calculate summary statistics
            total_outstanding = 0
            oldest_sale_date = None
            payment_status_counts = {'Credit': 0, 'Pending': 0}
            
            for sale in result.data:
                amount_due = Decimal(str(sale.get('amount_due', 0)))
                total_outstanding += amount_due
                
                # Track oldest sale
                sale_date = datetime.fromisoformat(sale['created_at'].replace('Z', '+00:00'))
                if oldest_sale_date is None or sale_date < oldest_sale_date:
                    oldest_sale_date = sale_date
                
                # Count by status
                status = sale.get('payment_status', 'Credit')
                if status in payment_status_counts:
                    payment_status_counts[status] += 1
            
            # Get total count for pagination
            count_query = self.supabase.table('sales').select('id', count='exact')
            count_query = count_query.in_('payment_status', ['Credit', 'Pending'])
            count_query = count_query.gt('amount_due', 0)
            
            if user_id:
                count_query = count_query.eq('user_id', user_id)
            
            count_result = count_query.execute()
            total_count = count_result.count if hasattr(count_result, 'count') else len(result.data)
            
            summary = {
                'outstanding_sales': result.data,
                'total_count': total_count,
                'returned_count': len(result.data),
                'total_outstanding_amount': float(total_outstanding),
                'oldest_sale_date': oldest_sale_date.isoformat() if oldest_sale_date else None,
                'payment_status_breakdown': payment_status_counts,
                'pagination': {
                    'limit': limit,
                    'offset': offset,
                    'has_more': len(result.data) == limit
                }
            }
            
            logger.info(f"Retrieved {len(result.data)} outstanding credit sales, "
                       f"Total outstanding: ${total_outstanding}")
            
            return summary
            
        except Exception as e:
            logger.error(f"Error retrieving outstanding credit sales: {str(e)}")
            raise DatabaseError(f"Failed to retrieve outstanding credit sales: {str(e)}")
    
    def get_sale_payment_history(self, sale_id: str) -> List[Dict[str, Any]]:
        """
        Get payment history for a specific sale
        
        Args:
            sale_id: UUID of the sale
            
        Returns:
            List of payment records for the sale
            
        Raises:
            ValidationError: If sale_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not sale_id:
                raise ValidationError("Sale ID is required")
            
            try:
                UUID(sale_id)
            except ValueError:
                raise ValidationError("Invalid sale ID format")
            
            # Get payment history from sale_payments table
            query = self.supabase.table('sale_payments').select('*')
            query = query.eq('sale_id', sale_id)
            query = query.order('payment_date', desc=True)
            
            result = query.execute()
            
            logger.info(f"Retrieved {len(result.data)} payment records for sale {sale_id}")
            return result.data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error retrieving payment history for sale '{sale_id}': {e}")
            raise DatabaseError(f"Failed to retrieve payment history: {str(e)}")
    
    def get_customer_credit_summary(self, customer_id: str) -> Dict[str, Any]:
        """
        Get credit summary for a specific customer
        
        Args:
            customer_id: ID of the customer
            
        Returns:
            Dict containing customer credit summary
            
        Raises:
            ValidationError: If customer_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not customer_id:
                raise ValidationError("Customer ID is required")
            
            # Get all credit sales for customer
            query = self.supabase.table('sales').select('*')
            query = query.eq('customer_id', customer_id)
            query = query.in_('payment_status', ['Credit', 'Pending', 'Paid'])
            
            result = query.execute()
            
            # Calculate summary statistics
            total_credit_sales = 0
            total_outstanding = 0
            total_paid = 0
            outstanding_sales_count = 0
            paid_sales_count = 0
            
            outstanding_sales = []
            
            for sale in result.data:
                total_amount = Decimal(str(sale.get('total_amount', 0)))
                amount_due = Decimal(str(sale.get('amount_due', 0)))
                amount_paid = Decimal(str(sale.get('amount_paid', 0)))
                payment_status = sale.get('payment_status')
                
                total_credit_sales += total_amount
                
                if payment_status in ['Credit', 'Pending'] and amount_due > 0:
                    total_outstanding += amount_due
                    outstanding_sales_count += 1
                    outstanding_sales.append(sale)
                elif payment_status == 'Paid':
                    total_paid += amount_paid
                    paid_sales_count += 1
            
            summary = {
                'customer_id': customer_id,
                'total_credit_sales_amount': float(total_credit_sales),
                'total_outstanding_amount': float(total_outstanding),
                'total_paid_amount': float(total_paid),
                'outstanding_sales_count': outstanding_sales_count,
                'paid_sales_count': paid_sales_count,
                'total_sales_count': len(result.data),
                'outstanding_sales': outstanding_sales,
                'payment_completion_rate': round(
                    (paid_sales_count / len(result.data) * 100) if result.data else 0, 2
                )
            }
            
            logger.info(f"Customer {customer_id} credit summary: "
                       f"${total_outstanding} outstanding, {outstanding_sales_count} sales")
            
            return summary
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error retrieving customer credit summary for '{customer_id}': {e}")
            raise DatabaseError(f"Failed to retrieve customer credit summary: {str(e)}")
    
    def update_sale_payment_status(self, sale_id: str, new_status: str, 
                                 payment_method_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Update payment status of a sale (e.g., mark as paid, cancel credit)
        
        Args:
            sale_id: UUID of the sale to update
            new_status: New payment status ('Paid', 'Credit', 'Pending', 'Cancelled')
            payment_method_id: Payment method ID if marking as paid
            
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
            
            # Handle status-specific updates
            if new_status == 'Paid':
                # Mark as fully paid
                total_amount = Decimal(str(sale.get('total_amount', 0)))
                update_data.update({
                    'amount_paid': float(total_amount),
                    'amount_due': 0,
                    'payment_method_id': payment_method_id
                })
            elif new_status in ['Credit', 'Pending']:
                # Reset to credit/pending status
                total_amount = Decimal(str(sale.get('total_amount', 0)))
                current_paid = Decimal(str(sale.get('amount_paid', 0)))
                update_data.update({
                    'amount_due': float(total_amount - current_paid)
                })
            elif new_status == 'Cancelled':
                # Cancel the sale
                update_data.update({
                    'amount_due': 0,
                    'notes': f"Sale cancelled on {datetime.utcnow().isoformat()}"
                })
            
            # Update the sale
            result = self.supabase.table('sales').update(update_data).eq('id', sale_id).execute()
            
            if not result.data:
                raise DatabaseError("Failed to update sale payment status - no data returned")
            
            updated_sale = result.data[0]
            
            logger.info(f"Updated sale {sale_id} payment status to '{new_status}'")
            
            return updated_sale
            
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error updating sale payment status for '{sale_id}': {e}")
            raise DatabaseError(f"Failed to update sale payment status: {str(e)}")
    
    def get_accounts_receivable_aging(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get accounts receivable aging report (30, 60, 90+ days)
        
        Args:
            user_id: Optional user ID to filter by
            
        Returns:
            Dict containing aging report data
            
        Raises:
            DatabaseError: If database query fails
        """
        try:
            # Get all outstanding credit sales
            query = self.supabase.table('sales').select('*')
            query = query.in_('payment_status', ['Credit', 'Pending'])
            query = query.gt('amount_due', 0)
            
            if user_id:
                query = query.eq('user_id', user_id)
            
            result = query.execute()
            
            # Calculate aging buckets
            current_date = datetime.utcnow()
            aging_buckets = {
                'current': {'count': 0, 'amount': 0, 'sales': []},      # 0-30 days
                '30_days': {'count': 0, 'amount': 0, 'sales': []},     # 31-60 days
                '60_days': {'count': 0, 'amount': 0, 'sales': []},     # 61-90 days
                '90_plus_days': {'count': 0, 'amount': 0, 'sales': []} # 90+ days
            }
            
            total_outstanding = 0
            
            for sale in result.data:
                amount_due = Decimal(str(sale.get('amount_due', 0)))
                sale_date = datetime.fromisoformat(sale['created_at'].replace('Z', '+00:00'))
                days_outstanding = (current_date - sale_date).days
                
                total_outstanding += amount_due
                
                # Determine aging bucket
                if days_outstanding <= 30:
                    bucket = 'current'
                elif days_outstanding <= 60:
                    bucket = '30_days'
                elif days_outstanding <= 90:
                    bucket = '60_days'
                else:
                    bucket = '90_plus_days'
                
                aging_buckets[bucket]['count'] += 1
                aging_buckets[bucket]['amount'] += float(amount_due)
                aging_buckets[bucket]['sales'].append({
                    **sale,
                    'days_outstanding': days_outstanding
                })
            
            # Calculate percentages
            for bucket_data in aging_buckets.values():
                if total_outstanding > 0:
                    bucket_data['percentage'] = round(
                        (bucket_data['amount'] / float(total_outstanding)) * 100, 2
                    )
                else:
                    bucket_data['percentage'] = 0
            
            aging_report = {
                'report_date': current_date.isoformat(),
                'total_outstanding_amount': float(total_outstanding),
                'total_outstanding_count': len(result.data),
                'aging_buckets': aging_buckets,
                'summary': {
                    'current_ratio': aging_buckets['current']['percentage'],
                    'overdue_ratio': (
                        aging_buckets['30_days']['percentage'] + 
                        aging_buckets['60_days']['percentage'] + 
                        aging_buckets['90_plus_days']['percentage']
                    ),
                    'severely_overdue_ratio': aging_buckets['90_plus_days']['percentage']
                }
            }
            
            logger.info(f"Accounts receivable aging report: ${total_outstanding} total, "
                       f"{len(result.data)} outstanding sales")
            
            return aging_report
            
        except Exception as e:
            logger.error(f"Error generating accounts receivable aging report: {str(e)}")
            raise DatabaseError(f"Failed to generate aging report: {str(e)}")