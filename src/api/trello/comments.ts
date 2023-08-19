import express from 'express';
import jwtAuthMiddleware from '../../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import { CardModel } from '../../models/trello/card';
import { CommentModel } from '../../models/trello/comment';
import { logger } from '../../logger';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const comments = await CommentModel.find({ user: user._id });
    return res.status(200).json(comments);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/:cardId', jwtAuthMiddleware, async (req, res) => {
  try {
    const { cardId } = req.params;
    const user = getUserFromRequest(req);

    const card = await CardModel.findById(cardId).populate('user');

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const comments = await CommentModel.find({
      card: card._id,
    }).populate('user');
    return res.status(200).json(comments);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const { boardId, cardId, columnId, text } = req.body;
    const user = getUserFromRequest(req);

    const card = await CardModel.findById(cardId).populate(['user']);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const label = await CommentModel.create({
      text,
      user: user._id,
      card: card._id,
      board: boardId,
      column: columnId,
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
    const { text } = req.body;
    const user = getUserFromRequest(req);

    const comment = await CommentModel.findById(id).populate('user');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const toUpdate: Record<string, any> = {};

    if (text !== undefined) {
      toUpdate.text = text;
    }

    const updated = await CommentModel.findByIdAndUpdate(id, toUpdate, {
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

    const comment = await CommentModel.findById(id).populate('user');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await CommentModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
