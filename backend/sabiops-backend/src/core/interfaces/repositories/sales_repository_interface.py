from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from datetime import datetime
from core.entities.sale_entity import SaleEntity
from shared.exceptions.business_exceptions import ResourceNotFoundException, ValidationException, DatabaseOperationException

class SalesRepositoryInterface(ABC):
    """Abstract interface for sales repository operations following clean architecture principles"""
    
    @abstractmethod
    async def create_sale(self, sale: SaleEntity) -> SaleEntity:
        """
        Create a new sale record
        
        Args:
            sale: SaleEntity containing sale information
            
        Returns:
            SaleEntity: The created sale record
            
        Raises:
            ValidationException: If sale data is invalid
            DatabaseOperationException: If database operation fails
        """
        pass
    
    @abstractmethod
    async def find_sale_by_id(self, sale_id: str, owner_id: str) -> Optional[SaleEntity]:
        """
        Find a sale by its ID and owner
        
        Args:
            sale_id: UUID of the sale
            owner_id: UUID of the owner
            
        Returns:
            SaleEntity: The found sale record or None if not found
            
        Raises:
            ValidationException: If sale_id or owner_id format is invalid
            DatabaseOperationException: If database operation fails
        """
        pass
    
    @abstractmethod
    async def find_sales_by_owner(self, owner_id: str, filters: Optional[Dict] = None) -> List[SaleEntity]:
        """
        Find all sales for a specific owner with optional filters
        
        Args:
            owner_id: UUID of the owner
            filters: Optional dictionary with filter criteria
                    (start_date, end_date, customer_id, product_id, payment_status)
            
        Returns:
            List[SaleEntity]: List of sale records
            
        Raises:
            ValidationException: If owner_id format is invalid
            DatabaseOperationException: If database operation fails
        """
        pass
    
    @abstractmethod
    async def update_sale(self, sale_id: str, updates: Dict, owner_id: str) -> Optional[SaleEntity]:
        """
        Update a sale record
        
        Args:
            sale_id: UUID of the sale to update
            updates: Dictionary containing fields to update
            owner_id: UUID of the owner
            
        Returns:
            SaleEntity: The updated sale record or None if not found
            
        Raises:
            ValidationException: If sale_id or owner_id format is invalid
            ResourceNotFoundException: If sale is not found
            DatabaseOperationException: If database operation fails
        """
        pass
    
    @abstractmethod
    async def delete_sale(self, sale_id: str, owner_id: str) -> bool:
        """
        Delete a sale record
        
        Args:
            sale_id: UUID of the sale to delete
            owner_id: UUID of the owner
            
        Returns:
            bool: True if sale was deleted, False otherwise
            
        Raises:
            ValidationException: If sale_id or owner_id format is invalid
            ResourceNotFoundException: If sale is not found
            DatabaseOperationException: If database operation fails
        """
        pass
    
    @abstractmethod
    async def get_sales_statistics(self, owner_id: str, start_date: Optional[datetime] = None, 
                                  end_date: Optional[datetime] = None) -> Dict:
        """
        Get sales statistics for an owner within a date range
        
        Args:
            owner_id: UUID of the owner
            start_date: Start date for statistics (optional)
            end_date: End date for statistics (optional)
            
        Returns:
            Dict: Dictionary containing sales statistics
            
        Raises:
            ValidationException: If owner_id format is invalid
            DatabaseOperationException: If database operation fails
        """
        pass
    
    @abstractmethod
    async def update_payment_status(self, sale_id: str, payment_status: str, 
                                  amount_paid: float, owner_id: str) -> Optional[SaleEntity]:
        """
        Update sale payment status and amount tracking
        
        Args:
            sale_id: UUID of the sale to update
            payment_status: New payment status
            amount_paid: Amount paid toward the sale
            owner_id: UUID of the owner
            
        Returns:
            SaleEntity: The updated sale record or None if not found
            
        Raises:
            ValidationException: If sale_id or owner_id format is invalid or payment data is invalid
            ResourceNotFoundException: If sale is not found
            DatabaseOperationException: If database operation fails
        """
        pass
    
    @abstractmethod
    async def get_credit_sales(self, owner_id: str) -> List[SaleEntity]:
        """
        Get all credit sales for an owner
        
        Args:
            owner_id: UUID of the owner
            
        Returns:
            List[SaleEntity]: List of credit sale records
            
        Raises:
            ValidationException: If owner_id format is invalid
            DatabaseOperationException: If database operation fails
        """
        pass