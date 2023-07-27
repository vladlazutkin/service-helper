import express from 'express';
import jwtAuthMiddleware from '../../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import { logger } from '../../logger';
import { BoardModel } from '../../models/board';
import { LabelModel } from '../../models/label';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const labels = await LabelModel.find({ user: user._id });
    return res.status(200).json(labels);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/:boardId', jwtAuthMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;
    const user = getUserFromRequest(req);

    const board = await BoardModel.findById(boardId);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const labels = await LabelModel.find({
      board: board._id,
    });
    return res.status(200).json(labels);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const { boardId, title, color } = req.body;
    const user = getUserFromRequest(req);

    const board = await BoardModel.findById(boardId).populate(['user']);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const label = await LabelModel.create({
      title,
      color,
      user: user._id,
      board: board._id,
    });
    return res.status(200).json(label);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.patch('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, color } = req.body;
    const user = getUserFromRequest(req);

    const label = await LabelModel.findById(id).populate('user');

    if (!label) {
      return res.status(404).json({ message: 'Label not found' });
    }
    if (label.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const toUpdate: Record<string, any> = {};

    if (title !== undefined) {
      toUpdate.title = title;
    }
    if (color !== undefined) {
      toUpdate.color = color;
    }

    const updated = await LabelModel.findByIdAndUpdate(id, toUpdate, {
      new: true,
    });
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

    const card = await LabelModel.findById(id).populate('user');

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await LabelModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
