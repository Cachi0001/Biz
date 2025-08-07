import logging
from typing import Optional, List, Dict
from datetime import datetime, date
from decimal import Decimal

from core.entities.enhanced_payment_entity import EnhancedPaymentEntity, TransactionType
from core.interfaces.repositories.enhanced_payment_repository_interface import EnhancedPaymentRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client
from shared.exceptions.business_exceptions import BusinessException

logger = logging.getLogger(__name__)

class SupabaseEnhancedPaymentRepository(EnhancedPaymentRepositoryInterface):
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "payments"
    
    async def create_payment(self, payment: EnhancedPaymentEntity) -> EnhancedPaymentEntity:
        """Create a new enhanced payment record"""
        try:
            payment_data = {
                'id': payment.id,
                'owner_id': payment.owner_id,
                'amount': float(payment.amount),
                'payment_method_id': payment.payment_method_id,
                'description': payment.description,
                'created_at': payment.created_at.isoformat(),
                'updated_at': payment.updated_at.isoformat(),
                'is_pos_transaction': payment.is_pos_transaction,
                'pos_account_name': payment.pos_account_name,
                'transaction_type': payment.transaction_type.value,
                'pos_reference_number': payment.pos_reference_number,
                'invoice_id': payment.invoice_id,
                'sale_id': payment.sale_id
            }
            
            result = self.supabase.table(self.table_name).insert(payment_data).execute()
            
            if result.data:
                logger.info(f"Created enhanced payment: {payment.id}")
                return EnhancedPaymentEntity.from_dict(result.data[0])
            else:
                raise BusinessException("Failed to create payment record")
                
        except Exception as e:
            logger.error(f"Error creating enhanced payment: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_payment_by_id(self, payment_id: str, owner_id: str) -> Optional[EnhancedPaymentEntity]:
        """Find a payment by ID for a specific owner"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('id', payment_id)\
                .eq('owner_id', owner_id)\
                .execute()
            
            if result.data:
                return EnhancedPaymentEntity.from_dict(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding payment by ID: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_payments_by_owner(self, owner_id: str, filters: Dict = None) -> List[EnhancedPaymentEntity]:
        """Find all payments for an owner with optional filters"""
        try:
            query = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('owner_id', owner_id)\
                .order('created_at', desc=True)
            
            # Apply filters
            if filters:
                if filters.get('payment_method_id'):
                    query = query.eq('payment_method_id', filters['payment_method_id'])
                
                if filters.get('is_pos_transaction') is not None:
                    query = query.eq('is_pos_transaction', filters['is_pos_transaction'])
                
                if filters.get('transaction_type'):
                    query = query.eq('transaction_type', filters['transaction_type'])
                
                if filters.get('start_date'):
                    query = query.gte('created_at', filters['start_date'])
                
                if filters.get('end_date'):
                    query = query.lte('created_at', filters['end_date'])
            
            result = query.execute()
            
            return [EnhancedPaymentEntity.from_dict(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding payments by owner: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_payments_by_date_range(self, owner_id: str, start_date: date, end_date: date) -> List[EnhancedPaymentEntity]:
        """Find payments within a date range"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('owner_id', owner_id)\
                .gte('created_at', start_date.isoformat())\
                .lte('created_at', end_date.isoformat())\
                .order('created_at', desc=True)\
                .execute()
            
            return [EnhancedPaymentEntity.from_dict(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding payments by date range: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_pos_payments_by_date(self, owner_id: str, target_date: date) -> List[EnhancedPaymentEntity]:
        """Find all POS payments for a specific date"""
        try:
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())
            
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('owner_id', owner_id)\
                .eq('is_pos_transaction', True)\
                .gte('created_at', start_datetime.isoformat())\
                .lte('created_at', end_datetime.isoformat())\
                .order('created_at', desc=True)\
                .execute()
            
            return [EnhancedPaymentEntity.from_dict(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding POS payments by date: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_cash_payments_by_date(self, owner_id: str, target_date: date) -> List[EnhancedPaymentEntity]:
        """Find all cash payments for a specific date"""
        try:
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())
            
            # Get cash payment method ID
            cash_method_result = self.supabase.table('payment_methods')\
                .select('id')\
                .eq('name', 'Cash')\
                .execute()
            
            if not cash_method_result.data:
                return []
            
            cash_method_id = cash_method_result.data[0]['id']
            
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('owner_id', owner_id)\
                .eq('payment_method_id', cash_method_id)\
                .gte('created_at', start_datetime.isoformat())\
                .lte('created_at', end_datetime.isoformat())\
                .order('created_at', desc=True)\
                .execute()
            
            return [EnhancedPaymentEntity.from_dict(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding cash payments by date: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def update_payment(self, payment_id: str, updates: dict, owner_id: str) -> Optional[EnhancedPaymentEntity]:
        """Update a payment record"""
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            result = self.supabase.table(self.table_name)\
                .update(updates)\
                .eq('id', payment_id)\
                .eq('owner_id', owner_id)\
                .execute()
            
            if result.data:
                return EnhancedPaymentEntity.from_dict(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating payment: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def delete_payment(self, payment_id: str, owner_id: str) -> bool:
        """Delete a payment record"""
        try:
            result = self.supabase.table(self.table_name)\
                .delete()\
                .eq('id', payment_id)\
                .eq('owner_id', owner_id)\
                .execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error deleting payment: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def get_daily_payment_summary(self, owner_id: str, target_date: date) -> Dict:
        """Get daily payment summary with cash at hand and POS totals"""
        try:
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())
            
            # Use the database view for optimized summary
            result = self.supabase.table('v_daily_payment_summary')\
                .select("*")\
                .eq('payment_date', target_date.isoformat())\
                .execute()
            
            # Process the view results
            summary = {
                'total_transactions': 0,
                'total_amount': 0.0,
                'money_in': 0.0,
                'money_out': 0.0,
                'by_method': {},
                'pos_breakdown': {}
            }
            
            for row in result.data:
                summary['total_transactions'] += row['transaction_count']
                summary['total_amount'] += float(row['total_amount'])
                summary['money_in'] += float(row['money_in'])
                summary['money_out'] += float(row['money_out'])
                
                method_name = row['payment_method']
                if method_name not in summary['by_method']:
                    summary['by_method'][method_name] = {
                        'total': 0.0,
                        'money_in': 0.0,
                        'money_out': 0.0,
                        'count': 0
                    }
                
                summary['by_method'][method_name]['total'] += float(row['total_amount'])
                summary['by_method'][method_name]['money_in'] += float(row['money_in'])
                summary['by_method'][method_name]['money_out'] += float(row['money_out'])
                summary['by_method'][method_name]['count'] += row['transaction_count']
                
                # POS breakdown
                if row['is_pos'] and row['pos_account_name']:
                    account = row['pos_account_name']
                    if account not in summary['pos_breakdown']:
                        summary['pos_breakdown'][account] = {
                            'total': 0.0,
                            'money_in': 0.0,
                            'money_out': 0.0,
                            'count': 0
                        }
                    
                    summary['pos_breakdown'][account]['total'] += float(row['total_amount'])
                    summary['pos_breakdown'][account]['money_in'] += float(row['money_in'])
                    summary['pos_breakdown'][account]['money_out'] += float(row['money_out'])
                    summary['pos_breakdown'][account]['count'] += row['transaction_count']
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting daily payment summary: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def get_payment_method_totals(self, owner_id: str, start_date: date, end_date: date) -> Dict:
        """Get payment totals grouped by payment method"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("payment_method_id, amount, transaction_type")\
                .eq('owner_id', owner_id)\
                .gte('created_at', start_date.isoformat())\
                .lte('created_at', end_date.isoformat())\
                .execute()
            
            method_totals = {}
            for row in result.data:
                method_id = row['payment_method_id']
                amount = Decimal(str(row['amount']))
                transaction_type = row['transaction_type']
                
                if method_id not in method_totals:
                    method_totals[method_id] = {
                        'total': Decimal('0'),
                        'money_in': Decimal('0'),
                        'money_out': Decimal('0'),
                        'count': 0
                    }
                
                method_totals[method_id]['total'] += amount
                method_totals[method_id]['count'] += 1
                
                if transaction_type in ['Sale', 'Deposit']:
                    method_totals[method_id]['money_in'] += amount
                else:
                    method_totals[method_id]['money_out'] += amount
            
            # Convert Decimal to float for JSON serialization
            for method_id in method_totals:
                method_totals[method_id]['total'] = float(method_totals[method_id]['total'])
                method_totals[method_id]['money_in'] = float(method_totals[method_id]['money_in'])
                method_totals[method_id]['money_out'] = float(method_totals[method_id]['money_out'])
            
            return method_totals
            
        except Exception as e:
            logger.error(f"Error getting payment method totals: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")