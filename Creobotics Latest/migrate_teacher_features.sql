-- migrate_teacher_features.sql
--
-- Fixes: "Unknown column 'is_teacher' in 'field list'"
--
-- Your database already existed before the teacher/leaderboard feature was
-- added, so the old schema.sql's "CREATE TABLE IF NOT EXISTS users" did
-- nothing — it only creates a table if it's missing, it never adds new
-- columns to a table that's already there. This script fixes that properly
-- with ALTER TABLE, and is safe to run on your real database: it does NOT
-- drop or touch any existing accounts/rows.
--
-- HOW TO RUN THIS:
--   mysql -u webuser -p creobotics_db < migrate_teacher_features.sql
--   (enter your DB_PASSWORD from .env when prompted)

USE creobotics_db;

-- ---- users: add the teacher/class-linking columns if missing ----
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_teacher    TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS class_code    VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS teacher_email VARCHAR(190) NULL;

-- class_code needs to be unique (each teacher's code is one-of-a-kind).
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS class_code (class_code);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_teacher_email (teacher_email);

-- ---- teacher_codes: brand new table, admin-generated codes that let an
-- account become a teacher ----
CREATE TABLE IF NOT EXISTS teacher_codes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(20) NOT NULL UNIQUE,
  used_by     INT DEFAULT NULL,
  used_at     DATETIME DEFAULT NULL,
  created_by  INT DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---- access: premium-access windows (only created here if you somehow
-- don't have it yet — most setups already do) ----
CREATE TABLE IF NOT EXISTS access (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL UNIQUE,
  serial_key    VARCHAR(20) NOT NULL,
  activated_at  DATETIME NOT NULL,
  expires_at    DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Confirms it worked — you should see is_teacher / class_code / teacher_email listed.
DESCRIBE users;