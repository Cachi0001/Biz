import logging
from typing import Dict
from datetime import datetime, date
from decimal import Decimal

from core.interfaces.repositories.sales_repository_interface import SalesRepositoryInterface
from core.interfaces.repositories.expense_repository_interface import ExpenseRepositoryInterface
from shared.exceptions.business_exceptions import BusinessException

logger = logging.getLogger(__name__)

class GetDailySummaryUseCase:
    
    def __init__(self, 
                 sales_repository: SalesRepositoryInterface,
                 expense_repository: ExpenseRepositoryInterface):
        self.sales_repository = sales_repository
        self.expense_repository = expense_repository
    
    async def execute(self, owner_id: str, target_date: date = None) -> Dict:
        if not target_date:
            target_date = date.today()
        
        try:
            # Get start and end of the target date
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date, datetime.max.time())
            
            # Get sales data for the day
            sales_filters = {
                'start_date': start_datetime.isoformat(),
                'end_date': end_datetime.isoformat()
            }
            
            sales = await self.sales_repository.find_sales_by_owner(owner_id, sales_filters)
            
            # Get expense data for the day
            expense_filters = {
                'start_date': start_datetime,
                'end_date': end_datetime
            }
            
            expenses = await self.expense_repository.find_expenses_by_owner(owner_id, expense_filters)
            
            # Calculate cash at hand
            cash_summary = self._calculate_cash_summary(sales, expenses)
            
            # Calculate POS totals
            pos_summary = self._calculate_pos_summary(sales, expenses)
            
            # Calculate product category sales
            category_summary = self._calculate_category_summary(sales)
            
            # Calculate overall daily summary
            daily_totals = self._calculate_daily_totals(sales, expenses)
            
            logger.info(f"Successfully generated daily summary for {target_date}")
            
            return {
                "success": True,
                "date": target_date.isoformat(),
                "cash_summary": cash_summary,
                "pos_summary": pos_summary,
                "category_summary": category_summary,
                "daily_totals": daily_totals,
                "sales_count": len(sales),
                "expenses_count": len(expenses)
            }
            
        except Exception as e:
            logger.error(f"Failed to generate daily summary: {str(e)}")
            raise BusinessException(f"Failed to generate daily summary: {str(e)}")
    
    def _calculate_cash_summary(self, sales, expenses) -> Dict:
        # Cash received from sales
        cash_sales = [sale for sale in sales if sale.payment_method.lower() == 'cash' and sale.payment_status.value == 'paid']
        cash_in = sum(float(sale.total_amount) for sale in cash_sales)
        
        # Cash spent on expenses
        cash_expenses = [expense for expense in expenses if expense.category.value == 'cash']
        cash_out = sum(float(expense.amount) for expense in cash_expenses)
        
        # Calculate cash at hand (assuming starting cash balance)
        cash_at_hand = cash_in - cash_out
        
        return {
            "cash_in": cash_in,
            "cash_out": cash_out,
            "cash_at_hand": cash_at_hand,
            "cash_sales_count": len(cash_sales),
            "cash_expenses_count": len(cash_expenses)
        }
    
    def _calculate_pos_summary(self, sales, expenses) -> Dict:
        # POS deposits (money coming in)
        pos_sales = [sale for sale in sales if 'pos' in sale.payment_method.lower() and sale.payment_status.value == 'paid']
        pos_deposits = sum(float(sale.total_amount) for sale in pos_sales)
        
        # POS withdrawals (money going out) - from expenses or refunds
        pos_expenses = [expense for expense in expenses if 'pos' in expense.category.value.lower()]
        pos_withdrawals = sum(float(expense.amount) for expense in pos_expenses)
        
        # Group by POS account/terminal
        pos_accounts = {}
        for sale in pos_sales:
            account = getattr(sale, 'pos_account_name', 'Unknown POS')
            if account not in pos_accounts:
                pos_accounts[account] = {'deposits': 0, 'withdrawals': 0, 'net': 0}
            pos_accounts[account]['deposits'] += float(sale.total_amount)
        
        for expense in pos_expenses:
            account = getattr(expense, 'pos_account_name', 'Unknown POS')
            if account not in pos_accounts:
                pos_accounts[account] = {'deposits': 0, 'withdrawals': 0, 'net': 0}
            pos_accounts[account]['withdrawals'] += float(expense.amount)
        
        # Calculate net for each account
        for account in pos_accounts:
            pos_accounts[account]['net'] = pos_accounts[account]['deposits'] - pos_accounts[account]['withdrawals']
        
        return {
            "total_deposits": pos_deposits,
            "total_withdrawals": pos_withdrawals,
            "net_pos_amount": pos_deposits - pos_withdrawals,
            "pos_sales_count": len(pos_sales),
            "pos_accounts": pos_accounts
        }
    
    def _calculate_category_summary(self, sales) -> Dict:
        # Group sales by product category
        category_sales = {}
        
        for sale in sales:
            if sale.payment_status.value == 'paid':  # Only count paid sales
                # For now, we'll use product name to infer category
                # In a full implementation, this would come from a product_categories table
                category = self._infer_product_category(sale.product_name)
                
                if category not in category_sales:
                    category_sales[category] = {
                        'total_amount': 0,
                        'quantity_sold': 0,
                        'sales_count': 0,
                        'profit': 0
                    }
                
                category_sales[category]['total_amount'] += float(sale.total_amount)
                category_sales[category]['quantity_sold'] += sale.quantity
                category_sales[category]['sales_count'] += 1
                category_sales[category]['profit'] += float(sale.gross_profit)
        
        # Calculate percentages
        total_sales_amount = sum(cat['total_amount'] for cat in category_sales.values())
        
        for category in category_sales:
            if total_sales_amount > 0:
                category_sales[category]['percentage'] = (category_sales[category]['total_amount'] / total_sales_amount) * 100
            else:
                category_sales[category]['percentage'] = 0
        
        return {
            "categories": category_sales,
            "total_categories": len(category_sales),
            "total_sales_amount": total_sales_amount
        }
    
    def _calculate_daily_totals(self, sales, expenses) -> Dict:
        # Total sales (only paid)
        paid_sales = [sale for sale in sales if sale.payment_status.value == 'paid']
        total_sales_amount = sum(float(sale.total_amount) for sale in paid_sales)
        total_profit = sum(float(sale.gross_profit) for sale in paid_sales)
        
        # Total expenses
        total_expenses = sum(float(expense.amount) for expense in expenses)
        
        # Net profit for the day
        net_profit = total_profit - total_expenses
        
        # Credit sales
        credit_sales = [sale for sale in sales if sale.payment_status.value == 'credit']
        total_credit_amount = sum(float(sale.amount_due) for sale in credit_sales)
        
        return {
            "total_sales_amount": total_sales_amount,
            "total_profit": total_profit,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "paid_sales_count": len(paid_sales),
            "credit_sales_count": len(credit_sales),
            "total_credit_amount": total_credit_amount,
            "profit_margin": (total_profit / total_sales_amount * 100) if total_sales_amount > 0 else 0
        }
    
    def _infer_product_category(self, product_name: str) -> str:
        """
        Temporary function to infer product category from name.
        In a full implementation, this would be replaced with proper category lookup.
        """
        if not product_name:
            return "Uncategorized"
        
        product_lower = product_name.lower()
        
        # Drinks category
        drink_keywords = ['drink', 'juice', 'water', 'soda', 'beer', 'wine', 'coffee', 'tea', 'smoothie']
        if any(keyword in product_lower for keyword in drink_keywords):
            return "Drinks"
        
        # Food category
        food_keywords = ['food', 'meal', 'bread', 'rice', 'chicken', 'beef', 'fish', 'soup', 'salad']
        if any(keyword in product_lower for keyword in food_keywords):
            return "Food"
        
        # Electronics category
        electronics_keywords = ['phone', 'laptop', 'computer', 'tablet', 'headphone', 'speaker', 'charger']
        if any(keyword in product_lower for keyword in electronics_keywords):
            return "Electronics"
        
        # Clothing category
        clothing_keywords = ['shirt', 'dress', 'trouser', 'shoe', 'bag', 'hat', 'jacket', 'jean']
        if any(keyword in product_lower for keyword in clothing_keywords):
            return "Clothing"
        
        return "Other"