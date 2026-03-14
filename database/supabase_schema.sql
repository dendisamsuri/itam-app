-- database/supabase_schema.sql
-- Run this script in your Supabase SQL Editor to set up the database tables and Auth triggers.

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100) UNIQUE
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
    updated_by VARCHAR(100),
    part_of_id INTEGER REFERENCES assets(id) ON DELETE SET NULL
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
  role VARCHAR(50) DEFAULT 'user',
  email VARCHAR(100),
  deleted_at TIMESTAMP DEFAULT NULL
);

-- 6. Create settings table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT timezone('utc'::text, now())
);
INSERT INTO settings (key, value) VALUES ('it_user_id', NULL) ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('ga_user_id', NULL) ON CONFLICT (key) DO NOTHING;

-- 7. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    menu_key VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    UNIQUE(role_name, menu_key)
);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Allow authenticated read access" ON settings;
CREATE POLICY "Allow authenticated read access" ON settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated read access" ON role_permissions;
CREATE POLICY "Allow authenticated read access" ON role_permissions FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert
DROP POLICY IF EXISTS "Allow authenticated insert" ON employees;
CREATE POLICY "Allow authenticated insert" ON employees FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON assets;
CREATE POLICY "Allow authenticated insert" ON assets FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON asset_history;
CREATE POLICY "Allow authenticated insert" ON asset_history FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON repair_logs;
CREATE POLICY "Allow authenticated insert" ON repair_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON settings;
CREATE POLICY "Allow authenticated insert" ON settings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON role_permissions;
CREATE POLICY "Allow authenticated insert" ON role_permissions FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated update" ON employees;
CREATE POLICY "Allow authenticated update" ON employees FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON assets;
CREATE POLICY "Allow authenticated update" ON assets FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON asset_history;
CREATE POLICY "Allow authenticated update" ON asset_history FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON repair_logs;
CREATE POLICY "Allow authenticated update" ON repair_logs FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON settings;
CREATE POLICY "Allow authenticated update" ON settings FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON role_permissions;
CREATE POLICY "Allow authenticated update" ON role_permissions FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON public.users;
CREATE POLICY "Allow authenticated update" ON public.users FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.users;
CREATE POLICY "Allow authenticated insert" ON public.users FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger to auto-create public.users profile when a new auth user is created in Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile into public.users
  INSERT INTO public.users (id, name, department, role, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'), 
    new.raw_user_meta_data->>'department',
    COALESCE(new.raw_user_meta_data->>'role', 'superadmin'),
    new.email
  );

  -- Sync role to auth.users metadata (important for Supabase JWT)
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', COALESCE(new.raw_user_meta_data->>'role', 'superadmin'))
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed role_permissions table with default data (All roles get full access)
INSERT INTO role_permissions (role_name, menu_key, can_view, can_write) VALUES
-- Superadmin
('superadmin', 'user_list', true, true),
('superadmin', 'employee_list', true, true),
('superadmin', 'asset_list', true, true),
('superadmin', 'add_asset', true, true),
('superadmin', 'asset_history', true, true),
('superadmin', 'repair_history', true, true),
('superadmin', 'settings', true, true),
('superadmin', 'add_user', true, true),

-- Admin
('admin', 'user_list', true, true),
('admin', 'employee_list', true, true),
('admin', 'asset_list', true, true),
('admin', 'add_asset', true, true),
('admin', 'asset_history', true, true),
('admin', 'repair_history', true, true),
('admin', 'settings', true, true),
('admin', 'add_user', true, true),

-- User
('user', 'user_list', true, true),
('user', 'employee_list', true, true),
('user', 'asset_list', true, true),
('user', 'add_asset', true, true),
('user', 'asset_history', true, true),
('user', 'repair_history', true, true),
('user', 'settings', true, true),
('user', 'add_user', true, true)
ON CONFLICT (role_name, menu_key) DO UPDATE 
SET can_view = EXCLUDED.can_view, can_write = EXCLUDED.can_write;

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
CREATE INDEX IF NOT EXISTS idx_assets_part_of_id ON assets(part_of_id);
