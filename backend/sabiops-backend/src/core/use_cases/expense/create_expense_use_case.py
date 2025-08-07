import logging
from typing import Dict
from datetime import datetime, date
from decimal import Decimal
import uuid

from core.entities.expense_entity import ExpenseEntity, ExpenseCategory, ExpenseStatus
from core.interfaces.repositories.expense_repository_interface import ExpenseRepositoryInterface
from shared.exceptions.business_exceptions import ValidationException

logger = logging.getLogger(__name__)

class CreateExpenseUseCase:
    
    def __init__(self, expense_repository: ExpenseRepositoryInterface):
        self.expense_repository = expense_repository
    
    async def execute(self, expense_data: Dict, owner_id: str) -> Dict:
        validation_errors = self._validate_expense_data(expense_data)
        if validation_errors:
            raise ValidationException("Expense validation failed", validation_errors)
        
        expense_id = str(uuid.uuid4())
        current_time = datetime.now()
        
        expense = ExpenseEntity(
            id=expense_id,
            owner_id=owner_id,
            category=ExpenseCategory(expense_data['category']),
            amount=Decimal(str(expense_data['amount'])),
            description=expense_data['description'].strip(),
            expense_date=date.fromisoformat(expense_data['expense_date']),
            status=ExpenseStatus.APPROVED,
            created_at=current_time,
            updated_at=current_time,
            receipt_url=expense_data.get('receipt_url'),
            notes=expense_data.get('notes', '').strip() or None
        )
        
        try:
            created_expense = await self.expense_repository.create_expense(expense)
            logger.info(f"Successfully created expense: {created_expense.description} - ${created_expense.amount}")
            
            return {
                "success": True,
                "message": "Expense created successfully",
                "expense_id": created_expense.id,
                "amount": float(created_expense.amount),
                "category": created_expense.category.value
            }
            
        except Exception as e:
            logger.error(f"Failed to create expense: {str(e)}")
            raise
    
    def _validate_expense_data(self, data: Dict) -> Dict:
        errors = {}
        
        required_fields = ['category', 'amount', 'description', 'expense_date']
        for field in required_fields:
            if not data.get(field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        try:
            ExpenseCategory(data.get('category', ''))
        except ValueError:
            errors['category'] = "Invalid expense category"
        
        try:
            amount = float(data.get('amount', 0))
            if amount <= 0:
                errors['amount'] = "Amount must be greater than 0"
        except (ValueError, TypeError):
            errors['amount'] = "Amount must be a valid number"
        
        try:
            date.fromisoformat(data.get('expense_date', ''))
        except (ValueError, TypeError):
            errors['expense_date'] = "Invalid date format. Use YYYY-MM-DD"
        
        description = data.get('description', '').strip()
        if description and len(description) < 3:
            errors['description'] = "Description must be at least 3 characters long"
        
        return errors