import logging
from typing import List, Dict

from core.interfaces.repositories.payment_method_repository_interface import PaymentMethodRepositoryInterface
from shared.exceptions.business_exceptions import BusinessException

logger = logging.getLogger(__name__)

class GetPaymentMethodsUseCase:
    
    def __init__(self, payment_method_repository: PaymentMethodRepositoryInterface):
        self.payment_method_repository = payment_method_repository
    
    async def execute(self, filters: Dict = None) -> Dict:
        """Get all available payment methods with optional filtering"""
        
        try:
            # Get all active payment methods
            payment_methods = await self.payment_method_repository.find_all_active_methods()
            
            # Apply filters if provided
            if filters:
                payment_methods = self._apply_filters(payment_methods, filters)
            
            # Group methods by type for easier frontend consumption
            grouped_methods = self._group_methods_by_type(payment_methods)
            
            logger.info(f"Retrieved {len(payment_methods)} payment methods")
            
            return {
                "success": True,
                "payment_methods": [method.to_dict() for method in payment_methods],
                "grouped_methods": grouped_methods,
                "total_count": len(payment_methods)
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve payment methods: {str(e)}")
            raise BusinessException(f"Failed to retrieve payment methods: {str(e)}")
    
    async def get_pos_methods(self) -> Dict:
        """Get only POS payment methods"""
        
        try:
            pos_methods = await self.payment_method_repository.find_pos_methods()
            
            return {
                "success": True,
                "pos_methods": [method.to_dict() for method in pos_methods],
                "count": len(pos_methods)
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve POS methods: {str(e)}")
            raise BusinessException(f"Failed to retrieve POS methods: {str(e)}")
    
    async def get_cash_methods(self) -> Dict:
        """Get only cash payment methods"""
        
        try:
            cash_methods = await self.payment_method_repository.find_cash_methods()
            
            return {
                "success": True,
                "cash_methods": [method.to_dict() for method in cash_methods],
                "count": len(cash_methods)
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve cash methods: {str(e)}")
            raise BusinessException(f"Failed to retrieve cash methods: {str(e)}")
    
    def _apply_filters(self, methods: List, filters: Dict) -> List:
        """Apply filters to payment methods list"""
        filtered_methods = methods
        
        if filters.get('type'):
            filtered_methods = [m for m in filtered_methods if m.type.value == filters['type']]
        
        if filters.get('is_pos') is not None:
            filtered_methods = [m for m in filtered_methods if m.is_pos == filters['is_pos']]
        
        if filters.get('requires_reference') is not None:
            filtered_methods = [m for m in filtered_methods if m.requires_reference == filters['requires_reference']]
        
        return filtered_methods
    
    def _group_methods_by_type(self, methods: List) -> Dict:
        """Group payment methods by type"""
        grouped = {
            'Cash': [],
            'Digital': [],
            'Credit': []
        }
        
        for method in methods:
            grouped[method.type.value].append(method.to_dict())
        
        return grouped