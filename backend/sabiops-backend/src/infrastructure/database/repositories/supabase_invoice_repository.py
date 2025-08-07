import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from core.entities.invoice_entity import InvoiceEntity, InvoiceStatus
from core.interfaces.repositories.invoice_repository_interface import InvoiceRepositoryInterface
from shared.exceptions.business_exceptions import (
    ResourceNotFoundException, 
    DatabaseOperationException
)

logger = logging.getLogger(__name__)

class SupabaseInvoiceRepository(InvoiceRepositoryInterface):
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.table_name = "invoices"
    
    async def create_invoice(self, invoice: InvoiceEntity) -> InvoiceEntity:
        try:
            invoice_data = invoice.to_dict()
            invoice_data['created_at'] = invoice.created_at.isoformat()
            invoice_data['updated_at'] = invoice.updated_at.isoformat()
            
            result = self.supabase.table(self.table_name).insert(invoice_data).execute()
            
            if not result.data:
                raise DatabaseOperationException("Failed to create invoice")
            
            created_invoice_data = result.data[0]
            return InvoiceEntity.from_dict(created_invoice_data)
            
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            raise DatabaseOperationException(f"Failed to create invoice: {str(e)}")
    
    async def find_invoice_by_id(self, invoice_id: str) -> Optional[InvoiceEntity]:
        try:
            result = self.supabase.table(self.table_name).select("*").eq("id", invoice_id).execute()
            
            if not result.data:
                return None
            
            invoice_data = result.data[0]
            return InvoiceEntity.from_dict(invoice_data)
            
        except Exception as e:
            logger.error(f"Error finding invoice by ID {invoice_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find invoice: {str(e)}")
    
    async def find_invoices_by_owner(self, owner_id: str, limit: int = 50, offset: int = 0) -> List[InvoiceEntity]:
        try:
            result = (self.supabase.table(self.table_name)
                     .select("*")
                     .eq("owner_id", owner_id)
                     .order("created_at", desc=True)
                     .limit(limit)
                     .offset(offset)
                     .execute())
            
            invoices = []
            for invoice_data in result.data:
                invoices.append(InvoiceEntity.from_dict(invoice_data))
            
            return invoices
            
        except Exception as e:
            logger.error(f"Error finding invoices by owner {owner_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find invoices: {str(e)}")
    
    async def find_invoices_by_customer(self, customer_id: str, owner_id: str) -> List[InvoiceEntity]:
        try:
            result = (self.supabase.table(self.table_name)
                     .select("*")
                     .eq("customer_id", customer_id)
                     .eq("owner_id", owner_id)
                     .order("created_at", desc=True)
                     .execute())
            
            invoices = []
            for invoice_data in result.data:
                invoices.append(InvoiceEntity.from_dict(invoice_data))
            
            return invoices
            
        except Exception as e:
            logger.error(f"Error finding invoices by customer {customer_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to find invoices: {str(e)}")
    
    async def update_invoice(self, invoice_id: str, updates: dict) -> Optional[InvoiceEntity]:
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            result = self.supabase.table(self.table_name).update(updates).eq("id", invoice_id).execute()
            
            if not result.data:
                raise ResourceNotFoundException("Invoice", invoice_id)
            
            updated_invoice_data = result.data[0]
            return InvoiceEntity.from_dict(updated_invoice_data)
            
        except ResourceNotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating invoice {invoice_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to update invoice: {str(e)}")
    
    async def delete_invoice(self, invoice_id: str) -> bool:
        try:
            result = self.supabase.table(self.table_name).delete().eq("id", invoice_id).execute()
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error deleting invoice {invoice_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to delete invoice: {str(e)}")
    
    async def update_invoice_status(self, invoice_id: str, status: str) -> bool:
        try:
            updates = {
                'status': status,
                'updated_at': datetime.now().isoformat()
            }
            
            if status == InvoiceStatus.PAID.value:
                updates['paid_date'] = datetime.now().isoformat()
            
            result = self.supabase.table(self.table_name).update(updates).eq("id", invoice_id).execute()
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error updating invoice status {invoice_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to update invoice status: {str(e)}")
    
    async def get_invoice_statistics(self, owner_id: str) -> dict:
        try:
            result = self.supabase.table(self.table_name).select("status, total_amount").eq("owner_id", owner_id).execute()
            
            stats = {
                'total_invoices': 0,
                'total_amount': Decimal('0'),
                'paid_amount': Decimal('0'),
                'pending_amount': Decimal('0'),
                'overdue_amount': Decimal('0'),
                'draft_count': 0,
                'sent_count': 0,
                'paid_count': 0,
                'overdue_count': 0
            }
            
            for invoice_data in result.data:
                status = invoice_data['status']
                amount = Decimal(str(invoice_data['total_amount']))
                
                stats['total_invoices'] += 1
                stats['total_amount'] += amount
                
                if status == InvoiceStatus.PAID.value:
                    stats['paid_amount'] += amount
                    stats['paid_count'] += 1
                elif status == InvoiceStatus.OVERDUE.value:
                    stats['overdue_amount'] += amount
                    stats['overdue_count'] += 1
                elif status == InvoiceStatus.SENT.value:
                    stats['pending_amount'] += amount
                    stats['sent_count'] += 1
                elif status == InvoiceStatus.DRAFT.value:
                    stats['draft_count'] += 1
            
            return {
                'total_invoices': stats['total_invoices'],
                'total_amount': float(stats['total_amount']),
                'paid_amount': float(stats['paid_amount']),
                'pending_amount': float(stats['pending_amount']),
                'overdue_amount': float(stats['overdue_amount']),
                'draft_count': stats['draft_count'],
                'sent_count': stats['sent_count'],
                'paid_count': stats['paid_count'],
                'overdue_count': stats['overdue_count']
            }
            
        except Exception as e:
            logger.error(f"Error getting invoice statistics for owner {owner_id}: {str(e)}")
            raise DatabaseOperationException(f"Failed to get invoice statistics: {str(e)}")