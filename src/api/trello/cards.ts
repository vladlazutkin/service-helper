import express from 'express';
import jwtAuthMiddleware from '../../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import { logger } from '../../logger';
import { CardModel } from '../../models/trello/card';
import { BoardModel } from '../../models/trello/board';
import { ColumnModel } from '../../models/trello/column';
import { LabelModel } from '../../models/trello/label';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const cards = await CardModel.find({ user: user._id });
    return res.status(200).json(cards);
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

    const cards = await CardModel.find({
      user: user._id,
      board: board._id,
    }).populate([
      { path: 'column', model: 'Column' },
      { path: 'labels', model: 'Label' },
    ]);
    return res.status(200).json(cards);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const { boardId, title, columnId } = req.body;
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

    const column = await ColumnModel.findById(columnId).populate([
      'user',
      'cards',
    ]);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }
    if (column.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const card = await CardModel.create({
      title,
      position: 0,
      user: user._id,
      board: board._id,
      column: column._id,
    });
    return res.status(200).json(card);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.patch('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, position, coordinates, title, description, labels, to } =
      req.body;
    const user = getUserFromRequest(req);

    const card = await CardModel.findById(id).populate('user');

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const toUpdate: Record<string, any> = {};

    if (columnId !== undefined) {
      const column = await ColumnModel.findById(columnId).populate(['user']);

      if (!column) {
        return res.status(404).json({ message: 'Column not found' });
      }
      if (column.user._id.toString() !== user._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      toUpdate.column = column;
    }

    if (title !== undefined) {
      toUpdate.title = title;
    }
    if (description !== undefined) {
      toUpdate.description = description;
    }
    if (position !== undefined) {
      toUpdate.position = position;
    }
    if (coordinates !== undefined) {
      toUpdate.coordinates = coordinates;
    }
    if (labels !== undefined) {
      toUpdate.labels = await Promise.all(
        labels.map((data: { _id: string }) => LabelModel.findById(data._id))
      );
    }
    if (to !== undefined) {
      toUpdate.to = to;
    }

    const updated = await CardModel.findByIdAndUpdate(id, toUpdate, {
      new: true,
    }).populate('labels');
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

    const card = await CardModel.findById(id).populate('user');

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await CardModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
