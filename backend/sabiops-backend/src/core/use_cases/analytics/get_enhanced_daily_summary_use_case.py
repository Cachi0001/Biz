import logging
from typing import Dict
from datetime import datetime, date
from decimal import Decimal

from core.interfaces.repositories.enhanced_payment_repository_interface import EnhancedPaymentRepositoryInterface
from core.interfaces.repositories.sales_repository_interface import SalesRepositoryInterface
from core.interfaces.repositories.product_category_repository_interface import ProductCategoryRepositoryInterface
from shared.exceptions.business_exceptions import BusinessException

logger = logging.getLogger(__name__)

class GetEnhancedDailySummaryUseCase:
    
    def __init__(
        self,
        payment_repository: EnhancedPaymentRepositoryInterface,
        sales_repository: SalesRepositoryInterface,
        category_repository: ProductCategoryRepositoryInterface
    ):
        self.payment_repository = payment_repository
        self.sales_repository = sales_repository
        self.category_repository = category_repository
    
    async def execute(self, owner_id: str, target_date: str = None) -> Dict:
        """Get enhanced daily summary with cash at hand, POS totals, and category sales"""
        
        try:
            # Parse target date or use today
            if target_date:
                summary_date = datetime.strptime(target_date, '%Y-%m-%d').date()
            else:
                summary_date = date.today()
            
            # Get daily payment summary
            payment_summary = await self.payment_repository.get_daily_payment_summary(
                owner_id, summary_date
            )
            
            # Get cash at hand calculation
            cash_summary = await self._calculate_cash_at_hand(owner_id, summary_date)
            
            # Get POS transaction totals
            pos_summary = await self._calculate_pos_totals(owner_id, summary_date)
            
            # Get drinks category sales
            drinks_summary = await self._calculate_drinks_sales(owner_id, summary_date)
            
            # Get all category sales for the day
            category_sales = await self._calculate_category_sales(owner_id, summary_date)
            
            logger.info(f"Generated enhanced daily summary for {summary_date}")
            
            return {
                "success": True,
                "date": summary_date.isoformat(),
                "cash_at_hand": cash_summary,
                "pos_transactions": pos_summary,
                "drinks_sales": drinks_summary,
                "category_sales": category_sales,
                "payment_summary": payment_summary,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to generate enhanced daily summary: {str(e)}")
            raise BusinessException(f"Failed to generate daily summary: {str(e)}")
    
    async def _calculate_cash_at_hand(self, owner_id: str, target_date: date) -> Dict:
        """Calculate cash at hand for the day"""
        
        cash_payments = await self.payment_repository.find_cash_payments_by_date(
            owner_id, target_date
        )
        
        money_in = sum(
            payment.amount for payment in cash_payments 
            if payment.is_money_in()
        )
        
        money_out = sum(
            payment.amount for payment in cash_payments 
            if payment.is_money_out()
        )
        
        cash_at_hand = money_in - money_out
        
        return {
            "total_cash_in": float(money_in),
            "total_cash_out": float(money_out),
            "cash_at_hand": float(cash_at_hand),
            "transaction_count": len(cash_payments)
        }
    
    async def _calculate_pos_totals(self, owner_id: str, target_date: date) -> Dict:
        """Calculate POS transaction totals for the day"""
        
        pos_payments = await self.payment_repository.find_pos_payments_by_date(
            owner_id, target_date
        )
        
        deposits = sum(
            payment.amount for payment in pos_payments 
            if payment.is_money_in()
        )
        
        withdrawals = sum(
            payment.amount for payment in pos_payments 
            if payment.is_money_out()
        )
        
        # Group by POS account for detailed breakdown
        account_breakdown = {}
        for payment in pos_payments:
            account = payment.pos_account_name or "Unknown Account"
            if account not in account_breakdown:
                account_breakdown[account] = {
                    "deposits": Decimal('0'),
                    "withdrawals": Decimal('0'),
                    "transaction_count": 0
                }
            
            if payment.is_money_in():
                account_breakdown[account]["deposits"] += payment.amount
            else:
                account_breakdown[account]["withdrawals"] += payment.amount
            
            account_breakdown[account]["transaction_count"] += 1
        
        # Convert to float for JSON serialization
        for account in account_breakdown:
            account_breakdown[account]["deposits"] = float(account_breakdown[account]["deposits"])
            account_breakdown[account]["withdrawals"] = float(account_breakdown[account]["withdrawals"])
        
        return {
            "total_deposits": float(deposits),
            "total_withdrawals": float(withdrawals),
            "net_pos_amount": float(deposits - withdrawals),
            "transaction_count": len(pos_payments),
            "account_breakdown": account_breakdown
        }
    
    async def _calculate_drinks_sales(self, owner_id: str, target_date: date) -> Dict:
        """Calculate drinks category sales for the day"""
        
        # Find drinks category
        drinks_category = await self.category_repository.find_drinks_category()
        if not drinks_category:
            return {
                "total_amount": 0.0,
                "transaction_count": 0,
                "message": "Drinks category not found"
            }
        
        # Get sales for drinks category
        drinks_sales = await self.sales_repository.find_sales_by_category_and_date(
            owner_id, drinks_category.id, target_date
        )
        
        # Only count paid sales for revenue recognition
        paid_sales = [sale for sale in drinks_sales if sale.is_fully_paid()]
        
        total_amount = sum(sale.total_amount for sale in paid_sales)
        
        return {
            "total_amount": float(total_amount),
            "transaction_count": len(paid_sales),
            "category_name": drinks_category.name
        }
    
    async def _calculate_category_sales(self, owner_id: str, target_date: date) -> Dict:
        """Calculate sales by all product categories for the day"""
        
        # Get all active categories
        categories = await self.category_repository.find_all_active_categories()
        
        category_sales = {}
        total_sales = Decimal('0')
        total_transactions = 0
        
        for category in categories:
            sales = await self.sales_repository.find_sales_by_category_and_date(
                owner_id, category.id, target_date
            )
            
            # Only count paid sales
            paid_sales = [sale for sale in sales if sale.is_fully_paid()]
            category_total = sum(sale.total_amount for sale in paid_sales)
            
            category_sales[category.name] = {
                "total_amount": float(category_total),
                "transaction_count": len(paid_sales),
                "category_id": category.id
            }
            
            total_sales += category_total
            total_transactions += len(paid_sales)
        
        return {
            "categories": category_sales,
            "total_sales": float(total_sales),
            "total_transactions": total_transactions
        }