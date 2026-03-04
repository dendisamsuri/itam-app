-- database/init.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    specs TEXT,
    photo_url TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(50) DEFAULT 'Ready',
    assigned_to VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS asset_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    action_type VARCHAR(50), 
    from_user VARCHAR(100),
    to_user VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repair_logs (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    fault_description TEXT,
    repair_details TEXT,
    repair_date DATE DEFAULT CURRENT_TIMESTAMP,
    completion_date DATE,
    action TEXT,
    status VARCHAR(50) CHECK (status IN ('solved', 'not solved', 'broken', 'need to service')),
    vendor VARCHAR(100)
);

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

-- Migration 002: Add role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
