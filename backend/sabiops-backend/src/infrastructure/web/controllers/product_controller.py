import logging
from flask import request, g
from typing import Dict, Any

from core.use_cases.product.create_product_use_case import CreateProductUseCase
from core.use_cases.product.get_products_use_case import GetProductsUseCase
from shared.exceptions.business_exceptions import (
    ValidationException,
    DuplicateResourceException,
    ResourceNotFoundException,
    BusinessException
)
from infrastructure.config.dependency_injection import get_container
from shared.utils.response_utils import ResponseUtils

logger = logging.getLogger(__name__)

class ProductController:
    
    def __init__(self):
        self.container = get_container()
    
    async def create_product(self) -> Dict[str, Any]:
        try:
            data = request.get_json()
            if not data:
                return ResponseUtils.error_response("Request body is required", status_code=400)
            
            owner_id = g.current_user.get_effective_owner_id()
            
            create_product_use_case = self.container.get(CreateProductUseCase)
            result = await create_product_use_case.execute(data, owner_id)
            
            return ResponseUtils.success_response(
                "Product created successfully", 
                result, 
                201
            )
            
        except ValidationException as e:
            logger.warning(f"Product creation validation error: {e.message}")
            return ResponseUtils.validation_error_response(e.message, e.field_errors)
            
        except DuplicateResourceException as e:
            logger.warning(f"Duplicate product error: {e.message}")
            return ResponseUtils.error_response(e.message, "DUPLICATE_SKU", 409)
            
        except Exception as e:
            logger.error(f"Unexpected error during product creation: {str(e)}")
            return ResponseUtils.error_response("Product creation failed", status_code=500)
    
    async def get_products(self) -> Dict[str, Any]:
        try:
            owner_id = g.current_user.get_effective_owner_id()
            
            filters = {
                'category': request.args.get('category'),
                'search': request.args.get('search'),
                'active_only': request.args.get('active_only', 'true').lower() == 'true',
                'low_stock_only': request.args.get('low_stock_only', 'false').lower() == 'true'
            }
            
            get_products_use_case = self.container.get(GetProductsUseCase)
            result = await get_products_use_case.execute(owner_id, filters)
            
            return ResponseUtils.success_response(
                result['message'],
                result['data']
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during products retrieval: {str(e)}")
            return ResponseUtils.error_response("Failed to retrieve products", status_code=500)
    
    async def get_product(self, product_id: str) -> Dict[str, Any]:
        try:
            owner_id = g.current_user.get_effective_owner_id()
            
            product_repository = self.container.get('ProductRepositoryInterface')
            product = await product_repository.find_product_by_id(product_id, owner_id)
            
            if not product:
                return ResponseUtils.not_found_response("Product", product_id)
            
            return ResponseUtils.success_response(
                "Product retrieved successfully",
                product.to_dict()
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during product retrieval: {str(e)}")
            return ResponseUtils.error_response("Failed to retrieve product", status_code=500)
    
    async def update_product(self, product_id: str) -> Dict[str, Any]:
        try:
            data = request.get_json()
            if not data:
                return ResponseUtils.error_response("Request body is required", status_code=400)
            
            owner_id = g.current_user.get_effective_owner_id()
            
            product_repository = self.container.get('ProductRepositoryInterface')
            updated_product = await product_repository.update_product(product_id, data, owner_id)
            
            if not updated_product:
                return ResponseUtils.not_found_response("Product", product_id)
            
            return ResponseUtils.success_response(
                "Product updated successfully",
                updated_product.to_dict()
            )
            
        except ValidationException as e:
            logger.warning(f"Product update validation error: {e.message}")
            return ResponseUtils.validation_error_response(e.message, e.field_errors)
            
        except DuplicateResourceException as e:
            logger.warning(f"Duplicate product error: {e.message}")
            return ResponseUtils.error_response(e.message, "DUPLICATE_SKU", 409)
            
        except ResourceNotFoundException as e:
            return ResponseUtils.not_found_response("Product", product_id)
            
        except Exception as e:
            logger.error(f"Unexpected error during product update: {str(e)}")
            return ResponseUtils.error_response("Product update failed", status_code=500)
    
    async def delete_product(self, product_id: str) -> Dict[str, Any]:
        try:
            owner_id = g.current_user.get_effective_owner_id()
            
            product_repository = self.container.get('ProductRepositoryInterface')
            success = await product_repository.delete_product(product_id, owner_id)
            
            if not success:
                return ResponseUtils.not_found_response("Product", product_id)
            
            return ResponseUtils.success_response("Product deleted successfully")
            
        except Exception as e:
            logger.error(f"Unexpected error during product deletion: {str(e)}")
            return ResponseUtils.error_response("Product deletion failed", status_code=500)