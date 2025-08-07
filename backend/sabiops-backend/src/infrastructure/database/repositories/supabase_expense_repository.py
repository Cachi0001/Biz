import logging
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal

from core.entities.expense_entity import ExpenseEntity, ExpenseCategory, ExpenseStatus
from core.interfaces.repositories.expense_repository_interface import ExpenseRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client
from shared.exceptions.business_exceptions import RepositoryException

logger = logging.getLogger(__name__)

class SupabaseExpenseRepository(ExpenseRepositoryInterface):
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def create_expense(self, expense: ExpenseEntity) -> ExpenseEntity:
        try:
            expense_data = {
                'id': expense.id,
                'owner_id': expense.owner_id,
                'title': expense.title,
                'description': expense.description,
                'amount': float(expense.amount),
                'category': expense.category.value,
                'status': expense.status.value,
                'expense_date': expense.expense_date.isoformat(),
                'created_at': expense.created_at.isoformat(),
                'updated_at': expense.updated_at.isoformat(),
                'receipt_url': expense.receipt_url,
                'vendor': expense.vendor,
                'payment_method': expense.payment_method
            }
            
            result = self.client.table('expenses').insert(expense_data).execute()
            
            if result.data:
                logger.info(f"Successfully created expense: {expense.id}")
                return self._map_to_entity(result.data[0])
            else:
                raise RepositoryException("Failed to create expense")
                
        except Exception as e:
            logger.error(f"Error creating expense: {str(e)}")
            raise RepositoryException(f"Failed to create expense: {str(e)}")
    
    async def find_expense_by_id(self, expense_id: str, owner_id: str) -> Optional[ExpenseEntity]:
        try:
            result = self.client.table('expenses').select('*').eq('id', expense_id).eq('owner_id', owner_id).execute()
            
            if result.data:
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding expense by ID: {str(e)}")
            raise RepositoryException(f"Failed to find expense: {str(e)}")
    
    async def find_expenses_by_owner(self, owner_id: str, filters: Dict = None) -> List[ExpenseEntity]:
        try:
            query = self.client.table('expenses').select('*').eq('owner_id', owner_id)
            
            if filters:
                if filters.get('start_date'):
                    if isinstance(filters['start_date'], datetime):
                        query = query.gte('expense_date', filters['start_date'].isoformat())
                    else:
                        query = query.gte('expense_date', filters['start_date'])
                if filters.get('end_date'):
                    if isinstance(filters['end_date'], datetime):
                        query = query.lte('expense_date', filters['end_date'].isoformat())
                    else:
                        query = query.lte('expense_date', filters['end_date'])
                if filters.get('category'):
                    query = query.eq('category', filters['category'])
                if filters.get('status'):
                    query = query.eq('status', filters['status'])
                if filters.get('payment_method'):
                    query = query.eq('payment_method', filters['payment_method'])
            
            query = query.order('expense_date', desc=True)
            
            if filters and filters.get('limit'):
                query = query.limit(filters['limit'])
            
            result = query.execute()
            
            return [self._map_to_entity(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding expenses by owner: {str(e)}")
            raise RepositoryException(f"Failed to find expenses: {str(e)}")
    
    async def update_expense(self, expense_id: str, updates: dict, owner_id: str) -> Optional[ExpenseEntity]:
        try:
            # Convert Decimal values to float for JSON serialization
            processed_updates = {}
            for key, value in updates.items():
                if isinstance(value, Decimal):
                    processed_updates[key] = float(value)
                elif isinstance(value, datetime):
                    processed_updates[key] = value.isoformat()
                elif hasattr(value, 'value'):  # Enum
                    processed_updates[key] = value.value
                else:
                    processed_updates[key] = value
            
            processed_updates['updated_at'] = datetime.now().isoformat()
            
            result = self.client.table('expenses').update(processed_updates).eq('id', expense_id).eq('owner_id', owner_id).execute()
            
            if result.data:
                logger.info(f"Successfully updated expense: {expense_id}")
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating expense: {str(e)}")
            raise RepositoryException(f"Failed to update expense: {str(e)}")
    
    async def delete_expense(self, expense_id: str, owner_id: str) -> bool:
        try:
            result = self.client.table('expenses').delete().eq('id', expense_id).eq('owner_id', owner_id).execute()
            
            success = len(result.data) > 0
            if success:
                logger.info(f"Successfully deleted expense: {expense_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting expense: {str(e)}")
            raise RepositoryException(f"Failed to delete expense: {str(e)}")
    
    async def get_expense_statistics(self, owner_id: str, start_date: datetime = None, end_date: datetime = None) -> Dict:
        try:
            query = self.client.table('expenses').select('*').eq('owner_id', owner_id)
            
            if start_date:
                query = query.gte('expense_date', start_date.isoformat())
            if end_date:
                query = query.lte('expense_date', end_date.isoformat())
            
            result = query.execute()
            expenses_data = result.data
            
            # Calculate statistics
            total_expenses = len(expenses_data)
            approved_expenses = [e for e in expenses_data if e.get('status') == 'approved']
            paid_expenses = [e for e in expenses_data if e.get('status') == 'paid']
            
            total_approved_amount = sum(float(e.get('amount', 0)) for e in approved_expenses)
            total_paid_amount = sum(float(e.get('amount', 0)) for e in paid_expenses)
            
            # Category breakdown
            categories = {}
            for expense in expenses_data:
                category = expense.get('category', 'other')
                if category not in categories:
                    categories[category] = {'count': 0, 'amount': 0}
                categories[category]['count'] += 1
                categories[category]['amount'] += float(expense.get('amount', 0))
            
            # Payment method breakdown
            payment_methods = {}
            for expense in paid_expenses:
                method = expense.get('payment_method', 'unknown')
                if method not in payment_methods:
                    payment_methods[method] = {'count': 0, 'amount': 0}
                payment_methods[method]['count'] += 1
                payment_methods[method]['amount'] += float(expense.get('amount', 0))
            
            return {
                'total_expenses': total_expenses,
                'approved_expenses': len(approved_expenses),
                'paid_expenses': len(paid_expenses),
                'total_approved_amount': total_approved_amount,
                'total_paid_amount': total_paid_amount,
                'categories': categories,
                'payment_methods': payment_methods,
                'average_expense_amount': total_approved_amount / len(approved_expenses) if approved_expenses else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting expense statistics: {str(e)}")
            raise RepositoryException(f"Failed to get expense statistics: {str(e)}")
    
    def _map_to_entity(self, data: dict) -> ExpenseEntity:
        return ExpenseEntity(
            id=data['id'],
            owner_id=data['owner_id'],
            title=data['title'],
            description=data.get('description'),
            amount=Decimal(str(data['amount'])),
            category=ExpenseCategory(data['category']),
            status=ExpenseStatus(data['status']),
            expense_date=datetime.fromisoformat(data['expense_date']),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            receipt_url=data.get('receipt_url'),
            vendor=data.get('vendor'),
            payment_method=data.get('payment_method')
        )