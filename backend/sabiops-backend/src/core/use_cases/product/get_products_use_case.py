import logging
from typing import Dict, List

from core.interfaces.repositories.product_repository_interface import ProductRepositoryInterface

logger = logging.getLogger(__name__)

class GetProductsUseCase:
    
    def __init__(self, product_repository: ProductRepositoryInterface):
        self.product_repository = product_repository
    
    async def execute(self, owner_id: str, filters: Dict = None) -> Dict:
        try:
            products = await self.product_repository.find_products_by_owner(owner_id, filters)
            statistics = await self.product_repository.get_product_statistics(owner_id)
            
            product_list = [product.to_dict() for product in products]
            
            categories = self._get_business_categories()
            used_categories = list(set([p['category'] for p in product_list if p.get('category')]))
            
            return {
                "success": True,
                "message": "Products retrieved successfully",
                "data": {
                    "products": product_list,
                    "categories": categories,
                    "used_categories": used_categories,
                    "statistics": statistics,
                    "total_count": len(product_list)
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get products for owner {owner_id}: {str(e)}")
            raise
    
    def _get_business_categories(self) -> List[str]:
        return [
            'Electronics & Technology',
            'Fashion & Clothing',
            'Food & Beverages',
            'Health & Beauty',
            'Home & Garden',
            'Automotive',
            'Sports & Outdoors',
            'Books & Media',
            'Office Supplies',
            'Agriculture',
            'Construction Materials',
            'Jewelry & Accessories',
            'Toys & Games',
            'Art & Crafts',
            'Other'
        ]