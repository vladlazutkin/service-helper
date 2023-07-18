import express from 'express';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { NoteModel } from '../models/note';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const notes = await NoteModel.find({ user: user._id });
    return res.status(200).json(notes);
  } catch (e: any) {
    console.log(e);
    res.status(500).json({ error: e.message || e.msg || 'Error' });
  }
});

router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const user = getUserFromRequest(req);

    const note = await NoteModel.create({ text, user: user._id });
    return res.status(200).json(note);
  } catch (e: any) {
    console.log(e);
    res.status(500).json({ error: e.message || e.msg || 'Error' });
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
    const updated = await NoteModel.findByIdAndUpdate(id, { text });
    return res.status(200).json(updated);
  } catch (e: any) {
    console.log(e);
    res.status(500).json({ error: e.message || e.msg || 'Error' });
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
    console.log(e);
    res.status(500).json({ error: e.message || e.msg || 'Error' });
  }
});

export default router;
