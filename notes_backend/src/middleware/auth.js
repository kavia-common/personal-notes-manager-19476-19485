'use strict';

const jwt = require('jsonwebtoken');

/**
 * Extracts bearer token from Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getTokenFromHeader(req) {
  const auth = req.headers.authorization || '';
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

// PUBLIC_INTERFACE
function authRequired(req, res, next) {
  /** Middleware to validate JWT Bearer token and attach req.user */
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
    }
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = {
  authRequired,
};
