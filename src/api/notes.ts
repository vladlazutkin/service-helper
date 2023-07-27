import express from 'express';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { NoteModel } from '../models/note';
import { logger } from '../logger';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const notes = await NoteModel.find({ user: user._id });
    return res.status(200).json(notes);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const user = getUserFromRequest(req);

    const note = await NoteModel.create({ text, user: user._id });
    return res.status(200).json(note);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.patch('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = getUserFromRequest(req);

    const note = await NoteModel.findById(id).populate('user');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (note.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const updated = await NoteModel.findByIdAndUpdate(
      id,
      { text },
      { new: true }
    );
    return res.status(200).json(updated);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.delete('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserFromRequest(req);

    const note = await NoteModel.findById(id).populate('user');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    if (note.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await NoteModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
