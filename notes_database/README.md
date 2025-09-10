# notes_database

SQLite database for the personal notes application. Provides schema and connection logic to support:
- User management (signup, login, profile)
- Note CRUD operations (create, read, update, delete)

This database is designed to be embedded and simple to operate for local development and small deployments.

## Overview

- DB Engine: SQLite3 (file-based)
- Default DB file: `data/notes.db` (configurable via env)
- Migrations: Simple bootstrap migration creates required tables if they don't exist
- Connection: A small wrapper around `sqlite3` to provide safe, serialized access and lifecycle management

## Environment Variables

Create a `.env` file in the backend root (`personal-notes-manager-19476-19485/notes_backend`) or set env vars in your environment. The backend will load these via `dotenv` if used.

Required/Optional variables:
- SQLITE_DB_PATH: Path to the SQLite database file. Default: `../notes_database/data/notes.db` (resolved relative to backend)
- NODE_ENV: standard node env (optional)

You can copy `.env.example` from this folder to the backend folder and adjust paths as needed.

## Schema

Tables:
- users
  - id (INTEGER PRIMARY KEY AUTOINCREMENT)
  - email (TEXT UNIQUE NOT NULL)
  - password_hash (TEXT NOT NULL)
  - name (TEXT)
  - created_at (TEXT ISO8601)
  - updated_at (TEXT ISO8601)

- notes
  - id (INTEGER PRIMARY KEY AUTOINCREMENT)
  - user_id (INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE)
  - title (TEXT NOT NULL)
  - content (TEXT NOT NULL)
  - created_at (TEXT ISO8601)
  - updated_at (TEXT ISO8601)

Indices:
- idx_users_email on users(email)
- idx_notes_user_id on notes(user_id)
- idx_notes_user_id_updated_at on notes(user_id, updated_at)

## Usage in Backend

1. Ensure the DB path is configured (via env or default).
2. Import the connection module from `notes_database/src/db.js` in your backend code:
   ```js
   const { db, init } = require('../notes_database/src/db');
   await init(); // creates tables if not present
   // then use `db` for queries
   ```

3. Example query:
   ```js
   const getUserByEmail = (email) => new Promise((resolve, reject) => {
     db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
       if (err) return reject(err);
       resolve(row || null);
     });
   });
   ```

## Running Migration Manually

You can run the bootstrap init (idempotent):
```bash
node personal-notes-manager-19476-19485/notes_database/src/migrate.js
```

This will create the database folder if needed and ensure the schema exists.

## Notes

- SQLite supports foreign keys only when PRAGMA foreign_keys=ON is set; our connection ensures this.
- Timestamps are stored in ISO8601 text for simplicity and easy sorting.

