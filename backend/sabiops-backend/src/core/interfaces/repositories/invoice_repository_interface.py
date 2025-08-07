from abc import ABC, abstractmethod
from typing import Optional, List
from core.entities.invoice_entity import InvoiceEntity

class InvoiceRepositoryInterface(ABC):
    
    @abstractmethod
    async def create_invoice(self, invoice: InvoiceEntity) -> InvoiceEntity:
        pass
    
    @abstractmethod
    async def find_invoice_by_id(self, invoice_id: str) -> Optional[InvoiceEntity]:
        pass
    
    @abstractmethod
    async def find_invoices_by_owner(self, owner_id: str, limit: int = 50, offset: int = 0) -> List[InvoiceEntity]:
        pass
    
    @abstractmethod
    async def find_invoices_by_customer(self, customer_id: str, owner_id: str) -> List[InvoiceEntity]:
        pass
    
    @abstractmethod
    async def update_invoice(self, invoice_id: str, updates: dict) -> Optional[InvoiceEntity]:
        pass
    
    @abstractmethod
    async def delete_invoice(self, invoice_id: str) -> bool:
        pass
    
    @abstractmethod
    async def update_invoice_status(self, invoice_id: str, status: str) -> bool:
        pass
    
    @abstractmethod
    async def get_invoice_statistics(self, owner_id: str) -> dict:
        pass