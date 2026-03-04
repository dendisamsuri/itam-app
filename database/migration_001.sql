-- Migration 001: Add employees table and link to assets/history

-- Create the new employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Add foreign key columns to assets and asset_history
-- We will keep the old VARCHAR columns for now to avoid data loss
-- and handle the logic transition in the application layer.

ALTER TABLE assets
ADD COLUMN assigned_to_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE asset_history
ADD COLUMN from_user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN to_user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;
