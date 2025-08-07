from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class ProductCategoryEntity:
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    def is_drinks_category(self) -> bool:
        """Check if this is the drinks category"""
        return self.name.lower() == 'drinks'
    
    def is_food_category(self) -> bool:
        """Check if this is a food-related category"""
        food_categories = ['food & groceries', 'bread & bakery', 'dairy & frozen foods', 
                          'fresh produce', 'meat, poultry & seafood']
        return self.name.lower() in food_categories
    
    def is_personal_care_category(self) -> bool:
        """Check if this is personal care category"""
        return self.name.lower() == 'personal care'
    
    def get_category_type(self) -> str:
        """Get the general type of this category"""
        if self.is_drinks_category():
            return "Beverages"
        elif self.is_food_category():
            return "Food & Groceries"
        elif self.is_personal_care_category():
            return "Personal Care"
        elif self.name.lower() in ['household items', 'baby products']:
            return "Household"
        elif self.name.lower() == 'health & wellness':
            return "Health"
        else:
            return "Other"
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'category_type': self.get_category_type(),
            'is_drinks': self.is_drinks_category(),
            'is_food': self.is_food_category()
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'ProductCategoryEntity':
        return cls(
            id=data['id'],
            name=data['name'],
            description=data.get('description'),
            is_active=data['is_active'],
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at'])
        )