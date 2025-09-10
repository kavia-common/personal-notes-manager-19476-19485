# Integration Guide: notes_backend + notes_database

This guide shows how to integrate the SQLite database into the Express backend.

## 1. Install Dependencies (if not already installed)

From the backend root `personal-notes-manager-19476-19485/notes_backend`:
- The database module has its own package.json under `notes_database`. If your CI installs from the workspace root, ensure it runs `npm install` in this subfolder OR add `sqlite3` to the backend's dependencies.

Recommended: add sqlite3 to backend `package.json` if your environment doesn't install nested modules automatically.

```
npm install --prefix ../notes_database
```

or in backend:
```
npm install sqlite3 dotenv
```

## 2. Configure Environment

Create `.env` in `notes_backend` (if not present), add:
```
SQLITE_DB_PATH=../notes_database/data/notes.db
```

## 3. Initialize Database on Server Startup

In `notes_backend/src/app.js` or `server.js`:

```js
const { init } = require('../../notes_database/src/db');

(async () => {
  try {
    await init();
    console.log('Database initialized');
  } catch (e) {
    console.error('Failed to initialize DB', e);
    process.exit(1);
  }
})();
```

Then, in your services, import the `db` instance:

```js
const { db } = require('../../notes_database/src/db');

// Example: fetch notes for a user
function getNotesByUser(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
```

## 4. Production Considerations

- SQLite is great for local/dev and small single-instance deployments.
- For multi-instance or high write concurrency, consider Postgres/MySQL. The schema provided can be translated easily.

