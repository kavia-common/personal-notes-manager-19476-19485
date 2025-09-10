'use strict';

/**
 * Database connection and initialization for the notes application.
 * Uses SQLite3 with a file-backed database.
 *
 * Public API:
 *   - init(): Initialize database, ensure schema exists.
 *   - db: The sqlite3.Database instance (serialized).
 */

// PUBLIC_INTERFACE
/**
 * Initialize the SQLite database and ensure required schema exists.
 * This function is idempotent; it can be called multiple times safely.
 *
 * @returns {Promise<void>} Resolves when initialization is complete.
 */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DEFAULT_DB_RELATIVE = path.join('..', 'notes_database', 'data', 'notes.db');

// Resolve DB path
const DB_PATH = process.env.SQLITE_DB_PATH
  ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH)
  : path.resolve(__dirname, '..', 'data', 'notes.db'); // default relative to this module

// Ensure data directory exists
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create connection (serialized for safety)
const db = new sqlite3.Database(DB_PATH);

// Enable foreign keys, WAL mode for better concurrency
function configurePragmas() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON;');
      db.run('PRAGMA journal_mode = WAL;');
      db.run('PRAGMA synchronous = NORMAL;', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

function runMigrations() {
  return new Promise((resolve, reject) => {
    const queries = [
      // users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`,

      // notes table
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_user_id_updated_at ON notes (user_id, updated_at);`,

      // trigger to update updated_at for users
      `CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
       AFTER UPDATE ON users
       FOR EACH ROW
       BEGIN
         UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
       END;`,

      // trigger to update updated_at for notes
      `CREATE TRIGGER IF NOT EXISTS trg_notes_updated_at
       AFTER UPDATE ON notes
       FOR EACH ROW
       BEGIN
         UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id;
       END;`,
    ];

    db.serialize(() => {
      for (const q of queries) {
        db.run(q, (err) => {
          if (err) {
            reject(err);
          }
        });
      }
      resolve();
    });
  });
}

// PUBLIC_INTERFACE
async function init() {
  /**
   * Initialize the database connection, set PRAGMAs, and ensure schema exists.
   */
  await configurePragmas();
  await runMigrations();
}

module.exports = {
  db,
  init,
  DB_PATH,
};
