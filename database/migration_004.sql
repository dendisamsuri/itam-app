-- database/migration_004.sql
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (key, value) VALUES ('it_user_id', NULL) ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('ga_user_id', NULL) ON CONFLICT (key) DO NOTHING;
