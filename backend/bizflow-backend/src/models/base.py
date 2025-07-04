"""
Base model utilities for hybrid SQLite/PostgreSQL support
"""
import os
import uuid
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy import String as SQLString

# Shared database instance - THIS FIXES THE TABLE REDEFINITION ERROR
db = SQLAlchemy()

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            else:
                return value

def get_id_column():
    """Get appropriate ID column based on environment"""
    if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_URL") != "your_supabase_project_url_here":
        # Use UUID for Supabase
        return Column(GUID(), primary_key=True, default=uuid.uuid4)
    else:
        # Use Integer for SQLite
        return Column(Integer, primary_key=True)

def get_foreign_key_column(table_name, column_name="id"):
    """Get appropriate foreign key column based on environment"""
    if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_URL") != "your_supabase_project_url_here":
        # Use UUID for Supabase
        return Column(GUID(), nullable=True)
    else:
        # Use Integer for SQLite
        return Column(Integer, nullable=True)