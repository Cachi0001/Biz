from abc import ABC, abstractmethod
from typing import Optional, List
from core.entities.product_category_entity import ProductCategoryEntity

class ProductCategoryRepositoryInterface(ABC):
    
    @abstractmethod
    async def find_all_active_categories(self) -> List[ProductCategoryEntity]:
        """Find all active product categories"""
        pass
    
    @abstractmethod
    async def find_category_by_id(self, category_id: str) -> Optional[ProductCategoryEntity]:
        """Find a product category by ID"""
        pass
    
    @abstractmethod
    async def find_category_by_name(self, name: str) -> Optional[ProductCategoryEntity]:
        """Find a product category by name"""
        pass
    
    @abstractmethod
    async def find_drinks_category(self) -> Optional[ProductCategoryEntity]:
        """Find the drinks category specifically"""
        pass
    
    @abstractmethod
    async def create_category(self, category: ProductCategoryEntity) -> ProductCategoryEntity:
        """Create a new product category (admin only)"""
        pass
    
    @abstractmethod
    async def update_category(self, category_id: str, updates: dict) -> Optional[ProductCategoryEntity]:
        """Update a product category (admin only)"""
        pass