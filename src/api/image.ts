import fs from 'fs';
import express from 'express';
import { createWorker } from 'tesseract.js';
import multerUpload from '../middlewares/multer.middleware';

const router = express.Router();

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
      } = await worker.recognize(path, { rectangle });
      await worker.terminate();

      fs.unlinkSync(path);

      res.json({
        text,
      });
    } catch (e: any) {
      console.log(e);
      res.status(500).json({ error: e.message || e.msg || 'Error' });
    }
  }
);

export default router;
