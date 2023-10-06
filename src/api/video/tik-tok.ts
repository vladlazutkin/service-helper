import express from 'express';
import { logger } from '../../logger';
import { getTikTokVideo } from '../../external-api/tiklydown';

const router = express.Router();

router.post('/download', async (req, res) => {
  try {
    const { link } = req.body;
    const { data } = await getTikTokVideo(link);

    res.json(data);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
