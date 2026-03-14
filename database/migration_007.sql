-- migration_007.sql: Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    menu_key VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    UNIQUE(role_name, menu_key)
);
