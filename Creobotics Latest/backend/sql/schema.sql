-- ============================================================
-- Creobotics Database Schema (MySQL 8.0 Compatible)
-- Fixed: JSON columns cannot have default values in MySQL 8.0
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS creobotics;
USE creobotics;

-- ============================================================
-- USERS TABLE
-- Stores all user account information
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    school VARCHAR(255),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    avatar_id VARCHAR(50),
    nickname VARCHAR(50),
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- PROGRESS TABLE
-- Tracks quiz attempts, scores, and completion status
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    module_id INT NOT NULL,
    best_score INT DEFAULT 0,
    attempts INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    history JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_module (user_id, module_id)
);

-- ============================================================
-- STREAKS TABLE
-- Tracks daily activity streaks
-- ============================================================
CREATE TABLE IF NOT EXISTS streaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    dates JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- MODULES TABLE
-- Stores lesson content (synchronized with frontend data.js)
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
    id INT PRIMARY KEY,
    grade INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    color VARCHAR(20),
    content JSON,
    quiz JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SERIAL KEYS TABLE
-- For generating and tracking access keys
-- ============================================================
CREATE TABLE IF NOT EXISTS serial_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    grade INT NOT NULL DEFAULT 4,
    used_by INT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- ACCESS GRANTS TABLE
-- Tracks which grades each user has access to
-- ============================================================
CREATE TABLE IF NOT EXISTS access_grants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    grade INT NOT NULL,
    serial_key VARCHAR(50),
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_grade (user_id, grade)
);

-- ============================================================
-- SESSIONS TABLE
-- For session management (optional, for additional security)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_serial_keys_code ON serial_keys(code);
CREATE INDEX idx_access_grants_user_id ON access_grants(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

-- ============================================================
-- END OF SCHEMA
-- ============================================================