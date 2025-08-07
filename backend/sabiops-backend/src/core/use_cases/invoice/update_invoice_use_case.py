import logging
from typing import Dict
from datetime import datetime
from decimal import Decimal

from core.entities.invoice_entity import InvoiceItemEntity, InvoiceStatus
from core.interfaces.repositories.invoice_repository_interface import InvoiceRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException, ResourceNotFoundException

logger = logging.getLogger(__name__)

class UpdateInvoiceUseCase:
    
    def __init__(self, invoice_repository: InvoiceRepositoryInterface):
        self.invoice_repository = invoice_repository
    
    async def execute(self, invoice_id: str, updates: Dict, owner_id: str) -> Dict:
        existing_invoice = await self.invoice_repository.find_invoice_by_id(invoice_id)
        if not existing_invoice:
            raise ResourceNotFoundException("Invoice", invoice_id)
        
        if existing_invoice.owner_id != owner_id:
            raise ResourceNotFoundException("Invoice", invoice_id)
        
        if existing_invoice.status == InvoiceStatus.PAID:
            raise ValidationException("Cannot update paid invoice")
        
        validation_errors = self._validate_update_data(updates)
        if validation_errors:
            raise ValidationException("Invoice update validation failed", validation_errors)
        
        update_data = {}
        
        if 'customer_name' in updates:
            update_data['customer_name'] = updates['customer_name']
        
        if 'items' in updates:
            items = []
            for item_data in updates['items']:
                unit_price = Decimal(str(item_data['unit_price']))
                quantity = item_data['quantity']
                total_price = unit_price * Decimal(str(quantity))
                
                item = InvoiceItemEntity(
                    product_id=item_data['product_id'],
                    product_name=item_data['product_name'],
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    description=item_data.get('description')
                )
                items.append(item)
            
            subtotal = sum(item.total_price for item in items)
            tax_amount = Decimal(str(updates.get('tax_amount', existing_invoice.tax_amount)))
            discount_amount = Decimal(str(updates.get('discount_amount', existing_invoice.discount_amount)))
            total_amount = subtotal + tax_amount - discount_amount
            
            update_data['items'] = [item.__dict__ for item in items]
            update_data['subtotal'] = float(subtotal)
            update_data['total_amount'] = float(total_amount)
        
        if 'tax_amount' in updates:
            update_data['tax_amount'] = float(Decimal(str(updates['tax_amount'])))
        
        if 'discount_amount' in updates:
            update_data['discount_amount'] = float(Decimal(str(updates['discount_amount'])))
        
        if 'due_date' in updates:
            if updates['due_date']:
                update_data['due_date'] = datetime.fromisoformat(updates['due_date']).isoformat()
            else:
                update_data['due_date'] = None
        
        if 'notes' in updates:
            update_data['notes'] = updates['notes']
        
        if 'payment_terms' in updates:
            update_data['payment_terms'] = updates['payment_terms']
        
        if 'status' in updates:
            new_status = InvoiceStatus(updates['status'])
            update_data['status'] = new_status.value
            
            if new_status == InvoiceStatus.PAID:
                update_data['paid_date'] = datetime.now().isoformat()
        
        try:
            updated_invoice = await self.invoice_repository.update_invoice(invoice_id, update_data)
            logger.info(f"Successfully updated invoice: {invoice_id}")
            
            return {
                "success": True,
                "message": "Invoice updated successfully",
                "invoice_id": updated_invoice.id,
                "invoice_number": updated_invoice.invoice_number
            }
            
        except Exception as e:
            logger.error(f"Failed to update invoice {invoice_id}: {str(e)}")
            raise
    
    def _validate_update_data(self, data: Dict) -> Dict:
        errors = {}
        
        if 'items' in data:
            items = data['items']
            if not items:
                errors['items'] = "At least one item is required"
            else:
                for i, item in enumerate(items):
                    item_errors = {}
                    
                    if not item.get('product_id'):
                        item_errors['product_id'] = "Product ID is required"
                    
                    if not item.get('product_name'):
                        item_errors['product_name'] = "Product name is required"
                    
                    if not item.get('quantity') or item.get('quantity', 0) <= 0:
                        item_errors['quantity'] = "Quantity must be greater than 0"
                    
                    if not item.get('unit_price') or item.get('unit_price', 0) <= 0:
                        item_errors['unit_price'] = "Unit price must be greater than 0"
                    
                    if item_errors:
                        errors[f'items[{i}]'] = item_errors
        
        if 'tax_amount' in data and data['tax_amount'] < 0:
            errors['tax_amount'] = "Tax amount cannot be negative"
        
        if 'discount_amount' in data and data['discount_amount'] < 0:
            errors['discount_amount'] = "Discount amount cannot be negative"
        
        if 'status' in data:
            try:
                InvoiceStatus(data['status'])
            except ValueError:
                errors['status'] = "Invalid invoice status"
        
        return errors