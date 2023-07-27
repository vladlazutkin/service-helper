import express from 'express';
import { logger } from '../../logger';
import axios from 'axios';

const router = express.Router();

router.post('/download', async (req, res) => {
  try {
    const { link } = req.body;
    const { data } = await axios.get(
      'https://api.tiklydown.eu.org/api/download',
      {
        params: { url: link },
      }
    );

    res.json(data.video);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
