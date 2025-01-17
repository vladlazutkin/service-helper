import express from 'express';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import { logger } from '../../logger';
import { BoardModel } from '../../models/trello/board';
import { ColumnModel } from '../../models/trello/column';
import { CardModel } from '../../models/trello/card';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const boards = await BoardModel.find({ user: user._id });
    return res.status(200).json(boards);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserFromRequest(req);

    const board = await BoardModel.findById(id).populate(['user', 'columns']);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const columns = await ColumnModel.find({ board: board._id });
    const { user: _, ...rest } = board.toObject();

    return res.status(200).json({ ...rest, columns });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const user = getUserFromRequest(req);

    const board = await BoardModel.create({ title, user: user._id });
    return res.status(200).json(board);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, gridStep } = req.body;
    const user = getUserFromRequest(req);

    const board = await BoardModel.findById(id).populate('user');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const toUpdate: Record<string, any> = {};

    if (title) {
      toUpdate.title = title;
    }
    if (gridStep) {
      toUpdate.gridStep = gridStep;
    }

    const updated = await BoardModel.findByIdAndUpdate(id, toUpdate, {
      new: true,
    });
    return res.status(200).json(updated);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserFromRequest(req);

    const board = await BoardModel.findById(id).populate('user');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await CardModel.deleteMany({ board: board._id });
    await ColumnModel.deleteMany({ board: board._id });

    await BoardModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
