import express from 'express';
import { logger } from '../../logger';
import { downloadInstagram } from '../../helpers/video';

const router = express.Router();

router.post('/download', async (req, res) => {
  try {
    const { link } = req.body;

    const data = await downloadInstagram(link);

    res.json(data);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
