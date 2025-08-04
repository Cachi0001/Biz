#!/usr/bin/env python3
"""
Enhanced Payment Service with POS Integration

This service handles payment recording, POS transactions, and daily summaries
with support for standardized payment methods and comprehensive reporting.

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

class PaymentService:
    """Enhanced service for payment recording and management with POS integration"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.payment_method_service = PaymentMethodService()
        if not self.supabase:
            raise DatabaseError("Failed to initialize Supabase client")
    
    def record_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record a new payment with enhanced POS integration support
        
        Args:
            payment_data: Dictionary containing payment information
                Required: amount, payment_method_id, user_id
                Optional: description, reference_number, is_pos_transaction, 
                         pos_account_name, transaction_type, pos_reference_number
        
        Returns:
            Dict containing the created payment record
        
        Raises:
            ValidationError: If required fields are missing or invalid
            DatabaseError: If database operation fails
        """
        try:
            # Validate required fields
            required_fields = ['amount', 'payment_method_id', 'user_id']
            for field in required_fields:
                if field not in payment_data:
                    raise ValidationError(f"Missing required field: {field}")
            
            # Validate amount
            try:
                amount = Decimal(str(payment_data['amount']))
                if amount <= 0:
                    raise ValidationError("Amount must be greater than 0")
            except (ValueError, TypeError):
                raise ValidationError("Invalid amount format")
            
            # Validate payment method and get POS requirements
            payment_method_id = payment_data['payment_method_id']
            pos_data = {
                'pos_account_name': payment_data.get('pos_account_name', ''),
                'transaction_type': payment_data.get('transaction_type', 'Sale'),
                'pos_reference_number': payment_data.get('pos_reference_number', ''),
                'reference_number': payment_data.get('reference_number', '')
            }
            
            # Validate payment method selection and POS requirements
            validation_result = self.payment_method_service.validate_payment_method_selection(
                payment_method_id, pos_data
            )
            
            if not validation_result['is_valid']:
                missing_fields = ', '.join(validation_result['missing_fields'])
                raise ValidationError(f"Missing required fields for payment method: {missing_fields}")
            
            payment_method = validation_result['payment_method']
            validated_pos_data = validation_result['pos_data']
            
            # Prepare payment record
            payment_record = {
                'amount': float(amount),
                'payment_method_id': payment_method_id,
                'user_id': payment_data['user_id'],
                'description': payment_data.get('description', ''),
                'status': 'completed',
                'created_at': datetime.utcnow().isoformat(),
                
                # Enhanced POS fields
                'is_pos_transaction': payment_method.get('is_pos', False),
                'pos_account_name': validated_pos_data.get('pos_account_name'),
                'transaction_type': validated_pos_data.get('transaction_type', 'Sale'),
                'pos_reference_number': validated_pos_data.get('pos_reference_number'),
            }
            
            # Add reference number for non-POS methods that require it
            if not payment_method.get('is_pos', False) and payment_method.get('requires_reference', False):
                payment_record['reference_number'] = validated_pos_data.get('reference_number', '')
            
            # Insert payment record
            result = self.supabase.table('payments').insert(payment_record).execute()
            
            if not result.data:
                raise DatabaseError("Failed to create payment record")
            
            created_payment = result.data[0]
            
            # Log payment creation with POS details if applicable
            log_message = f"Payment recorded: {created_payment['id']} - {payment_method['name']} - ${amount}"
            if payment_method.get('is_pos', False):
                log_message += f" (POS: {validated_pos_data.get('pos_account_name', 'N/A')})"
            
            logger.info(log_message)
            
            return created_payment
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error recording payment: {str(e)}")
            raise DatabaseError(f"Failed to record payment: {str(e)}")
    
    def get_payment_by_id(self, payment_id: str) -> Dict[str, Any]:
        """
        Retrieve a payment by ID
        
        Args:
            payment_id: UUID of the payment
            
        Returns:
            Payment record
            
        Raises:
            ValidationError: If payment_id is invalid
            NotFoundError: If payment not found
            DatabaseError: If database query fails
        """
        try:
            if not payment_id:
                raise ValidationError("Payment ID is required")
            
            try:
                UUID(payment_id)
            except ValueError:
                raise ValidationError("Invalid payment ID format")
            
            result = self.supabase.table('payments').select('*').eq('id', payment_id).execute()
            
            if not result.data:
                raise NotFoundError(f"Payment with ID '{payment_id}' not found")
            
            return result.data[0]
            
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error retrieving payment by ID '{payment_id}': {e}")
            raise DatabaseError(f"Failed to retrieve payment: {str(e)}")
    
    def get_payments_by_user(self, user_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Retrieve payments for a specific user
        
        Args:
            user_id: User ID to filter by
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List of payment records
            
        Raises:
            ValidationError: If user_id is invalid
            DatabaseError: If database query fails
        """
        try:
            if not user_id:
                raise ValidationError("User ID is required")
            
            query = self.supabase.table('payments').select('*')
            query = query.eq('user_id', user_id)
            query = query.order('created_at', desc=True)
            query = query.limit(limit).offset(offset)
            
            result = query.execute()
            
            logger.info(f"Retrieved {len(result.data)} payments for user {user_id}")
            return result.data
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error retrieving payments for user '{user_id}': {e}")
            raise DatabaseError(f"Failed to retrieve payments: {str(e)}")
    
    def get_daily_cash_summary(self, target_date: Optional[date] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculate daily cash summary (cash at hand)
        
        Args:
            target_date: Date to calculate summary for (defaults to today)
            user_id: Optional user ID to filter by
            
        Returns:
            Dict containing cash summary information
            
        Raises:
            DatabaseError: If database query fails
        """
        try:
            if target_date is None:
                target_date = date.today()
            
            # Get cash payment method ID
            cash_method = self.payment_method_service.get_payment_method_by_name('Cash')
            if not cash_method:
                logger.warning("Cash payment method not found")
                return {
                    'date': target_date.isoformat(),
                    'cash_in': 0,
                    'cash_out': 0,
                    'cash_at_hand': 0,
                    'transaction_count': 0
                }
            
            # Build query for cash transactions on target date
            query = self.supabase.table('payments').select('amount, transaction_type')
            query = query.eq('payment_method_id', cash_method['id'])
            query = query.gte('created_at', f"{target_date}T00:00:00")
            query = query.lt('created_at', f"{target_date}T23:59:59")
            
            if user_id:
                query = query.eq('user_id', user_id)
            
            result = query.execute()
            
            # Calculate cash in and cash out
            cash_in = 0
            cash_out = 0
            transaction_count = len(result.data)
            
            for payment in result.data:
                amount = Decimal(str(payment['amount']))
                transaction_type = payment.get('transaction_type', 'Sale')
                
                if transaction_type in ['Sale', 'Deposit']:
                    cash_in += amount
                elif transaction_type in ['Refund', 'Withdrawal']:
                    cash_out += amount
            
            cash_at_hand = cash_in - cash_out
            
            summary = {
                'date': target_date.isoformat(),
                'cash_in': float(cash_in),
                'cash_out': float(cash_out),
                'cash_at_hand': float(cash_at_hand),
                'transaction_count': transaction_count
            }
            
            logger.info(f"Daily cash summary for {target_date}: Cash at hand = ${cash_at_hand}")
            return summary
            
        except Exception as e:
            logger.error(f"Error calculating daily cash summary: {str(e)}")
            raise DatabaseError(f"Failed to calculate daily cash summary: {str(e)}")
    
    def get_pos_summary(self, target_date: Optional[date] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculate POS deposits and withdrawals summary
        
        Args:
            target_date: Date to calculate summary for (defaults to today)
            user_id: Optional user ID to filter by
            
        Returns:
            Dict containing POS summary information grouped by POS account
            
        Raises:
            DatabaseError: If database query fails
        """
        try:
            if target_date is None:
                target_date = date.today()
            
            # Build query for POS transactions on target date
            query = self.supabase.table('payments').select(
                'amount, transaction_type, pos_account_name, payment_method_id'
            )
            query = query.eq('is_pos_transaction', True)
            query = query.gte('created_at', f"{target_date}T00:00:00")
            query = query.lt('created_at', f"{target_date}T23:59:59")
            query = query.not_.is_('pos_account_name', 'null')
            
            if user_id:
                query = query.eq('user_id', user_id)
            
            result = query.execute()
            
            # Group by POS account
            pos_accounts = {}
            total_deposits = 0
            total_withdrawals = 0
            total_transactions = len(result.data)
            
            for payment in result.data:
                amount = Decimal(str(payment['amount']))
                transaction_type = payment.get('transaction_type', 'Sale')
                pos_account = payment.get('pos_account_name', 'Unknown')
                
                if pos_account not in pos_accounts:
                    pos_accounts[pos_account] = {
                        'account_name': pos_account,
                        'deposits': 0,
                        'withdrawals': 0,
                        'net_flow': 0,
                        'transaction_count': 0
                    }
                
                pos_accounts[pos_account]['transaction_count'] += 1
                
                if transaction_type in ['Sale', 'Deposit']:
                    pos_accounts[pos_account]['deposits'] += float(amount)
                    total_deposits += amount
                elif transaction_type in ['Refund', 'Withdrawal']:
                    pos_accounts[pos_account]['withdrawals'] += float(amount)
                    total_withdrawals += amount
                
                pos_accounts[pos_account]['net_flow'] = (
                    pos_accounts[pos_account]['deposits'] - 
                    pos_accounts[pos_account]['withdrawals']
                )
            
            summary = {
                'date': target_date.isoformat(),
                'total_deposits': float(total_deposits),
                'total_withdrawals': float(total_withdrawals),
                'net_flow': float(total_deposits - total_withdrawals),
                'total_transactions': total_transactions,
                'pos_accounts': list(pos_accounts.values())
            }
            
            logger.info(f"POS summary for {target_date}: Net flow = ${total_deposits - total_withdrawals}")
            return summary
            
        except Exception as e:
            logger.error(f"Error calculating POS summary: {str(e)}")
            raise DatabaseError(f"Failed to calculate POS summary: {str(e)}")
    
    def get_payment_method_breakdown(self, target_date: Optional[date] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get payment breakdown by payment method for a specific date
        
        Args:
            target_date: Date to calculate breakdown for (defaults to today)
            user_id: Optional user ID to filter by
            
        Returns:
            Dict containing payment method breakdown
            
        Raises:
            DatabaseError: If database query fails
        """
        try:
            if target_date is None:
                target_date = date.today()
            
            # Build query for payments on target date
            query = self.supabase.table('payments').select(
                'amount, payment_method_id, transaction_type'
            )
            query = query.gte('created_at', f"{target_date}T00:00:00")
            query = query.lt('created_at', f"{target_date}T23:59:59")
            
            if user_id:
                query = query.eq('user_id', user_id)
            
            result = query.execute()
            
            # Get all payment methods for reference
            payment_methods = self.payment_method_service.get_all_payment_methods()
            payment_method_map = {pm['id']: pm for pm in payment_methods}
            
            # Group by payment method
            method_breakdown = {}
            total_amount = 0
            total_transactions = len(result.data)
            
            for payment in result.data:
                amount = Decimal(str(payment['amount']))
                method_id = payment['payment_method_id']
                transaction_type = payment.get('transaction_type', 'Sale')
                
                # Skip refunds and withdrawals from total calculations
                if transaction_type in ['Refund', 'Withdrawal']:
                    continue
                
                if method_id not in method_breakdown:
                    method_info = payment_method_map.get(method_id, {})
                    method_breakdown[method_id] = {
                        'payment_method_id': method_id,
                        'payment_method_name': method_info.get('name', 'Unknown'),
                        'payment_method_type': method_info.get('type', 'Unknown'),
                        'total_amount': 0,
                        'transaction_count': 0,
                        'percentage': 0
                    }
                
                method_breakdown[method_id]['total_amount'] += float(amount)
                method_breakdown[method_id]['transaction_count'] += 1
                total_amount += amount
            
            # Calculate percentages
            for method_data in method_breakdown.values():
                if total_amount > 0:
                    method_data['percentage'] = round(
                        (method_data['total_amount'] / float(total_amount)) * 100, 2
                    )
            
            breakdown = {
                'date': target_date.isoformat(),
                'total_amount': float(total_amount),
                'total_transactions': total_transactions,
                'payment_methods': list(method_breakdown.values())
            }
            
            logger.info(f"Payment method breakdown for {target_date}: {len(method_breakdown)} methods, ${total_amount} total")
            return breakdown
            
        except Exception as e:
            logger.error(f"Error calculating payment method breakdown: {str(e)}")
            raise DatabaseError(f"Failed to calculate payment method breakdown: {str(e)}")
    
    def record_pos_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convenience method specifically for recording POS transactions
        
        Args:
            transaction_data: Dictionary containing POS transaction information
                Required: amount, payment_method_id, user_id, pos_account_name, transaction_type
                Optional: description, pos_reference_number
                
        Returns:
            Dict containing the created payment record
            
        Raises:
            ValidationError: If required POS fields are missing or invalid
            DatabaseError: If database operation fails
        """
        try:
            # Validate POS-specific required fields
            pos_required_fields = ['pos_account_name', 'transaction_type']
            for field in pos_required_fields:
                if field not in transaction_data or not transaction_data[field]:
                    raise ValidationError(f"Missing required POS field: {field}")
            
            # Validate transaction type
            valid_transaction_types = ['Sale', 'Refund', 'Deposit', 'Withdrawal']
            if transaction_data['transaction_type'] not in valid_transaction_types:
                raise ValidationError(f"Invalid transaction type. Must be one of: {valid_transaction_types}")
            
            # Ensure this is marked as a POS transaction
            transaction_data['is_pos_transaction'] = True
            
            # Use the main record_payment method
            return self.record_payment(transaction_data)
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error recording POS transaction: {str(e)}")
            raise DatabaseError(f"Failed to record POS transaction: {str(e)}")
    
    def get_payment_by_reference(self, reference_number: str, is_pos: bool = False) -> Optional[Dict[str, Any]]:
        """
        Retrieve payment by reference number
        
        Args:
            reference_number: Reference number to search for
            is_pos: Whether to search POS reference numbers or regular reference numbers
            
        Returns:
            Payment record if found, None otherwise
            
        Raises:
            ValidationError: If reference_number is invalid
            DatabaseError: If database query fails
        """
        try:
            if not reference_number or not reference_number.strip():
                raise ValidationError("Reference number is required")
            
            reference_field = 'pos_reference_number' if is_pos else 'reference_number'
            
            query = self.supabase.table('payments').select('*')
            query = query.eq(reference_field, reference_number.strip())
            
            if is_pos:
                query = query.eq('is_pos_transaction', True)
            
            result = query.execute()
            
            if result.data:
                logger.info(f"Found payment with {reference_field}: {reference_number}")
                return result.data[0]
            
            logger.info(f"No payment found with {reference_field}: {reference_number}")
            return None
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error searching payment by reference: {str(e)}")
            raise DatabaseError(f"Failed to search payment by reference: {str(e)}")
    
    def update_payment_status(self, payment_id: str, new_status: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Update payment status (for handling refunds, cancellations, etc.)
        
        Args:
            payment_id: UUID of the payment to update
            new_status: New status ('completed', 'refunded', 'cancelled', 'pending')
            notes: Optional notes about the status change
            
        Returns:
            Updated payment record
            
        Raises:
            ValidationError: If payment_id or new_status is invalid
            NotFoundError: If payment not found
            DatabaseError: If database operation fails
        """
        try:
            # Validate payment ID
            if not payment_id:
                raise ValidationError("Payment ID is required")
            
            try:
                UUID(payment_id)
            except ValueError:
                raise ValidationError("Invalid payment ID format")
            
            # Validate status
            valid_statuses = ['completed', 'refunded', 'cancelled', 'pending']
            if new_status not in valid_statuses:
                raise ValidationError(f"Invalid status. Must be one of: {valid_statuses}")
            
            # Check if payment exists
            existing_payment = self.get_payment_by_id(payment_id)
            if not existing_payment:
                raise NotFoundError(f"Payment with ID '{payment_id}' not found")
            
            # Prepare update data
            update_data = {
                'status': new_status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if notes:
                update_data['notes'] = notes
            
            # Update payment
            result = self.supabase.table('payments').update(update_data).eq('id', payment_id).execute()
            
            if not result.data:
                raise DatabaseError("Failed to update payment status - no data returned")
            
            updated_payment = result.data[0]
            logger.info(f"Updated payment {payment_id} status to '{new_status}'")
            
            return updated_payment
            
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Error updating payment status: {str(e)}")
            raise DatabaseError(f"Failed to update payment status: {str(e)}")