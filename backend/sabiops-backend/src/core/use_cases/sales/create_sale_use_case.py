from typing import Dict, List
from datetime import datetime, date
from decimal import Decimal
import uuid

from core.entities.sale_entity import SaleEntity, SaleItemEntity, PaymentMethod, SaleStatus
from shared.exceptions.business_exceptions import ValidationException, ResourceNotFoundException

class CreateSaleUseCase:    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def validate_sale_data(self, sale_data: Dict) -> tuple[bool, Dict]:
        errors = {}
        
        required_fields = ['customer_name', 'items', 'payment_method']
        for field in required_fields:
            if not sale_data.get(field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        items = sale_data.get('items', [])
        if not items:
            errors['items'] = "At least one item is required"
        else:
            for i, item in enumerate(items):
                item_errors = {}
                if not item.get('product_id'):
                    item_errors['product_id'] = "Product ID is required"
                if not item.get('quantity') or item.get('quantity', 0) <= 0:
                    item_errors['quantity'] = "Quantity must be greater than 0"
                if not item.get('unit_price') or item.get('unit_price', 0) <= 0:
                    item_errors['unit_price'] = "Unit price must be greater than 0"
                
                if item_errors:
                    errors[f'items[{i}]'] = item_errors
        
        payment_method = sale_data.get('payment_method')
        if payment_method:
            try:
                PaymentMethod(payment_method)
            except ValueError:
                errors['payment_method'] = "Invalid payment method"
        
        return len(errors) == 0, errors
    
    def get_product_details(self, product_id: str, owner_id: str) -> Dict:
        try:
            result = self.supabase.table("products").select("*").eq("id", product_id).eq("owner_id", owner_id).execute()
            
            if not result.data:
                raise ResourceNotFoundException("Product", product_id)
            
            return result.data[0]
        except Exception as e:
            raise ResourceNotFoundException("Product", product_id)
    
    def check_inventory_availability(self, product_id: str, quantity: int, owner_id: str) -> bool:
        try:
            product = self.get_product_details(product_id, owner_id)
            current_stock = product.get('stock_quantity', 0)
            return current_stock >= quantity
        except:
            return False
    
    def update_inventory(self, product_id: str, quantity_sold: int, owner_id: str) -> bool:
        try:
            product = self.get_product_details(product_id, owner_id)
            current_stock = product.get('stock_quantity', 0)
            new_stock = current_stock - quantity_sold
            
            # Update stock
            result = self.supabase.table("products").update({
                "stock_quantity": new_stock,
                "updated_at": datetime.now().isoformat()
            }).eq("id", product_id).eq("owner_id", owner_id).execute()
            
            return bool(result.data)
        except Exception as e:
            return False
    
    def execute(self, sale_data: Dict, owner_id: str) -> Dict:
        """Create a new sale with complete business logic"""
        try:
            # Validate input data
            is_valid, errors = self.validate_sale_data(sale_data)
            if not is_valid:
                return {"success": False, "message": "Validation failed", "errors": errors}
            
            # Check inventory for all items
            items_data = sale_data['items']
            inventory_errors = {}
            
            for i, item_data in enumerate(items_data):
                product_id = item_data['product_id']
                quantity = item_data['quantity']
                
                if not self.check_inventory_availability(product_id, quantity, owner_id):
                    try:
                        product = self.get_product_details(product_id, owner_id)
                        available_stock = product.get('stock_quantity', 0)
                        inventory_errors[f'items[{i}]'] = f"Insufficient stock. Available: {available_stock}, Requested: {quantity}"
                    except:
                        inventory_errors[f'items[{i}]'] = "Product not found or insufficient stock"
            
            if inventory_errors:
                return {"success": False, "message": "Inventory check failed", "errors": inventory_errors}
            
            # Create sale items with product details
            sale_items = []
            for item_data in items_data:
                product = self.get_product_details(item_data['product_id'], owner_id)
                
                unit_price = Decimal(str(item_data['unit_price']))
                unit_cost = Decimal(str(product.get('cost_price', 0)))
                quantity = item_data['quantity']
                
                sale_item = SaleItemEntity(
                    product_id=product['id'],
                    product_name=product['name'],
                    quantity=quantity,
                    unit_price=unit_price,
                    unit_cost=unit_cost,
                    total_price=Decimal('0'),  # Will be calculated
                    total_cost=Decimal('0'),   # Will be calculated
                    profit=Decimal('0')        # Will be calculated
                )
                sale_item.calculate_totals()
                sale_items.append(sale_item)
            
            # Create sale entity
            sale_id = str(uuid.uuid4())
            sale_date = datetime.now().date()
            
            if sale_data.get('date'):
                try:
                    sale_date = datetime.fromisoformat(sale_data['date']).date()
                except:
                    pass  # Use current date if parsing fails
            
            sale = SaleEntity(
                id=sale_id,
                owner_id=owner_id,
                customer_id=sale_data.get('customer_id'),
                customer_name=sale_data['customer_name'],
                items=sale_items,
                subtotal=Decimal('0'),  # Will be calculated
                discount_amount=Decimal(str(sale_data.get('discount_amount', 0))),
                tax_amount=Decimal(str(sale_data.get('tax_amount', 0))),
                total_amount=Decimal('0'),  # Will be calculated
                total_cogs=Decimal('0'),    # Will be calculated
                profit_from_sales=Decimal('0'),  # Will be calculated
                payment_method=PaymentMethod(sale_data['payment_method']),
                status=SaleStatus.COMPLETED,
                sale_date=sale_date,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                notes=sale_data.get('notes'),
                reference_number=sale_data.get('reference_number')
            )
            
            # Calculate totals
            sale.calculate_totals()
            
            # Save sale to database
            sale_dict = sale.to_dict()
            # Convert items to the format expected by the database
            sale_dict['items'] = sale_data['items']  # Keep original format for now
            
            result = self.supabase.table("sales").insert(sale_dict).execute()
            
            if not result.data:
                return {"success": False, "message": "Failed to create sale"}
            
            created_sale = result.data[0]
            
            # Update inventory for all items
            inventory_updates_failed = []
            for item in sale_items:
                if not self.update_inventory(item.product_id, item.quantity, owner_id):
                    inventory_updates_failed.append(item.product_name)
            
            if inventory_updates_failed:
                # Log warning but don't fail the sale
                print(f"Warning: Failed to update inventory for: {', '.join(inventory_updates_failed)}")
            
            return {
                "success": True,
                "message": "Sale created successfully",
                "data": created_sale
            }
            
        except Exception as e:
            return {"success": False, "message": f"Failed to create sale: {str(e)}"}