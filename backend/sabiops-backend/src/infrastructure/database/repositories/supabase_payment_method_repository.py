import logging
from typing import Optional, List, Dict
from datetime import datetime

from core.interfaces.repositories.payment_method_repository_interface import PaymentMethodRepositoryInterface
from core.entities.payment_method_entity import PaymentMethodEntity, PaymentMethodTypethodRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class SupabasePaymentMethodRepository(PaymentMethodRepositoryInterface):
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def find_all_active(self) -> List[PaymentMethodEntity]:
        try:
            response = self.supabase.table('payment_methods')\
                .select('*')\
                .eq('is_active', True)\
                .order('type', desc=False)\
                .order('name', desc=False)\
                .execute()
            
            if response.data:
                return [PaymentMethodEntity.from_dict(item) for item in response.data]
            return []
            
        except Exception as e:
            logger.error(f"Error fetching active payment methods: {str(e)}")
            raise
    
    async def find_by_id(self, payment_method_id: str) -> Optional[PaymentMethodEntity]:
        try:
            response = self.supabase.table('payment_methods')\
                .select('*')\
                .eq('id', payment_method_id)\
                .single()\
                .execute()
            
            if response.data:
                return PaymentMethodEntity.from_dict(response.data)
            return None
            
        except Exception as e:
            logger.error(f"Error fetching payment method by ID {payment_method_id}: {str(e)}")
            return None
    
    async def find_by_name(self, name: str) -> Optional[PaymentMethodEntity]:
        try:
            response = self.supabase.table('payment_methods')\
                .select('*')\
                .eq('name', name)\
                .single()\
                .execute()
            
            if response.data:
                return PaymentMethodEntity.from_dict(response.data)
            return None
            
        except Exception as e:
            logger.error(f"Error fetching payment method by name {name}: {str(e)}")
            return None
    
    async def find_by_type(self, payment_type: str) -> List[PaymentMethodEntity]:
        try:
            response = self.supabase.table('payment_methods')\
                .select('*')\
                .eq('type', payment_type)\
                .eq('is_active', True)\
                .order('name', desc=False)\
                .execute()
            
            if response.data:
                return [PaymentMethodEntity.from_dict(item) for item in response.data]
            return []
            
        except Exception as e:
            logger.error(f"Error fetching payment methods by type {payment_type}: {str(e)}")
            raise
    
    async def find_pos_methods(self) -> List[PaymentMethodEntity]:
        try:
            response = self.supabase.table('payment_methods')\
                .select('*')\
                .eq('is_pos', True)\
                .eq('is_active', True)\
                .order('name', desc=False)\
                .execute()
            
            if response.data:
                return [PaymentMethodEntity.from_dict(item) for item in response.data]
            return []
            
        except Exception as e:
            logger.error(f"Error fetching POS payment methods: {str(e)}")
            raise
    
    async def create_payment_method(self, payment_method: PaymentMethodEntity) -> PaymentMethodEntity:
        try:
            data = {
                'id': payment_method.id,
                'name': payment_method.name,
                'type': payment_method.type.value,
                'is_pos': payment_method.is_pos,
                'requires_reference': payment_method.requires_reference,
                'description': payment_method.description,
                'is_active': payment_method.is_active,
                'created_at': payment_method.created_at.isoformat(),
                'updated_at': payment_method.updated_at.isoformat()
            }
            
            response = self.supabase.table('payment_methods')\
                .insert(data)\
                .execute()
            
            if response.data:
                return PaymentMethodEntity.from_dict(response.data[0])
            
            raise Exception("Failed to create payment method")
            
        except Exception as e:
            logger.error(f"Error creating payment method: {str(e)}")
            raise
    
    async def update_payment_method(self, payment_method_id: str, updates: Dict) -> Optional[PaymentMethodEntity]:
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            response = self.supabase.table('payment_methods')\
                .update(updates)\
                .eq('id', payment_method_id)\
                .execute()
            
            if response.data:
                return PaymentMethodEntity.from_dict(response.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating payment method {payment_method_id}: {str(e)}")
            raise
    
    async def deactivate_payment_method(self, payment_method_id: str) -> bool:
        try:
            response = self.supabase.table('payment_methods')\
                .update({'is_active': False, 'updated_at': datetime.now().isoformat()})\
                .eq('id', payment_method_id)\
                .execute()
            
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error deactivating payment method {payment_method_id}: {str(e)}")
            return False