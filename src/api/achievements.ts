import express from 'express';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { logger } from '../logger';
import { AchievementModel } from '../models/achievement';

const router = express.Router();

router.get('/', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const achievements = await AchievementModel.find({ user: user._id });
    return res.status(200).json(achievements);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
