import logging
from typing import Optional, List
from datetime import datetime

from core.entities.sale_payment_entity import SalePaymentEntity
from core.interfaces.repositories.sale_payment_repository_interface import SalePaymentRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client
from shared.exceptions.business_exceptions import BusinessException

logger = logging.getLogger(__name__)

class SupabaseSalePaymentRepository(SalePaymentRepositoryInterface):
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "sale_payments"
    
    async def create_sale_payment(self, sale_payment: SalePaymentEntity) -> SalePaymentEntity:
        """Create a new sale payment record"""
        try:
            payment_data = {
                'id': sale_payment.id,
                'sale_id': sale_payment.sale_id,
                'payment_id': sale_payment.payment_id,
                'amount_paid': float(sale_payment.amount_paid),
                'payment_date': sale_payment.payment_date.isoformat(),
                'payment_method_id': sale_payment.payment_method_id,
                'notes': sale_payment.notes,
                'created_by': sale_payment.created_by,
                'created_at': sale_payment.created_at.isoformat(),
                'updated_at': sale_payment.updated_at.isoformat()
            }
            
            result = self.supabase.table(self.table_name).insert(payment_data).execute()
            
            if result.data:
                logger.info(f"Created sale payment: {sale_payment.id}")
                return SalePaymentEntity.from_dict(result.data[0])
            else:
                raise BusinessException("Failed to create sale payment record")
                
        except Exception as e:
            logger.error(f"Error creating sale payment: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_payments_by_sale_id(self, sale_id: str) -> List[SalePaymentEntity]:
        """Find all payments for a specific sale"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('sale_id', sale_id)\
                .order('payment_date', desc=True)\
                .execute()
            
            return [SalePaymentEntity.from_dict(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding payments by sale ID: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_payment_by_id(self, payment_id: str) -> Optional[SalePaymentEntity]:
        """Find a sale payment by ID"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('id', payment_id)\
                .execute()
            
            if result.data:
                return SalePaymentEntity.from_dict(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding payment by ID: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def update_sale_payment(self, payment_id: str, updates: dict) -> Optional[SalePaymentEntity]:
        """Update a sale payment record"""
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            result = self.supabase.table(self.table_name)\
                .update(updates)\
                .eq('id', payment_id)\
                .execute()
            
            if result.data:
                return SalePaymentEntity.from_dict(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating sale payment: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def delete_sale_payment(self, payment_id: str) -> bool:
        """Delete a sale payment record"""
        try:
            result = self.supabase.table(self.table_name)\
                .delete()\
                .eq('id', payment_id)\
                .execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error deleting sale payment: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def get_total_payments_for_sale(self, sale_id: str) -> float:
        """Get total amount paid for a sale"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("amount_paid")\
                .eq('sale_id', sale_id)\
                .execute()
            
            total = sum(float(row['amount_paid']) for row in result.data)
            return total
            
        except Exception as e:
            logger.error(f"Error getting total payments for sale: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_recent_payments(self, days: int = 7) -> List[SalePaymentEntity]:
        """Find recent sale payments"""
        try:
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=days)
            
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .gte('payment_date', cutoff_date.isoformat())\
                .order('payment_date', desc=True)\
                .execute()
            
            return [SalePaymentEntity.from_dict(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding recent payments: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")