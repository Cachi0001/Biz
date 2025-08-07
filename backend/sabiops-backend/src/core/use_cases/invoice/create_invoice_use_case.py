import logging
from typing import Dict, List
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from core.entities.invoice_entity import InvoiceEntity, InvoiceItemEntity, InvoiceStatus
from core.interfaces.repositories.invoice_repository_interface import InvoiceRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException

logger = logging.getLogger(__name__)

class CreateInvoiceUseCase:
    
    def __init__(self, invoice_repository: InvoiceRepositoryInterface):
        self.invoice_repository = invoice_repository
    
    async def execute(self, invoice_data: Dict, owner_id: str) -> Dict:
        validation_errors = self._validate_invoice_data(invoice_data)
        if validation_errors:
            raise ValidationException("Invoice validation failed", validation_errors)
        
        invoice_id = str(uuid.uuid4())
        invoice_number = self._generate_invoice_number()
        current_time = datetime.now()
        
        items = []
        for item_data in invoice_data['items']:
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
        tax_amount = Decimal(str(invoice_data.get('tax_amount', 0)))
        discount_amount = Decimal(str(invoice_data.get('discount_amount', 0)))
        total_amount = subtotal + tax_amount - discount_amount
        
        due_date = None
        if invoice_data.get('due_date'):
            due_date = datetime.fromisoformat(invoice_data['due_date'])
        elif invoice_data.get('payment_terms_days'):
            due_date = current_time + timedelta(days=invoice_data['payment_terms_days'])
        
        invoice = InvoiceEntity(
            id=invoice_id,
            owner_id=owner_id,
            customer_id=invoice_data['customer_id'],
            customer_name=invoice_data['customer_name'],
            invoice_number=invoice_number,
            status=InvoiceStatus.DRAFT,
            items=items,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            created_at=current_time,
            updated_at=current_time,
            due_date=due_date,
            notes=invoice_data.get('notes'),
            payment_terms=invoice_data.get('payment_terms')
        )
        
        try:
            created_invoice = await self.invoice_repository.create_invoice(invoice)
            logger.info(f"Successfully created invoice: {invoice_number}")
            
            return {
                "success": True,
                "message": "Invoice created successfully",
                "invoice_id": created_invoice.id,
                "invoice_number": created_invoice.invoice_number,
                "total_amount": float(created_invoice.total_amount)
            }
            
        except Exception as e:
            logger.error(f"Failed to create invoice: {str(e)}")
            raise
    
    def _validate_invoice_data(self, data: Dict) -> Dict:
        errors = {}
        
        required_fields = ['customer_id', 'customer_name', 'items']
        for field in required_fields:
            if not data.get(field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        items = data.get('items', [])
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
        
        tax_amount = data.get('tax_amount', 0)
        if tax_amount < 0:
            errors['tax_amount'] = "Tax amount cannot be negative"
        
        discount_amount = data.get('discount_amount', 0)
        if discount_amount < 0:
            errors['discount_amount'] = "Discount amount cannot be negative"
        
        return errors
    
    def _generate_invoice_number(self) -> str:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"INV-{timestamp}"