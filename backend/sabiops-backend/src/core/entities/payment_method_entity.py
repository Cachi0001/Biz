from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum

class PaymentMethodType(Enum):
    CASH = "Cash"
    DIGITAL = "Digital"
    CREDIT = "Credit"

@dataclass
class PaymentMethodEntity:
    id: str
    name: str
    type: PaymentMethodType
    is_pos: bool
    requires_reference: bool
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    def is_cash_method(self) -> bool:
        return self.type == PaymentMethodType.CASH
    
    def is_digital_method(self) -> bool:
        return self.type == PaymentMethodType.DIGITAL
    
    def is_credit_method(self) -> bool:
        return self.type == PaymentMethodType.CREDIT
    
    def requires_pos_details(self) -> bool:
        return self.is_pos
    
    def get_display_name(self) -> str:
        if self.is_pos:
            return f"{self.name} (Requires: Account Name, Reference)"
        elif self.requires_reference:
            return f"{self.name} (Requires: Reference)"
        return self.name
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type.value,
            'is_pos': self.is_pos,
            'requires_reference': self.requires_reference,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'display_name': self.get_display_name()
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'PaymentMethodEntity':
        return cls(
            id=data['id'],
            name=data['name'],
            type=PaymentMethodType(data['type']),
            is_pos=data['is_pos'],
            requires_reference=data['requires_reference'],
            description=data.get('description'),
            is_active=data['is_active'],
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at'])
        )