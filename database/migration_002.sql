-- Migration 002: Add email and department to employees table
ALTER TABLE employees
ADD COLUMN email VARCHAR(100) UNIQUE,
ADD COLUMN department VARCHAR(100);
