'use strict';

const { db } = require('../../../notes_database/src/db');

function runGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
  });
}

function runAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function runExec(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function nowIso() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

// PUBLIC_INTERFACE
async function listNotes(userId) {
  /** List notes for the user ordered by updated_at desc */
  const rows = await runAll(
    'SELECT id, user_id, title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY datetime(updated_at) DESC',
    [userId]
  );
  return rows;
}

// PUBLIC_INTERFACE
async function getNote(userId, id) {
  /** Get a single note by id for the user */
  const note = await runGet(
    'SELECT id, user_id, title, content, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return note;
}

// PUBLIC_INTERFACE
async function createNote(userId, { title, content }) {
  /** Create a new note for the user */
  const ts = nowIso();
  const result = await runExec(
    'INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [userId, title, content, ts, ts]
  );
  return getNote(userId, result.lastID);
}

// PUBLIC_INTERFACE
async function updateNote(userId, id, { title, content }) {
  /** Update an existing note */
  const existing = await getNote(userId, id);
  if (!existing) return null;
  const ts = nowIso();
  await runExec(
    'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    [title ?? existing.title, content ?? existing.content, ts, id, userId]
  );
  return getNote(userId, id);
}

// PUBLIC_INTERFACE
async function deleteNote(userId, id) {
  /** Delete a note; returns true if deleted */
  const result = await runExec(
    'DELETE FROM notes WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.changes > 0;
}

module.exports = {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
};
