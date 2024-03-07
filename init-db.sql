-- init-db.sql

-- Creates a table with data types that could be optimized
CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    salary VARCHAR(255) -- numeric data stored as text
);

-- Inserts sample data into the employee table
INSERT INTO employee (name, email, salary) VALUES
('John Doe', 'john@example.com', '50000'),
('Jane Doe', 'jane@example.com', '60000');

-- Creates an unused index
CREATE INDEX idx_name ON employee(name);

-- Creates a table with a potential for enum conversion
CREATE TABLE order_status (
    status TEXT
);

-- Inserts a limited set of distinct values
INSERT INTO order_status (status) VALUES
('pending'),
('completed'),
('pending'),
('completed'),
('canceled');

-- Creates a new table to test Temporal Data Type Appropriateness Analysis
CREATE TABLE event_log (
    event_id SERIAL PRIMARY KEY,
    event_name TEXT,
    event_date DATE,
    event_time TIME WITHOUT TIME ZONE, -- Will trigger the analysis suggestion
    start_timestamp TIMESTAMP WITHOUT TIME ZONE, -- Will trigger the analysis suggestion
    end_timestamp TIMESTAMP WITH TIME ZONE -- Should not trigger the analysis suggestion
);

-- Inserts sample data into the event_log table
INSERT INTO event_log (event_name, event_date, event_time, start_timestamp, end_timestamp) VALUES
('System Update', '2022-01-01', '15:00:00', '2022-01-01 15:00:00', '2022-01-01 15:00:00+00'),
('Maintenance Window', '2022-02-15', '03:00:00', '2022-02-15 03:00:00', '2022-02-15 03:00:00+00');

CREATE TABLE financial_records (
    id SERIAL PRIMARY KEY,
    transaction_amount NUMERIC(10, 2), -- Example precision and scale
    balance NUMERIC(14, 4) -- Higher precision and scale
);

-- Inserts sample data into the financial_records table
INSERT INTO financial_records (transaction_amount, balance) VALUES
(12345.67, 123456.7890), -- Within defined precision and scale
(12.34, 1234.5678), -- Below defined precision and scale
(0.01, 0.0001); -- Well below defined precision and scale

-- Create a new table for testing unused or rarely used columns analysis
CREATE TABLE project_activity (
    id SERIAL PRIMARY KEY,
    project_id INT,
    last_activity_date TIMESTAMP,
    status TEXT DEFAULT 'inactive',
    notes TEXT
);

-- Insert sample data into the project_activity table
-- Notice that 'last_activity_date' will be mostly NULL and 'status' will often have the default value
INSERT INTO project_activity (project_id, notes) VALUES
(1, 'Initial project setup.'),
(2, NULL),
(3, 'Requirements gathering phase complete.'),
(4, NULL),
(5, NULL);

-- Add a few more rows to increase the proportion of default 'status' values
INSERT INTO project_activity (project_id, status) VALUES
(6, 'inactive'),
(7, 'inactive'),
(8, 'inactive'),
(9, 'inactive'),
(10, 'inactive');

-- Create the department table
CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

-- Inserts sample data into the department table
INSERT INTO department (name) VALUES
('Engineering'),
('Human Resources'),
('Marketing');
