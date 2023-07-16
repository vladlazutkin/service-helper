import express from 'express';
import auth from './auth';
import spotify from './spotify';
import imageTextReader from './imageTextReader';
import videoTextReader from './videoTextReader';
import authenticateJWT from '../middlewares/jwt.auth.middleware';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/auth', auth);
router.use('/spotify', spotify);
router.use('/read-text-from-image', authenticateJWT, imageTextReader);
router.use('/read-text-from-video', authenticateJWT, videoTextReader);

export default router;
