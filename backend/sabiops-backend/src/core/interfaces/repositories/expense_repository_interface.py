from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from datetime import date
from core.entities.expense_entity import ExpenseEntity

class ExpenseRepositoryInterface(ABC):
    
    @abstractmethod
    async def create_expense(self, expense: ExpenseEntity) -> ExpenseEntity:
        pass
    
    @abstractmethod
    async def find_expense_by_id(self, expense_id: str, owner_id: str) -> Optional[ExpenseEntity]:
        pass
    
    @abstractmethod
    async def find_expenses_by_owner(self, owner_id: str, filters: Dict = None) -> List[ExpenseEntity]:
        pass
    
    @abstractmethod
    async def find_expenses_by_date_range(self, owner_id: str, start_date: date, end_date: date) -> List[ExpenseEntity]:
        pass
    
    @abstractmethod
    async def update_expense(self, expense_id: str, updates: dict, owner_id: str) -> Optional[ExpenseEntity]:
        pass
    
    @abstractmethod
    async def delete_expense(self, expense_id: str, owner_id: str) -> bool:
        pass
    
    @abstractmethod
    async def get_expense_statistics(self, owner_id: str, start_date: date = None, end_date: date = None) -> Dict:
        pass