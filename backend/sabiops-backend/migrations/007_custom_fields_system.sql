-- Custom Fields System Migration
-- This migration creates tables for managing custom fields for customers, products, and invoices

-- Create custom_field_definitions table
CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    entity_type VA