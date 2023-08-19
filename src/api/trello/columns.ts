import express from 'express';
import jwtAuthMiddleware from '../../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import { logger } from '../../logger';
import { ColumnModel } from '../../models/trello/column';
import { BoardModel } from '../../models/trello/board';
import { CardModel } from '../../models/trello/card';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const columns = await ColumnModel.find({ user: user._id });
    return res.status(200).json(columns);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserFromRequest(req);

    const column = await ColumnModel.findById(id).populate('user');

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }
    if (column.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { user: _, ...rest } = column.toObject();

    const cards = await CardModel.find({ column: column._id }).populate([
      'column',
      'labels',
    ]);

    res.status(200).json({ ...rest, cards });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const { title, boardId } = req.body;
    const user = getUserFromRequest(req);

    const board = await BoardModel.findById(boardId).populate([
      'user',
      'columns',
    ]);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const column = await ColumnModel.create({
      title,
      user: user._id,
      board: board._id,
      position: 0,
    });
    return res.status(200).json(column);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.patch('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;
    const user = getUserFromRequest(req);

    const column = await ColumnModel.findById(id).populate('user');

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }
    if (column.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const updated = await ColumnModel.findByIdAndUpdate(
      id,
      {
        position,
      },
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

    const column = await ColumnModel.findById(id).populate('user');

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }
    if (column.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await CardModel.deleteMany({ column: column._id });

    await ColumnModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
