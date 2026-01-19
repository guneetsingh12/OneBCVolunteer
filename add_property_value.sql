-- Add property_value column to volunteers table
ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS property_value TEXT;

-- Add comment to document the column
COMMENT ON COLUMN volunteers.property_value IS 'Extracted property value from BC Assessment (e.g., $1,128,000)';
