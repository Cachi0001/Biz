from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

class NotificationType(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"

class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

@dataclass
class NotificationEntity:
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority
    created_at: datetime
    is_read: bool = False
    read_at: Optional[datetime] = None
    data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    
    def mark_as_read(self) -> None:
        self.is_read = True
        self.read_at = datetime.now()
    
    def mark_as_unread(self) -> None:
        self.is_read = False
        self.read_at = None
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type.value,
            'priority': self.priority.value,
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'data': self.data,
            'action_url': self.action_url
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'NotificationEntity':
        return cls(
            id=data['id'],
            user_id=data['user_id'],
            title=data['title'],
            message=data['message'],
            type=NotificationType(data['type']),
            priority=NotificationPriority(data['priority']),
            created_at=datetime.fromisoformat(data['created_at']),
            is_read=data.get('is_read', False),
            read_at=datetime.fromisoformat(data['read_at']) if data.get('read_at') else None,
            data=data.get('data'),
            action_url=data.get('action_url')
        )