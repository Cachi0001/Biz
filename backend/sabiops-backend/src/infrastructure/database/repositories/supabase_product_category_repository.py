import logging
from typing import Optional, List

from core.entities.product_category_entity import ProductCategoryEntity
from core.interfaces.repositories.product_category_repository_interface import ProductCategoryRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client
from shared.exceptions.business_exceptions import BusinessException

logger = logging.getLogger(__name__)

class SupabaseProductCategoryRepository(ProductCategoryRepositoryInterface):
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "product_categories"
    
    async def find_all_active_categories(self) -> List[ProductCategoryEntity]:
        """Find all active product categories"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('is_active', True)\
                .order('name')\
                .execute()
            
            return [ProductCategoryEntity.from_dict(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding active categories: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_category_by_id(self, category_id: str) -> Optional[ProductCategoryEntity]:
        """Find a product category by ID"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('id', category_id)\
                .execute()
            
            if result.data:
                return ProductCategoryEntity.from_dict(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding category by ID: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_category_by_name(self, name: str) -> Optional[ProductCategoryEntity]:
        """Find a product category by name"""
        try:
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq('name', name)\
                .execute()
            
            if result.data:
                return ProductCategoryEntity.from_dict(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding category by name: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def find_drinks_category(self) -> Optional[ProductCategoryEntity]:
        """Find the drinks category specifically"""
        return await self.find_category_by_name('Drinks')
    
    async def create_category(self, category: ProductCategoryEntity) -> ProductCategoryEntity:
        """Create a new product category (admin only)"""
        try:
            category_data = {
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'is_active': category.is_active,
                'created_at': category.created_at.isoformat(),
                'updated_at': category.updated_at.isoformat()
            }
            
            result = self.supabase.table(self.table_name).insert(category_data).execute()
            
            if result.data:
                logger.info(f"Created product category: {category.name}")
                return ProductCategoryEntity.from_dict(result.data[0])
            else:
                raise BusinessException("Failed to create category record")
                
        except Exception as e:
            logger.error(f"Error creating category: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")
    
    async def update_category(self, category_id: str, updates: dict) -> Optional[ProductCategoryEntity]:
        """Update a product category (admin only)"""
        try:
            from datetime import datetime
            updates['updated_at'] = datetime.now().isoformat()
            
            result = self.supabase.table(self.table_name)\
                .update(updates)\
                .eq('id', category_id)\
                .execute()
            
            if result.data:
                return ProductCategoryEntity.from_dict(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating category: {str(e)}")
            raise BusinessException(f"Database error: {str(e)}")