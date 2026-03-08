-- database/supabase_schema.sql
-- Run this script in your Supabase SQL Editor to set up the database tables and Auth triggers.

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100)
);

-- 2. Create assets table
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
    assigned_to VARCHAR(100),
    assigned_to_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- 3. Create asset_history table
CREATE TABLE IF NOT EXISTS asset_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    action_type VARCHAR(50), 
    from_user VARCHAR(100),
    to_user VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    from_user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    to_user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL
);

-- 4. Create repair_logs table
CREATE TABLE IF NOT EXISTS repair_logs (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    fault_description TEXT,
    repair_details TEXT,
    repair_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    action TEXT,
    status VARCHAR(50) CHECK (status IN ('solved', 'not solved', 'broken', 'need to service')),
    vendor VARCHAR(100)
);

-- 5. Create users profile table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user'
);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
DROP POLICY IF EXISTS "Allow authenticated read access" ON employees;
CREATE POLICY "Allow authenticated read access" ON employees FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON assets;
CREATE POLICY "Allow authenticated read access" ON assets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON asset_history;
CREATE POLICY "Allow authenticated read access" ON asset_history FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON repair_logs;
CREATE POLICY "Allow authenticated read access" ON repair_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.users;
CREATE POLICY "Allow authenticated read access" ON public.users FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert
DROP POLICY IF EXISTS "Allow authenticated insert" ON employees;
CREATE POLICY "Allow authenticated insert" ON employees FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON assets;
CREATE POLICY "Allow authenticated insert" ON assets FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON asset_history;
CREATE POLICY "Allow authenticated insert" ON asset_history FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON repair_logs;
CREATE POLICY "Allow authenticated insert" ON repair_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated update" ON employees;
CREATE POLICY "Allow authenticated update" ON employees FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON assets;
CREATE POLICY "Allow authenticated update" ON assets FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON asset_history;
CREATE POLICY "Allow authenticated update" ON asset_history FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON repair_logs;
CREATE POLICY "Allow authenticated update" ON repair_logs FOR UPDATE TO authenticated USING (true);

-- Trigger to auto-create public.users profile when a new auth user is created in Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, department, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'), 
    new.raw_user_meta_data->>'department',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a View for Assets History to join with Assets table easily (useful for frontend fetching)
CREATE OR REPLACE VIEW asset_history_view AS
SELECT h.*, a.name as asset_name, a.serial_number 
FROM asset_history h 
JOIN assets a ON h.asset_id = a.id;

-- Create a View for Repair Logs to join with Assets easily
CREATE OR REPLACE VIEW repair_logs_view AS
SELECT r.*, a.name as asset_name, a.serial_number 
FROM repair_logs r 
JOIN assets a ON r.asset_id = a.id;

-- 6. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to_id ON assets(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_from_user_id ON asset_history(from_user_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_to_user_id ON asset_history(to_user_id);
CREATE INDEX IF NOT EXISTS idx_repair_logs_asset_id ON repair_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_repair_logs_status ON repair_logs(status);
