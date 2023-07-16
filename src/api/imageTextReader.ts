import express from 'express';
import multer from 'multer';
const { createWorker } = require('tesseract.js');
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    let extArray = file.mimetype.split('/');
    let extension = extArray[extArray.length - 1];
    cb(null, `${uuidv4()}.${extension}`);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.post('/', upload.single('file'), async (req: any, res) => {
  const worker = await createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  const rectangle = req.body.dimensions
    ? JSON.parse(req.body.dimensions)
    : null;
  // console.log(
  //   path.join(__dirname.slice(0, __dirname.indexOf('/src')), req.file.path)
  // );
  const {
    data: { text },
  } = await worker.recognize(
    path.join(__dirname.slice(0, __dirname.indexOf('/src')), req.file.path),
    rectangle ? { rectangle } : undefined
  );
  await worker.terminate();
  res.json({
    text,
  });
});

export default router;
