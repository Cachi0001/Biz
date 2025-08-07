import logging
from typing import Optional, List, Dict
from datetime import datetime, date
from decimal import Decimal

from core.entities.sale_entity import SaleEntity, SaleItemEntity, PaymentStatus, PaymentMethod, SaleStatus
from core.interfaces.repositories.sales_repository_interface import SalesRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client
from shared.exceptions.business_exceptions import RepositoryException

logger = logging.getLogger(__name__)

class SupabaseSalesRepository(SalesRepositoryInterface):
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def create_sale(self, sale: SaleEntity) -> SaleEntity:
        try:
            # Calculate totals before creating sale
            sale.calculate_totals()
            
            sale_data = {
                'id': sale.id,
                'owner_id': sale.owner_id,
                'customer_id': sale.customer_id,
                'customer_name': sale.customer_name,
                'items': [item.to_dict() for item in sale.items],
                'subtotal': float(sale.subtotal),
                'discount_amount': float(sale.discount_amount),
                'tax_amount': float(sale.tax_amount),
                'total_amount': float(sale.total_amount),
                'total_cogs': float(sale.total_cogs),
                'profit_from_sales': float(sale.profit_from_sales),
                'payment_method': sale.payment_method.value,
                'payment_status': sale.payment_status.value,
                'status': sale.status.value,
                'sale_date': sale.sale_date.isoformat(),
                'created_at': sale.created_at.isoformat(),
                'updated_at': sale.updated_at.isoformat(),
                'amount_paid': float(sale.amount_paid),
                'amount_due': float(sale.amount_due),
                'salesperson_id': sale.salesperson_id,
                'customer_email': sale.customer_email,
                'currency': sale.currency,
                'description': sale.description,
                'reference_id': sale.reference_id,
                'notes': sale.notes,
                'reference_number': sale.reference_number
            }
            
            result = self.client.table('sales').insert(sale_data).execute()
            
            if result.data:
                logger.info(f"Successfully created sale: {sale.id}")
                return self._map_to_entity(result.data[0])
            else:
                raise RepositoryException("Failed to create sale")
                
        except Exception as e:
            logger.error(f"Error creating sale: {str(e)}")
            raise RepositoryException(f"Failed to create sale: {str(e)}")
    
    async def find_sale_by_id(self, sale_id: str, owner_id: str) -> Optional[SaleEntity]:
        try:
            result = self.client.table('sales').select('*').eq('id', sale_id).eq('owner_id', owner_id).execute()
            
            if result.data:
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding sale by ID: {str(e)}")
            raise RepositoryException(f"Failed to find sale: {str(e)}")
    
    async def find_sales_by_owner(self, owner_id: str, filters: Dict = None) -> List[SaleEntity]:
        try:
            query = self.client.table('sales').select('*').eq('owner_id', owner_id)
            
            if filters:
                if filters.get('start_date'):
                    query = query.gte('sale_date', filters['start_date'])
                if filters.get('end_date'):
                    query = query.lte('sale_date', filters['end_date'])
                if filters.get('customer_id'):
                    query = query.eq('customer_id', filters['customer_id'])
                if filters.get('product_id'):
                    query = query.eq('product_id', filters['product_id'])
                if filters.get('payment_status'):
                    query = query.eq('payment_status', filters['payment_status'])
                if filters.get('payment_method'):
                    query = query.eq('payment_method', filters['payment_method'])
            
            query = query.order('sale_date', desc=True)
            
            if filters and filters.get('limit'):
                query = query.limit(filters['limit'])
            
            result = query.execute()
            
            return [self._map_to_entity(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding sales by owner: {str(e)}")
            raise RepositoryException(f"Failed to find sales: {str(e)}")
    
    async def update_sale(self, sale_id: str, updates: dict, owner_id: str) -> Optional[SaleEntity]:
        try:
            processed_updates = {}
            for key, value in updates.items():
                if isinstance(value, Decimal):
                    processed_updates[key] = float(value)
                elif isinstance(value, datetime):
                    processed_updates[key] = value.isoformat()
                elif isinstance(value, date):
                    processed_updates[key] = value.isoformat()
                else:
                    processed_updates[key] = value
            
            result = self.client.table('sales').update(processed_updates).eq('id', sale_id).eq('owner_id', owner_id).execute()
            
            if result.data:
                logger.info(f"Successfully updated sale: {sale_id}")
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating sale: {str(e)}")
            raise RepositoryException(f"Failed to update sale: {str(e)}")
    
    async def delete_sale(self, sale_id: str, owner_id: str) -> bool:
        try:
            result = self.client.table('sales').delete().eq('id', sale_id).eq('owner_id', owner_id).execute()
            
            success = len(result.data) > 0
            if success:
                logger.info(f"Successfully deleted sale: {sale_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting sale: {str(e)}")
            raise RepositoryException(f"Failed to delete sale: {str(e)}")
    
    async def get_sales_statistics(self, owner_id: str, start_date: datetime = None, end_date: datetime = None) -> Dict:
        try:
            query = self.client.table('sales').select('*').eq('owner_id', owner_id)
            
            if start_date:
                query = query.gte('sale_date', start_date.isoformat())
            if end_date:
                query = query.lte('sale_date', end_date.isoformat())
            
            result = query.execute()
            sales_data = result.data
            
            total_sales = len(sales_data)
            total_revenue = sum(float(sale.get('total_amount', 0)) for sale in sales_data if sale.get('payment_status') == PaymentStatus.PAID.value)
            total_profit = sum(float(sale.get('profit_from_sales', 0)) for sale in sales_data if sale.get('payment_status') == PaymentStatus.PAID.value)
            
            credit_sales = [sale for sale in sales_data if sale.get('payment_status') == PaymentStatus.CREDIT.value]
            total_credit_amount = sum(float(sale.get('amount_due', 0)) for sale in credit_sales)
            
            payment_methods = {}
            for sale in sales_data:
                method = sale.get('payment_method', 'unknown')
                if method not in payment_methods:
                    payment_methods[method] = {'count': 0, 'amount': 0}
                payment_methods[method]['count'] += 1
                payment_methods[method]['amount'] += float(sale.get('total_amount', 0))
            
            return {
                'total_sales': total_sales,
                'total_revenue': total_revenue,
                'total_profit': total_profit,
                'credit_sales_count': len(credit_sales),
                'total_credit_amount': total_credit_amount,
                'payment_methods': payment_methods,
                'average_sale_value': total_revenue / total_sales if total_sales > 0 else 0,
                'profit_margin': (total_profit / total_revenue * 100) if total_revenue > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting sales statistics: {str(e)}")
            raise RepositoryException(f"Failed to get sales statistics: {str(e)}")
    
    async def update_payment_status(self, sale_id: str, payment_status: str, amount_paid: float, owner_id: str) -> Optional[SaleEntity]:
        try:
            current_sale = await self.find_sale_by_id(sale_id, owner_id)
            if not current_sale:
                return None
            
            new_amount_paid = float(current_sale.amount_paid) + amount_paid
            new_amount_due = float(current_sale.total_amount) - new_amount_paid
            
            if new_amount_due <= 0:
                final_status = PaymentStatus.PAID.value
                new_amount_due = 0
            elif new_amount_paid > 0:
                final_status = PaymentStatus.PARTIALLY_PAID.value
            else:
                final_status = payment_status
            
            updates = {
                'payment_status': final_status,
                'amount_paid': new_amount_paid,
                'amount_due': new_amount_due,
                'updated_at': datetime.now().isoformat()
            }
            
            return await self.update_sale(sale_id, updates, owner_id)
            
        except Exception as e:
            logger.error(f"Error updating payment status: {str(e)}")
            raise RepositoryException(f"Failed to update payment status: {str(e)}")
    
    async def get_credit_sales(self, owner_id: str) -> List[SaleEntity]:
        try:
            filters = {
                'payment_status': PaymentStatus.CREDIT.value
            }
            return await self.find_sales_by_owner(owner_id, filters)
            
        except Exception as e:
            logger.error(f"Error getting credit sales: {str(e)}")
            raise RepositoryException(f"Failed to get credit sales: {str(e)}")
    
    async def _map_to_entity(self, data: dict) -> SaleEntity:
        # Map items data
        items_data = data.get('items', [])
        items = []
        for item_data in items_data:
            items.append(SaleItemEntity(
                product_id=item_data['product_id'],
                product_name=item_data['product_name'],
                quantity=item_data['quantity'],
                unit_price=Decimal(str(item_data['unit_price'])),
                unit_cost=Decimal(str(item_data.get('unit_cost', 0))),
                total_price=Decimal(str(item_data['total_price'])),
                total_cost=Decimal(str(item_data['total_cost'])),
                profit=Decimal(str(item_data['profit']))
            ))
        
        return SaleEntity(
            id=data['id'],
            owner_id=data['owner_id'],
            customer_id=data.get('customer_id'),
            customer_name=data.get('customer_name'),
            items=items,
            subtotal=Decimal(str(data.get('subtotal', 0))),
            discount_amount=Decimal(str(data.get('discount_amount', 0))),
            tax_amount=Decimal(str(data.get('tax_amount', 0))),
            total_amount=Decimal(str(data['total_amount'])),
            total_cogs=Decimal(str(data.get('total_cogs', 0))),
            profit_from_sales=Decimal(str(data.get('profit_from_sales', 0))),
            payment_method=PaymentMethod(data.get('payment_method', 'cash')),
            payment_status=PaymentStatus(data.get('payment_status', 'completed')),
            status=SaleStatus(data.get('status', 'completed')),
            sale_date=datetime.fromisoformat(data['sale_date']).date() if isinstance(data['sale_date'], str) else data['sale_date'] if isinstance(data['sale_date'], date) else datetime.fromisoformat(data['sale_date']).date(),
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at'],
            updated_at=datetime.fromisoformat(data['updated_at']) if isinstance(data['updated_at'], str) else data['updated_at'],
            amount_paid=Decimal(str(data.get('amount_paid', 0))),
            amount_due=Decimal(str(data.get('amount_due', 0))),
            salesperson_id=data.get('salesperson_id'),
            customer_email=data.get('customer_email'),
            currency=data.get('currency', 'NGN'),
            description=data.get('description'),
            reference_id=data.get('reference_id'),
            notes=data.get('notes'),
            reference_number=data.get('reference_number')
        )