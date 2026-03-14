-- Add part_of_id column to assets table for asset hierarchy
ALTER TABLE assets ADD COLUMN IF NOT EXISTS part_of_id INTEGER REFERENCES assets(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_assets_part_of_id ON assets(part_of_id);
