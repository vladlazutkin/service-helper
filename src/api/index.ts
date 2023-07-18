import express from 'express';
import auth from './auth';
import notes from './notes';
import spotify from './spotify';
import videos from './video';
import image from './image';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';

const router = express.Router();

router.use('/auth', auth);
router.use('/spotify', spotify);
router.use('/note', jwtAuthMiddleware, notes);
router.use('/video', jwtAuthMiddleware, videos);
router.use('/image', jwtAuthMiddleware, image);

export default router;
