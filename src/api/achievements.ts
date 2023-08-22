import express from 'express';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { logger } from '../logger';
import { AchievementModel } from '../models/achievement';

const router = express.Router();

router.get('/', async (req, res) => {
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
