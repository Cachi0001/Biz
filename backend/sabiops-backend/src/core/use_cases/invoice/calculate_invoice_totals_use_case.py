from typing import Dict, List
from decimal import Decimal

class CalculateInvoiceTotalsUseCase:
    
    def execute(self, items: List[Dict], tax_rate: float = 0, discount_amount: float = 0) -> Dict:
        subtotal = Decimal('0')
        
        for item in items:
            unit_price = Decimal(str(item['unit_price']))
            quantity = Decimal(str(item['quantity']))
            item_total = unit_price * quantity
            subtotal += item_total
        
        tax_amount = subtotal * Decimal(str(tax_rate / 100)) if tax_rate > 0 else Decimal('0')
        discount = Decimal(str(discount_amount))
        total_amount = subtotal + tax_amount - discount
        
        return {
            'subtotal': float(subtotal),
            'tax_amount': float(tax_amount),
            'discount_amount': float(discount),
            'total_amount': float(total_amount)
        }