import fs from 'fs';
import express from 'express';
import axios from 'axios';
import { createWorker } from 'tesseract.js';
import multerUpload from '../middlewares/multer.middleware';
import { prepareDimensions } from '../helpers/video';
import { logger } from '../logger';

const router = express.Router();

router.get('/search', async (req, res) => {
  const { data } = await axios.get(
    `https://unsplash.com/napi/search/photos?query=${new URLSearchParams(
      req.query as Record<string, string>
    ).toString()}`
  );

  return res.status(200).json(data);
});

router.post(
  '/recognize',
  multerUpload.single('file'),
  async (req: any, res) => {
    try {
      const worker = await createWorker();
      await worker.loadLanguage('eng+ru');
      await worker.initialize('eng+ru');

      const { path } = req.file;

      const rectangle = JSON.parse(req.body.dimensions);
      const {
        data: { text },
      } = await worker.recognize(path, {
        rectangle: prepareDimensions(rectangle),
      });
      await worker.terminate();

      fs.unlinkSync(path);

      res.json({
        text,
      });
    } catch (e: any) {
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  }
);

export default router;
