'use strict';

const usersService = require('../services/users');

class UsersController {
  // PUBLIC_INTERFACE
  async register(req, res, next) {
    /** Register a new user */
    try {
      const { email, password, name } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
      }
      const user = await usersService.registerUser({ email, password, name });
      return res.status(201).json(user);
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async login(req, res, next) {
    /** Login a user and return JWT token */
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
      }
      const result = await usersService.loginUser({ email, password });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async profile(req, res, next) {
    /** Get current user profile */
    try {
      const user = await usersService.getProfile(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.status(200).json(user);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new UsersController();
