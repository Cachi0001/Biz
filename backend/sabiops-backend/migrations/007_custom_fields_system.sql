-- Custom Fields System Migration
-- This migration creates tables for managing custom fields for customers, products, and invoices

-- Create custom_field_definitions table
CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('customer', 'product', 'invoice')),
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'checkbox', 'textarea', 'email', 'phone')),
    field_options JSONB DEFAULT NULL, -- For dropdown options: {"options": ["Option 1", "Option 2"]}
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    validation_rules JSONB DEFAULT NULL, -- For validation: {"min_length": 5, "max_length": 100, "pattern": "regex"}
    default_value TEXT DEFAULT NULL,
    help_text TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique field names per entity type per owner
    UNIQUE(owner_id, entity_type, field_name)
);

-- Create custom_field_values table
CREATE TABLE IF NOT EXISTS custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- References customers.id, products.id, or invoices.id
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('customer', 'product', 'invoice')),
    field_value TEXT, -- Store all values as text, convert as needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one value per field per entity
    UNIQUE(field_definition_id, entity_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_owner_entity ON custom_field_definitions(owner_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_active ON custom_field_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field_def ON custom_field_values(field_definition_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_custom_field_definitions_updated_at 
    BEFORE UPDATE ON custom_field_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at 
    BEFORE UPDATE ON custom_field_values 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default custom fields for demonstration
INSERT INTO custom_field_definitions (owner_id, entity_type, field_name, field_label, field_type, is_required, display_order, help_text)
VALUES 
    -- Customer fields
    ('00000000-0000-0000-0000-000000000000', 'customer', 'tax_id', 'Tax ID Number', 'text', false, 1, 'Customer tax identification number'),
    ('00000000-0000-0000-0000-000000000000', 'customer', 'credit_limit', 'Credit Limit', 'number', false, 2, 'Maximum credit amount allowed'),
    ('00000000-0000-0000-0000-000000000000', 'customer', 'customer_type', 'Customer Type', 'dropdown', false, 3, 'Type of customer relationship'),
    
    -- Product fields
    ('00000000-0000-0000-0000-000000000000', 'product', 'warranty_period', 'Warranty Period (months)', 'number', false, 1, 'Product warranty duration in months'),
    ('00000000-0000-0000-0000-000000000000', 'product', 'supplier_name', 'Supplier Name', 'text', false, 2, 'Primary supplier for this product'),
    ('00000000-0000-0000-0000-000000000000', 'product', 'is_fragile', 'Fragile Item', 'checkbox', false, 3, 'Check if item requires special handling'),
    
    -- Invoice fields
    ('00000000-0000-0000-0000-000000000000', 'invoice', 'project_name', 'Project Name', 'text', false, 1, 'Associated project or job name'),
    ('00000000-0000-0000-0000-000000000000', 'invoice', 'delivery_date', 'Expected Delivery Date', 'date', false, 2, 'When goods/services will be delivered'),
    ('00000000-0000-0000-0000-000000000000', 'invoice', 'priority_level', 'Priority Level', 'dropdown', false, 3, 'Invoice processing priority')
ON CONFLICT (owner_id, entity_type, field_name) DO NOTHING;

-- Insert dropdown options for the demo fields
UPDATE custom_field_definitions 
SET field_options = '{"options": ["Retail", "Wholesale", "Corporate", "Government"]}'
WHERE field_name = 'customer_type' AND entity_type = 'customer';

UPDATE custom_field_definitions 
SET field_options = '{"options": ["Low", "Medium", "High", "Urgent"]}'
WHERE field_name = 'priority_level' AND entity_type = 'invoice';

-- Add validation rules for some fields
UPDATE custom_field_definitions 
SET validation_rules = '{"min": 0, "max": 999999}'
WHERE field_name = 'credit_limit' AND entity_type = 'customer';

UPDATE custom_field_definitions 
SET validation_rules = '{"min": 1, "max": 120}'
WHERE field_name = 'warranty_period' AND entity_type = 'product';

COMMENT ON TABLE custom_field_definitions IS 'Defines custom fields that users can create for customers, products, and invoices';
COMMENT ON TABLE custom_field_values IS 'Stores the actual values for custom fields for each entity instance';