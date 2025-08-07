import logging
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal

from core.entities.product_entity import ProductEntity, ProductStatus, StockStatus
from core.interfaces.repositories.product_repository_interface import ProductRepositoryInterface
from shared.exceptions.business_exceptions import (
    ResourceNotFoundException, 
    DuplicateResourceException,
    DatabaseOperationException
)

logger = logging.getLogger(__name__)

class SupabaseProductRepository(ProductRepositoryInterface):
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.table_name = "products"
    
    async def create_product(self, product: ProductEntity) -> ProductEntity:
        try:
            product_data = product.to_dict()
            product_data['created_at'] = product.created_at.isoformat()
            product_data['updated_at'] = product.updated_at.isoformat()
            product_data['active'] = product.status == ProductStatus.ACTIVE
            
            result = self.supabase.table(self.table_name).insert(product_data).execute()
            
            if not result.data:
                raise DatabaseOperationException("Failed to create product")
            
            created_product_data = result.data[0]
            created_product_data['status'] = ProductStatus.ACTIVE.value if created_product_data.pop('active', True) else ProductStatus.INACTIVE.value
            
            return ProductEntity.from_dict(created_product_data)
            
        except Exception as e:
            logger.error(f"Error creating product: {str(e)}")
            if "duplicate key" in str(e).lower() and "sku" in str(e).lower():
                raise DuplicateResourceException("Product", "sku", product.sku)
            raise DatabaseOperationException(f"Failed to create product: {str(e)}")
    
    async def find_product_by_id(self, product_id: str, owner_id: str) -> Optional[ProductEntity]:
        try:
            result = (self.supabase.table(self.table_name)
                     .select("*")
                     .eq("id", product_id)
                     .eq("owner_id", owner_id)
                     .execute())
            
            if not result.data:
                return None
            
            product_data = result.data[0]
            product_data['status'] = ProductStatus.ACTIVE.value if product_data.pop('active', True) else ProductStatus.INACTIVE.value
            
            return ProductEntity.from_dict(product_data)
            
        except Exception as e:
            logger.error(f"Error finding product by ID {product_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find product: {str(e)}")
    
    async def find_products_by_owner(self, owner_id: str, filters: Dict = None) -> List[ProductEntity]:
        try:
            query = self.supabase.table(self.table_name).select("*").eq("owner_id", owner_id)
            
            if filters:
                if filters.get('active_only', True):
                    query = query.eq("active", True)
                
                if filters.get('category') and filters['category'] != 'all':
                    query = query.eq("category", filters['category'])
                
                if filters.get('search'):
                    search_term = filters['search']
                    query = query.or_(f"name.ilike.%{search_term}%,sku.ilike.%{search_term}%")
                
                if filters.get('low_stock_only'):
                    query = query.lte("quantity", "low_stock_threshold")
            
            result = query.order("created_at", desc=True).execute()
            
            products = []
            for product_data in result.data:
                product_data['status'] = ProductStatus.ACTIVE.value if product_data.pop('active', True) else ProductStatus.INACTIVE.value
                products.append(ProductEntity.from_dict(product_data))
            
            return products
            
        except Exception as e:
            logger.error(f"Error finding products by owner {owner_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find products: {str(e)}")
    
    async def find_product_by_sku(self, sku: str, owner_id: str) -> Optional[ProductEntity]:
        try:
            result = (self.supabase.table(self.table_name)
                     .select("*")
                     .eq("sku", sku)
                     .eq("owner_id", owner_id)
                     .execute())
            
            if not result.data:
                return None
            
            product_data = result.data[0]
            product_data['status'] = ProductStatus.ACTIVE.value if product_data.pop('active', True) else ProductStatus.INACTIVE.value
            
            return ProductEntity.from_dict(product_data)
            
        except Exception as e:
            logger.error(f"Error finding product by SKU {sku}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find product: {str(e)}")
    
    async def update_product(self, product_id: str, updates: dict, owner_id: str) -> Optional[ProductEntity]:
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            if 'status' in updates:
                updates['active'] = updates.pop('status') == ProductStatus.ACTIVE.value
            
            result = (self.supabase.table(self.table_name)
                     .update(updates)
                     .eq("id", product_id)
                     .eq("owner_id", owner_id)
                     .execute())
            
            if not result.data:
                raise ResourceNotFoundException("Product", product_id)
            
            updated_product_data = result.data[0]
            updated_product_data['status'] = ProductStatus.ACTIVE.value if updated_product_data.pop('active', True) else ProductStatus.INACTIVE.value
            
            return ProductEntity.from_dict(updated_product_data)
            
        except ResourceNotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating product {product_id}: {str(e)}")
            if "duplicate key" in str(e).lower() and "sku" in str(e).lower():
                raise DuplicateResourceException("Product", "sku", updates.get('sku', ''))
            raise DatabaseOperationException(f"Failed to update product: {str(e)}")
    
    async def delete_product(self, product_id: str, owner_id: str) -> bool:
        try:
            result = (self.supabase.table(self.table_name)
                     .update({
                         'active': False,
                         'status': ProductStatus.INACTIVE.value,
                         'updated_at': datetime.now().isoformat()
                     })
                     .eq("id", product_id)
                     .eq("owner_id", owner_id)
                     .execute())
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to delete product: {str(e)}")
    
    async def update_stock_quantity(self, product_id: str, quantity: int, owner_id: str) -> bool:
        try:
            updates = {
                'quantity': quantity,
                'updated_at': datetime.now().isoformat()
            }
            
            result = (self.supabase.table(self.table_name)
                     .update(updates)
                     .eq("id", product_id)
                     .eq("owner_id", owner_id)
                     .execute())
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error updating stock for product {product_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to update stock: {str(e)}")
    
    async def get_low_stock_products(self, owner_id: str) -> List[ProductEntity]:
        try:
            result = (self.supabase.table(self.table_name)
                     .select("*")
                     .eq("owner_id", owner_id)
                     .eq("active", True)
                     .execute())
            
            low_stock_products = []
            for product_data in result.data:
                quantity = product_data.get('quantity', 0)
                threshold = product_data.get('low_stock_threshold', 5)
                
                if quantity <= threshold:
                    product_data['status'] = ProductStatus.ACTIVE.value if product_data.pop('active', True) else ProductStatus.INACTIVE.value
                    low_stock_products.append(ProductEntity.from_dict(product_data))
            
            return low_stock_products
            
        except Exception as e:
            logger.error(f"Error getting low stock products for owner {owner_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to get low stock products: {str(e)}")
    
    async def get_product_statistics(self, owner_id: str) -> Dict:
        try:
            result = (self.supabase.table(self.table_name)
                     .select("quantity, low_stock_threshold, unit_price, cost_price, active")
                     .eq("owner_id", owner_id)
                     .execute())
            
            stats = {
                'total_products': 0,
                'active_products': 0,
                'inactive_products': 0,
                'low_stock_count': 0,
                'out_of_stock_count': 0,
                'total_inventory_value': Decimal('0'),
                'categories': set()
            }
            
            for product_data in result.data:
                stats['total_products'] += 1
                
                if product_data.get('active', True):
                    stats['active_products'] += 1
                else:
                    stats['inactive_products'] += 1
                
                quantity = product_data.get('quantity', 0)
                threshold = product_data.get('low_stock_threshold', 5)
                cost_price = Decimal(str(product_data.get('cost_price', 0)))
                
                if quantity == 0:
                    stats['out_of_stock_count'] += 1
                elif quantity <= threshold:
                    stats['low_stock_count'] += 1
                
                stats['total_inventory_value'] += cost_price * Decimal(str(quantity))
            
            return {
                'total_products': stats['total_products'],
                'active_products': stats['active_products'],
                'inactive_products': stats['inactive_products'],
                'low_stock_count': stats['low_stock_count'],
                'out_of_stock_count': stats['out_of_stock_count'],
                'total_inventory_value': float(stats['total_inventory_value'])
            }
            
        except Exception as e:
            logger.error(f"Error getting product statistics for owner {owner_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to get product statistics: {str(e)}")