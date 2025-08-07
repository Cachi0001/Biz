import logging
from typing import Dict
from datetime import datetime
from decimal import Decimal
import uuid

from core.entities.product_entity import ProductEntity, ProductStatus
from core.interfaces.repositories.product_repository_interface import ProductRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException, DuplicateResourceException

logger = logging.getLogger(__name__)

class CreateProductUseCase:
    
    def __init__(self, product_repository: ProductRepositoryInterface):
        self.product_repository = product_repository
    
    async def execute(self, product_data: Dict, owner_id: str) -> Dict:
        validation_errors = self._validate_product_data(product_data)
        if validation_errors:
            raise ValidationException("Product validation failed", validation_errors)
        
        await self._check_sku_uniqueness(product_data['sku'], owner_id)
        
        product_id = str(uuid.uuid4())
        current_time = datetime.now()
        
        product = ProductEntity(
            id=product_id,
            owner_id=owner_id,
            name=product_data['name'].strip(),
            sku=product_data['sku'].strip().upper(),
            category=product_data['category'],
            description=product_data.get('description', '').strip() or None,
            unit_price=Decimal(str(product_data['unit_price'])),
            cost_price=Decimal(str(product_data.get('cost_price', 0))),
            quantity=int(product_data.get('quantity', 0)),
            low_stock_threshold=int(product_data.get('low_stock_threshold', 5)),
            status=ProductStatus.ACTIVE,
            created_at=current_time,
            updated_at=current_time,
            image_url=product_data.get('image_url'),
            barcode=product_data.get('barcode'),
            unit_of_measure=product_data.get('unit_of_measure', 'piece')
        )
        
        try:
            created_product = await self.product_repository.create_product(product)
            logger.info(f"Successfully created product: {created_product.name} (SKU: {created_product.sku})")
            
            return {
                "success": True,
                "message": "Product created successfully",
                "product_id": created_product.id,
                "sku": created_product.sku,
                "name": created_product.name
            }
            
        except Exception as e:
            logger.error(f"Failed to create product: {str(e)}")
            raise
    
    def _validate_product_data(self, data: Dict) -> Dict:
        errors = {}
        
        required_fields = ['name', 'sku', 'category', 'unit_price']
        for field in required_fields:
            if not data.get(field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        name = data.get('name', '').strip()
        if name and len(name) < 2:
            errors['name'] = "Product name must be at least 2 characters long"
        
        sku = data.get('sku', '').strip()
        if sku and len(sku) < 2:
            errors['sku'] = "SKU must be at least 2 characters long"
        
        try:
            unit_price = float(data.get('unit_price', 0))
            if unit_price < 0:
                errors['unit_price'] = "Unit price cannot be negative"
        except (ValueError, TypeError):
            errors['unit_price'] = "Unit price must be a valid number"
        
        try:
            cost_price = float(data.get('cost_price', 0))
            if cost_price < 0:
                errors['cost_price'] = "Cost price cannot be negative"
        except (ValueError, TypeError):
            errors['cost_price'] = "Cost price must be a valid number"
        
        try:
            quantity = int(data.get('quantity', 0))
            if quantity < 0:
                errors['quantity'] = "Quantity cannot be negative"
        except (ValueError, TypeError):
            errors['quantity'] = "Quantity must be a valid integer"
        
        try:
            threshold = int(data.get('low_stock_threshold', 5))
            if threshold < 0:
                errors['low_stock_threshold'] = "Low stock threshold cannot be negative"
        except (ValueError, TypeError):
            errors['low_stock_threshold'] = "Low stock threshold must be a valid integer"
        
        return errors
    
    async def _check_sku_uniqueness(self, sku: str, owner_id: str) -> None:
        existing_product = await self.product_repository.find_product_by_sku(sku.strip().upper(), owner_id)
        if existing_product:
            raise DuplicateResourceException("Product", "sku", sku)