from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum
from decimal import Decimal

class CustomerStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

@dataclass
class CustomerEntity:
    id: str
    owner_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    status: CustomerStatus
    created_at: datetime
    updated_at: datetime
    notes: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'notes': self.notes
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'CustomerEntity':
        return cls(
            id=data['id'],
            owner_id=data['owner_id'],
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            status=CustomerStatus(data.get('status', CustomerStatus.ACTIVE.value)),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            notes=data.get('notes')
        )