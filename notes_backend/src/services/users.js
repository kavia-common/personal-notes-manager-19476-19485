'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
async function registerUser({ email, password, name }) {
  /** Register a new user with hashed password */
  const existing = await runGet('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    const e = new Error('Email already in use');
    e.status = 409;
    throw e;
  }
  const password_hash = await bcrypt.hash(password, 10);
  const ts = nowIso();
  const result = await runExec(
    'INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [email, password_hash, name || null, ts, ts]
  );
  const user = await runGet('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?', [result.lastID]);
  return user;
}

// PUBLIC_INTERFACE
async function loginUser({ email, password }) {
  /** Validate user credentials and return JWT */
  const user = await runGet('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    const e = new Error('Invalid email or password');
    e.status = 401;
    throw e;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const e = new Error('Invalid email or password');
    e.status = 401;
    throw e;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const e = new Error('Server misconfiguration: JWT_SECRET not set');
    e.status = 500;
    throw e;
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn }
  );
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name }
  };
}

// PUBLIC_INTERFACE
async function getProfile(userId) {
  /** Return user profile by id */
  const user = await runGet('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?', [userId]);
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
};
