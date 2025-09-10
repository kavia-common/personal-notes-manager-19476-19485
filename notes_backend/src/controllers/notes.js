'use strict';

const notesService = require('../services/notes');

class NotesController {
  // PUBLIC_INTERFACE
  async list(req, res, next) {
    /** List all notes for the authenticated user */
    try {
      const notes = await notesService.listNotes(req.user.id);
      return res.status(200).json(notes);
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async get(req, res, next) {
    /** Get a note by id */
    try {
      const id = Number(req.params.id);
      const note = await notesService.getNote(req.user.id, id);
      if (!note) return res.status(404).json({ message: 'Note not found' });
      return res.status(200).json(note);
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async create(req, res, next) {
    /** Create a note */
    try {
      const { title, content } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ message: 'title and content are required' });
      }
      const note = await notesService.createNote(req.user.id, { title, content });
      return res.status(201).json(note);
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async update(req, res, next) {
    /** Update a note by id */
    try {
      const id = Number(req.params.id);
      const { title, content } = req.body || {};
      const note = await notesService.updateNote(req.user.id, id, { title, content });
      if (!note) return res.status(404).json({ message: 'Note not found' });
      return res.status(200).json(note);
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async remove(req, res, next) {
    /** Delete a note by id */
    try {
      const id = Number(req.params.id);
      const ok = await notesService.deleteNote(req.user.id, id);
      if (!ok) return res.status(404).json({ message: 'Note not found' });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new NotesController();
