import logging
from typing import Optional, List, Dict
from datetime import datetime, date
from decimal import Decimal

from core.entities.payment_entity import PaymentEntity, PaymentStatus
from core.interfaces.repositories.payment_repository_interface import PaymentRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client
from shared.exceptions.business_exceptions import RepositoryException

logger = logging.getLogger(__name__)

class SupabasePaymentRepository(PaymentRepositoryInterface):
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def create_payment(self, payment: PaymentEntity) -> PaymentEntity:
        try:
            payment_data = {
                'id': payment.id,
                'owner_id': payment.owner_id,
                'invoice_id': payment.invoice_id,
                'sale_id': payment.sale_id,
                'amount': float(payment.amount),
                'status': payment.status.value,
                'payment_reference': payment.payment_reference,
                'payment_method': payment.payment_method,
                'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
                'created_at': payment.created_at.isoformat(),
                'updated_at': payment.updated_at.isoformat(),
                'currency': payment.currency,
                'customer_email': payment.customer_email,
                'customer_name': payment.customer_name,
                'description': payment.description,
                'notes': payment.notes,
                'reference_number': payment.reference_number,
                'phone': payment.phone,
                'customer_phone': payment.customer_phone,
                'payment_method_id': payment.payment_method_id,
                'is_pos_transaction': payment.is_pos_transaction,
                'pos_account_name': payment.pos_account_name,
                'transaction_type': payment.transaction_type,
                'pos_reference_number': payment.pos_reference_number
            }
            
            result = self.client.table('payments').insert(payment_data).execute()
            
            if result.data:
                logger.info(f"Successfully created payment: {payment.id}")
                return self._map_to_entity(result.data[0])
            else:
                raise RepositoryException("Failed to create payment")
                
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}")
            raise RepositoryException(f"Failed to create payment: {str(e)}")
    
    async def find_payment_by_id(self, payment_id: str, owner_id: str) -> Optional[PaymentEntity]:
        try:
            result = self.client.table('payments').select('*').eq('id', payment_id).eq('owner_id', owner_id).execute()
            
            if result.data:
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding payment by ID: {str(e)}")
            raise RepositoryException(f"Failed to find payment: {str(e)}")
    
    async def find_payments_by_owner(self, owner_id: str, filters: Dict = None) -> List[PaymentEntity]:
        try:
            query = self.client.table('payments').select('*').eq('owner_id', owner_id)
            
            if filters:
                if filters.get('start_date'):
                    query = query.gte('created_at', filters['start_date'])
                if filters.get('end_date'):
                    query = query.lte('created_at', filters['end_date'])
                if filters.get('status'):
                    query = query.eq('status', filters['status'])
                if filters.get('payment_method'):
                    query = query.eq('payment_method', filters['payment_method'])
                if filters.get('invoice_id'):
                    query = query.eq('invoice_id', filters['invoice_id'])
                if filters.get('sale_id'):
                    query = query.eq('sale_id', filters['sale_id'])
                if filters.get('is_pos_transaction') is not None:
                    query = query.eq('is_pos_transaction', filters['is_pos_transaction'])
            
            query = query.order('created_at', desc=True)
            
            if filters and filters.get('limit'):
                query = query.limit(filters['limit'])
            
            result = query.execute()
            
            return [self._map_to_entity(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding payments by owner: {str(e)}")
            raise RepositoryException(f"Failed to find payments: {str(e)}")
    
    async def update_payment(self, payment_id: str, updates: dict, owner_id: str) -> Optional[PaymentEntity]:
        try:
            # Convert Decimal values to float for JSON serialization
            processed_updates = {}
            for key, value in updates.items():
                if isinstance(value, Decimal):
                    processed_updates[key] = float(value)
                elif isinstance(value, datetime):
                    processed_updates[key] = value.isoformat()
                elif hasattr(value, 'value'):  # Enum
                    processed_updates[key] = value.value
                else:
                    processed_updates[key] = value
            
            processed_updates['updated_at'] = datetime.now().isoformat()
            
            result = self.client.table('payments').update(processed_updates).eq('id', payment_id).eq('owner_id', owner_id).execute()
            
            if result.data:
                logger.info(f"Successfully updated payment: {payment_id}")
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating payment: {str(e)}")
            raise RepositoryException(f"Failed to update payment: {str(e)}")
    
    async def delete_payment(self, payment_id: str, owner_id: str) -> bool:
        try:
            result = self.client.table('payments').delete().eq('id', payment_id).eq('owner_id', owner_id).execute()
            
            success = len(result.data) > 0
            if success:
                logger.info(f"Successfully deleted payment: {payment_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting payment: {str(e)}")
            raise RepositoryException(f"Failed to delete payment: {str(e)}")
    
    async def find_payments_by_invoice(self, invoice_id: str, owner_id: str) -> List[PaymentEntity]:
        try:
            result = self.client.table('payments').select('*').eq('invoice_id', invoice_id).eq('owner_id', owner_id).order('created_at', desc=True).execute()
            
            return [self._map_to_entity(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding payments by invoice: {str(e)}")
            raise RepositoryException(f"Failed to find payments by invoice: {str(e)}")
    
    async def find_payments_by_sale(self, sale_id: str, owner_id: str) -> List[PaymentEntity]:
        try:
            result = self.client.table('payments').select('*').eq('sale_id', sale_id).eq('owner_id', owner_id).order('created_at', desc=True).execute()
            
            return [self._map_to_entity(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding payments by sale: {str(e)}")
            raise RepositoryException(f"Failed to find payments by sale: {str(e)}")
    
    async def get_payment_statistics(self, owner_id: str, start_date: datetime = None, end_date: datetime = None) -> Dict:
        try:
            query = self.client.table('payments').select('*').eq('owner_id', owner_id)
            
            if start_date:
                query = query.gte('created_at', start_date.isoformat())
            if end_date:
                query = query.lte('created_at', end_date.isoformat())
            
            result = query.execute()
            payments_data = result.data
            
            # Calculate statistics
            total_payments = len(payments_data)
            completed_payments = [p for p in payments_data if p.get('status') == 'completed']
            total_amount = sum(float(p.get('amount', 0)) for p in completed_payments)
            
            # Payment method breakdown
            payment_methods = {}
            for payment in completed_payments:
                method = payment.get('payment_method', 'unknown')
                if method not in payment_methods:
                    payment_methods[method] = {'count': 0, 'amount': 0}
                payment_methods[method]['count'] += 1
                payment_methods[method]['amount'] += float(payment.get('amount', 0))
            
            # POS transaction statistics
            pos_payments = [p for p in completed_payments if p.get('is_pos_transaction', False)]
            pos_total = sum(float(p.get('amount', 0)) for p in pos_payments)
            
            # Transaction type breakdown for POS
            pos_transaction_types = {}
            for payment in pos_payments:
                trans_type = payment.get('transaction_type', 'Sale')
                if trans_type not in pos_transaction_types:
                    pos_transaction_types[trans_type] = {'count': 0, 'amount': 0}
                pos_transaction_types[trans_type]['count'] += 1
                pos_transaction_types[trans_type]['amount'] += float(payment.get('amount', 0))
            
            return {
                'total_payments': total_payments,
                'completed_payments': len(completed_payments),
                'total_amount': total_amount,
                'payment_methods': payment_methods,
                'pos_payments_count': len(pos_payments),
                'pos_total_amount': pos_total,
                'pos_transaction_types': pos_transaction_types,
                'average_payment_amount': total_amount / len(completed_payments) if completed_payments else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting payment statistics: {str(e)}")
            raise RepositoryException(f"Failed to get payment statistics: {str(e)}")
    
    async def get_daily_cash_summary(self, owner_id: str, target_date: date) -> Dict:
        try:
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())
            
            query = self.client.table('payments').select('*').eq('owner_id', owner_id).gte('created_at', start_datetime.isoformat()).lte('created_at', end_datetime.isoformat())
            
            result = query.execute()
            payments_data = result.data
            
            # Cash transactions
            cash_payments = [p for p in payments_data if p.get('payment_method', '').lower() == 'cash' and p.get('status') == 'completed']
            cash_in = sum(float(p.get('amount', 0)) for p in cash_payments if p.get('transaction_type', 'Sale') in ['Sale', 'Deposit'])
            cash_out = sum(float(p.get('amount', 0)) for p in cash_payments if p.get('transaction_type', 'Sale') in ['Withdrawal', 'Refund'])
            
            # POS transactions
            pos_payments = [p for p in payments_data if p.get('is_pos_transaction', False) and p.get('status') == 'completed']
            pos_deposits = sum(float(p.get('amount', 0)) for p in pos_payments if p.get('transaction_type', 'Sale') in ['Sale', 'Deposit'])
            pos_withdrawals = sum(float(p.get('amount', 0)) for p in pos_payments if p.get('transaction_type', 'Sale') in ['Withdrawal', 'Refund'])
            
            return {
                'date': target_date.isoformat(),
                'cash_in': cash_in,
                'cash_out': cash_out,
                'cash_net': cash_in - cash_out,
                'pos_deposits': pos_deposits,
                'pos_withdrawals': pos_withdrawals,
                'pos_net': pos_deposits - pos_withdrawals,
                'total_cash_payments': len(cash_payments),
                'total_pos_payments': len(pos_payments)
            }
            
        except Exception as e:
            logger.error(f"Error getting daily cash summary: {str(e)}")
            raise RepositoryException(f"Failed to get daily cash summary: {str(e)}")
    
    def _map_to_entity(self, data: dict) -> PaymentEntity:
        return PaymentEntity(
            id=data['id'],
            owner_id=data['owner_id'],
            invoice_id=data.get('invoice_id'),
            sale_id=data.get('sale_id'),
            amount=Decimal(str(data['amount'])),
            status=PaymentStatus(data.get('status', 'pending')),
            payment_reference=data.get('payment_reference'),
            payment_method=data.get('payment_method', 'cash'),
            paid_at=datetime.fromisoformat(data['paid_at']) if data.get('paid_at') else None,
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            currency=data.get('currency', 'NGN'),
            customer_email=data.get('customer_email'),
            customer_name=data.get('customer_name'),
            description=data.get('description'),
            notes=data.get('notes'),
            reference_number=data.get('reference_number'),
            phone=data.get('phone'),
            customer_phone=data.get('customer_phone'),
            payment_method_id=data.get('payment_method_id'),
            is_pos_transaction=data.get('is_pos_transaction', False),
            pos_account_name=data.get('pos_account_name'),
            transaction_type=data.get('transaction_type', 'Sale'),
            pos_reference_number=data.get('pos_reference_number')
        )