-- RightTicker Database Schema
-- Compatible with SQLite (default for Hostinger) and MySQL / MariaDB

-- ============================================================
-- SQLite Schema (Recommended: Zero setup, runs via PDO SQLite)
-- ============================================================
CREATE TABLE IF NOT EXISTS watchlist (
    visitor_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (visitor_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_visitor ON watchlist (visitor_id, created_at ASC);

-- ============================================================
-- MySQL / MariaDB Schema (Optional: if MySQL database is preferred)
-- ============================================================
/*
CREATE TABLE IF NOT EXISTS `watchlist` (
    `visitor_id` VARCHAR(64) NOT NULL,
    `ticker` VARCHAR(32) NOT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`visitor_id`, `ticker`),
    INDEX `idx_visitor_created` (`visitor_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/
