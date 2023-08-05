import express from 'express';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { logger } from '../logger';
import { ChessGameModel } from '../models/chess-game';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const games = await ChessGameModel.find({ playerWhite: user._id });
    return res.status(200).json(games);
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

    const game = await ChessGameModel.findById(id).populate('playerWhite');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    if (game.playerWhite._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await ChessGameModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
