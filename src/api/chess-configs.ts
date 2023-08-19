import express from 'express';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { logger } from '../logger';
import { ChessConfigModel } from '../models/games/chess-config';
import { ChessSkinModel } from '../models/games/chess-skin';

const router = express.Router();

router.get('/', async (req: any, res) => {
  try {
    const userFromRequest = getUserFromRequest(req);

    let chessConfig = await ChessConfigModel.findOne({
      user: userFromRequest._id,
    });

    if (!chessConfig) {
      chessConfig = await ChessConfigModel.create({
        config: JSON.stringify({}),
        user: userFromRequest._id,
      });
    }

    res.status(200).json(chessConfig);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/:skinId', async (req: any, res) => {
  try {
    const { skinId } = req.params;

    const skin = await ChessSkinModel.findById(skinId);

    if (!skin) {
      return res.status(404).json({ message: 'Skin not found' });
    }

    const userFromRequest = getUserFromRequest(req);

    let chessConfig = await ChessConfigModel.findOne({
      user: userFromRequest._id,
    }).populate('chessSkin');

    if (!chessConfig) {
      chessConfig = await ChessConfigModel.create({
        config: skin.config,
        chessSkin: skin._id,
        user: userFromRequest._id,
      });
    } else {
      if (chessConfig.chessSkin?._id.toString() === skin._id.toString()) {
        chessConfig = await ChessConfigModel.findByIdAndUpdate(
          chessConfig._id,
          { $unset: { chessSkin: 1, config: 1 } }
        );
      } else {
        chessConfig = await ChessConfigModel.findByIdAndUpdate(
          chessConfig._id,
          {
            config: skin.config,
            chessSkin: skin._id,
          }
        );
      }
    }

    res.status(200).json(chessConfig);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
