'use strict';

/**
 * Simple migration runner to initialize the database schema.
 * Usage:
 *   node personal-notes-manager-19476-19485/notes_database/src/migrate.js
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

const { init, DB_PATH } = require('./db');

(async () => {
  try {
    await init();
    console.log(`Database initialized at: ${DB_PATH}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
