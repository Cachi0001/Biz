import logging
from typing import Dict
from datetime import date, datetime
from decimal import Decimal

from core.interfaces.repositories.payment_repository_interface import PaymentRepositoryInterface
from core.interfaces.repositories.sales_repository_interface import SalesRepositoryInterface

logger = logging.getLogger(__name__)

class GetDailySummaryUseCase:
    
    def __init__(self, 
                 payment_repository: PaymentRepositoryInterface,
                 sales_repository: SalesRepositoryInterface):
        self.payment_repository = payment_repository
        self.sales_repository = sales_repository
    
    async def execute(self, owner_id: str, target_date: date = None) -> Dict:
        if not target_date:
            target_date = date.today()
        
        try:
            # Get payment summaries
            payment_summary = await self.payment_repository.get_daily_payment_summary(owner_id, target_date)
            pos_summary = await self.payment_repository.get_pos_summary(owner_id, target_date)
            cash_summary = await self.payment_repository.get_cash_summary(owner_id, target_date)
            
            # Get sales by category
            category_sales = await self.sales_repository.get_daily_sales_by_category(owner_id, target_date)
            
            # Calculate cash at hand (cash in - cash out)
            cash_at_hand = cash_summary.get('cash_in', 0) - cash_summary.get('cash_out', 0)
            
            # Calculate POS totals
            pos_deposits = pos_summary.get('deposits', 0)
            pos_withdrawals = pos_summary.get('withdrawals', 0)
            pos_net = pos_deposits - pos_withdrawals
            
            # Get drinks category specifically (as mentioned in requirements)
            drinks_sales = 0
            for category in category_sales:
                if category.get('category_name', '').lower() == 'drinks':
                    drinks_sales = category.get('total_amount', 0)
                    break
            
            logger.info(f"Generated daily summary for {owner_id} on {target_date}")
            
            return {
                "success": True,
                "date": target_date.isoformat(),
                "summary": {
                    "cash_at_hand": float(cash_at_hand),
                    "cash_details": {
                        "cash_in": float(cash_summary.get('cash_in', 0)),
                        "cash_out": float(cash_summary.get('cash_out', 0)),
                        "net_cash": float(cash_at_hand)
                    },
                    "pos_summary": {
                        "total_deposits": float(pos_deposits),
                        "total_withdrawals": float(pos_withdrawals),
                        "net_pos": float(pos_net),
                        "pos_accounts": pos_summary.get('by_account', [])
                    },
                    "category_sales": category_sales,
                    "drinks_sales": float(drinks_sales),
                    "total_sales": float(sum(cat.get('total_amount', 0) for cat in category_sales)),
                    "payment_method_breakdown": payment_summary.get('by_method', [])
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate daily summary: {str(e)}")
            return {
                "success": False,
                "error": "Failed to generate daily summary",
                "date": target_date.isoformat() if target_date else None,
                "summary": {}
            }
    
    async def get_cash_flow_summary(self, owner_id: str, start_date: date, end_date: date) -> Dict:
        """Get cash flow summary for a date range"""
        try:
            cash_flow_data = []
            current_date = start_date
            
            while current_date <= end_date:
                daily_summary = await self.execute(owner_id, current_date)
                if daily_summary['success']:
                    cash_flow_data.append({
                        'date': current_date.isoformat(),
                        'cash_at_hand': daily_summary['summary']['cash_at_hand'],
                        'pos_net': daily_summary['summary']['pos_summary']['net_pos'],
                        'total_sales': daily_summary['summary']['total_sales']
                    })
                
                current_date = current_date.replace(day=current_date.day + 1)
            
            return {
                "success": True,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "cash_flow_data": cash_flow_data
            }
            
        except Exception as e:
            logger.error(f"Failed to generate cash flow summary: {str(e)}")
            return {
                "success": False,
                "error": "Failed to generate cash flow summary",
                "cash_flow_data": []
            }