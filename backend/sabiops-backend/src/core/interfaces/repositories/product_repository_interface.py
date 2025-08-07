from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from core.entities.product_entity import ProductEntity

class ProductRepositoryInterface(ABC):
    
    @abstractmethod
    async def create_product(self, product: ProductEntity) -> ProductEntity:
        pass
    
    @abstractmethod
    async def find_product_by_id(self, product_id: str, owner_id: str) -> Optional[ProductEntity]:
        pass
    
    @abstractmethod
    async def find_products_by_owner(self, owner_id: str, filters: Dict = None) -> List[ProductEntity]:
        pass
    
    @abstractmethod
    async def find_product_by_sku(self, sku: str, owner_id: str) -> Optional[ProductEntity]:
        pass
    
    @abstractmethod
    async def update_product(self, product_id: str, updates: dict, owner_id: str) -> Optional[ProductEntity]:
        pass
    
    @abstractmethod
    async def delete_product(self, product_id: str, owner_id: str) -> bool:
        pass
    
    @abstractmethod
    async def update_stock_quantity(self, product_id: str, quantity: int, owner_id: str) -> bool:
        pass
    
    @abstractmethod
    async def get_low_stock_products(self, owner_id: str) -> List[ProductEntity]:
        pass
    
    @abstractmethod
    async def get_product_statistics(self, owner_id: str) -> Dict:
        pass